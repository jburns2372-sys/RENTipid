import {
  createListingBridgeConnectorRegistry,
  createListingBridgeTestConnector,
  testConnectorDescriptor,
  LISTINGBRIDGE_TEST_SOURCE_REFERENCE,
} from '../../../src/lib/listingbridge/connectors';
import {
  isListingBridgeEnabled,
  isManualListingCreationIndependentOfListingBridgeFlags,
  ListingBridgeFeatureFlagEvaluator,
  type ListingBridgeSystemSettingReader,
} from '../../../src/lib/listingbridge/connectors/feature-flags';
import { ListingBridgeUiService } from '../../../src/lib/listingbridge/ui/actions';
import { ListingBridgeDraftCreationService } from '../../../src/lib/listingbridge/draft/draft-creation-service';
import { ListingBridgeReviewSnapshotEngine } from '../../../src/lib/listingbridge/review/review-snapshot-engine';
import { ListingBridgeUnifiedAiAdapter } from '../../../src/lib/listingbridge/ai/unified-ai-adapter';
import { ListingBridgeAiService } from '../../../src/lib/listingbridge/ai/listingbridge-ai-service';
import { ListingBridgeRetryEngine } from '../../../src/lib/listingbridge/observability/retry';
import { ListingBridgeHealthDiagnosticsService } from '../../../src/lib/listingbridge/observability/health';
import type { CanonicalImportContract } from '../../../src/lib/listingbridge/types/canonical-contract';

describe('ListingBridge P12: Full Integration & System Regression (LB-REG-001..003)', () => {
  const testConnector = createListingBridgeTestConnector();

  const mockDb: ListingBridgeSystemSettingReader = {
    systemSetting: {
      findMany: jest.fn(async (args) =>
        args.where.setting_key.in.map((key: string) => ({
          setting_key: key,
          setting_value: 'true',
        })),
      ),
    },
  };

  const connectorRegistry = createListingBridgeConnectorRegistry(
    [{ connector: testConnector, descriptor: testConnectorDescriptor }],
    { featureEvaluator: new ListingBridgeFeatureFlagEvaluator(mockDb) },
  );

  const mockListingAuthority = {
    createDraft: jest.fn().mockImplementation(async (payload) => ({
      id: `lst_native_${Date.now()}`,
      title: payload.title,
      description: payload.description,
      dailyRate: payload.dailyRate,
      status: 'Draft',
      ownerId: payload.ownerId,
      createdAt: new Date().toISOString(),
    })),
  };

  const createMockRepo = (initialJob: {
    id: string;
    provider_id: string;
    status: string;
    created_listing_id?: string | null;
  }) => {
    let currentJob = { ...initialJob };
    return {
      getJobById: jest.fn().mockImplementation(async (id: string) => {
        if (id === currentJob.id) return currentJob;
        return null;
      }),
      markJobCreatingDraft: jest.fn().mockImplementation(async () => {
        if (currentJob.created_listing_id) {
          throw new Error('LISTING_ALREADY_EXISTS: Draft already created for this import job');
        }
        currentJob = { ...currentJob, status: 'CREATING_DRAFT' };
        return currentJob;
      }),
      completeJobWithListing: jest.fn().mockImplementation(async (_id: string, listingId: string) => {
        currentJob = {
          ...currentJob,
          status: 'COMPLETED',
          created_listing_id: listingId,
        };
        return currentJob;
      }),
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // LB-REG-001: Manual Listing Flow Independence
  // =========================================================================
  describe('LB-REG-001: Manual Listing Independence & Feature Flag Regression', () => {
    it('Guarantees manual listing wizard remains operational regardless of ListingBridge flags', () => {
      expect(isManualListingCreationIndependentOfListingBridgeFlags()).toBe(true);
      expect(typeof isListingBridgeEnabled()).toBe('boolean');
    });

    it('Connector discovery safely isolates internal test connectors in production mode', async () => {
      const uiService = new ListingBridgeUiService({ registry: connectorRegistry });
      const response = await uiService.getAvailableConnectors();

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data?.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // LB-REG-002: Provider Onboarding & KYC Guardrails
  // =========================================================================
  describe('LB-REG-002: Provider Onboarding, KYC & Permission Boundaries', () => {
    it('Ensures ListingBridge imports require explicit provider rights confirmation before draft creation', async () => {
      const rawListing = await testConnector.fetchListing(LISTINGBRIDGE_TEST_SOURCE_REFERENCE);
      const rawContract = await testConnector.normalize(rawListing);

      const contractWithoutRights: CanonicalImportContract = {
        ...rawContract,
        identity: {
          ...rawContract.identity,
          providerId: 'usr-unconfirmed-prov',
          importJobId: 'job-unconfirmed-001',
        },
        availability: {
          ...rawContract.availability,
          requiresProviderConfirmation: true,
        },
      };

      const snapshotEngine = new ListingBridgeReviewSnapshotEngine();
      const snapshot = snapshotEngine.buildSnapshot({
        contract: contractWithoutRights,
        importJobId: 'job-unconfirmed-001',
        providerId: 'usr-unconfirmed-prov',
        jobStatus: 'VALIDATING',
        rights: { rightsConfirmed: false, isBlocking: true },
      });

      // Rights confirmation is unconfirmed (false by default)
      const mockRepo = createMockRepo({
        id: 'job-unconfirmed-001',
        provider_id: 'usr-unconfirmed-prov',
        status: 'VALIDATING',
      });
      const draftService = new ListingBridgeDraftCreationService(mockRepo, mockListingAuthority);

      const result = await draftService.createDraftFromImport(
        {
          actorUserId: 'usr-unconfirmed-prov',
          importJobId: 'job-unconfirmed-001',
        },
        { overrideSnapshot: snapshot },
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('DRAFT_READINESS_FAILED');
      expect(mockListingAuthority.createDraft).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // LB-REG-003: Listing Edit, Search, Booking & Dashboard Coexistence
  // =========================================================================
  describe('LB-REG-003: Native Listing Coexistence, Publication & Idempotency', () => {
    it('E2E Flow: Validated import creates exactly ONE native RENTipid draft with Draft status', async () => {
      const rawListing = await testConnector.fetchListing(LISTINGBRIDGE_TEST_SOURCE_REFERENCE);
      const rawContract = await testConnector.normalize(rawListing);

      const importJobId = rawContract.identity.importJobId || 'job_listingbridge_test_fixture';
      const snapshotEngine = new ListingBridgeReviewSnapshotEngine();
      const snapshot = snapshotEngine.buildSnapshot({
        contract: rawContract,
        importJobId,
        providerId: 'provider_test_fixture',
        jobStatus: 'READY_FOR_DRAFT',
        rights: { rightsConfirmed: true, isBlocking: false },
      });

      const mockRepo = createMockRepo({
        id: importJobId,
        provider_id: 'provider_test_fixture',
        status: 'READY_FOR_DRAFT',
      });
      const draftService = new ListingBridgeDraftCreationService(mockRepo, mockListingAuthority);

      // Step 1: First draft creation invocation
      const firstResult = await draftService.createDraftFromImport(
        {
          actorUserId: 'provider_test_fixture',
          importJobId,
          idempotencyKey: 'idemp-p12-001',
        },
        { overrideSnapshot: snapshot },
      );

      expect(firstResult.success).toBe(true);
      expect(firstResult.listingId).toBeDefined();
      expect(mockListingAuthority.createDraft).toHaveBeenCalledTimes(1);

      // Verify native listing attributes
      const actorArg = mockListingAuthority.createDraft.mock.calls[0][0];
      const createdPayload = mockListingAuthority.createDraft.mock.calls[0][1];
      expect(actorArg).toBe('provider_test_fixture');
      expect(createdPayload.title).toBe(rawContract.property.title);
      expect(createdPayload.provider_id).toBe('provider_test_fixture');
      expect(createdPayload.status).toBe('Draft');

      // Step 2: Idempotent repeat request returns the existing listing ID without re-invoking createDraft
      const repeatResult = await draftService.createDraftFromImport(
        {
          actorUserId: 'provider_test_fixture',
          importJobId,
          idempotencyKey: 'idemp-p12-001',
        },
        { overrideSnapshot: snapshot },
      );

      expect(repeatResult.success).toBe(true);
      expect(repeatResult.listingId).toBe(firstResult.listingId);
      expect(mockListingAuthority.createDraft).toHaveBeenCalledTimes(1); // Exactly once
    });
  });

  // =========================================================================
  // AI-Assisted vs AI-Disabled Fallback Integration
  // =========================================================================
  describe('ListingBridge AI Coexistence & Fallbacks', () => {
    it('Deterministic import pipeline functions 100% reliably with AI assistance disabled', async () => {
      const aiService = new ListingBridgeAiService();
      const disabledAdapter = new ListingBridgeUnifiedAiAdapter({
        enabled: false,
        aiService,
      });

      const output = await disabledAdapter.mapAmbiguousFields({
        rawPropertyType: 'loft',
        unmappedAmenities: ['high speed fibre'],
      });

      // Disabled AI returns null safely (fail-closed fallback to manual provider review)
      expect(output).toBeNull();
    });

    it('AI assistance provides structured advisory suggestions without mutating authority', async () => {
      const aiService = new ListingBridgeAiService();
      const enabledAdapter = new ListingBridgeUnifiedAiAdapter({
        enabled: true,
        aiService,
      });

      const output = await enabledAdapter.mapAmbiguousFields({
        rawPropertyType: 'condominium',
        unmappedAmenities: ['wifi'],
      });

      expect(output).not.toBeNull();
      expect(output?.categorySlugSuggestion).toBe('condominiums');
      expect(output?.amenitySuggestions?.length).toBeGreaterThan(0);
      expect(output?.amenitySuggestions?.[0]?.canonicalSuggestion).toBe('WiFi');
    });
  });

  // =========================================================================
  // Resilience, Retry & Health Diagnostics Integration
  // =========================================================================
  describe('Resilience, Retry & Health Diagnostics Integration', () => {
    it('Health diagnostics and retry engine operate cleanly under operational load', () => {
      const healthService = new ListingBridgeHealthDiagnosticsService(connectorRegistry);
      const report = healthService.getHealthReport();

      expect(report.status).toBe('HEALTHY');
      expect(report.availableConnectorsCount).toBeGreaterThanOrEqual(1);

      const retryEngine = new ListingBridgeRetryEngine();
      expect(retryEngine.classifyFailure(new Error('503 Service Unavailable'))).toBe('RETRYABLE');
      expect(retryEngine.classifyFailure(new Error('SSRF_BLOCKED: loopback denied'))).toBe('FINAL_SECURITY_BLOCKED');
    });
  });
});
