jest.mock('@vercel/blob', () => ({
  del: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
}));

describe('Vercel Blob access modes', () => {
  const original = {
    blobToken: process.env.BLOB_READ_WRITE_TOKEN,
    privateToken: process.env.PRIVATE_BLOB_READ_WRITE_TOKEN,
    nodeEnv: process.env.NODE_ENV,
  };

  afterEach(() => jest.clearAllMocks());

  afterAll(() => {
    if (original.blobToken === undefined) delete process.env.BLOB_READ_WRITE_TOKEN;
    else process.env.BLOB_READ_WRITE_TOKEN = original.blobToken;
    if (original.privateToken === undefined) delete process.env.PRIVATE_BLOB_READ_WRITE_TOKEN;
    else process.env.PRIVATE_BLOB_READ_WRITE_TOKEN = original.privateToken;
    process.env.NODE_ENV = original.nodeEnv;
  });

  it('uploads private documents with private access', async () => {
    process.env.BLOB_READ_WRITE_TOKEN = 'public-token';
    process.env.PRIVATE_BLOB_READ_WRITE_TOKEN = 'private-token';
    const { put } = await import('@vercel/blob');
    (put as jest.Mock).mockResolvedValue({ url: 'https://private.blob.vercel-storage.com/private/doc.pdf', pathname: 'private/doc.pdf' });
    const { VercelBlobStorageAdapter } = await import('@/lib/storage/vercel-blob-storage-adapter');

    await new VercelBlobStorageAdapter().uploadFile(Buffer.from('document'), 'doc.pdf', true);

    expect(put).toHaveBeenCalledWith('private/doc.pdf', expect.any(Buffer), expect.objectContaining({ access: 'private', token: 'private-token' }));
  });

  it('uploads listing media with public access and the public token', async () => {
    process.env.BLOB_READ_WRITE_TOKEN = 'public-token';
    delete process.env.PRIVATE_BLOB_READ_WRITE_TOKEN;
    const { put } = await import('@vercel/blob');
    (put as jest.Mock).mockResolvedValue({ url: 'https://public.blob.vercel-storage.com/uploads/photo.jpg', pathname: 'uploads/photo.jpg' });
    const { VercelBlobStorageAdapter } = await import('@/lib/storage/vercel-blob-storage-adapter');

    await new VercelBlobStorageAdapter().uploadFile(Buffer.from('photo'), 'photo.jpg', false);

    expect(put).toHaveBeenCalledWith('uploads/photo.jpg', expect.any(Buffer), expect.objectContaining({ access: 'public', token: 'public-token' }));
  });

  it('retrieves private blobs with private access and no cache', async () => {
    process.env.BLOB_READ_WRITE_TOKEN = 'public-token';
    process.env.PRIVATE_BLOB_READ_WRITE_TOKEN = 'private-token';
    const { get } = await import('@vercel/blob');
    (get as jest.Mock).mockResolvedValue(null);
    const { getPrivateBlob } = await import('@/lib/storage/vercel-blob-storage-adapter');

    await getPrivateBlob('private/doc.pdf');

    expect(get).toHaveBeenCalledWith('private/doc.pdf', { access: 'private', token: 'private-token', useCache: false });
  });
});
