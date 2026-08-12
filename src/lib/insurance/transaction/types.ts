import type {
  InsuranceEligibilityRequest,
  InsuranceMoney,
  InsurancePolicy,
} from "../types";

export type InsuranceEligibilityStatus =
  | "ELIGIBLE"
  | "INELIGIBLE"
  | "TEMPORARILY_UNAVAILABLE";

export interface TransactionEligibilityResult {
  status: InsuranceEligibilityStatus;
  reasonCodes: readonly string[];
  assessedAt: Date;
}

export interface TransactionInsuranceOffer {
  offerId: string;
  partnerKey: string;
  productCode: string;
  currency: string;
  premiumMinor: number;
  coverageReference: string;
  coverageStart: Date;
  coverageEnd: Date;
  expiresAt: Date;
  disclosureVersion: string;
  status: "AVAILABLE";
  mock: boolean;
}

export interface InsuranceCheckoutAvailability {
  status: "AVAILABLE" | "UNAVAILABLE";
  eligibility: TransactionEligibilityResult;
  offers: readonly TransactionInsuranceOffer[];
  optional: true;
}

export interface InsuranceConsentEvidence {
  accepted: true;
  disclosureVersion: string;
  consentedAt: Date;
  premiumPresentedMinor: number;
  currency: string;
}

export interface InsuranceSelectionCommand {
  requestId: string;
  userId: string;
  bookingId: string;
  eligibilityContext: InsuranceEligibilityRequest;
  offerId: string;
  consent: InsuranceConsentEvidence;
}

export interface InsuranceSelectionRecord {
  id: string;
  bookingId: string;
  userId: string;
  offerId: string;
  partnerKey: string;
  productCode: string;
  disclosureVersion: string;
  premiumMinor: number;
  currency: string;
  coverageStart: Date;
  coverageEnd: Date;
  offerExpiresAt: Date;
  consentedAt: Date;
  idempotencyKey: string;
  requestHash: string;
  status: "SELECTED" | "CANCELLED";
  createdAt: Date;
}

export type InsuranceOrderStatus =
  | "SELECTED"
  | "PENDING_PAYMENT_DEPENDENCY"
  | "READY_FOR_ISSUANCE"
  | "ISSUANCE_PENDING"
  | "ISSUED"
  | "FAILED"
  | "CANCELLED";

export type InsurancePaymentDependencyStatus =
  | "PENDING"
  | "AUTHORIZED"
  | "SETTLED"
  | "FAILED";

export interface InsurancePaymentDependencyResult {
  status: InsurancePaymentDependencyStatus;
  paymentReference?: string;
  authorizedAmount?: InsuranceMoney;
}

export interface InsurancePaymentDependency {
  check(input: {
    bookingId: string;
    userId: string;
    expectedPremium: InsuranceMoney;
  }): Promise<InsurancePaymentDependencyResult>;
}

export interface InsuranceOrderRecord {
  id: string;
  selectionId: string;
  bookingId: string;
  userId: string;
  idempotencyKey: string;
  requestHash: string;
  status: InsuranceOrderStatus;
  paymentDependencyStatus: InsurancePaymentDependencyStatus;
  paymentReference?: string;
  issuanceIdempotencyKey?: string;
  issuanceRequestHash?: string;
  externalOrderId?: string;
  failureCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsuranceIssuanceResult {
  order: InsuranceOrderRecord;
  policy?: InsurancePolicy;
}

export interface InsuranceWebhookCommand {
  partnerKey: string;
  headers: Readonly<Record<string, string | readonly string[] | undefined>>;
  body: unknown;
  receivedAt: Date;
}

export interface InsuranceWebhookResult {
  status: "PROCESSED" | "DUPLICATE" | "IGNORED" | "REJECTED";
  externalEventId?: string;
  safeCode?: string;
}

export type InsuranceTransactionAuditAction =
  | "INSURANCE_ELIGIBILITY_CHECKED"
  | "INSURANCE_OFFER_PRESENTED"
  | "INSURANCE_SELECTED"
  | "INSURANCE_CONSENT_RECORDED"
  | "INSURANCE_ORDER_CREATED"
  | "INSURANCE_ISSUANCE_REQUESTED"
  | "INSURANCE_POLICY_ISSUED"
  | "INSURANCE_POLICY_FAILED"
  | "INSURANCE_WEBHOOK_RECEIVED"
  | "INSURANCE_WEBHOOK_REJECTED";

export interface InsuranceTransactionAuditEvent {
  action: InsuranceTransactionAuditAction;
  targetId: string;
  actorUserId?: string;
  bookingId?: string;
  safeMetadata?: Readonly<Record<string, string>>;
  occurredAt: Date;
}

export interface InsuranceTransactionAuditSink {
  record(event: InsuranceTransactionAuditEvent): Promise<void>;
}

export type InsuranceTransactionErrorCode =
  | "INVALID_REQUEST"
  | "AFFIRMATIVE_CONSENT_REQUIRED"
  | "OFFER_NOT_FOUND"
  | "OFFER_EXPIRED"
  | "OFFER_MISMATCH"
  | "IDEMPOTENCY_CONFLICT"
  | "SELECTION_NOT_FOUND"
  | "ORDER_NOT_FOUND"
  | "ORDER_OWNERSHIP_MISMATCH"
  | "PAYMENT_DEPENDENCY_PENDING"
  | "PAYMENT_DEPENDENCY_FAILED"
  | "ISSUANCE_FAILED"
  | "WEBHOOK_VERIFICATION_FAILED"
  | "WEBHOOK_REPLAY_REJECTED"
  | "WEBHOOK_CONFLICT";

export class InsuranceTransactionError extends Error {
  constructor(
    readonly code: InsuranceTransactionErrorCode,
    message: string,
    readonly retryable = false,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "InsuranceTransactionError";
  }
}
