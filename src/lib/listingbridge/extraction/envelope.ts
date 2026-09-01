import { ListingBridgeSecurityError } from '../security/errors';
import type { ListingBridgeExternalDataClassification } from '../retrieval';

export interface ListingBridgeExtractionEnvelope {
  readonly importJobId: string;
  readonly sourceId?: string;
  readonly providerId: string;
  readonly connectorId: string;
  readonly connectorTier: string;
  readonly connectorVersion?: string;
  readonly sourceMode?: string;
  readonly sourceReferenceHash: string;
  readonly sourceReferenceLabel?: string;
  readonly authorizationMethod: string;
  readonly retrievedAt: Date;
  readonly contentType: string;
  readonly payload: unknown;
  readonly correlationId?: string;
  readonly dataClassification: ListingBridgeExternalDataClassification;
}

export function validateExtractionEnvelope(input: unknown): ListingBridgeExtractionEnvelope {
  if (!input || typeof input !== 'object') {
    throw new ListingBridgeSecurityError({
      code: 'FORBIDDEN',
      internalMessage: 'Invalid extraction envelope: payload must be an object',
    });
  }

  const env = input as Record<string, unknown>;

  if (typeof env.importJobId !== 'string' || !env.importJobId.trim()) {
    throw new ListingBridgeSecurityError({
      code: 'FORBIDDEN',
      internalMessage: 'Extraction envelope requires a valid importJobId',
    });
  }

  if (typeof env.providerId !== 'string' || !env.providerId.trim()) {
    throw new ListingBridgeSecurityError({
      code: 'FORBIDDEN',
      internalMessage: 'Extraction envelope requires a valid providerId',
    });
  }

  if (typeof env.connectorId !== 'string' || !env.connectorId.trim()) {
    throw new ListingBridgeSecurityError({
      code: 'FORBIDDEN',
      internalMessage: 'Extraction envelope requires a valid connectorId',
    });
  }

  if (typeof env.sourceReferenceHash !== 'string' || !env.sourceReferenceHash.trim()) {
    throw new ListingBridgeSecurityError({
      code: 'FORBIDDEN',
      internalMessage: 'Extraction envelope requires a valid sourceReferenceHash',
    });
  }

  return Object.freeze({
    importJobId: env.importJobId,
    sourceId: typeof env.sourceId === 'string' ? env.sourceId : undefined,
    providerId: env.providerId,
    connectorId: env.connectorId,
    connectorTier: typeof env.connectorTier === 'string' ? env.connectorTier : 'TIER_5_MANUAL',
    connectorVersion: typeof env.connectorVersion === 'string' ? env.connectorVersion : undefined,
    sourceMode: typeof env.sourceMode === 'string' ? env.sourceMode : undefined,
    sourceReferenceHash: env.sourceReferenceHash,
    sourceReferenceLabel: typeof env.sourceReferenceLabel === 'string' ? env.sourceReferenceLabel : undefined,
    authorizationMethod: typeof env.authorizationMethod === 'string' ? env.authorizationMethod : 'NONE',
    retrievedAt: env.retrievedAt instanceof Date ? env.retrievedAt : new Date(),
    contentType: typeof env.contentType === 'string' ? env.contentType : 'application/json',
    payload: env.payload,
    correlationId: typeof env.correlationId === 'string' ? env.correlationId : undefined,
    dataClassification: 'UNTRUSTED_EXTERNAL_DATA',
  });
}
