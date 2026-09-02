import {
  createListingBridgeConnectorRegistry,
  ListingBridgeConnectorRegistry,
  ListingBridgeTestConnector,
  listingBridgeTestConnectorDescriptor,
  resolveListingBridgeEnvironment,
  createListingBridgePlatformConnectors,
} from '../connectors';
import { isListingBridgeEnabled } from '../connectors/feature-flags';
import { ListingBridgeReviewSnapshotEngine } from '../review/review-snapshot-engine';
import { ListingBridgeProviderCorrectionService } from '../review/provider-correction-service';
import { ListingBridgeP9HandoffBoundary, type ListingBridgeP9HandoffContract } from '../review/p9-handoff';
import { ListingBridgeDraftCreationService } from '../draft/draft-creation-service';
import type { ListingBridgeDraftCreationResult, ListingAuthorityAdapter } from '../draft/types';
import type { ListingBridgeRightsConfirmationService } from '../authorization/rights-confirmation';
import type { ListingBridgeReviewSnapshot, ProviderCorrectionResult } from '../review/types';
import type { ListingBridgePublicConnectorDescriptor } from '../connectors/descriptor';

export interface ConnectorOptionDTO {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly tier: string;
  readonly supportedImportMethods: readonly string[];
  readonly requiresAuth: boolean;
  readonly availabilityState: string;
  readonly availabilityMessage?: string;
  readonly retrievalMode?: string;
  readonly automatedFetch?: boolean;
}

export interface ListingBridgeUiActionResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly errorCode?: string;
  readonly errorMessage?: string;
}

export class ListingBridgeUiService {
  private readonly snapshotEngine = new ListingBridgeReviewSnapshotEngine();
  private readonly correctionService = new ListingBridgeProviderCorrectionService();
  private readonly rightsService?: ListingBridgeRightsConfirmationService;
  private readonly registry?: ListingBridgeConnectorRegistry;
  private readonly handoffBoundary = new ListingBridgeP9HandoffBoundary();
  private readonly draftCreationService: ListingBridgeDraftCreationService;

  constructor(options?: {
    rightsService?: ListingBridgeRightsConfirmationService;
    registry?: ListingBridgeConnectorRegistry;
    listingAuthority?: ListingAuthorityAdapter;
  }) {
    this.rightsService = options?.rightsService;
    this.registry = options?.registry;
    this.draftCreationService = new ListingBridgeDraftCreationService(
      undefined,
      options?.listingAuthority,
    );
  }

  /**
   * Retrieves available source connectors enabled for the current environment.
   */
  async getAvailableConnectors(): Promise<ListingBridgeUiActionResponse<readonly ConnectorOptionDTO[]>> {
    if (!isListingBridgeEnabled()) {
      return Object.freeze({
        success: false,
        errorCode: 'LISTINGBRIDGE_DISABLED',
        errorMessage: 'ListingBridge is currently disabled by system policy.',
      });
    }

    const currentEnvironment = resolveListingBridgeEnvironment();
    const isTrueProduction = currentEnvironment === 'PRODUCTION';

    const testConnector = new ListingBridgeTestConnector();
    const registry =
      this.registry ??
      createListingBridgeConnectorRegistry([
        { connector: testConnector, descriptor: listingBridgeTestConnectorDescriptor },
        ...createListingBridgePlatformConnectors(),
      ]);

    const registered = registry.listRegisteredConnectors();

    const safeConnectors: ConnectorOptionDTO[] = (await Promise.all(registered
      .filter((c: ListingBridgePublicConnectorDescriptor) => {
        // Internal test connectors must never appear in true production
        if (isTrueProduction && c.id.includes('test')) return false;
        return true;
      })
      .map(async (c: ListingBridgePublicConnectorDescriptor) => {
        const availability = await registry.evaluateAvailability(c.id, { environment: currentEnvironment });
        const retrievalMode = c.id === 'facebook.marketplace.assisted.v1' ? 'ASSISTED' : c.sourceMode;
        return {
        id: c.id,
        name: c.displayName,
        description: retrievalMode === 'ASSISTED' ? `Import information from a ${c.displayName} listing you manage` : `Import listings from ${c.displayName}`,
        tier: c.tier,
        supportedImportMethods: [c.sourceMode],
        requiresAuth:
          c.capabilities.includes('PROVIDER_RIGHTS_CONFIRMATION') ||
          c.authorization.requiresProviderRightsConfirmation,
        availabilityState: availability.available ? 'AVAILABLE' : 'DISABLED',
        availabilityMessage: availability.blockedReasons.join(', '),
        retrievalMode,
        automatedFetch: retrievalMode !== 'ASSISTED',
        };
      })) as ConnectorOptionDTO[]);

    return Object.freeze({
      success: true,
      data: Object.freeze(safeConnectors),
    });
  }

  /**
   * Confirms provider authority and media rights for an import job.
   */
  async confirmRights(
    jobId: string,
    actorUserId: string,
  ): Promise<ListingBridgeUiActionResponse<{ confirmedAt: string }>> {
    try {
      if (this.rightsService) {
        const evidence = await this.rightsService.confirmRights({
          actorUserId,
          importJobId: jobId,
          ownsOrManagesProperty: true,
          authorizedToSubmitImportedInformation: true,
          hasImportedMediaReuseRights: true,
          acceptsAccuracyResponsibility: true,
        });

        return Object.freeze({
          success: true,
          data: { confirmedAt: evidence.confirmedAt },
        });
      }

      return Object.freeze({
        success: true,
        data: { confirmedAt: new Date().toISOString() },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return Object.freeze({
        success: false,
        errorCode: 'RIGHTS_CONFIRMATION_FAILED',
        errorMessage: msg,
      });
    }
  }

  /**
   * Submits a provider correction with server-side revalidation and persistence.
   */
  async submitCorrection(
    snapshot: ListingBridgeReviewSnapshot,
    fieldName: string,
    correctedValue: unknown,
    actorUserId: string,
  ): Promise<ListingBridgeUiActionResponse<ProviderCorrectionResult>> {
    if (snapshot.providerId && snapshot.providerId !== actorUserId) {
      return Object.freeze({
        success: false,
        errorCode: 'OWNERSHIP_MISMATCH',
        errorMessage: 'Actor is not authorized to submit corrections for this import job',
      });
    }

    const contract = this.reconstructContractFromSnapshot(snapshot);

    const result = await this.correctionService.applyCorrection(
      {
        actorUserId,
        importJobId: snapshot.importJobId,
        fieldName,
        correctedValue,
      },
      contract,
      snapshot.fields,
      snapshot.jobStatus,
    );

    if (!result.success) {
      return Object.freeze({
        success: false,
        errorCode: result.errorCode || 'CORRECTION_FAILED',
        errorMessage: result.errorMessage || 'Validation failed for corrected value',
        data: result,
      });
    }

    return Object.freeze({
      success: true,
      data: result,
    });
  }

  /**
   * Creates a native RENTipid draft through existing listing authority.
   */
  async createDraft(
    snapshot: ListingBridgeReviewSnapshot,
    actorUserId: string,
    idempotencyKey?: string,
  ): Promise<ListingBridgeUiActionResponse<ListingBridgeDraftCreationResult>> {
    const result = await this.draftCreationService.createDraftFromImport(
      {
        actorUserId,
        importJobId: snapshot.importJobId,
        idempotencyKey,
      },
      {
        overrideSnapshot: snapshot,
      },
    );

    if (!result.success) {
      return Object.freeze({
        success: false,
        errorCode: result.errorCode || 'DRAFT_CREATION_FAILED',
        errorMessage: result.errorMessage || 'Failed to create RENTipid draft from import',
        data: result,
      });
    }

    return Object.freeze({
      success: true,
      data: result,
    });
  }

  /**
   * Packages review state for P9 handoff.
   */
  async prepareP9Handoff(
    snapshot: ListingBridgeReviewSnapshot,
  ): Promise<ListingBridgeUiActionResponse<ListingBridgeP9HandoffContract>> {
    const handoff = this.handoffBoundary.prepareHandoff(snapshot);
    return Object.freeze({
      success: true,
      data: handoff,
    });
  }

  private reconstructContractFromSnapshot(snapshot: ListingBridgeReviewSnapshot) {
    const getVal = (name: string) => snapshot.fields.find((f) => f.fieldName === name)?.normalizedValue;

    return {
      schemaVersion: 'rentipid.listingbridge.v1' as const,
      source: {
        connectorId: 'ui-import',
        connectorTier: 'TIER_5_MANUAL' as const,
        sourceReferenceHash: 'ref-hash',
        authorizationMethod: 'PROVIDER_RIGHTS_CONFIRMATION' as const,
        extractedAt: new Date().toISOString(),
      },
      identity: {
        providerId: snapshot.providerId,
        importJobId: snapshot.importJobId,
        idempotencyKey: `idemp-${snapshot.importJobId}`,
      },
      property: {
        title: typeof getVal('title') === 'string' ? (getVal('title') as string) : undefined,
        description: typeof getVal('description') === 'string' ? (getVal('description') as string) : undefined,
        propertyType: typeof getVal('propertyType') === 'string' ? (getVal('propertyType') as string) : undefined,
      },
      location: {
        city: snapshot.location.normalizedAddress?.locality || undefined,
        province: snapshot.location.normalizedAddress?.administrativeArea1 || undefined,
        country: snapshot.location.normalizedAddress?.countryCode || 'PH',
      },
      capacity: (getVal('capacity') as Record<string, unknown>) || {},
      rooms: [],
      amenities: (getVal('amenities') as readonly string[]) || [],
      rules: {},
      pricingHints: (getVal('pricingHints') as { currency: 'PHP' }) || { currency: 'PHP' },
      availability: { requiresProviderConfirmation: true },
      media: (snapshot.media.validatedCount > 0 ? [{ sourceReferenceHash: 'cover', isCover: true, order: 1, confidence: 'VERIFIED' as const }] : []),
      fieldConfidence: {},
      unresolvedFields: [],
      provenance: {
        rawPayloadHash: 'hash',
        aiAssisted: false,
        aiOutputAuthoritative: false as const,
        extractedFactCount: 5,
        rejectedFields: [],
      },
    };
  }
}
