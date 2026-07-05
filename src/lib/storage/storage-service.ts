import { StorageAdapter } from './storage-interface';
import { LocalStorageAdapter } from './local-storage-adapter';
// import { S3StorageAdapter } from './s3-storage-adapter';
// import { R2StorageAdapter } from './r2-storage-adapter';
// import { SupabaseStorageAdapter } from './supabase-storage-adapter';

class StorageService {
  private adapter: StorageAdapter;

  constructor() {
    const provider = process.env.STORAGE_PROVIDER || 'local';
    
    switch (provider) {
      /*
      case 's3':
        this.adapter = new S3StorageAdapter();
        break;
      case 'r2':
        this.adapter = new R2StorageAdapter();
        break;
      case 'supabase':
        this.adapter = new SupabaseStorageAdapter();
        break;
      */
      case 'local':
      default:
        this.adapter = new LocalStorageAdapter();
    }
  }

  async uploadPublicFile(buffer: Buffer, fileName: string) {
    return this.adapter.uploadFile(buffer, fileName, false);
  }

  async uploadPrivateFile(buffer: Buffer, fileName: string) {
    return this.adapter.uploadFile(buffer, fileName, true);
  }

  async getSignedUrl(path: string, expiresInSeconds: number = 3600) {
    return this.adapter.getSignedUrl(path, expiresInSeconds);
  }
}

export const storageService = new StorageService();
