import type { ListingBridgeConfidenceState } from '../types/canonical-contract';
import type { NormalizedAddress } from '../../address/types';
import type { LocationConflict } from '../location/location-intelligence';
import type { DuplicateMatchLevel, DuplicateMatchSignal } from '../duplicates/duplicate-detector';
import type { ListingImportJobStatus } from '../types/job-state';

export type ReviewFieldAction = 'CONFIRM' | 'EDIT' | 'DISMISS';

export interface ReviewFieldModel {
  readonly fieldName: string;
  readonly displayName: string;
  readonly normalizedValue: unknown;
  readonly sourceValueHash?: string;
  readonly confidenceState: ListingBridgeConfidenceState;
  readonly confidenceScore?: number;
  readonly isRequired: boolean;
  readonly isBlocking: boolean;
  readonly providerModified: boolean;
  readonly validationState: 'VALIDATED' | 'PENDING' | 'INVALID';
  readonly validationMessage?: string;
  readonly prohibitedReason?: string;
  readonly allowedActions: readonly ReviewFieldAction[];
}

export interface UnresolvedReviewItem {
  readonly fieldName: string;
  readonly reasonCode: string;
  readonly reasonMessage: string;
  readonly severity: 'BLOCKING' | 'OPTIONAL';
  readonly currentConfidence: ListingBridgeConfidenceState;
  readonly permittedActions: readonly ReviewFieldAction[];
}

export interface MediaReviewSummary {
  readonly totalCandidates: number;
  readonly validatedCount: number;
  readonly rejectedCount: number;
  readonly duplicateCount: number;
  readonly hasCoverPhoto: boolean;
  readonly isBlocking: boolean;
}

export interface LocationReviewSummary {
  readonly normalizedAddress?: NormalizedAddress;
  readonly isWithinPhilippineBounds: boolean;
  readonly conflicts: readonly LocationConflict[];
  readonly isBlocking: boolean;
  readonly requiresReview: boolean;
}

export interface DuplicateReviewSummary {
  readonly matchLevel: DuplicateMatchLevel;
  readonly matchedListingId?: string;
  readonly matchedJobId?: string;
  readonly confidenceScore: number;
  readonly signals: readonly DuplicateMatchSignal[];
  readonly isBlocking: boolean;
  readonly requiresReview: boolean;
}

export interface RightsReviewSummary {
  readonly rightsConfirmed: boolean;
  readonly confirmedAt?: Date;
  readonly isBlocking: boolean;
}

export interface DraftReadinessResult {
  readonly isReadyForDraft: boolean;
  readonly blockingReasons: readonly string[];
  readonly warningReasons: readonly string[];
  readonly resolvedFieldsCount: number;
  readonly unresolvedBlockingCount: number;
}

export interface ListingBridgeReviewSnapshot {
  readonly importJobId: string;
  readonly providerId: string;
  readonly jobStatus: ListingImportJobStatus;
  readonly fields: readonly ReviewFieldModel[];
  readonly unresolvedItems: readonly UnresolvedReviewItem[];
  readonly media: MediaReviewSummary;
  readonly location: LocationReviewSummary;
  readonly duplicate: DuplicateReviewSummary;
  readonly rights: RightsReviewSummary;
  readonly readiness: DraftReadinessResult;
}

export interface ProviderCorrectionCommand {
  readonly actorUserId: string;
  readonly importJobId: string;
  readonly fieldName: string;
  readonly correctedValue: unknown;
  readonly reason?: string;
  readonly traceId?: string;
}

export interface ProviderCorrectionResult {
  readonly success: boolean;
  readonly importJobId: string;
  readonly fieldName: string;
  readonly previousConfidence: ListingBridgeConfidenceState;
  readonly newConfidence: ListingBridgeConfidenceState;
  readonly updatedValue: unknown;
  readonly readiness: DraftReadinessResult;
  readonly errorCode?: string;
  readonly errorMessage?: string;
}
