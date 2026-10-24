import { PrismaClient, InsurancePolicy } from "@prisma/client";
import { PartnerAdapterRegistry } from "../PartnerAdapterRegistry";
import { InsuranceFinanceService } from "./InsuranceFinanceService";
import { InsuranceAdapterError } from "../PartnerAdapter";

export class InsuranceCancellationService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly adapterRegistry: PartnerAdapterRegistry,
    private readonly financeService: InsuranceFinanceService
  ) {}

  /**
   * Requests cancellation of an insurance policy.
   * If the partner returns CANCELLED synchronously, we transition to CANCELLED.
   * If the partner requires asynchronous processing, we would transition to CANCELLATION_PENDING.
   */
  async requestPolicyCancellation(
    policyId: string,
    reasonCode: string
  ): Promise<InsurancePolicy> {
    const policy = await this.prisma.insurancePolicy.findUnique({
      where: { id: policyId },
      include: { partner: true },
    });
    if (!policy) {
      throw new Error(`Policy not found: ${policyId}`);
    }

    if (policy.status === "CANCELLED" || policy.status === "EXPIRED") {
      return policy;
    }

    // Mark as requested
    const requestedPolicy = await this.prisma.insurancePolicy.update({
      where: { id: policy.id },
      data: {
        status: "CANCELLATION_REQUESTED",
        cancellation_reason_code: reasonCode,
      },
    });

    const adapter = this.adapterRegistry.resolve(policy.partner.adapter_key);
    if (!adapter) {
      throw new Error(`Adapter not found for partner: ${policy.partner_id}`);
    }

    try {
      // The MockInsuranceAdapter returns a cancelled policy synchronously
      const result = await adapter.cancelPolicy(
        {
          policyId: policy.id,
          externalPolicyId: policy.external_policy_id!,
          bookingId: policy.booking_id,
          productCode: "MOCK", // Simplification for adapter
          status: policy.status as any,
          premium: { amountMinor: Math.round(Number(policy.premium_amount) * 100), currency: policy.currency },
          coverageStart: policy.coverage_start,
          coverageEnd: policy.coverage_end,
        },
        { code: reasonCode }
      );

      if (result.status === "CANCELLED") {
        const cancelledPolicy = await this.prisma.insurancePolicy.update({
          where: { id: policy.id },
          data: {
            status: "CANCELLED",
            cancelled_at: result.cancelledAt ?? new Date(),
          },
        });

        // Record Refund if cancelled before start?
        // Slice B requires "Refund Boundary: Cancellation and refund are separate state machines."
        // We just record the refund boundary logic in FinanceLedger if applicable.
        const now = new Date();
        if (now < policy.coverage_start) {
          await this.financeService.recordPremiumRefund(cancelledPolicy);
        }
        
        return cancelledPolicy;
      } else {
        // If the adapter returns PENDING or similar
        return await this.prisma.insurancePolicy.update({
          where: { id: policy.id },
          data: {
            status: "CANCELLATION_PENDING",
          },
        });
      }
    } catch (error) {
      const isRejected = error instanceof InsuranceAdapterError && error.code === "ADAPTER_REJECTED";
      
      const failedPolicy = await this.prisma.insurancePolicy.update({
        where: { id: policy.id },
        data: {
          status: isRejected ? "CANCELLATION_REJECTED" : "CANCELLATION_FAILED",
        },
      });

      // Log exception
      await this.prisma.insuranceFinanceException.create({
        data: {
          policy_id: policy.id,
          exception_type: isRejected ? "CANCELLATION_REJECTED" : "CANCELLATION_FAILED",
          description: error instanceof Error ? error.message : "Unknown error during cancellation",
          status: "OPEN",
        }
      });

      throw error;
    }
  }
}
