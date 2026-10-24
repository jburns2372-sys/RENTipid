import { execSync } from 'child_process';
import path from 'path';

describe('run-test-database-guard script', () => {
  const scriptPath = path.resolve(__dirname, '../../scripts/run-test-database-guard.ts');

  function runGuard(env: Record<string, string | undefined>): { success: boolean; output: string } {
    try {
      const output = execSync(`npx tsx "${scriptPath}"`, {
        env: { ...process.env, ...env },
        stdio: 'pipe',
      });
      return { success: true, output: output.toString() };
    } catch (e: unknown) {
      if (e instanceof Error) {
        const err = e as { message: string, stdout?: Buffer, stderr?: Buffer };
        return { success: false, output: err.stderr?.toString() || err.stdout?.toString() || err.message };
      }
      return { success: false, output: String(e) };
    }
  }

  it('1. local safe database: PASS', () => {
    const result = runGuard({
      NODE_ENV: 'test',
      ALLOW_TEST_DATABASE_MUTATION: 'true',
      DATABASE_URL: 'postgresql://postgres:postgres@127.0.0.1:5432/rentipid_test_soc',
    });
    expect(result.success).toBe(true);
    expect(result.output).toContain('Test database guard passed successfully');
  });

  it('2. arbitrary remote/cloud database: FAIL', () => {
    const result = runGuard({
      NODE_ENV: 'test',
      ALLOW_TEST_DATABASE_MUTATION: 'true',
      DATABASE_URL: 'postgresql://postgres:postgres@my-cloud-db.neon.tech:5432/rentipid_test_soc',
    });
    expect(result.success).toBe(false);
    expect(result.output).toContain('DATABASE_SAFETY_GUARD_REJECTED_TARGET');
  });

  it('3. Preview remote database without ALLOW_PREVIEW_KNOWLEDGE_MUTATION=true: FAIL', () => {
    const result = runGuard({
      NODE_ENV: 'test',
      VERCEL_ENV: 'preview',
      ALLOW_TEST_DATABASE_MUTATION: 'true',
      DATABASE_URL: 'postgresql://postgres:postgres@ep-lucky-me-12345.pooler.neon.tech/rentipid_preview',
      PREVIEW_DATABASE_URL: 'postgresql://postgres:postgres@ep-lucky-me-12345.pooler.neon.tech/rentipid_preview',
    });
    expect(result.success).toBe(false);
    expect(result.output).toContain('DATABASE_SAFETY_GUARD_REJECTED_TARGET');
  });

  it('4. Preview with database identity mismatch: FAIL', () => {
    const result = runGuard({
      NODE_ENV: 'test',
      VERCEL_ENV: 'preview',
      ALLOW_TEST_DATABASE_MUTATION: 'true',
      ALLOW_PREVIEW_KNOWLEDGE_MUTATION: 'true',
      DATABASE_URL: 'postgresql://postgres:postgres@ep-lucky-me-12345.pooler.neon.tech/rentipid_preview',
      PREVIEW_DATABASE_URL: 'postgresql://postgres:postgres@ep-DIFFERENT-12345.pooler.neon.tech/rentipid_preview',
    });
    expect(result.success).toBe(false);
    expect(result.output).toContain('DATABASE_SAFETY_GUARD_REJECTED_TARGET');
  });

  it('5. Production remote database: FAIL', () => {
    const result = runGuard({
      NODE_ENV: 'test',
      ALLOW_TEST_DATABASE_MUTATION: 'true',
      DATABASE_URL: 'postgresql://postgres:postgres@ep-prod-db.pooler.neon.tech/rentipid_prod',
    });
    expect(result.success).toBe(false);
    expect(result.output).toContain('DATABASE_SAFETY_GUARD_REJECTED_TARGET');
  });

  it('6. authorized Preview + matching rentipid_preview identity: PASS', () => {
    const result = runGuard({
      NODE_ENV: 'test',
      VERCEL_ENV: 'preview',
      // We don't even need ALLOW_TEST_DATABASE_MUTATION because the bypass kicks in
      ALLOW_PREVIEW_KNOWLEDGE_MUTATION: 'true',
      DATABASE_URL: 'postgresql://postgres:postgres@ep-lucky-me-12345.pooler.neon.tech/rentipid_preview',
      PREVIEW_DATABASE_URL: 'postgresql://postgres:postgres@ep-lucky-me-12345.pooler.neon.tech/rentipid_preview',
    });
    expect(result.success).toBe(true);
    expect(result.output).toContain('Authorized PREVIEW knowledge mutation environment detected');
  });
});
