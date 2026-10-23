import type {
  ProviderCorrectionCommand,
  ProviderCorrectionResult,
  ReviewFieldModel,
} from './types';
import { ListingBridgeDraftReadinessEngine } from './draft-readiness-engine';
import { ListingBridgeReviewSnapshotEngine } from './review-snapshot-engine';
import { PropertyTaxonomyMapper } from '../normalization/taxonomy/property-taxonomy';
import { AmenityTaxonomyMapper } from '../normalization/taxonomy/amenity-taxonomy';
import { ListingBridgeLocationIntelligenceService } from '../location/location-intelligence';
import type { ListingImportRepository } from '../repository/listing-import-repository';
import type { CanonicalImportContract } from '../types/canonical-contract';
import type { ListingImportJobStatus } from '../types/job-state';

export interface ProviderCorrectionServiceOptions {
  readonly repository?: Pick<ListingImportRepository, 'upsertField'>;
  readonly onAuditLog?: (event: {
    eventType: string;
    jobId: string;
    actorUserId: string;
    fieldName: string;
    action: string;
  }) => Promise<void> | void;
}

export class ListingBridgeProviderCorrectionService {
  private readonly propertyMapper = new PropertyTaxonomyMapper();
  private readonly amenityMapper = new AmenityTaxonomyMapper();
  private readonly locationService = new ListingBridgeLocationIntelligenceService();
  private readonly readinessEngine = new ListingBridgeDraftReadinessEngine();
  private readonly snapshotEngine = new ListingBridgeReviewSnapshotEngine();

  async applyCorrection(
    command: ProviderCorrectionCommand,
    contract: CanonicalImportContract,
    currentFields: readonly ReviewFieldModel[],
    jobStatus: ListingImportJobStatus,
    options: ProviderCorrectionServiceOptions = {},
  ): Promise<ProviderCorrectionResult> {
    const targetField = currentFields.find((f) => f.fieldName === command.fieldName);

    if (!targetField) {
      return Object.freeze({
        success: false,
        importJobId: command.importJobId,
        fieldName: command.fieldName,
        previousConfidence: 'MISSING',
        newConfidence: 'MISSING',
        updatedValue: command.correctedValue,
        readiness: this.readinessEngine.evaluate({
          fields: currentFields,
          media: { totalCandidates: contract.media.length, validatedCount: contract.media.length, rejectedCount: 0, duplicateCount: 0, hasCoverPhoto: true, isBlocking: false },
          location: { isWithinPhilippineBounds: true, conflicts: [], isBlocking: false, requiresReview: false },
          duplicate: { matchLevel: 'NO_MATCH', confidenceScore: 0.0, signals: [], isBlocking: false, requiresReview: false },
          rights: { rightsConfirmed: true, isBlocking: false },
          jobStatus,
        }),
        errorCode: 'FIELD_NOT_FOUND',
        errorMessage: `Field '${command.fieldName}' does not exist in review model`,
      });
    }

    // 1. Prohibited fields cannot be modified or approved by provider
    if (targetField.confidenceState === 'PROHIBITED') {
      return Object.freeze({
        success: false,
        importJobId: command.importJobId,
        fieldName: command.fieldName,
        previousConfidence: 'PROHIBITED',
        newConfidence: 'PROHIBITED',
        updatedValue: command.correctedValue,
        readiness: this.readinessEngine.evaluate({
          fields: currentFields,
          media: { totalCandidates: contract.media.length, validatedCount: contract.media.length, rejectedCount: 0, duplicateCount: 0, hasCoverPhoto: true, isBlocking: false },
          location: { isWithinPhilippineBounds: true, conflicts: [], isBlocking: false, requiresReview: false },
          duplicate: { matchLevel: 'NO_MATCH', confidenceScore: 0.0, signals: [], isBlocking: false, requiresReview: false },
          rights: { rightsConfirmed: true, isBlocking: false },
          jobStatus,
        }),
        errorCode: 'PROHIBITED_FIELD_CORRECTION_DISALLOWED',
        errorMessage: `Field '${command.fieldName}' contains prohibited data and cannot be corrected into listing content`,
      });
    }

    // 2. Authoritative field validation
    const validationError = this.validateFieldValue(command.fieldName, command.correctedValue);
    if (validationError) {
      return Object.freeze({
        success: false,
        importJobId: command.importJobId,
        fieldName: command.fieldName,
        previousConfidence: targetField.confidenceState,
        newConfidence: targetField.confidenceState,
        updatedValue: command.correctedValue,
        readiness: this.readinessEngine.evaluate({
          fields: currentFields,
          media: { totalCandidates: contract.media.length, validatedCount: contract.media.length, rejectedCount: 0, duplicateCount: 0, hasCoverPhoto: true, isBlocking: false },
          location: { isWithinPhilippineBounds: true, conflicts: [], isBlocking: false, requiresReview: false },
          duplicate: { matchLevel: 'NO_MATCH', confidenceScore: 0.0, signals: [], isBlocking: false, requiresReview: false },
          rights: { rightsConfirmed: true, isBlocking: false },
          jobStatus,
        }),
        errorCode: 'VALIDATION_FAILED',
        errorMessage: validationError,
      });
    }

    // 3. Construct updated fields
    const updatedFields = currentFields.map((f) => {
      if (f.fieldName === command.fieldName) {
        return {
          ...f,
          normalizedValue: command.correctedValue,
          confidenceState: 'VERIFIED' as const,
          providerModified: true,
          validationState: 'VALIDATED' as const,
          isBlocking: false,
        };
      }
      return f;
    });

    // 4. Persist to repository if supplied
    if (options.repository) {
      await options.repository.upsertField({
        jobId: command.importJobId,
        fieldName: command.fieldName,
        normalizedValue: command.correctedValue as Record<string, unknown>,
        confidenceState: 'VERIFIED',
        authority: 'PROVIDER',
        isRequired: targetField.isRequired,
        isBlocking: false,
        providerModified: true,
        validationState: 'VALIDATED',
      });
    }

    // 5. Emit Audit Log
    if (options.onAuditLog) {
      await options.onAuditLog({
        eventType: 'RESOLUTION_SAVED',
        jobId: command.importJobId,
        actorUserId: command.actorUserId,
        fieldName: command.fieldName,
        action: 'PROVIDER_CORRECTION_APPLIED',
      });
    }

    // 6. Recalculate Draft Readiness
    const snapshot = this.snapshotEngine.buildSnapshot({
      importJobId: command.importJobId,
      providerId: command.actorUserId,
      jobStatus,
      contract,
      fields: updatedFields,
    });

    return Object.freeze({
      success: true,
      importJobId: command.importJobId,
      fieldName: command.fieldName,
      previousConfidence: targetField.confidenceState,
      newConfidence: 'VERIFIED',
      updatedValue: command.correctedValue,
      readiness: snapshot.readiness,
    });
  }

  private validateFieldValue(fieldName: string, value: unknown): string | null {
    if (value === null || value === undefined) {
      return `Value cannot be null or undefined for field '${fieldName}'`;
    }

    switch (fieldName) {
      case 'title': {
        if (typeof value !== 'string' || value.trim().length < 3) {
          return 'Listing title must be at least 3 characters long';
        }
        break;
      }
      case 'description': {
        if (typeof value !== 'string' || value.trim().length < 10) {
          return 'Listing description must be at least 10 characters long';
        }
        break;
      }
      case 'propertyType': {
        const slug = typeof value === 'string' ? value : (value as { slug?: string })?.slug;
        if (!slug || typeof slug !== 'string') {
          return 'Valid property category slug is required';
        }
        const mapped = this.propertyMapper.normalizePropertyType(slug);
        if (mapped.confidence === 'MISSING') {
          return `Unknown property category slug '${slug}'`;
        }
        break;
      }
      case 'capacity': {
        const guests = typeof value === 'number' ? value : (value as { guests?: number })?.guests;
        if (typeof guests !== 'number' || !Number.isInteger(guests) || guests < 1 || guests > 500) {
          return 'Guest capacity must be an integer between 1 and 500';
        }
        break;
      }
      case 'location': {
        const loc = value as { city?: string; latitude?: number; longitude?: number };
        const evaluated = this.locationService.evaluate({
          city: loc.city,
          latitude: loc.latitude,
          longitude: loc.longitude,
        });
        if (evaluated.conflicts.some((c) => c.severity === 'BLOCKING')) {
          return `Location validation failed: ${evaluated.conflicts[0].message}`;
        }
        break;
      }
    }

    return null;
  }
}
