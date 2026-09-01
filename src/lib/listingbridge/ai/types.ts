import type { ListingBridgeConfidenceState } from '../types/canonical-contract';

export interface ListingBridgeSafeAiContext {
  readonly importJobId: string;
  readonly providerId: string;
  readonly isRightsConfirmed: boolean;
  readonly fields: readonly {
    readonly fieldName: string;
    readonly displayName: string;
    readonly normalizedValue: unknown;
    readonly confidenceState: ListingBridgeConfidenceState;
    readonly isRequired: boolean;
    readonly isBlocking: boolean;
  }[];
  readonly unresolvedItems: readonly {
    readonly fieldName: string;
    readonly reasonCode: string;
    readonly severity: string;
  }[];
  readonly locationSummary: {
    readonly locality?: string;
    readonly administrativeArea1?: string;
    readonly isWithinPhilippineBounds: boolean;
    readonly hasConflicts: boolean;
  };
  readonly mediaSummary: {
    readonly validatedCount: number;
    readonly hasCoverPhoto: boolean;
  };
  readonly duplicateSummary: {
    readonly isBlocking: boolean;
    readonly requiresReview: boolean;
  };
  readonly untrustedSourceSnippets: readonly {
    readonly field: string;
    readonly content: string;
  }[];
}

export interface ReviewSummaryToolOutput {
  readonly importJobId: string;
  readonly providerId: string;
  readonly overallStatus: string;
  readonly verifiedFieldsCount: number;
  readonly missingRequiredCount: number;
  readonly blockingConflictCount: number;
  readonly warningsCount: number;
  readonly mediaCount: number;
  readonly isReadyForDraft: boolean;
  readonly nextRecommendedAction: string;
}

export interface MissingFieldsToolOutput {
  readonly importJobId: string;
  readonly missingFields: readonly {
    readonly fieldName: string;
    readonly displayName: string;
    readonly isRequired: boolean;
    readonly guidance: string;
  }[];
}

export interface ConflictExplanationToolOutput {
  readonly importJobId: string;
  readonly conflictCode: string;
  readonly fieldName?: string;
  readonly explanation: string;
  readonly providerActionRequired: string;
  readonly isBlocking: boolean;
}

export interface AmenityMappingSuggestionToolOutput {
  readonly rawTerm: string;
  readonly suggestedCanonicalAmenityId: string | null;
  readonly suggestedDisplayName: string | null;
  readonly confidence: 'HIGH_CONFIDENCE' | 'REVIEW_RECOMMENDED';
  readonly provenance: 'AI_ASSISTED';
  readonly isVerified: false;
}

export interface PropertyCategorySuggestionToolOutput {
  readonly rawPropertyType: string;
  readonly suggestedCategorySlug: string | null;
  readonly suggestedDisplayName: string | null;
  readonly confidence: 'HIGH_CONFIDENCE' | 'REVIEW_RECOMMENDED';
  readonly provenance: 'AI_ASSISTED';
}

export interface OriginalDescriptionDraftToolOutput {
  readonly importJobId: string;
  readonly draftedDescription: string;
  readonly verifiedFactsUsed: readonly string[];
  readonly provenance: 'AI_ASSISTED_DRAFT';
  readonly disclaimer: string;
}
