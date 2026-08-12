import { AiSessionContext } from '../../src/lib/ai/gateway/ai-contracts';

export const mockAiFixtures = {
  getValidSessionContext(): AiSessionContext {
    return {
      userId: 'test-user-id',
      conversationId: 'test-conv-id',
      channel: 'help',
      locale: 'en'
    };
  },

  getMockToolRequest() {
    return {
      toolName: 'cancelBooking',
      parameters: { bookingId: 'bk-123' },
      requestFingerprint: 'req-fingerprint-999'
    };
  }
};
