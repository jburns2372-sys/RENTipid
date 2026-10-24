// AI Health Checks and Circuit Breaker Foundation

export type ProviderHealthState = 'healthy' | 'degraded' | 'down';

export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly threshold = 5;
  private readonly resetTimeout = 60000; // 60 seconds

  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
  }

  recordSuccess() {
    this.failureCount = 0;
  }

  isOpen(): boolean {
    if (this.failureCount >= this.threshold) {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        // Half-open state
        this.failureCount = this.threshold - 1;
        return false;
      }
      return true;
    }
    return false;
  }
}

export class AiHealthService {
  private static instance = new AiHealthService();
  private circuitBreaker = new CircuitBreaker();
  private providerState: ProviderHealthState = 'healthy';

  static getInstance() {
    return this.instance;
  }

  async checkProviderHealth(): Promise<ProviderHealthState> {
    if (this.circuitBreaker.isOpen()) {
      return 'down';
    }
    return this.providerState;
  }

  reportProviderFailure() {
    this.circuitBreaker.recordFailure();
    if (this.circuitBreaker.isOpen()) {
      this.providerState = 'down';
    } else {
      this.providerState = 'degraded';
    }
  }

  reportProviderSuccess() {
    this.circuitBreaker.recordSuccess();
    this.providerState = 'healthy';
  }
}
