import {
  SpecialistFinding,
  SpecialistInvocationContract,
  SpecialistResultInput,
} from './contracts';
import { SpecialistExecutor, SpecialistInvocationAuthority } from './orchestrator';

export type FinanceReconciliationProvider = (
  invocation: Readonly<SpecialistInvocationContract>,
) => Promise<{ expectedAmount?: number; actualAmount?: number; currency?: string; tolerance?: number }>;

const mutationPattern =
  /\b(?:refund|payout|release deposit|change commission|mark complete|change settlement|adjust fee)\b.*\b(?:now|immediately|force|change|mutate|approve)\b/i;

const directMutationAttemptPattern =
  /^(?:refund|pay|change|adjust|mutate|release|settle)\b/i;

function blocked(reason: string, code: string = 'FINANCE_AUTHORITY_BLOCKED'): SpecialistResultInput {
  return {
    status: 'SYSTEM_BLOCKED',
    findings: [{ code, summary: reason, severity: 'HIGH' }],
    evidenceRefs: [],
    toolRequests: [],
    unresolvedFacts: [],
    safeHoldReason: reason,
  };
}

function safeHold(
  reason: string,
  unresolvedFacts: readonly string[],
  evidenceRefs: readonly string[],
): SpecialistResultInput {
  return {
    status: 'SAFE_HOLD',
    findings: [{ code: 'FINANCE_SAFE_HOLD', summary: reason, severity: 'MEDIUM' }],
    evidenceRefs,
    recommendedNextStep: 'Provide authoritative financial context to proceed with reconciliation.',
    toolRequests: [],
    unresolvedFacts,
    safeHoldReason: reason,
  };
}

/**
 * Logical P4.5 finance-reconciliation capability.
 *
 * This executor strictly performs read-only reconciliation of expected vs actual
 * authoritative financial amounts. It cannot guess balances, approve refunds, or
 * mutate financial state.
 */
export class FinanceReconciliationSpecialistExecutor implements SpecialistExecutor {
  constructor(private readonly provider: FinanceReconciliationProvider) {}

  async execute(
    invocation: Readonly<SpecialistInvocationContract>,
    _authority: SpecialistInvocationAuthority,
  ): Promise<SpecialistResultInput> {
    if (invocation.specialistId !== 'FinanceReconciliationSpecialist') {
      throw new Error('FINANCE_RECONCILIATION_SPECIALIST_INVOCATION_REQUIRED');
    }

    if (
      mutationPattern.test(invocation.requestedTask.instruction) ||
      directMutationAttemptPattern.test(invocation.requestedTask.instruction)
    ) {
      return blocked('Unapproved refund or financial mutation request is denied.', 'FINANCIAL_MUTATION_DENIED');
    }

    // Must have some valid transaction/finance references to reconcile
    const validRefs = invocation.safeContext.sourceRefs.filter(ref =>
      ref.includes('transaction_records') ||
      ref.includes('payout_records') ||
      ref.includes('refund_state') ||
      ref.includes('booking_pricing') ||
      ref.includes('transaction_') ||
      ref.includes('payment_')
    );

    if (validRefs.length === 0 && !invocation.safeContext.content.includes('authoritative')) {
      return safeHold(
        'Finance Reconciliation requires valid authoritative transaction or payment context.',
        ['Missing authoritative financial records.'],
        invocation.safeContext.sourceRefs,
      );
    }

    const findings: SpecialistFinding[] = [
      {
        code: 'FINANCE_INTENT_CLASSIFIED',
        summary: `Validated intent: ${invocation.intent}`,
        severity: 'INFO',
      }
    ];

    let financeData;
    try {
      financeData = await this.provider(invocation);
    } catch (e: any) {
      return blocked(`Reconciliation failed: ${e.message}`);
    }

    if (financeData.expectedAmount === undefined || financeData.actualAmount === undefined) {
       return safeHold(
        'Missing authoritative expected or actual amount. Cannot estimate or guess financial state.',
        ['Missing exact authoritative expected amount or actual amount.'],
        validRefs,
      );
    }

    const expectedAmount = financeData.expectedAmount;
    const actualAmount = financeData.actualAmount;
    const difference = Math.abs(expectedAmount - actualAmount);
    const tolerance = financeData.tolerance ?? 0;
    const withinTolerance = difference <= tolerance;

    let discrepancyClassification = 'NO_DISCREPANCY';
    if (!withinTolerance) {
      if (actualAmount === 0 && expectedAmount > 0) discrepancyClassification = 'MISSING_TRANSACTION';
      else if (actualAmount > expectedAmount && actualAmount % expectedAmount === 0) discrepancyClassification = 'DUPLICATE_TRANSACTION';
      else if (actualAmount < expectedAmount && actualAmount > 0) discrepancyClassification = 'PARTIAL_REFUND'; // or partial payment
      else discrepancyClassification = 'UNKNOWN'; // generalized mismatch
    }

    findings.push({
      code: 'RECONCILIATION_COMPLETED',
      summary: `Expected: ${expectedAmount}, Actual: ${actualAmount}, Difference: ${difference}. Classification: ${discrepancyClassification}`,
      severity: withinTolerance ? 'INFO' : 'HIGH',
    });

    return {
      status: 'COMPLETED',
      findings,
      evidenceRefs: [...validRefs],
      recommendedNextStep: withinTolerance 
        ? 'Reconciliation successful within tolerance.' 
        : 'Investigate discrepancy using authoritative CRM/finance tools.',
      toolRequests: [],
      unresolvedFacts: [],
      draftResponse: `Reconciliation result: Expected ${expectedAmount}, Actual ${actualAmount}. Difference: ${difference}. Classification: ${discrepancyClassification}`,
      metrics: {
        'transactions_reconciled': 1
      }
    };
  }
}
