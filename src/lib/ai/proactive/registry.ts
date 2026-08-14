export const PROACTIVE_EVENT_TYPES = [
  'BOOKING_RESPONSE_OVERDUE',
  'PROVIDER_RESPONSE_OVERDUE',
  'PAYMENT_FAILED',
  'PAYMENT_REQUIRES_ACTION',
  'REFUND_STATUS_CHANGED',
  'REFUND_COMPLETED',
  'DEPOSIT_RELEASED',
  'DEPOSIT_ACTION_REQUIRED',
  'RENTAL_DUE_SOON',
  'RETURN_OVERDUE',
  'CLAIM_EVIDENCE_REQUIRED',
  'CLAIM_STATUS_CHANGED',
  'INSURANCE_STATUS_CHANGED',
  'KYC_ACTION_REQUIRED',
] as const;

export type ProactiveEventType = (typeof PROACTIVE_EVENT_TYPES)[number];
export type ProactiveEntityType =
  | 'Booking'
  | 'Payment'
  | 'RefundRequest'
  | 'DepositAction'
  | 'DamageClaim'
  | 'InsurancePolicy'
  | 'User';

export interface ProactiveEventDefinition {
  eventType: ProactiveEventType;
  sourceModel: string;
  relatedEntityType: ProactiveEntityType;
  eligibilityRule: string;
  category: string;
  subcategory: string;
  triggerType: 'reminder' | 'recheck' | 're-evaluation';
  cooldownMs: number;
  expiryMs: number;
  allowedTool: null;
  title: string;
  message: string;
  version: '1.0';
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function definition(
  eventType: ProactiveEventType,
  values: Omit<ProactiveEventDefinition, 'eventType' | 'version' | 'allowedTool'>,
): ProactiveEventDefinition {
  return { eventType, version: '1.0', allowedTool: null, ...values };
}

export const proactiveEventRegistry: Readonly<Record<ProactiveEventType, ProactiveEventDefinition>> = Object.freeze({
  BOOKING_RESPONSE_OVERDUE: definition('BOOKING_RESPONSE_OVERDUE', {
    sourceModel: 'Booking',
    relatedEntityType: 'Booking',
    eligibilityRule: 'booking.pending_provider_approval.for_24h',
    category: 'BOOKING',
    subcategory: 'booking_response_overdue',
    triggerType: 'reminder',
    cooldownMs: DAY,
    expiryMs: 3 * DAY,
    title: 'Booking response update',
    message: 'Your booking is still awaiting a provider response. Review the current booking status in RENTipid.',
  }),
  PROVIDER_RESPONSE_OVERDUE: definition('PROVIDER_RESPONSE_OVERDUE', {
    sourceModel: 'Booking',
    relatedEntityType: 'Booking',
    eligibilityRule: 'provider.pending_booking_response.for_24h',
    category: 'BOOKING',
    subcategory: 'provider_response_overdue',
    triggerType: 'reminder',
    cooldownMs: DAY,
    expiryMs: 3 * DAY,
    title: 'Booking response required',
    message: 'A booking is awaiting your response. Review the current booking state in RENTipid.',
  }),
  PAYMENT_FAILED: definition('PAYMENT_FAILED', {
    sourceModel: 'Payment',
    relatedEntityType: 'Payment',
    eligibilityRule: 'payment.status.failed',
    category: 'PAYMENT_REFUND_DEPOSIT',
    subcategory: 'payment_failed',
    triggerType: 'recheck',
    cooldownMs: 4 * HOUR,
    expiryMs: 3 * DAY,
    title: 'Payment needs attention',
    message: 'A payment is currently marked failed. Review its live status and available options in RENTipid.',
  }),
  PAYMENT_REQUIRES_ACTION: definition('PAYMENT_REQUIRES_ACTION', {
    sourceModel: 'Payment',
    relatedEntityType: 'Payment',
    eligibilityRule: 'payment.pending.and_booking_pending_payment',
    category: 'PAYMENT_REFUND_DEPOSIT',
    subcategory: 'payment_requires_action',
    triggerType: 'recheck',
    cooldownMs: 4 * HOUR,
    expiryMs: 2 * DAY,
    title: 'Payment action may be required',
    message: 'A booking payment is still pending. Review the live payment state in RENTipid.',
  }),
  REFUND_STATUS_CHANGED: definition('REFUND_STATUS_CHANGED', {
    sourceModel: 'RefundRequest',
    relatedEntityType: 'RefundRequest',
    eligibilityRule: 'refund.non_draft.non_terminal_status',
    category: 'PAYMENT_REFUND_DEPOSIT',
    subcategory: 'refund_status_changed',
    triggerType: 're-evaluation',
    cooldownMs: 12 * HOUR,
    expiryMs: 7 * DAY,
    title: 'Refund status updated',
    message: 'Your refund request has a current status update. Review the authoritative status in RENTipid.',
  }),
  REFUND_COMPLETED: definition('REFUND_COMPLETED', {
    sourceModel: 'RefundRequest',
    relatedEntityType: 'RefundRequest',
    eligibilityRule: 'refund.status.processed',
    category: 'PAYMENT_REFUND_DEPOSIT',
    subcategory: 'refund_completed',
    triggerType: 're-evaluation',
    cooldownMs: DAY,
    expiryMs: 7 * DAY,
    title: 'Refund completed',
    message: 'Your refund is currently marked processed. Review its authoritative details in RENTipid.',
  }),
  DEPOSIT_RELEASED: definition('DEPOSIT_RELEASED', {
    sourceModel: 'DepositAction',
    relatedEntityType: 'DepositAction',
    eligibilityRule: 'deposit.action.release',
    category: 'PAYMENT_REFUND_DEPOSIT',
    subcategory: 'deposit_released',
    triggerType: 're-evaluation',
    cooldownMs: DAY,
    expiryMs: 7 * DAY,
    title: 'Deposit release recorded',
    message: 'A deposit release has been recorded. Review the current booking ledger in RENTipid.',
  }),
  DEPOSIT_ACTION_REQUIRED: definition('DEPOSIT_ACTION_REQUIRED', {
    sourceModel: 'DepositAction',
    relatedEntityType: 'DepositAction',
    eligibilityRule: 'deposit.action.hold_for_dispute',
    category: 'PAYMENT_REFUND_DEPOSIT',
    subcategory: 'deposit_action_required',
    triggerType: 'recheck',
    cooldownMs: DAY,
    expiryMs: 3 * DAY,
    title: 'Deposit review required',
    message: 'A deposit is held for review. Open RENTipid to review the current case and required evidence.',
  }),
  RENTAL_DUE_SOON: definition('RENTAL_DUE_SOON', {
    sourceModel: 'Booking',
    relatedEntityType: 'Booking',
    eligibilityRule: 'booking.active.and_end_within_24h',
    category: 'RENTAL',
    subcategory: 'rental_due_soon',
    triggerType: 'reminder',
    cooldownMs: 12 * HOUR,
    expiryMs: DAY,
    title: 'Rental return due soon',
    message: 'Your rental is due soon. Review the current booking schedule in RENTipid.',
  }),
  RETURN_OVERDUE: definition('RETURN_OVERDUE', {
    sourceModel: 'Booking',
    relatedEntityType: 'Booking',
    eligibilityRule: 'booking.ongoing.and_end_elapsed',
    category: 'RENTAL',
    subcategory: 'return_overdue',
    triggerType: 'recheck',
    cooldownMs: DAY,
    expiryMs: 3 * DAY,
    title: 'Rental return status requires review',
    message: 'The booking remains ongoing after its recorded end time. Review the live rental state in RENTipid.',
  }),
  CLAIM_EVIDENCE_REQUIRED: definition('CLAIM_EVIDENCE_REQUIRED', {
    sourceModel: 'DamageClaim',
    relatedEntityType: 'DamageClaim',
    eligibilityRule: 'claim.status.renter_response_pending',
    category: 'CLAIM_DAMAGE',
    subcategory: 'claim_evidence_required',
    triggerType: 'recheck',
    cooldownMs: DAY,
    expiryMs: 7 * DAY,
    title: 'Claim evidence required',
    message: 'A claim is awaiting your response or evidence. Review the current claim in RENTipid.',
  }),
  CLAIM_STATUS_CHANGED: definition('CLAIM_STATUS_CHANGED', {
    sourceModel: 'DamageClaim',
    relatedEntityType: 'DamageClaim',
    eligibilityRule: 'claim.non_draft_status',
    category: 'CLAIM_DAMAGE',
    subcategory: 'claim_status_changed',
    triggerType: 're-evaluation',
    cooldownMs: 12 * HOUR,
    expiryMs: 7 * DAY,
    title: 'Claim status updated',
    message: 'A damage claim has a current status update. Review its authoritative state in RENTipid.',
  }),
  INSURANCE_STATUS_CHANGED: definition('INSURANCE_STATUS_CHANGED', {
    sourceModel: 'InsurancePolicy',
    relatedEntityType: 'InsurancePolicy',
    eligibilityRule: 'insurance.policy.current_status',
    category: 'INSURANCE',
    subcategory: 'insurance_status_changed',
    triggerType: 're-evaluation',
    cooldownMs: 12 * HOUR,
    expiryMs: 7 * DAY,
    title: 'Insurance status updated',
    message: 'Your rental insurance policy has a current status update. Review it in RENTipid.',
  }),
  KYC_ACTION_REQUIRED: definition('KYC_ACTION_REQUIRED', {
    sourceModel: 'UserProfile|BusinessProfile',
    relatedEntityType: 'User',
    eligibilityRule: 'kyc.status.unverified_or_rejected',
    category: 'KYC_ACCOUNT',
    subcategory: 'kyc_action_required',
    triggerType: 'recheck',
    cooldownMs: DAY,
    expiryMs: 7 * DAY,
    title: 'Identity verification action required',
    message: 'Your identity verification requires attention. Review the current requirements in RENTipid.',
  }),
});

export function getProactiveEventDefinition(eventType: ProactiveEventType) {
  return proactiveEventRegistry[eventType];
}
