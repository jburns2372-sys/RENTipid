const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const defaultPolicy = require('./ci-audit-policy.json');

// Resolve dependencies against the lock, including hoisted/nested packages.
function developmentExceptionNodes(packages, policy = defaultPolicy) {
  const allowed = new Set();
  const queue = Object.keys(packages).filter(key =>
    policy.developmentFamilies.some(name => key === `node_modules/${name}` || key.endsWith(`/node_modules/${name}`)));
  while (queue.length) {
    const key = queue.pop();
    const pkg = packages[key];
    if (allowed.has(key) || !pkg || pkg.dev !== true) continue;
    allowed.add(key);
    const dependencies = {...pkg.dependencies, ...pkg.optionalDependencies, ...pkg.peerDependencies};
    for (const name of Object.keys(dependencies)) {
      let location = key;
      while (true) {
        const candidate = `${location ? `${location}/` : ''}node_modules/${name}`;
        if (packages[candidate]) { queue.push(candidate); break; }
        if (!location) break;
        const parent = location.lastIndexOf('/node_modules/');
        location = parent >= 0 ? location.slice(0, parent) : '';
      }
    }
  }
  return allowed;
}

function validateDispositionMetadata(disp) {
  if (!disp || typeof disp !== 'object') return false;
  if (!disp.dispositionId || typeof disp.dispositionId !== 'string') return false;
  if (!disp.advisoryId || typeof disp.advisoryId !== 'string') return false;
  if (!disp.packageName || typeof disp.packageName !== 'string') return false;
  if (disp.classification !== 'DEV_TOOLING_ONLY') return false;
  if (disp.productionRuntime !== false) return false;
  if (disp.untrustedInputReachable !== false) return false;
  if (!disp.approvalReference || typeof disp.approvalReference !== 'string' || !disp.approvalReference.trim()) return false;
  if (!disp.expiresOn || typeof disp.expiresOn !== 'string') return false;
  const expiryTime = new Date(disp.expiresOn).getTime();
  if (Number.isNaN(expiryTime) || expiryTime <= Date.now()) return false;
  return true;
}

function evaluateAudit(report, status, lock, policy = defaultPolicy) {
  if (![0, 1].includes(status) || !report || report.error || report.auditReportVersion !== 2 ||
      !report.vulnerabilities || Array.isArray(report.vulnerabilities) ||
      typeof report.vulnerabilities !== 'object' || !report.metadata?.vulnerabilities ||
      !lock?.packages) throw new Error('Audit execution/report unavailable or unsupported');

  const rawCounts = Object.fromEntries(Object.keys(policy.maximumFindings).map(key => [key, 0]));
  const effectiveCounts = Object.fromEntries(Object.keys(policy.maximumFindings).map(key => [key, 0]));
  const allowed = developmentExceptionNodes(lock.packages, policy);

  // Index active, strictly validated dispositions
  const activeDispositionsByPkg = new Map();
  if (Array.isArray(policy.authorizedDispositions)) {
    for (const disp of policy.authorizedDispositions) {
      if (validateDispositionMetadata(disp)) {
        if (!activeDispositionsByPkg.has(disp.packageName)) {
          activeDispositionsByPkg.set(disp.packageName, []);
        }
        activeDispositionsByPkg.get(disp.packageName).push(disp);
      }
    }
  }

  // Pre-identify packages whose vulnerabilities are dispositioned
  const dispositionedRoots = new Set();
  for (const [name, finding] of Object.entries(report.vulnerabilities)) {
    if (!finding || finding.name !== name || !Array.isArray(finding.nodes)) continue;
    const disps = activeDispositionsByPkg.get(name);
    if (!disps || !disps.length) continue;

    // Check if every node is development-only
    const allDev = finding.nodes.every(node => {
      const pkg = lock.packages[node];
      return pkg && pkg.dev === true;
    });
    if (!allDev) continue;

    // Check if all advisory sources match authorized advisoryId
    if (Array.isArray(finding.via)) {
      const advisorySources = finding.via.filter(v => typeof v === 'object' && v !== null);
      if (advisorySources.length > 0) {
        const allMatch = advisorySources.every(adv =>
          disps.some(d => adv.url?.includes(d.advisoryId) || adv.title?.includes(d.advisoryId))
        );
        if (allMatch) {
          dispositionedRoots.add(name);
        }
      }
    }
  }

  // Iteratively identify propagated findings that arise solely from dispositioned roots
  const dispositionedPropagated = new Set();
  let changed = true;
  while (changed) {
    changed = false;
    for (const [name, finding] of Object.entries(report.vulnerabilities)) {
      if (dispositionedRoots.has(name) || dispositionedPropagated.has(name)) continue;
      if (!finding || !Array.isArray(finding.via) || !Array.isArray(finding.nodes)) continue;

      const allDev = finding.nodes.every(node => {
        const pkg = lock.packages[node];
        return pkg && pkg.dev === true;
      });
      if (!allDev) continue;

      // Must have only string references in via that are already dispositioned
      const hasDirectAdvisory = finding.via.some(v => typeof v === 'object' && v !== null);
      if (hasDirectAdvisory) continue;

      const allViaDispositioned = finding.via.every(v =>
        typeof v === 'string' && (dispositionedRoots.has(v) || dispositionedPropagated.has(v))
      );
      if (allViaDispositioned && finding.via.length > 0) {
        dispositionedPropagated.add(name);
        changed = true;
      }
    }
  }

  let rejected = 0;
  const dispositionedFindings = [];

  let allowedCount = 0;
  for (const [name, finding] of Object.entries(report.vulnerabilities)) {
    if (!finding || finding.name !== name || !Object.hasOwn(rawCounts, finding.severity) ||
        !Array.isArray(finding.nodes) || !finding.nodes.length) throw new Error('Invalid audit finding');

    rawCounts[finding.severity]++;

    const isDispositioned = dispositionedRoots.has(name) || dispositionedPropagated.has(name);

    if (isDispositioned) {
      dispositionedFindings.push({ name, severity: finding.severity });
      // Dispositioned: excluded from effective counts and rejection after validation
    } else {
      effectiveCounts[finding.severity]++;
      // Non-dispositioned findings must satisfy development exception rules
      const allDevAllowed = finding.nodes.every(node => typeof node === 'string' && allowed.has(node));
      if (!allDevAllowed) {
        rejected++;
      } else {
        allowedCount++;
      }
    }
  }

  const rawTotal = Object.values(rawCounts).reduce((a, b) => a + b, 0);

  // Validate that raw report counts match exactly (no tampering with raw evidence)
  for (const [severity, count] of Object.entries(rawCounts)) {
    if (report.metadata.vulnerabilities[severity] !== count) throw new Error('Audit count mismatch');
  }
  if (report.metadata.vulnerabilities.total !== rawTotal || status !== (rawTotal ? 1 : 0)) {
    throw new Error('Audit status/count mismatch');
  }

  // Check effective counts against unchanged maximumFindings policy caps
  for (const [severity, effectiveCount] of Object.entries(effectiveCounts)) {
    if (effectiveCount > policy.maximumFindings[severity]) {
      rejected++;
    }
  }

  const pass = rejected === 0;
  const excepted = dispositionedFindings.length + allowedCount;

  if (rawTotal === 0) {
    const res = {
      pass,
      total: 0,
      excepted: 0,
      rejected: 0,
      counts: rawCounts,
    };
    Object.defineProperties(res, {
      rawTotal: { value: 0, enumerable: false },
      rawCounts: { value: rawCounts, enumerable: false },
      effectiveCounts: { value: effectiveCounts, enumerable: false },
      dispositionedCount: { value: 0, enumerable: false },
      dispositionedFindings: { value: [], enumerable: false },
      policy: { value: 'Phase5I-development-only-with-governed-dispositions', enumerable: false },
    });
    return res;
  }

  return {
    pass,
    total: rawTotal,
    excepted,
    rejected,
    counts: rawCounts,
    rawTotal,
    rawCounts,
    effectiveCounts,
    dispositionedCount: dispositionedFindings.length,
    dispositionedFindings,
    policy: 'Phase5I-development-only-with-governed-dispositions',
  };
}

function runAuditProcess(root) {
  return spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['audit', '--json'], {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    maxBuffer: 16 * 1024 * 1024,
    env: process.env,
  });
}

function parseAuditOutput(rawStdout) {
  if (!rawStdout || typeof rawStdout !== 'string') {
    throw new Error('Audit process produced empty stdout');
  }
  const trimmed = rawStdout.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // fallback to brace slice
    }
  }
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
  }
  throw new Error('Audit stdout does not contain valid JSON');
}

if (require.main === module) {
  const root = path.resolve(__dirname, '../..');
  let audit = runAuditProcess(root);

  const hasTransientError = () => {
    if (audit.error && ['ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND'].includes(audit.error.code)) return true;
    if (audit.stdout) {
      try {
        const parsed = JSON.parse(audit.stdout.trim());
        if (parsed.error && ['ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND', 'E503', 'E504'].includes(parsed.error.code)) {
          return true;
        }
      } catch {}
    }
    return false;
  };

  if (process.env.CI && !process.env.CONTROLLED_AUDIT_STATUS && hasTransientError()) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 3000);
    audit = runAuditProcess(root);
  }

  try {
    if (audit.error) {
      throw new Error(`Audit process spawn error: ${audit.error.message || audit.error.code}`);
    }
    if (audit.signal) {
      throw new Error(`Audit process terminated by signal: ${audit.signal}`);
    }

    const report = parseAuditOutput(audit.stdout);
    if (report && report.error) {
      const code = report.error.code || 'UNKNOWN';
      const summary = report.error.summary || report.error.detail || 'Registry error';
      throw new Error(`Audit registry error [${code}]: ${summary}`);
    }

    const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
    const result = evaluateAudit(report, audit.status, lock);
    console.log(JSON.stringify(result));
    process.exitCode = result.pass ? 0 : 1;
  } catch (err) {
    const reason = err && err.message ? String(err.message).replace(/[\r\n]+/g, ' ') : 'unknown failure';
    console.error(`CI dependency audit failed closed: invalid, unavailable or inconsistent evidence (${reason})`);
    process.exitCode = 1;
  }
}

module.exports = { evaluateAudit, developmentExceptionNodes, validateDispositionMetadata };
