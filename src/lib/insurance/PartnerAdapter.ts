import type {
  InsuranceAdapterCapabilities,
  InsuranceAdapterHealth,
  InsuranceCancellationReason,
  InsuranceClaim,
  InsuranceClaimRequest,
  InsuranceEligibilityDecision,
  InsuranceEligibilityRequest,
  InsuranceOfferResponse,
  InsuranceOrderResponse,
  InsuranceOrderSelection,
  InsurancePaymentContext,
  InsurancePolicy,
  InsuranceReconciliationResult,
  InsuranceReconciliationWindow,
  InsuranceWebhookVerification,
} from "./types";

export type InsuranceAdapterErrorCode =
  | "ADAPTER_UNAVAILABLE"
  | "ADAPTER_TIMEOUT"
  | "ADAPTER_REJECTED"
  | "INVALID_WEBHOOK"
  | "UNSUPPORTED_CAPABILITY";

export class InsuranceAdapterError extends Error {
  constructor(
    readonly code: InsuranceAdapterErrorCode,
    message: string,
    readonly retryable = false,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "InsuranceAdapterError";
  }
}

export interface PartnerAdapter {
  readonly id: string;
  checkEligibility(
    context: InsuranceEligibilityRequest,
  ): Promise<InsuranceEligibilityDecision>;
  getOffers(context: InsuranceEligibilityRequest): Promise<InsuranceOfferResponse>;
  createOrder(
    selection: InsuranceOrderSelection,
    paymentContext: InsurancePaymentContext,
  ): Promise<InsuranceOrderResponse>;
  getPolicy(externalPolicyId: string): Promise<InsurancePolicy>;
  cancelPolicy(
    policy: InsurancePolicy,
    reason: InsuranceCancellationReason,
  ): Promise<InsurancePolicy>;
  createClaim(
    policy: InsurancePolicy,
    incident: InsuranceClaimRequest,
    evidenceRefs: readonly string[],
  ): Promise<InsuranceClaim>;
  getClaim(externalClaimId: string): Promise<InsuranceClaim>;
  verifyWebhook(
    headers: Readonly<Record<string, string | readonly string[] | undefined>>,
    body: unknown,
  ): Promise<InsuranceWebhookVerification>;
  reconcile(
    batchWindow: InsuranceReconciliationWindow,
  ): Promise<InsuranceReconciliationResult>;
  getCapabilities(): InsuranceAdapterCapabilities;
  healthCheck(): Promise<InsuranceAdapterHealth>;
}
