export interface StorageAdapter {
  uploadFile(buffer: Buffer, fileName: string, isPrivate: boolean): Promise<{ url: string; path: string }>;
  deleteFile(path: string): Promise<boolean>;
  getSignedUrl(path: string, expiresInSeconds: number): Promise<string>;
}
