import { PrismaClient, InsurancePolicy } from "@prisma/client";

export class InsuranceFinanceService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Records the premium collection for an issued insurance policy in the FinanceLedger.
   * This operates immutably based on the policy ID and premium amount.
   */
  async recordPremiumCollection(policy: InsurancePolicy, transactionId?: string): Promise<void> {
    const idempotencyKey = `premium-${policy.id}`;

    await this.prisma.financeLedger.upsert({
      where: { idempotency_key: idempotencyKey },
      update: {},
      create: {
        booking_id: policy.booking_id,
        transaction_type: "Insurance Premium",
        amount: Number(policy.premium_amount),
        amount_minor: Math.round(Number(policy.premium_amount) * 100),
        currency: policy.currency,
        balance_type: "Credit",
        description: `Premium for policy ${policy.external_policy_id}`,
        idempotency_key: idempotencyKey,
        source_reference: transactionId,
        policy_id: policy.id,
      },
    });
  }

  /**
   * Records a premium refund when a policy is cancelled before coverage begins.
   */
  async recordPremiumRefund(policy: InsurancePolicy, transactionId?: string): Promise<void> {
    const idempotencyKey = `refund-${policy.id}`;

    await this.prisma.financeLedger.upsert({
      where: { idempotency_key: idempotencyKey },
      update: {},
      create: {
        booking_id: policy.booking_id,
        transaction_type: "Insurance Refund",
        amount: Number(policy.premium_amount),
        amount_minor: Math.round(Number(policy.premium_amount) * 100),
        currency: policy.currency,
        balance_type: "Debit",
        description: `Refund for cancelled policy ${policy.external_policy_id}`,
        idempotency_key: idempotencyKey,
        source_reference: transactionId,
        policy_id: policy.id,
      },
    });
  }
}
