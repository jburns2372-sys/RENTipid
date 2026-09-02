import { z } from 'zod';
import {
  listingBridgeAuthorizationTypes,
  listingBridgeConnectorTiers,
  type ListingBridgeAuthorizationType,
  type ListingBridgeConnectorTier,
} from '../types/canonical-contract';
import {
  type ListingBridgeComplianceStatus,
  type ListingBridgeFeatureStatus,
  type ListingBridgeHealthState,
  type ListingBridgeRetryPolicy,
  type ListingBridgeTimeoutPolicy,
} from './types';

export const listingBridgeConnectorCapabilityIds = [
  'LISTING_FACTS',
  'MEDIA',
  'AVAILABILITY',
  'STRUCTURED_FILE',
  'ASSISTED_PROVIDER_DATA',
  'URL_RETRIEVAL',
  'OAUTH_API_AUTHORIZATION',
  'API_KEY_AUTHORIZATION',
  'PROVIDER_RIGHTS_CONFIRMATION',
  'AI_ASSISTED_MAPPING',
] as const;

export type ListingBridgeConnectorCapabilityId = (typeof listingBridgeConnectorCapabilityIds)[number];

export const listingBridgeSourceModes = [
  'AUTHORIZED_API',
  'PMS_FEED',
  'STRUCTURED_FILE',
  'ASSISTED_IMPORT',
  'PUBLIC_URL',
  'MANUAL',
  'INTERNAL_TEST',
] as const;

export type ListingBridgeSourceMode = (typeof listingBridgeSourceModes)[number];

export const listingBridgeDeploymentEnvironments = ['LOCAL', 'TEST', 'PREVIEW', 'PRODUCTION'] as const;

export type ListingBridgeDeploymentEnvironment = (typeof listingBridgeDeploymentEnvironments)[number];

export const listingBridgeEnvironmentApprovalStates = [
  'APPROVED',
  'DISABLED',
  'REVIEW_REQUIRED',
  'BLOCKED',
] as const;

export type ListingBridgeEnvironmentApprovalState = (typeof listingBridgeEnvironmentApprovalStates)[number];

export const listingBridgeFeatureFlagKeys = [
  'LISTINGBRIDGE_GLOBAL',
  'LISTINGBRIDGE_URL_IMPORT',
  'LISTINGBRIDGE_API_CONNECTORS',
  'LISTINGBRIDGE_MEDIA_IMPORT',
  'LISTINGBRIDGE_AI_MAPPING',
  'LISTINGBRIDGE_AVAILABILITY_IMPORT',
  'LISTINGBRIDGE_FILE_IMPORT',
] as const;

export type ListingBridgeFeatureFlagKey = (typeof listingBridgeFeatureFlagKeys)[number];

export interface ListingBridgeAuthorizationDescriptor {
  readonly type: ListingBridgeAuthorizationType;
  readonly requiresProviderRightsConfirmation: boolean;
  readonly serverSideOnly: boolean;
  readonly credentialReferenceRequired: boolean;
}

export interface ListingBridgeEnvironmentAvailability {
  readonly state: ListingBridgeEnvironmentApprovalState;
  readonly reason?: string;
}

export interface ListingBridgeComplianceDescriptor {
  readonly status: ListingBridgeComplianceStatus;
  readonly reviewedAt?: string;
  readonly reference?: string;
}

export interface ListingBridgeHealthSnapshot {
  readonly state: ListingBridgeHealthState;
  readonly checkedAt?: string;
  readonly latencyMs?: number;
  readonly message?: string;
}

export interface ListingBridgeRatePolicy {
  readonly policyRef: string;
  readonly maxRequestsPerMinute?: number;
  readonly burstLimit?: number;
}

export interface ListingBridgeFeatureControlDescriptor {
  readonly requiredGlobalFlag: 'LISTINGBRIDGE_GLOBAL';
  readonly requiredCapabilityFlags: readonly ListingBridgeFeatureFlagKey[];
}

export interface ListingBridgeConnectorDescriptor {
  readonly id: string;
  readonly internalName: string;
  readonly displayName: string;
  readonly version: string;
  readonly tier: ListingBridgeConnectorTier;
  readonly sourceMode: ListingBridgeSourceMode;
  readonly authorization: ListingBridgeAuthorizationDescriptor;
  readonly capabilities: readonly ListingBridgeConnectorCapabilityId[];
  readonly environments: Readonly<Record<ListingBridgeDeploymentEnvironment, ListingBridgeEnvironmentAvailability>>;
  readonly featureStatus: ListingBridgeFeatureStatus;
  readonly featureControl: ListingBridgeFeatureControlDescriptor;
  readonly compliance: ListingBridgeComplianceDescriptor;
  readonly health: ListingBridgeHealthSnapshot;
  readonly timeoutPolicy: ListingBridgeTimeoutPolicy;
  readonly retryPolicy: ListingBridgeRetryPolicy;
  readonly ratePolicy?: ListingBridgeRatePolicy;
  readonly enabled: boolean;
}

export type ListingBridgePublicConnectorDescriptor = Omit<ListingBridgeConnectorDescriptor, 'authorization'> & {
  readonly authorization: Pick<
    ListingBridgeAuthorizationDescriptor,
    'type' | 'requiresProviderRightsConfirmation' | 'serverSideOnly' | 'credentialReferenceRequired'
  >;
};

const isoDateStringSchema = z.string().datetime({ offset: true });
const nonEmptyString = z.string().trim().min(1);
const positiveInteger = z.number().int().positive();
const nonNegativeInteger = z.number().int().nonnegative();

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const key of Object.getOwnPropertyNames(value)) {
      deepFreeze((value as Record<string, unknown>)[key]);
    }
    Object.freeze(value);
  }

  return value;
}

export const listingBridgeHealthSnapshotSchema = z.object({
  state: z.enum(['HEALTHY', 'DEGRADED', 'UNHEALTHY', 'UNKNOWN', 'DISABLED']),
  checkedAt: isoDateStringSchema.optional(),
  latencyMs: nonNegativeInteger.optional(),
  message: nonEmptyString.max(200).optional(),
}).strict();

export const listingBridgeConnectorDescriptorSchema = z.object({
  id: nonEmptyString.regex(/^[a-z0-9][a-z0-9._-]*$/),
  internalName: nonEmptyString.max(120),
  displayName: nonEmptyString.max(120),
  version: nonEmptyString.regex(/^\d+\.\d+\.\d+(?:[-+][a-zA-Z0-9.-]+)?$/),
  tier: z.enum(listingBridgeConnectorTiers),
  sourceMode: z.enum(listingBridgeSourceModes),
  authorization: z.object({
    type: z.enum(listingBridgeAuthorizationTypes),
    requiresProviderRightsConfirmation: z.boolean(),
    serverSideOnly: z.boolean(),
    credentialReferenceRequired: z.boolean(),
  }).strict(),
  capabilities: z.array(z.enum(listingBridgeConnectorCapabilityIds)).min(1),
  environments: z.object({
    LOCAL: z.object({ state: z.enum(listingBridgeEnvironmentApprovalStates), reason: nonEmptyString.optional() }).strict(),
    TEST: z.object({ state: z.enum(listingBridgeEnvironmentApprovalStates), reason: nonEmptyString.optional() }).strict(),
    PREVIEW: z.object({ state: z.enum(listingBridgeEnvironmentApprovalStates), reason: nonEmptyString.optional() }).strict(),
    PRODUCTION: z.object({ state: z.enum(listingBridgeEnvironmentApprovalStates), reason: nonEmptyString.optional() }).strict(),
  }).strict(),
  featureStatus: z.enum(['ENABLED', 'DISABLED', 'BETA', 'INTERNAL_ONLY']),
  featureControl: z.object({
    requiredGlobalFlag: z.literal('LISTINGBRIDGE_GLOBAL'),
    requiredCapabilityFlags: z.array(z.enum(listingBridgeFeatureFlagKeys)),
  }).strict(),
  compliance: z.object({
    status: z.enum(['APPROVED', 'REVIEW_REQUIRED', 'BLOCKED']),
    reviewedAt: isoDateStringSchema.optional(),
    reference: nonEmptyString.max(120).optional(),
  }).strict(),
  health: listingBridgeHealthSnapshotSchema,
  timeoutPolicy: z.object({
    connectTimeoutMs: positiveInteger.max(30000),
    responseTimeoutMs: positiveInteger.max(60000),
    maxRedirects: nonNegativeInteger.max(10),
    maxResponseBytes: positiveInteger.max(25 * 1024 * 1024),
  }).strict(),
  retryPolicy: z.object({
    maxAttempts: nonNegativeInteger.max(10),
    baseDelayMs: nonNegativeInteger.max(60000),
    maxDelayMs: nonNegativeInteger.max(300000),
    retryableStatusCodes: z.array(z.number().int().min(100).max(599)),
  }).strict(),
  ratePolicy: z.object({
    policyRef: nonEmptyString.max(120),
    maxRequestsPerMinute: positiveInteger.max(10000).optional(),
    burstLimit: positiveInteger.max(10000).optional(),
  }).strict().optional(),
  enabled: z.boolean(),
}).strict().superRefine((descriptor, ctx) => {
  const capabilities = new Set(descriptor.capabilities);
  if (capabilities.size !== descriptor.capabilities.length) {
    ctx.addIssue({ code: 'custom', message: 'Connector capabilities must be unique', path: ['capabilities'] });
  }

  if (descriptor.retryPolicy.maxDelayMs < descriptor.retryPolicy.baseDelayMs) {
    ctx.addIssue({ code: 'custom', message: 'maxDelayMs must be greater than or equal to baseDelayMs', path: ['retryPolicy', 'maxDelayMs'] });
  }

  if (capabilities.has('URL_RETRIEVAL') && descriptor.sourceMode !== 'PUBLIC_URL') {
    ctx.addIssue({ code: 'custom', message: 'URL_RETRIEVAL requires PUBLIC_URL sourceMode', path: ['sourceMode'] });
  }

  if (capabilities.has('STRUCTURED_FILE') && !['STRUCTURED_FILE', 'INTERNAL_TEST', 'ASSISTED_IMPORT'].includes(descriptor.sourceMode)) {
    ctx.addIssue({ code: 'custom', message: 'STRUCTURED_FILE requires STRUCTURED_FILE, ASSISTED_IMPORT, or INTERNAL_TEST sourceMode', path: ['sourceMode'] });
  }

  if (capabilities.has('OAUTH_API_AUTHORIZATION') && !['OAUTH', 'OAUTH_SERVER_SIDE'].includes(descriptor.authorization.type)) {
    ctx.addIssue({ code: 'custom', message: 'OAUTH_API_AUTHORIZATION requires an OAuth authorization type', path: ['authorization', 'type'] });
  }

  if (capabilities.has('API_KEY_AUTHORIZATION') && !['API_KEY', 'API_KEY_SERVER_SIDE'].includes(descriptor.authorization.type)) {
    ctx.addIssue({ code: 'custom', message: 'API_KEY_AUTHORIZATION requires an API key authorization type', path: ['authorization', 'type'] });
  }

  if (capabilities.has('PROVIDER_RIGHTS_CONFIRMATION') && !descriptor.authorization.requiresProviderRightsConfirmation) {
    ctx.addIssue({
      code: 'custom',
      message: 'PROVIDER_RIGHTS_CONFIRMATION capability requires provider rights confirmation',
      path: ['authorization', 'requiresProviderRightsConfirmation'],
    });
  }

  if (descriptor.authorization.credentialReferenceRequired && !descriptor.authorization.serverSideOnly) {
    ctx.addIssue({ code: 'custom', message: 'Credential references must be server-side only', path: ['authorization', 'serverSideOnly'] });
  }

  if (descriptor.featureStatus === 'DISABLED' && descriptor.enabled) {
    ctx.addIssue({ code: 'custom', message: 'Disabled feature status cannot be enabled', path: ['enabled'] });
  }
});

export function parseListingBridgeConnectorDescriptor(input: unknown): ListingBridgeConnectorDescriptor {
  return deepFreeze(listingBridgeConnectorDescriptorSchema.parse(input));
}

export function toPublicConnectorDescriptor(
  descriptor: ListingBridgeConnectorDescriptor,
): ListingBridgePublicConnectorDescriptor {
  const publicDescriptor = structuredClone({
    ...descriptor,
    authorization: {
      type: descriptor.authorization.type,
      requiresProviderRightsConfirmation: descriptor.authorization.requiresProviderRightsConfirmation,
      serverSideOnly: descriptor.authorization.serverSideOnly,
      credentialReferenceRequired: descriptor.authorization.credentialReferenceRequired,
    },
  }) as ListingBridgePublicConnectorDescriptor;

  return deepFreeze(publicDescriptor);
}
