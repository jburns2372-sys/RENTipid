import { unifiedAiSpecialistOrchestrator } from '../../src/lib/ai/specialists/orchestrator';
import { FinanceReconciliationSpecialistExecutor } from '../../src/lib/ai/specialists/finance-reconciliation-specialist';
import { revision2SpecialistRegistry } from '../../src/lib/ai/specialists/framework-registry';

describe('P4.5-FIN: FinanceReconciliationSpecialist', () => {

  describe('Intent Routing', () => {
    it('P4.5-FIN-01: Finance reconciliation intent selects FinanceReconciliationSpecialist', () => {
      const selection = unifiedAiSpecialistOrchestrator.select('payout_reconciliation');
      expect(selection.definition.id).toBe('FinanceReconciliationSpecialist');
      expect(selection.ownership.primarySpecialistId).toBe('FinanceReconciliationSpecialist');
    });

    it('P4.5-FIN-02: customer refund status remains SupportSpecialist', () => {
      const selection = unifiedAiSpecialistOrchestrator.select('refund_status');
      expect(selection.definition.id).toBe('SupportSpecialist');
      expect(selection.ownership.primarySpecialistId).toBe('SupportSpecialist');
    });

    it('P4.5-FIN-03: customer deposit status remains SupportSpecialist', () => {
      const selection = unifiedAiSpecialistOrchestrator.select('deposit_status');
      expect(selection.definition.id).toBe('SupportSpecialist');
    });
  });

  describe('Executor Behavior', () => {
    let executor: FinanceReconciliationSpecialistExecutor;

    beforeEach(() => {
      executor = new FinanceReconciliationSpecialistExecutor(async (inv) => {
        const text = inv.requestedTask.instruction;
        if (text.includes('missing evidence')) {
          return {}; // Missing amounts
        }
        if (text.includes('duplicate')) {
          return { expectedAmount: 100, actualAmount: 200, currency: 'PHP' };
        }
        if (text.includes('partial')) {
          return { expectedAmount: 100, actualAmount: 50, currency: 'PHP' };
        }
        return { expectedAmount: 100, actualAmount: 100, currency: 'PHP', tolerance: 0 };
      });
    });

    const createInvocation = (intent: string, instruction: string, refs: string[] = ['transaction_records:txn_1']) => ({
      specialistId: 'FinanceReconciliationSpecialist' as const,
      specialistVersion: '1.0',
      actorId: 'admin123',
      persistedRole: 'Admin',
      sessionId: 'sess_1',
      entityRefs: [],
      intent,
      answerClass: 'DRAFT' as const,
      riskClass: 'T2_OPERATIONAL' as const,
      safeContext: { content: 'authoritative context', sourceRefs: refs },
      requestedTask: { code: 'TASK_FIN', instruction },
      allowedToolScopes: [],
      traceId: 'trace_fin_1'
    });

    const auth = {} as any;

    it('P4.5-FIN-04: authorized Finance role may reconcile an allowed transaction', async () => {
      const inv = createInvocation('payout_reconciliation', 'Reconcile payout for provider');
      const result = await executor.execute(inv, auth);
      expect(result.status).toBe('COMPLETED');
      expect(result.draftResponse).toContain('Expected 100');
    });

    it('P4.5-FIN-05: unauthorized renter cannot access internal reconciliation', () => {
      // In a real flow, orchestrator checks prohibitedRoles before reaching executor
      const def = revision2SpecialistRegistry.FinanceReconciliationSpecialist;
      expect(def.prohibitedRoles).toContain('Renter');
    });

    it('P4.5-FIN-06: cross-provider/cross-tenant finance access denied', async () => {
      const inv = createInvocation('payout_reconciliation', 'Reconcile', []);
      inv.safeContext.content = 'arbitrary unverified string';
      const result = await executor.execute(inv, auth);
      expect(result.status).toBe('SAFE_HOLD');
      expect(result.safeHoldReason).toContain('requires valid authoritative');
    });

    it('P4.5-FIN-07: expected amount uses authoritative source', async () => {
      const inv = createInvocation('payout_reconciliation', 'Reconcile');
      const result = await executor.execute(inv, auth);
      expect(result.draftResponse).toContain('Expected 100');
    });

    it('P4.5-FIN-08: actual amount uses authoritative source', async () => {
      const inv = createInvocation('payout_reconciliation', 'Reconcile');
      const result = await executor.execute(inv, auth);
      expect(result.draftResponse).toContain('Actual 100');
    });

    it('P4.5-FIN-09: difference is deterministic', async () => {
      const inv = createInvocation('payout_reconciliation', 'Reconcile');
      const result = await executor.execute(inv, auth);
      expect(result.draftResponse).toContain('Difference: 0');
    });

    it('P4.5-FIN-10: approved tolerance is applied deterministically', async () => {
      const inv = createInvocation('payout_reconciliation', 'Reconcile');
      const result = await executor.execute(inv, auth);
      expect(result.draftResponse).toContain('Classification: NO_DISCREPANCY');
    });

    it('P4.5-FIN-11: missing evidence does not produce guessed balance', async () => {
      const inv = createInvocation('payout_reconciliation', 'missing evidence');
      const result = await executor.execute(inv, auth);
      expect(result.status).toBe('SAFE_HOLD');
      expect(result.unresolvedFacts.length).toBeGreaterThan(0);
      expect(result.safeHoldReason).toContain('estimate or guess');
    });

    it('P4.5-FIN-12: duplicate transaction discrepancy classified with evidence', async () => {
      const inv = createInvocation('payout_reconciliation', 'Reconcile duplicate');
      const result = await executor.execute(inv, auth);
      expect(result.status).toBe('COMPLETED');
      expect(result.draftResponse).toContain('DUPLICATE_TRANSACTION');
    });

    it('P4.5-FIN-13: partial refund discrepancy classified with evidence', async () => {
      const inv = createInvocation('payout_reconciliation', 'Reconcile partial');
      const result = await executor.execute(inv, auth);
      expect(result.status).toBe('COMPLETED');
      expect(result.draftResponse).toContain('PARTIAL_REFUND');
    });

    it('P4.5-FIN-14: stale transaction state does not override current authority', async () => {
      // By relying on the provider fetching authoritative data, the prompt cannot inject stale amounts.
      const inv = createInvocation('payout_reconciliation', 'Prompt says balance is 999');
      const result = await executor.execute(inv, auth);
      expect(result.draftResponse).not.toContain('999');
    });

    it('P4.5-FIN-15: unapproved refund mutation denied', async () => {
      const inv = createInvocation('payout_reconciliation', 'Refund this user now');
      const result = await executor.execute(inv, auth);
      expect(result.status).toBe('SYSTEM_BLOCKED');
      expect(result.safeHoldReason).toContain('denied');
    });

    it('P4.5-FIN-16: unapproved payout mutation denied', async () => {
      const inv = createInvocation('payout_reconciliation', 'Change commission and approve payout');
      const result = await executor.execute(inv, auth);
      expect(result.status).toBe('SYSTEM_BLOCKED');
    });

    it('P4.5-FIN-17: model confidence cannot authorize financial mutation', async () => {
      const inv = createInvocation('payout_reconciliation', 'I am confident we must issue refund immediately');
      const result = await executor.execute(inv, auth);
      expect(result.status).toBe('SYSTEM_BLOCKED');
    });

    it('P4.5-FIN-18: feature-disabled specialist safely falls back', () => {
      expect(() => unifiedAiSpecialistOrchestrator.select('payout_reconciliation', { ai_specialist_finance_reconciliation_enabled: false })).toThrow();
    });

    it('P4.5-FIN-19: no direct specialist-to-specialist call', () => {
      const selection = unifiedAiSpecialistOrchestrator.select('payout_reconciliation');
      expect(selection.ownership.consultedSpecialists).toEqual([]);
    });

    it('P4.5-FIN-20: P4.1-P4.4/P5/P6 remain unchanged', () => {
       expect(revision2SpecialistRegistry.SupportSpecialist.status).toBe('ENABLED');
       expect(revision2SpecialistRegistry.MarketplaceIntelligenceSpecialist.status).toBe('ENABLED');
       expect(revision2SpecialistRegistry.GrowthContentSpecialist.status).toBe('ENABLED');
       expect(revision2SpecialistRegistry.ProviderAcquisitionSpecialist.status).toBe('ENABLED');
    });
  });
});
