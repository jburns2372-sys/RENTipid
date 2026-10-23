import { AiProviderAdapter, AiSessionContext, AiSessionResult } from '../gateway/ai-contracts';

export class DigitalHumanProviderAdapter implements AiProviderAdapter {
  async initializeSession(context: AiSessionContext): Promise<AiSessionResult> {
    throw new Error('DigitalHumanProviderAdapter is pending credentials');
  }

  async closeSession(sessionId: string): Promise<void> {
    // implementation pending credentials
  }
}
