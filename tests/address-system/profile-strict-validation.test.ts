import { AddressTokenService } from '../../src/lib/address/address-token';
import { PATCH } from '../../src/app/api/profile/route';
import { NextRequest } from 'next/server';

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn().mockResolvedValue({ user: { id: 'user_strict', role: 'Individual Provider' } }),
}));

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    userProfile: { findUnique: jest.fn(), update: jest.fn() },
    businessProfile: { findUnique: jest.fn(), update: jest.fn() },
    address: { create: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(),
  }
}));

describe('Profile and Address Strict Validation', () => {
  it('should reject requests with unknown top-level fields', async () => {
    const req = new NextRequest('http://localhost/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        first_name: 'John',
        unknown_field: 'malicious payload' // Should be rejected by strict schema
      })
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Validation Failed');
  });

  it('should reject requests with oversized address fields', async () => {
    const payload = {
      userId: 'user_strict',
      addressLine1: 'A'.repeat(300), // > 255 max
      countryCode: 'US',
      provider: 'google',
      validationStatus: 'VALIDATED',
      manuallyEdited: false,
    };
    const selectionToken = AddressTokenService.generateToken(payload as unknown as import('../../src/lib/address/address-token').AddressSelectionPayload);

    const req = new NextRequest('http://localhost/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        global_address: {
          addressLine1: 'A'.repeat(300),
          countryCode: 'US',
          provider: 'google',
          validationStatus: 'VALIDATED',
          manuallyEdited: false,
          selectionToken
        }
      })
    });
    
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });
  
  it('should reject requests with invalid coordinates', async () => {
    const payload = {
      userId: 'user_strict',
      addressLine1: '123 Test',
      countryCode: 'US',
      latitude: 91, // Invalid > 90
      longitude: -181, // Invalid < -180
      provider: 'google',
      validationStatus: 'VALIDATED',
      manuallyEdited: false,
    };
    const selectionToken = AddressTokenService.generateToken(payload as unknown as import('../../src/lib/address/address-token').AddressSelectionPayload);

    const req = new NextRequest('http://localhost/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        global_address: {
          addressLine1: '123 Test',
          countryCode: 'US',
          latitude: 91,
          longitude: -181,
          provider: 'google',
          validationStatus: 'VALIDATED',
          manuallyEdited: false,
          selectionToken
        }
      })
    });
    
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });
});
