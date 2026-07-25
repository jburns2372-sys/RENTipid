import { NextRequest } from 'next/server';
import proxy from '../../../src/proxy';
import * as nextAuthJwt from 'next-auth/jwt';

jest.mock('next-auth/jwt');

describe('SOC Analyst Proxy Boundary', () => {
  const mockGetToken = nextAuthJwt.getToken as jest.MockedFunction<typeof nextAuthJwt.getToken>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (pathname: string) => {
    return {
      nextUrl: { pathname },
      url: `http://localhost:3000${pathname}`,
    } as unknown as NextRequest;
  };

  it('1. SOC_ANALYST can access the SOC dashboard route', async () => {
    mockGetToken.mockResolvedValueOnce({ role: 'SOC_ANALYST' });
    const req = createRequest('/dashboard/admin/security');
    const res = await proxy(req);
    // NextResponse.next() returns a response without a Location header for redirect
    expect(res.headers.get('Location')).toBeNull();
  });

  it('2. SOC_ANALYST cannot access unrelated /dashboard/admin pages', async () => {
    mockGetToken.mockResolvedValueOnce({ role: 'SOC_ANALYST' });
    const req = createRequest('/dashboard/admin/users');
    const res = await proxy(req);
    // Since proxy.ts was overbroad in R6, we expect it to redirect to /unauthorized after we fix it
    // Wait, the prompt says "Modify it only when the audit or focused test proves the current R6 proxy logic is overbroad"
    // I am writing the test to EXPECT it to be blocked.
    expect(res.headers.get('Location')).toMatch(/\/unauthorized$/);
  });

  it('3. SOC_ANALYST cannot access Super Admin routes', async () => {
    mockGetToken.mockResolvedValueOnce({ role: 'SOC_ANALYST' });
    const req = createRequest('/dashboard/super-admin/settings');
    const res = await proxy(req);
    expect(res.headers.get('Location')).toMatch(/\/unauthorized$/);
  });

  it('4. Unauthenticated access remains rejected', async () => {
    mockGetToken.mockResolvedValueOnce(null);
    const req = createRequest('/dashboard/admin/security');
    const res = await proxy(req);
    expect(res.headers.get('Location')).toMatch(/\/login\?callbackUrl/);
  });

  it('5. An unrelated ordinary role remains denied', async () => {
    mockGetToken.mockResolvedValueOnce({ role: 'Renter' });
    const req = createRequest('/dashboard/admin/security');
    const res = await proxy(req);
    expect(res.headers.get('Location')).toMatch(/\/unauthorized$/);
  });

  it('6. Super Admin existing behavior remains unchanged', async () => {
    mockGetToken.mockResolvedValueOnce({ role: 'Super Admin' });
    const req = createRequest('/dashboard/admin/security');
    const res = await proxy(req);
    expect(res.headers.get('Location')).toBeNull();
  });
});
