import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/internal/phase8-preview-gate/route';

jest.mock('next/server', () => {
  return {
    NextRequest: jest.fn(),
    NextResponse: {
      json: jest.fn((body, init) => ({ status: init?.status ?? 200, body })),
    },
    connection: jest.fn().mockResolvedValue(undefined),
  };
});

describe('Phase 8 Preview Gate Security', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.VERCEL_ENV = 'preview';
    process.env.VERCEL_GIT_COMMIT_REF = 'feature/phase8-multi-login-session-management';
    process.env.PREVIEW_OAT_PASSWORD = 'test-secret';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  function createRequest(headers: Record<string, string> = {}) {
    return {
      headers: {
        get: (name: string) => headers[name.toLowerCase()] || null,
      },
      nextUrl: {
        searchParams: new URLSearchParams(),
      },
    } as unknown as NextRequest;
  }

  it('is denied outside Preview', async () => {
    process.env.VERCEL_ENV = 'production';
    const req = createRequest({ authorization: 'Bearer test-secret' });
    const res = await GET(req);
    expect(res.status).toBe(404);
    
    const postRes = await POST(req);
    expect(postRes.status).toBe(404);
  });

  it('is denied without correct authorization', async () => {
    const req = createRequest(); // No auth header
    const res = await GET(req);
    expect(res.status).toBe(404);

    const postRes = await POST(req);
    expect(postRes.status).toBe(404);
  });

  it('is denied with incorrect authorization', async () => {
    const req = createRequest({ authorization: 'Bearer wrong-secret' });
    const res = await GET(req);
    expect(res.status).toBe(404);

    const postRes = await POST(req);
    expect(postRes.status).toBe(404);
  });
});
