import { PrismaClient, InsurancePolicy, InsuranceReconciliationLog } from "@prisma/client";

export class InsuranceReconciliationService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Reconciles internal issued policies against partner-provided policy data.
   * Creates an InsuranceReconciliationLog entry for each policy processed.
   * Can be run via cron or admin on-demand.
   */
  async reconcileBatch(
    partnerId: string,
    batchReference: string,
    partnerData: Array<{
      externalPolicyId: string;
      premiumAmountMinor: number;
      currency: string;
      status: string;
    }>
  ) {
    const logs: InsuranceReconciliationLog[] = [];

    for (const record of partnerData) {
      const policy = await this.prisma.insurancePolicy.findFirst({
        where: {
          partner_id: partnerId,
          external_policy_id: record.externalPolicyId,
        },
      });

      if (!policy) {
        // Missing internal
        const log = await this.prisma.insuranceReconciliationLog.create({
          data: {
            partner_id: partnerId,
            batch_reference: batchReference,
            partner_amount_minor: record.premiumAmountMinor,
            currency: record.currency,
            classification: "MISSING_INTERNAL",
            status: "PENDING",
          },
        });
        logs.push(log);
        continue;
      }

      const internalAmountMinor = Math.round(Number(policy.premium_amount) * 100);
      let classification = "MATCHED";

      if (internalAmountMinor !== record.premiumAmountMinor) {
        classification = "AMOUNT_MISMATCH";
      } else if (policy.currency !== record.currency) {
        classification = "CURRENCY_MISMATCH";
      } else if (policy.status !== record.status) {
        classification = "STATUS_MISMATCH";
      }

      const log = await this.prisma.insuranceReconciliationLog.create({
        data: {
          partner_id: partnerId,
          policy_id: policy.id,
          batch_reference: batchReference,
          internal_amount_minor: internalAmountMinor,
          partner_amount_minor: record.premiumAmountMinor,
          currency: policy.currency,
          classification,
          status: classification === "MATCHED" ? "RESOLVED" : "PENDING",
        },
      });
      logs.push(log);

      // If there's a mismatch, log a finance exception
      if (classification !== "MATCHED") {
        await this.prisma.insuranceFinanceException.create({
          data: {
            policy_id: policy.id,
            exception_type: classification,
            description: `Reconciliation discrepancy: ${classification}`,
            status: "OPEN",
          },
        });
      }
    }

    // Identify MISSING_PARTNER (Internal policies not present in partner data for this batch)
    // In a real system, you'd scope this to the timeframe of the batch.
    
    return logs;
  }
}
