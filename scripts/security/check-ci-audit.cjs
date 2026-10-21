const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const policy = require('./ci-audit-policy.json');

// Resolve dependencies against the lock, including hoisted/nested packages.
function developmentExceptionNodes(packages) {
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

function evaluateAudit(report, status, lock) {
  if (![0, 1].includes(status) || !report || report.error || report.auditReportVersion !== 2 ||
      !report.vulnerabilities || Array.isArray(report.vulnerabilities) ||
      typeof report.vulnerabilities !== 'object' || !report.metadata?.vulnerabilities ||
      !lock?.packages) throw new Error('Audit execution/report unavailable or unsupported');
  const counts = Object.fromEntries(Object.keys(policy.maximumFindings).map(key => [key, 0]));
  const allowed = developmentExceptionNodes(lock.packages);
  let rejected = 0;
  for (const [name, finding] of Object.entries(report.vulnerabilities)) {
    if (!finding || finding.name !== name || !Object.hasOwn(counts, finding.severity) ||
        !Array.isArray(finding.nodes) || !finding.nodes.length) throw new Error('Invalid audit finding');
    counts[finding.severity]++;
    if (!finding.nodes.every(node => typeof node === 'string' && allowed.has(node))) rejected++;
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  for (const [severity, count] of Object.entries(counts)) {
    if (report.metadata.vulnerabilities[severity] !== count) throw new Error('Audit count mismatch');
    if (count > policy.maximumFindings[severity]) rejected++;
  }
  if (report.metadata.vulnerabilities.total !== total || status !== (total ? 1 : 0))
    throw new Error('Audit status/count mismatch');
  return {pass: rejected === 0, total, excepted: rejected === 0 ? total : 0, rejected, counts};
}

if (require.main === module) {
  try {
    const root = path.resolve(__dirname, '../..');
    const audit = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['audit', '--json'], {
      cwd: root, encoding: 'utf8', shell: process.platform === 'win32', maxBuffer: 16 * 1024 * 1024,
    });
    if (audit.error || audit.signal) throw new Error('Audit process failed');
    const result = evaluateAudit(JSON.parse(audit.stdout), audit.status,
      JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8')));
    console.log(JSON.stringify({policy: 'Phase5I-development-only', ...result}));
    process.exitCode = result.pass ? 0 : 1;
  } catch {
    // Never echo raw child output, environment values or registry errors.
    console.error('CI dependency audit failed closed: invalid, unavailable or inconsistent evidence');
    process.exitCode = 1;
  }
}
module.exports = {evaluateAudit};
