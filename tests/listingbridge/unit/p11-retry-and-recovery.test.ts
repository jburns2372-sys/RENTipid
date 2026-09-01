import {
  ListingBridgeRetryEngine,
  DEFAULT_LISTINGBRIDGE_RETRY_POLICY,
} from '../../../src/lib/listingbridge/observability/retry';

describe('ListingBridge P11: Retry, Resilience & Partial-Progress Recovery (LB-FAIL-001..003)', () => {
  const retryEngine = new ListingBridgeRetryEngine(DEFAULT_LISTINGBRIDGE_RETRY_POLICY);

  it('LB-FAIL-001: External source outage / timeout is classified as RETRYABLE', () => {
    const timeoutError = new Error('Gateway Timeout (504)');
    const classification = retryEngine.classifyFailure(timeoutError);

    expect(classification).toBe('RETRYABLE');
  });

  it('LB-FAIL-002: Upstream rate limit is classified as RETRYABLE with bounded exponential backoff', () => {
    const rateLimitError = { code: 'RATE_LIMITED', message: 'Too many requests' };
    const classification = retryEngine.classifyFailure(rateLimitError);

    expect(classification).toBe('RETRYABLE');

    const delayAttempt1 = retryEngine.calculateBackoffDelayMs(1);
    const delayAttempt2 = retryEngine.calculateBackoffDelayMs(2);
    const delayAttempt3 = retryEngine.calculateBackoffDelayMs(3);
    const delayAttempt4 = retryEngine.calculateBackoffDelayMs(4); // Exceeded max attempts

    expect(delayAttempt1).toBeGreaterThanOrEqual(1000);
    expect(delayAttempt2).toBeGreaterThan(delayAttempt1);
    expect(delayAttempt3).toBeGreaterThan(delayAttempt2);
    expect(delayAttempt4).toBe(-1); // Exhausted -> FAILED_FINAL
  });

  it('LB-FAIL-003: Worker interruption recovers from durable state without duplicating draft creation', () => {
    // Scenario A: Draft was already created before worker died
    const recoveredWithDraft = retryEngine.evaluatePartialProgressRecovery({
      status: 'CREATING_DRAFT',
      persistedFieldsCount: 5,
      persistedAssetsCount: 3,
      createdListingId: 'lst-draft-committed-123',
      attemptCount: 1,
    });

    expect(recoveredWithDraft.canResume).toBe(true);
    expect(recoveredWithDraft.resumeStage).toBe('COMPLETED');
    expect(recoveredWithDraft.shouldReuseCreatedDraft).toBe(true);

    // Scenario B: Media assets persisted before worker died
    const recoveredWithMedia = retryEngine.evaluatePartialProgressRecovery({
      status: 'PROCESSING_MEDIA',
      persistedFieldsCount: 5,
      persistedAssetsCount: 2,
      createdListingId: null,
      attemptCount: 1,
    });

    expect(recoveredWithMedia.canResume).toBe(true);
    expect(recoveredWithMedia.resumeStage).toBe('PROCESSING_MEDIA');
    expect(recoveredWithMedia.shouldReuseCreatedDraft).toBe(false);

    // Scenario C: Retry attempts exhausted
    const exhaustedRecovery = retryEngine.evaluatePartialProgressRecovery({
      status: 'FETCHING',
      persistedFieldsCount: 0,
      persistedAssetsCount: 0,
      createdListingId: null,
      attemptCount: 3,
    });

    expect(exhaustedRecovery.canResume).toBe(false);
    expect(exhaustedRecovery.resumeStage).toBe('FAILED_FINAL');
  });

  it('Strictly prevents background retrying of security blocks and SSRF violations', () => {
    const ssrfError = { code: 'SSRF_BLOCKED', message: 'Blocked access to 169.254.169.254' };
    const ownershipError = { code: 'OWNERSHIP_MISMATCH', message: 'Forbidden actor' };

    expect(retryEngine.classifyFailure(ssrfError)).toBe('FINAL_SECURITY_BLOCKED');
    expect(retryEngine.classifyFailure(ownershipError)).toBe('FINAL_SECURITY_BLOCKED');
  });

  it('Classifies provider validation issues as FINAL_PROVIDER_ACTION (requires human correction)', () => {
    const rightsError = { code: 'RIGHTS_CONFIRMATION_REQUIRED', message: 'Confirmation needed' };
    const conflictError = { code: 'LOCATION_CONFLICT', message: 'Invalid location' };

    expect(retryEngine.classifyFailure(rightsError)).toBe('FINAL_PROVIDER_ACTION');
    expect(retryEngine.classifyFailure(conflictError)).toBe('FINAL_PROVIDER_ACTION');
  });
});
