import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { freshness } from './check-backup-freshness.mjs';

export const TITLE = '[ISO-C2-M4] Production backup/PITR monitoring alert';
export const MARKER = '<!-- rentipid-iso-c2-m4-incident-v1 -->';
export const WORKFLOW = 'backup-freshness-monitor.yml';
export const PROVIDER_STEP = 'Collect provider evidence';

export function alertDecision(status, issues) {
  const candidates = issues.filter(i => i.state === 'open' && !i.pull_request &&
    (i.title === TITLE || i.body?.includes(MARKER))).sort((a, b) => a.number - b.number);
  return { action: status === 'HEALTHY' ? (candidates.length ? 'CLOSE' : 'NOOP') : (candidates.length ? 'UPDATE' : 'CREATE'),
    issue: candidates[0]?.number ?? null, duplicates: candidates.slice(1).map(i => i.number) };
}

export function githubClient(token, fetchImpl = fetch) {
  return async (path, method = 'GET', body) => {
    if (!token) throw new Error('GITHUB_AUTH_FAILURE');
    const response = await fetchImpl('https://api.github.com' + path, {
      method, headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(20000), redirect: 'error',
    });
    if (!response.ok) throw new Error('GITHUB_API_FAILURE');
    return response.status === 204 ? null : response.json();
  };
}

// Paginate to exhaustion, or fail closed. Never equate a truncated history with bootstrap.
export async function pages(api, path, field) {
  const result = [];
  for (let page = 1; page <= 10; page++) {
    const response = await api(path + (path.includes('?') ? '&' : '?') + 'per_page=100&page=' + page);
    const values = field ? response[field] : response;
    if (!Array.isArray(values)) throw new Error('MALFORMED_GITHUB_RESPONSE');
    result.push(...values);
    if (values.length < 100) return result;
  }
  throw new Error('GITHUB_HISTORY_LIMIT');
}

export async function scheduledFreshness({ api, repo, runId, attempt = 1, now = Date.now() }) {
  const base = '/repos/' + repo;
  const current = await api(base + '/actions/runs/' + runId);
  if (!Number.isSafeInteger(current.run_number) || current.head_branch !== 'main' ||
      !['schedule', 'workflow_dispatch'].includes(current.event) || !current.workflow_id) throw new Error('INVALID_RUN_CONTEXT');
  // Inspect recent pages first; healthy long-lived monitors must not exhaust history.
  let priorCount = 0;
  let newest = null;
  for (let page = 1; page <= 10; page++) {
    const response = await api(base + '/actions/workflows/' + WORKFLOW + '/runs?event=schedule&branch=main&per_page=100&page=' + page);
    const runs = response?.workflow_runs;
    if (!Array.isArray(runs)) throw new Error('MALFORMED_RUN_HISTORY');
    const prior = runs.filter(r => String(r.id) !== String(runId) && r.run_number < current.run_number);
    if (runs.some(r => !Number.isSafeInteger(r.run_number) || !r.id)) throw new Error('MALFORMED_RUN_HISTORY');
    priorCount += prior.length;
    for (const run of prior.sort((a,b) => b.run_number - a.run_number)) {
      if (run.event !== 'schedule' || run.head_branch !== 'main' || run.workflow_id !== current.workflow_id) throw new Error('INVALID_HISTORY_CONTEXT');
      const jobs = await pages(api, base + '/actions/runs/' + run.id + '/jobs?filter=all', 'jobs');
      for (const job of jobs) {
        if (!Array.isArray(job.steps)) throw new Error('MALFORMED_JOB_HISTORY');
        for (const step of job.steps) {
          if (step.name === PROVIDER_STEP && step.conclusion === 'success') {
            const t = Date.parse(step.started_at);
            if (!Number.isFinite(t) || t > now) throw new Error('INVALID_EVIDENCE_TIME');
            if (newest === null || t > Date.parse(newest)) newest = step.started_at;
          }
        }
      }
      // A fresh point suffices; stale/failed history still requires inspecting older runs.
      if (newest && freshness(newest, true, now) === 'FRESH') return 'FRESH';
    }
    if (runs.length < 100) {
      // Expired/deleted history must not fabricate a second activation.
      if (priorCount === 0) return current.event === 'schedule' && current.run_number === 1 && attempt === 1 ? 'BOOTSTRAP' : 'MISSING';
      return freshness(newest, true, now);
    }
  }
  throw new Error('GITHUB_HISTORY_LIMIT');
}

export async function reconcileAlert({ api, repo, evidence }) {
  const base = '/repos/' + repo;
  const issues = await pages(api, base + '/issues?state=open');
  const decision = alertDecision(evidence.status, issues);
  const body = MARKER + '\nOperational owner: Cloud Operations Lead\n\n' +
    'Provider continuity and monitoring evidence only; no latest-recoverable-point timestamp.\n\n' +
    '\x60\x60\x60json\n' + JSON.stringify(evidence, null, 2) + '\n\x60\x60\x60';
  if (decision.action === 'CREATE') {
    const available = await pages(api, base + '/labels');
    const labels = ['iso-backup-monitoring', 'operational-risk'].filter(l => available.some(a => a.name === l));
    await api(base + '/issues', 'POST', { title: TITLE, body, labels });
  } else if (decision.action === 'UPDATE' || decision.action === 'CLOSE') {
    await api(base + '/issues/' + decision.issue + '/comments', 'POST', { body });
    if (decision.action === 'CLOSE') {
      await api(base + '/issues/' + decision.issue, 'PATCH', { state: 'closed' });
    }
    // Converge historical duplicates onto the oldest persistent incident deterministically.
    for (const number of decision.duplicates) {
      await api(base + '/issues/' + number + '/comments', 'POST', {
        body: MARKER + '\nConsolidated into #' + decision.issue + '.\n' + (decision.action === 'CLOSE' ? body : ''),
      });
      await api(base + '/issues/' + number, 'PATCH', { state: 'closed' });
    }
  }
  return decision;
}

export async function runActions(env = process.env) {
  const api = githubClient(env.GITHUB_TOKEN);
  // Fixed repository, main only; this workflow does not act on pull requests or arbitrary dispatch refs.
  if (env.GITHUB_REPOSITORY !== 'jburns2372-sys/RENTipid' || env.GITHUB_REF !== 'refs/heads/main') throw new Error('INVALID_RUN_CONTEXT');
  let evidence;
  try { evidence = JSON.parse(readFileSync(env.M4_EVIDENCE_FILE, 'utf8')); } catch { evidence = null; }
  // Project only the local monitor's allowlisted output; never publish raw errors or environment values.
  const valid = evidence?.status === 'HEALTHY' && evidence.project_match === true &&
    evidence.branch_match === true && evidence.branch_state === 'ready' && evidence.branch_protected === true &&
    Number.isSafeInteger(evidence.history_retention_seconds) && evidence.history_retention_seconds >= 2592000 &&
    evidence.retention_compliant === true && Number.isFinite(Date.parse(evidence.observed_at)) &&
    Date.parse(evidence.observed_at) <= Date.now() && Date.now() - Date.parse(evidence.observed_at) <= 1800000;
  const result = {
    status: valid ? 'HEALTHY' : 'UNHEALTHY', observed_at: valid ? new Date(evidence.observed_at).toISOString() : null,
    project_match: evidence?.project_match === true, branch_match: evidence?.branch_match === true,
    branch_state: evidence?.branch_state === 'ready' ? 'ready' : 'UNKNOWN',
    branch_protected: evidence?.branch_protected === true,
    history_retention_seconds: Number.isSafeInteger(evidence?.history_retention_seconds) ? evidence.history_retention_seconds : null,
    retention_compliant: evidence?.retention_compliant === true,
    evidence_freshness_status: 'UNKNOWN', failure_reason: valid ? null : 'PROVIDER_EVIDENCE_INVALID',
  };
  try {
    result.evidence_freshness_status = await scheduledFreshness({
      api, repo: env.GITHUB_REPOSITORY, runId: env.GITHUB_RUN_ID, attempt: Number(env.GITHUB_RUN_ATTEMPT),
    });
  } catch { result.evidence_freshness_status = 'UNKNOWN'; }
  if (!['FRESH', 'BOOTSTRAP'].includes(result.evidence_freshness_status)) {
    result.status = 'UNHEALTHY';
    result.failure_reason = result.failure_reason ?? 'MONITORING_EVIDENCE_' + result.evidence_freshness_status;
  }
  writeFileSync(env.M4_EVIDENCE_FILE, JSON.stringify(result) + '\n');
  console.log(JSON.stringify(result));
  await reconcileAlert({ api, repo: env.GITHUB_REPOSITORY, evidence: result });
  return result.status === 'HEALTHY' ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.exitCode = await runActions(); }
  catch { console.error(JSON.stringify({ status: 'UNHEALTHY', failure_reason: 'GITHUB_ALERT_OR_MONITOR_FAILURE' })); process.exitCode = 1; }
}
