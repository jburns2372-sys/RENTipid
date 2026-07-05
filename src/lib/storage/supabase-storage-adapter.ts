import { StorageAdapter } from './storage-interface';

// Requires: @supabase/supabase-js

export class SupabaseStorageAdapter implements StorageAdapter {
  async uploadFile(buffer: Buffer, fileName: string, isPrivate: boolean): Promise<{ url: string; path: string }> {
    // Implementation placeholder for Supabase Storage
    throw new Error('Supabase Storage not implemented yet. Configure Supabase credentials.');
  }

  async deleteFile(filePath: string): Promise<boolean> {
    throw new Error('Supabase Storage not implemented yet.');
  }

  async getSignedUrl(filePath: string, expiresInSeconds: number): Promise<string> {
    throw new Error('Supabase Storage not implemented yet.');
  }
}
