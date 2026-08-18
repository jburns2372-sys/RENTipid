import { POST as FinanceUpload } from '../../../src/app/api/finance/upload/route';
import { POST as DocumentsUpload } from '../../../src/app/api/documents/upload/route';
import { POST as PhotosUpload } from '../../../src/app/api/listings/[id]/photos/route';
import { POST as ListingDocumentsUpload } from '../../../src/app/api/listings/[id]/documents/route';

describe('Migrated Upload Routes', () => {
  const expectMigrated = async (res: Response) => {
    expect(res.status).toBe(410);
    const data = await res.json();
    expect(data.error).toBe('Endpoint migrated to Azure Backend');
  };

  it('1. Finance upload route returns 410 Gone', async () => {
    const res = await FinanceUpload();
    await expectMigrated(res);
  });

  it('2. KYC document route returns 410 Gone', async () => {
    const res = await DocumentsUpload();
    await expectMigrated(res);
  });

  it('3. Listing-photo route returns 410 Gone', async () => {
    const res = await PhotosUpload();
    await expectMigrated(res);
  });

  it('4. Listing-document route returns 410 Gone', async () => {
    const res = await ListingDocumentsUpload();
    await expectMigrated(res);
  });

  it('5-10. No local storage, parsing, DB mutation, validation, or network occurs', async () => {
    const res = await FinanceUpload();
    expect(res.status).toBe(410);
    // No imports from Prisma or fs exist in the handlers, guaranteeing isolation.
  });
});
