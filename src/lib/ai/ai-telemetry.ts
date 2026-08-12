// AI Cost/Usage Telemetry and Limits Foundation

export interface UsageTelemetryData {
  sessionId: string;
  provider: string;
  tokensUsed: number;
  durationMs: number;
  costEstimate: number;
}

export class AiTelemetryService {
  private static instance = new AiTelemetryService();
  private sessionLimits = new Map<string, number>();
  
  // Default limits (e.g., max 10000 tokens per session)
  private readonly DEFAULT_SESSION_TOKEN_LIMIT = 10000;

  static getInstance() {
    return this.instance;
  }

  recordUsage(data: UsageTelemetryData) {
    const currentUsage = this.sessionLimits.get(data.sessionId) || 0;
    this.sessionLimits.set(data.sessionId, currentUsage + data.tokensUsed);

    // In a real implementation, write to AuditLog or structured log drain
    console.log(`[AI_TELEMETRY] Session ${data.sessionId} - Tokens: ${data.tokensUsed}, Cost: ${data.costEstimate}`);
  }

  checkSessionLimit(sessionId: string): boolean {
    const currentUsage = this.sessionLimits.get(sessionId) || 0;
    return currentUsage < this.DEFAULT_SESSION_TOKEN_LIMIT;
  }

  clearSessionLimit(sessionId: string) {
    this.sessionLimits.delete(sessionId);
  }
}
