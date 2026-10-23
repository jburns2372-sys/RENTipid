import { z } from 'zod';
import type { ListingBridgeConnectorDescriptor } from '../connectors/descriptor';

export interface ListingBridgeRetrievalRatePolicy {
  readonly key: string;
  readonly limit: number;
  readonly windowMs: number;
}

export interface ListingBridgeSecureRetrievalPolicy {
  readonly allowedProtocols: readonly ('https:' | 'http:')[];
  readonly allowedContentTypes: readonly string[];
  readonly connectTimeoutMs: number;
  readonly totalTimeoutMs: number;
  readonly maxResponseBytes: number;
  readonly maxRedirects: number;
  readonly maxAttempts: number;
  readonly retryableStatusClasses: readonly number[];
  readonly ratePolicy?: ListingBridgeRetrievalRatePolicy;
  readonly userAgent: string;
}

export const LISTINGBRIDGE_RETRIEVAL_HARD_LIMITS = Object.freeze({
  connectTimeoutMs: 10_000,
  totalTimeoutMs: 30_000,
  maxResponseBytes: 5 * 1024 * 1024,
  maxRedirects: 3,
  maxAttempts: 3,
  rateLimit: 30,
  rateWindowMs: 60_000,
});

export const DEFAULT_LISTINGBRIDGE_RETRIEVAL_POLICY: ListingBridgeSecureRetrievalPolicy = Object.freeze({
  allowedProtocols: Object.freeze(['https:'] as readonly ('https:' | 'http:')[]),
  allowedContentTypes: Object.freeze([
    'text/html',
    'application/xhtml+xml',
    'application/json',
    'application/ld+json',
    'text/plain',
  ]),
  connectTimeoutMs: 5_000,
  totalTimeoutMs: 10_000,
  maxResponseBytes: 1 * 1024 * 1024,
  maxRedirects: 3,
  maxAttempts: 1,
  retryableStatusClasses: Object.freeze([408, 429, 500, 502, 503, 504]),
  userAgent: 'RENTipid-ListingBridge/1.0',
});

const policySchema = z.object({
  allowedProtocols: z.array(z.enum(['https:', 'http:'])).min(1),
  allowedContentTypes: z.array(z.string().trim().min(1)).min(1),
  connectTimeoutMs: z.number().int().positive().max(LISTINGBRIDGE_RETRIEVAL_HARD_LIMITS.connectTimeoutMs),
  totalTimeoutMs: z.number().int().positive().max(LISTINGBRIDGE_RETRIEVAL_HARD_LIMITS.totalTimeoutMs),
  maxResponseBytes: z.number().int().positive().max(LISTINGBRIDGE_RETRIEVAL_HARD_LIMITS.maxResponseBytes),
  maxRedirects: z.number().int().nonnegative().max(LISTINGBRIDGE_RETRIEVAL_HARD_LIMITS.maxRedirects),
  maxAttempts: z.number().int().positive().max(LISTINGBRIDGE_RETRIEVAL_HARD_LIMITS.maxAttempts),
  retryableStatusClasses: z.array(z.number().int().min(100).max(599)),
  ratePolicy: z.object({
    key: z.string().trim().min(1).max(300),
    limit: z.number().int().positive().max(LISTINGBRIDGE_RETRIEVAL_HARD_LIMITS.rateLimit),
    windowMs: z.number().int().positive().max(LISTINGBRIDGE_RETRIEVAL_HARD_LIMITS.rateWindowMs),
  }).strict().optional(),
  userAgent: z.string().trim().min(1).max(180),
}).strict().superRefine((policy, ctx) => {
  if (policy.connectTimeoutMs > policy.totalTimeoutMs) {
    ctx.addIssue({ code: 'custom', message: 'connectTimeoutMs cannot exceed totalTimeoutMs', path: ['connectTimeoutMs'] });
  }
});

export function normalizeListingBridgeRetrievalPolicy(
  input: Partial<ListingBridgeSecureRetrievalPolicy> = {},
): ListingBridgeSecureRetrievalPolicy {
  const merged = {
    ...DEFAULT_LISTINGBRIDGE_RETRIEVAL_POLICY,
    ...input,
    allowedProtocols: input.allowedProtocols ?? DEFAULT_LISTINGBRIDGE_RETRIEVAL_POLICY.allowedProtocols,
    allowedContentTypes: input.allowedContentTypes ?? DEFAULT_LISTINGBRIDGE_RETRIEVAL_POLICY.allowedContentTypes,
    retryableStatusClasses: input.retryableStatusClasses ?? DEFAULT_LISTINGBRIDGE_RETRIEVAL_POLICY.retryableStatusClasses,
  };
  const parsed = policySchema.parse(merged);

  return Object.freeze({
    ...parsed,
    allowedProtocols: Object.freeze([...parsed.allowedProtocols]),
    allowedContentTypes: Object.freeze(parsed.allowedContentTypes.map(contentType => normalizeContentType(contentType))),
    retryableStatusClasses: Object.freeze([...parsed.retryableStatusClasses]),
    ratePolicy: parsed.ratePolicy ? Object.freeze(parsed.ratePolicy) : undefined,
  });
}

export function retrievalPolicyFromConnectorDescriptor(
  descriptor: ListingBridgeConnectorDescriptor,
  input: Partial<ListingBridgeSecureRetrievalPolicy> = {},
): ListingBridgeSecureRetrievalPolicy {
  return normalizeListingBridgeRetrievalPolicy({
    ...input,
    connectTimeoutMs: Math.min(input.connectTimeoutMs ?? descriptor.timeoutPolicy.connectTimeoutMs, LISTINGBRIDGE_RETRIEVAL_HARD_LIMITS.connectTimeoutMs),
    totalTimeoutMs: Math.min(input.totalTimeoutMs ?? descriptor.timeoutPolicy.responseTimeoutMs, LISTINGBRIDGE_RETRIEVAL_HARD_LIMITS.totalTimeoutMs),
    maxRedirects: Math.min(input.maxRedirects ?? descriptor.timeoutPolicy.maxRedirects, LISTINGBRIDGE_RETRIEVAL_HARD_LIMITS.maxRedirects),
    maxResponseBytes: Math.min(input.maxResponseBytes ?? descriptor.timeoutPolicy.maxResponseBytes, LISTINGBRIDGE_RETRIEVAL_HARD_LIMITS.maxResponseBytes),
    maxAttempts: Math.min(input.maxAttempts ?? Math.max(1, descriptor.retryPolicy.maxAttempts || 1), LISTINGBRIDGE_RETRIEVAL_HARD_LIMITS.maxAttempts),
  });
}

export function normalizeContentType(contentType: string | null | undefined): string {
  return (contentType ?? '').split(';', 1)[0].trim().toLowerCase();
}
