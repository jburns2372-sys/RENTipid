import { AddressTokenService } from '../../src/lib/address/address-token';
import { PATCH } from '../../src/app/api/profile/route';
import { NextRequest } from 'next/server';

import { prisma } from '../../src/lib/prisma';

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));
import { getServerSession } from 'next-auth/next';

describe('Address Transaction & Dual-Write Behavior', () => {
  let userTxId: string;

  beforeAll(async () => {
    process.env.ENCRYPTION_KEY = '12345678901234567890123456789012';
    
    await prisma.businessProfile.deleteMany({ where: { user_id: 'user_tx' } });
    await prisma.userProfile.deleteMany({ where: { user_id: 'user_tx' } });
    await prisma.user.deleteMany({ where: { id: 'user_tx' } });

    const user = await prisma.user.create({
      data: {
        id: 'user_tx',
        email: 'usertx@example.com',
        full_name: 'User TX',
        account_type: 'Individual',
        password_hash: 'hash',
        role: 'Individual Provider',
        status: 'Active',
      }
    });
    userTxId = user.id;

    await prisma.userProfile.create({ data: { user_id: userTxId, verification_status: 'Unverified' } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should dual-write legacy fields (city, province, country) along with the canonical address', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({ user: { id: userTxId, role: 'Individual Provider' } });
    
    const tokenPayload = {
      userId: userTxId,
      addressLine1: 'Tx Street',
      addressLine2: null,
      sublocality: null,
      locality: 'Tx City',
      administrativeArea2: null,
      administrativeArea1: 'Tx Province',
      postalCode: '3000',
      countryCode: 'PH',
      formattedAddress: 'Tx Street, Tx City',
      latitude: 14.5,
      longitude: 121.5,
      provider: 'google' as const,
      providerPlaceId: 'place_tx',
      validationStatus: 'VALIDATED' as const,
      validationLevel: null,
      manuallyEdited: false,
      validatedAt: null,
      expiresAt: Date.now() + 100000,
    };
    
    const token = AddressTokenService.generateToken(tokenPayload);

    const req = new NextRequest('http://localhost/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        global_address: {
          addressLine1: tokenPayload.addressLine1,
          addressLine2: tokenPayload.addressLine2,
          sublocality: tokenPayload.sublocality,
          locality: tokenPayload.locality,
          administrativeArea2: tokenPayload.administrativeArea2,
          administrativeArea1: tokenPayload.administrativeArea1,
          postalCode: tokenPayload.postalCode,
          countryCode: tokenPayload.countryCode,
          formattedAddress: tokenPayload.formattedAddress,
          latitude: tokenPayload.latitude,
          longitude: tokenPayload.longitude,
          provider: tokenPayload.provider,
          providerPlaceId: tokenPayload.providerPlaceId,
          validationStatus: tokenPayload.validationStatus,
          validationLevel: tokenPayload.validationLevel,
          manuallyEdited: tokenPayload.manuallyEdited,
          selectionToken: token,
        }
      })
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);

    const profile = await prisma.userProfile.findUnique({ where: { user_id: userTxId }, include: { global_address: true } });
    expect(profile?.global_address_id).not.toBeNull();
    
    // Check dual-writes
    expect(profile?.city).toBe('Tx City');
    expect(profile?.province).toBe('Tx Province');
    expect(profile?.country).toBe('Philippines');
  });

  it('should roll back both address creation and userProfile update if an error occurs in the transaction', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({ user: { id: userTxId, role: 'Individual Provider' } });
    
    const currentProfile = await prisma.userProfile.findUnique({ where: { user_id: userTxId } });
    const currentAddressId = currentProfile?.global_address_id;

    const tokenPayload = {
      userId: userTxId,
      addressLine1: 'Fail Street',
      addressLine2: null,
      sublocality: null,
      locality: 'Fail City',
      administrativeArea2: null,
      administrativeArea1: 'Fail Province',
      postalCode: '9999',
      countryCode: 'US', // Using US this time
      formattedAddress: 'Fail Street, US',
      latitude: 0,
      longitude: 0,
      provider: 'google' as const,
      providerPlaceId: 'place_fail',
      validationStatus: 'VALIDATED' as const,
      validationLevel: null,
      manuallyEdited: false,
      validatedAt: null,
      expiresAt: Date.now() + 100000,
    };
    
    const token = AddressTokenService.generateToken(tokenPayload);

    // Force a real PostgreSQL failure inside the transaction without mocking Prisma
    await prisma.$executeRaw`ALTER TABLE "UserProfile" ADD CONSTRAINT "simulated_fail" CHECK ("city" != 'Fail City')`;

    const req = new NextRequest('http://localhost/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        global_address: {
          addressLine1: tokenPayload.addressLine1,
          addressLine2: tokenPayload.addressLine2,
          sublocality: tokenPayload.sublocality,
          locality: tokenPayload.locality,
          administrativeArea2: tokenPayload.administrativeArea2,
          administrativeArea1: tokenPayload.administrativeArea1,
          postalCode: tokenPayload.postalCode,
          countryCode: tokenPayload.countryCode,
          formattedAddress: tokenPayload.formattedAddress,
          latitude: tokenPayload.latitude,
          longitude: tokenPayload.longitude,
          provider: tokenPayload.provider,
          providerPlaceId: tokenPayload.providerPlaceId,
          validationStatus: tokenPayload.validationStatus,
          validationLevel: tokenPayload.validationLevel,
          manuallyEdited: tokenPayload.manuallyEdited,
          selectionToken: token,
        }
      })
    });

    const res = await PATCH(req);
    expect(res.status).toBe(500);

    // Restore real DB state
    await prisma.$executeRaw`ALTER TABLE "UserProfile" DROP CONSTRAINT IF EXISTS "simulated_fail"`;

    // Verify rollback
    const profileAfter = await prisma.userProfile.findUnique({ where: { user_id: userTxId } });
    expect(profileAfter?.global_address_id).toBe(currentAddressId);
    expect(profileAfter?.city).toBe(currentProfile?.city); // Legacy fields should NOT have changed

    // Ensure no orphan address was created for 'place_fail'
    const orphan = await prisma.address.findFirst({ where: { providerPlaceId: 'place_fail' } });
    expect(orphan).toBeNull();
  });

  it('should clear canonical and legacy fields synchronously when global_address is null', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce({ user: { id: userTxId, role: 'Individual Provider' } });
    
    // First, ensure the user has an address (from previous test)
    const beforeProfile = await prisma.userProfile.findUnique({ where: { user_id: userTxId } });
    expect(beforeProfile?.global_address_id).not.toBeNull();
    expect(beforeProfile?.city).not.toBeNull();

    // Now clear it
    const req = new NextRequest('http://localhost/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        global_address: null,
      })
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);

    const afterProfile = await prisma.userProfile.findUnique({ where: { user_id: userTxId } });
    expect(afterProfile?.global_address_id).toBeNull();
    expect(afterProfile?.city).toBeNull();
    expect(afterProfile?.province).toBeNull();
    expect(afterProfile?.country).toBeNull();
  });
});
