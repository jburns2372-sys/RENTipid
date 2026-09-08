import { StorageAdapter } from './storage-interface';
import { del, get, put, type GetBlobResult } from '@vercel/blob';

export function getBlobToken(isPrivate: boolean): string | undefined {
  return isPrivate
    ? process.env.PRIVATE_BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN
    : process.env.LISTING_MEDIA_BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
}

export function getPrivateBlobCredentialOptions() {
  const token = getBlobToken(true);
  if (token) return { token };
  const storeId = process.env.PRIVATE_BLOB_STORE_ID;
  const oidcToken = process.env.VERCEL_OIDC_TOKEN;
  return storeId && oidcToken ? { storeId, oidcToken } : {};
}

export async function getPrivateBlob(filePathOrUrl: string): Promise<GetBlobResult | null> {
  return get(filePathOrUrl, {
    access: 'private',
    ...getPrivateBlobCredentialOptions(),
    useCache: false,
  });
}

export class VercelBlobStorageAdapter implements StorageAdapter {
  async uploadFile(buffer: Buffer, fileName: string, isPrivate: boolean): Promise<{ url: string; path: string }> {
    const token = getBlobToken(isPrivate);
    if (!token && process.env.NODE_ENV === 'production') {
      throw new Error('BLOB_READ_WRITE_TOKEN is required for production storage operations.');
    }

    const pathname = isPrivate ? `private/${fileName}` : `uploads/${fileName}`;

    const blob = await put(pathname, buffer, {
      access: isPrivate ? 'private' : 'public',
      addRandomSuffix: false,
      ...(isPrivate ? getPrivateBlobCredentialOptions() : { token }),
    });

    return {
      url: blob.url,
      path: blob.pathname,
    };
  }

  async deleteFile(filePathOrUrl: string): Promise<boolean> {
    try {
      const isPrivate = filePathOrUrl.startsWith('private/') || filePathOrUrl.includes('/private/');
      await del(filePathOrUrl, isPrivate ? getPrivateBlobCredentialOptions() : { token: getBlobToken(false) });
      return true;
    } catch {
      return false;
    }
  }

  async getSignedUrl(filePathOrUrl: string, _expiresInSeconds: number): Promise<string> {
    return filePathOrUrl;
  }
}
