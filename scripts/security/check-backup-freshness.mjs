import { pathToFileURL } from 'node:url';
import { writeFileSync } from 'node:fs';

export const PROJECT = 'holy-shape-01357429';
export const BRANCH = 'br-proud-sunset-ap0ofil2';
export const RETENTION = 2592000;
export const WINDOW_MS = 30 * 60 * 1000;

export function freshness(previous, activated, now = Date.now()) {
  if (previous === null) return activated ? 'MISSING' : 'BOOTSTRAP';
  const time = Date.parse(previous);
  if (!Number.isFinite(time) || time > now) return 'UNKNOWN';
  return now - time <= WINDOW_MS ? 'FRESH' : 'STALE';
}

export async function checkProvider({ key, fetchImpl = fetch, now = () => new Date(), projectId = PROJECT, branchId = BRANCH } = {}) {
  const evidence = {
    status: 'UNHEALTHY', observed_at: null, project_match: false, branch_match: false,
    branch_state: 'UNKNOWN', branch_protected: null, history_retention_seconds: null,
    retention_compliant: false, evidence_freshness_status: 'NOT_EVALUATED',
    failure_reason: null,
  };
  const fail = reason => ({ ...evidence, failure_reason: reason });
  if (projectId !== PROJECT || branchId !== BRANCH) return fail('TARGET_CONFIGURATION_MISMATCH');
  if (!key) return fail('AUTH_FAILURE');
  async function get(path) {
    let response;
    try {
      response = await fetchImpl('https://console.neon.tech/api/v2' + path, {
        method: 'GET', headers: { Authorization: 'Bearer ' + key, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000), redirect: 'error',
      });
    } catch { throw new Error('API_UNAVAILABLE'); }
    if (response.status === 401 || response.status === 403) throw new Error('AUTH_FAILURE');
    if (!response.ok) throw new Error('API_UNAVAILABLE');
    try { return await response.json(); } catch { throw new Error('MALFORMED'); }
  }
  try {
    const { project } = await get('/projects/' + PROJECT);
    if (!project || typeof project.id !== 'string' ||
        !Number.isSafeInteger(project.history_retention_seconds) || project.history_retention_seconds < 0) return fail('MALFORMED_PROJECT');
    evidence.project_match = project.id === PROJECT;
    evidence.history_retention_seconds = project.history_retention_seconds;
    evidence.retention_compliant = project.history_retention_seconds >= RETENTION;
    const { branch } = await get('/projects/' + PROJECT + '/branches/' + BRANCH);
    if (!branch || typeof branch.id !== 'string' || typeof branch.project_id !== 'string' ||
        typeof branch.current_state !== 'string' || typeof branch.protected !== 'boolean') return fail('MALFORMED_BRANCH');
    evidence.branch_match = branch.id === BRANCH && branch.project_id === PROJECT;
    // Never echo arbitrary provider strings (including a credential reflected in an error).
    evidence.branch_state = branch.current_state === 'ready' ? 'ready' : 'NOT_READY';
    evidence.branch_protected = branch.protected;
    if (!evidence.project_match) return fail('PROJECT_MISMATCH');
    if (!evidence.branch_match) return fail('BRANCH_MISMATCH');
    if (branch.current_state !== 'ready') return fail('BRANCH_NOT_READY');
    if (!branch.protected) return fail('BRANCH_UNPROTECTED');
    if (!evidence.retention_compliant) return fail('RETENTION_NONCOMPLIANT');
    evidence.observed_at = now().toISOString();
    return { ...evidence, status: 'HEALTHY' };
  } catch (error) {
    return fail(['AUTH_FAILURE', 'API_UNAVAILABLE', 'MALFORMED'].includes(error.message) ? error.message : 'MALFORMED');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const evidence = await checkProvider({
    key: process.env.NEON_API_KEY,
    projectId: process.env.NEON_PROJECT_ID,
    branchId: process.env.NEON_BRANCH_ID,
  });
  const output = JSON.stringify(evidence);
  if (process.env.M4_EVIDENCE_FILE) writeFileSync(process.env.M4_EVIDENCE_FILE, output + '\n');
  console.log(output);
  process.exitCode = evidence.status === 'HEALTHY' ? 0 : 1;
}
