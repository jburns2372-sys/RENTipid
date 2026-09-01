import { z } from 'zod';

export const LISTINGBRIDGE_SCHEMA_VERSION = 'rentipid.listingbridge.v1' as const;

export const listingBridgeConfidenceStates = [
  'VERIFIED',
  'HIGH_CONFIDENCE',
  'REVIEW_RECOMMENDED',
  'CONFLICT',
  'MISSING',
  'PROHIBITED',
] as const;

export type ListingBridgeConfidenceState = (typeof listingBridgeConfidenceStates)[number];

export type ListingBridgeJsonValue =
  | string
  | number
  | boolean
  | null
  | { readonly [key: string]: ListingBridgeJsonValue }
  | readonly ListingBridgeJsonValue[];

export type ListingBridgeSourceAuthority = 'SOURCE' | 'PROVIDER' | 'SYSTEM' | 'AI_ASSISTED';

export interface ListingBridgeFieldProvenance {
  readonly sourceField?: string;
  readonly sourceReference?: string;
  readonly sourceHash?: string;
  readonly extractedAt?: string;
  readonly normalizedAt?: string;
}

export interface ListingBridgeFieldConfidence {
  readonly state: ListingBridgeConfidenceState;
  readonly score?: number;
  readonly authority: ListingBridgeSourceAuthority;
  readonly provenance?: ListingBridgeFieldProvenance;
  readonly requiresProviderReview: boolean;
  readonly providerConfirmed: boolean;
  readonly rejectedReason?: string;
}

export interface ListingBridgeRejectedField {
  readonly fieldName: string;
  readonly reason: string;
  readonly sourceValueHash?: string;
  readonly prohibitedBy?: string;
}

export interface ListingBridgeUnresolvedField {
  readonly fieldName: string;
  readonly reason: string;
  readonly severity: 'BLOCKING' | 'OPTIONAL';
  readonly expectedCorrectionSource: 'PROVIDER' | 'SYSTEM' | 'CONNECTOR';
}

export interface CanonicalImportSource {
  readonly connectorId: string;
  readonly connectorTier: ListingBridgeConnectorTier;
  readonly sourceReferenceHash: string;
  readonly sourceReferenceLabel?: string;
  readonly authorizationMethod: ListingBridgeAuthorizationType;
  readonly extractedAt: string;
}

export interface CanonicalImportIdentity {
  readonly providerId: string;
  readonly importJobId?: string;
  readonly idempotencyKey: string;
}

export interface CanonicalImportProperty {
  readonly title?: string;
  readonly description?: string;
  readonly suggestedCategoryId?: string;
  readonly condition?: 'New' | 'Like New' | 'Good' | 'Fair' | 'Used';
  readonly propertyType?: string;
}

export interface CanonicalImportLocation {
  readonly rawLocationString?: string;
  readonly city?: string;
  readonly province?: string;
  readonly country?: string;
  readonly postalCode?: string;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly psgcCode?: string;
}

export interface CanonicalImportCapacity {
  readonly quantity?: number;
  readonly maxGuests?: number;
  readonly bedrooms?: number;
  readonly bathrooms?: number;
}

export interface CanonicalImportRoom {
  readonly name?: string;
  readonly roomType?: string;
  readonly bedCount?: number;
  readonly sleeps?: number;
}

export interface CanonicalImportRuleSet {
  readonly generalRules?: string;
  readonly minDuration?: number;
  readonly maxDuration?: number;
  readonly pickupAvailable?: boolean;
  readonly deliveryAvailable?: boolean;
  readonly deliveryFee?: number;
}

export interface CanonicalImportPricingHints {
  readonly hourlyRate?: number;
  readonly dailyRate?: number;
  readonly weeklyRate?: number;
  readonly monthlyRate?: number;
  readonly securityDeposit?: number;
  readonly replacementValue?: number;
  readonly currency: 'PHP';
}

export interface CanonicalImportAvailability {
  readonly availabilityStart?: string;
  readonly availabilityEnd?: string;
  readonly sourceCalendarHash?: string;
  readonly requiresProviderConfirmation: boolean;
}

export interface CanonicalImportMedia {
  readonly sourceReferenceHash: string;
  readonly sourceUrlLabel?: string;
  readonly caption?: string;
  readonly isCover: boolean;
  readonly order: number;
  readonly mimeType?: string;
  readonly contentSha256?: string;
  readonly confidence: ListingBridgeConfidenceState;
}

export interface CanonicalImportProvenance {
  readonly rawPayloadHash: string;
  readonly aiAssisted: boolean;
  readonly aiOutputAuthoritative: false;
  readonly modelVersion?: string;
  readonly extractedFactCount: number;
  readonly providerCorrections?: readonly {
    readonly fieldName: string;
    readonly correctedAt: string;
    readonly correctedByUserId: string;
  }[];
  readonly rejectedFields: readonly ListingBridgeRejectedField[];
}

export interface CanonicalImportContract {
  readonly schemaVersion: typeof LISTINGBRIDGE_SCHEMA_VERSION;
  readonly source: CanonicalImportSource;
  readonly identity: CanonicalImportIdentity;
  readonly property: CanonicalImportProperty;
  readonly location: CanonicalImportLocation;
  readonly capacity: CanonicalImportCapacity;
  readonly rooms: readonly CanonicalImportRoom[];
  readonly amenities: readonly string[];
  readonly rules: CanonicalImportRuleSet;
  readonly pricingHints: CanonicalImportPricingHints;
  readonly availability: CanonicalImportAvailability;
  readonly media: readonly CanonicalImportMedia[];
  readonly provenance: CanonicalImportProvenance;
  readonly fieldConfidence: Readonly<Record<string, ListingBridgeFieldConfidence>>;
  readonly unresolvedFields: readonly ListingBridgeUnresolvedField[];
}

export const listingBridgeAuthorizationTypes = [
  'NONE',
  'PROVIDER_RIGHTS_CONFIRMATION',
  'API_KEY_SERVER_SIDE',
  'OAUTH_SERVER_SIDE',
  'OAUTH',
  'API_KEY',
  'SIGNED_URL',
  'FILE_UPLOAD',
  'PUBLIC_URL',
  'MANUAL_PROVIDER_INPUT',
] as const;

export type ListingBridgeAuthorizationType = (typeof listingBridgeAuthorizationTypes)[number];

export const listingBridgeConnectorTiers = [
  'TIER_1_OAUTH',
  'TIER_2_PMS',
  'TIER_3_FILE',
  'TIER_4_URL',
  'TIER_5_MANUAL',
] as const;

export type ListingBridgeConnectorTier = (typeof listingBridgeConnectorTiers)[number];

const isoDateStringSchema = z.string().datetime({ offset: true });

export const listingBridgeFieldConfidenceSchema = z.object({
  state: z.enum(listingBridgeConfidenceStates),
  score: z.number().min(0).max(1).optional(),
  authority: z.enum(['SOURCE', 'PROVIDER', 'SYSTEM', 'AI_ASSISTED']),
  provenance: z.object({
    sourceField: z.string().min(1).optional(),
    sourceReference: z.string().min(1).optional(),
    sourceHash: z.string().min(1).optional(),
    extractedAt: isoDateStringSchema.optional(),
    normalizedAt: isoDateStringSchema.optional(),
  }).strict().optional(),
  requiresProviderReview: z.boolean(),
  providerConfirmed: z.boolean(),
  rejectedReason: z.string().min(1).optional(),
}).strict().superRefine((value, ctx) => {
  if (value.authority === 'AI_ASSISTED' && value.providerConfirmed) {
    ctx.addIssue({
      code: 'custom',
      message: 'AI-assisted fields cannot be marked providerConfirmed by contract validation alone',
      path: ['providerConfirmed'],
    });
  }

  if (value.state === 'PROHIBITED' && !value.rejectedReason) {
    ctx.addIssue({
      code: 'custom',
      message: 'PROHIBITED fields require a rejectedReason',
      path: ['rejectedReason'],
    });
  }
});

export const canonicalImportContractSchema = z.object({
  schemaVersion: z.literal(LISTINGBRIDGE_SCHEMA_VERSION),
  source: z.object({
    connectorId: z.string().min(1),
    connectorTier: z.enum(listingBridgeConnectorTiers),
    sourceReferenceHash: z.string().min(16),
    sourceReferenceLabel: z.string().min(1).optional(),
    authorizationMethod: z.enum(listingBridgeAuthorizationTypes),
    extractedAt: isoDateStringSchema,
  }).strict(),
  identity: z.object({
    providerId: z.string().min(1),
    importJobId: z.string().min(1).optional(),
    idempotencyKey: z.string().min(16),
  }).strict(),
  property: z.object({
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    suggestedCategoryId: z.string().min(1).optional(),
    condition: z.enum(['New', 'Like New', 'Good', 'Fair', 'Used']).optional(),
    propertyType: z.string().min(1).optional(),
  }).strict(),
  location: z.object({
    rawLocationString: z.string().min(1).optional(),
    city: z.string().min(1).optional(),
    province: z.string().min(1).optional(),
    country: z.string().min(1).optional(),
    postalCode: z.string().min(1).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    psgcCode: z.string().min(1).optional(),
  }).strict(),
  capacity: z.object({
    quantity: z.number().int().positive().optional(),
    maxGuests: z.number().int().positive().optional(),
    bedrooms: z.number().int().nonnegative().optional(),
    bathrooms: z.number().int().nonnegative().optional(),
  }).strict(),
  rooms: z.array(z.object({
    name: z.string().min(1).optional(),
    roomType: z.string().min(1).optional(),
    bedCount: z.number().int().nonnegative().optional(),
    sleeps: z.number().int().positive().optional(),
  }).strict()),
  amenities: z.array(z.string().min(1)),
  rules: z.object({
    generalRules: z.string().min(1).optional(),
    minDuration: z.number().int().positive().optional(),
    maxDuration: z.number().int().positive().optional(),
    pickupAvailable: z.boolean().optional(),
    deliveryAvailable: z.boolean().optional(),
    deliveryFee: z.number().nonnegative().optional(),
  }).strict(),
  pricingHints: z.object({
    hourlyRate: z.number().nonnegative().optional(),
    dailyRate: z.number().nonnegative().optional(),
    weeklyRate: z.number().nonnegative().optional(),
    monthlyRate: z.number().nonnegative().optional(),
    securityDeposit: z.number().nonnegative().optional(),
    replacementValue: z.number().nonnegative().optional(),
    currency: z.literal('PHP'),
  }).strict(),
  availability: z.object({
    availabilityStart: isoDateStringSchema.optional(),
    availabilityEnd: isoDateStringSchema.optional(),
    sourceCalendarHash: z.string().min(16).optional(),
    requiresProviderConfirmation: z.boolean(),
  }).strict(),
  media: z.array(z.object({
    sourceReferenceHash: z.string().min(16),
    sourceUrlLabel: z.string().min(1).optional(),
    caption: z.string().min(1).optional(),
    isCover: z.boolean(),
    order: z.number().int().nonnegative(),
    mimeType: z.string().min(1).optional(),
    contentSha256: z.string().min(64).max(64).optional(),
    confidence: z.enum(listingBridgeConfidenceStates),
  }).strict()),
  provenance: z.object({
    rawPayloadHash: z.string().min(16),
    aiAssisted: z.boolean(),
    aiOutputAuthoritative: z.literal(false),
    modelVersion: z.string().min(1).optional(),
    extractedFactCount: z.number().int().nonnegative(),
    providerCorrections: z.array(z.object({
      fieldName: z.string().min(1),
      correctedAt: isoDateStringSchema,
      correctedByUserId: z.string().min(1),
    }).strict()).optional(),
    rejectedFields: z.array(z.object({
      fieldName: z.string().min(1),
      reason: z.string().min(1),
      sourceValueHash: z.string().min(16).optional(),
      prohibitedBy: z.string().min(1).optional(),
    }).strict()),
  }).strict(),
  fieldConfidence: z.record(z.string(), listingBridgeFieldConfidenceSchema),
  unresolvedFields: z.array(z.object({
    fieldName: z.string().min(1),
    reason: z.string().min(1),
    severity: z.enum(['BLOCKING', 'OPTIONAL']),
    expectedCorrectionSource: z.enum(['PROVIDER', 'SYSTEM', 'CONNECTOR']),
  }).strict()),
}).strict();

export function parseCanonicalImportContract(input: unknown): CanonicalImportContract {
  return canonicalImportContractSchema.parse(input);
}
