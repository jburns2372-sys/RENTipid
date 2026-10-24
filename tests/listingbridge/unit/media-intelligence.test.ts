import {
  ListingBridgeMediaSecurityValidator,
  ListingBridgeMediaIngestionPipeline,
  MockListingBridgeStorageProvider,
} from '../../../src/lib/listingbridge';

describe('ListingBridge P6: Media Security & Ingestion Pipeline', () => {
  const validator = new ListingBridgeMediaSecurityValidator();
  const mockStorage = new MockListingBridgeStorageProvider();
  const pipeline = new ListingBridgeMediaIngestionPipeline();

  // Valid fixture buffers
  const validJpegBuffer = Buffer.concat([
    Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]),
    Buffer.alloc(200, 0xaa),
  ]);

  const validPngBuffer = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]),
    Buffer.alloc(200, 0xbb),
  ]);

  const validWebpBuffer = Buffer.concat([
    Buffer.from([0x52, 0x49, 0x46, 0x46, 0x20, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]),
    Buffer.alloc(200, 0xcc),
  ]);

  const fakeExecutableBuffer = Buffer.concat([
    Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]), // MZ executable header
    Buffer.alloc(200, 0x00),
  ]);

  describe('Media Security Validation', () => {
    it('LB-MEDIA-001: Validates JPEG, PNG, and WEBP buffers successfully', () => {
      const resJpeg = validator.validate(validJpegBuffer, 'image/jpeg');
      expect(resJpeg.isValid).toBe(true);
      expect(resJpeg.detectedMime).toBe('image/jpeg');
      expect(resJpeg.suggestedExtension).toBe('.jpg');
      expect(resJpeg.contentSha256).toBeDefined();

      const resPng = validator.validate(validPngBuffer, 'image/png');
      expect(resPng.isValid).toBe(true);
      expect(resPng.detectedMime).toBe('image/png');
      expect(resPng.suggestedExtension).toBe('.png');

      const resWebp = validator.validate(validWebpBuffer, 'image/webp');
      expect(resWebp.isValid).toBe(true);
      expect(resWebp.detectedMime).toBe('image/webp');
      expect(resWebp.suggestedExtension).toBe('.webp');
    });

    it('LB-MEDIA-002: Rejects invalid or mismatched MIME types and executables', () => {
      // Dangerous executable payload declared as image/jpeg
      const resExe = validator.validate(fakeExecutableBuffer, 'image/jpeg');
      expect(resExe.isValid).toBe(false);
      expect(resExe.errorCode).toBe('MEDIA_MIME_NOT_ALLOWED');

      // Valid JPEG declared as image/png (mismatch)
      const resMismatch = validator.validate(validJpegBuffer, 'image/png');
      expect(resMismatch.isValid).toBe(false);
      expect(resMismatch.errorCode).toBe('MEDIA_TYPE_MISMATCH');
    });

    it('Rejects too small or oversized media buffers', () => {
      const tooSmallBuffer = Buffer.from([0xff, 0xd8, 0xff]); // < 100 bytes
      const resSmall = validator.validate(tooSmallBuffer, 'image/jpeg');
      expect(resSmall.isValid).toBe(false);
      expect(resSmall.errorCode).toBe('MEDIA_EMPTY_OR_TOO_SMALL');

      const strictValidator = new ListingBridgeMediaSecurityValidator({
        maxSizeBytes: 500, // 500 bytes max
        minSizeBytes: 100,
        allowedMimes: ['image/jpeg'],
      });

      const oversizedBuffer = Buffer.concat([
        Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
        Buffer.alloc(1000, 0x00),
      ]);
      const resLarge = strictValidator.validate(oversizedBuffer, 'image/jpeg');
      expect(resLarge.isValid).toBe(false);
      expect(resLarge.errorCode).toBe('MEDIA_TOO_LARGE');
    });
  });

  describe('Media Ingestion Pipeline', () => {
    it('LB-MEDIA-001: Ingests valid candidate media into RENTipid managed storage', async () => {
      const result = await pipeline.processCandidates(
        'job-media-001',
        [
          {
            sourceReferenceHash: 'hash-photo-1',
            buffer: validJpegBuffer,
            declaredMime: 'image/jpeg',
            caption: 'Living room view',
            isCover: true,
            order: 1,
          },
          {
            sourceReferenceHash: 'hash-photo-2',
            buffer: validPngBuffer,
            declaredMime: 'image/png',
            caption: 'Kitchen area',
            isCover: false,
            order: 2,
          },
        ],
        { storageProvider: mockStorage },
      );

      expect(result.totalCandidates).toBe(2);
      expect(result.successfulAssets.length).toBe(2);
      expect(result.failedAssets.length).toBe(0);
      expect(result.duplicateCount).toBe(0);

      const coverAsset = result.successfulAssets.find((a) => a.isCover);
      expect(coverAsset?.sourceReferenceHash).toBe('hash-photo-1');
      expect(coverAsset?.status).toBe('VALIDATED');
      expect(coverAsset?.rentipidAssetPath).toContain('listingbridge/job-media-001/');
    });

    it('LB-MEDIA-003: Deduplicates repeated media with identical content hash', async () => {
      const result = await pipeline.processCandidates(
        'job-media-003',
        [
          {
            sourceReferenceHash: 'hash-photo-original',
            buffer: validJpegBuffer,
            declaredMime: 'image/jpeg',
            isCover: true,
            order: 1,
          },
          {
            sourceReferenceHash: 'hash-photo-duplicate',
            buffer: validJpegBuffer, // Exact same bytes
            declaredMime: 'image/jpeg',
            isCover: false,
            order: 2,
          },
        ],
        { storageProvider: mockStorage },
      );

      expect(result.successfulAssets.length).toBe(2);
      expect(result.duplicateCount).toBe(1);

      const dupAsset = result.successfulAssets.find((a) => a.sourceReferenceHash === 'hash-photo-duplicate');
      expect(dupAsset?.status).toBe('SKIPPED_DUPLICATE');
      // Reuses the exact same storage path as the first asset
      expect(dupAsset?.rentipidAssetPath).toBe(result.successfulAssets[0].rentipidAssetPath);
    });

    it('LB-MEDIA-004: Tolerates partial media failure without failing the entire job', async () => {
      const result = await pipeline.processCandidates(
        'job-media-004',
        [
          {
            sourceReferenceHash: 'hash-valid-photo',
            buffer: validJpegBuffer,
            declaredMime: 'image/jpeg',
            order: 1,
          },
          {
            sourceReferenceHash: 'hash-corrupted-photo',
            buffer: fakeExecutableBuffer, // Invalid payload
            declaredMime: 'image/jpeg',
            order: 2,
          },
          {
            sourceReferenceHash: 'hash-valid-photo-2',
            buffer: validPngBuffer,
            declaredMime: 'image/png',
            order: 3,
          },
        ],
        { storageProvider: mockStorage },
      );

      expect(result.totalCandidates).toBe(3);
      expect(result.successfulAssets.length).toBe(2);
      expect(result.failedAssets.length).toBe(1);

      expect(result.failedAssets[0].sourceReferenceHash).toBe('hash-corrupted-photo');
      expect(result.failedAssets[0].status).toBe('REJECTED');
      expect(result.failedAssets[0].errorCode).toBe('MEDIA_MIME_NOT_ALLOWED');

      // Valid assets still succeeded and are validated
      expect(result.successfulAssets[0].sourceReferenceHash).toBe('hash-valid-photo');
      expect(result.successfulAssets[1].sourceReferenceHash).toBe('hash-valid-photo-2');
    });
  });
});
