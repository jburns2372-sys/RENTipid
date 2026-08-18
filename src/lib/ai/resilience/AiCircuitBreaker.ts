export class AiCircuitBreaker {
  private static instance = new AiCircuitBreaker();
  private errorCounts: Record<string, number> = {};
  private sessionUsage: Record<string, number> = {};
  
  private MAX_ERRORS = 3;
  private MAX_SESSION_COST = 50; // Arbitrary units for mock

  static getInstance() {
    return this.instance;
  }

  // Cost & Usage Controls
  recordUsage(sessionId: string, cost: number) {
    this.sessionUsage[sessionId] = (this.sessionUsage[sessionId] || 0) + cost;
    if (this.sessionUsage[sessionId] > this.MAX_SESSION_COST) {
      throw new Error('USAGE_LIMIT_EXCEEDED: Session cost limit reached');
    }
  }

  getUsage(sessionId: string): number {
    return this.sessionUsage[sessionId] || 0;
  }

  // Provider Outage & Circuit Breaking
  recordError(provider: string) {
    this.errorCounts[provider] = (this.errorCounts[provider] || 0) + 1;
  }

  resetError(provider: string) {
    this.errorCounts[provider] = 0;
  }

  isCircuitOpen(provider: string): boolean {
    return (this.errorCounts[provider] || 0) >= this.MAX_ERRORS;
  }

  async executeWithFallback<T>(
    provider: string,
    primaryTask: () => Promise<T>,
    fallbackTask: () => Promise<T>
  ): Promise<T> {
    if (this.isCircuitOpen(provider)) {
      return fallbackTask();
    }

    try {
      const result = await primaryTask();
      this.resetError(provider); // Success resets breaker
      return result;
    } catch (e) {
      this.recordError(provider);
      return fallbackTask(); // Execute fallback on error
    }
  }
}
