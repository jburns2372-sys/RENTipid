import { AddressTokenService } from '../../src/lib/address/address-token';
import { PrismaClient } from '@prisma/client';
import { PATCH } from '../../src/app/api/profile/route';
import { NextRequest } from 'next/server';

const prisma = new PrismaClient();

// Mock next-auth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));
import { getServerSession } from 'next-auth/next';

describe('Profile Address IDOR & State Tests', () => {
  let userAId: string;
  let userBId: string;

  beforeAll(async () => {
    process.env.ENCRYPTION_KEY = '12345678901234567890123456789012';
    
    // We use unique IDs so we don't need to clear the whole table and hit FK constraints
    await prisma.businessProfile.deleteMany({ where: { user_id: { in: ['userA_idor', 'userB_idor'] } } });
    await prisma.userProfile.deleteMany({ where: { user_id: { in: ['userA_idor', 'userB_idor'] } } });
    await prisma.user.deleteMany({ where: { id: { in: ['userA_idor', 'userB_idor'] } } });

    const userA = await prisma.user.create({
      data: {
        id: 'userA_idor',
        email: 'usera@example.com',
        full_name: 'User A',
        account_type: 'Individual',
        password_hash: 'hash',
        role: 'Individual Provider',
        status: 'Active',
      }
    });
    userAId = userA.id;

    const userB = await prisma.user.create({
      data: {
        id: 'userB_idor',
        email: 'userb@example.com',
        full_name: 'User B',
        account_type: 'Individual',
        password_hash: 'hash',
        role: 'Individual Provider',
        status: 'Active',
      }
    });
    userBId = userB.id;

    await prisma.userProfile.create({ data: { user_id: userAId, verification_status: 'Unverified' } });
    await prisma.businessProfile.create({ data: { user_id: userAId, verification_status: 'Unverified', business_name: 'Test Business A' } });

    await prisma.userProfile.create({ data: { user_id: userBId, verification_status: 'Unverified' } });
    await prisma.businessProfile.create({ data: { user_id: userBId, verification_status: 'Unverified', business_name: 'Test Business B' } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  const getValidAddressPayload = (userId: string, prefix: string) => {
    const payload = {
      userId,
      addressLine1: `${prefix} Street`,
      addressLine2: null,
      sublocality: null,
      locality: `${prefix} City`,
      administrativeArea2: null,
      administrativeArea1: `${prefix} Prov`,
      postalCode: '1000',
      countryCode: 'PH',
      formattedAddress: `${prefix} Street, ${prefix} City`,
      latitude: 14.0,
      longitude: 121.0,
      provider: 'google' as const,
      providerPlaceId: `place_${prefix}`,
      validationStatus: 'VALIDATED' as const,
      validationLevel: null,
      manuallyEdited: false,
      validatedAt: null,
      expiresAt: Date.now() + 100000,
    };
    
    return {
      payload,
      token: AddressTokenService.generateToken(payload),
      requestAddress: {
        addressLine1: payload.addressLine1,
        addressLine2: payload.addressLine2,
        sublocality: payload.sublocality,
        locality: payload.locality,
        administrativeArea2: payload.administrativeArea2,
        administrativeArea1: payload.administrativeArea1,
        postalCode: payload.postalCode,
        countryCode: payload.countryCode,
        formattedAddress: payload.formattedAddress,
        latitude: payload.latitude,
        longitude: payload.longitude,
        provider: payload.provider,
        providerPlaceId: payload.providerPlaceId,
        validationStatus: payload.validationStatus,
        validationLevel: payload.validationLevel,
        manuallyEdited: payload.manuallyEdited,
        validatedAt: null,
      }
    };
  };

  it('PERSONAL: should allow User A to create and update their own personal address', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: userAId, role: 'Individual Provider' } });
    
    const { token, requestAddress } = getValidAddressPayload(userAId, 'User A');
    
    const req = new NextRequest('http://localhost/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        global_address: { ...requestAddress, selectionToken: token }
      })
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);

    const profileA = await prisma.userProfile.findUnique({ where: { user_id: userAId }, include: { global_address: true } });
    expect(profileA?.global_address_id).not.toBeNull();
    expect(profileA?.global_address?.formattedAddress_encrypted).not.toBeNull();

    // UPDATE EXISTING
    const { token: tokenUpdate, requestAddress: requestAddressUpdate } = getValidAddressPayload(userAId, 'User A Updated');
    
    const reqUpdate = new NextRequest('http://localhost/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        global_address: { ...requestAddressUpdate, selectionToken: tokenUpdate }
      })
    });

    const resUpdate = await PATCH(reqUpdate);
    expect(resUpdate.status).toBe(200);

    const profileAUpdated = await prisma.userProfile.findUnique({ where: { user_id: userAId }, include: { global_address: true } });
    expect(profileAUpdated?.global_address_id).toBe(profileA?.global_address_id); // Relation remains unchanged
    expect(profileAUpdated?.global_address?.formattedAddress_encrypted).not.toBe(profileA?.global_address?.formattedAddress_encrypted);
    expect(profileAUpdated?.address_encrypted).not.toBeNull(); // Legacy value updated

    // Ensure no orphan addresses created (count should be exactly 1 for this placeId)
    const addressCount = await prisma.address.count({ where: { providerPlaceId: 'place_User A Updated' } });
    expect(addressCount).toBe(1);
  });

  it('PERSONAL: should prevent User B from replacing User A personal address', async () => {
    // User B attempts to set an address
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: userBId, role: 'Individual Provider' } });
    
    const { token, requestAddress } = getValidAddressPayload(userBId, 'User B');
    
    const profileABefore = await prisma.userProfile.findUnique({ where: { user_id: userAId }, include: { global_address: true } });
    const req = new NextRequest('http://localhost/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        // Malicious injection of User A's IDs
        id: profileABefore?.id,
        user_id: userAId,
        userId: userAId,
        global_address_id: profileABefore?.global_address_id,
        global_address: { ...requestAddress, selectionToken: token }
      })
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400); // 400 is expected because strict schema strips/rejects id/user_id

    // Verify A was untouched
    const profileA = await prisma.userProfile.findUnique({ where: { user_id: userAId }, include: { global_address: true } });
    
    expect(profileA).toStrictEqual(profileABefore);
  });

  it('PERSONAL: should prevent User B from clearing User A personal address', async () => {
    // User B attempts to clear their address
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: userBId, role: 'Individual Provider' } });
    
    const profileABefore = await prisma.userProfile.findUnique({ where: { user_id: userAId }, include: { global_address: true } });
    const req = new NextRequest('http://localhost/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        // Malicious injection to target A for clearing
        id: profileABefore?.id,
        user_id: userAId,
        userId: userAId,
        global_address_id: profileABefore?.global_address_id,
        global_address: null
      })
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);

    // Verify A is still intact
    const profileA = await prisma.userProfile.findUnique({ where: { user_id: userAId }, include: { global_address: true } });
    expect(profileA).toStrictEqual(profileABefore);
  });

  it('BUSINESS: should allow User A to create and update their own business address', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: userAId, role: 'Business Provider' } });
    
    const { token, requestAddress } = getValidAddressPayload(userAId, 'Business A');
    
    const req = new NextRequest('http://localhost/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        global_business_address: { ...requestAddress, selectionToken: token }
      })
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);

    const profileA = await prisma.businessProfile.findUnique({ where: { user_id: userAId }, include: { global_business_address: true } });
    expect(profileA?.global_business_address_id).not.toBeNull();
    const profileABefore = await prisma.userProfile.findUnique({ where: { user_id: userAId } });

    // UPDATE EXISTING
    const { token: tokenUpdate, requestAddress: requestAddressUpdate } = getValidAddressPayload(userAId, 'Business A Updated');
    
    const reqUpdate = new NextRequest('http://localhost/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        global_business_address: { ...requestAddressUpdate, selectionToken: tokenUpdate }
      })
    });

    const resUpdate = await PATCH(reqUpdate);
    expect(resUpdate.status).toBe(200);

    const profileAUpdated = await prisma.businessProfile.findUnique({ where: { user_id: userAId }, include: { global_business_address: true } });
    expect(profileAUpdated?.global_business_address_id).toBe(profileA?.global_business_address_id); // Relation remains unchanged
    expect(profileAUpdated?.global_business_address?.formattedAddress_encrypted).not.toBe(profileA?.global_business_address?.formattedAddress_encrypted);
    expect(profileAUpdated?.business_address_encrypted).not.toBeNull(); // Legacy value updated

    // Ensure personal address wasn't affected
    const userProfileAAfter = await prisma.userProfile.findUnique({ where: { user_id: userAId } });
    expect(userProfileAAfter?.global_address_id).toBe(profileABefore?.global_address_id);

    // Ensure no orphan/duplicate addresses created
    const addressCount = await prisma.address.count({ where: { providerPlaceId: 'place_Business A Updated' } });
    expect(addressCount).toBe(1);
  });

  it('BUSINESS: should prevent User B from replacing User A business address', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: userBId, role: 'Business Provider' } });
    
    const { token, requestAddress } = getValidAddressPayload(userBId, 'Business B');
    
    const profileABefore = await prisma.businessProfile.findUnique({ where: { user_id: userAId }, include: { global_business_address: true } });
    const userProfileABefore = await prisma.userProfile.findUnique({ where: { user_id: userAId }, include: { global_address: true } });
    const req = new NextRequest('http://localhost/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        // Malicious injection targeting A's business
        id: profileABefore?.id,
        user_id: userAId,
        userId: userAId,
        global_business_address_id: profileABefore?.global_business_address_id,
        global_business_address: { ...requestAddress, selectionToken: token }
      })
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);

    const profileA = await prisma.businessProfile.findUnique({ where: { user_id: userAId }, include: { global_business_address: true } });
    const userProfileAAfter = await prisma.userProfile.findUnique({ where: { user_id: userAId }, include: { global_address: true } });

    expect(profileA).toStrictEqual(profileABefore);
    expect(userProfileAAfter).toStrictEqual(userProfileABefore);
  });

  it('BUSINESS: should prevent User B from clearing User A business address', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: userBId, role: 'Business Provider' } });
    
    const profileABefore = await prisma.businessProfile.findUnique({ where: { user_id: userAId }, include: { global_business_address: true } });
    const userProfileABefore = await prisma.userProfile.findUnique({ where: { user_id: userAId }, include: { global_address: true } });
    const req = new NextRequest('http://localhost/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        // Malicious injection targeting A's business for clearing
        id: profileABefore?.id,
        user_id: userAId,
        userId: userAId,
        global_business_address_id: profileABefore?.global_business_address_id,
        global_business_address: null
      })
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);

    // Verify A is still intact
    const profileA = await prisma.businessProfile.findUnique({ where: { user_id: userAId }, include: { global_business_address: true } });
    const userProfileAAfter = await prisma.userProfile.findUnique({ where: { user_id: userAId }, include: { global_address: true } });
    
    expect(profileA).toStrictEqual(profileABefore);
    expect(userProfileAAfter).toStrictEqual(userProfileABefore);
  });
});
