import type {
  DraftReadinessResult,
  ReviewFieldModel,
  MediaReviewSummary,
  LocationReviewSummary,
  DuplicateReviewSummary,
  RightsReviewSummary,
} from './types';
import type { ListingImportJobStatus } from '../types/job-state';

export interface DraftReadinessEvaluationInput {
  readonly fields: readonly ReviewFieldModel[];
  readonly media: MediaReviewSummary;
  readonly location: LocationReviewSummary;
  readonly duplicate: DuplicateReviewSummary;
  readonly rights: RightsReviewSummary;
  readonly jobStatus: ListingImportJobStatus;
}

export class ListingBridgeDraftReadinessEngine {
  evaluate(input: DraftReadinessEvaluationInput): DraftReadinessResult {
    const blockingReasons: string[] = [];
    const warningReasons: string[] = [];

    // 1. Rights confirmation check
    if (!input.rights.rightsConfirmed) {
      blockingReasons.push('RIGHTS_NOT_CONFIRMED: Provider rights confirmation is required before draft readiness');
    }

    // 2. Duplicate check
    if (input.duplicate.isBlocking) {
      const matchTarget = input.duplicate.matchedListingId || input.duplicate.matchedJobId || 'existing property';
      blockingReasons.push(`DUPLICATE_PROPERTY_BLOCKING: Exact duplicate detected with ${matchTarget}`);
    } else if (input.duplicate.requiresReview) {
      warningReasons.push(`DUPLICATE_PROPERTY_WARNING: Possible property match detected (${input.duplicate.matchLevel})`);
    }

    // 3. Location check
    if (input.location.isBlocking) {
      blockingReasons.push('LOCATION_CONFLICT_BLOCKING: Location coordinate or address conflicts must be resolved');
    } else if (input.location.requiresReview) {
      warningReasons.push('LOCATION_REVIEW_RECOMMENDED: Address/coordinates require provider inspection');
    }

    // 4. Media check
    if (input.media.isBlocking) {
      blockingReasons.push('MEDIA_PHOTOS_MISSING: At least one validated photo is required for listing draft');
    } else if (input.media.rejectedCount > 0) {
      warningReasons.push(`MEDIA_PARTIAL_FAILURE: ${input.media.rejectedCount} candidate media item(s) were rejected`);
    }

    // 5. Job Status check
    const nonReadyJobStatuses: readonly ListingImportJobStatus[] = Object.freeze([
      'FAILED_RETRYABLE',
      'FAILED_FINAL',
      'CANCELLED',
    ]);
    if (nonReadyJobStatuses.includes(input.jobStatus)) {
      blockingReasons.push(`JOB_STATE_INELIGIBLE: Job status '${input.jobStatus}' is not eligible for draft readiness`);
    }

    // 6. Field-level checks
    let resolvedFieldsCount = 0;
    let unresolvedBlockingCount = 0;

    for (const field of input.fields) {
      if (field.confidenceState === 'PROHIBITED') {
        // Prohibited fields must never be accepted as listing content
        if (field.normalizedValue !== null && field.normalizedValue !== undefined) {
          blockingReasons.push(`PROHIBITED_FIELD_ACTIVE: Field '${field.fieldName}' contains prohibited data and cannot be active`);
          unresolvedBlockingCount++;
        }
        continue;
      }

      if (field.isRequired) {
        if (field.confidenceState === 'MISSING') {
          blockingReasons.push(`REQUIRED_FIELD_MISSING: Required field '${field.fieldName}' is missing`);
          unresolvedBlockingCount++;
          continue;
        }

        if (field.confidenceState === 'CONFLICT') {
          blockingReasons.push(`REQUIRED_FIELD_CONFLICT: Required field '${field.fieldName}' has unresolved conflicts`);
          unresolvedBlockingCount++;
          continue;
        }
      }

      if (field.validationState === 'INVALID') {
        blockingReasons.push(`FIELD_VALIDATION_FAILED: Field '${field.fieldName}' failed validation: ${field.validationMessage || 'Invalid value'}`);
        unresolvedBlockingCount++;
        continue;
      }

      if (field.confidenceState === 'REVIEW_RECOMMENDED') {
        warningReasons.push(`FIELD_REVIEW_RECOMMENDED: Field '${field.fieldName}' is recommended for provider review`);
      }

      if (field.confidenceState === 'VERIFIED' || field.confidenceState === 'HIGH_CONFIDENCE') {
        resolvedFieldsCount++;
      }
    }

    return Object.freeze({
      isReadyForDraft: blockingReasons.length === 0,
      blockingReasons: Object.freeze(blockingReasons),
      warningReasons: Object.freeze(warningReasons),
      resolvedFieldsCount,
      unresolvedBlockingCount,
    });
  }
}
