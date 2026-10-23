import { isSyntheticIdentityEmail, resolveProfileDisplayEmail } from '@/lib/auth/unified/display-email';

describe('profile display email resolution', () => {
  test('displays the normal email for an email/password account', () => {
    expect(resolveProfileDisplayEmail('person@example.com', [])).toBe('person@example.com');
  });

  test('displays a verified Google provider email', () => {
    expect(resolveProfileDisplayEmail('auth+google.hash@identity.rentipid.invalid', [
      { id: 'google-1', provider: 'google', email: 'person@gmail.com', email_verified: true },
    ])).toBe('person@gmail.com');
  });

  test('displays a verified Facebook provider email', () => {
    expect(resolveProfileDisplayEmail('auth+facebook.hash@identity.rentipid.invalid', [
      { id: 'facebook-1', provider: 'facebook', email: 'person@example.com', email_verified: true },
    ])).toBe('person@example.com');
  });

  test('never renders a synthetic identity email', () => {
    const displayEmail = resolveProfileDisplayEmail('auth+google.hash@identity.rentipid.invalid', [
      { id: 'google-1', provider: 'google', email: 'auth+google.other@identity.rentipid.invalid', email_verified: true },
    ]);

    expect(displayEmail).toBe('Signed in with Google');
    expect(displayEmail).not.toContain('@identity.rentipid.invalid');
    expect(isSyntheticIdentityEmail('auth+google.hash@identity.rentipid.invalid')).toBe(true);
  });

  test('does not mutate the internal User.email value', () => {
    const user = { email: 'auth+google.hash@identity.rentipid.invalid' };

    resolveProfileDisplayEmail(user.email, [
      { id: 'google-1', provider: 'google', email: 'person@gmail.com', email_verified: true },
    ]);

    expect(user.email).toBe('auth+google.hash@identity.rentipid.invalid');
  });

  test('uses a neutral fallback when provider email is missing', () => {
    expect(resolveProfileDisplayEmail('auth+facebook.hash@identity.rentipid.invalid', [
      { id: 'facebook-1', provider: 'facebook', email: null, email_verified: false },
    ])).toBe('Signed in with Facebook');
  });

  test('uses a neutral fallback for a phone-only synthetic account', () => {
    expect(resolveProfileDisplayEmail('auth+phone.hash@identity.rentipid.invalid', [])).toBe('No public email available');
  });
});
