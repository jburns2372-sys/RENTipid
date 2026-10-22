const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const yaml = require('js-yaml');
const root = path.resolve(__dirname, '../..');
const workflow = yaml.load(fs.readFileSync(path.join(root, '.github/workflows/security-supply-chain.yml'), 'utf8'));
const job = workflow.jobs['supply-chain-validation'];
const target = 'postgresql://rentipid_test_user:ci_test_only@127.0.0.1:5432/rentipid_test_soc?schema=public';

test('ephemeral service and step-scoped guarded schema/test setup', () => {
  assert.equal(workflow.env?.ALLOW_TEST_DATABASE_MUTATION, undefined);
  assert.equal(job.env?.ALLOW_TEST_DATABASE_MUTATION, undefined);
  assert.equal(job.services.postgres.image, 'postgres:16');
  assert.equal(job.services.postgres.env.POSTGRES_DB, 'rentipid_test_soc');
  assert.deepEqual(job.services.postgres.ports, ['5432/tcp']);
  const scoped = job.steps.filter(step => step.env?.ALLOW_TEST_DATABASE_MUTATION !== undefined);
  assert.deepEqual(scoped.map(step => step.name), ['Prepare Ephemeral CI Test Schema', 'Focused Tests']);
  for (const step of scoped) {
    assert.equal(step.env.ALLOW_TEST_DATABASE_MUTATION, 'true');
    assert.equal(step.env.DATABASE_URL, step.env.DIRECT_URL);
    assert.match(step.env.DATABASE_URL, /^postgresql:\/\/rentipid_test_user:ci_test_only@127\.0\.0\.1:\$\{\{ job.services.postgres.ports\[5432\] \}\}\/rentipid_test_soc\?schema=public$/);
  }
  assert.match(scoped[0].run, /npm run test:db:migrate\s+npx prisma generate/);
  assert.equal(scoped[1].run, 'npm run test:soc:integration');
  const role = job.steps.find(step => step.name === 'Create Restricted CI Test Role');
  assert.match(role.run, /NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS/);
  assert.match(role.run, /--host=127\.0\.0\.1.*--dbname=rentipid_test_soc.*ON_ERROR_STOP=1/);
});

function runGuard(patch) {
  // Synthetic guard execution only: no Prisma import, connection or database writes.
  return spawnSync(process.execPath, ['--import', 'tsx', path.join(root, 'scripts/run-test-database-guard.ts')], {
    cwd: root, encoding: 'utf8', timeout: 15000,
    env: {...process.env, NODE_ENV: 'test', DATABASE_URL: target, DIRECT_URL: target,
      ALLOW_TEST_DATABASE_MUTATION: 'true', VERCEL_ENV: '', ALLOW_PREVIEW_KNOWLEDGE_MUTATION: '', ...patch},
  });
}

test('safe test target plus exact mutation flag passes without connecting', () => {
  const result = runGuard({});
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /LOCAL_ISOLATED_TEST_TARGET_ACCEPTED/);
});
for (const value of ['', 'false', 'TRUE', '1', 'true ']) {
  test(`mutation flag ${JSON.stringify(value)} fails closed`, () => {
    const result = runGuard({ALLOW_TEST_DATABASE_MUTATION: value});
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /ALLOW_TEST_DATABASE_MUTATION is not exactly true/);
  });
}
for (const [label, url] of [
  ['Production', 'postgresql://disposable:disposable@ep-prod.neon.tech/rentipid_prod'],
  ['Preview', 'postgresql://disposable:disposable@ep-preview.neon.tech/rentipid_preview'],
  ['shared host', 'postgresql://disposable:disposable@shared.example.com/rentipid_test_soc'],
  ['developer database', 'postgresql://disposable:disposable@127.0.0.1/rentipid_db'],
  ['unsafe name', 'postgresql://disposable:disposable@127.0.0.1/rentipid_ci'],
  ['production name', 'postgresql://disposable:disposable@127.0.0.1/rentipid_test_production'],
]) {
  test(`${label} target fails closed`, () => {
    const result = runGuard({DATABASE_URL: url, DIRECT_URL: url});
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /DATABASE_SAFETY_GUARD_REJECTED_TARGET/);
  });
}
test('mismatched direct target fails closed', () => {
  const result = runGuard({DIRECT_URL: 'postgresql://disposable:disposable@127.0.0.1/rentipid_db'});
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stderr, /DIRECT_URL database differs/);
});
