import { AddressTokenService } from '../../src/lib/address/address-token';
import { PrismaClient } from '@prisma/client';
import { PATCH } from '../../src/app/api/profile/route';
import { NextRequest } from 'next/server';
import { AddressService } from '../../src/lib/address/AddressService';

const prisma = new PrismaClient();

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));
import { getServerSession } from 'next-auth/next';

describe('Address System Token Authority', () => {
  let userId: string;

  beforeAll(async () => {
    process.env.ENCRYPTION_KEY = '12345678901234567890123456789012';
    
    await prisma.userProfile.deleteMany({ where: { user_id: 'user_token_auth' } });
    await prisma.user.deleteMany({ where: { id: 'user_token_auth' } });

    const user = await prisma.user.create({
      data: {
        id: 'user_token_auth',
        email: 'tokenauth@example.com',
        full_name: 'Token Auth',
        account_type: 'Individual',
        password_hash: 'hash',
        role: 'Individual Provider',
        status: 'Active',
      }
    });
    userId = user.id;

    await prisma.userProfile.create({ data: { user_id: userId, verification_status: 'Unverified' } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  const validBasePayload = {
    userId: 'user_token_auth',
    addressLine1: '123 Main',
    addressLine2: null,
    sublocality: null,
    locality: 'City',
    administrativeArea2: null,
    administrativeArea1: 'State',
    postalCode: '10001',
    countryCode: 'US',
    formattedAddress: '123 Main, City, State 10001, US',
    latitude: 40.0,
    longitude: -70.0,
    provider: 'google' as const,
    providerPlaceId: 'place_123',
    validationStatus: 'VALIDATED' as const,
    validationLevel: 'PREMISE',
    manuallyEdited: false,
    validatedAt: null,
  };

  const tamperCases = [
    { field: 'addressLine1', val: 'Tampered Street' },
    { field: 'addressLine2', val: 'Apt Hacked' },
    { field: 'postalCode', val: '99999' },
    { field: 'countryCode', val: 'GB' },
    { field: 'latitude', val: 0 },
    { field: 'longitude', val: 0 },
    { field: 'providerPlaceId', val: 'place_tampered' },
    { field: 'validationStatus', val: 'UNVERIFIED' },
  ];

  tamperCases.forEach(({ field, val }) => {
    it(`should persist canonical token value even if browser ${field} is tampered`, async () => {
      (getServerSession as jest.Mock).mockResolvedValue({ user: { id: userId, role: 'Individual Provider' } });
      
      const token = AddressTokenService.generateToken(validBasePayload);
      
      // Construct altered browser payload
      const tamperedAddress = {
        ...validBasePayload,
        [field]: val,
        selectionToken: token
      };
      
      // Remove userId from payload as it's not strictly part of addressSchema
      const { userId: _userId, ...rest } = tamperedAddress;
      void _userId;

      const req = new NextRequest('http://localhost/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          global_address: rest
        })
      });

      const res = await PATCH(req);
      expect(res.status).toBe(200);

      // Verify DB contains signed token value, not browser value
      const profile = await prisma.userProfile.findUnique({ where: { user_id: userId }, include: { global_address: true } });
      const normalized = AddressService.readNormalizedAddress(profile?.global_address ?? null);
      
      expect(normalized).not.toBeNull();
      // It should strictly equal the signed token's value!
      expect(normalized![field as keyof typeof normalized]).toEqual((validBasePayload as Record<string, unknown>)[field]);

      // Direct DB assertions
      if (field === 'provider') expect(profile?.global_address?.provider).toBe('google');
      if (field === 'validationStatus') expect(profile?.global_address?.validationStatus).toBe('VALIDATED');
    });
  });

  it('should reject a token issued to a different user (wrong-user)', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: userId, role: 'Individual Provider' } });
    
    // Signed for hacker
    const hackerPayload = { ...validBasePayload, userId: 'user_hacker' };
    const token = AddressTokenService.generateToken(hackerPayload);
    
    const { userId: _userId, ...rest } = hackerPayload;
    void _userId;

    const req = new NextRequest('http://localhost/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        global_address: { ...rest, selectionToken: token }
      })
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);

    const profile = await prisma.userProfile.findUnique({ where: { user_id: userId }, include: { global_address: true } });
    const normalized = AddressService.readNormalizedAddress(profile?.global_address ?? null);
    
    expect(normalized?.provider).toBe('MANUAL');
    expect(normalized?.validationStatus).toBe('UNVERIFIED');
    expect(profile?.global_address?.provider).toBe('MANUAL');
    expect(profile?.global_address?.validationStatus).toBe('UNVERIFIED');
  });

  it('should downgrade if token is expired', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: userId, role: 'Individual Provider' } });
    
    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now);
    
    const token = AddressTokenService.generateToken(validBasePayload);
    
    jest.spyOn(Date, 'now').mockReturnValue(now + 1000000); // 16 mins
    
    const { userId: _userId, ...rest } = validBasePayload;
    void _userId;

    const req = new NextRequest('http://localhost/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        global_address: { ...rest, selectionToken: token }
      })
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);

    const profile = await prisma.userProfile.findUnique({ where: { user_id: userId }, include: { global_address: true } });
    const normalized = AddressService.readNormalizedAddress(profile?.global_address ?? null);
    
    expect(normalized?.provider).toBe('MANUAL');
    expect(normalized?.validationStatus).toBe('UNVERIFIED');
    expect(profile?.global_address?.provider).toBe('MANUAL');
    expect(profile?.global_address?.validationStatus).toBe('UNVERIFIED');
    
    jest.restoreAllMocks();
  });

  it('should downgrade manual requests claiming GOOGLE independently', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: userId, role: 'Individual Provider' } });
    
    const { userId: _userId, ...rest } = validBasePayload;
    void _userId;

    const req = new NextRequest('http://localhost/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        global_address: { 
          ...rest, 
          provider: 'google', 
          validationStatus: 'UNVERIFIED',
          selectionToken: undefined 
        }
      })
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);

    const profile = await prisma.userProfile.findUnique({ where: { user_id: userId }, include: { global_address: true } });
    
    expect(profile?.global_address?.provider).toBe('MANUAL');
    expect(profile?.global_address?.validationStatus).toBe('UNVERIFIED');
  });

  it('should downgrade manual requests claiming VALIDATED independently', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: userId, role: 'Individual Provider' } });
    
    const { userId: _userId, ...rest } = validBasePayload;
    void _userId;

    const req = new NextRequest('http://localhost/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        global_address: { 
          ...rest, 
          provider: 'MANUAL', 
          validationStatus: 'VALIDATED',
          selectionToken: undefined 
        }
      })
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);

    const profile = await prisma.userProfile.findUnique({ where: { user_id: userId }, include: { global_address: true } });
    
    expect(profile?.global_address?.provider).toBe('MANUAL');
    expect(profile?.global_address?.validationStatus).toBe('UNVERIFIED');
  });

  it('should downgrade if token is corrupt (malformed JWT-like string)', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: userId, role: 'Individual Provider' } });
    
    const { userId: _userId, ...rest } = validBasePayload;
    void _userId;

    const req = new NextRequest('http://localhost/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        global_address: { 
          ...rest, 
          provider: 'google', 
          validationStatus: 'VALIDATED',
          selectionToken: 'header.garbagepayload.signature' 
        }
      })
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);

    const profile = await prisma.userProfile.findUnique({ where: { user_id: userId }, include: { global_address: true } });
    
    expect(profile?.global_address?.provider).toBe('MANUAL');
    expect(profile?.global_address?.validationStatus).toBe('UNVERIFIED');
  });
});
