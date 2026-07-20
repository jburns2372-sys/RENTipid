import { PrismaClient } from '@prisma/client';
import { recordPaymentInitializedAction } from '@/lib/payments/payment-action-log-writer';

const prisma = new PrismaClient();

describe('GATE4B4_SLICE_B1C: Checkout Writer Integration', () => {
  const namespace = `gate4b4-slice-b1c-${Date.now()}`;
  let syntheticUser: any;
  let syntheticListing: any;
  let syntheticBooking: any;

  beforeAll(async () => {
    // Check local database guard implicitly by creating data
    syntheticUser = await prisma.user.create({
      data: {
        id: `${namespace}-user`,
        email: `${namespace}@example.com`,
        full_name: 'Synthetic Renter Full',
        account_type: 'Individual',
        status: 'Active',
        role: 'RENTER'
      }
    });

    await prisma.category.create({
      data: {
        id: `${namespace}-category`,
        name: 'Mock Category',
        slug: `${namespace}-mock-category`,
        risk_level: 'Low'
      }
    });

    syntheticListing = await prisma.listing.create({
      data: {
        id: `${namespace}-listing`,
        title: 'Synthetic Listing',
        description: 'Test',
        daily_rate: 1000,
        provider_id: syntheticUser.id,
        category_id: `${namespace}-category`,
        status: 'Active',
        rental_type: 'Daily'
      }
    });

    syntheticBooking = await prisma.booking.create({
      data: {
        id: `${namespace}-booking`,
        renter: { connect: { id: syntheticUser.id } },
        listing: { connect: { id: syntheticListing.id } },
        start_date: new Date(),
        end_date: new Date(Date.now() + 86400000),
        status: 'Approved',
        payment_status: 'Pending Payment',
        rental_duration: 1,
        rental_duration_unit: 'Days',
        selected_rate_type: 'Daily',
        base_rental_amount: 1000,
        deposit_amount: 0,
        pickup_option: 'Delivery',
        estimated_total_amount: 1000,
        provider: { connect: { id: syntheticUser.id } }
      }
    });
  });

  afterAll(async () => {
    // Cleanup namespace
    if (syntheticBooking) {
      await prisma.paymentActionLog.deleteMany({
        where: { booking_id: syntheticBooking.id }
      });
      await prisma.gatewayTransaction.deleteMany({
        where: { booking_id: syntheticBooking.id }
      });
      await prisma.booking.deleteMany({ where: { id: syntheticBooking.id } });
    }
    if (syntheticListing) {
      await prisma.listing.deleteMany({ where: { id: syntheticListing.id } });
      await prisma.category.deleteMany({ where: { id: `${namespace}-category` } });
    }
    if (syntheticUser) {
      await prisma.user.deleteMany({ where: { id: syntheticUser.id } });
    }
    await prisma.$disconnect();
  });

  it('1. Authors one GatewayTransaction and exactly one PAYMENT_INITIALIZED PaymentActionLog atomically', async () => {
    const txRes = await prisma.$transaction(async (tx) => {
      const txDoc = await tx.gatewayTransaction.create({
        data: {
          id: `${namespace}-tx-1`,
          booking_id: syntheticBooking.id,
          provider: 'Mock',
          provider_mode: 'Sandbox',
          gateway_status: 'Created',
          amount: 1000,
          currency: 'PHP',
          verification_status: 'Not Verified',
          reconciliation_status: 'Pending'
        }
      });
      
      const log = await recordPaymentInitializedAction(
        tx,
        txDoc,
        { id: syntheticBooking.id },
        syntheticUser.id
      );

      return { txDoc, log };
    });

    expect(txRes.txDoc).toBeDefined();
    expect(txRes.log).toBeDefined();
    expect(txRes.log.action_code).toBe('PAYMENT_INITIALIZED');
    expect(txRes.log.actor_type).toBe('RENTER');
    expect(txRes.log.outcome).toBe('SUCCESS');
    expect(txRes.log.source_workflow).toBe('CHECKOUT_INITIALIZATION');
    expect(txRes.log.source_operation_id).toBe(`${namespace}-tx-1`);
    expect(txRes.log.gateway_transaction_id).toBe(`${namespace}-tx-1`);
    expect(txRes.log.booking_id).toBe(syntheticBooking.id);
    expect(txRes.log.actor_user_id).toBe(syntheticUser.id);
    expect(Number(txRes.log.amount)).toBe(1000);
    expect(txRes.log.currency).toBe('PHP');
    expect(txRes.log.occurred_at).toBeInstanceOf(Date);
    expect(txRes.log.created_at).toBeInstanceOf(Date);
    expect(txRes.log.idempotency_key).toBeDefined();

    // Verify in db
    const dbLog = await prisma.paymentActionLog.findUnique({
      where: { id: txRes.log.id }
    });
    expect(dbLog).toBeDefined();
  });

  it('2. Reprocessing the same source operation creates unique conflict error (idempotency)', async () => {
    await expect(prisma.$transaction(async (tx) => {
      // Mock same transaction ID
      const txDoc = { id: `${namespace}-tx-1`, amount: 1000, currency: 'PHP' };
      await recordPaymentInitializedAction(
        tx,
        txDoc,
        { id: syntheticBooking.id },
        syntheticUser.id
      );
    })).rejects.toThrow();
  });

  it('3. Action-log failure rolls back GatewayTransaction creation', async () => {
    await expect(prisma.$transaction(async (tx) => {
      const txDoc = await tx.gatewayTransaction.create({
        data: {
          id: `${namespace}-tx-2`,
          booking_id: syntheticBooking.id,
          provider: 'Mock',
          provider_mode: 'Sandbox',
          gateway_status: 'Created',
          amount: -1000, // Invalid amount causes financial validation to fail
          currency: 'PHP',
          verification_status: 'Not Verified',
          reconciliation_status: 'Pending'
        }
      });
      
      await recordPaymentInitializedAction(
        tx,
        txDoc,
        { id: syntheticBooking.id },
        syntheticUser.id
      );
    })).rejects.toThrow(/Invalid amount/);

    const txExists = await prisma.gatewayTransaction.findUnique({
      where: { id: `${namespace}-tx-2` }
    });
    expect(txExists).toBeNull();
  });
});
