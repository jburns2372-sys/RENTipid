import http from 'node:http';
import https from 'node:https';
import type { LookupAddress } from 'node:dns';
import type { Socket } from 'node:net';
import {
  SsrfProtectionError,
  SsrfProtectionService,
  type SsrfDnsResolver,
  type SsrfResolvedAddress,
  type ValidatedListingBridgeUrl,
} from '../security/ssrf-protection';
import {
  ListingBridgeAuditLogSink,
  type ListingBridgeSecurityAuditSink,
} from '../security/audit';
import {
  ListingBridgeSecurityError,
  type ListingBridgeSecurityErrorCode,
} from '../security/errors';
import {
  DEFAULT_LISTINGBRIDGE_RETRIEVAL_POLICY,
  normalizeContentType,
  normalizeListingBridgeRetrievalPolicy,
  type ListingBridgeSecureRetrievalPolicy,
} from './policy';
import {
  DatabaseListingBridgeRateLimiter,
  enforceListingBridgeRatePolicy,
  type ListingBridgeRateLimiter,
} from './rate-control';

export type ListingBridgeExternalDataClassification = 'UNTRUSTED_EXTERNAL_DATA';

export interface ListingBridgeSecureRetrievalRequest {
  readonly url: string;
  readonly method?: 'GET' | 'HEAD';
  readonly headers?: Readonly<Record<string, string>>;
  readonly policy?: Partial<ListingBridgeSecureRetrievalPolicy>;
  readonly actorUserId?: string;
  readonly importJobId?: string;
  readonly correlationId?: string;
}

export interface ListingBridgeSecureRetrievalResponse {
  readonly finalUrl: string;
  readonly statusCode: number;
  readonly contentType: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly body: Buffer;
  readonly bytesRead: number;
  readonly redirectCount: number;
  readonly dataClassification: ListingBridgeExternalDataClassification;
}

export interface ListingBridgeHttpTransportRequest {
  readonly url: URL;
  readonly method: 'GET' | 'HEAD';
  readonly headers: Readonly<Record<string, string>>;
  readonly pinnedAddress: SsrfResolvedAddress;
  readonly validated: ValidatedListingBridgeUrl;
  readonly policy: ListingBridgeSecureRetrievalPolicy;
}

export interface ListingBridgeHttpTransportResponse {
  readonly statusCode: number;
  readonly headers: Readonly<Record<string, string | readonly string[] | undefined>>;
  readonly body: AsyncIterable<Buffer>;
}

export interface ListingBridgeHttpTransport {
  execute(request: ListingBridgeHttpTransportRequest): Promise<ListingBridgeHttpTransportResponse>;
}

export interface ListingBridgeSecureHttpRetrievalEngineOptions {
  readonly resolver?: SsrfDnsResolver;
  readonly transport?: ListingBridgeHttpTransport;
  readonly rateLimiter?: ListingBridgeRateLimiter;
  readonly auditSink?: ListingBridgeSecurityAuditSink;
}

const redirectStatuses = new Set([300, 301, 302, 303, 307, 308]);
const sensitiveRequestHeaders = new Set(['authorization', 'cookie', 'proxy-authorization', 'x-api-key']);
const safeRedirectHeaders = new Set(['accept', 'user-agent']);

export class ListingBridgeSecureHttpRetrievalEngine {
  private readonly resolver?: SsrfDnsResolver;
  private readonly transport: ListingBridgeHttpTransport;
  private readonly rateLimiter: ListingBridgeRateLimiter;
  private readonly auditSink: ListingBridgeSecurityAuditSink;

  constructor(options: ListingBridgeSecureHttpRetrievalEngineOptions = {}) {
    this.resolver = options.resolver;
    this.transport = options.transport ?? new NodeListingBridgeHttpTransport();
    this.rateLimiter = options.rateLimiter ?? new DatabaseListingBridgeRateLimiter();
    this.auditSink = options.auditSink ?? new ListingBridgeAuditLogSink();
  }

  async retrieve(input: ListingBridgeSecureRetrievalRequest): Promise<ListingBridgeSecureRetrievalResponse> {
    const policy = normalizeListingBridgeRetrievalPolicy(input.policy ?? DEFAULT_LISTINGBRIDGE_RETRIEVAL_POLICY);
    await enforceListingBridgeRatePolicy(policy.ratePolicy, this.rateLimiter);

    try {
      return await this.retrieveWithRedirects(input, policy, 0, input.url, sanitizeInitialHeaders(input.headers, policy));
    } catch (error) {
      const securityError = toListingBridgeSecurityError(error);
      await this.auditSink.write({
        actorUserId: input.actorUserId,
        importJobId: input.importJobId,
        action: 'RETRIEVAL_BLOCKED',
        outcome: 'BLOCK',
        reason: securityError.code,
        correlationId: input.correlationId,
        safeDetails: securityError.safeDetails,
      });
      throw securityError;
    }
  }

  private async retrieveWithRedirects(
    input: ListingBridgeSecureRetrievalRequest,
    policy: ListingBridgeSecureRetrievalPolicy,
    redirectCount: number,
    currentUrl: string,
    headers: Readonly<Record<string, string>>,
    originalOrigin?: string,
  ): Promise<ListingBridgeSecureRetrievalResponse> {
    const validated = await this.validateUrl(currentUrl, policy);
    const activeOriginalOrigin = originalOrigin ?? validated.url.origin;
    const pinnedAddress = validated.resolvedAddresses[0];
    const response = await this.transport.execute({
      url: validated.url,
      method: input.method ?? 'GET',
      headers,
      pinnedAddress,
      validated,
      policy,
    });

    if (redirectStatuses.has(response.statusCode)) {
      if (redirectCount >= policy.maxRedirects) {
        throw new ListingBridgeSecurityError({ code: 'REDIRECT_LIMIT', safeDetails: { redirectCount, maxRedirects: policy.maxRedirects } });
      }
      const location = headerValue(response.headers.location);
      if (!location) throw new ListingBridgeSecurityError({ code: 'REDIRECT_BLOCKED', internalMessage: 'Redirect missing Location header' });
      let redirectUrl: URL;
      try {
        redirectUrl = new URL(location, validated.url);
      } catch {
        throw new ListingBridgeSecurityError({ code: 'REDIRECT_BLOCKED', internalMessage: 'Malformed redirect Location header' });
      }

      const nextHeaders = redirectUrl.origin === activeOriginalOrigin
        ? headers
        : keepOnlySafeRedirectHeaders(headers);

      return this.retrieveWithRedirects(input, policy, redirectCount + 1, redirectUrl.href, nextHeaders, activeOriginalOrigin);
    }

    const contentType = normalizeContentType(headerValue(response.headers['content-type']));
    if (!policy.allowedContentTypes.includes(contentType)) {
      throw new ListingBridgeSecurityError({
        code: 'UNSUPPORTED_CONTENT_TYPE',
        safeDetails: { contentType: contentType || 'missing' },
      });
    }

    const contentLength = headerValue(response.headers['content-length']);
    if (contentLength && Number(contentLength) > policy.maxResponseBytes) {
      throw new ListingBridgeSecurityError({
        code: 'RESPONSE_TOO_LARGE',
        safeDetails: { contentLength: Number(contentLength), maxResponseBytes: policy.maxResponseBytes },
      });
    }

    const body = await readBoundedResponse(response.body, policy.maxResponseBytes);
    const safeHeaders = responseHeadersToPublicSafeMap(response.headers);

    return Object.freeze({
      finalUrl: validated.normalizedUrl,
      statusCode: response.statusCode,
      contentType,
      headers: Object.freeze(safeHeaders),
      body,
      bytesRead: body.length,
      redirectCount,
      dataClassification: 'UNTRUSTED_EXTERNAL_DATA',
    });
  }

  private async validateUrl(
    currentUrl: string,
    policy: ListingBridgeSecureRetrievalPolicy,
  ): Promise<ValidatedListingBridgeUrl> {
    const ssrf = new SsrfProtectionService({
      allowHttp: policy.allowedProtocols.includes('http:'),
      maxRedirects: policy.maxRedirects,
      resolver: this.resolver,
    });
    const validated = await ssrf.validateUrl(currentUrl);

    if (!policy.allowedProtocols.includes(validated.protocol)) {
      throw new ListingBridgeSecurityError({ code: 'UNSUPPORTED_PROTOCOL' });
    }

    return validated;
  }
}

export class NodeListingBridgeHttpTransport implements ListingBridgeHttpTransport {
  async execute(request: ListingBridgeHttpTransportRequest): Promise<ListingBridgeHttpTransportResponse> {
    return new Promise((resolve, reject) => {
      const client = request.url.protocol === 'https:' ? https : http;
      const totalTimer = setTimeout(() => {
        req.destroy(new ListingBridgeSecurityError({ code: 'TIMEOUT', internalMessage: 'ListingBridge retrieval total timeout' }));
      }, request.policy.totalTimeoutMs);
      const req = client.request({
        protocol: request.url.protocol,
        hostname: request.url.hostname,
        port: request.url.port,
        path: `${request.url.pathname}${request.url.search}`,
        method: request.method,
        headers: request.headers,
        lookup: (_hostname, _options, callback) => {
          callback(null, request.pinnedAddress.address, request.pinnedAddress.family as LookupAddress['family']);
        },
      }, (res) => {
        clearTimeout(totalTimer);
        resolve({
          statusCode: res.statusCode ?? 0,
          headers: res.headers,
          body: res,
        });
      });

      req.on('socket', (socket: Socket) => {
        const connectTimer = setTimeout(() => {
          req.destroy(new ListingBridgeSecurityError({ code: 'TIMEOUT', internalMessage: 'ListingBridge retrieval connect timeout' }));
        }, request.policy.connectTimeoutMs);
        socket.once(request.url.protocol === 'https:' ? 'secureConnect' : 'connect', () => clearTimeout(connectTimer));
        socket.once('error', () => clearTimeout(connectTimer));
      });
      req.once('timeout', () => {
        req.destroy(new ListingBridgeSecurityError({ code: 'TIMEOUT', internalMessage: 'ListingBridge retrieval response timeout' }));
      });
      req.once('error', (error) => {
        clearTimeout(totalTimer);
        reject(error);
      });
      req.setTimeout(request.policy.totalTimeoutMs);
      req.end();
    });
  }
}

function sanitizeInitialHeaders(
  input: Readonly<Record<string, string>> | undefined,
  policy: ListingBridgeSecureRetrievalPolicy,
): Readonly<Record<string, string>> {
  const headers: Record<string, string> = {
    accept: policy.allowedContentTypes.join(', '),
    'user-agent': policy.userAgent,
  };

  for (const [key, value] of Object.entries(input ?? {})) {
    const normalizedKey = key.trim().toLowerCase();
    if (!normalizedKey || sensitiveRequestHeaders.has(normalizedKey)) continue;
    headers[normalizedKey] = value;
  }

  return Object.freeze(headers);
}

function keepOnlySafeRedirectHeaders(headers: Readonly<Record<string, string>>): Readonly<Record<string, string>> {
  return Object.freeze(Object.fromEntries(
    Object.entries(headers).filter(([key]) => safeRedirectHeaders.has(key.toLowerCase())),
  ));
}

async function readBoundedResponse(body: AsyncIterable<Buffer>, maxBytes: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let bytesRead = 0;

  for await (const chunk of body) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytesRead += buffer.length;
    if (bytesRead > maxBytes) {
      throw new ListingBridgeSecurityError({
        code: 'RESPONSE_TOO_LARGE',
        safeDetails: { maxResponseBytes: maxBytes },
      });
    }
    chunks.push(buffer);
  }

  return Buffer.concat(chunks);
}

function headerValue(value: string | readonly string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return typeof value === 'string' ? value : undefined;
}

function responseHeadersToPublicSafeMap(
  headers: Readonly<Record<string, string | readonly string[] | undefined>>,
): Record<string, string> {
  const output: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    const normalizedKey = key.toLowerCase();
    if (sensitiveRequestHeaders.has(normalizedKey) || normalizedKey === 'set-cookie') continue;
    const normalizedValue = headerValue(value);
    if (normalizedValue) output[normalizedKey] = normalizedValue;
  }

  return output;
}

function toListingBridgeSecurityError(error: unknown): ListingBridgeSecurityError {
  if (error instanceof ListingBridgeSecurityError) return error;
  if (error instanceof SsrfProtectionError) {
    return new ListingBridgeSecurityError({
      code: mapSsrfErrorCode(error.code),
      internalMessage: error.message,
      safeDetails: { ssrfCode: error.code },
    });
  }
  return new ListingBridgeSecurityError({ code: 'FORBIDDEN', internalMessage: 'ListingBridge retrieval failed closed' });
}

function mapSsrfErrorCode(code: string): ListingBridgeSecurityErrorCode {
  if (code === 'UNSUPPORTED_PROTOCOL') return 'UNSUPPORTED_PROTOCOL';
  if (code.includes('MALFORMED') || code === 'HOST_MISSING' || code === 'EMBEDDED_CREDENTIALS_REJECTED') return 'INVALID_URL';
  if (code.includes('DNS')) return 'DNS_UNSAFE';
  return 'SSRF_BLOCKED';
}
