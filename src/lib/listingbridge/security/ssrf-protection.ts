import { lookup } from 'node:dns/promises';
import net from 'node:net';

export type SsrfAddressFamily = 4 | 6;

export interface SsrfResolvedAddress {
  readonly address: string;
  readonly family: SsrfAddressFamily;
}

export type SsrfDnsResolver = (hostname: string) => Promise<readonly SsrfResolvedAddress[]>;

export interface SsrfProtectionOptions {
  readonly allowHttp?: boolean;
  readonly maxRedirects?: number;
  readonly resolver?: SsrfDnsResolver;
  readonly blockedHostnames?: readonly string[];
}

export interface ValidatedListingBridgeUrl {
  readonly url: URL;
  readonly normalizedUrl: string;
  readonly protocol: 'https:' | 'http:';
  readonly hostname: string;
  readonly resolvedAddresses: readonly SsrfResolvedAddress[];
  readonly validatedAt: Date;
}

export class SsrfProtectionError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'SsrfProtectionError';
  }
}

const DEFAULT_MAX_REDIRECTS = 3;

const DEFAULT_BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata',
  'metadata.google.internal',
  'instance-data',
]);

const defaultResolver: SsrfDnsResolver = async (hostname) => {
  const records = await lookup(hostname, { all: true, verbatim: true });
  return records.map((record) => ({
    address: record.address,
    family: record.family === 6 ? 6 : 4,
  }));
};

export class SsrfProtectionService {
  private readonly allowHttp: boolean;
  private readonly maxRedirects: number;
  private readonly resolver: SsrfDnsResolver;
  private readonly blockedHostnames: Set<string>;

  constructor(options: SsrfProtectionOptions = {}) {
    this.allowHttp = options.allowHttp === true;
    this.maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
    this.resolver = options.resolver ?? defaultResolver;
    this.blockedHostnames = new Set([
      ...DEFAULT_BLOCKED_HOSTNAMES,
      ...(options.blockedHostnames ?? []).map((hostname) => hostname.toLowerCase()),
    ]);
  }

  async validateUrl(input: string): Promise<ValidatedListingBridgeUrl> {
    const url = this.parseUrl(input);

    if (url.protocol !== 'https:' && !(this.allowHttp && url.protocol === 'http:')) {
      throw new SsrfProtectionError('UNSUPPORTED_PROTOCOL', 'Only HTTPS URLs are allowed by default');
    }

    if (url.username || url.password) {
      throw new SsrfProtectionError('EMBEDDED_CREDENTIALS_REJECTED', 'URLs with embedded credentials are not allowed');
    }

    const hostname = normalizeHostname(url.hostname);
    if (!hostname) {
      throw new SsrfProtectionError('HOST_MISSING', 'URL host is required');
    }

    this.assertAllowedHostname(hostname);

    const resolvedAddresses = await this.resolveHost(hostname);
    if (resolvedAddresses.length === 0) {
      throw new SsrfProtectionError('DNS_RESOLUTION_EMPTY', 'Hostname resolved to no addresses');
    }

    for (const resolved of resolvedAddresses) {
      assertSafeIpAddress(resolved.address);
    }

    return {
      url,
      normalizedUrl: url.href,
      protocol: url.protocol as 'https:' | 'http:',
      hostname,
      resolvedAddresses,
      validatedAt: new Date(),
    };
  }

  async validateRedirectChain(initialUrl: string, redirectLocations: readonly string[]): Promise<readonly ValidatedListingBridgeUrl[]> {
    if (redirectLocations.length > this.maxRedirects) {
      throw new SsrfProtectionError('TOO_MANY_REDIRECTS', 'Redirect count exceeds the configured limit');
    }

    const validated: ValidatedListingBridgeUrl[] = [];
    let current = await this.validateUrl(initialUrl);
    validated.push(current);

    for (const redirectLocation of redirectLocations) {
      current = await this.validateRedirectTarget(current.url, redirectLocation);
      validated.push(current);
    }

    return validated;
  }

  async validateRedirectTarget(currentUrl: URL | string, redirectLocation: string): Promise<ValidatedListingBridgeUrl> {
    let target: URL;
    try {
      target = new URL(redirectLocation, currentUrl);
    } catch {
      throw new SsrfProtectionError('MALFORMED_REDIRECT_URL', 'Redirect target is not a valid URL');
    }

    return this.validateUrl(target.href);
  }

  private parseUrl(input: string): URL {
    const trimmed = input.trim();
    if (!trimmed) {
      throw new SsrfProtectionError('MALFORMED_URL', 'URL is empty');
    }

    const withDefaultProtocol = /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;

    try {
      return new URL(withDefaultProtocol);
    } catch {
      throw new SsrfProtectionError('MALFORMED_URL', 'Input is not a valid URL');
    }
  }

  private assertAllowedHostname(hostname: string): void {
    if (this.blockedHostnames.has(hostname) || hostname.endsWith('.localhost')) {
      throw new SsrfProtectionError('BLOCKED_HOSTNAME', 'Hostname is blocked for outbound retrieval');
    }
  }

  private async resolveHost(hostname: string): Promise<readonly SsrfResolvedAddress[]> {
    const literalFamily = net.isIP(hostname);
    if (literalFamily === 4 || literalFamily === 6) {
      return [{ address: hostname, family: literalFamily }];
    }

    try {
      return await this.resolver(hostname);
    } catch {
      throw new SsrfProtectionError('DNS_RESOLUTION_FAILED', 'DNS resolution failed closed');
    }
  }
}

export function assertSafeIpAddress(address: string): void {
  const normalized = normalizeIpAddress(address);
  const mappedIpv4 = extractIpv4MappedAddress(normalized);
  if (mappedIpv4) {
    assertSafeIpv4Address(mappedIpv4);
    return;
  }

  const family = net.isIP(normalized);
  if (family === 4) {
    assertSafeIpv4Address(normalized);
    return;
  }

  if (family === 6) {
    assertSafeIpv6Address(normalized);
    return;
  }

  throw new SsrfProtectionError('INVALID_RESOLVED_ADDRESS', 'Resolved address is not a valid IP address');
}

function assertSafeIpv4Address(address: string): void {
  const octets = parseIpv4Octets(address);
  if (!octets) {
    throw new SsrfProtectionError('INVALID_IPV4_ADDRESS', 'Resolved IPv4 address is invalid');
  }

  const [first, second] = octets;
  if (first === 0) {
    throw new SsrfProtectionError('UNSAFE_IP_UNSPECIFIED', 'Unspecified IPv4 ranges are not allowed');
  }
  if (first === 10) {
    throw new SsrfProtectionError('UNSAFE_IP_PRIVATE', 'Private IPv4 ranges are not allowed');
  }
  if (first === 100 && second >= 64 && second <= 127) {
    throw new SsrfProtectionError('UNSAFE_IP_SHARED_ADDRESS_SPACE', 'Carrier-grade NAT IPv4 ranges are not allowed');
  }
  if (first === 127) {
    throw new SsrfProtectionError('UNSAFE_IP_LOOPBACK', 'Loopback IPv4 ranges are not allowed');
  }
  if (first === 169 && second === 254) {
    throw new SsrfProtectionError('UNSAFE_IP_LINK_LOCAL', 'Link-local and metadata IPv4 ranges are not allowed');
  }
  if (first === 172 && second >= 16 && second <= 31) {
    throw new SsrfProtectionError('UNSAFE_IP_PRIVATE', 'Private IPv4 ranges are not allowed');
  }
  if (first === 192 && second === 168) {
    throw new SsrfProtectionError('UNSAFE_IP_PRIVATE', 'Private IPv4 ranges are not allowed');
  }
  if (address === '168.63.129.16' || address === '100.100.100.200') {
    throw new SsrfProtectionError('UNSAFE_METADATA_ADDRESS', 'Cloud metadata service addresses are not allowed');
  }
}

function assertSafeIpv6Address(address: string): void {
  const segments = parseIpv6Segments(address);
  if (!segments) {
    throw new SsrfProtectionError('INVALID_IPV6_ADDRESS', 'Resolved IPv6 address is invalid');
  }

  if (segments.every((segment) => segment === 0)) {
    throw new SsrfProtectionError('UNSAFE_IP_UNSPECIFIED', 'Unspecified IPv6 addresses are not allowed');
  }

  if (segments.slice(0, 7).every((segment) => segment === 0) && segments[7] === 1) {
    throw new SsrfProtectionError('UNSAFE_IP_LOOPBACK', 'IPv6 loopback is not allowed');
  }

  const first = segments[0];
  if ((first & 0xffc0) === 0xfe80) {
    throw new SsrfProtectionError('UNSAFE_IP_LINK_LOCAL', 'IPv6 link-local ranges are not allowed');
  }

  if ((first & 0xfe00) === 0xfc00) {
    throw new SsrfProtectionError('UNSAFE_IP_PRIVATE', 'IPv6 unique-local ranges are not allowed');
  }
}

function normalizeHostname(hostname: string): string {
  return normalizeIpAddress(hostname).toLowerCase();
}

function normalizeIpAddress(address: string): string {
  const withoutBrackets = address.startsWith('[') && address.endsWith(']')
    ? address.slice(1, -1)
    : address;
  const scopeIndex = withoutBrackets.indexOf('%');
  return scopeIndex >= 0 ? withoutBrackets.slice(0, scopeIndex) : withoutBrackets;
}

function parseIpv4Octets(address: string): readonly [number, number, number, number] | null {
  const parts = address.split('.');
  if (parts.length !== 4) {
    return null;
  }

  const octets = parts.map((part) => {
    if (!/^\d+$/.test(part)) {
      return Number.NaN;
    }
    return Number(part);
  });

  if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return null;
  }

  return [octets[0], octets[1], octets[2], octets[3]];
}

function extractIpv4MappedAddress(address: string): string | null {
  const segments = parseIpv6Segments(address);
  if (!segments) {
    return null;
  }

  const isMapped = segments.slice(0, 5).every((segment) => segment === 0) && segments[5] === 0xffff;
  const isCompatible = segments.slice(0, 6).every((segment) => segment === 0) && (segments[6] !== 0 || segments[7] > 1);
  if (!isMapped && !isCompatible) {
    return null;
  }

  const high = segments[6];
  const low = segments[7];
  return [
    (high >> 8) & 255,
    high & 255,
    (low >> 8) & 255,
    low & 255,
  ].join('.');
}

function parseIpv6Segments(address: string): readonly number[] | null {
  const normalized = normalizeIpAddress(address).toLowerCase();
  if (!normalized.includes(':')) {
    return null;
  }

  const ipv4TailMatch = normalized.match(/(.+:)(\d{1,3}(?:\.\d{1,3}){3})$/);
  const addressForParsing = ipv4TailMatch
    ? replaceIpv4Tail(ipv4TailMatch[1], ipv4TailMatch[2])
    : normalized;

  if (!addressForParsing || (addressForParsing.match(/::/g) ?? []).length > 1) {
    return null;
  }

  const [leftRaw, rightRaw] = addressForParsing.split('::');
  const left = splitIpv6Side(leftRaw);
  const right = rightRaw === undefined ? [] : splitIpv6Side(rightRaw);
  if (!left || !right) {
    return null;
  }

  const missing = rightRaw === undefined ? 0 : 8 - left.length - right.length;
  if (missing < 0) {
    return null;
  }

  const segments = [...left, ...Array.from({ length: missing }, () => 0), ...right];
  return segments.length === 8 ? segments : null;
}

function replaceIpv4Tail(prefix: string, ipv4Address: string): string | null {
  const octets = parseIpv4Octets(ipv4Address);
  if (!octets) {
    return null;
  }

  const high = ((octets[0] << 8) | octets[1]).toString(16);
  const low = ((octets[2] << 8) | octets[3]).toString(16);
  return `${prefix}${high}:${low}`;
}

function splitIpv6Side(side: string): number[] | null {
  if (!side) {
    return [];
  }

  return side.split(':').map((part) => {
    if (!/^[0-9a-f]{1,4}$/i.test(part)) {
      return Number.NaN;
    }
    return Number.parseInt(part, 16);
  }).every((segment) => Number.isInteger(segment) && segment >= 0 && segment <= 0xffff)
    ? side.split(':').map((part) => Number.parseInt(part, 16))
    : null;
}
