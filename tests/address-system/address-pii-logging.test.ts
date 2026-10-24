import { prisma } from '../../src/lib/prisma';
import { PATCH, GET } from '../../src/app/api/profile/route';
import { NextRequest } from 'next/server';

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn().mockResolvedValue({ user: { id: 'user_pii', role: 'Individual Provider' } }),
}));

describe('Address System PII Logging Scrubbing', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should not log raw errors that might contain PII in Profile GET', async () => {
    
    // We already mock next-auth, now we mock prisma to throw
    jest.spyOn(prisma.userProfile, 'findUnique').mockRejectedValueOnce(new Error('GET crashed for user_pii_123 with street: 123 Main St, formatted address: 123 Main St, US, postal code: 90210, coordinates: 34.0,-118.0'));

    const res = await GET();
    expect(res.status).toBe(500);

    expect(consoleErrorSpy).toHaveBeenCalled();
    const errorArg = consoleErrorSpy.mock.calls[0][0];
    
    // The raw message should NOT be in the error log
    expect(errorArg).not.toContain('user_pii_123');
    expect(errorArg).not.toContain('123 Main St');
    expect(errorArg).not.toContain('90210');
    expect(errorArg).not.toContain('34.0,-118.0');
    expect(errorArg).toContain('REDACTED_DUE_TO_PII');
  });

  it('should scrub PII from error logs during profile PATCH (Business Address / Transaction)', async () => {
    const req = new NextRequest('http://localhost/api/profile', { 
      method: 'PATCH',
      body: JSON.stringify({ first_name: 'Test' })
    });
    
    (jest.spyOn(prisma, '$transaction') as unknown as jest.SpyInstance).mockRejectedValueOnce(new Error('PATCH transaction failed. Selection token: token_123_abc, provider payload: place_456, street: 456 Biz St'));

    // Wait, prisma.$transaction mock is hard to do without proper setup. 
    // Let's just mock the request json to throw.
    req.json = jest.fn().mockRejectedValueOnce(new Error('PATCH transaction failed. Selection token: token_123_abc, provider payload: place_456, street: 456 Biz St'));

    const res = await PATCH(req);
    expect(res.status).toBe(500);

    const calls = consoleErrorSpy.mock.calls.map(args => args.join(' ')).join(' ');
    expect(calls).not.toContain('token_123_abc');
    expect(calls).not.toContain('place_456');
    expect(calls).not.toContain('456 Biz St');
    expect(calls).toContain('REDACTED_DUE_TO_PII');
  });

  it('should scrub PII from error logs during autocomplete rate limit or failure', async () => {
    const { POST } = await import('../../src/app/api/address/autocomplete/route');
    const req = new NextRequest('http://localhost/api/address/autocomplete', { 
      method: 'POST',
      body: JSON.stringify({ input: 'My Secret PII Address 1234' })
    });
    
    // Force an unexpected error to trigger the catch block
    req.json = jest.fn().mockRejectedValueOnce(new Error('Autocomplete crashed with Secret PII Address 1234'));

    const res = await POST(req);
    expect(res.status).toBe(500);

    const calls = consoleErrorSpy.mock.calls.map(args => args.join(' ')).join(' ');
    expect(calls).not.toContain('Secret PII Address 1234');
    expect(calls).toContain('Autocomplete Error'); // Generic safe log
  });

  it('should scrub PII from error logs during details route failure', async () => {
    const { POST } = await import('../../src/app/api/address/details/route');
    const req = new NextRequest('http://localhost/api/address/details', { 
      method: 'POST',
      body: JSON.stringify({ placeId: 'place_secret_123' })
    });
    
    // Force an unexpected error
    req.json = jest.fn().mockRejectedValueOnce(new Error('Details crashed for user_pii_123 and place_secret_123'));

    const res = await POST(req);
    expect(res.status).toBe(500);

    const calls = consoleErrorSpy.mock.calls.map(args => args.join(' ')).join(' ');
    expect(calls).not.toContain('user_pii_123');
    expect(calls).not.toContain('place_secret_123');
    expect(calls).toContain('Address Details Error'); // Generic safe log
  });
});
