const PRIVILEGED_ROLES = new Set([
  'Admin',
  'Finance Admin',
  'Compliance Admin',
  'SOC_ANALYST',
  'SOC_SUPERVISOR',
  'Super Admin',
]);

export type AccountAccessDecision =
  | { allowed: true; onboardingOnly: false }
  | { allowed: true; onboardingOnly: true }
  | { allowed: false; reason: 'INVALID_STATUS' | 'PRIVILEGED_ACCOUNT_NOT_VERIFIED' };

export function evaluateAccountAccess(role: string, status: string): AccountAccessDecision {
  if (status === 'Verified') return { allowed: true, onboardingOnly: false };

  if (status === 'Pending' && !PRIVILEGED_ROLES.has(role)) {
    return { allowed: true, onboardingOnly: true };
  }

  return {
    allowed: false,
    reason: status === 'Pending'
      ? 'PRIVILEGED_ACCOUNT_NOT_VERIFIED'
      : 'INVALID_STATUS',
  };
}

export function isPendingAccountPathAllowed(path: string): boolean {
  return path === '/dashboard'
    || path.startsWith('/dashboard/profile')
    || path.startsWith('/dashboard/security')
    || path.startsWith('/dashboard/kyc')
    || path.startsWith('/dashboard/privacy')
    || path.startsWith('/dashboard/renter/onboarding-checklist')
    || path.startsWith('/dashboard/provider/onboarding-checklist')
    || path.startsWith('/dashboard/business/profile');
}
