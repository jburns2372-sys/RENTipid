export type ListingBridgeSecurityErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'OWNERSHIP_MISMATCH'
  | 'RIGHTS_CONFIRMATION_REQUIRED'
  | 'INVALID_URL'
  | 'UNSUPPORTED_PROTOCOL'
  | 'SSRF_BLOCKED'
  | 'DNS_UNSAFE'
  | 'REDIRECT_BLOCKED'
  | 'REDIRECT_LIMIT'
  | 'TIMEOUT'
  | 'RESPONSE_TOO_LARGE'
  | 'UNSUPPORTED_CONTENT_TYPE'
  | 'RATE_LIMITED'
  | 'AUTHORIZATION_EXPIRED'
  | 'AUTHORIZATION_REVOKED'
  | 'FILE_REJECTED';

const DEFAULT_PUBLIC_MESSAGES: Record<ListingBridgeSecurityErrorCode, string> = {
  UNAUTHORIZED: 'Authentication is required.',
  FORBIDDEN: 'This action is not allowed.',
  OWNERSHIP_MISMATCH: 'The requested import job is not available to this actor.',
  RIGHTS_CONFIRMATION_REQUIRED: 'Provider rights confirmation is required.',
  INVALID_URL: 'The source URL is invalid.',
  UNSUPPORTED_PROTOCOL: 'The source protocol is not supported.',
  SSRF_BLOCKED: 'The source URL is blocked by security policy.',
  DNS_UNSAFE: 'The source host is blocked by security policy.',
  REDIRECT_BLOCKED: 'A source redirect was blocked by security policy.',
  REDIRECT_LIMIT: 'The source redirected too many times.',
  TIMEOUT: 'The source request timed out.',
  RESPONSE_TOO_LARGE: 'The source response is too large.',
  UNSUPPORTED_CONTENT_TYPE: 'The source content type is not supported.',
  RATE_LIMITED: 'Too many import retrieval attempts. Try again later.',
  AUTHORIZATION_EXPIRED: 'Connector authorization has expired.',
  AUTHORIZATION_REVOKED: 'Connector authorization has been revoked.',
  FILE_REJECTED: 'The import file was rejected by security policy.',
};

const SECRET_PATTERN =
  /(?:authorization|bearer|token|secret|api[_-]?key|password|credential|cookie|set-cookie)\s*[:=]?\s*(?:bearer\s+)?[^&\s,;]+|bearer\s+[^&\s,;]+/gi;

export interface ListingBridgeSecurityErrorOptions {
  readonly code: ListingBridgeSecurityErrorCode;
  readonly internalMessage?: string;
  readonly publicMessage?: string;
  readonly status?: number;
  readonly safeDetails?: Readonly<Record<string, unknown>>;
}

export class ListingBridgeSecurityError extends Error {
  readonly code: ListingBridgeSecurityErrorCode;
  readonly publicMessage: string;
  readonly status: number;
  readonly safeDetails: Readonly<Record<string, unknown>>;

  constructor(options: ListingBridgeSecurityErrorOptions) {
    super(redactListingBridgeSecurityValue(options.internalMessage ?? options.publicMessage ?? DEFAULT_PUBLIC_MESSAGES[options.code]));
    this.name = 'ListingBridgeSecurityError';
    this.code = options.code;
    this.publicMessage = options.publicMessage ?? DEFAULT_PUBLIC_MESSAGES[options.code];
    this.status = options.status ?? statusForSecurityError(options.code);
    this.safeDetails = Object.freeze(redactListingBridgeSecurityDetails(options.safeDetails ?? {}));
  }

  toPublicPayload() {
    return Object.freeze({
      error: this.code,
      message: this.publicMessage,
    });
  }
}

export function statusForSecurityError(code: ListingBridgeSecurityErrorCode): number {
  if (code === 'UNAUTHORIZED') return 401;
  if (['FORBIDDEN', 'OWNERSHIP_MISMATCH', 'RIGHTS_CONFIRMATION_REQUIRED'].includes(code)) return 403;
  if (code === 'RATE_LIMITED') return 429;
  if (['RESPONSE_TOO_LARGE'].includes(code)) return 413;
  if (['UNSUPPORTED_CONTENT_TYPE', 'UNSUPPORTED_PROTOCOL', 'FILE_REJECTED'].includes(code)) return 415;
  if (['TIMEOUT'].includes(code)) return 504;
  return 400;
}

export function redactListingBridgeSecurityValue(value: unknown): string {
  if (value == null) return '';
  return String(value).replace(SECRET_PATTERN, '[REDACTED]');
}

export function redactListingBridgeSecurityDetails(
  details: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  return Object.freeze(Object.fromEntries(Object.entries(details).map(([key, value]) => {
    if (/authorization|token|secret|api[_-]?key|password|credential|cookie/i.test(key)) {
      return [key, '[REDACTED]'];
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return [key, redactListingBridgeSecurityDetails(value as Record<string, unknown>)];
    }
    if (typeof value === 'string') return [key, redactListingBridgeSecurityValue(value)];
    return [key, value];
  })));
}
