import type { CanonicalImportContract, ListingBridgeAuthorizationType, ListingBridgeConnectorTier } from '../types/canonical-contract';

export type ListingBridgeFeatureStatus = 'ENABLED' | 'DISABLED' | 'BETA' | 'INTERNAL_ONLY';
export type ListingBridgeEnvironmentStatus = 'LOCAL' | 'PREVIEW' | 'PRODUCTION' | 'TEST';
export type ListingBridgeComplianceStatus = 'APPROVED' | 'REVIEW_REQUIRED' | 'BLOCKED';
export type ListingBridgeHealthState = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN' | 'DISABLED';

export interface ListingBridgeTimeoutPolicy {
  readonly connectTimeoutMs: number;
  readonly responseTimeoutMs: number;
  readonly maxRedirects: number;
  readonly maxResponseBytes: number;
}

export interface ListingBridgeRetryPolicy {
  readonly maxAttempts: number;
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
  readonly retryableStatusCodes: readonly number[];
}

export interface ListingBridgeConnectorCapabilities {
  readonly supportsMedia: boolean;
  readonly supportsAvailability: boolean;
  readonly supportsBatch: boolean;
  readonly requiresAuthorization: boolean;
  readonly authorizationType: ListingBridgeAuthorizationType;
}

export type ListingBridgeConnectorCredentialState =
  | 'AVAILABLE'
  | 'NOT_CONFIGURED'
  | 'PARTNER_APPROVAL_REQUIRED'
  | 'CERTIFICATION_REQUIRED';

export type ListingBridgeConnectorRetrievalMode = 'DIRECT_API' | 'AUTHORIZED_PARTNER_API' | 'ASSISTED';

export interface ListingBridgeExternalPropertyReference {
  readonly sourceReference: string;
  readonly sourceReferenceHash: string;
  readonly providerSupplied: boolean;
}

export interface ListingBridgeConnectorConfig {
  readonly id: string;
  readonly name: string;
  readonly tier: ListingBridgeConnectorTier;
  readonly capabilities: ListingBridgeConnectorCapabilities;
  readonly timeoutPolicy: ListingBridgeTimeoutPolicy;
  readonly retryPolicy: ListingBridgeRetryPolicy;
  readonly featureStatus: ListingBridgeFeatureStatus;
  readonly environmentStatus: ListingBridgeEnvironmentStatus;
  readonly complianceStatus: ListingBridgeComplianceStatus;
}

export interface ListingBridgeAuthorizationContext {
  readonly providerId: string;
  readonly authorizationType: ListingBridgeAuthorizationType;
  readonly credentialReference?: string;
  readonly providerRightsConfirmed?: boolean;
  readonly requestedAt: string;
}

export interface ListingBridgeSourceIdentification {
  readonly matched: boolean;
  readonly connectorId: string;
  readonly confidence: number;
  readonly sourceReferenceHash?: string;
}

export interface RawListingPayload {
  readonly sourceReferenceHash: string;
  readonly retrievedAt: string;
  readonly contentType?: string;
  readonly body: unknown;
}

export interface RawMediaPayload {
  readonly sourceReferenceHash: string;
  readonly retrievedAt: string;
  readonly mimeType: string;
  readonly fileName?: string;
  readonly contentSha256?: string;
  readonly body: ArrayBuffer | Uint8Array;
}

export interface RawAvailabilityPayload {
  readonly sourceReferenceHash: string;
  readonly retrievedAt: string;
  readonly body: unknown;
}

export interface ListingBridgeHealthCheckResult {
  readonly state: ListingBridgeHealthState;
  readonly healthy: boolean;
  readonly latencyMs: number;
  readonly checkedAt: string;
  readonly message?: string;
}

export interface ListingBridgeResponseValidationResult {
  readonly valid: boolean;
  readonly statusCode?: number;
  readonly contentType?: string;
  readonly errorCode?: string;
  readonly message?: string;
}

export interface ListingBridgeConnector {
  readonly config: ListingBridgeConnectorConfig;

  identifySource(input: string | Uint8Array): Promise<ListingBridgeSourceIdentification>;
  getCapabilities(): ListingBridgeConnectorCapabilities;
  authorize(context: ListingBridgeAuthorizationContext): Promise<boolean>;
  fetchListing(sourceReference: string, options?: Readonly<Record<string, unknown>>): Promise<RawListingPayload>;
  fetchMedia(sourceReference: string, options?: Readonly<Record<string, unknown>>): Promise<RawMediaPayload>;
  fetchAvailability(sourceReference: string, options?: Readonly<Record<string, unknown>>): Promise<RawAvailabilityPayload | null>;
  normalize(raw: RawListingPayload): Promise<CanonicalImportContract>;
  validateResponse(raw: RawListingPayload | RawMediaPayload | RawAvailabilityPayload): ListingBridgeResponseValidationResult;
  healthCheck(): Promise<ListingBridgeHealthCheckResult>;
}
