import { NextRequest } from 'next/server';
import proxy from '../../../src/proxy';
import * as nextAuthJwt from 'next-auth/jwt';

jest.mock('next-auth/jwt');

describe('SOC Analyst Proxy Boundary', () => {
  const mockGetToken = nextAuthJwt.getToken as jest.MockedFunction<typeof nextAuthJwt.getToken>;
  const originalSecret = process.env.NEXTAUTH_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXTAUTH_SECRET = originalSecret || 'test-only-nextauth-secret-32-characters';
  });

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.NEXTAUTH_SECRET;
    else process.env.NEXTAUTH_SECRET = originalSecret;
  });

  const createRequest = (pathname: string) => {
    return {
      nextUrl: { pathname },
      url: `http://localhost:3000${pathname}`,
    } as unknown as NextRequest;
  };

  it('1. SOC_ANALYST can access the SOC dashboard route', async () => {
    mockGetToken.mockResolvedValueOnce({ role: 'SOC_ANALYST', status: 'Verified' });
    const req = createRequest('/dashboard/admin/security');
    const res = await proxy(req);
    // NextResponse.next() returns a response without a Location header for redirect
    expect(res.headers.get('Location')).toBeNull();
  });

  it('2. SOC_ANALYST cannot access unrelated /dashboard/admin pages', async () => {
    mockGetToken.mockResolvedValueOnce({ role: 'SOC_ANALYST', status: 'Verified' });
    const req = createRequest('/dashboard/admin/users');
    const res = await proxy(req);
    // Since proxy.ts was overbroad in R6, we expect it to redirect to /unauthorized after we fix it
    // Wait, the prompt says "Modify it only when the audit or focused test proves the current R6 proxy logic is overbroad"
    // I am writing the test to EXPECT it to be blocked.
    expect(res.headers.get('Location')).toMatch(/\/unauthorized$/);
  });

  it('3. SOC_ANALYST cannot access Super Admin routes', async () => {
    mockGetToken.mockResolvedValueOnce({ role: 'SOC_ANALYST', status: 'Verified' });
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
    mockGetToken.mockResolvedValueOnce({ role: 'Renter', status: 'Verified' });
    const req = createRequest('/dashboard/admin/security');
    const res = await proxy(req);
    expect(res.headers.get('Location')).toMatch(/\/unauthorized$/);
  });

  it('6. Super Admin existing behavior remains unchanged', async () => {
    mockGetToken.mockResolvedValueOnce({ role: 'Super Admin', status: 'Verified' });
    const req = createRequest('/dashboard/admin/security');
    const res = await proxy(req);
    expect(res.headers.get('Location')).toBeNull();
  });

  it('7. fails closed when NEXTAUTH_SECRET is absent', async () => {
    delete process.env.NEXTAUTH_SECRET;
    const res = await proxy(createRequest('/dashboard'));
    expect(res.status).toBe(503);
    expect(mockGetToken).not.toHaveBeenCalled();
  });

  it.each(['Suspended', 'Blacklisted'])('8. %s account is denied', async (status) => {
    mockGetToken.mockResolvedValueOnce({ role: 'Renter', status });
    const res = await proxy(createRequest('/dashboard/renter'));
    expect(res.headers.get('Location')).toMatch(/\/unauthorized$/);
  });

  it('9. pending renter can reach onboarding but not bookings', async () => {
    mockGetToken.mockResolvedValueOnce({ role: 'Renter', status: 'Pending' });
    const onboarding = await proxy(createRequest('/dashboard/renter/onboarding-checklist'));
    expect(onboarding.headers.get('Location')).toBeNull();

    mockGetToken.mockResolvedValueOnce({ role: 'Renter', status: 'Pending' });
    const bookings = await proxy(createRequest('/dashboard/renter/bookings'));
    expect(bookings.headers.get('Location')).toMatch(/\/dashboard\/profile$/);
  });

  it('10. pending privileged account is denied', async () => {
    mockGetToken.mockResolvedValueOnce({ role: 'Admin', status: 'Pending' });
    const res = await proxy(createRequest('/dashboard/admin'));
    expect(res.headers.get('Location')).toMatch(/\/unauthorized$/);
  });

  it('11. malformed token without status is denied', async () => {
    mockGetToken.mockResolvedValueOnce({ role: 'Admin' });
    const res = await proxy(createRequest('/dashboard/admin'));
    expect(res.headers.get('Location')).toMatch(/\/unauthorized$/);
  });
});
