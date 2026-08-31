import { normalizeLoginCallbackUrl } from '@/app/login/page';

describe('normalizeLoginCallbackUrl', () => {
  it('keeps relative callback URLs', () => {
    expect(normalizeLoginCallbackUrl('/dashboard/admin?tab=security#open')).toBe('/dashboard/admin?tab=security#open');
  });

  it('accepts same-origin absolute callback URLs', () => {
    expect(normalizeLoginCallbackUrl('http://localhost/dashboard/provider?view=calendar', 'http://localhost')).toBe('/dashboard/provider?view=calendar');
  });

  it('rejects external callback URLs', () => {
    expect(normalizeLoginCallbackUrl('https://evil.example/steal')).toBe('/');
  });

  it('rejects malformed callback URLs', () => {
    expect(normalizeLoginCallbackUrl('://bad-url')).toBe('/');
  });
});
