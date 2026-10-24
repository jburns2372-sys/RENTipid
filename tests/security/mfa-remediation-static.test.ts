import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const source = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), 'utf8');

describe('MFA remediation source invariants', () => {
  it('does not use mfa_step_up as security authority or create it after verification', () => {
    const securityPage = source('src/app/dashboard/security/page.tsx');
    const verifyRoute = source('src/app/api/auth/mfa/verify/route.ts');

    expect(securityPage).not.toContain('mfa_step_up');
    expect(securityPage).not.toContain("cookies()");
    expect(verifyRoute).not.toContain('mfa_step_up');
    expect(verifyRoute).not.toContain('cookies.set');
  });

  it('does not emit database configuration or adjacent authentication secrets', () => {
    const authSource = source('src/lib/auth.ts');
    const mfaRoutes = [
      source('src/app/api/auth/mfa/enroll/route.ts'),
      source('src/app/api/auth/mfa/activate/route.ts'),
      source('src/app/api/auth/mfa/verify/route.ts'),
    ].join('\n');

    expect(authSource).not.toMatch(/console\.(log|error)[\s\S]*DATABASE_URL/);
    expect(authSource).not.toMatch(/console\.(log|error)[\s\S]*(password|token|cookie)/i);
    expect(mfaRoutes).not.toMatch(/console\.(log|error)[\s\S]*(token|secret|recovery)/i);
  });

  it('does not keep database connection literals in package scripts', () => {
    const packageJson = source('package.json');

    expect(/postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\//.test(packageJson)).toBe(false);
  });

  it('does not persist or expose the raw server session identifier', () => {
    const authSource = source('src/lib/auth.ts');
    const assuranceSource = source('src/lib/security/auth/mfa-session-assurance.ts');

    expect(authSource.includes('sessionUser.mfaSessionId')).toBe(false);
    expect(/session_key_hash:\s*(sessionId|token\.mfaSessionId)/.test(assuranceSource)).toBe(false);
    expect(assuranceSource.includes('createHash("sha256")')).toBe(true);
  });

  it('does not use global MFA timestamps as authorization authority', () => {
    const authorizationSource = source('src/lib/security/authorization.ts');

    expect(authorizationSource.includes('last_verified_at')).toBe(false);
    expect(authorizationSource.includes('mfa_step_up')).toBe(false);
    expect(authorizationSource.includes('requireCurrentSessionAal2')).toBe(true);
  });
});
