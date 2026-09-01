export interface StoredMediaAsset {
  readonly storagePath: string;
  readonly contentSha256: string;
  readonly sizeBytes: number;
  readonly mimeType: string;
}

export interface ListingBridgeStorageProvider {
  storeMedia(
    buffer: Buffer,
    fileName: string,
  ): Promise<{ path: string; publicUrl?: string }>;
}

export class DefaultListingBridgeStorageProvider implements ListingBridgeStorageProvider {
  async storeMedia(buffer: Buffer, fileName: string): Promise<{ path: string; publicUrl?: string }> {
    const { storageService } = await import('../../storage/storage-service');
    const result = await storageService.uploadPublicFile(buffer, fileName);
    return {
      path: result.path,
      publicUrl: result.url,
    };
  }
}

export class MockListingBridgeStorageProvider implements ListingBridgeStorageProvider {
  private readonly storedFiles = new Map<string, Buffer>();

  async storeMedia(buffer: Buffer, fileName: string): Promise<{ path: string; publicUrl?: string }> {
    this.storedFiles.set(fileName, buffer);
    return {
      path: `mock://storage/${fileName}`,
      publicUrl: `https://storage.rentipid.local/${fileName}`,
    };
  }

  getStoredFile(fileName: string): Buffer | undefined {
    return this.storedFiles.get(fileName);
  }
}
