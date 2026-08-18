import {
  evaluateAccountAccess,
  isPendingAccountPathAllowed,
} from '@/lib/security/account-access-policy';

describe('account access policy', () => {
  it('allows verified accounts without onboarding restriction', () => {
    expect(evaluateAccountAccess('Renter', 'Verified')).toEqual({
      allowed: true,
      onboardingOnly: false,
    });
  });

  it.each(['Suspended', 'Blacklisted', 'Unknown'])('denies %s status', (status) => {
    expect(evaluateAccountAccess('Renter', status)).toEqual({
      allowed: false,
      reason: 'INVALID_STATUS',
    });
  });

  it('allows a pending renter only for onboarding', () => {
    expect(evaluateAccountAccess('Renter', 'Pending')).toEqual({
      allowed: true,
      onboardingOnly: true,
    });
    expect(isPendingAccountPathAllowed('/dashboard/profile')).toBe(true);
    expect(isPendingAccountPathAllowed('/dashboard/kyc')).toBe(true);
    expect(isPendingAccountPathAllowed('/dashboard/renter/onboarding-checklist')).toBe(true);
    expect(isPendingAccountPathAllowed('/dashboard/renter/bookings')).toBe(false);
  });

  it.each(['Admin', 'Finance Admin', 'Compliance Admin', 'SOC_ANALYST', 'SOC_SUPERVISOR', 'Super Admin'])(
    'denies pending privileged role %s',
    (role) => {
      expect(evaluateAccountAccess(role, 'Pending')).toEqual({
        allowed: false,
        reason: 'PRIVILEGED_ACCOUNT_NOT_VERIFIED',
      });
    },
  );
});
