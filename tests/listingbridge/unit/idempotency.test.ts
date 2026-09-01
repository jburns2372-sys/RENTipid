import {
  computeSha256,
  generateImportJobIdempotencyKey,
  computeAssetDeduplicationKey,
} from '../../../src/lib/listingbridge/utils/idempotency';

describe('ListingBridge Idempotency & Provenance Hashing (P2 Foundation)', () => {
  it('computes deterministic SHA-256 hashes for strings and buffers', () => {
    const input = 'https://example.com/property/unit-402';
    const hash1 = computeSha256(input);
    const hash2 = computeSha256(Buffer.from(input));

    expect(hash1).toHaveLength(64);
    expect(hash1).toBe(hash2);
    expect(hash1).toBe('a900c1acfacc46938e234ee4f2100a978491e62c4e04dbcc65e2a8a9ef0e4386');
  });

  it('generates deterministic idempotency keys for the same provider and source intent', () => {
    const providerId = 'usr_provider_abc';
    const sourceRefHash = computeSha256('https://example.com/listings/123');

    const key1 = generateImportJobIdempotencyKey(providerId, sourceRefHash);
    const key2 = generateImportJobIdempotencyKey(providerId, sourceRefHash);

    expect(key1).toBe(key2);
    expect(key1.startsWith('lb_job_')).toBe(true);
    expect(key1).toHaveLength(39); // "lb_job_" (7) + 32 hex chars = 39
  });

  it('produces distinct idempotency keys for different providers or sources', () => {
    const provider1 = 'usr_provider_1';
    const provider2 = 'usr_provider_2';
    const sourceRefHash1 = computeSha256('https://example.com/listings/1');
    const sourceRefHash2 = computeSha256('https://example.com/listings/2');

    const keyP1 = generateImportJobIdempotencyKey(provider1, sourceRefHash1);
    const keyP2 = generateImportJobIdempotencyKey(provider2, sourceRefHash1);
    const keySource2 = generateImportJobIdempotencyKey(provider1, sourceRefHash2);

    expect(keyP1).not.toBe(keyP2);
    expect(keyP1).not.toBe(keySource2);
  });

  it('computes stable media asset deduplication keys', () => {
    const jobId = 'job_12345';
    const contentSha256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

    const assetKey1 = computeAssetDeduplicationKey(jobId, contentSha256);
    const assetKey2 = computeAssetDeduplicationKey(jobId, contentSha256.toUpperCase());

    expect(assetKey1).toBe(assetKey2);
    expect(assetKey1).toBe(`job_12345:${contentSha256}`);
  });
});
