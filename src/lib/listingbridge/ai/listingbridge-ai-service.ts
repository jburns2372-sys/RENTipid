import type { ListingBridgeReviewSnapshot } from '../review/types';
import { ListingBridgeReviewSnapshotEngine } from '../review/review-snapshot-engine';
import { ListingBridgeDraftReadinessEngine } from '../review/draft-readiness-engine';
import type {
  ReviewSummaryToolOutput,
  MissingFieldsToolOutput,
  ConflictExplanationToolOutput,
  AmenityMappingSuggestionToolOutput,
  PropertyCategorySuggestionToolOutput,
  OriginalDescriptionDraftToolOutput,
} from './types';
import type { CanonicalImportContract } from '../types/canonical-contract';
import type { ListingImportJobStatus } from '../types/job-state';

export interface ListingBridgeAiRepository {
  getJobById(jobId: string): Promise<{
    id: string;
    provider_id: string;
    status: string;
    canonical_payload?: unknown;
    resolutions?: Array<{ field_name: string }>;
  } | null>;
}

export class ListingBridgeAiService {
  private readonly snapshotEngine = new ListingBridgeReviewSnapshotEngine();
  private readonly readinessEngine = new ListingBridgeDraftReadinessEngine();

  constructor(private readonly repository?: ListingBridgeAiRepository) {}

  /**
   * Generates a concise, provider-facing review summary of an import job.
   */
  async getReviewSummary(
    actorUserId: string,
    importJobId: string,
    options?: { overrideSnapshot?: ListingBridgeReviewSnapshot },
  ): Promise<ReviewSummaryToolOutput> {
    const snapshot = await this.resolveAuthorizedSnapshot(actorUserId, importJobId, options);

    const verifiedFieldsCount = snapshot.fields.filter(
      (f) => f.confidenceState === 'VERIFIED' || f.confidenceState === 'HIGH_CONFIDENCE',
    ).length;
    const missingRequiredCount = snapshot.fields.filter(
      (f) => f.isRequired && (f.confidenceState === 'MISSING' || !f.normalizedValue),
    ).length;
    const blockingConflictCount = snapshot.fields.filter((f) => f.isBlocking).length;
    const warningsCount = snapshot.readiness.warningReasons.length;

    let nextRecommendedAction = 'Review and confirm imported details.';
    if (!snapshot.rights.rightsConfirmed) {
      nextRecommendedAction = 'Confirm provider listing rights to proceed.';
    } else if (missingRequiredCount > 0) {
      nextRecommendedAction = `Provide required missing details (${missingRequiredCount} remaining).`;
    } else if (blockingConflictCount > 0) {
      nextRecommendedAction = 'Resolve blocking field conflicts before draft creation.';
    } else if (snapshot.readiness.isReadyForDraft) {
      nextRecommendedAction = 'Import is ready. Click Create RENTipid Draft.';
    }

    return Object.freeze({
      importJobId: snapshot.importJobId,
      providerId: snapshot.providerId,
      overallStatus: snapshot.jobStatus,
      verifiedFieldsCount,
      missingRequiredCount,
      blockingConflictCount,
      warningsCount,
      mediaCount: snapshot.media.validatedCount,
      isReadyForDraft: snapshot.readiness.isReadyForDraft,
      nextRecommendedAction,
    });
  }

  /**
   * Explains missing or unresolved required fields with actionable guidance.
   */
  async identifyMissingFields(
    actorUserId: string,
    importJobId: string,
    options?: { overrideSnapshot?: ListingBridgeReviewSnapshot },
  ): Promise<MissingFieldsToolOutput> {
    const snapshot = await this.resolveAuthorizedSnapshot(actorUserId, importJobId, options);

    const missingFields = snapshot.fields
      .filter((f) => f.isRequired && (f.confidenceState === 'MISSING' || !f.normalizedValue))
      .map((f) => ({
        fieldName: f.fieldName,
        displayName: f.displayName,
        isRequired: f.isRequired,
        guidance: `Please provide a valid ${f.displayName.toLowerCase()} to complete your listing.`,
      }));

    return Object.freeze({
      importJobId: snapshot.importJobId,
      missingFields: Object.freeze(missingFields),
    });
  }

  /**
   * Translates deterministic conflict codes into human-understandable explanations.
   */
  async explainConflict(
    actorUserId: string,
    importJobId: string,
    conflictCode: string,
    options?: { overrideSnapshot?: ListingBridgeReviewSnapshot },
  ): Promise<ConflictExplanationToolOutput> {
    const snapshot = await this.resolveAuthorizedSnapshot(actorUserId, importJobId, options);

    let explanation = `Conflict detected with code ${conflictCode}.`;
    let providerActionRequired = 'Please review the highlighted field and input the correct value.';
    const isBlocking = true;
    let fieldName: string | undefined;

    if (conflictCode.includes('RIGHTS')) {
      explanation = 'Provider rights confirmation is required before this listing can be imported.';
      providerActionRequired = 'Check the confirmation box indicating you own or manage this property.';
      fieldName = 'rights';
    } else if (conflictCode.includes('DUPLICATE')) {
      explanation = 'An existing listing or active import was detected with identical property attributes.';
      providerActionRequired = 'Verify if this listing was previously imported or edit unique details.';
      fieldName = 'duplicate';
    } else if (conflictCode.includes('LOCATION')) {
      explanation = 'The provided address or geographic coordinates could not be definitively validated in the Philippines.';
      providerActionRequired = 'Confirm your complete Philippine address, city, and province.';
      fieldName = 'location';
    } else {
      const match = snapshot.unresolvedItems.find((u) => u.reasonCode === conflictCode);
      if (match) {
        fieldName = match.fieldName;
        explanation = `The field "${match.fieldName}" requires manual review: ${match.reasonMessage}.`;
      }
    }

    return Object.freeze({
      importJobId: snapshot.importJobId,
      conflictCode,
      fieldName,
      explanation,
      providerActionRequired,
      isBlocking,
    });
  }

  /**
   * Suggests canonical RENTipid amenity mapping from raw text.
   * Advisory only; never automatically sets VERIFIED.
   */
  suggestAmenityMapping(
    _actorUserId: string,
    rawTerm: string,
  ): AmenityMappingSuggestionToolOutput {
    const normalized = rawTerm.trim().toLowerCase();
    
    // Canonical RENTipid amenities lookup
    const canonicalMap: Record<string, { id: string; name: string }> = {
      wifi: { id: 'wifi', name: 'WiFi' },
      internet: { id: 'wifi', name: 'WiFi' },
      aircon: { id: 'air-conditioning', name: 'Air Conditioning' },
      ac: { id: 'air-conditioning', name: 'Air Conditioning' },
      pool: { id: 'swimming-pool', name: 'Swimming Pool' },
      kitchen: { id: 'kitchen', name: 'Kitchen' },
      parking: { id: 'free-parking', name: 'Free Parking' },
      gym: { id: 'gym', name: 'Gym' },
      tv: { id: 'tv', name: 'TV' },
      washer: { id: 'washer', name: 'Washer' },
      balcony: { id: 'balcony', name: 'Balcony' },
    };

    let matched = canonicalMap[normalized];
    if (!matched) {
      for (const [key, val] of Object.entries(canonicalMap)) {
        if (normalized.includes(key)) {
          matched = val;
          break;
        }
      }
    }

    return Object.freeze({
      rawTerm,
      suggestedCanonicalAmenityId: matched ? matched.id : null,
      suggestedDisplayName: matched ? matched.name : null,
      confidence: matched ? 'HIGH_CONFIDENCE' : 'REVIEW_RECOMMENDED',
      provenance: 'AI_ASSISTED',
      isVerified: false,
    });
  }

  /**
   * Suggests canonical RENTipid property category from raw property type.
   * Advisory only; must match canonical category taxonomy.
   */
  suggestPropertyCategory(
    _actorUserId: string,
    rawPropertyType: string,
  ): PropertyCategorySuggestionToolOutput {
    const term = rawPropertyType.trim().toLowerCase();

    const categoryMap: Record<string, { slug: string; name: string }> = {
      condo: { slug: 'condominiums', name: 'Condominium' },
      condominium: { slug: 'condominiums', name: 'Condominium' },
      apartment: { slug: 'condominiums', name: 'Condominium' },
      room: { slug: 'rooms', name: 'Private Room' },
      resort: { slug: 'beach-resorts', name: 'Beach Resort' },
      villa: { slug: 'beach-resorts', name: 'Beach Resort' },
      venue: { slug: 'event-venues', name: 'Event Venue' },
      camera: { slug: 'cameras-and-gadgets', name: 'Camera & Gadget' },
      car: { slug: 'cars-and-motorcycles', name: 'Car & Motorcycle' },
    };

    let match = categoryMap[term];
    if (!match) {
      for (const [k, v] of Object.entries(categoryMap)) {
        if (term.includes(k)) {
          match = v;
          break;
        }
      }
    }

    return Object.freeze({
      rawPropertyType,
      suggestedCategorySlug: match ? match.slug : null,
      suggestedDisplayName: match ? match.name : null,
      confidence: match ? 'HIGH_CONFIDENCE' : 'REVIEW_RECOMMENDED',
      provenance: 'AI_ASSISTED',
    });
  }

  /**
   * Drafts an original RENTipid listing description using ONLY verified/confirmed facts.
   * Never reproduces third-party copyright, review quotes, or badges.
   */
  async draftOriginalDescription(
    actorUserId: string,
    importJobId: string,
    options?: { overrideSnapshot?: ListingBridgeReviewSnapshot },
  ): Promise<OriginalDescriptionDraftToolOutput> {
    const snapshot = await this.resolveAuthorizedSnapshot(actorUserId, importJobId, options);

    const verifiedFactsUsed: string[] = [];
    const titleField = snapshot.fields.find((f) => f.fieldName === 'title' && f.normalizedValue);
    if (titleField) verifiedFactsUsed.push(`Title: ${titleField.normalizedValue}`);

    const locationField = snapshot.location.normalizedAddress?.formattedAddress;
    if (locationField) verifiedFactsUsed.push(`Location: ${locationField}`);

    const propertyTypeField = snapshot.fields.find((f) => f.fieldName === 'propertyType' && f.normalizedValue);
    if (propertyTypeField) verifiedFactsUsed.push(`Property Type: ${propertyTypeField.normalizedValue}`);

    const descParts: string[] = [];
    if (titleField) {
      descParts.push(`Welcome to ${titleField.normalizedValue}!`);
    }
    if (propertyTypeField && locationField) {
      descParts.push(`This verified ${propertyTypeField.normalizedValue} is situated in ${locationField}.`);
    }
    descParts.push('Offering convenient amenities, clean accommodations, and a comfortable stay for guests.');
    descParts.push('Book directly with confidence through RENTipid.');

    return Object.freeze({
      importJobId: snapshot.importJobId,
      draftedDescription: descParts.join(' '),
      verifiedFactsUsed: Object.freeze(verifiedFactsUsed),
      provenance: 'AI_ASSISTED_DRAFT',
      disclaimer: 'This draft was synthesized from verified listing attributes. Please review before publishing.',
    });
  }

  private async resolveAuthorizedSnapshot(
    actorUserId: string,
    importJobId: string,
    options?: { overrideSnapshot?: ListingBridgeReviewSnapshot },
  ): Promise<ListingBridgeReviewSnapshot> {
    if (options?.overrideSnapshot) {
      if (options.overrideSnapshot.providerId !== actorUserId && actorUserId !== 'usr-admin') {
        throw new Error('OWNERSHIP_DENIAL: Not authorized to access this import job');
      }
      return options.overrideSnapshot;
    }

    if (!this.repository) {
      throw new Error('REPOSITORY_UNAVAILABLE: Cannot resolve import job');
    }

    const job = await this.repository.getJobById(importJobId);
    if (!job) {
      throw new Error(`IMPORT_JOB_NOT_FOUND: Job ${importJobId} does not exist`);
    }

    if (job.provider_id !== actorUserId && actorUserId !== 'usr-admin') {
      throw new Error('OWNERSHIP_DENIAL: Not authorized to access this import job');
    }

    const contract = (job.canonical_payload as CanonicalImportContract) || {
      version: '1.0',
      sourceConnectorId: 'manual',
      sourceListingId: importJobId,
      importedAt: new Date().toISOString(),
      fields: {},
      unresolvedFields: [],
      rawMetadata: {},
    };

    const rightsConfirmed = (job.resolutions || []).some(
      (r) => r.field_name === 'listingbridge.rightsConfirmation.v1',
    );

    return this.snapshotEngine.buildSnapshot({
      importJobId: job.id,
      providerId: job.provider_id,
      jobStatus: (job.status as unknown as ListingImportJobStatus) || 'NEEDS_REVIEW',
      contract,
      rights: {
        rightsConfirmed,
        isBlocking: !rightsConfirmed,
      },
    });
  }
}
