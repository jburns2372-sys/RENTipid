export type InsuranceIdentifier = string;

export interface InsuranceMoney {
  amountMinor: number;
  currency: string;
}

export interface InsuranceEligibilityRequest {
  requestId: InsuranceIdentifier;
  userId: InsuranceIdentifier;
  bookingId: InsuranceIdentifier;
  listingId: InsuranceIdentifier;
  listingCategory: string;
  rentalValue: InsuranceMoney;
  rentalStart: Date;
  rentalEnd: Date;
}

export interface InsuranceEligibilityDecision {
  eligible: boolean;
  reasonCodes: readonly string[];
  assessedAt: Date;
}

export interface InsuranceOffer {
  offerId: InsuranceIdentifier;
  productCode: string;
  premium: InsuranceMoney;
  coverageStart: Date;
  coverageEnd: Date;
  expiresAt: Date;
  termsReference: string;
}

export interface InsuranceOfferResponse {
  bookingId: InsuranceIdentifier;
  offers: readonly InsuranceOffer[];
  generatedAt: Date;
}

export interface InsuranceConsent {
  accepted: boolean;
  wordingVersion: string;
  acceptedAt: Date;
}

export interface InsuranceOrderSelection {
  requestId: InsuranceIdentifier;
  userId: InsuranceIdentifier;
  bookingId: InsuranceIdentifier;
  offerId: InsuranceIdentifier;
  consent: InsuranceConsent;
}

export interface InsurancePaymentContext {
  mode: "MOCK" | "DEFERRED";
  paymentReference?: InsuranceIdentifier;
  authorizedAmount?: InsuranceMoney;
}

export interface InsurancePolicy {
  policyId: InsuranceIdentifier;
  externalPolicyId: InsuranceIdentifier;
  bookingId: InsuranceIdentifier;
  productCode: string;
  status: "PENDING" | "ACTIVE" | "CANCELLED" | "EXPIRED";
  premium: InsuranceMoney;
  coverageStart: Date;
  coverageEnd: Date;
  issuedAt?: Date;
  cancelledAt?: Date;
}

export interface InsuranceOrderResponse {
  orderId: InsuranceIdentifier;
  status: "PENDING" | "ISSUED" | "REJECTED";
  policy?: InsurancePolicy;
}

export interface InsuranceCancellationReason {
  code: string;
  note?: string;
}

export interface InsuranceIncident {
  type: string;
  occurredAt: Date;
  summary: string;
}

export interface InsuranceClaimRequest {
  requestId: InsuranceIdentifier;
  userId: InsuranceIdentifier;
  incident: InsuranceIncident;
  evidenceRefs: readonly InsuranceIdentifier[];
}

export interface InsuranceClaim {
  claimId: InsuranceIdentifier;
  externalClaimId: InsuranceIdentifier;
  policyId: InsuranceIdentifier;
  status: "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "CLOSED";
  submittedAt: Date;
  updatedAt: Date;
}

export interface InsuranceWebhookVerification {
  valid: boolean;
  externalEventId?: InsuranceIdentifier;
  eventType?: string;
  occurredAt?: Date;
  bodyHash?: string;
}

export interface InsuranceReconciliationWindow {
  from: Date;
  to: Date;
}

export interface InsuranceReconciliationResult {
  referenceId: InsuranceIdentifier;
  matched: number;
  mismatched: number;
  generatedAt: Date;
}

export type InsuranceCapability =
  | "CHECK_ELIGIBILITY"
  | "GET_OFFERS"
  | "CREATE_ORDER"
  | "GET_POLICY"
  | "CANCEL_POLICY"
  | "CREATE_CLAIM"
  | "GET_CLAIM"
  | "VERIFY_WEBHOOK"
  | "RECONCILE"
  | "HEALTH_CHECK";

export type InsuranceAdapterCapabilities = Readonly<
  Record<InsuranceCapability, boolean>
>;

export interface InsuranceAdapterHealth {
  status: "AVAILABLE" | "DEGRADED" | "UNAVAILABLE";
  checkedAt: Date;
  safeCode?: string;
}

export interface InsuranceRuntimeConfig {
  enabled: boolean;
  liveIssuanceEnabled: boolean;
  killSwitchEnabled: boolean;
  mockEnabled: boolean;
  adapterId: string;
}

export interface InsuranceAuditRecord {
  action:
    | "INSURANCE_ORDER_CREATED"
    | "INSURANCE_POLICY_CANCELLED"
    | "INSURANCE_CLAIM_CREATED";
  targetId: InsuranceIdentifier;
  actorUserId?: InsuranceIdentifier;
  bookingId?: InsuranceIdentifier;
  safeMetadata?: Readonly<Record<string, string>>;
  occurredAt: Date;
}

export interface InsuranceAuditSink {
  record(event: InsuranceAuditRecord): Promise<void>;
}

export interface InsuranceKillSwitch {
  isActive(): Promise<boolean>;
}

export type InsuranceDomainErrorCode =
  | "INSURANCE_DISABLED"
  | "INSURANCE_KILL_SWITCH_ACTIVE"
  | "INSURANCE_CONFIGURATION_INVALID"
  | "INSURANCE_ADAPTER_NOT_FOUND"
  | "INSURANCE_ADAPTER_UNAVAILABLE"
  | "INSURANCE_OPERATION_FAILED"
  | "INSURANCE_LIVE_ISSUANCE_DISABLED";

export class InsuranceDomainError extends Error {
  constructor(
    readonly code: InsuranceDomainErrorCode,
    message: string,
    readonly retryable = false,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "InsuranceDomainError";
  }
}
