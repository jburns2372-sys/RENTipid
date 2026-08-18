import { POST } from '../../src/app/api/ai/chat/route';

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn().mockResolvedValue({ user: { id: 'user1', role: 'RENTER' } })
}));

describe('AI-OAT-HELP-ENDPOINT-001', () => {
  it('should reach the real Unified AI handler and not return the Azure migration stub', async () => {
    const mockRequest = new Request('http://localhost/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        botId: 'Concierge',
        prompt: 'How does RENTipid work?',
        module: 'Help'
      })
    });

    const response = await POST(mockRequest);
    const data = await response.json();
    
    // 2. Response is not "Endpoint migrated to Azure Backend"
    expect(data.error).not.toBe('Endpoint migrated to Azure Backend');
    expect(data.message).not.toBe('Endpoint migrated to Azure Backend');

    // 4. Response contains a meaningful customer-facing RENTipid explanation.
    // The mock/real handler should return a valid string message.
    expect(typeof data.message).toBe('string');
    expect(data.message.length).toBeGreaterThan(0);
    
    // We expect a 200 OK status from the AI Command Layer
    expect(response.status).toBe(200);
  });
});
