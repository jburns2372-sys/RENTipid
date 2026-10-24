import { getServerSession } from 'next-auth/next';
import { canCreateListing } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';

jest.mock('@prisma/client', () => {
  const mCreate = jest.fn();
  const mFindUnique = jest.fn();
  const mUpdate = jest.fn();
  const mPhotoCount = jest.fn();
  const mPhotoCreate = jest.fn();
  const mDocCreate = jest.fn();
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      listing: {
        create: mCreate,
        findUnique: mFindUnique,
        update: mUpdate,
      },
      listingPhoto: {
        count: mPhotoCount,
        create: mPhotoCreate,
      },
      listingDocument: {
        create: mDocCreate,
      },
      auditLog: {
        create: jest.fn().mockResolvedValue(true),
      },
    })),
    __mocks: {
      mCreate,
      mFindUnique,
      mUpdate,
      mPhotoCount,
      mPhotoCreate,
      mDocCreate,
    },
  };
});

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

jest.mock('@/lib/audit', () => ({
  createAuditLog: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/storage/storage-service', () => ({
  storageService: {
    uploadPublicFile: jest.fn().mockResolvedValue({ url: 'https://blob.vercel-storage.com/test.jpg' }),
    uploadPrivateFile: jest.fn().mockResolvedValue({ storageKey: 'test-key', url: 'https://blob.vercel-storage.com/test.pdf' }),
  },
}));

import { POST as createListing } from '@/app/api/listings/route';
import { POST as submitListing } from '@/app/api/listings/[id]/submit/route';
import { POST as withdrawListing } from '@/app/api/listings/[id]/withdraw/route';
import { POST as uploadPhoto } from '@/app/api/listings/[id]/photos/route';
import { POST as uploadDocument } from '@/app/api/listings/[id]/documents/route';
import { GET as viewDocument } from '@/app/api/documents/[id]/route';
import { PATCH as updateListing } from '@/app/api/listings/[id]/route';
const { __mocks } = require('@prisma/client');

const {
  mCreate: mockListingCreate,
  mFindUnique: mockListingFindUnique,
  mUpdate: mockListingUpdate,
  mPhotoCount: mockListingPhotoCount,
  mPhotoCreate: mockListingPhotoCreate,
  mDocCreate: mockListingDocCreate,
} = __mocks;


describe('Manual Listing APIs & Security Boundaries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Unauthenticated Guard Checks', () => {
    it('rejects unauthenticated submit requests with 401', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      const req = new Request('http://localhost:3000/api/listings/list-1/submit', { method: 'POST' });
      const res = await submitListing(req, { params: Promise.resolve({ id: 'list-1' }) });
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.message).toBe('Unauthorized');
    });

    it('rejects unauthenticated photo upload with 401', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      const req = new Request('http://localhost:3000/api/listings/list-1/photos', { method: 'POST' });
      const res = await uploadPhoto(req, { params: Promise.resolve({ id: 'list-1' }) });
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.message).toBe('Unauthorized');
    });

    it('rejects unauthenticated document upload with 401', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      const req = new Request('http://localhost:3000/api/listings/list-1/documents', { method: 'POST' });
      const res = await uploadDocument(req, { params: Promise.resolve({ id: 'list-1' }) });
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.message).toBe('Unauthorized');
    });

    it('rejects unauthenticated document viewing with 401', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      const req = new Request('http://localhost:3000/api/documents/doc-1', { method: 'GET' });
      const res = await viewDocument(req, { params: Promise.resolve({ id: 'doc-1' }) });
      expect(res.status).toBe(401);
    });

    it('rejects unauthenticated draft updates with 401', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      const req = new Request('http://localhost:3000/api/listings/list-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Title' }),
      });
      const res = await updateListing(req, { params: Promise.resolve({ id: 'list-1' }) });
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.message).toBe('Unauthorized');
    });

    it('rejects unauthenticated listing creation with 401', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      const req = new Request('http://localhost:3000/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'BMW K1600B' }),
      });
      const res = await createListing(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.message).toBe('Unauthorized');
    });

    it('rejects unauthenticated withdrawal requests with 401', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      const req = new Request('http://localhost:3000/api/listings/list-1/withdraw', { method: 'POST' });
      const res = await withdrawListing(req, { params: Promise.resolve({ id: 'list-1' }) });
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.message).toBe('Unauthorized');
    });
  });

  describe('RBAC Listing Creation & Permissions Matrix', () => {
    it('verifies canCreateListing capability helper strictly conforms to RBAC contract', () => {
      expect(canCreateListing('Individual Provider')).toBe(true);
      expect(canCreateListing('Business Provider')).toBe(true);
      expect(canCreateListing('Super Admin')).toBe(true);
      expect(canCreateListing('Renter')).toBe(false);
      expect(canCreateListing('Admin')).toBe(false);
      expect(canCreateListing('Compliance Admin')).toBe(false);
      expect(canCreateListing('Finance Admin')).toBe(false);
      expect(canCreateListing('Guest')).toBe(false);
      expect(canCreateListing(null)).toBe(false);
      expect(canCreateListing(undefined)).toBe(false);
      expect(canCreateListing({ role: 'Super Admin' })).toBe(true);
      expect(canCreateListing({ role: 'Renter' })).toBe(false);
    });

    it('allows Individual Provider to POST /api/listings and creates draft with correct provider_id', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'prov-user-1', role: 'Individual Provider', status: 'Verified' },
      });
      mockListingCreate.mockResolvedValue({ id: 'list-prov-1', title: 'Provider Item', status: 'Draft' });

      const req = new Request('http://localhost:3000/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Provider Item',
          category_id: 'cat-1',
          location: '12 Sibad',
          daily_rate: '1500',
        }),
      });

      const res = await createListing(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.id).toBe('list-prov-1');
      expect(mockListingCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            provider_id: 'prov-user-1',
            status: 'Draft',
            title: 'Provider Item',
          }),
        })
      );
    });

    it('allows Super Admin to POST /api/listings and creates draft with correct provider_id', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'super-admin-1', role: 'Super Admin', status: 'Verified' },
      });
      mockListingCreate.mockResolvedValue({ id: 'list-super-1', title: 'BMW K1600B', status: 'Draft' });

      const req = new Request('http://localhost:3000/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'BMW K1600B',
          category_id: 'cat-motorcycles',
          location: '12 SIBAD, QUEZON CITY',
          daily_rate: '8000',
          security_deposit: '10000',
        }),
      });

      const res = await createListing(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.id).toBe('list-super-1');
      expect(mockListingCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            provider_id: 'super-admin-1',
            status: 'Draft',
            title: 'BMW K1600B',
          }),
        })
      );
    });

    it('denies Renter from POST /api/listings with 403', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'renter-user-1', role: 'Renter', status: 'Verified' },
      });

      const req = new Request('http://localhost:3000/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Renter Attempt' }),
      });

      const res = await createListing(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.message).toBe('Only providers can create listings');
      expect(mockListingCreate).not.toHaveBeenCalled();
    });

    it('denies unverified provider from POST /api/listings with 403', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'prov-unverified', role: 'Individual Provider', status: 'Pending' },
      });

      const req = new Request('http://localhost:3000/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Unverified Attempt' }),
      });

      const res = await createListing(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.message).toBe('You must be verified to create a listing');
      expect(mockListingCreate).not.toHaveBeenCalled();
    });
  });

  describe('Listing Lifecycle & Super Admin Ownership Authorization', () => {
    it('allows Super Admin to edit its own Draft', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'super-admin-1', role: 'Super Admin', status: 'Verified' },
      });
      mockListingFindUnique.mockResolvedValue({
        id: 'list-super-1',
        provider_id: 'super-admin-1',
        status: 'Draft',
      });
      mockListingUpdate.mockResolvedValue({
        id: 'list-super-1',
        title: 'Updated BMW K1600B',
      });

      const req = new Request('http://localhost:3000/api/listings/list-super-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated BMW K1600B' }),
      });

      const res = await updateListing(req, { params: Promise.resolve({ id: 'list-super-1' }) });
      expect(res.status).toBe(200);
      expect(mockListingUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'list-super-1' },
          data: expect.objectContaining({ title: 'Updated BMW K1600B' }),
        })
      );
    });

    it('denies another user from editing the Super Admin Draft', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'other-user-2', role: 'Individual Provider', status: 'Verified' },
      });
      mockListingFindUnique.mockResolvedValue({
        id: 'list-super-1',
        provider_id: 'super-admin-1',
        status: 'Draft',
      });

      const req = new Request('http://localhost:3000/api/listings/list-super-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Hacked Title' }),
      });

      const res = await updateListing(req, { params: Promise.resolve({ id: 'list-super-1' }) });
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.message).toBe('Forbidden');
      expect(mockListingUpdate).not.toHaveBeenCalled();
    });

    it('allows Super Admin to upload a photo to its Draft', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'super-admin-1', role: 'Super Admin', status: 'Verified' },
      });
      mockListingFindUnique.mockResolvedValue({
        id: 'list-super-1',
        provider_id: 'super-admin-1',
        status: 'Draft',
      });
      mockListingPhotoCount.mockResolvedValue(0);
      mockListingPhotoCreate.mockResolvedValue({
        id: 'photo-1',
        listing_id: 'list-super-1',
        photo_url: 'https://blob.vercel-storage.com/test.jpg',
      });

      const formData = new FormData();
      const fakeBlob = new Blob(['photo-bytes'], { type: 'image/jpeg' });
      formData.append('file', fakeBlob, 'bmw.jpg');

      const req = new Request('http://localhost:3000/api/listings/list-super-1/photos', {
        method: 'POST',
        body: formData,
      });

      const res = await uploadPhoto(req, { params: Promise.resolve({ id: 'list-super-1' }) });
      expect(res.status).toBe(201);
      expect(mockListingPhotoCreate).toHaveBeenCalled();
    });

    it('denies direct photo changes while listing is Submitted for Review', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'prov-user-1', role: 'Individual Provider', status: 'Verified' },
      });
      mockListingFindUnique.mockResolvedValue({
        id: 'list-bmw-1',
        provider_id: 'prov-user-1',
        status: 'Submitted for Review',
      });

      const formData = new FormData();
      const fakeBlob = new Blob(['photo-bytes'], { type: 'image/jpeg' });
      formData.append('file', fakeBlob, 'bmw.jpg');

      const req = new Request('http://localhost:3000/api/listings/list-bmw-1/photos', {
        method: 'POST',
        body: formData,
      });

      const res = await uploadPhoto(req, { params: Promise.resolve({ id: 'list-bmw-1' }) });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.message).toBe('Withdraw the listing before changing photos');
      expect(mockListingPhotoCreate).not.toHaveBeenCalled();
    });

    it('allows Super Admin to upload required document to its Draft', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'super-admin-1', role: 'Super Admin', status: 'Verified' },
      });
      mockListingFindUnique.mockResolvedValue({
        id: 'list-super-1',
        provider_id: 'super-admin-1',
        status: 'Draft',
      });
      mockListingDocCreate.mockResolvedValue({
        id: 'doc-1',
        listing_id: 'list-super-1',
        document_url: 'https://blob.vercel-storage.com/test.jpg',
      });

      const formData = new FormData();
      const fakeBlob = new Blob(['doc-bytes'], { type: 'application/pdf' });
      formData.append('file', fakeBlob, 'or-cr.pdf');
      formData.append('document_type', 'OR_CR');

      const req = new Request('http://localhost:3000/api/listings/list-super-1/documents', {
        method: 'POST',
        body: formData,
      });

      const res = await uploadDocument(req, { params: Promise.resolve({ id: 'list-super-1' }) });
      expect(res.status).toBe(201);
      expect(mockListingDocCreate).toHaveBeenCalled();
    });

    it('denies direct document changes while listing is Submitted for Review', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'prov-user-1', role: 'Individual Provider', status: 'Verified' },
      });
      mockListingFindUnique.mockResolvedValue({
        id: 'list-bmw-1',
        provider_id: 'prov-user-1',
        status: 'Submitted for Review',
      });

      const formData = new FormData();
      const fakeBlob = new Blob(['doc-bytes'], { type: 'application/pdf' });
      formData.append('file', fakeBlob, 'or-cr.pdf');
      formData.append('document_type', 'Vehicle Registration (OR/CR)');

      const req = new Request('http://localhost:3000/api/listings/list-bmw-1/documents', {
        method: 'POST',
        body: formData,
      });

      const res = await uploadDocument(req, { params: Promise.resolve({ id: 'list-bmw-1' }) });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.message).toBe('Withdraw the listing before changing documents');
      expect(mockListingDocCreate).not.toHaveBeenCalled();
    });

    it('allows Super Admin to submit its Draft for review with NO auto-publication', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'super-admin-1', role: 'Super Admin', status: 'Verified' },
      });
      mockListingFindUnique.mockResolvedValue({
        id: 'list-super-1',
        provider_id: 'super-admin-1',
        status: 'Draft',
        category: { requirements: [] },
        photos: [{ id: 'photo-1' }],
        documents: [],
      });
      mockListingUpdate.mockResolvedValue({
        id: 'list-super-1',
        status: 'Submitted for Review',
      });

      const req = new Request('http://localhost:3000/api/listings/list-super-1/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await submitListing(req, { params: Promise.resolve({ id: 'list-super-1' }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe('Submitted for Review');
      // Crucial: Must be Submitted for Review, NEVER auto-published or Active
      expect(json.status).not.toBe('Published');
      expect(json.status).not.toBe('Active');
      expect(mockListingUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'list-super-1' },
          data: expect.objectContaining({
            status: 'Submitted for Review',
            rejection_reason: null,
            published_at: null,
          }),
        })
      );
    });

    it('allows owner to save detail changes after withdrawal returns listing to Draft', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'prov-user-1', role: 'Individual Provider', status: 'Verified' },
      });
      mockListingFindUnique.mockResolvedValue({
        id: 'list-bmw-1',
        provider_id: 'prov-user-1',
        status: 'Draft',
      });
      mockListingUpdate.mockResolvedValue({
        id: 'list-bmw-1',
        title: 'Updated BMW K1600B',
        description: 'Updated description',
        daily_rate: 8500,
        security_deposit: 12000,
        location: 'Updated pickup location',
        city: 'Quezon City',
        province: 'Metro Manila',
        country: 'Philippines',
      });

      const req = new Request('http://localhost:3000/api/listings/list-bmw-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Updated BMW K1600B',
          description: 'Updated description',
          daily_rate: '8500',
          security_deposit: '12000',
          location: 'Updated pickup location',
          city: 'Quezon City',
          province: 'Metro Manila',
          country: 'Philippines',
        }),
      });

      const res = await updateListing(req, { params: Promise.resolve({ id: 'list-bmw-1' }) });
      expect(res.status).toBe(200);
      expect(mockListingUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'list-bmw-1' },
          data: expect.objectContaining({
            title: 'Updated BMW K1600B',
            description: 'Updated description',
            daily_rate: 8500,
            security_deposit: 12000,
            location: 'Updated pickup location',
            city: 'Quezon City',
            province: 'Metro Manila',
            country: 'Philippines',
          }),
        })
      );
    });

    it('allows owner to withdraw Submitted for Review back to Draft without deleting listing assets or details', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'prov-user-1', role: 'Individual Provider', status: 'Verified' },
      });
      mockListingFindUnique.mockResolvedValue({
        id: 'list-bmw-1',
        provider_id: 'prov-user-1',
        title: 'BMW K1600B',
        description: 'Touring motorcycle',
        category_id: 'cat-cars-motorcycles',
        location: '12 Sibad',
        city: 'Quezon City',
        province: 'Metro Manila',
        daily_rate: 8000,
        status: 'Submitted for Review',
        photos: [
          { id: 'photo-1', file_path: 'https://blob.vercel-storage.com/bmw-1.jpg' },
          { id: 'photo-2', file_path: 'https://blob.vercel-storage.com/bmw-2.jpg' },
        ],
        documents: [
          { id: 'doc-1', document_type: 'Vehicle Registration (OR/CR)' },
        ],
      });
      mockListingUpdate.mockResolvedValue({
        id: 'list-bmw-1',
        status: 'Draft',
      });

      const req = new Request('http://localhost:3000/api/listings/list-bmw-1/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await withdrawListing(req, { params: Promise.resolve({ id: 'list-bmw-1' }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe('Draft');
      expect(json.status).not.toBe('Published');
      expect(json.preserved).toEqual({ photos: 2, documents: 1 });
      expect(mockListingUpdate).toHaveBeenCalledWith({
        where: { id: 'list-bmw-1' },
        data: { status: 'Draft' },
      });
      expect(createAuditLog).toHaveBeenCalledWith({
        actor_user_id: 'prov-user-1',
        action: 'LISTING_WITHDRAWN',
        module: 'Listings',
        target_id: 'list-bmw-1',
        details: expect.stringContaining('Submitted for Review to Draft'),
      });
    });

    it('allows Super Admin to withdraw its own Submitted for Review listing under ownership rules', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'super-admin-1', role: 'Super Admin', status: 'Verified' },
      });
      mockListingFindUnique.mockResolvedValue({
        id: 'list-super-1',
        provider_id: 'super-admin-1',
        title: 'BMW K1600B',
        status: 'Submitted for Review',
        photos: [{ id: 'photo-1' }],
        documents: [{ id: 'doc-1' }],
      });
      mockListingUpdate.mockResolvedValue({
        id: 'list-super-1',
        status: 'Draft',
      });

      const req = new Request('http://localhost:3000/api/listings/list-super-1/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await withdrawListing(req, { params: Promise.resolve({ id: 'list-super-1' }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe('Draft');
    });

    it('denies another user from withdrawing an owned listing submission', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'other-user-2', role: 'Individual Provider', status: 'Verified' },
      });
      mockListingFindUnique.mockResolvedValue({
        id: 'list-bmw-1',
        provider_id: 'prov-user-1',
        title: 'BMW K1600B',
        status: 'Submitted for Review',
        photos: [{ id: 'photo-1' }],
        documents: [{ id: 'doc-1' }],
      });

      const req = new Request('http://localhost:3000/api/listings/list-bmw-1/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await withdrawListing(req, { params: Promise.resolve({ id: 'list-bmw-1' }) });
      expect(res.status).toBe(403);
      expect(mockListingUpdate).not.toHaveBeenCalled();
    });

    it('denies Renter from withdrawing even if the listing id matches', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'renter-user-1', role: 'Renter', status: 'Verified' },
      });

      const req = new Request('http://localhost:3000/api/listings/list-renter-1/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await withdrawListing(req, { params: Promise.resolve({ id: 'list-renter-1' }) });
      expect(res.status).toBe(403);
      expect(mockListingFindUnique).not.toHaveBeenCalled();
      expect(mockListingUpdate).not.toHaveBeenCalled();
    });

    it.each(['Under Review', 'Published', 'Draft', 'Rejected'])('denies withdrawal while listing is %s', async status => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'prov-user-1', role: 'Individual Provider', status: 'Verified' },
      });
      mockListingFindUnique.mockResolvedValue({
        id: 'list-bmw-1',
        provider_id: 'prov-user-1',
        title: 'BMW K1600B',
        status,
        photos: [{ id: 'photo-1' }],
        documents: [{ id: 'doc-1' }],
      });

      const req = new Request('http://localhost:3000/api/listings/list-bmw-1/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await withdrawListing(req, { params: Promise.resolve({ id: 'list-bmw-1' }) });
      expect(res.status).toBe(400);
      expect(mockListingUpdate).not.toHaveBeenCalled();
    });

    it('allows resubmission after withdrawal returns the listing to Draft with NO auto-publication', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'prov-user-1', role: 'Individual Provider', status: 'Verified' },
      });
      mockListingFindUnique.mockResolvedValue({
        id: 'list-bmw-1',
        provider_id: 'prov-user-1',
        status: 'Draft',
        title: 'Updated BMW K1600B',
        category: { requirements: [], risk_level: 'Regulated' },
        photos: [{ id: 'photo-1' }, { id: 'photo-2' }],
        documents: [{ id: 'doc-1' }],
      });
      mockListingUpdate.mockResolvedValue({
        id: 'list-bmw-1',
        status: 'Submitted for Review',
      });

      const req = new Request('http://localhost:3000/api/listings/list-bmw-1/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await submitListing(req, { params: Promise.resolve({ id: 'list-bmw-1' }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe('Submitted for Review');
      expect(json.status).not.toBe('Published');
    });
  });
});
