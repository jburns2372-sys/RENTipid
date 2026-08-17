const mockSupportExecute = jest.fn();

jest.mock('@/lib/ai/ai-permissions', () => ({ canUserAccessBot: () => true, MAX_ALLOWED_PERMISSION: 3 }));
jest.mock('@/lib/ai/ai-guardrails', () => ({ checkGuardrails: () => ({ isSafe: true }) }));
jest.mock('@/lib/ai/ai-context-builder', () => ({ buildSafeContext: async () => 'bounded context' }));
jest.mock('@/lib/ai/ai-prompts', () => ({ getSystemPrompt: () => 'bounded system prompt' }));
jest.mock('@/lib/ai/context/knowledge-retrieval', () => ({
  retrieveApprovedKnowledgeEvidence: async () => ({
    classification: {
      kind: 'LIVE_RENTIPID_STATE',
      effectiveQuestion: 'Please show my booking status.',
      usedConversationContext: false,
      domains: ['Marketplace'],
    },
    matches: [],
    attempts: 0,
  }),
}));
jest.mock('@/lib/ai/mock-ai', () => ({
  processMockAIRequest: async () => ({
    message: 'Baseline-safe response',
    evidenceRefs: [],
    materialClaims: [],
    safelyUncertain: true,
  }),
}));
jest.mock('@/lib/ai/ai-logger', () => ({ logAIInteraction: jest.fn() }));
jest.mock('@/lib/ai/ai-settings-service', () => ({
  getAISettings: async () => ({
    globalEnabled: true,
    loggingEnabled: true,
    providerMode: 'mock',
    maxPermissionLevel: 3,
    specialistStates: { ai_specialist_support_enabled: false },
  }),
  isModuleAIEnabled: async () => true,
  isBotEnabled: async () => true,
}));
jest.mock('@/lib/ai/specialists/intent-resolver', () => ({ resolveIntent: () => 'booking_status' }));
jest.mock('@/lib/ai/authorization/actor', () => ({
  resolveCurrentAiActor: async () => ({ id: 'renter-001', role: 'Renter' }),
}));
jest.mock('@/lib/ai/authorization/domain-state', () => ({ resolveAiEntityHint: () => undefined }));
jest.mock('@/lib/ai/specialists/support-specialist', () => ({
  SupportSpecialistExecutor: jest.fn().mockImplementation(() => ({ execute: mockSupportExecute })),
}));
jest.mock('@/lib/security/detection/ai-guard', () => ({
  AIGuard: jest.fn().mockImplementation(() => ({
    checkPromptInjection: () => ({ blocked: false }),
    checkOutputProtection: (value: string) => ({ blocked: false, redactedOutput: value }),
  })),
}));
jest.mock('@/lib/security/detection/evaluator', () => ({ DetectionEvaluator: jest.fn() }));

import { processAICommand } from '@/lib/ai/ai-command-layer';

describe('disabled specialist baseline fallback', () => {
  test('returns normally without invoking a specialist and records bounded fallback authority', async () => {
    const result = await processAICommand({
      botId: 'RENTipid Concierge Bot',
      prompt: 'Please show my booking status.',
      module: 'Help',
      userId: 'renter-001',
      userRole: 'Renter',
    });
    expect(result).toMatchObject({ success: true, message: 'Baseline-safe response' });
    expect(result.trace).toMatchObject({
      selectedSpecialist: 'SupportSpecialist',
      selectedSpecialistStatus: 'DISABLED',
      fallbackStatus: 'FALLBACK',
      fallbackTarget: 'UNIFIED_AI_BASELINE',
      routingReasonCode: 'PRIMARY_SPECIALIST_DISABLED',
      policyOutcome: 'ALLOW_BASELINE_FALLBACK',
      supervisorStatus: 'NOT_RUN',
      resultStatus: 'COMPLETED',
      finalResponseOwner: 'UNIFIED_AI_COMMAND_LAYER',
      executedTools: [],
    });
    expect(mockSupportExecute).not.toHaveBeenCalled();
  });
});
