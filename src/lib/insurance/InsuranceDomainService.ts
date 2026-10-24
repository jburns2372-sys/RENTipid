import {
  InsuranceAdapterError,
  type PartnerAdapter,
} from "./PartnerAdapter";
import {
  InsuranceAdapterRegistryError,
  PartnerAdapterRegistry,
} from "./PartnerAdapterRegistry";
import type {
  InsuranceAdapterCapabilities,
  InsuranceAdapterHealth,
  InsuranceAuditRecord,
  InsuranceAuditSink,
  InsuranceCancellationReason,
  InsuranceClaim,
  InsuranceClaimRequest,
  InsuranceEligibilityDecision,
  InsuranceEligibilityRequest,
  InsuranceKillSwitch,
  InsuranceOfferResponse,
  InsuranceOrderResponse,
  InsuranceOrderSelection,
  InsurancePaymentContext,
  InsurancePolicy,
  InsuranceReconciliationResult,
  InsuranceReconciliationWindow,
  InsuranceRuntimeConfig,
  InsuranceWebhookVerification,
} from "./types";
import { InsuranceDomainError } from "./types";

export class InsuranceDomainService {
  constructor(
    private readonly registry: PartnerAdapterRegistry,
    private readonly config: InsuranceRuntimeConfig,
    private readonly killSwitch: InsuranceKillSwitch,
    private readonly auditSink: InsuranceAuditSink,
  ) {}

  async checkEligibility(
    context: InsuranceEligibilityRequest,
  ): Promise<InsuranceEligibilityDecision> {
    return this.runNewBusinessOperation((adapter) =>
      adapter.checkEligibility(context),
    );
  }

  async getOffers(
    context: InsuranceEligibilityRequest,
  ): Promise<InsuranceOfferResponse> {
    return this.runNewBusinessOperation((adapter) => adapter.getOffers(context));
  }

  async createOrder(
    selection: InsuranceOrderSelection,
    paymentContext: InsurancePaymentContext,
  ): Promise<InsuranceOrderResponse> {
    const adapter = await this.resolveNewBusinessAdapter();
    if (adapter.id !== "mock" && !this.config.liveIssuanceEnabled) {
      throw new InsuranceDomainError(
        "INSURANCE_LIVE_ISSUANCE_DISABLED",
        "Live insurance issuance is disabled.",
      );
    }

    const result = await this.callAdapter(() =>
      adapter.createOrder(selection, paymentContext),
    );
    await this.recordAudit({
      action: "INSURANCE_ORDER_CREATED",
      targetId: result.orderId,
      actorUserId: selection.userId,
      bookingId: selection.bookingId,
      safeMetadata: { adapterId: adapter.id, status: result.status },
      occurredAt: new Date(),
    });
    return result;
  }

  async getPolicy(externalPolicyId: string): Promise<InsurancePolicy> {
    const adapter = this.resolveConfiguredAdapter();
    return this.callAdapter(() => adapter.getPolicy(externalPolicyId));
  }

  async cancelPolicy(
    policy: InsurancePolicy,
    reason: InsuranceCancellationReason,
  ): Promise<InsurancePolicy> {
    const adapter = this.resolveConfiguredAdapter();
    const result = await this.callAdapter(() =>
      adapter.cancelPolicy(policy, reason),
    );
    await this.recordAudit({
      action: "INSURANCE_POLICY_CANCELLED",
      targetId: result.policyId,
      bookingId: result.bookingId,
      safeMetadata: { adapterId: adapter.id, reasonCode: reason.code },
      occurredAt: new Date(),
    });
    return result;
  }

  async createClaim(
    policy: InsurancePolicy,
    request: InsuranceClaimRequest,
  ): Promise<InsuranceClaim> {
    const adapter = await this.resolveNewBusinessAdapter();
    const result = await this.callAdapter(() =>
      adapter.createClaim(policy, request, request.evidenceRefs),
    );
    await this.recordAudit({
      action: "INSURANCE_CLAIM_CREATED",
      targetId: result.claimId,
      actorUserId: request.userId,
      bookingId: policy.bookingId,
      safeMetadata: { adapterId: adapter.id, status: result.status },
      occurredAt: new Date(),
    });
    return result;
  }

  async getClaim(externalClaimId: string): Promise<InsuranceClaim> {
    const adapter = this.resolveConfiguredAdapter();
    return this.callAdapter(() => adapter.getClaim(externalClaimId));
  }

  async verifyWebhook(
    headers: Readonly<Record<string, string | readonly string[] | undefined>>,
    body: unknown,
  ): Promise<InsuranceWebhookVerification> {
    const adapter = this.resolveConfiguredAdapter();
    return this.callAdapter(() => adapter.verifyWebhook(headers, body));
  }

  async reconcile(
    batchWindow: InsuranceReconciliationWindow,
  ): Promise<InsuranceReconciliationResult> {
    const adapter = this.resolveConfiguredAdapter();
    return this.callAdapter(() => adapter.reconcile(batchWindow));
  }

  getCapabilities(): InsuranceAdapterCapabilities {
    return this.resolveConfiguredAdapter().getCapabilities();
  }

  async healthCheck(): Promise<InsuranceAdapterHealth> {
    const adapter = this.resolveConfiguredAdapter();
    return this.callAdapter(() => adapter.healthCheck());
  }

  private async runNewBusinessOperation<T>(
    operation: (adapter: PartnerAdapter) => Promise<T>,
  ): Promise<T> {
    const adapter = await this.resolveNewBusinessAdapter();
    return this.callAdapter(() => operation(adapter));
  }

  private async resolveNewBusinessAdapter(): Promise<PartnerAdapter> {
    if (!this.config.enabled) {
      throw new InsuranceDomainError(
        "INSURANCE_DISABLED",
        "Insurance is currently unavailable.",
      );
    }
    if (await this.killSwitch.isActive()) {
      throw new InsuranceDomainError(
        "INSURANCE_KILL_SWITCH_ACTIVE",
        "Insurance operations are temporarily unavailable.",
      );
    }
    return this.resolveConfiguredAdapter();
  }

  private resolveConfiguredAdapter(): PartnerAdapter {
    if (!this.config.adapterId) {
      throw new InsuranceDomainError(
        "INSURANCE_CONFIGURATION_INVALID",
        "Insurance adapter configuration is missing.",
      );
    }

    let adapter: PartnerAdapter;
    try {
      adapter = this.registry.resolve(this.config.adapterId);
    } catch (error) {
      if (error instanceof InsuranceAdapterRegistryError) {
        throw new InsuranceDomainError(
          "INSURANCE_ADAPTER_NOT_FOUND",
          "The configured insurance adapter is unavailable.",
          false,
          { cause: error },
        );
      }
      throw error;
    }

    if (adapter.id === "mock" && !this.config.mockEnabled) {
      throw new InsuranceDomainError(
        "INSURANCE_CONFIGURATION_INVALID",
        "The Mock insurance adapter is not explicitly enabled.",
      );
    }
    return adapter;
  }

  private async callAdapter<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof InsuranceDomainError) {
        throw error;
      }
      if (error instanceof InsuranceAdapterError) {
        throw new InsuranceDomainError(
          error.code === "ADAPTER_UNAVAILABLE" ||
            error.code === "ADAPTER_TIMEOUT"
            ? "INSURANCE_ADAPTER_UNAVAILABLE"
            : "INSURANCE_OPERATION_FAILED",
          "The insurance operation could not be completed.",
          error.retryable,
          { cause: error },
        );
      }
      throw new InsuranceDomainError(
        "INSURANCE_OPERATION_FAILED",
        "The insurance operation could not be completed.",
        false,
        { cause: error },
      );
    }
  }

  private async recordAudit(event: InsuranceAuditRecord): Promise<void> {
    try {
      await this.auditSink.record(event);
    } catch (error) {
      throw new InsuranceDomainError(
        "INSURANCE_OPERATION_FAILED",
        "The insurance operation could not be safely recorded.",
        false,
        { cause: error },
      );
    }
  }
}
