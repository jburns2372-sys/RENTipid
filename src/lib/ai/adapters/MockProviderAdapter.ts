import { AiProviderAdapter, AiSessionContext, AiSessionResult } from '../gateway/ai-contracts';

export class MockProviderAdapter implements AiProviderAdapter {
  private sessions = new Map<string, AiSessionContext>();

  async initializeSession(context: AiSessionContext): Promise<AiSessionResult> {
    const sessionId = `mock-session-${Date.now()}`;
    this.sessions.set(sessionId, context);
    
    return {
      providerSessionId: sessionId,
      expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour
      metadata: { mock: true, state: 'ready' }
    };
  }

  async sendAudio(audioBlob: Buffer): Promise<void> {
    // Mock processing audio
  }

  receiveAudio(callback: (audioBlob: Buffer) => void): void {
    // Mock returning audio
  }

  async closeSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }
}
