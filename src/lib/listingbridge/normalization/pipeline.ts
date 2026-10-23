import { computeSha256 } from '../utils/idempotency';
import {
  ListingBridgeExtractionEnvelope,
  validateExtractionEnvelope,
} from '../extraction/envelope';
import {
  StructuredFactExtractor,
  ExtractedCandidateFacts,
  RawCandidateFact,
} from '../extraction/structured-extractor';
import { PropertyTaxonomyMapper } from './taxonomy/property-taxonomy';
import { AmenityTaxonomyMapper } from './taxonomy/amenity-taxonomy';
import { ProhibitedDataFilter, ProhibitedFilterResult } from './prohibited-filter';
import { CommercialPolicyClassifier } from './commercial-policy';
import { MappingConflictDetector, MappingConflict } from './conflict-detector';
import {
  ListingBridgeSemanticAiAdapter,
  DisabledSemanticAiAdapter,
} from './semantic-ai-boundary';
import {
  CanonicalImportContract,
  CanonicalImportMedia,
  CanonicalImportRoom,
  ListingBridgeFieldConfidence,
  ListingBridgeRejectedField,
  ListingBridgeUnresolvedField,
  LISTINGBRIDGE_SCHEMA_VERSION,
  parseCanonicalImportContract,
} from '../types/canonical-contract';
import type { ListingImportRepository } from '../repository/listing-import-repository';

export interface ListingBridgeNormalizationOptions {
  readonly repository?: Pick<ListingImportRepository, 'saveCanonicalPayload' | 'upsertField'>;
  readonly aiAdapter?: ListingBridgeSemanticAiAdapter;
  readonly enableAi?: boolean;
}

export interface ListingBridgeNormalizationResult {
  readonly contract: CanonicalImportContract;
  readonly conflicts: readonly MappingConflict[];
  readonly prohibitedDetections: ProhibitedFilterResult['prohibitedDetections'];
  readonly aiAssisted: boolean;
}

export class ListingBridgeNormalizationPipeline {
  private readonly extractor = new StructuredFactExtractor();
  private readonly propertyMapper = new PropertyTaxonomyMapper();
  private readonly amenityMapper = new AmenityTaxonomyMapper();
  private readonly prohibitedFilter = new ProhibitedDataFilter();
  private readonly commercialClassifier = new CommercialPolicyClassifier();
  private readonly conflictDetector = new MappingConflictDetector();

  async process(
    envelopeInput: unknown,
    options: ListingBridgeNormalizationOptions = {},
  ): Promise<ListingBridgeNormalizationResult> {
    const envelope = validateExtractionEnvelope(envelopeInput);
    const aiAdapter = (options.enableAi && options.aiAdapter) ? options.aiAdapter : new DisabledSemanticAiAdapter();

    // 1. Structured Candidate Extraction
    const candidateFacts = this.extractor.extract(envelope);

    // 2. Prohibited Data Filtering
    const rawPayloadObj = typeof envelope.payload === 'object' && envelope.payload !== null
      ? (envelope.payload as Record<string, unknown>)
      : {};
    const prohibitedResult = this.prohibitedFilter.filter(
      rawPayloadObj,
      candidateFacts.prohibitedCandidates,
    );

    // 3. Property Taxonomy Mapping
    let propertyMapping = this.propertyMapper.normalizePropertyType(
      candidateFacts.propertyType?.rawValue,
    );

    // 4. Amenity Taxonomy Mapping
    const rawAmenityValues = candidateFacts.amenities.map((a) => a.rawValue);
    const amenityMapping = this.amenityMapper.normalizeAmenities(rawAmenityValues);

    // 5. Commercial and Policy Classification
    const commercialResult = this.commercialClassifier.classify(
      candidateFacts.pricingHints,
      candidateFacts.rules,
    );

    // 6. Conflict Detection
    const conflicts = this.conflictDetector.detectConflicts({
      maxGuests: parseOptionalPositiveInt(candidateFacts.capacity.maxGuests?.rawValue),
      bedrooms: parseOptionalNonNegativeInt(candidateFacts.capacity.bedrooms?.rawValue),
      beds: parseOptionalNonNegativeInt(candidateFacts.capacity.beds?.rawValue),
      quantity: parseOptionalPositiveInt(candidateFacts.capacity.quantity?.rawValue),
      minDuration: commercialResult.ruleHints.minDuration,
      maxDuration: commercialResult.ruleHints.maxDuration,
      latitude: parseOptionalFloat(candidateFacts.location.latitude?.rawValue),
      longitude: parseOptionalFloat(candidateFacts.location.longitude?.rawValue),
      condition: typeof candidateFacts.condition?.rawValue === 'string' ? candidateFacts.condition.rawValue.trim() : undefined,
      categorySlug: propertyMapping.canonicalCategorySlug,
    });

    // 7. Optional Bounded AI Semantic Assistance (only if category ambiguous or unmapped amenities)
    let aiAssisted = false;
    const finalAmenities = [...amenityMapping.canonicalAmenities];

    if (
      aiAdapter.isAvailable()
      && (propertyMapping.requiresReview || amenityMapping.unmappedAmenities.length > 0)
    ) {
      try {
        const rawTitle = typeof candidateFacts.title?.rawValue === 'string' ? candidateFacts.title.rawValue : undefined;
        const rawDesc = typeof candidateFacts.description?.rawValue === 'string' ? candidateFacts.description.rawValue : undefined;

        const aiResponse = await aiAdapter.mapAmbiguousFields({
          rawTitle,
          rawDescription: rawDesc,
          rawPropertyType: typeof candidateFacts.propertyType?.rawValue === 'string' ? candidateFacts.propertyType.rawValue : undefined,
          unmappedAmenities: amenityMapping.unmappedAmenities,
          categoryAmbiguityReason: propertyMapping.reasonCode,
        });

        if (aiResponse) {
          aiAssisted = true;

          // Safely apply category suggestion if valid and wasn't a conflict
          if (
            aiResponse.categorySlugSuggestion
            && propertyMapping.confidence === 'REVIEW_RECOMMENDED'
          ) {
            const remapped = this.propertyMapper.normalizePropertyType(aiResponse.categorySlugSuggestion);
            if (remapped.canonicalCategorySlug !== 'other') {
              propertyMapping = {
                canonicalCategorySlug: remapped.canonicalCategorySlug,
                canonicalPropertyType: remapped.canonicalPropertyType,
                confidence: 'REVIEW_RECOMMENDED', // Remains REVIEW_RECOMMENDED because AI is not authoritative
                reasonCode: 'PROPERTY_TYPE_AI_SUGGESTED',
                requiresReview: true,
              };
            }
          }

          // Safely apply amenity suggestions if matching known taxonomy
          if (aiResponse.amenitySuggestions) {
            for (const sugg of aiResponse.amenitySuggestions) {
              const checked = this.amenityMapper.normalizeAmenities([sugg.canonicalSuggestion]);
              if (checked.canonicalAmenities.length > 0) {
                const canonicalName = checked.canonicalAmenities[0];
                if (!finalAmenities.includes(canonicalName)) {
                  finalAmenities.push(canonicalName);
                }
              }
            }
          }
        }
      } catch {
        // AI failure falls back safely to deterministic mapping
        aiAssisted = false;
      }
    }

    // 8. Field Confidence & Unresolved Tracking
    const nowIso = new Date().toISOString();
    const fieldConfidence: Record<string, ListingBridgeFieldConfidence> = {};
    const unresolvedFields: ListingBridgeUnresolvedField[] = [];
    const rejectedFields: ListingBridgeRejectedField[] = [];

    // Title
    const titleVal = typeof candidateFacts.title?.rawValue === 'string' ? candidateFacts.title.rawValue.trim() : undefined;
    if (titleVal && titleVal.length >= 3) {
      fieldConfidence['property.title'] = {
        state: 'HIGH_CONFIDENCE',
        authority: 'SOURCE',
        requiresProviderReview: false,
        providerConfirmed: false,
        provenance: makeProvenance(candidateFacts.title, nowIso),
      };
    } else {
      fieldConfidence['property.title'] = {
        state: 'MISSING',
        authority: 'SYSTEM',
        requiresProviderReview: true,
        providerConfirmed: false,
      };
      unresolvedFields.push({
        fieldName: 'property.title',
        reason: 'Required listing title is missing or less than 3 characters',
        severity: 'BLOCKING',
        expectedCorrectionSource: 'PROVIDER',
      });
    }

    // Description
    const descVal = typeof candidateFacts.description?.rawValue === 'string' ? candidateFacts.description.rawValue.trim() : undefined;
    if (descVal) {
      fieldConfidence['property.description'] = {
        state: 'HIGH_CONFIDENCE',
        authority: 'SOURCE',
        requiresProviderReview: false,
        providerConfirmed: false,
        provenance: makeProvenance(candidateFacts.description, nowIso),
      };
    } else {
      fieldConfidence['property.description'] = {
        state: 'MISSING',
        authority: 'SYSTEM',
        requiresProviderReview: false,
        providerConfirmed: false,
      };
      unresolvedFields.push({
        fieldName: 'property.description',
        reason: 'Listing description is empty',
        severity: 'OPTIONAL',
        expectedCorrectionSource: 'PROVIDER',
      });
    }

    // Property / Category
    fieldConfidence['property.suggestedCategoryId'] = {
      state: propertyMapping.confidence,
      authority: aiAssisted ? 'AI_ASSISTED' : 'SYSTEM',
      requiresProviderReview: propertyMapping.requiresReview,
      providerConfirmed: false,
      provenance: makeProvenance(candidateFacts.propertyType, nowIso),
    };
    if (propertyMapping.requiresReview || propertyMapping.canonicalCategorySlug === 'other') {
      unresolvedFields.push({
        fieldName: 'property.suggestedCategoryId',
        reason: `Category requires confirmation (${propertyMapping.reasonCode})`,
        severity: propertyMapping.confidence === 'MISSING' ? 'BLOCKING' : 'OPTIONAL',
        expectedCorrectionSource: 'PROVIDER',
      });
    }

    // Condition
    const condVal = typeof candidateFacts.condition?.rawValue === 'string'
      ? (candidateFacts.condition.rawValue.trim() as 'New' | 'Like New' | 'Good' | 'Fair' | 'Used')
      : undefined;
    const isConditionConflict = conflicts.some((c) => c.fieldName === 'property.condition');
    if (condVal && !isConditionConflict) {
      fieldConfidence['property.condition'] = {
        state: 'HIGH_CONFIDENCE',
        authority: 'SOURCE',
        requiresProviderReview: false,
        providerConfirmed: false,
        provenance: makeProvenance(candidateFacts.condition, nowIso),
      };
    } else if (isConditionConflict) {
      fieldConfidence['property.condition'] = {
        state: 'CONFLICT',
        authority: 'SYSTEM',
        requiresProviderReview: true,
        providerConfirmed: false,
        rejectedReason: 'Invalid condition enum value',
        provenance: makeProvenance(candidateFacts.condition, nowIso),
      };
      unresolvedFields.push({
        fieldName: 'property.condition',
        reason: 'Condition value is not recognized',
        severity: 'OPTIONAL',
        expectedCorrectionSource: 'PROVIDER',
      });
    }

    // Location
    const rawLoc = typeof candidateFacts.location.rawLocationString?.rawValue === 'string'
      ? candidateFacts.location.rawLocationString.rawValue.trim()
      : undefined;
    const city = typeof candidateFacts.location.city?.rawValue === 'string' ? candidateFacts.location.city.rawValue.trim() : undefined;
    const province = typeof candidateFacts.location.province?.rawValue === 'string' ? candidateFacts.location.province.rawValue.trim() : undefined;
    const country = typeof candidateFacts.location.country?.rawValue === 'string' ? candidateFacts.location.country.rawValue.trim() : 'Philippines';
    const postalCode = typeof candidateFacts.location.postalCode?.rawValue === 'string' ? candidateFacts.location.postalCode.rawValue.trim() : undefined;
    const lat = parseOptionalFloat(candidateFacts.location.latitude?.rawValue);
    const lng = parseOptionalFloat(candidateFacts.location.longitude?.rawValue);

    if (city || rawLoc) {
      fieldConfidence['location'] = {
        state: 'HIGH_CONFIDENCE',
        authority: 'SOURCE',
        requiresProviderReview: false,
        providerConfirmed: false,
        provenance: makeProvenance(candidateFacts.location.city ?? candidateFacts.location.rawLocationString, nowIso),
      };
    } else {
      fieldConfidence['location'] = {
        state: 'MISSING',
        authority: 'SYSTEM',
        requiresProviderReview: true,
        providerConfirmed: false,
      };
      unresolvedFields.push({
        fieldName: 'location',
        reason: 'Location city or formatted address is required',
        severity: 'BLOCKING',
        expectedCorrectionSource: 'PROVIDER',
      });
    }

    // Capacity
    const qty = parseOptionalPositiveInt(candidateFacts.capacity.quantity?.rawValue) ?? 1;
    const guests = parseOptionalPositiveInt(candidateFacts.capacity.maxGuests?.rawValue);
    const bedrooms = parseOptionalNonNegativeInt(candidateFacts.capacity.bedrooms?.rawValue);
    const bathrooms = parseOptionalNonNegativeInt(candidateFacts.capacity.bathrooms?.rawValue);

    fieldConfidence['capacity.quantity'] = {
      state: 'HIGH_CONFIDENCE',
      authority: 'SOURCE',
      requiresProviderReview: false,
      providerConfirmed: false,
      provenance: makeProvenance(candidateFacts.capacity.quantity, nowIso),
    };

    // Commercial and Rules Classifications
    for (const comm of commercialResult.classifications) {
      fieldConfidence[comm.fieldName] = {
        state: comm.confidence,
        authority: 'SOURCE',
        requiresProviderReview: true,
        providerConfirmed: false,
      };
      unresolvedFields.push({
        fieldName: comm.fieldName,
        reason: `Commercial or policy field requires review (${comm.reasonCode})`,
        severity: comm.confidence === 'CONFLICT' ? 'BLOCKING' : 'OPTIONAL',
        expectedCorrectionSource: 'PROVIDER',
      });
    }

    // Media
    const canonicalMedia: CanonicalImportMedia[] = candidateFacts.media.map((m, idx) => ({
      sourceReferenceHash: computeSha256(m.url),
      sourceUrlLabel: m.url.startsWith('http') ? m.url.slice(0, 120) : undefined,
      caption: m.caption,
      isCover: m.isCover || idx === 0,
      order: m.order,
      confidence: 'HIGH_CONFIDENCE',
    }));

    // Rooms
    const canonicalRooms: CanonicalImportRoom[] = candidateFacts.rooms.map((r) => ({
      name: r.name,
      roomType: r.roomType,
      bedCount: r.bedCount,
      sleeps: r.sleeps,
    }));

    // Prohibited Detections Record in Rejected Fields
    for (const pro of prohibitedResult.prohibitedDetections) {
      rejectedFields.push({
        fieldName: pro.fieldName,
        reason: pro.reasonCode,
        sourceValueHash: pro.safeHash,
        prohibitedBy: 'RENTIPID_PROHIBITED_DATA_POLICY',
      });
      fieldConfidence[pro.fieldName] = {
        state: 'PROHIBITED',
        authority: 'SYSTEM',
        requiresProviderReview: false,
        providerConfirmed: false,
        rejectedReason: pro.reasonCode,
      };
    }

    // Build Canonical Contract
    const contractCandidate = {
      schemaVersion: LISTINGBRIDGE_SCHEMA_VERSION,
      source: {
        connectorId: envelope.connectorId,
        connectorTier: envelope.connectorTier as CanonicalImportContract['source']['connectorTier'],
        sourceReferenceHash: envelope.sourceReferenceHash,
        sourceReferenceLabel: envelope.sourceReferenceLabel,
        authorizationMethod: envelope.authorizationMethod as CanonicalImportContract['source']['authorizationMethod'],
        extractedAt: envelope.retrievedAt.toISOString(),
      },
      identity: {
        providerId: envelope.providerId,
        importJobId: envelope.importJobId,
        idempotencyKey: [envelope.importJobId, envelope.sourceReferenceHash].join(':'),
      },
      property: {
        title: titleVal,
        description: descVal,
        suggestedCategoryId: propertyMapping.canonicalCategorySlug,
        condition: condVal,
        propertyType: propertyMapping.canonicalPropertyType,
      },
      location: {
        rawLocationString: rawLoc,
        city,
        province,
        country,
        postalCode,
        latitude: lat,
        longitude: lng,
      },
      capacity: {
        quantity: qty,
        maxGuests: guests,
        bedrooms,
        bathrooms,
      },
      rooms: canonicalRooms,
      amenities: finalAmenities,
      rules: {
        generalRules: commercialResult.ruleHints.generalRules,
        minDuration: commercialResult.ruleHints.minDuration,
        maxDuration: commercialResult.ruleHints.maxDuration,
        pickupAvailable: typeof candidateFacts.rules.pickupAvailable?.rawValue === 'boolean' ? candidateFacts.rules.pickupAvailable.rawValue : true,
        deliveryAvailable: typeof candidateFacts.rules.deliveryAvailable?.rawValue === 'boolean' ? candidateFacts.rules.deliveryAvailable.rawValue : false,
        deliveryFee: commercialResult.ruleHints.deliveryFee,
      },
      pricingHints: {
        hourlyRate: commercialResult.pricingHints.hourlyRate,
        dailyRate: commercialResult.pricingHints.dailyRate,
        weeklyRate: commercialResult.pricingHints.weeklyRate,
        monthlyRate: commercialResult.pricingHints.monthlyRate,
        securityDeposit: commercialResult.pricingHints.securityDeposit,
        replacementValue: commercialResult.pricingHints.replacementValue,
        currency: 'PHP' as const,
      },
      availability: {
        requiresProviderConfirmation: true,
      },
      media: canonicalMedia,
      provenance: {
        rawPayloadHash: candidateFacts.rawPayloadHash,
        aiAssisted,
        aiOutputAuthoritative: false as const,
        extractedFactCount: countExtractedFacts(candidateFacts),
        rejectedFields,
      },
      fieldConfidence,
      unresolvedFields,
    };

    const validatedContract = parseCanonicalImportContract(contractCandidate);

    // 9. Provenance Persistence (if repository provided)
    if (options.repository) {
      await this.persistContractProvenance(
        options.repository,
        envelope,
        validatedContract,
      );
    }

    return Object.freeze({
      contract: validatedContract,
      conflicts: Object.freeze(conflicts),
      prohibitedDetections: prohibitedResult.prohibitedDetections,
      aiAssisted,
    });
  }

  private async persistContractProvenance(
    repository: Pick<ListingImportRepository, 'saveCanonicalPayload' | 'upsertField'>,
    envelope: ListingBridgeExtractionEnvelope,
    contract: CanonicalImportContract,
  ): Promise<void> {
    // 1. Save canonical payload to job
    await repository.saveCanonicalPayload(envelope.importJobId, contract);

    // 2. Persist field-level provenance
    for (const [fieldName, confidence] of Object.entries(contract.fieldConfidence)) {
      const isProhibited = confidence.state === 'PROHIBITED';
      const isBlocking = contract.unresolvedFields.some(
        (u) => u.fieldName === fieldName && u.severity === 'BLOCKING',
      );

      await repository.upsertField({
        jobId: envelope.importJobId,
        sourceId: envelope.sourceId,
        fieldName,
        sourceFieldName: confidence.provenance?.sourceField,
        sourceValueHash: confidence.provenance?.sourceHash,
        normalizedValue: isProhibited ? null : getContractFieldValue(contract, fieldName),
        confidenceState: confidence.state,
        confidenceScore: confidence.score,
        authority: confidence.authority,
        isRequired: isBlocking,
        isBlocking,
        prohibitedReason: isProhibited ? confidence.rejectedReason : undefined,
      });
    }
  }
}

function makeProvenance(fact: RawCandidateFact | undefined, nowIso: string) {
  if (!fact) return undefined;
  return {
    sourceField: fact.sourceField,
    sourceHash: fact.valueHash,
    extractedAt: nowIso,
    normalizedAt: nowIso,
  };
}

function parseOptionalPositiveInt(val: unknown): number | undefined {
  if (typeof val === 'number' && Number.isInteger(val) && val > 0) return val;
  if (typeof val === 'string') {
    const p = parseInt(val.trim(), 10);
    return !Number.isNaN(p) && p > 0 ? p : undefined;
  }
  return undefined;
}

function parseOptionalNonNegativeInt(val: unknown): number | undefined {
  if (typeof val === 'number' && Number.isInteger(val) && val >= 0) return val;
  if (typeof val === 'string') {
    const p = parseInt(val.trim(), 10);
    return !Number.isNaN(p) && p >= 0 ? p : undefined;
  }
  return undefined;
}

function parseOptionalFloat(val: unknown): number | undefined {
  if (typeof val === 'number' && !Number.isNaN(val)) return val;
  if (typeof val === 'string') {
    const p = parseFloat(val.trim());
    return !Number.isNaN(p) ? p : undefined;
  }
  return undefined;
}

function countExtractedFacts(candidateFacts: ExtractedCandidateFacts): number {
  let count = 0;
  if (candidateFacts.title) count++;
  if (candidateFacts.description) count++;
  if (candidateFacts.propertyType) count++;
  if (candidateFacts.condition) count++;
  if (candidateFacts.location.city) count++;
  if (candidateFacts.location.rawLocationString) count++;
  if (candidateFacts.capacity.quantity) count++;
  if (candidateFacts.capacity.maxGuests) count++;
  if (candidateFacts.capacity.bedrooms) count++;
  count += candidateFacts.amenities.length;
  count += candidateFacts.media.length;
  return count;
}

function getContractFieldValue(contract: CanonicalImportContract, fieldName: string): unknown {
  const parts = fieldName.split('.');
  let curr: unknown = contract;
  for (const p of parts) {
    if (curr && typeof curr === 'object' && p in curr) {
      curr = (curr as Record<string, unknown>)[p];
    } else {
      return null;
    }
  }
  return curr ?? null;
}
