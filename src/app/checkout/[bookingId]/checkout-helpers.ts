/* eslint-disable @typescript-eslint/no-explicit-any */
import { createHash } from 'crypto';

export function validateCheckoutRequestId(rawId: any): string {
  if (!rawId || typeof rawId !== 'string') {
    throw new Error("Missing or invalid checkout operation identity");
  }

  const trimmedKey = rawId.trim();
  if (trimmedKey !== rawId) {
    throw new Error("Malformed checkout operation identity");
  }

  if (trimmedKey.length === 0 || trimmedKey.length > 64) {
    throw new Error("Invalid checkout operation identity length");
  }

  if (/[\s\x00-\x1F\x7F]/.test(trimmedKey)) {
    throw new Error("Malformed checkout operation identity");
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmedKey)) {
    throw new Error("Malformed checkout operation identity");
  }

  return trimmedKey;
}

export function deriveCheckoutIdempotencyKey(userId: string, bookingId: string, requestId: string): string {
  const idempotencyRaw = `RENTIPID_CHECKOUT_V1|${userId}|${bookingId}|${requestId}`;
  return createHash('sha256').update(idempotencyRaw).digest('hex');
}

/**
 * Validates checkout quote request parameters and enforces that the payment charge currency
 * cannot be overridden by client input.
 */
export function validateCheckoutQuoteContext(params: {
  rawQuoteId?: any;
  clientRequestedChargeCurrency?: any;
}): {
  quoteId?: string;
  enforcedChargeCurrency: 'PHP';
} {
  // 1. Strict payment currency enforcement
  if (params.clientRequestedChargeCurrency) {
    const requested = String(params.clientRequestedChargeCurrency).trim().toUpperCase();
    if (requested !== 'PHP') {
      throw new Error(`Unauthorized payment currency override attempt: '${requested}'. Payments are strictly processed in PHP.`);
    }
  }

  // 2. Quote ID format validation if provided
  let quoteId: string | undefined;
  if (params.rawQuoteId && typeof params.rawQuoteId === 'string') {
    const trimmed = params.rawQuoteId.trim();
    if (trimmed.length > 0) {
      if (trimmed.length > 128 || !/^fxq_[a-zA-Z0-9_\-]+$/.test(trimmed)) {
        throw new Error('Malformed checkout FX quote identifier');
      }
      quoteId = trimmed;
    }
  }

  return {
    quoteId,
    enforcedChargeCurrency: 'PHP',
  };
}

/**
 * Builds an immutable FX reference summary to store with the consequential transaction record.
 */
export function buildTransactionFxMetadata(params: {
  quoteId?: string;
  targetCurrency?: string;
  targetAmount?: string;
  rate?: string;
}): string | undefined {
  if (!params.quoteId) return undefined;
  return JSON.stringify({
    fxQuoteRef: {
      quoteId: params.quoteId,
      baseCurrency: 'PHP',
      displayCurrency: params.targetCurrency || 'PHP',
      displayAmount: params.targetAmount || undefined,
      referenceRate: params.rate || undefined,
      recordedAt: new Date().toISOString(),
    },
  });
}
