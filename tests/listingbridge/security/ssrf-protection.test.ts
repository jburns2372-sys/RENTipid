import {
  SsrfProtectionError,
  SsrfProtectionService,
  type SsrfDnsResolver,
  type SsrfResolvedAddress,
} from '../../../src/lib/listingbridge/security/ssrf-protection';

const resolverFrom = (records: Record<string, readonly SsrfResolvedAddress[]>): SsrfDnsResolver => {
  return async (hostname: string) => {
    const resolved = records[hostname];
    if (!resolved) {
      throw new Error(`Unexpected DNS lookup for ${hostname}`);
    }
    return resolved;
  };
};

const expectBlocked = async (promise: Promise<unknown>, code?: string) => {
  await expect(promise).rejects.toMatchObject({
    name: 'SsrfProtectionError',
    ...(code ? { code } : {}),
  });
};

describe('SsrfProtectionService', () => {
  it('allows a normal public HTTPS URL with deterministic DNS', async () => {
    const service = new SsrfProtectionService({
      resolver: resolverFrom({
        'example.com': [{ address: '93.184.216.34', family: 4 }],
      }),
    });

    const result = await service.validateUrl('https://example.com/listing/123');

    expect(result.normalizedUrl).toBe('https://example.com/listing/123');
    expect(result.resolvedAddresses).toEqual([{ address: '93.184.216.34', family: 4 }]);
  });

  it('defaults scheme-less input to HTTPS', async () => {
    const service = new SsrfProtectionService({
      resolver: resolverFrom({
        'example.com': [{ address: '93.184.216.34', family: 4 }],
      }),
    });

    const result = await service.validateUrl('example.com/listing/123');

    expect(result.normalizedUrl).toBe('https://example.com/listing/123');
  });

  it.each([
    ['https://127.0.0.1/', 'UNSAFE_IP_LOOPBACK'],
    ['https://localhost/', 'BLOCKED_HOSTNAME'],
    ['https://0.0.0.0/', 'UNSAFE_IP_UNSPECIFIED'],
    ['https://10.10.10.10/', 'UNSAFE_IP_PRIVATE'],
    ['https://172.16.0.10/', 'UNSAFE_IP_PRIVATE'],
    ['https://192.168.1.10/', 'UNSAFE_IP_PRIVATE'],
    ['https://169.254.1.2/', 'UNSAFE_IP_LINK_LOCAL'],
    ['https://169.254.169.254/latest/meta-data', 'UNSAFE_IP_LINK_LOCAL'],
    ['https://[::1]/', 'UNSAFE_IP_LOOPBACK'],
    ['https://[fe80::1]/', 'UNSAFE_IP_LINK_LOCAL'],
    ['https://[fd00::1]/', 'UNSAFE_IP_PRIVATE'],
    ['https://[::ffff:127.0.0.1]/', 'UNSAFE_IP_LOOPBACK'],
  ])('blocks unsafe URL %s', async (url, expectedCode) => {
    const service = new SsrfProtectionService();

    await expectBlocked(service.validateUrl(url), expectedCode);
  });

  it('blocks unsupported protocols', async () => {
    const service = new SsrfProtectionService();

    await expectBlocked(service.validateUrl('ftp://example.com/listing'), 'UNSUPPORTED_PROTOCOL');
  });

  it('rejects malformed URLs', async () => {
    const service = new SsrfProtectionService();

    await expectBlocked(service.validateUrl('https://%'), 'MALFORMED_URL');
  });

  it('rejects embedded credentials', async () => {
    const service = new SsrfProtectionService();

    await expectBlocked(service.validateUrl('https://user:pass@example.com/listing'), 'EMBEDDED_CREDENTIALS_REJECTED');
  });

  it('blocks redirects from a safe URL to an unsafe destination', async () => {
    const service = new SsrfProtectionService({
      resolver: resolverFrom({
        'example.com': [{ address: '93.184.216.34', family: 4 }],
      }),
    });

    await expectBlocked(
      service.validateRedirectChain('https://example.com/start', ['https://127.0.0.1/admin']),
      'UNSAFE_IP_LOOPBACK',
    );
  });

  it('blocks a hostname resolving to a private IP', async () => {
    const service = new SsrfProtectionService({
      resolver: resolverFrom({
        'safe-looking.example': [{ address: '10.0.0.5', family: 4 }],
      }),
    });

    await expectBlocked(service.validateUrl('https://safe-looking.example/path'), 'UNSAFE_IP_PRIVATE');
  });

  it('blocks a multi-address DNS answer containing an unsafe destination', async () => {
    const service = new SsrfProtectionService({
      resolver: resolverFrom({
        'mixed.example': [
          { address: '93.184.216.34', family: 4 },
          { address: '192.168.1.20', family: 4 },
        ],
      }),
    });

    await expectBlocked(service.validateUrl('https://mixed.example/path'), 'UNSAFE_IP_PRIVATE');
  });

  it('fails closed when DNS resolution fails', async () => {
    const service = new SsrfProtectionService({
      resolver: async () => {
        throw new Error('no dns');
      },
    });

    await expectBlocked(service.validateUrl('https://example.com/path'), 'DNS_RESOLUTION_FAILED');
  });

  it('uses a typed error for blocked decisions', async () => {
    const service = new SsrfProtectionService();

    await expect(service.validateUrl('https://127.0.0.1/')).rejects.toBeInstanceOf(SsrfProtectionError);
  });
});
