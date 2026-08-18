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
