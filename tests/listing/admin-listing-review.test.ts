jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('next-auth/next', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth', () => ({ authOptions: {} }));
jest.mock('@/lib/prisma', () => {
  const mocks = {
    userFindUnique: jest.fn(),
    listingFindMany: jest.fn(),
    listingFindUnique: jest.fn(),
    listingUpdate: jest.fn(),
    documentFindUnique: jest.fn(),
    documentUpdate: jest.fn(),
    auditFindMany: jest.fn(),
  };
  const prisma = {
    user: { findUnique: mocks.userFindUnique },
    listing: {
      findMany: mocks.listingFindMany,
      findUnique: mocks.listingFindUnique,
      update: mocks.listingUpdate,
    },
    listingDocument: {
      findUnique: mocks.documentFindUnique,
      update: mocks.documentUpdate,
    },
    auditLog: { findMany: mocks.auditFindMany },
    $transaction: jest.fn(async (operation: (tx: unknown) => unknown) => operation(prisma)),
  };
  return { prisma, __mocks: mocks };
});
jest.mock('@/lib/audit', () => ({ createAuditLog: jest.fn().mockResolvedValue(true) }));

import {
  AdminListingReviewError,
  approveListing,
  evaluateRequiredDocumentReadiness,
  getAdminListingReviewDetail,
  getAdminReviewQueue,
  publishListing,
  rejectListing,
  requireAdminListingReviewer,
  reviewListingDocument,
  unpublishListing,
} from '@/lib/listings/admin-review-service';
import { getServerSession } from 'next-auth/next';
import { createAuditLog } from '@/lib/audit';

const { __mocks } = require('@/lib/prisma');
const mockGetServerSession = getServerSession as jest.Mock;
const mockCreateAuditLog = createAuditLog as jest.Mock;
const mockUserFindUnique = __mocks.userFindUnique as jest.Mock;
const mockListingFindMany = __mocks.listingFindMany as jest.Mock;
const mockListingFindUnique = __mocks.listingFindUnique as jest.Mock;
const mockListingUpdate = __mocks.listingUpdate as jest.Mock;
const mockDocumentFindUnique = __mocks.documentFindUnique as jest.Mock;
const mockDocumentUpdate = __mocks.documentUpdate as jest.Mock;
const mockAuditFindMany = __mocks.auditFindMany as jest.Mock;

function listing(overrides: Record<string, unknown> = {}) {
  return {
    id: 'listing-1',
    provider_id: 'provider-1',
    title: 'BMW K1600B',
    status: 'Submitted for Review',
    provider: { status: 'Verified' },
    category: {
      risk_level: 'Regulated',
      requirements: { required_provider_documents: JSON.stringify(['Vehicle Registration (OR/CR)']) },
    },
    photos: [{ id: 'photo-1' }],
    documents: [{ document_type: 'Vehicle Registration (OR/CR)', status: 'Approved' }],
    ...overrides,
  };
}

async function expectReviewError(operation: Promise<unknown>, code: string) {
  await expect(operation).rejects.toMatchObject<Partial<AdminListingReviewError>>({ code });
}

describe('authoritative admin listing review lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuditFindMany.mockResolvedValue([]);
  });

  it.each(['Admin', 'Compliance Admin', 'Super Admin'])('allows verified %s review capability', async (role) => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'admin-1', role: 'stale-token-role' } });
    mockUserFindUnique.mockResolvedValue({ id: 'admin-1', role, status: 'Verified' });
    await expect(requireAdminListingReviewer()).resolves.toMatchObject({ id: 'admin-1', role });
  });

  it.each(['Individual Provider', 'Business Provider', 'Renter', 'Finance Admin'])('denies %s review capability', async (role) => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockUserFindUnique.mockResolvedValue({ id: 'user-1', role, status: 'Verified' });
    await expectReviewError(requireAdminListingReviewer(), 'FORBIDDEN');
  });

  it('denies unauthenticated and unverified users', async () => {
    mockGetServerSession.mockResolvedValue(null);
    await expectReviewError(requireAdminListingReviewer(), 'UNAUTHENTICATED');

    mockGetServerSession.mockResolvedValue({ user: { id: 'admin-1' } });
    mockUserFindUnique.mockResolvedValue({ id: 'admin-1', role: 'Super Admin', status: 'Pending' });
    await expectReviewError(requireAdminListingReviewer(), 'FORBIDDEN');
  });

  it('requests only Submitted for Review and Under Review listings for the queue', async () => {
    mockListingFindMany.mockResolvedValue([]);
    await expect(getAdminReviewQueue()).resolves.toEqual([]);
    expect(mockListingFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: { in: ['Submitted for Review', 'Under Review'] } },
    }));
  });

  it('loads listing detail with photos, documents, category requirements, and audit context', async () => {
    mockListingFindUnique.mockResolvedValue(listing());
    mockAuditFindMany.mockResolvedValue([{ id: 'audit-1', action: 'LISTING_SUBMITTED' }]);
    const result = await getAdminListingReviewDetail('listing-1');
    expect(result.listing.photos).toHaveLength(1);
    expect(result.listing.documents).toHaveLength(1);
    expect(result.auditEvents).toHaveLength(1);
    expect(result.documentReadiness.ready).toBe(true);
    const detailQuery = mockListingFindUnique.mock.calls[0][0];
    expect(detailQuery.include.documents.select.file_path).toBeUndefined();
  });

  it('does not treat a Submitted regulated document as verified', () => {
    expect(evaluateRequiredDocumentReadiness({
      riskLevel: 'Regulated',
      requiredProviderDocuments: JSON.stringify(['Vehicle Registration (OR/CR)']),
      documents: [{ document_type: 'Vehicle Registration (OR/CR)', status: 'Submitted' }],
    })).toMatchObject({ ready: false, missingTypes: ['Vehicle Registration (OR/CR)'] });
  });

  it('blocks regulated listing approval until its required document is approved', async () => {
    mockListingFindUnique.mockResolvedValue(listing({
      documents: [{ document_type: 'Vehicle Registration (OR/CR)', status: 'Submitted' }],
    }));
    await expectReviewError(approveListing({ listingId: 'listing-1', reviewerId: 'admin-1' }), 'REQUIRED_DOCUMENTS_NOT_VERIFIED');
    expect(mockListingUpdate).not.toHaveBeenCalled();
  });

  it('approves a document, records reviewer fields, and starts Under Review', async () => {
    mockDocumentFindUnique.mockResolvedValue({
      id: 'document-1',
      document_type: 'Vehicle Registration (OR/CR)',
      status: 'Submitted',
      listing: { id: 'listing-1', title: 'BMW K1600B', status: 'Submitted for Review' },
    });
    mockDocumentUpdate.mockResolvedValue({ id: 'document-1', status: 'Approved' });
    await reviewListingDocument({ documentId: 'document-1', reviewerId: 'admin-1', decision: 'APPROVE' });
    expect(mockDocumentUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'Approved', rejection_reason: null, reviewed_by: 'admin-1', reviewed_at: expect.any(Date) }),
    }));
    expect(mockListingUpdate).toHaveBeenCalledWith({ where: { id: 'listing-1' }, data: { status: 'Under Review' } });
    expect(mockCreateAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'LISTING_DOCUMENT_APPROVED' }));
  });

  it('rejects a document with a required reason and reviewer fields', async () => {
    mockDocumentFindUnique.mockResolvedValue({
      id: 'document-1',
      document_type: 'Vehicle Registration (OR/CR)',
      status: 'Under Review',
      listing: { id: 'listing-1', title: 'BMW K1600B', status: 'Under Review' },
    });
    mockDocumentUpdate.mockResolvedValue({ id: 'document-1', status: 'Rejected' });
    await reviewListingDocument({ documentId: 'document-1', reviewerId: 'admin-1', decision: 'REJECT', reason: 'Unreadable scan' });
    expect(mockDocumentUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'Rejected', rejection_reason: 'Unreadable scan', reviewed_by: 'admin-1' }),
    }));
    await expectReviewError(
      reviewListingDocument({ documentId: 'document-1', reviewerId: 'admin-1', decision: 'REJECT', reason: '  ' }),
      'REJECTION_REASON_REQUIRED',
    );
  });

  it('requires a listing rejection reason and persists it for the provider', async () => {
    await expectReviewError(rejectListing({ listingId: 'listing-1', reviewerId: 'admin-1', reason: '' }), 'REJECTION_REASON_REQUIRED');

    mockListingFindUnique.mockResolvedValue(listing());
    mockListingUpdate.mockResolvedValue({ id: 'listing-1', status: 'Rejected', rejection_reason: 'Registration mismatch' });
    await rejectListing({ listingId: 'listing-1', reviewerId: 'admin-1', reason: 'Registration mismatch' });
    expect(mockListingUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: { status: 'Rejected', rejection_reason: 'Registration mismatch', published_at: null },
    }));
    expect(mockCreateAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'LISTING_REJECTED' }));
  });

  it('approves to Approved without publishing or setting published_at', async () => {
    mockListingFindUnique.mockResolvedValue(listing());
    mockListingUpdate.mockResolvedValue({ id: 'listing-1', status: 'Approved', published_at: null });
    const result = await approveListing({ listingId: 'listing-1', reviewerId: 'admin-1' });
    expect(result.status).toBe('Approved');
    expect(mockListingUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: { status: 'Approved', rejection_reason: null, published_at: null },
    }));
    expect(mockCreateAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'LISTING_APPROVED' }));
  });

  it.each(['Draft', 'Rejected', 'Submitted for Review', 'Under Review', 'Published'])('denies direct publish from %s', async (status) => {
    mockListingFindUnique.mockResolvedValue(listing({ status }));
    await expectReviewError(publishListing({ listingId: 'listing-1', reviewerId: 'admin-1' }), 'LISTING_NOT_APPROVED');
  });

  it('publishes only Approved and sets published_at', async () => {
    mockListingFindUnique.mockResolvedValue(listing({ status: 'Approved' }));
    mockListingUpdate.mockResolvedValue({ id: 'listing-1', status: 'Published', published_at: new Date() });
    const result = await publishListing({ listingId: 'listing-1', reviewerId: 'admin-1' });
    expect(result.status).toBe('Published');
    expect(mockListingUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: { status: 'Published', published_at: expect.any(Date) },
    }));
  });

  it('unpublishes back to Approved and clears published_at', async () => {
    mockListingFindUnique.mockResolvedValue(listing({ status: 'Published' }));
    mockListingUpdate.mockResolvedValue({ id: 'listing-1', status: 'Approved', published_at: null });
    await unpublishListing({ listingId: 'listing-1', reviewerId: 'admin-1' });
    expect(mockListingUpdate).toHaveBeenCalledWith({
      where: { id: 'listing-1' },
      data: { status: 'Approved', published_at: null },
    });
    expect(mockCreateAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'LISTING_UNPUBLISHED' }));
  });
});
