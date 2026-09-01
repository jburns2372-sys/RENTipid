import type {
  ListingBridgeReviewSnapshot,
  ReviewFieldModel,
  UnresolvedReviewItem,
  MediaReviewSummary,
  LocationReviewSummary,
  DuplicateReviewSummary,
  RightsReviewSummary,
} from './types';
import { ListingBridgeDraftReadinessEngine } from './draft-readiness-engine';
import type { CanonicalImportContract } from '../types/canonical-contract';
import type { ListingImportJobStatus } from '../types/job-state';

export interface BuildSnapshotInput {
  readonly importJobId: string;
  readonly providerId: string;
  readonly jobStatus: ListingImportJobStatus;
  readonly contract: CanonicalImportContract;
  readonly fields?: readonly ReviewFieldModel[];
  readonly media?: MediaReviewSummary;
  readonly location?: LocationReviewSummary;
  readonly duplicate?: DuplicateReviewSummary;
  readonly rights?: RightsReviewSummary;
}

export class ListingBridgeReviewSnapshotEngine {
  private readonly readinessEngine = new ListingBridgeDraftReadinessEngine();

  buildSnapshot(input: BuildSnapshotInput): ListingBridgeReviewSnapshot {
    // 1. Build Field Models if not explicitly supplied
    const fields: ReviewFieldModel[] = input.fields ? [...input.fields] : this.deriveFieldsFromContract(input.contract);

    // 2. Derive Unresolved Items
    const unresolvedItems: UnresolvedReviewItem[] = input.contract.unresolvedFields.map((u) => {
      const field = fields.find((f) => f.fieldName === u.fieldName);
      return {
        fieldName: u.fieldName,
        reasonCode: u.reason,
        reasonMessage: u.reason,
        severity: u.severity,
        currentConfidence: field?.confidenceState || 'REVIEW_RECOMMENDED',
        permittedActions: ['EDIT', 'CONFIRM'],
      };
    });

    // 3. Default Media Summary
    const media: MediaReviewSummary = input.media || {
      totalCandidates: input.contract.media.length,
      validatedCount: input.contract.media.length,
      rejectedCount: 0,
      duplicateCount: 0,
      hasCoverPhoto: input.contract.media.some((m) => m.isCover),
      isBlocking: input.contract.media.length === 0,
    };

    // 4. Default Location Summary
    const location: LocationReviewSummary = input.location || {
      normalizedAddress: {
        addressLine1: input.contract.location.rawLocationString || null,
        addressLine2: null,
        sublocality: null,
        locality: input.contract.location.city || null,
        administrativeArea2: null,
        administrativeArea1: input.contract.location.province || null,
        postalCode: input.contract.location.postalCode || null,
        countryCode: input.contract.location.country || 'PH',
        formattedAddress: input.contract.location.rawLocationString || null,
        latitude: input.contract.location.latitude ?? null,
        longitude: input.contract.location.longitude ?? null,
        provider: 'MANUAL',
        providerPlaceId: null,
        validationStatus: input.contract.fieldConfidence.location?.state === 'VERIFIED' ? 'VERIFIED' : 'UNVERIFIED',
        validationLevel: null,
        manuallyEdited: false,
        validatedAt: null,
      },
      isWithinPhilippineBounds: true,
      conflicts: [],
      isBlocking: false,
      requiresReview: input.contract.fieldConfidence.location?.state === 'REVIEW_RECOMMENDED',
    };

    // 5. Default Duplicate Summary
    const duplicate: DuplicateReviewSummary = input.duplicate || {
      matchLevel: 'NO_MATCH',
      confidenceScore: 0.0,
      signals: [],
      isBlocking: false,
      requiresReview: false,
    };

    // 6. Default Rights Summary
    const rights: RightsReviewSummary = input.rights || {
      rightsConfirmed: true,
      confirmedAt: new Date(),
      isBlocking: false,
    };

    // 7. Calculate Draft Readiness
    const readiness = this.readinessEngine.evaluate({
      fields,
      media,
      location,
      duplicate,
      rights,
      jobStatus: input.jobStatus,
    });

    return Object.freeze({
      importJobId: input.importJobId,
      providerId: input.providerId,
      jobStatus: input.jobStatus,
      fields: Object.freeze(fields),
      unresolvedItems: Object.freeze(unresolvedItems),
      media: Object.freeze(media),
      location: Object.freeze(location),
      duplicate: Object.freeze(duplicate),
      rights: Object.freeze(rights),
      readiness,
    });
  }

  private deriveFieldsFromContract(contract: CanonicalImportContract): ReviewFieldModel[] {
    const fields: ReviewFieldModel[] = [];

    // Title
    const titleConf = contract.fieldConfidence.title;
    fields.push({
      fieldName: 'title',
      displayName: 'Listing Title',
      normalizedValue: contract.property.title,
      sourceValueHash: titleConf?.provenance?.sourceHash,
      confidenceState: titleConf?.state || 'REVIEW_RECOMMENDED',
      isRequired: true,
      isBlocking: titleConf?.state === 'CONFLICT' || titleConf?.state === 'MISSING',
      providerModified: false,
      validationState: contract.property.title ? 'VALIDATED' : 'INVALID',
      allowedActions: ['CONFIRM', 'EDIT'],
    });

    // Description
    const descConf = contract.fieldConfidence.description;
    fields.push({
      fieldName: 'description',
      displayName: 'Description',
      normalizedValue: contract.property.description,
      sourceValueHash: descConf?.provenance?.sourceHash,
      confidenceState: descConf?.state || 'REVIEW_RECOMMENDED',
      isRequired: true,
      isBlocking: descConf?.state === 'CONFLICT' || descConf?.state === 'MISSING',
      providerModified: false,
      validationState: contract.property.description ? 'VALIDATED' : 'INVALID',
      allowedActions: ['CONFIRM', 'EDIT'],
    });

    // Property Type
    const typeConf = contract.fieldConfidence.propertyType;
    fields.push({
      fieldName: 'propertyType',
      displayName: 'Property Type',
      normalizedValue: contract.property.propertyType,
      sourceValueHash: typeConf?.provenance?.sourceHash,
      confidenceState: typeConf?.state || 'REVIEW_RECOMMENDED',
      isRequired: true,
      isBlocking: typeConf?.state === 'CONFLICT' || typeConf?.state === 'MISSING',
      providerModified: false,
      validationState: contract.property.propertyType ? 'VALIDATED' : 'INVALID',
      allowedActions: ['CONFIRM', 'EDIT'],
    });

    // Capacity
    const capConf = contract.fieldConfidence.capacity;
    fields.push({
      fieldName: 'capacity',
      displayName: 'Guest Capacity',
      normalizedValue: contract.capacity,
      sourceValueHash: capConf?.provenance?.sourceHash,
      confidenceState: capConf?.state || 'HIGH_CONFIDENCE',
      isRequired: false,
      isBlocking: capConf?.state === 'CONFLICT',
      providerModified: false,
      validationState: 'VALIDATED',
      allowedActions: ['CONFIRM', 'EDIT'],
    });

    // Amenities
    const amenConf = contract.fieldConfidence.amenities;
    fields.push({
      fieldName: 'amenities',
      displayName: 'Amenities',
      normalizedValue: contract.amenities,
      sourceValueHash: amenConf?.provenance?.sourceHash,
      confidenceState: amenConf?.state || 'HIGH_CONFIDENCE',
      isRequired: false,
      isBlocking: amenConf?.state === 'CONFLICT',
      providerModified: false,
      validationState: 'VALIDATED',
      allowedActions: ['CONFIRM', 'EDIT'],
    });

    // Pricing Hints
    const priceConf = contract.fieldConfidence.pricingHints;
    fields.push({
      fieldName: 'pricingHints',
      displayName: 'Pricing Hints',
      normalizedValue: contract.pricingHints,
      sourceValueHash: priceConf?.provenance?.sourceHash,
      confidenceState: priceConf?.state || 'REVIEW_RECOMMENDED',
      isRequired: false,
      isBlocking: priceConf?.state === 'CONFLICT',
      providerModified: false,
      validationState: 'VALIDATED',
      allowedActions: ['CONFIRM', 'EDIT'],
    });

    return fields;
  }
}
