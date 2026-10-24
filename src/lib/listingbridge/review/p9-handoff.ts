import type { ListingBridgeReviewSnapshot, DraftReadinessResult } from './types';

export interface ListingBridgeP9HandoffContract {
  readonly importJobId: string;
  readonly providerId: string;
  readonly isEligibleForDraftCreation: boolean;
  readonly readiness: DraftReadinessResult;
  readonly blockingReasons: readonly string[];
  readonly handoffPreparedAt: string;
}

export class ListingBridgeP9HandoffBoundary {
  /**
   * Prepares the typed handoff contract for P9.
   * NOTE: P8 strictly evaluates and packages readiness. P9 owns actual Listing draft creation.
   */
  prepareHandoff(snapshot: ListingBridgeReviewSnapshot): ListingBridgeP9HandoffContract {
    return Object.freeze({
      importJobId: snapshot.importJobId,
      providerId: snapshot.providerId,
      isEligibleForDraftCreation: snapshot.readiness.isReadyForDraft,
      readiness: snapshot.readiness,
      blockingReasons: snapshot.readiness.blockingReasons,
      handoffPreparedAt: new Date().toISOString(),
    });
  }
}
