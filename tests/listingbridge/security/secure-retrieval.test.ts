import {
  ListingBridgeSecureHttpRetrievalEngine,
  ListingBridgeSecurityError,
  preflightListingBridgeStructuredFile,
  type ListingBridgeHttpTransport,
  type ListingBridgeHttpTransportRequest,
  type ListingBridgeHttpTransportResponse,
  type ListingBridgeRateLimiter,
  type SsrfDnsResolver,
  type SsrfResolvedAddress,
} from '../../../src/lib/listingbridge';

const publicAddress: SsrfResolvedAddress = { address: '93.184.216.34', family: 4 };
const otherPublicAddress: SsrfResolvedAddress = { address: '203.0.113.10', family: 4 };

const resolverFrom = (records: Record<string, readonly SsrfResolvedAddress[]>): SsrfDnsResolver => {
  return async hostname => {
    const resolved = records[hostname];
    if (!resolved) throw new Error(`Unexpected DNS lookup for ${hostname}`);
    return resolved;
  };
};

async function* chunks(...values: string[]) {
  for (const value of values) yield Buffer.from(value);
}

class FakeTransport implements ListingBridgeHttpTransport {
  readonly requests: ListingBridgeHttpTransportRequest[] = [];

  constructor(
    private readonly responses: Record<string, ListingBridgeHttpTransportResponse | Error>,
  ) {}

  async execute(request: ListingBridgeHttpTransportRequest): Promise<ListingBridgeHttpTransportResponse> {
    this.requests.push(request);
    const response = this.responses[request.url.href];
    if (!response) throw new Error(`Unexpected request ${request.url.href}`);
    if (response instanceof Error) throw response;
    return response;
  }
}

const response = (
  statusCode: number,
  headers: Readonly<Record<string, string | readonly string[] | undefined>>,
  bodyValues: string[] = ['ok'],
): ListingBridgeHttpTransportResponse => ({
  statusCode,
  headers,
  body: chunks(...bodyValues),
});

const allowAllRateLimiter: ListingBridgeRateLimiter = {
  consume: jest.fn(async () => true),
};

function engine(
  resolver: SsrfDnsResolver,
  transport: ListingBridgeHttpTransport,
  rateLimiter: ListingBridgeRateLimiter = allowAllRateLimiter,
) {
  return new ListingBridgeSecureHttpRetrievalEngine({
    resolver,
    transport,
    rateLimiter,
    auditSink: { write: jest.fn(async () => undefined) },
  });
}

describe('ListingBridge secure HTTP retrieval', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    ['https://127.0.0.1/', 'SSRF_BLOCKED'],
    ['https://10.0.0.1/', 'SSRF_BLOCKED'],
    ['https://169.254.1.1/', 'SSRF_BLOCKED'],
    ['https://169.254.169.254/latest/meta-data', 'SSRF_BLOCKED'],
    ['https://[::1]/', 'SSRF_BLOCKED'],
    ['https://[fd00::1]/', 'SSRF_BLOCKED'],
    ['https://[fe80::1]/', 'SSRF_BLOCKED'],
    ['https://[::ffff:127.0.0.1]/', 'SSRF_BLOCKED'],
    ['ftp://example.com/file', 'UNSUPPORTED_PROTOCOL'],
    ['https://%', 'INVALID_URL'],
    ['https://user:pass@example.com/listing', 'INVALID_URL'],
  ])('blocks unsafe URL %s', async (url, code) => {
    const transport = new FakeTransport({});

    await expect(engine(resolverFrom({}), transport).retrieve({
      url,
      policy: { allowedProtocols: ['https:'] },
    })).rejects.toMatchObject({ code });
    expect(transport.requests).toHaveLength(0);
  });

  it('blocks hostname DNS resolution to a private IP or mixed unsafe address set', async () => {
    const transport = new FakeTransport({});
    const subject = engine(resolverFrom({
      'private.example': [{ address: '10.0.0.7', family: 4 }],
      'mixed.example': [publicAddress, { address: '192.168.1.7', family: 4 }],
    }), transport);

    await expect(subject.retrieve({ url: 'https://private.example/path' })).rejects.toMatchObject({ code: 'SSRF_BLOCKED' });
    await expect(subject.retrieve({ url: 'https://mixed.example/path' })).rejects.toMatchObject({ code: 'SSRF_BLOCKED' });
    expect(transport.requests).toHaveLength(0);
  });

  it('pins the actual request path to the validated DNS address and never calls global fetch', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    const transport = new FakeTransport({
      'https://safe.example/listing': response(200, { 'content-type': 'text/html' }, ['<html></html>']),
    });

    const result = await engine(resolverFrom({
      'safe.example': [publicAddress],
    }), transport).retrieve({ url: 'https://safe.example/listing' });

    expect(result.dataClassification).toBe('UNTRUSTED_EXTERNAL_DATA');
    expect(transport.requests[0].pinnedAddress).toEqual(publicAddress);
    expect(transport.requests[0].validated.resolvedAddresses).toEqual([publicAddress]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('allows safe redirects and strips authorization headers across origins', async () => {
    const transport = new FakeTransport({
      'https://safe.example/start': response(302, { location: 'https://other.example/final' }, []),
      'https://other.example/final': response(200, { 'content-type': 'application/json' }, ['{"ok":true}']),
    });

    const result = await engine(resolverFrom({
      'safe.example': [publicAddress],
      'other.example': [otherPublicAddress],
    }), transport).retrieve({
      url: 'https://safe.example/start',
      headers: { Authorization: 'Bearer secret-token', 'X-Trace': 'keep-local-only' },
      policy: { allowedContentTypes: ['application/json'] },
    });

    expect(result.redirectCount).toBe(1);
    expect(transport.requests[1].headers.authorization).toBeUndefined();
    expect(transport.requests[1].headers.cookie).toBeUndefined();
    expect(transport.requests[1].headers['x-trace']).toBeUndefined();
  });

  it('blocks redirects to private and metadata destinations and enforces redirect limit', async () => {
    const privateRedirect = new FakeTransport({
      'https://safe.example/start': response(302, { location: 'https://127.0.0.1/admin' }, []),
    });
    await expect(engine(resolverFrom({ 'safe.example': [publicAddress] }), privateRedirect).retrieve({
      url: 'https://safe.example/start',
    })).rejects.toMatchObject({ code: 'SSRF_BLOCKED' });

    const metadataRedirect = new FakeTransport({
      'https://safe.example/start': response(302, { location: 'https://169.254.169.254/latest/meta-data' }, []),
    });
    await expect(engine(resolverFrom({ 'safe.example': [publicAddress] }), metadataRedirect).retrieve({
      url: 'https://safe.example/start',
    })).rejects.toMatchObject({ code: 'SSRF_BLOCKED' });

    const limitRedirect = new FakeTransport({
      'https://safe.example/1': response(302, { location: 'https://safe.example/2' }, []),
      'https://safe.example/2': response(302, { location: 'https://safe.example/3' }, []),
    });
    await expect(engine(resolverFrom({ 'safe.example': [publicAddress] }), limitRedirect).retrieve({
      url: 'https://safe.example/1',
      policy: { maxRedirects: 1 },
    })).rejects.toMatchObject({ code: 'REDIRECT_LIMIT' });
  });

  it('rejects timeout, oversized Content-Length, streamed byte overflow, unsupported MIME, and rate-limit failures', async () => {
    const subject = engine(resolverFrom({ 'safe.example': [publicAddress] }), new FakeTransport({
      'https://safe.example/timeout': new ListingBridgeSecurityError({ code: 'TIMEOUT' }),
      'https://safe.example/length': response(200, { 'content-type': 'text/html', 'content-length': '100' }, ['small']),
      'https://safe.example/stream': response(200, { 'content-type': 'text/html' }, ['12345', '67890']),
      'https://safe.example/mime': response(200, { 'content-type': 'application/octet-stream' }, ['binary']),
      'https://safe.example/rate': response(200, { 'content-type': 'text/html' }, ['ok']),
    }));

    await expect(subject.retrieve({ url: 'https://safe.example/timeout' })).rejects.toMatchObject({ code: 'TIMEOUT' });
    await expect(subject.retrieve({ url: 'https://safe.example/length', policy: { maxResponseBytes: 10 } })).rejects.toMatchObject({ code: 'RESPONSE_TOO_LARGE' });
    await expect(subject.retrieve({ url: 'https://safe.example/stream', policy: { maxResponseBytes: 8 } })).rejects.toMatchObject({ code: 'RESPONSE_TOO_LARGE' });
    await expect(subject.retrieve({ url: 'https://safe.example/mime' })).rejects.toMatchObject({ code: 'UNSUPPORTED_CONTENT_TYPE' });

    const deniedLimiter: ListingBridgeRateLimiter = { consume: jest.fn(async () => false) };
    await expect(engine(resolverFrom({ 'safe.example': [publicAddress] }), new FakeTransport({
      'https://safe.example/rate': response(200, { 'content-type': 'text/html' }, ['ok']),
    }), deniedLimiter).retrieve({
      url: 'https://safe.example/rate',
      policy: { ratePolicy: { key: 'rl:listingbridge:test', limit: 1, windowMs: 60000 } },
    })).rejects.toMatchObject({ code: 'RATE_LIMITED' });
  });

  it('redacts secrets from public error payloads and audit-safe details', async () => {
    const error = new ListingBridgeSecurityError({
      code: 'UNAUTHORIZED',
      internalMessage: 'authorization=Bearer secret-token',
      safeDetails: { token: 'secret-token', source: 'safe' },
    });

    expect(error.message).not.toContain('secret-token');
    expect(JSON.stringify(error.toPublicPayload())).not.toContain('secret-token');
    expect(JSON.stringify(error.safeDetails)).not.toContain('secret-token');
  });
});

describe('ListingBridge structured file preflight', () => {
  it('accepts valid small JSON, CSV, and XML files as untrusted external data', () => {
    expect(preflightListingBridgeStructuredFile({
      fileName: 'listing.json',
      mimeType: 'application/json',
      sizeBytes: 12,
      buffer: Buffer.from('{"ok":true}'),
    })).toMatchObject({ accepted: true, extension: '.json', dataClassification: 'UNTRUSTED_EXTERNAL_DATA' });

    expect(preflightListingBridgeStructuredFile({
      fileName: 'listing.csv',
      mimeType: 'text/csv',
      sizeBytes: 16,
      buffer: Buffer.from('title,price\nA,1'),
    })).toMatchObject({ accepted: true, extension: '.csv' });

    expect(preflightListingBridgeStructuredFile({
      fileName: 'listing.xml',
      mimeType: 'application/xml',
      sizeBytes: 20,
      buffer: Buffer.from('<listing></listing>'),
    })).toMatchObject({ accepted: true, extension: '.xml' });
  });

  it('rejects oversized, unsupported, dangerous, and executable structured files', () => {
    expect(() => preflightListingBridgeStructuredFile({
      fileName: 'listing.json',
      mimeType: 'application/json',
      sizeBytes: 3 * 1024 * 1024,
      buffer: Buffer.alloc(3 * 1024 * 1024, '{}'),
    })).toThrow(ListingBridgeSecurityError);

    expect(() => preflightListingBridgeStructuredFile({
      fileName: 'listing.js',
      mimeType: 'application/javascript',
      sizeBytes: 16,
      buffer: Buffer.from('alert(1)'),
    })).toThrow(ListingBridgeSecurityError);

    expect(() => preflightListingBridgeStructuredFile({
      fileName: '..\\listing.csv',
      mimeType: 'text/csv',
      sizeBytes: 5,
      buffer: Buffer.from('a,b'),
    })).toThrow(ListingBridgeSecurityError);

    expect(() => preflightListingBridgeStructuredFile({
      fileName: 'listing.xml',
      mimeType: 'application/xml',
      sizeBytes: 64,
      buffer: Buffer.from('<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>'),
    })).toThrow(ListingBridgeSecurityError);

    expect(() => preflightListingBridgeStructuredFile({
      fileName: 'listing.csv',
      mimeType: 'text/csv',
      sizeBytes: 8,
      buffer: Buffer.from('MZpayload'),
    })).toThrow(ListingBridgeSecurityError);
  });
});
