const mockRetrieveApprovedKnowledgeEvidence = jest.fn();

jest.mock('../../src/lib/ai/context/knowledge-retrieval', () => ({
  retrieveApprovedKnowledgeEvidence: (...args: unknown[]) => mockRetrieveApprovedKnowledgeEvidence(...args),
  tokenizeKnowledgeText: (value: string) => value.toLowerCase().match(/[a-z0-9]+/g) ?? [],
}));

import { processAICommand } from '../../src/lib/ai/ai-command-layer';

describe('AI-OAT-KNOWLEDGE-FLOW', () => {
  it('AI-OAT-KNOWLEDGE-008: retrieved knowledge reaches the mock provider input', async () => {
    const approvedKnowledge = 'FLOW_SENTINEL: approved provider onboarding guidance';
    mockRetrieveApprovedKnowledgeEvidence.mockResolvedValueOnce({
      classification: {
        kind: 'STATIC_RENTIPID_KNOWLEDGE',
        effectiveQuestion: 'Tell me about provider onboarding',
        usedConversationContext: false,
        domains: ['Core'],
      },
      matches: [{
        sourceKey: 'core.registration-onboarding',
        version: '1.0',
        sourceType: 'MANUAL',
        title: 'Provider onboarding',
        module: 'Core',
        topic: 'registration',
        chunkKey: 'provider-onboarding',
        headingPath: 'Provider onboarding',
        content: approvedKnowledge,
        score: 10,
        coverage: 1,
        attempt: 1,
      }],
      attempts: 1,
    });

    const response = await processAICommand({
      botId: 'Concierge' as any,
      prompt: 'Tell me about provider onboarding',
      module: 'Help',
      userRole: 'RENTER'
    });

    expect(mockRetrieveApprovedKnowledgeEvidence).toHaveBeenCalledWith(
      'Tell me about provider onboarding',
      'RENTER',
      [],
    );
    expect(response.message).toContain('approved provider onboarding guidance');
    expect(response.grounding?.evidenceRefs).toEqual([
      'knowledge:core.registration-onboarding:provider-onboarding',
    ]);
  });
});
