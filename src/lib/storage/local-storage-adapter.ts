import { StorageAdapter } from './storage-interface';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';

export class LocalStorageAdapter implements StorageAdapter {
  async uploadFile(buffer: Buffer, fileName: string, isPrivate: boolean): Promise<{ url: string; path: string }> {
    const baseDir = isPrivate ? 'private-uploads' : 'public/uploads';
    const filePath = path.join(process.cwd(), baseDir, fileName);
    
    await writeFile(filePath, buffer);
    
    return {
      url: isPrivate ? `/api/documents/view/${fileName}` : `/uploads/${fileName}`,
      path: filePath
    };
  }

  async deleteFile(filePath: string): Promise<boolean> {
    try {
      await unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getSignedUrl(filePath: string, expiresInSeconds: number): Promise<string> {
    // In local dev, we might just return the proxy API endpoint
    // In production this would generate a signed JWT
    const fileName = path.basename(filePath);
    return `/api/documents/view/${fileName}?t=${Date.now()}`;
  }
}
