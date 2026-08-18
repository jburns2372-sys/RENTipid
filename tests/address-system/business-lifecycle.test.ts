import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AddressTokenService } from '../../src/lib/address/address-token';
import { PATCH } from '../../src/app/api/profile/route';
import { ProfileFieldProtection, ProfileFieldContext } from '../../src/lib/security/crypto/profile-field-protection';
import { getServerSession } from 'next-auth/next';

const prisma = new PrismaClient();

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

describe('Business Lifecycle & Address Tests', () => {
  let userCId: string;

  beforeAll(async () => {
    process.env.ENCRYPTION_KEY = '12345678901234567890123456789012';
    
    await prisma.businessProfile.deleteMany({ where: { user_id: 'userC_biz' } });
    await prisma.userProfile.deleteMany({ where: { user_id: 'userC_biz' } });
    await prisma.user.deleteMany({ where: { id: 'userC_biz' } });

    const userC = await prisma.user.create({
      data: {
        id: 'userC_biz',
        email: 'userc@example.com',
        full_name: 'User C',
        account_type: 'Individual',
        password_hash: 'hash',
        role: 'Business Provider',
        status: 'Active',
      }
    });
    userCId = userC.id;

    await prisma.userProfile.create({ data: { user_id: userCId, verification_status: 'Unverified' } });
    await prisma.businessProfile.create({ data: { user_id: userCId, verification_status: 'Unverified', business_name: 'Test Business C' } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create, clear, and recreate a business address correctly (lifecycle)', async () => {
    (getServerSession as jest.Mock).mockReturnValue({ user: { id: userCId, role: 'Business Provider' } });

    // 1. Create Business Address
    const tokenPayload = {
      userId: userCId,
      addressLine1: 'Business HQ',
      addressLine2: null,
      sublocality: null,
      locality: null,
      administrativeArea2: null,
      administrativeArea1: null,
      postalCode: null,
      countryCode: 'US',
      formattedAddress: null,
      latitude: null,
      longitude: null,
      provider: 'google',
      providerPlaceId: null,
      validationStatus: 'VALIDATED',
      validationLevel: null,
      manuallyEdited: false,
      validatedAt: null,
    };
    
    const token = AddressTokenService.generateToken(tokenPayload);

    const { userId, ...restCreate } = tokenPayload;
    void userId;

    const reqCreate = new NextRequest('http://localhost/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        global_business_address: {
          ...restCreate,
          selectionToken: token,
        }
      })
    });

    const resCreate = await PATCH(reqCreate);
    expect(resCreate.status).toBe(200);

    let bizProfile = await prisma.businessProfile.findUnique({ where: { user_id: userCId }, include: { global_business_address: true } });
    expect(bizProfile?.global_business_address_id).not.toBeNull();
    const firstAddressId = bizProfile!.global_business_address_id;

    // 2. Clear Business Address
    (getServerSession as jest.Mock).mockReturnValue({ user: { id: userCId, role: 'Business Provider' } });
    const reqClear = new NextRequest('http://localhost/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        global_business_address: null, // explicit clear
      })
    });

    const resClear = await PATCH(reqClear);
    expect(resClear.status).toBe(200);

    bizProfile = await prisma.businessProfile.findUnique({ where: { user_id: userCId }, include: { global_business_address: true } });
    expect(bizProfile?.global_business_address_id).toBeNull();
    // Verify the record was deleted from DB to prevent orphans
    const orphan = await prisma.address.findUnique({ where: { id: firstAddressId! } });
    expect(orphan).toBeNull();

    // 3. Recreate Business Address
    (getServerSession as jest.Mock).mockReturnValue({ user: { id: userCId, role: 'Business Provider' } });
    const tokenPayload2 = {
      ...tokenPayload,
      addressLine1: 'New Business HQ',
    };
    const token2 = AddressTokenService.generateToken(tokenPayload2);

    const { userId: userId2, ...restRecreate } = tokenPayload2;
    void userId2;

    const reqRecreate = new NextRequest('http://localhost/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        global_business_address: {
          ...restRecreate,
          selectionToken: token2,
        }
      })
    });

    const resRecreate = await PATCH(reqRecreate);
    expect(resRecreate.status).toBe(200);

    bizProfile = await prisma.businessProfile.findUnique({ where: { user_id: userCId }, include: { global_business_address: true } });
    expect(bizProfile?.global_business_address_id).not.toBeNull();
    expect(bizProfile?.global_business_address_id).not.toBe(firstAddressId);
  });

  it('should be idempotent under concurrent overlapping Profile PATCH submissions', async () => {
    (getServerSession as jest.Mock).mockReturnValue({ user: { id: userCId, role: 'Business Provider' } });
    const tokenPayload = {
      userId: userCId,
      addressLine1: 'Concurrent HQ',
      addressLine2: null,
      sublocality: null,
      locality: null,
      administrativeArea2: null,
      administrativeArea1: null,
      postalCode: null,
      countryCode: 'US',
      formattedAddress: null,
      latitude: null,
      longitude: null,
      provider: 'google',
      providerPlaceId: null,
      validationStatus: 'VALIDATED',
      validationLevel: null,
      manuallyEdited: false,
      validatedAt: null,
    };
    const token = AddressTokenService.generateToken(tokenPayload);
    const { userId, ...rest } = tokenPayload;
    void userId;

    const createReq = () => new NextRequest('http://localhost/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        global_business_address: {
          ...rest,
          selectionToken: token,
        }
      })
    });

    // Send 3 requests concurrently
    const [res1, res2, res3] = await Promise.all([
      PATCH(createReq()),
      PATCH(createReq()),
      PATCH(createReq())
    ]);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res3.status).toBe(200);

    const bizProfile = await prisma.businessProfile.findUnique({ where: { user_id: userCId }, include: { global_business_address: true } });
    expect(bizProfile?.global_business_address_id).not.toBeNull();
  });

  it('should rollback business address creation if an error occurs in the transaction', async () => {
    (getServerSession as jest.Mock).mockReturnValue({ user: { id: userCId, role: 'Business Provider' } });
    
    // Initial State Setup
    await PATCH(new NextRequest('http://localhost/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({ global_business_address: null })
    }));

    const preFailProfile = await prisma.userProfile.findUnique({ where: { user_id: userCId }, include: { global_address: true } });
    const preFailBizProfile = await prisma.businessProfile.findUnique({ where: { user_id: userCId }, include: { global_business_address: true } });

    const tokenPayload = {
      userId: userCId,
      addressLine1: 'Fail HQ',
      addressLine2: null,
      sublocality: null,
      locality: 'Fail City',
      administrativeArea2: null,
      administrativeArea1: null,
      postalCode: null,
      countryCode: 'US',
      formattedAddress: 'Fail HQ, Fail City',
      latitude: null,
      longitude: null,
      provider: 'google',
      providerPlaceId: 'place_fail_biz',
      validationStatus: 'VALIDATED',
      validationLevel: null,
      manuallyEdited: false,
      validatedAt: null,
    };
    const token = AddressTokenService.generateToken(tokenPayload);
    const { userId, ...rest } = tokenPayload;
    void userId;

    // Force failure in the real PostgreSQL BusinessProfile transaction path by preventing any update to global_business_address_id
    await prisma.$executeRaw`ALTER TABLE "BusinessProfile" ADD CONSTRAINT "simulated_fail_biz" CHECK ("global_business_address_id" IS NULL) NOT VALID`;

    const req = () => new NextRequest('http://localhost/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        global_business_address: {
          ...rest,
          selectionToken: token,
        }
      })
    });

    const res = await PATCH(req());
    expect(res.status).toBe(500);

    // After failure query PostgreSQL and prove:
    const postFailBizProfile = await prisma.businessProfile.findUnique({ where: { user_id: userCId }, include: { global_business_address: true } });
    const postFailProfile = await prisma.userProfile.findUnique({ where: { user_id: userCId }, include: { global_address: true } });
    
    // - business Address canonical state unchanged
    expect(postFailBizProfile?.global_business_address?.addressLine1_encrypted).toBe(preFailBizProfile?.global_business_address?.addressLine1_encrypted);
    // - business Address relation unchanged
    expect(postFailBizProfile?.global_business_address_id).toBe(preFailBizProfile?.global_business_address_id);
    // - business legacy fields unchanged
    expect(postFailBizProfile?.business_address_encrypted).toBe(preFailBizProfile?.business_address_encrypted);
    // - personal Address unchanged
    expect(postFailProfile?.global_address_id).toBe(preFailProfile?.global_address_id);
    expect(postFailProfile?.address).toBe(preFailProfile?.address);

    // - no orphan Address
    const orphan = await prisma.address.findFirst({ where: { providerPlaceId: 'place_fail_biz' } });
    expect(orphan).toBeNull();

    // Then remove failure and retry successfully
    await prisma.$executeRaw`ALTER TABLE "BusinessProfile" DROP CONSTRAINT IF EXISTS "simulated_fail_biz"`;

    const retryRes = await PATCH(req());
    expect(retryRes.status).toBe(200);

    const postRetryBizProfile = await prisma.businessProfile.findUnique({ where: { user_id: userCId }, include: { global_business_address: true } });
    expect(postRetryBizProfile?.global_business_address_id).not.toBeNull();
    const initialAddressId = postRetryBizProfile?.global_business_address_id;
    
    const preRepeatBizAddressCipher = postRetryBizProfile?.global_business_address?.addressLine1_encrypted || '';
    const preRepeatLocalityCipher = postRetryBizProfile?.global_business_address?.locality_encrypted || '';
    const preRepeatLegacyCipher = postRetryBizProfile?.business_address_encrypted || '';

    const preRepeatBizAddress = ProfileFieldProtection.read(preRepeatBizAddressCipher, null, ProfileFieldContext.ADDRESS_LINE_1).value;
    const preRepeatLocality = ProfileFieldProtection.read(preRepeatLocalityCipher, null, ProfileFieldContext.ADDRESS_LOCALITY).value;
    const preRepeatLegacy = ProfileFieldProtection.read(preRepeatLegacyCipher, null, ProfileFieldContext.BUSINESS_ADDRESS).value;

    // Then save identical successful business Address twice and prove:
    const doubleRetryRes = await PATCH(req());
    expect(doubleRetryRes.status).toBe(200);

    const postDoubleRetryBizProfile = await prisma.businessProfile.findUnique({ where: { user_id: userCId }, include: { global_business_address: true } });
    
    // - stable relation
    expect(postDoubleRetryBizProfile?.global_business_address_id).toBe(initialAddressId);
    
    // - stable canonical state
    const postRepeatBizAddressCipher = postDoubleRetryBizProfile?.global_business_address?.addressLine1_encrypted || '';
    const postRepeatLocalityCipher = postDoubleRetryBizProfile?.global_business_address?.locality_encrypted || '';
    const postRepeatLegacyCipher = postDoubleRetryBizProfile?.business_address_encrypted || '';

    const postRepeatBizAddress = ProfileFieldProtection.read(postRepeatBizAddressCipher, null, ProfileFieldContext.ADDRESS_LINE_1).value;
    const postRepeatLocality = ProfileFieldProtection.read(postRepeatLocalityCipher, null, ProfileFieldContext.ADDRESS_LOCALITY).value;
    const postRepeatLegacy = ProfileFieldProtection.read(postRepeatLegacyCipher, null, ProfileFieldContext.BUSINESS_ADDRESS).value;
    
    expect(postRepeatBizAddress).toBe(preRepeatBizAddress);
    expect(postRepeatLocality).toBe(preRepeatLocality);
    expect(postRepeatLegacy).toBe(preRepeatLegacy);

    // - no duplicate & no orphan
    const addressCount = await prisma.address.count({ where: { providerPlaceId: 'place_fail_biz' } });
    expect(addressCount).toBe(1);
  });
});
