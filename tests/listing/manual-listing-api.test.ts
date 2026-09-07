import { POST as submitListing } from '@/app/api/listings/[id]/submit/route';
import { POST as uploadPhoto } from '@/app/api/listings/[id]/photos/route';
import { POST as uploadDocument } from '@/app/api/listings/[id]/documents/route';
import { GET as viewDocument } from '@/app/api/documents/[id]/route';
import { PATCH as updateListing } from '@/app/api/listings/[id]/route';
import { getServerSession } from 'next-auth/next';

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

jest.mock('@/lib/audit', () => ({
  createAuditLog: jest.fn().mockResolvedValue(true),
}));

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
  });
});
