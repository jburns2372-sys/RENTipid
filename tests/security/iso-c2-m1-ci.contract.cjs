const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const yaml = require('js-yaml');
const {evaluateAudit} = require('../../scripts/security/check-ci-audit.cjs');
const root = path.resolve(__dirname, '../..');
const pkg = require('../../package.json');
const policy = require('../../scripts/security/ci-audit-policy.json');
const workflows = ['security-supply-chain.yml', 'glcc-ci.yml'].map(name =>
  yaml.load(fs.readFileSync(path.join(root, '.github/workflows', name), 'utf8')));

for (const workflow of workflows) {
  test(`${workflow.name}: valid workflow, supported runtime and mandatory steps`, () => {
    assert.ok(workflow.on.push && workflow.on.pull_request);
    for (const job of Object.values(workflow.jobs)) {
      assert.equal(job.permissions.contents, 'read');
      assert.ok(!job['continue-on-error']);
      const setup = job.steps.find(step => step.uses?.startsWith('actions/setup-node@'));
      assert.equal(setup.with['node-version-file'], 'package.json');
      assert.equal(setup.with['node-version'], undefined);
      for (const step of job.steps) {
        assert.ok(!step['continue-on-error']);
        if (step.run) assert.doesNotMatch(step.run, /\|\|\s*true|passWithNoTests|--forceExit/);
      }
    }
    assert.equal(pkg.engines.node, '24.x');
    assert.equal(Number(process.versions.node.split('.')[0]), 24, 'Execute this contract with declared Node 24');
  });
}
const securitySteps = Object.values(workflows[0].jobs)[0].steps;
test('required security command retains the database guard and fails on empty tests', () => {
  const focused = securitySteps.find(step => step.name === 'Focused Tests');
  assert.equal(focused.run, 'npm run test:soc:integration');
  assert.match(pkg.scripts['test:soc:integration'], /^npm run test:db:guard && /);
  assert.doesNotMatch(pkg.scripts['test:soc:integration'], /passWithNoTests|\|\|/);
  assert.equal(securitySteps.find(step => step.name === 'Run Dependency Audit').run,
    'node scripts/security/check-ci-audit.cjs');
  assert.equal(securitySteps.find(step => step.name === 'CI Enforcement Contract').run,
    'node --test tests/security/iso-c2-m1-ci.contract.cjs');
  assert.equal(Object.values(workflows[1].jobs)[0].steps.at(-1).run, 'npm run test:glcc:ci');
});

test('actual Jest process: passing, failing and empty required suite', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rentipid-m1-jest-'));
  try {
    const config = {rootDir: dir, testEnvironment: 'node', transform: {}, testRegex: '\\.(test)\\.cjs$'};
    const jest = require.resolve('jest/bin/jest');
    const run = target => spawnSync(process.execPath, [jest, '--config', JSON.stringify(config),
      '--runInBand', '--no-cache', ...(target ? ['--runTestsByPath', target] : ['--testPathPatterns', 'no-required-suite'])], {encoding: 'utf8', timeout: 30000});
    const passing = path.join(dir, 'passing.test.cjs');
    const failing = path.join(dir, 'failing.test.cjs');
    fs.writeFileSync(passing, "test('controlled pass', () => expect(1).toBe(1));");
    fs.writeFileSync(failing, "test('controlled failure', () => expect(1).toBe(2));");
    assert.equal(run(passing).status, 0);
    assert.equal(run(failing).status, 1);
    const empty = run();
    assert.equal(empty.status, 1);
    assert.match(empty.stdout + empty.stderr, /No tests found/);
  } finally { fs.rmSync(dir, {recursive: true, force: true}); }
});

test('mandatory guard failure stops test execution and propagates nonzero', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rentipid-m1-guard-'));
  try {
    const guard = path.join(dir, 'guard.cjs');
    const effect = path.join(dir, 'effect.cjs');
    const marker = path.join(dir, 'test-executed');
    fs.writeFileSync(guard, 'process.exit(Number(process.env.CONTROLLED_GUARD_STATUS));');
    fs.writeFileSync(effect, `require('node:fs').writeFileSync(${JSON.stringify(marker)}, 'executed');`);
    // Preserve the actual package command's mandatory shell conjunction.
    const command = pkg.scripts['test:soc:integration'].replace('npm run test:db:guard',
      `"${process.execPath}" "${guard}"`).replace(/cross-env NODE_ENV=test[\s\S]*$/, `"${process.execPath}" "${effect}"`);
    const result = spawnSync(command, {shell: true, encoding: 'utf8',
      env: {...process.env, CONTROLLED_GUARD_STATUS: '7'}});
    assert.equal(result.status, 7);
    assert.equal(fs.existsSync(marker), false);
  } finally { fs.rmSync(dir, {recursive: true, force: true}); }
});

function report(findings = {}) {
  const counts = {info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0};
  for (const finding of Object.values(findings)) { counts[finding.severity]++; counts.total++; }
  return {auditReportVersion: 2, vulnerabilities: findings, metadata: {vulnerabilities: counts}};
}
const lock = {packages: {
  '': {},
  'node_modules/eslint': {dev: true, dependencies: {'dev-child': '1'}},
  'node_modules/dev-child': {dev: true},
  'node_modules/unrelated': {dev: true},
  'node_modules/sharp': {dev: false},
}};
const finding = (name, severity = 'high', nodes = [`node_modules/${name}`]) => ({name, severity, nodes});
test('clean audit passes with measured zero counts', () => {
  assert.deepEqual(evaluateAudit(report(), 0, lock), {pass: true, total: 0, excepted: 0, rejected: 0,
    counts: {info: 0, low: 0, moderate: 0, high: 0, critical: 0}});
});
test('documented dev family and hoisted dev descendants are explicitly counted as exceptions', () => {
  const result = evaluateAudit(report({eslint: finding('eslint'), 'dev-child': finding('dev-child', 'moderate')}), 1, lock);
  assert.equal(result.pass, true);
  assert.equal(result.excepted, 2);
  assert.equal(result.counts.high, 1);
  assert.equal(result.counts.moderate, 1);
  assert.equal(policy.maximumFindings.high, 30);
  assert.equal(policy.maximumFindings.moderate, 4);
});
for (const [label, value] of [
  ['runtime package', finding('sharp')],
  ['unrelated dev dependency', finding('unrelated')],
  ['unknown package node', finding('absent')],
  ['mixed runtime and excepted nodes', finding('eslint', 'high', ['node_modules/eslint', 'node_modules/sharp'])],
  ['critical dev finding', finding('eslint', 'critical')],
  ['new low finding', finding('eslint', 'low')],
]) test(`audit rejects ${label}`, () => {
  assert.equal(evaluateAudit(report({[value.name]: value}), 1, lock).pass, false);
});
test('historical high and moderate ceilings cannot expand', () => {
  for (const severity of ['high', 'moderate']) {
    const packages = {...lock.packages};
    const findings = {};
    packages['node_modules/eslint'] = {dev: true, dependencies: {}};
    for (let i = 0; i <= policy.maximumFindings[severity]; i++) {
      const name = `fixture-${i}`;
      packages['node_modules/eslint'].dependencies[name] = '1';
      packages[`node_modules/${name}`] = {dev: true};
      findings[name] = finding(name, severity);
    }
    assert.equal(evaluateAudit(report(findings), 1, {packages}).pass, false);
  }
});
for (const [label, mutate, status] of [
  ['registry error', value => ({...value, error: {code: 'E503'}}), 1],
  ['missing report', () => null, 1],
  ['unsupported report', value => ({...value, auditReportVersion: 1}), 0],
  ['audit process failure', value => value, 2],
  ['terminated audit', value => value, null],
  ['inconsistent success', value => value, 1],
  ['count mismatch', value => { value.metadata.vulnerabilities.total = 3; return value; }, 0],
  ['invalid finding', value => { value.vulnerabilities.eslint = {name: 'eslint'}; return value; }, 1],
]) test(`audit fails closed on ${label}`, () => {
  assert.throws(() => evaluateAudit(mutate(report()), status, lock));
});

test('audit CLI propagates controlled pass, exception, rejection and malformed/process failures', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rentipid-m1-audit-'));
  try {
    const shim = path.join(dir, 'controlled-audit.cjs');
    fs.writeFileSync(shim, `require('node:child_process').spawnSync = () => ({
      status: Number(process.env.CONTROLLED_AUDIT_STATUS),
      stdout: process.env.CONTROLLED_AUDIT_OUTPUT,
      stderr: 'controlled-registry-secret-must-not-be-echoed'
    });`);
    for (const [output, status, expected] of [
      [JSON.stringify(report()), 0, 0],
      [JSON.stringify(report({eslint: finding('eslint')})), 1, 0],
      [JSON.stringify(report({sharp: finding('sharp')})), 1, 1],
      [JSON.stringify(report()), 2, 1],
      ['not json', 1, 1],
      [JSON.stringify({...report(), error: {code: 'E503'}}), 1, 1],
    ]) {
      const result = spawnSync(process.execPath, ['--require', shim,
        path.join(root, 'scripts/security/check-ci-audit.cjs')], {encoding: 'utf8',
        env: {...process.env, CONTROLLED_AUDIT_STATUS: String(status), CONTROLLED_AUDIT_OUTPUT: output}});
      assert.equal(result.status, expected, result.stdout + result.stderr);
      assert.doesNotMatch(result.stdout + result.stderr, /controlled-registry-secret-must-not-be-echoed/);
      if (expected === 0) {
        const measured = JSON.parse(result.stdout);
        assert.equal(measured.total, status === 1 ? 1 : 0);
        assert.equal(measured.excepted, status === 1 ? 1 : 0);
      }
    }
  } finally { fs.rmSync(dir, {recursive: true, force: true}); }
});
