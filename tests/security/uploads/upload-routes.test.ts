import { POST as FinanceUpload } from '../../../src/app/api/finance/upload/route';
import { POST as DocumentsUpload } from '../../../src/app/api/documents/upload/route';
import { POST as PhotosUpload } from '../../../src/app/api/listings/[id]/photos/route';
import { POST as ListingDocumentsUpload } from '../../../src/app/api/listings/[id]/documents/route';
import { getServerSession } from 'next-auth/next';

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

describe('Upload Routes Isolation & Authentication', () => {
  const expectMigrated = async (res: Response) => {
    expect(res.status).toBe(410);
    const data = await res.json();
    expect(data.error).toBe('Endpoint migrated to Azure Backend');
  };

  it('1. Finance upload route returns 410 Gone (migrated)', async () => {
    const res = await FinanceUpload();
    await expectMigrated(res);
  });

  it('2. KYC document upload route returns 410 Gone (migrated)', async () => {
    const res = await DocumentsUpload();
    await expectMigrated(res);
  });

  it('3. Native listing-photo route rejects unauthenticated requests with 401', async () => {
    const req = new Request('http://localhost:3000/api/listings/test-id/photos', { method: 'POST' });
    const res = await PhotosUpload(req, { params: Promise.resolve({ id: 'test-id' }) });
    expect(res.status).toBe(401);
  });

  it('4. Native listing-document route rejects unauthenticated requests with 401', async () => {
    const req = new Request('http://localhost:3000/api/listings/test-id/documents', { method: 'POST' });
    const res = await ListingDocumentsUpload(req, { params: Promise.resolve({ id: 'test-id' }) });
    expect(res.status).toBe(401);
  });

  it('5. Finance upload handler remains isolated from direct file storage', async () => {
    const res = await FinanceUpload();
    expect(res.status).toBe(410);
  });
});
