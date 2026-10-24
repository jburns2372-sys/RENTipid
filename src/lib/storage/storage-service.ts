import { StorageAdapter } from './storage-interface';
import { LocalStorageAdapter } from './local-storage-adapter';
import { VercelBlobStorageAdapter } from './vercel-blob-storage-adapter';

class StorageService {
  private _adapter?: StorageAdapter;

  get adapter(): StorageAdapter {
    if (!this._adapter) {
      this._adapter = this.resolveAdapter();
    }
    return this._adapter;
  }

  private resolveAdapter(): StorageAdapter {
    const configuredProvider = process.env.STORAGE_PROVIDER;
    const isProdOrPreview = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
    const hasBlobToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

    // Auto-detect or use configured provider
    const provider = configuredProvider || (hasBlobToken || isProdOrPreview ? 'vercel_blob' : 'local');

    switch (provider) {
      case 'vercel_blob':
      case 'blob':
        return new VercelBlobStorageAdapter();
      case 'local':
        if (isProdOrPreview && !process.env.ALLOW_LOCAL_STORAGE_IN_PRODUCTION) {
          if (hasBlobToken) {
            return new VercelBlobStorageAdapter();
          } else {
            throw new Error(
              'FATAL: LocalStorageAdapter is disabled in Production/Vercel serverless environments. Configure Vercel Blob (BLOB_READ_WRITE_TOKEN).',
            );
          }
        } else {
          return new LocalStorageAdapter();
        }
      default:
        if (hasBlobToken) {
          return new VercelBlobStorageAdapter();
        } else {
          return new LocalStorageAdapter();
        }
    }
  }

  async uploadPublicFile(buffer: Buffer, fileName: string) {
    return this.adapter.uploadFile(buffer, fileName, false);
  }

  async uploadPrivateFile(buffer: Buffer, fileName: string) {
    return this.adapter.uploadFile(buffer, fileName, true);
  }

  async deleteFile(pathOrUrl: string) {
    return this.adapter.deleteFile(pathOrUrl);
  }

  async getSignedUrl(path: string, expiresInSeconds: number = 3600) {
    return this.adapter.getSignedUrl(path, expiresInSeconds);
  }
}

export const storageService = new StorageService();
