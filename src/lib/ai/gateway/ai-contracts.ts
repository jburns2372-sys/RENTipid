export interface AiProviderAdapter {
  initializeSession(context: AiSessionContext): Promise<AiSessionResult>;
  sendAudio?(audioBlob: Buffer): Promise<void>;
  receiveAudio?(callback: (audioBlob: Buffer) => void): void;
  closeSession(sessionId: string): Promise<void>;
}

export interface AiSessionContext {
  userId?: string;
  conversationId: string;
  channel: 'help' | 'digital_human' | 'contextual' | 'pwa';
  locale: string;
}

export interface AiSessionResult {
  providerSessionId: string;
  expiresAt: Date;
  metadata?: Record<string, any>;
}

export interface AiToolRequest {
  toolName: string;
  parameters: Record<string, any>;
  requestFingerprint: string;
}

export interface AiToolResponse {
  toolName: string;
  status: 'success' | 'failed' | 'blocked' | 'pending_confirmation';
  resultData?: any;
  error?: string;
}
