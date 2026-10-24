import { createHash } from 'node:crypto';
import { LISTINGBRIDGE_SCHEMA_VERSION, type CanonicalImportContract } from '../types/canonical-contract';
import { evaluateListingBridgeConnectorAuthorization } from './authorization';
import { ListingBridgeMediaIngestionPipeline, type MediaIngestionResult } from '../media/media-ingestion-pipeline';
import type { ListingBridgeConnectorDescriptor } from './descriptor';
import type {
  ListingBridgeAuthorizationContext,
  ListingBridgeConnector,
  ListingBridgeConnectorCapabilities,
  ListingBridgeConnectorConfig,
  ListingBridgeHealthCheckResult,
  ListingBridgeResponseValidationResult,
  RawAvailabilityPayload,
  RawListingPayload,
  RawMediaPayload,
} from './types';

export interface ExternalConnectorFixture {
  readonly sourceReference: string;
  readonly sourceReferenceLabel: string;
  readonly payload: Record<string, unknown>;
}

export interface ExternalConnectorOptions {
  readonly descriptor: ListingBridgeConnectorDescriptor;
  readonly config: ListingBridgeConnectorConfig;
  readonly fixture: ExternalConnectorFixture;
  readonly credentialAvailable?: () => boolean;
  readonly authorizationMessage: string;
  readonly retrievalMode: 'DIRECT_API' | 'AUTHORIZED_PARTNER_API' | 'ASSISTED';
  readonly normalizePayload: (payload: Record<string, unknown>, source: RawListingPayload) => CanonicalImportContract;
}

export type ExternalConnectorInputType = 'SOURCE_URL' | 'PASTED_TEXT' | 'STRUCTURED_FILE' | 'DOCUMENT' | 'SCREENSHOT' | 'MEDIA';

export interface ExternalConnectorInput {
  readonly type: ExternalConnectorInputType;
  readonly data?: string | Uint8Array | Record<string, unknown>;
  readonly sourceReference?: string;
  readonly sourceReferenceLabel?: string;
  readonly mimeType?: string;
}

export function sha256(value: unknown): string {
  return createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
}

export function makeCanonicalMapper(input: {
  connectorId: string;
  tier: 'TIER_1_OAUTH' | 'TIER_2_PMS' | 'TIER_3_FILE';
  authorizationMethod: 'API_KEY_SERVER_SIDE' | 'OAUTH_SERVER_SIDE' | 'MANUAL_PROVIDER_INPUT';
  propertyType?: string;
}) {
  return (payload: Record<string, unknown>, source: RawListingPayload): CanonicalImportContract => {
    const location = typeof payload.location === 'object' && payload.location !== null
      ? payload.location as Record<string, unknown>
      : {};
    const text = (key: string) => typeof payload[key] === 'string' ? payload[key] as string : undefined;
    const title = text('title');
    const description = text('description');
    const amenities = Array.isArray(payload.amenities) ? payload.amenities.filter((v): v is string => typeof v === 'string') : [];
    const propertyType = text('propertyType') ?? input.propertyType;
    const rooms = Array.isArray(payload.rooms)
      ? payload.rooms.filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
        .map(r => ({ name: typeof r.name === 'string' ? r.name : undefined, roomType: typeof r.roomType === 'string' ? r.roomType : undefined, bedCount: typeof r.bedCount === 'number' ? r.bedCount : undefined }))
      : [];
    return {
      schemaVersion: LISTINGBRIDGE_SCHEMA_VERSION,
      source: { connectorId: input.connectorId, connectorTier: input.tier, sourceReferenceHash: source.sourceReferenceHash, authorizationMethod: input.authorizationMethod, extractedAt: source.retrievedAt },
      identity: { providerId: 'fixture-provider', idempotencyKey: sha256(`${input.connectorId}:${source.sourceReferenceHash}`) },
      property: { title, description, propertyType },
      location: { rawLocationString: text('locationText'), city: typeof location.city === 'string' ? location.city : undefined, province: typeof location.province === 'string' ? location.province : undefined, country: typeof location.country === 'string' ? location.country : 'Philippines' },
      capacity: { maxGuests: typeof payload.maxGuests === 'number' ? payload.maxGuests : undefined, bedrooms: typeof payload.bedrooms === 'number' ? payload.bedrooms : undefined, bathrooms: typeof payload.bathrooms === 'number' ? payload.bathrooms : undefined },
      rooms,
      amenities,
      rules: { generalRules: text('rules') },
      pricingHints: { dailyRate: typeof payload.dailyRate === 'number' ? payload.dailyRate : undefined, currency: 'PHP' },
      availability: { requiresProviderConfirmation: true },
      media: [],
      provenance: { rawPayloadHash: sha256(payload), aiAssisted: false, aiOutputAuthoritative: false, extractedFactCount: Object.keys(payload).length, rejectedFields: [] },
      fieldConfidence: {
        title: { state: title ? 'HIGH_CONFIDENCE' : 'MISSING', authority: 'SOURCE', requiresProviderReview: !title, providerConfirmed: false },
        description: { state: description ? 'HIGH_CONFIDENCE' : 'MISSING', authority: 'SOURCE', requiresProviderReview: !description, providerConfirmed: false },
      },
      unresolvedFields: [
        ...(!title ? [{ fieldName: 'title', reason: 'Source did not provide a title', severity: 'BLOCKING' as const, expectedCorrectionSource: 'PROVIDER' as const }] : []),
        ...(!description ? [{ fieldName: 'description', reason: 'Source did not provide a description', severity: 'BLOCKING' as const, expectedCorrectionSource: 'PROVIDER' as const }] : []),
      ],
    };
  };
}

export abstract class ListingBridgeExternalConnector implements ListingBridgeConnector {
  readonly config: ListingBridgeConnectorConfig;
  protected readonly descriptor: ListingBridgeConnectorDescriptor;
  private readonly fixture: ExternalConnectorFixture;
  private readonly credentialAvailable: () => boolean;
  private readonly authorizationMessage: string;
  private readonly retrievalMode: ExternalConnectorOptions['retrievalMode'];
  private readonly normalizePayload: ExternalConnectorOptions['normalizePayload'];

  protected constructor(options: ExternalConnectorOptions) {
    this.config = Object.freeze(options.config);
    this.descriptor = options.descriptor;
    this.fixture = options.fixture;
    this.credentialAvailable = options.credentialAvailable ?? (() => false);
    this.authorizationMessage = options.authorizationMessage;
    this.retrievalMode = options.retrievalMode;
    this.normalizePayload = options.normalizePayload;
  }

  async identifySource(input: string | Uint8Array) {
    const value = typeof input === 'string' ? input : Buffer.from(input).toString('utf8');
    const matched = value === this.fixture.sourceReference;
    return Object.freeze({ matched, connectorId: this.config.id, confidence: matched ? 1 : 0, sourceReferenceHash: sha256(value) });
  }

  getCapabilities(): ListingBridgeConnectorCapabilities { return this.config.capabilities; }

  async authorize(context: ListingBridgeAuthorizationContext): Promise<boolean> {
    return evaluateListingBridgeConnectorAuthorization(this.descriptor, { providerId: context.providerId, connectorId: this.config.id, authorizationType: context.authorizationType, providerRightsConfirmed: context.providerRightsConfirmed, credentialReference: context.credentialReference }).authorized;
  }

  async fetchListing(sourceReference: string): Promise<RawListingPayload> {
    if (this.retrievalMode === 'ASSISTED') throw new Error('ASSISTED_IMPORT_REQUIRES_PROVIDER_DATA');
    if (sourceReference !== this.fixture.sourceReference) throw new Error('EXTERNAL_SOURCE_REFERENCE_NOT_FOUND');
    if (!this.credentialAvailable()) throw new Error('CONNECTOR_NOT_CONFIGURED');
    return Object.freeze({ sourceReferenceHash: sha256(sourceReference), retrievedAt: new Date().toISOString(), contentType: 'application/json', body: this.fixture.payload });
  }

  async fetchMedia(sourceReference: string): Promise<RawMediaPayload> { void sourceReference; throw new Error('MEDIA_RETRIEVAL_REQUIRES_APPROVED_EXTERNAL_TRANSPORT'); }
  async fetchAvailability(sourceReference: string): Promise<RawAvailabilityPayload | null> { void sourceReference; return null; }

  protected sourceReferenceHash(value: string): string { return sha256(value); }

  protected async processProviderInput(input: ExternalConnectorInput, providerId: string): Promise<CanonicalImportContract> {
    if (!providerId.trim()) throw new Error('PROVIDER_ID_REQUIRED');
    const sourceReference = input.sourceReference?.trim();
    if (sourceReference) {
      const url = new URL(sourceReference);
      if (url.protocol !== 'https:' || url.username || url.password) throw new Error('SOURCE_REFERENCE_UNSAFE');
    }
    const data = input.data;
    if (input.type !== 'SOURCE_URL' && data == null) throw new Error('PROVIDER_INPUT_REQUIRED');
    if (input.type === 'DOCUMENT' || input.type === 'SCREENSHOT') throw new Error('INPUT_EXTRACTION_NOT_IMPLEMENTED');
    let payload: Record<string, unknown> = {};
    if (typeof data === 'object' && !(data instanceof Uint8Array)) payload = data as Record<string, unknown>;
    else if (data != null) {
      const text = typeof data === 'string' ? data : Buffer.from(data as Uint8Array).toString('utf8');
      if (Buffer.byteLength(text, 'utf8') > 10 * 1024 * 1024) throw new Error('PROVIDER_INPUT_TOO_LARGE');
      const safeText = text.replace(/<script[\s\S]*?<\/script>/gi, '').trim();
      if (input.type === 'STRUCTURED_FILE' && input.mimeType?.includes('json')) {
        try { payload = JSON.parse(safeText) as Record<string, unknown>; } catch { throw new Error('STRUCTURED_INPUT_INVALID'); }
      } else if (input.type === 'STRUCTURED_FILE' && input.mimeType?.includes('xml')) {
        if (/<!DOCTYPE|<!ENTITY|SYSTEM\s+["']/i.test(safeText)) throw new Error('XML_EXTERNAL_ENTITY_REJECTED');
        payload = { description: safeText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() };
      } else if (input.type === 'STRUCTURED_FILE' && input.mimeType?.includes('csv')) {
        const [headerLine, valueLine = ''] = safeText.split(/\r?\n/, 2);
        const headers = headerLine.split(',').map(value => value.trim());
        payload = Object.fromEntries(headers.map((header, index) => [header, valueLine.split(',')[index]?.trim() ?? '']));
      } else {
        payload = { title: safeText.split(/\r?\n/, 1)[0]?.slice(0, 160), description: safeText };
      }
    }
    const raw: RawListingPayload = { sourceReferenceHash: this.sourceReferenceHash(sourceReference ?? `${this.config.id}:provider-input`), retrievedAt: new Date().toISOString(), contentType: input.mimeType ?? 'text/plain', body: payload };
    const contract = await this.normalize(raw);
    return Object.freeze({ ...contract, identity: { ...contract.identity, providerId }, source: { ...contract.source, sourceReferenceLabel: input.sourceReferenceLabel ?? contract.source.sourceReferenceLabel } });
  }

  async ingestProviderInput(input: ExternalConnectorInput, providerId: string): Promise<CanonicalImportContract> {
    return this.processProviderInput(input, providerId);
  }

  async ingestProviderMedia(importJobId: string, input: ExternalConnectorInput): Promise<MediaIngestionResult> {
    if (input.type !== 'MEDIA' || !(input.data instanceof Uint8Array)) throw new Error('PROVIDER_MEDIA_BYTES_REQUIRED');
    return new ListingBridgeMediaIngestionPipeline().processCandidates(importJobId, [{ sourceReferenceHash: this.sourceReferenceHash(input.sourceReference ?? `${this.config.id}:media`), buffer: Buffer.from(input.data), declaredMime: input.mimeType, isCover: true }]);
  }

  async normalize(raw: RawListingPayload): Promise<CanonicalImportContract> {
    if (!this.validateResponse(raw).valid) throw new Error('EXTERNAL_RESPONSE_INVALID');
    const contract = this.normalizePayload(raw.body as Record<string, unknown>, raw);
    return Object.freeze({
      ...contract,
      source: { ...contract.source, connectorId: this.config.id, sourceReferenceHash: raw.sourceReferenceHash, sourceReferenceLabel: this.fixture.sourceReferenceLabel, authorizationMethod: this.config.capabilities.authorizationType, extractedAt: raw.retrievedAt },
    });
  }

  validateResponse(raw: RawListingPayload | RawMediaPayload | RawAvailabilityPayload): ListingBridgeResponseValidationResult {
    if (!raw.sourceReferenceHash || !raw.retrievedAt || raw.body == null) return Object.freeze({ valid: false, errorCode: 'INVALID_EXTERNAL_RESPONSE', message: 'Response envelope is incomplete' });
    return Object.freeze({ valid: true, contentType: 'contentType' in raw ? raw.contentType : undefined });
  }

  async healthCheck(): Promise<ListingBridgeHealthCheckResult> {
    const configured = this.retrievalMode === 'ASSISTED' || this.credentialAvailable();
    return Object.freeze({ state: configured ? 'HEALTHY' : 'DISABLED', healthy: configured, latencyMs: 0, checkedAt: new Date().toISOString(), message: configured ? 'Configured transport is available' : this.authorizationMessage });
  }
}
