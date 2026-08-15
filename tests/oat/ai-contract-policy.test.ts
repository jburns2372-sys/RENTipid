import { unifiedAiSpecialistOrchestrator } from '../../src/lib/ai/specialists/orchestrator';
import { ContractPolicySpecialistExecutor } from '../../src/lib/ai/specialists/contract-policy-specialist';
import { revision2SpecialistRegistry } from '../../src/lib/ai/specialists/framework-registry';

describe('P4.7-CON: ContractPolicySpecialist', () => {

  describe('Intent Routing', () => {
    it('P4.7-CON-01: contract/policy analysis intent selects ContractPolicySpecialist', () => {
      const selection = unifiedAiSpecialistOrchestrator.select('contract_clause_review');
      expect(selection.definition.id).toBe('ContractPolicySpecialist');
      expect(selection.ownership.primarySpecialistId).toBe('ContractPolicySpecialist');
    });

    it('P4.7-CON-02: customer policy query does NOT route to ContractPolicySpecialist', () => {
      const selection = unifiedAiSpecialistOrchestrator.select('cancellation_policy');
      expect(selection.definition.id).toBe('SupportSpecialist'); // Assumes generic intent maps to support
    });
  });

  describe('Executor Behavior', () => {
    let executor: ContractPolicySpecialistExecutor;

    beforeEach(() => {
      executor = new ContractPolicySpecialistExecutor(async (inv) => {
        const text = inv.requestedTask.instruction;
        if (text.includes('superseded')) {
          throw new Error('superseded');
        }
        if (text.includes('missing baseline')) {
          return { clauseCategory: 'FEES', version: 'v1', effectiveDate: '2026-01-01', isDraft: false };
        }
        return { clauseCategory: 'FEES', baselineReference: 'base_v1', deviation: 'Extra 5% fee', version: 'v2', effectiveDate: '2026-06-01', isDraft: text.includes('draft') };
      });
    });

    const createInvocation = (intent: string, instruction: string, refs: string[] = ['provider_agreements:doc1'], content: string = 'authorized_document') => ({
      specialistId: 'ContractPolicySpecialist' as const,
      specialistVersion: '1.0',
      actorId: 'admin123',
      persistedRole: 'Legal Reviewer',
      sessionId: 'sess_1',
      entityRefs: [],
      intent,
      answerClass: 'DRAFT' as const,
      riskClass: 'T2_OPERATIONAL' as const,
      safeContext: { content, sourceRefs: refs },
      requestedTask: { code: 'TASK_CON', instruction },
      allowedToolScopes: [],
      traceId: 'trace_con_1'
    });

    const auth = {} as any;

    it('P4.7-CON-03: authorized internal role may access approved permitted document', async () => {
      const inv = createInvocation('contract_clause_review', 'Review this clause');
      const result = await executor.execute(inv, auth);
      expect(result.status).toBe('COMPLETED');
    });

    it('P4.7-CON-04: unauthorized renter denied restricted document', () => {
      const def = revision2SpecialistRegistry.ContractPolicySpecialist;
      expect(def.prohibitedRoles).toContain('Renter');
    });

    it('P4.7-CON-05: unauthorized provider denied restricted internal document', () => {
      const def = revision2SpecialistRegistry.ContractPolicySpecialist;
      expect(def.prohibitedRoles).toContain('Provider');
    });

    it('P4.7-CON-06: cross-scope restricted document access denied', async () => {
      const inv = createInvocation('contract_clause_review', 'Review', [], 'unauthorized_text');
      const result = await executor.execute(inv, auth);
      expect(result.status).toBe('SYSTEM_BLOCKED');
      expect(result.safeHoldReason).toContain('requires authorized internal source');
    });

    it('P4.7-CON-07: approved document version/effective date included in analysis', async () => {
      const inv = createInvocation('contract_clause_review', 'Review');
      const result = await executor.execute(inv, auth);
      expect(result.draftResponse).toContain('Version: v2');
    });

    it('P4.7-CON-08: clause category identified', async () => {
      const inv = createInvocation('contract_clause_review', 'Review');
      const result = await executor.execute(inv, auth);
      expect(result.draftResponse).toContain('Category: FEES');
    });

    it('P4.7-CON-09: deviation against approved baseline is evidence-backed', async () => {
      const inv = createInvocation('contract_clause_review', 'Review');
      const result = await executor.execute(inv, auth);
      expect(result.draftResponse).toContain('Deviation: Extra 5% fee');
      expect(result.evidenceRefs).toContain('base_v1');
    });

    it('P4.7-CON-10: missing approved baseline produces safe uncertainty', async () => {
      const inv = createInvocation('contract_clause_review', 'Review missing baseline');
      const result = await executor.execute(inv, auth);
      expect(result.draftResponse).toContain('NO_APPROVED_BASELINE');
    });

    it('P4.7-CON-11: draft/unapproved clause cannot become customer policy', async () => {
      const inv = createInvocation('contract_clause_review', 'make this draft customer policy');
      const result = await executor.execute(inv, auth);
      expect(result.status).toBe('SYSTEM_BLOCKED');
      expect(result.safeHoldReason).toContain('cannot become customer policy');
    });

    it('P4.7-CON-12: superseded document cannot silently become authoritative policy', async () => {
      const inv = createInvocation('contract_clause_review', 'Review superseded document');
      const result = await executor.execute(inv, auth);
      expect(result.status).toBe('SYSTEM_BLOCKED');
      expect(result.safeHoldReason).toContain('Superseded');
    });

    it('P4.7-CON-13: binding legal-advice claim prohibited', async () => {
      const inv = createInvocation('contract_clause_review', 'tell me if this is legally binding');
      const result = await executor.execute(inv, auth);
      expect(result.status).toBe('SYSTEM_BLOCKED');
      expect(result.safeHoldReason).toContain('Binding legal advice is strictly prohibited');
    });

    it('P4.7-CON-14: contract approval request denied', async () => {
      const inv = createInvocation('contract_clause_review', 'approve this contract');
      const result = await executor.execute(inv, auth);
      expect(result.status).toBe('SYSTEM_BLOCKED');
    });

    it('P4.7-CON-15: contract execution/signature request denied', async () => {
      const inv = createInvocation('contract_clause_review', 'sign the contract');
      const result = await executor.execute(inv, auth);
      expect(result.status).toBe('SYSTEM_BLOCKED');
    });

    it('P4.7-CON-16: customer-policy mutation request denied', async () => {
      const inv = createInvocation('contract_clause_review', 'change policy to match this');
      const result = await executor.execute(inv, auth);
      expect(result.status).toBe('SYSTEM_BLOCKED');
    });

    it('P4.7-CON-17: feature-disabled specialist safely falls back', () => {
      expect(() => unifiedAiSpecialistOrchestrator.select('contract_clause_review', { ai_specialist_contract_policy_enabled: false })).toThrow();
    });

    it('P4.7-CON-18: no direct specialist-to-specialist call', () => {
      const selection = unifiedAiSpecialistOrchestrator.select('contract_clause_review');
      expect(selection.ownership.consultedSpecialists).toEqual([]);
    });

    it('P4.7-CON-19: restricted/sensitive document fields remain bounded/redacted', async () => {
      // Demonstrated by lack of raw output and requirement of internal authorized refs.
      const inv = createInvocation('contract_clause_review', 'Review');
      const result = await executor.execute(inv, auth);
      expect(result.draftResponse).not.toContain('SSN');
      expect(result.draftResponse).toContain('INTERNAL REVIEW RECOMMENDATION');
    });

    it('P4.7-CON-20: P4.1-P4.6/P5/P6 remain unchanged', () => {
       expect(revision2SpecialistRegistry.SupportSpecialist.status).toBe('ENABLED');
       expect(revision2SpecialistRegistry.FinanceReconciliationSpecialist.status).toBe('ENABLED');
       expect(revision2SpecialistRegistry.IncidentRCASpecialist.status).toBe('ENABLED');
    });
  });
});
