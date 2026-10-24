/**
 * RENTipid GLOBAL-MKT / v2.0 — Verification State Model & Transition Rules
 *
 * Implements strongly typed verification states and state-transition guards.
 * Prevents client-side spoofing, illegal state jumps, and self-approval attacks.
 */

export const VERIFICATION_STATES = [
  'NOT_REQUIRED',
  'NOT_STARTED',
  'REQUIRED',
  'IN_PROGRESS',
  'DOCUMENTS_REQUIRED',
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'EXPIRED',
  'SUSPENDED',
  'BLOCKED',
  'PROVIDER_NOT_CONFIGURED',
  'VALIDATION_REQUIRED',
] as const;

export type VerificationState = (typeof VERIFICATION_STATES)[number];

export const ALL_VERIFICATION_STATES: readonly VerificationState[] = Object.freeze([...VERIFICATION_STATES]);

/**
 * Valid state transitions mapping.
 * Enforces strict lifecycle progression.
 */
export const LEGAL_VERIFICATION_TRANSITIONS: Readonly<Record<VerificationState, readonly VerificationState[]>> = Object.freeze({
  NOT_REQUIRED: ['REQUIRED', 'VALIDATION_REQUIRED'],
  NOT_STARTED: ['REQUIRED', 'DOCUMENTS_REQUIRED', 'IN_PROGRESS', 'VALIDATION_REQUIRED', 'NOT_REQUIRED'],
  REQUIRED: ['DOCUMENTS_REQUIRED', 'IN_PROGRESS', 'NOT_REQUIRED', 'BLOCKED'],
  IN_PROGRESS: ['DOCUMENTS_REQUIRED', 'SUBMITTED', 'REJECTED', 'BLOCKED'],
  DOCUMENTS_REQUIRED: ['SUBMITTED', 'IN_PROGRESS', 'REJECTED', 'BLOCKED'],
  SUBMITTED: ['UNDER_REVIEW', 'DOCUMENTS_REQUIRED', 'REJECTED'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED', 'DOCUMENTS_REQUIRED', 'SUSPENDED'],
  APPROVED: ['EXPIRED', 'SUSPENDED', 'BLOCKED', 'UNDER_REVIEW', 'DOCUMENTS_REQUIRED'],
  REJECTED: ['DOCUMENTS_REQUIRED', 'REQUIRED', 'BLOCKED'],
  EXPIRED: ['DOCUMENTS_REQUIRED', 'REQUIRED', 'UNDER_REVIEW'],
  SUSPENDED: ['UNDER_REVIEW', 'APPROVED', 'BLOCKED'],
  BLOCKED: [], // Terminal unless manual super-admin intervention
  PROVIDER_NOT_CONFIGURED: ['VALIDATION_REQUIRED', 'NOT_STARTED'],
  VALIDATION_REQUIRED: ['REQUIRED', 'NOT_REQUIRED', 'NOT_STARTED', 'PROVIDER_NOT_CONFIGURED'],
});

/**
 * Validates whether a state transition from `current` to `target` is legally permitted.
 */
export function canTransitionVerificationState(
  current: VerificationState,
  target: VerificationState
): boolean {
  if (current === target) return true; // Idempotent
  const allowed = LEGAL_VERIFICATION_TRANSITIONS[current];
  return allowed ? allowed.includes(target) : false;
}

/**
 * Checks if a verification state represents a terminal or non-actionable state.
 */
export function isTerminalVerificationState(state: VerificationState): boolean {
  return state === 'BLOCKED';
}

/**
 * Checks if a verification state satisfies identity gating requirements.
 */
export function isVerificationApproved(state: VerificationState): boolean {
  return state === 'APPROVED' || state === 'NOT_REQUIRED';
}
