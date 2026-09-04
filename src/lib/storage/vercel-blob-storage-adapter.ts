import { StorageAdapter } from './storage-interface';
import { put, del } from '@vercel/blob';

export class VercelBlobStorageAdapter implements StorageAdapter {
  async uploadFile(buffer: Buffer, fileName: string, isPrivate: boolean): Promise<{ url: string; path: string }> {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token && process.env.NODE_ENV === 'production') {
      throw new Error('BLOB_READ_WRITE_TOKEN is required for production storage operations.');
    }

    const pathname = isPrivate ? `private/${fileName}` : `uploads/${fileName}`;

    const blob = await put(pathname, buffer, {
      access: 'public',
      addRandomSuffix: false,
      token,
    });

    return {
      url: blob.url,
      path: blob.pathname,
    };
  }

  async deleteFile(filePathOrUrl: string): Promise<boolean> {
    try {
      const token = process.env.BLOB_READ_WRITE_TOKEN;
      await del(filePathOrUrl, { token });
      return true;
    } catch {
      return false;
    }
  }

  async getSignedUrl(filePathOrUrl: string, _expiresInSeconds: number): Promise<string> {
    return filePathOrUrl;
  }
}
