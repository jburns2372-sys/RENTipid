import { createHash } from 'node:crypto';

export function computeSha256(input: string | Buffer | Uint8Array): string {
  return createHash('sha256').update(input).digest('hex');
}

export function generateImportJobIdempotencyKey(
  providerId: string,
  sourceReferenceHash: string,
  optionalIntentKey?: string,
): string {
  const normalized = [
    providerId.trim(),
    sourceReferenceHash.trim().toLowerCase(),
    optionalIntentKey ? optionalIntentKey.trim() : 'default',
  ].join(':');

  return `lb_job_${computeSha256(normalized).substring(0, 32)}`;
}

export function computeAssetDeduplicationKey(
  jobId: string,
  contentSha256: string,
): string {
  return `${jobId}:${contentSha256.toLowerCase()}`;
}
