const mockRetrieveApprovedKnowledge = jest.fn();

jest.mock('../../src/lib/ai/context/knowledge-retrieval', () => ({
  retrieveApprovedKnowledge: (...args: unknown[]) => mockRetrieveApprovedKnowledge(...args)
}));

import { processAICommand } from '../../src/lib/ai/ai-command-layer';

describe('AI-OAT-KNOWLEDGE-FLOW', () => {
  it('AI-OAT-KNOWLEDGE-008: retrieved knowledge reaches the mock provider input', async () => {
    const approvedKnowledge = 'FLOW_SENTINEL: approved provider onboarding guidance';
    mockRetrieveApprovedKnowledge.mockResolvedValueOnce(approvedKnowledge);

    const response = await processAICommand({
      botId: 'Concierge' as any,
      prompt: 'Tell me about provider onboarding',
      module: 'Help',
      userRole: 'RENTER'
    });

    expect(mockRetrieveApprovedKnowledge).toHaveBeenCalledWith(
      'Tell me about provider onboarding',
      'RENTER'
    );
    expect(response.message).toContain(approvedKnowledge);
  });
});
