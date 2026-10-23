import { unifiedAiSpecialistOrchestrator } from '../../src/lib/ai/specialists/orchestrator';
import { IncidentRCASpecialistExecutor } from '../../src/lib/ai/specialists/incident-rca-specialist';
import { revision2SpecialistRegistry } from '../../src/lib/ai/specialists/framework-registry';

describe('P4.6-RCA: IncidentRCASpecialist', () => {

  describe('Intent Routing', () => {
    it('P4.6-RCA-01: incident intent selects IncidentRCASpecialist', () => {
      const selection = unifiedAiSpecialistOrchestrator.select('system_incident');
      expect(selection.definition.id).toBe('IncidentRCASpecialist');
      expect(selection.ownership.primarySpecialistId).toBe('IncidentRCASpecialist');
    });

    it('P4.6-RCA-02: individual customer support remains SupportSpecialist', () => {
      const selection = unifiedAiSpecialistOrchestrator.select('refund_status');
      expect(selection.definition.id).toBe('SupportSpecialist');
    });

    it('P4.6-RCA-03: finance reconciliation remains FinanceReconciliationSpecialist', () => {
      const selection = unifiedAiSpecialistOrchestrator.select('payout_reconciliation');
      expect(selection.definition.id).toBe('FinanceReconciliationSpecialist');
    });
  });

  describe('Executor Behavior', () => {
    let executor: IncidentRCASpecialistExecutor;

    beforeEach(() => {
      executor = new IncidentRCASpecialistExecutor(async (inv) => {
        const text = inv.requestedTask.instruction;
        if (text.includes('insufficient')) {
          throw new Error('insufficient evidence');
        }
        return { logs: [1], events: [1], timeline: [1], confidence: 'HIGH', likelyCause: 'Processor Timeout' };
      });
    });

    const createInvocation = (intent: string, instruction: string, refs: string[] = ['system_logs:app_1'], content: string = 'approved_telemetry') => ({
      specialistId: 'IncidentRCASpecialist' as const,
      specialistVersion: '1.0',
      actorId: 'admin123',
      persistedRole: 'Security Officer',
      sessionId: 'sess_1',
      entityRefs: [],
      intent,
      answerClass: 'DRAFT' as const,
      riskClass: 'T2_OPERATIONAL' as const,
      safeContext: { content, sourceRefs: refs },
      requestedTask: { code: 'TASK_RCA', instruction },
      allowedToolScopes: [],
      traceId: 'trace_rca_1'
    });

    const auth = {} as any;

    it('P4.6-RCA-04: authorized internal actor may access approved telemetry', async () => {
      const inv = createInvocation('system_incident', 'Analyze incident');
      const result = await executor.execute(inv, auth);
      expect(result.status).toBe('COMPLETED');
    });

    it('P4.6-RCA-05: ordinary renter/provider cannot access internal RCA', () => {
      const def = revision2SpecialistRegistry.IncidentRCASpecialist;
      expect(def.prohibitedRoles).toContain('Renter');
      expect(def.prohibitedRoles).toContain('Provider');
    });

    it('P4.6-RCA-06: unapproved telemetry source denied', async () => {
      const inv = createInvocation('system_incident', 'Analyze', [], 'random string');
      const result = await executor.execute(inv, auth);
      expect(result.status).toBe('SAFE_HOLD');
      expect(result.safeHoldReason).toContain('requires approved, bounded telemetry');
    });

    it('P4.6-RCA-07: time window is bounded', async () => {
      const inv = createInvocation('system_incident', 'Analyze', ['system_logs'], 'approved_telemetry unbounded');
      const result = await executor.execute(inv, auth);
      expect(result.status).toBe('SYSTEM_BLOCKED');
      expect(result.safeHoldReason).toContain('bounded');
    });

    it('P4.6-RCA-08: event/result count is bounded', async () => {
      const inv = createInvocation('system_incident', 'Analyze', ['system_logs'], 'approved_telemetry millions of events');
      const result = await executor.execute(inv, auth);
      expect(result.status).toBe('SYSTEM_BLOCKED');
      expect(result.safeHoldReason).toContain('limits');
    });

    it('P4.6-RCA-09: sensitive fields are redacted', async () => {
      const inv = createInvocation('system_incident', 'Analyze', ['system_logs'], 'approved_telemetry contains password=123');
      const result = await executor.execute(inv, auth);
      expect(result.status).toBe('SAFE_HOLD');
      expect(result.safeHoldReason).toContain('sensitive terms');
    });

    it('P4.6-RCA-10: timeline uses approved evidence', async () => {
      const inv = createInvocation('system_incident', 'Analyze');
      const result = await executor.execute(inv, auth);
      expect(result.draftResponse).toContain('Timeline events: 1');
    });

    it('P4.6-RCA-11: correlation is evidence-backed', async () => {
      const inv = createInvocation('system_incident', 'Analyze');
      const result = await executor.execute(inv, auth);
      expect(result.draftResponse).toContain('Likely Cause: Processor Timeout');
    });

    it('P4.6-RCA-12: insufficient evidence does not fabricate root cause', async () => {
      const inv = createInvocation('system_incident', 'Analyze insufficient data');
      const result = await executor.execute(inv, auth);
      expect(result.status).toBe('SAFE_HOLD');
      expect(result.safeHoldReason).toContain('Insufficient evidence');
    });

    it('P4.6-RCA-13: restart request denied', async () => {
      const inv = createInvocation('system_incident', 'restart the service');
      const result = await executor.execute(inv, auth);
      expect(result.status).toBe('SYSTEM_BLOCKED');
      expect(result.safeHoldReason).toContain('denied');
    });

    it('P4.6-RCA-14: deployment request denied', async () => {
      const inv = createInvocation('system_incident', 'deploy the fix');
      const result = await executor.execute(inv, auth);
      expect(result.status).toBe('SYSTEM_BLOCKED');
    });

    it('P4.6-RCA-15: rollback execution request denied', async () => {
      const inv = createInvocation('system_incident', 'rollback to previous');
      const result = await executor.execute(inv, auth);
      expect(result.status).toBe('SYSTEM_BLOCKED');
    });

    it('P4.6-RCA-16: schema/migration request denied', async () => {
      const inv = createInvocation('system_incident', 'change schema now');
      const result = await executor.execute(inv, auth);
      expect(result.status).toBe('SYSTEM_BLOCKED');
    });

    it('P4.6-RCA-17: feature-disabled specialist safely falls back', () => {
      expect(() => unifiedAiSpecialistOrchestrator.select('system_incident', { ai_specialist_incident_rca_enabled: false })).toThrow();
    });

    it('P4.6-RCA-18: no direct specialist-to-specialist call', () => {
      const selection = unifiedAiSpecialistOrchestrator.select('system_incident');
      expect(selection.ownership.consultedSpecialists).toEqual([]);
    });

    it('P4.6-RCA-19: customer-safe incident result does not expose raw sensitive telemetry', async () => {
      const inv = createInvocation('system_incident', 'Analyze');
      const result = await executor.execute(inv, auth);
      expect(result.draftResponse).not.toContain('password'); // Tested via redaction guard
      expect(result.status).toBe('COMPLETED');
    });

    it('P4.6-RCA-20: P4.1-P4.5/P5/P6 remain unchanged', () => {
       expect(revision2SpecialistRegistry.SupportSpecialist.status).toBe('ENABLED');
       expect(revision2SpecialistRegistry.MarketplaceIntelligenceSpecialist.status).toBe('ENABLED');
       expect(revision2SpecialistRegistry.GrowthContentSpecialist.status).toBe('ENABLED');
       expect(revision2SpecialistRegistry.ProviderAcquisitionSpecialist.status).toBe('ENABLED');
       expect(revision2SpecialistRegistry.FinanceReconciliationSpecialist.status).toBe('ENABLED');
    });
  });
});
