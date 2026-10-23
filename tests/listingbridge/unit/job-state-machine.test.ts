import {
  listingImportJobStatuses,
  terminalListingImportJobStatuses,
  isTerminalListingImportJobStatus,
  canTransitionJobStatus,
  assertValidJobStatusTransition,
  ListingImportJobStatus,
} from '../../../src/lib/listingbridge/types/job-state';

describe('ListingBridge Job State Machine (P2 Foundation)', () => {
  it('defines all 14 mandatory job statuses from the Master Plan', () => {
    expect(listingImportJobStatuses).toEqual([
      'CREATED',
      'AUTHORIZING',
      'FETCHING',
      'EXTRACTING',
      'NORMALIZING',
      'PROCESSING_MEDIA',
      'VALIDATING',
      'NEEDS_REVIEW',
      'READY_FOR_DRAFT',
      'CREATING_DRAFT',
      'COMPLETED',
      'FAILED_RETRYABLE',
      'FAILED_FINAL',
      'CANCELLED',
    ]);
  });

  it('correctly identifies terminal states', () => {
    expect(terminalListingImportJobStatuses).toEqual(['COMPLETED', 'FAILED_FINAL', 'CANCELLED']);
    expect(isTerminalListingImportJobStatus('COMPLETED')).toBe(true);
    expect(isTerminalListingImportJobStatus('FAILED_FINAL')).toBe(true);
    expect(isTerminalListingImportJobStatus('CANCELLED')).toBe(true);
    expect(isTerminalListingImportJobStatus('CREATED')).toBe(false);
    expect(isTerminalListingImportJobStatus('FETCHING')).toBe(false);
    expect(isTerminalListingImportJobStatus('FAILED_RETRYABLE')).toBe(false);
  });

  it('permits valid linear progression from CREATED to COMPLETED', () => {
    const validLinearPath: ListingImportJobStatus[] = [
      'CREATED',
      'AUTHORIZING',
      'FETCHING',
      'EXTRACTING',
      'NORMALIZING',
      'PROCESSING_MEDIA',
      'VALIDATING',
      'NEEDS_REVIEW',
      'READY_FOR_DRAFT',
      'CREATING_DRAFT',
      'COMPLETED',
    ];

    for (let i = 0; i < validLinearPath.length - 1; i++) {
      const from = validLinearPath[i];
      const to = validLinearPath[i + 1];
      expect(canTransitionJobStatus(from, to)).toBe(true);
      expect(() => assertValidJobStatusTransition(from, to)).not.toThrow();
    }
  });

  it('permits skipping non-applicable stages (e.g. CREATED direct to FETCHING or NORMALIZING direct to VALIDATING)', () => {
    expect(canTransitionJobStatus('CREATED', 'FETCHING')).toBe(true);
    expect(canTransitionJobStatus('NORMALIZING', 'VALIDATING')).toBe(true);
    expect(canTransitionJobStatus('PROCESSING_MEDIA', 'READY_FOR_DRAFT')).toBe(true);
  });

  it('permits transitions to failure and cancellation states from active states', () => {
    const activeStates: ListingImportJobStatus[] = [
      'CREATED',
      'AUTHORIZING',
      'FETCHING',
      'EXTRACTING',
      'NORMALIZING',
      'PROCESSING_MEDIA',
      'VALIDATING',
      'NEEDS_REVIEW',
    ];

    for (const state of activeStates) {
      expect(canTransitionJobStatus(state, 'FAILED_RETRYABLE')).toBe(true);
      expect(canTransitionJobStatus(state, 'FAILED_FINAL')).toBe(true);
      expect(canTransitionJobStatus(state, 'CANCELLED')).toBe(true);
    }
  });

  it('permits retryable failures to transition back to processing stages', () => {
    expect(canTransitionJobStatus('FAILED_RETRYABLE', 'FETCHING')).toBe(true);
    expect(canTransitionJobStatus('FAILED_RETRYABLE', 'EXTRACTING')).toBe(true);
    expect(canTransitionJobStatus('FAILED_RETRYABLE', 'NORMALIZING')).toBe(true);
    expect(canTransitionJobStatus('FAILED_RETRYABLE', 'PROCESSING_MEDIA')).toBe(true);
    expect(canTransitionJobStatus('FAILED_RETRYABLE', 'FAILED_FINAL')).toBe(true);
    expect(canTransitionJobStatus('FAILED_RETRYABLE', 'CANCELLED')).toBe(true);
  });

  it('strictly rejects illegal backward or invalid forward transitions', () => {
    // Cannot jump directly from CREATED to COMPLETED (must go through draft creation)
    expect(canTransitionJobStatus('CREATED', 'COMPLETED')).toBe(false);
    expect(() => assertValidJobStatusTransition('CREATED', 'COMPLETED')).toThrow(
      /Invalid ListingImportJob state transition/,
    );

    // Terminal states cannot transition to anything
    expect(canTransitionJobStatus('COMPLETED', 'FETCHING')).toBe(false);
    expect(canTransitionJobStatus('COMPLETED', 'CREATED')).toBe(false);
    expect(canTransitionJobStatus('FAILED_FINAL', 'FETCHING')).toBe(false);
    expect(canTransitionJobStatus('CANCELLED', 'FETCHING')).toBe(false);

    // Cannot jump from FETCHING back to CREATED
    expect(canTransitionJobStatus('FETCHING', 'CREATED')).toBe(false);
  });
});
