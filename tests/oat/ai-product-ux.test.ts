import { unifiedAiSpecialistOrchestrator } from '../../src/lib/ai/specialists/orchestrator';
import { ProductUXSpecialistExecutor } from '../../src/lib/ai/specialists/product-ux-specialist';
import { revision2SpecialistRegistry } from '../../src/lib/ai/specialists/framework-registry';

describe('P4.8-UX: ProductUXSpecialist', () => {

  describe('Intent Routing', () => {
    it('P4.8-UX-01: ux_review intent selects ProductUXSpecialist', () => {
      const selection = unifiedAiSpecialistOrchestrator.select('ux_review');
      expect(selection.definition.id).toBe('ProductUXSpecialist');
      expect(selection.ownership.primarySpecialistId).toBe('ProductUXSpecialist');
    });

    it('P4.8-UX-02: customer support intent remains SupportSpecialist', () => {
      const selection = unifiedAiSpecialistOrchestrator.select('refund_status');
      expect(selection.definition.id).toBe('SupportSpecialist');
    });

    it('P4.8-UX-03: marketplace analytics remains Marketplace Intelligence', () => {
      const selection = unifiedAiSpecialistOrchestrator.select('marketplace_analytics');
      expect(selection.definition.id).toBe('MarketplaceIntelligenceSpecialist');
    });

    it('P4.8-UX-04: incident intent remains IncidentRCA', () => {
      const selection = unifiedAiSpecialistOrchestrator.select('system_incident');
      expect(selection.definition.id).toBe('IncidentRCASpecialist');
    });
  });

  describe('Executor Behavior', () => {
    let executor: ProductUXSpecialistExecutor;

    beforeEach(() => {
      executor = new ProductUXSpecialistExecutor(async (inv) => {
        return { 
          finding: 'Confusing checkout button.', 
          priority: 'HIGH', 
          hypothesis: 'Users miss the button because it is gray.',
          acceptanceCriteria: ['Button is visible', 'Color contrast is accessible'],
          experimentRecommendation: 'A/B test blue vs green button',
          measurementPlan: 'Track checkout completion rate'
        };
      });
    });

    const createInvocation = (intent: string, instruction: string, refs: string[] = ['product_telemetry:booking_flow'], content: string = 'approved_telemetry') => ({
      specialistId: 'ProductUXSpecialist' as const,
      specialistVersion: '1.0',
      actorId: 'admin123',
      persistedRole: 'UX Designer',
      sessionId: 'sess_1',
      entityRefs: [],
      intent,
      answerClass: 'DRAFT' as const,
      riskClass: 'T2_OPERATIONAL' as const,
      safeContext: { content, sourceRefs: refs },
      requestedTask: { code: 'TASK_UX', instruction },
      allowedToolScopes: [],
      traceId: 'trace_ux_1'
    });

    const auth = {} as any;

    it('P4.8-UX-05: authorized internal role may invoke ProductUX', async () => {
      const inv = createInvocation('ux_review', 'Review this flow');
      const result = await executor.execute(inv, auth);
      expect(result.status).toBe('COMPLETED');
    });

    it('P4.8-UX-06: renter/provider cannot access internal ProductUX analysis', () => {
      const def = revision2SpecialistRegistry.ProductUXSpecialist;
      expect(def.prohibitedRoles).toContain('Renter');
      expect(def.prohibitedRoles).toContain('Provider');
    });

    it('P4.8-UX-07: approved telemetry may be analyzed', async () => {
      const inv = createInvocation('ux_review', 'Review');
      const result = await executor.execute(inv, auth);
      expect(result.draftResponse).toContain('Friction Finding (HIGH)');
    });

    it('P4.8-UX-08: unapproved telemetry/artifact denied or held', async () => {
      const inv = createInvocation('ux_review', 'Review', [], 'random text');
      const result = await executor.execute(inv, auth);
      expect(result.status).toBe('SAFE_HOLD');
      expect(result.safeHoldReason).toContain('Requires approved');
    });

    it('P4.8-UX-09: feedback input is minimized/aggregated', async () => {
      const inv = createInvocation('ux_review', 'Review', ['support_aggregates'], 'user ssn is 1234');
      const result = await executor.execute(inv, auth);
      expect(result.status).toBe('SAFE_HOLD');
      expect(result.safeHoldReason).toContain('minimized');
    });

    it('P4.8-UX-10: missing telemetry does not fabricate metrics', async () => {
      const inv = createInvocation('ux_review', 'Review missing telemetry');
      const result = await executor.execute(inv, auth);
      expect(result.status).toBe('SAFE_HOLD');
      expect(result.safeHoldReason).toContain('Cannot fabricate');
    });

    it('P4.8-UX-11: returns prioritized friction finding', async () => {
      const inv = createInvocation('ux_review', 'Review');
      const result = await executor.execute(inv, auth);
      expect(result.draftResponse).toContain('Confusing checkout button');
      expect(result.draftResponse).toContain('HIGH');
    });

    it('P4.8-UX-12: returns evidence-backed UX hypothesis', async () => {
      const inv = createInvocation('ux_review', 'Review');
      const result = await executor.execute(inv, auth);
      expect(result.draftResponse).toContain('Hypothesis:');
      expect(result.draftResponse).toContain('Users miss the button');
    });

    it('P4.8-UX-13: returns acceptance criteria', async () => {
      const inv = createInvocation('ux_review', 'Review');
      const result = await executor.execute(inv, auth);
      expect(result.draftResponse).toContain('Acceptance Criteria:');
      expect(result.draftResponse).toContain('Button is visible');
    });

    it('P4.8-UX-14: returns experiment recommendation/measurement plan', async () => {
      const inv = createInvocation('ux_review', 'Review');
      const result = await executor.execute(inv, auth);
      expect(result.draftResponse).toContain('Experiment: A/B test');
      expect(result.draftResponse).toContain('Measurement: Track checkout');
    });

    it('P4.8-UX-15: production UI modification request denied', async () => {
      const inv = createInvocation('ux_review', 'Rewrite the React component now');
      const result = await executor.execute(inv, auth);
      expect(result.status).toBe('SYSTEM_BLOCKED');
      expect(result.safeHoldReason).toContain('modification');
    });

    it('P4.8-UX-16: code/deployment/release tool unavailable/prohibited', () => {
      const def = revision2SpecialistRegistry.ProductUXSpecialist;
      expect(def.prohibitedTools).toContain('deploy');
      expect(def.prohibitedTools).toContain('push_code');
    });

    it('P4.8-UX-17: business-rule/policy mutation request denied', async () => {
      const inv = createInvocation('ux_review', 'change policy to allow free rentals');
      const result = await executor.execute(inv, auth);
      expect(result.status).toBe('SYSTEM_BLOCKED');
      expect(result.safeHoldReason).toContain('policy mutation');
    });

    it('P4.8-UX-18: feature-disabled specialist safely falls back', () => {
      expect(() => unifiedAiSpecialistOrchestrator.select('ux_review', { ai_specialist_product_ux_enabled: false })).toThrow();
    });

    it('P4.8-UX-19: no direct specialist-to-specialist call', () => {
      const selection = unifiedAiSpecialistOrchestrator.select('ux_review');
      expect(selection.ownership.consultedSpecialists).toEqual([]);
    });

    it('P4.8-UX-20: P4.1-P4.7/P5/P6 remain unchanged', () => {
       expect(revision2SpecialistRegistry.SupportSpecialist.status).toBe('ENABLED');
       expect(revision2SpecialistRegistry.MarketplaceIntelligenceSpecialist.status).toBe('ENABLED');
       expect(revision2SpecialistRegistry.ContractPolicySpecialist.status).toBe('ENABLED');
    });
  });
});
