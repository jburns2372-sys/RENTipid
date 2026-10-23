import { PrismaClient, PaymentActionLog } from '@prisma/client';
import { processCheckout } from '../../../src/app/checkout/[bookingId]/actions';

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn()
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn()
}));

jest.mock('../../../src/lib/payments/payment-gateway-registry', () => ({
  gatewayRegistry: {
    getAdapter: () => ({
      createCheckoutSession: jest.fn().mockImplementation(() => Promise.resolve({
        gatewayReference: 'mock_ref_' + Math.random().toString(36).substring(2, 9),
        checkoutUrl: 'https://mock.checkout.com',
        status: 'Processing'
      }))
    })
  }
}));

jest.mock('../../../src/lib/payments/payment-action-log-writer', () => {
  const original = jest.requireActual('../../../src/lib/payments/payment-action-log-writer');
  return {
    __esModule: true,
    ...original,
    recordPaymentFreezeBlockedAction: jest.fn(async (...args) => {
      if (args[1].id.includes('throw_pre_commit')) {
        throw new Error('Synthetic pre-commit failure');
      }
      return original.recordPaymentFreezeBlockedAction(...args);
    })
  };
});

const prisma = new PrismaClient();
const crypto = require('crypto');
const deriveKey = (u: string, b: string, req: string) => crypto.createHash('sha256').update(`RENTIPID_CHECKOUT_V1|${u}|${b}|${req}`).digest('hex');

describe('GATE4B4_SLICE_B1F_A1_POST_COMMIT_HANDOFF', () => {
  const NAMESPACE = 'GATE4B4-B1F-A1';
  let user1Id: string;
  let listingId: string;
  let booking1Id: string;

  beforeAll(async () => {
    await prisma.paymentActionLog.deleteMany({ where: { booking_id: { startsWith: `book_${NAMESPACE}` } }});
    await prisma.booking.deleteMany({ where: { id: { startsWith: `book_${NAMESPACE}` } }});
    await prisma.listing.deleteMany({ where: { id: `list_${NAMESPACE}` }});
    await prisma.user.deleteMany({ where: { id: { startsWith: `user_${NAMESPACE}` } }});

    const user1 = await prisma.user.upsert({
      where: { id: `user_${NAMESPACE}_1` },
      update: {},
      create: { id: `user_${NAMESPACE}_1`, email: `user1_${NAMESPACE}@test.com`, full_name: 'Renter One', account_type: 'Individual', role: 'Renter', status: 'Verified', password_hash: 'hash' }
    });
    user1Id = user1.id;

    const category = await prisma.category.upsert({
      where: { id: `cat_${NAMESPACE}` },
      update: {},
      create: { id: `cat_${NAMESPACE}`, name: 'Test Category', slug: `test-cat-${NAMESPACE}`, risk_level: 'Low' }
    });

    const listing = await prisma.listing.upsert({
      where: { id: `list_${NAMESPACE}` },
      update: {},
      create: { id: `list_${NAMESPACE}`, title: 'Test Listing', daily_rate: 1000, provider_id: user1Id, category_id: category.id, rental_type: 'Daily', status: 'Published' }
    });
    listingId = listing.id;

    const booking1 = await prisma.booking.upsert({
      where: { id: `book_${NAMESPACE}_1` },
      update: {},
      create: {
        id: `book_${NAMESPACE}_1`,
        listing_id: listingId,
        renter_id: user1Id,
        status: 'Approved',
        payment_status: 'Pending Payment',
        start_date: new Date(),
        end_date: new Date(),
        estimated_total_amount: 1000,
        rental_duration: 1,
        rental_duration_unit: 'Days',
        selected_rate_type: 'Daily',
        base_rental_amount: 1000,
        provider_id: user1Id,
        deposit_amount: 0,
        pickup_option: 'Pickup'
      }
    });
    booking1Id = booking1.id;

    await prisma.systemSetting.upsert({
      where: { setting_key: 'PAYMENT_LIVE_PILOT_ENABLED' },
      update: { setting_value: 'true' },
      create: { setting_key: 'PAYMENT_LIVE_PILOT_ENABLED', setting_value: 'true' }
    });
    await prisma.systemSetting.upsert({
      where: { setting_key: 'PILOT_MAX_AMOUNT' },
      update: { setting_value: '5000' },
      create: { setting_key: 'PILOT_MAX_AMOUNT', setting_value: '5000' }
    });
    await prisma.systemSetting.upsert({
      where: { setting_key: 'PAYMONGO_VERIFICATION_APPROVED' },
      update: { setting_value: 'Approved' },
      create: { setting_key: 'PAYMONGO_VERIFICATION_APPROVED', setting_value: 'Approved' }
    });
    await prisma.systemSetting.upsert({
      where: { setting_key: 'PAYMONGO_GCASH_ACTIVE' },
      update: { setting_value: 'Approved' },
      create: { setting_key: 'PAYMONGO_GCASH_ACTIVE', setting_value: 'Approved' }
    });

    process.env.APP_BASE_URL = 'https://www.rentipid.com.ph';
  });

  afterAll(async () => {
    await prisma.paymentActionLog.deleteMany({ where: { booking_id: { startsWith: `book_${NAMESPACE}` } }});
    await prisma.booking.deleteMany({ where: { id: { startsWith: `book_${NAMESPACE}` } }});
    await prisma.listing.deleteMany({ where: { id: `list_${NAMESPACE}` }});
    await prisma.user.deleteMany({ where: { id: { startsWith: `user_${NAMESPACE}` } }});
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  async function mockSession(userId: string, email: string) {
    const { getServerSession } = require('next-auth/next');
    getServerSession.mockResolvedValue({
      user: { id: userId, email, name: 'Mock User' }
    });
  }

  async function createFormData(bookingId: string, paymentMode: string, requestId: string) {
    const fd = new FormData();
    fd.append('booking_id', bookingId);
    fd.append('payment_mode', paymentMode);
    fd.append('checkout_request_id', requestId);
    return fd;
  }

  async function enableFreeze(listingIdParam: string, renterIdParam: string) {
    await prisma.systemSetting.upsert({
      where: { setting_key: 'PAYMENT_EMERGENCY_FREEZE' },
      update: { setting_value: 'true' },
      create: { setting_key: 'PAYMENT_EMERGENCY_FREEZE', setting_value: 'true' }
    });
    await prisma.systemSetting.upsert({
      where: { setting_key: 'PILOT_LISTING_ID' },
      update: { setting_value: listingIdParam },
      create: { setting_key: 'PILOT_LISTING_ID', setting_value: listingIdParam }
    });
    await prisma.systemSetting.upsert({
      where: { setting_key: 'PILOT_RENTER_ID' },
      update: { setting_value: renterIdParam },
      create: { setting_key: 'PILOT_RENTER_ID', setting_value: renterIdParam }
    });
  }

  it('19. Pre-commit transaction failure preserves no source.', async () => {
    // Create the throw booking
    const throwBooking = await prisma.booking.upsert({
      where: { id: `book_${NAMESPACE}_throw_pre_commit` },
      update: {},
      create: {
        id: `book_${NAMESPACE}_throw_pre_commit`,
        listing_id: listingId,
        renter_id: user1Id,
        status: 'Approved',
        payment_status: 'Pending Payment',
        start_date: new Date(),
        end_date: new Date(),
        estimated_total_amount: 1000,
        rental_duration: 1,
        rental_duration_unit: 'Days',
        selected_rate_type: 'Daily',
        base_rental_amount: 1000,
        provider_id: user1Id,
        deposit_amount: 0,
        pickup_option: 'Pickup'
      }
    });

    await mockSession(user1Id, 'user1@test.com');
    await enableFreeze(listingId, user1Id);
    
    const reqId = `00000000-0000-0000-0000-b1eb1eb1e119`;
    const fd = await createFormData(throwBooking.id, 'paymongo_live_pilot', reqId);
    
    await expect(processCheckout(fd)).rejects.toThrow('Synthetic pre-commit failure');
    
    const logs = await prisma.paymentActionLog.findMany({
      where: { source_operation_id: deriveKey(user1Id, throwBooking.id, reqId) }
    });
    expect(logs.length).toBe(0);
  });

  it('21. Post-commit control-flow failure preserves the source.', async () => {
    await mockSession(user1Id, 'user1@test.com');
    await enableFreeze(listingId, user1Id);
    
    const reqId = `00000000-0000-0000-0000-b1eb1eb1e121`;
    const fd = await createFormData(booking1Id, 'paymongo_live_pilot', reqId);
    
    const { redirect } = require('next/navigation');
    (redirect as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Synthetic post-commit redirect failure');
    });

    await expect(processCheckout(fd)).rejects.toThrow('Synthetic post-commit redirect failure');
    
    const logs = await prisma.paymentActionLog.findMany({
      where: { source_operation_id: deriveKey(user1Id, booking1Id, reqId) }
    });
    expect(logs.length).toBe(1);
    expect(logs[0].action_code).toBe('PAYMENT_FREEZE_BLOCKED');
  });

});
