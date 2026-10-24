import { getSafeInternalRedirect } from '@/lib/security/auth/safe-redirect';

describe('Security Operations Center MFA Return-Target & Redirect Security', () => {
  describe('Safe Internal Redirect Validator (getSafeInternalRedirect)', () => {
    it('1. allows valid internal SOC route', () => {
      const result = getSafeInternalRedirect('/dashboard/admin/security');
      expect(result).toBe('/dashboard/admin/security');
    });

    it('2. allows valid internal SOC sub-routes and queries', () => {
      expect(getSafeInternalRedirect('/dashboard/admin/security/rules')).toBe('/dashboard/admin/security/rules');
      expect(getSafeInternalRedirect('/dashboard/admin/security/alerts?severity=HIGH')).toBe('/dashboard/admin/security/alerts?severity=HIGH');
      expect(getSafeInternalRedirect('/dashboard/super-admin')).toBe('/dashboard/super-admin');
      expect(getSafeInternalRedirect('/dashboard/profile')).toBe('/dashboard/profile');
    });

    it('3. rejects bare /dashboard or /dashboard/ (which causes 404s) and falls back to SOC route', () => {
      expect(getSafeInternalRedirect('/dashboard')).toBe('/dashboard/admin/security');
      expect(getSafeInternalRedirect('/dashboard/')).toBe('/dashboard/admin/security');
    });

    it('4. rejects external absolute URLs (open redirect attack)', () => {
      expect(getSafeInternalRedirect('https://evil.example.com')).toBe('/dashboard/admin/security');
      expect(getSafeInternalRedirect('http://evil.example.com/phish')).toBe('/dashboard/admin/security');
      expect(getSafeInternalRedirect('https://www.rentipid.com.ph.evil.com')).toBe('/dashboard/admin/security');
    });

    it('5. rejects protocol-relative and backslash bypasses', () => {
      expect(getSafeInternalRedirect('//evil.example.com')).toBe('/dashboard/admin/security');
      expect(getSafeInternalRedirect('/\\evil.example.com')).toBe('/dashboard/admin/security');
      expect(getSafeInternalRedirect('\\\\evil.example.com')).toBe('/dashboard/admin/security');
      expect(getSafeInternalRedirect('\\evil.example.com')).toBe('/dashboard/admin/security');
    });

    it('6. rejects javascript: and data: URI schemes', () => {
      expect(getSafeInternalRedirect('javascript:alert(1)')).toBe('/dashboard/admin/security');
      expect(getSafeInternalRedirect('data:text/html,<script>alert(1)</script>')).toBe('/dashboard/admin/security');
      expect(getSafeInternalRedirect('vbscript:msgbox(1)')).toBe('/dashboard/admin/security');
      expect(getSafeInternalRedirect('/dashboard:evil')).toBe('/dashboard/admin/security');
    });

    it('7. rejects URL-encoded bypasses and control characters', () => {
      expect(getSafeInternalRedirect('/%2fevil.example.com')).toBe('/dashboard/admin/security');
      expect(getSafeInternalRedirect('/%5cevil.example.com')).toBe('/dashboard/admin/security');
      expect(getSafeInternalRedirect('/dashboard\r\nSet-Cookie:phish=1')).toBe('/dashboard/admin/security');
      expect(getSafeInternalRedirect('/dashboard\x00evil')).toBe('/dashboard/admin/security');
    });

    it('8. handles null, undefined, and empty string safely', () => {
      expect(getSafeInternalRedirect(null)).toBe('/dashboard/admin/security');
      expect(getSafeInternalRedirect(undefined)).toBe('/dashboard/admin/security');
      expect(getSafeInternalRedirect('')).toBe('/dashboard/admin/security');
      expect(getSafeInternalRedirect('   ')).toBe('/dashboard/admin/security');
    });

    it('9. supports custom safe fallback', () => {
      expect(getSafeInternalRedirect(null, '/dashboard/super-admin')).toBe('/dashboard/super-admin');
      expect(getSafeInternalRedirect('https://evil.com', '/dashboard/profile')).toBe('/dashboard/profile');
    });
  });
});
