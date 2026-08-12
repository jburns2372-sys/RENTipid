import {
  InsuranceAdapterError,
  type PartnerAdapter,
} from "../PartnerAdapter";
import type {
  InsuranceAdapterCapabilities,
  InsuranceAdapterHealth,
  InsuranceCancellationReason,
  InsuranceClaim,
  InsuranceClaimRequest,
  InsuranceEligibilityDecision,
  InsuranceEligibilityRequest,
  InsuranceMoney,
  InsuranceOfferResponse,
  InsuranceOrderResponse,
  InsuranceOrderSelection,
  InsurancePaymentContext,
  InsurancePolicy,
  InsuranceReconciliationResult,
  InsuranceReconciliationWindow,
  InsuranceWebhookVerification,
} from "../types";

export type MockInsuranceScenario =
  | "eligible"
  | "ineligible"
  | "no-offer"
  | "unavailable"
  | "timeout"
  | "failure";

export interface MockInsuranceAdapterOptions {
  scenarioByBookingId?: Readonly<Record<string, MockInsuranceScenario>>;
  health?: "healthy" | "degraded" | "unavailable";
  now?: () => Date;
}

const CAPABILITIES: InsuranceAdapterCapabilities = {
  CHECK_ELIGIBILITY: true,
  GET_OFFERS: true,
  CREATE_ORDER: true,
  GET_POLICY: true,
  CANCEL_POLICY: true,
  CREATE_CLAIM: true,
  GET_CLAIM: true,
  VERIFY_WEBHOOK: true,
  RECONCILE: true,
  HEALTH_CHECK: true,
};

const FIXED_NOW = new Date("2026-01-01T00:00:00.000Z");

function stableToken(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function cloneDate(value: Date): Date {
  return new Date(value.getTime());
}

function normalizedCurrency(value: string): string {
  return value.trim().toUpperCase();
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export class MockInsuranceAdapter implements PartnerAdapter {
  readonly id = "mock";

  private readonly scenarioByBookingId: Readonly<
    Record<string, MockInsuranceScenario>
  >;
  private readonly health: "healthy" | "degraded" | "unavailable";
  private readonly now: () => Date;
  private readonly policies = new Map<string, InsurancePolicy>();
  private readonly claims = new Map<string, InsuranceClaim>();

  constructor(options: MockInsuranceAdapterOptions = {}) {
    this.scenarioByBookingId = options.scenarioByBookingId ?? {};
    this.health = options.health ?? "healthy";
    this.now = options.now ?? (() => cloneDate(FIXED_NOW));
  }

  async checkEligibility(
    context: InsuranceEligibilityRequest,
  ): Promise<InsuranceEligibilityDecision> {
    const scenario = this.scenarioFor(context.bookingId);
    this.assertOperational(scenario);
    return {
      eligible: scenario !== "ineligible",
      reasonCodes:
        scenario === "ineligible" ? ["MOCK_NOT_ELIGIBLE"] : ["MOCK_ELIGIBLE"],
      assessedAt: this.now(),
    };
  }

  async getOffers(
    context: InsuranceEligibilityRequest,
  ): Promise<InsuranceOfferResponse> {
    const scenario = this.scenarioFor(context.bookingId);
    this.assertOperational(scenario);
    if (scenario === "ineligible" || scenario === "no-offer") {
      return {
        bookingId: context.bookingId,
        offers: [],
        generatedAt: this.now(),
      };
    }

    const generatedAt = this.now();
    return {
      bookingId: context.bookingId,
      offers: [
        {
          offerId: `mock-offer-${stableToken(context.bookingId)}`,
          productCode: "MOCK-FOUNDATION",
          premium: this.calculatePremium(context.rentalValue),
          coverageStart: cloneDate(context.rentalStart),
          coverageEnd: cloneDate(context.rentalEnd),
          expiresAt: new Date(generatedAt.getTime() + 24 * 60 * 60 * 1000),
          termsReference: "mock-terms-not-insurance-v1",
        },
      ],
      generatedAt,
    };
  }

  async createOrder(
    selection: InsuranceOrderSelection,
    paymentContext: InsurancePaymentContext,
  ): Promise<InsuranceOrderResponse> {
    const scenario = this.scenarioFor(selection.bookingId);
    this.assertOperational(scenario);
    if (!selection.consent.accepted) {
      throw new InsuranceAdapterError(
        "ADAPTER_REJECTED",
        "Explicit insurance consent is required.",
      );
    }

    const token = stableToken(
      `${selection.bookingId}:${selection.offerId}:${selection.requestId}`,
    );
    const externalPolicyId = `mock-policy-${token}`;
    const existing = this.policies.get(externalPolicyId);
    if (existing) {
      return {
        orderId: `mock-order-${token}`,
        status: "ISSUED",
        policy: existing,
      };
    }

    const issuedAt = this.now();
    const policy: InsurancePolicy = {
      policyId: `mock-internal-policy-${token}`,
      externalPolicyId,
      bookingId: selection.bookingId,
      productCode: "MOCK-FOUNDATION",
      status: "ACTIVE",
      premium:
        paymentContext.authorizedAmount ??
        ({ amountMinor: 0, currency: "PHP" } satisfies InsuranceMoney),
      coverageStart: issuedAt,
      coverageEnd: new Date(issuedAt.getTime() + 24 * 60 * 60 * 1000),
      issuedAt,
    };
    this.policies.set(externalPolicyId, policy);
    return {
      orderId: `mock-order-${token}`,
      status: "ISSUED",
      policy,
    };
  }

  async getPolicy(externalPolicyId: string): Promise<InsurancePolicy> {
    const existing = this.policies.get(externalPolicyId);
    if (existing) {
      return existing;
    }
    const token = stableToken(externalPolicyId);
    const issuedAt = this.now();
    return {
      policyId: `mock-internal-policy-${token}`,
      externalPolicyId,
      bookingId: `mock-booking-${token}`,
      productCode: "MOCK-FOUNDATION",
      status: "ACTIVE",
      premium: { amountMinor: 0, currency: "PHP" },
      coverageStart: issuedAt,
      coverageEnd: new Date(issuedAt.getTime() + 24 * 60 * 60 * 1000),
      issuedAt,
    };
  }

  async cancelPolicy(
    policy: InsurancePolicy,
    reason: InsuranceCancellationReason,
  ): Promise<InsurancePolicy> {
    if (!reason.code.trim()) {
      throw new InsuranceAdapterError(
        "ADAPTER_REJECTED",
        "Cancellation reason code is required.",
      );
    }
    const cancelled: InsurancePolicy = {
      ...policy,
      status: "CANCELLED",
      cancelledAt: this.now(),
    };
    this.policies.set(policy.externalPolicyId, cancelled);
    return cancelled;
  }

  async createClaim(
    policy: InsurancePolicy,
    incident: InsuranceClaimRequest,
    evidenceRefs: readonly string[],
  ): Promise<InsuranceClaim> {
    const scenario = this.scenarioFor(policy.bookingId);
    this.assertOperational(scenario);
    if (evidenceRefs.length !== incident.evidenceRefs.length) {
      throw new InsuranceAdapterError(
        "ADAPTER_REJECTED",
        "Claim evidence references do not match.",
      );
    }

    const token = stableToken(
      `${policy.externalPolicyId}:${incident.requestId}`,
    );
    const externalClaimId = `mock-claim-${token}`;
    const existing = this.claims.get(externalClaimId);
    if (existing) {
      return existing;
    }

    const submittedAt = this.now();
    const claim: InsuranceClaim = {
      claimId: `mock-internal-claim-${token}`,
      externalClaimId,
      policyId: policy.policyId,
      status: "SUBMITTED",
      submittedAt,
      updatedAt: submittedAt,
      claimedAmount: incident.claimedAmount,
    };
    this.claims.set(externalClaimId, claim);
    return claim;
  }

  async getClaim(externalClaimId: string): Promise<InsuranceClaim> {
    const existing = this.claims.get(externalClaimId);
    if (existing) {
      return existing;
    }
    const timestamp = this.now();
    return {
      claimId: `mock-internal-claim-${stableToken(externalClaimId)}`,
      externalClaimId,
      policyId: `mock-policy-${stableToken(externalClaimId)}`,
      status: "UNDER_REVIEW",
      submittedAt: timestamp,
      updatedAt: timestamp,
      claimedAmount: { amountMinor: 10000, currency: "PHP" },
    };
  }

  async verifyWebhook(
    headers: Readonly<Record<string, string | readonly string[] | undefined>>,
    body: unknown,
  ): Promise<InsuranceWebhookVerification> {
    const valid = headers["x-mock-insurance-signature"] === "mock-signature-valid";
    if (!valid || !isRecord(body)) {
      return { valid: false };
    }
    const policyStatus =
      typeof body.policyStatus === "string" &&
      ["PENDING", "ACTIVE", "CANCELLED", "EXPIRED", "FAILED"].includes(
        body.policyStatus,
      )
        ? (body.policyStatus as InsurancePolicy["status"])
        : undefined;
    return {
      valid: true,
      externalEventId:
        typeof body.eventId === "string" ? body.eventId : undefined,
      eventType: typeof body.eventType === "string" ? body.eventType : undefined,
      occurredAt: this.now(),
      bodyHash: `mock-hash-${stableToken(JSON.stringify(body))}`,
      externalPolicyId:
        typeof body.externalPolicyId === "string"
          ? body.externalPolicyId
          : undefined,
      policyStatus,
    };
  }

  async reconcile(
    batchWindow: InsuranceReconciliationWindow,
  ): Promise<InsuranceReconciliationResult> {
    return {
      referenceId: `mock-reconcile-${stableToken(
        `${batchWindow.from.toISOString()}:${batchWindow.to.toISOString()}`,
      )}`,
      matched: this.policies.size,
      mismatched: 0,
      generatedAt: this.now(),
    };
  }

  getCapabilities(): InsuranceAdapterCapabilities {
    return CAPABILITIES;
  }

  async healthCheck(): Promise<InsuranceAdapterHealth> {
    return {
      status:
        this.health === "healthy"
          ? "AVAILABLE"
          : this.health === "degraded"
            ? "DEGRADED"
            : "UNAVAILABLE",
      checkedAt: this.now(),
      safeCode:
        this.health === "healthy" ? undefined : `MOCK_${this.health.toUpperCase()}`,
    };
  }

  private scenarioFor(bookingId: string): MockInsuranceScenario {
    return this.scenarioByBookingId[bookingId] ?? "eligible";
  }

  private assertOperational(scenario: MockInsuranceScenario): void {
    if (scenario === "unavailable") {
      throw new InsuranceAdapterError(
        "ADAPTER_UNAVAILABLE",
        "Mock adapter unavailable scenario.",
        true,
      );
    }
    if (scenario === "timeout") {
      throw new InsuranceAdapterError(
        "ADAPTER_TIMEOUT",
        "Mock adapter timeout scenario.",
        true,
      );
    }
    if (scenario === "failure") {
      throw new InsuranceAdapterError(
        "ADAPTER_REJECTED",
        "Mock adapter failure scenario.",
      );
    }
  }

  private calculatePremium(rentalValue: InsuranceMoney): InsuranceMoney {
    return {
      amountMinor: Math.max(100, Math.floor(rentalValue.amountMinor / 100)),
      currency: normalizedCurrency(rentalValue.currency),
    };
  }
}
