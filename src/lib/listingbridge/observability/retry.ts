export type FailureClassification = 'RETRYABLE' | 'FINAL_PROVIDER_ACTION' | 'FINAL_SECURITY_BLOCKED';

export interface RetryPolicy {
  readonly maxAttempts: number;
  readonly baseBackoffMs: number;
  readonly maxBackoffMs: number;
  readonly jitterFactor: number;
}

export const DEFAULT_LISTINGBRIDGE_RETRY_POLICY: RetryPolicy = Object.freeze({
  maxAttempts: 3,
  baseBackoffMs: 1000,
  maxBackoffMs: 10000,
  jitterFactor: 0.2,
});

export class ListingBridgeRetryEngine {
  constructor(private readonly policy: RetryPolicy = DEFAULT_LISTINGBRIDGE_RETRY_POLICY) {}

  /**
   * Classifies an error into retryable vs final terminal categories.
   */
  classifyFailure(error: unknown): FailureClassification {
    const errCode = (error as { code?: string })?.code || '';
    const errMsg = (error instanceof Error ? error.message : String(error)).toUpperCase();

    // 1. Security blocks are NEVER retried
    if (
      errCode === 'SSRF_BLOCKED' ||
      errCode === 'OWNERSHIP_MISMATCH' ||
      errCode === 'FORBIDDEN' ||
      errCode === 'UNAUTHORIZED' ||
      errMsg.includes('SSRF') ||
      errMsg.includes('OWNERSHIP') ||
      errMsg.includes('PROHIBITED')
    ) {
      return 'FINAL_SECURITY_BLOCKED';
    }

    // 2. Provider validation actions require human correction, not background retry
    if (
      errCode === 'RIGHTS_CONFIRMATION_REQUIRED' ||
      errCode === 'LOCATION_CONFLICT' ||
      errCode === 'DUPLICATE_BLOCKING' ||
      errMsg.includes('RIGHTS') ||
      errMsg.includes('CONFLICT') ||
      errMsg.includes('MISSING_REQUIRED')
    ) {
      return 'FINAL_PROVIDER_ACTION';
    }

    // 3. Transient network or upstream errors are retryable
    if (
      errCode === 'TIMEOUT' ||
      errCode === 'RATE_LIMITED' ||
      errMsg.includes('TIMEOUT') ||
      errMsg.includes('503') ||
      errMsg.includes('502') ||
      errMsg.includes('504') ||
      errMsg.includes('ECONNRESET') ||
      errMsg.includes('RATE LIMIT')
    ) {
      return 'RETRYABLE';
    }

    return 'FINAL_PROVIDER_ACTION';
  }

  /**
   * Computes deterministic backoff delay with bounded jitter.
   */
  calculateBackoffDelayMs(attemptNumber: number): number {
    if (attemptNumber <= 0) return 0;
    if (attemptNumber > this.policy.maxAttempts) return -1; // Exhausted

    const exponentialDelay = this.policy.baseBackoffMs * Math.pow(2, attemptNumber - 1);
    const clampedDelay = Math.min(exponentialDelay, this.policy.maxBackoffMs);
    const jitter = clampedDelay * this.policy.jitterFactor * 0.5;

    return Math.floor(clampedDelay + jitter);
  }

  /**
   * Evaluates if a job can safely recover from partial progress without duplicating media or drafts.
   */
  evaluatePartialProgressRecovery(jobState: {
    status: string;
    persistedFieldsCount: number;
    persistedAssetsCount: number;
    createdListingId?: string | null;
    attemptCount: number;
  }): {
    canResume: boolean;
    resumeStage: string;
    shouldReuseCreatedDraft: boolean;
    reason: string;
  } {
    if (jobState.createdListingId) {
      return {
        canResume: true,
        resumeStage: 'COMPLETED',
        shouldReuseCreatedDraft: true,
        reason: 'Native draft already committed. Reusing existing draft without re-creation.',
      };
    }

    if (jobState.attemptCount >= this.policy.maxAttempts) {
      return {
        canResume: false,
        resumeStage: 'FAILED_FINAL',
        shouldReuseCreatedDraft: false,
        reason: `Maximum retry attempts (${this.policy.maxAttempts}) exhausted.`,
      };
    }

    if (jobState.status === 'VALIDATING' || jobState.status === 'READY_FOR_DRAFT') {
      return {
        canResume: true,
        resumeStage: 'READY_FOR_DRAFT',
        shouldReuseCreatedDraft: false,
        reason: 'Resuming from validated review snapshot with existing normalized fields.',
      };
    }

    if (jobState.persistedAssetsCount > 0) {
      return {
        canResume: true,
        resumeStage: 'PROCESSING_MEDIA',
        shouldReuseCreatedDraft: false,
        reason: 'Resuming media processing with existing stored assets deduplicated.',
      };
    }

    return {
      canResume: true,
      resumeStage: 'FETCHING',
      shouldReuseCreatedDraft: false,
      reason: 'Restarting from source retrieval.',
    };
  }
}
