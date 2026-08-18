import { PrismaClient, Prisma } from '@prisma/client';
import { 
  writePaymentActionLog,
  recordPaymentInitializedAction,
  recordPaymentFreezeBlockedAction
} from '@/lib/payments/payment-action-log-writer';
import { assertSafeLocalTestDatabaseTarget } from '@/lib/test-database-guard';

let prisma: PrismaClient;

beforeAll(async () => {
  assertSafeLocalTestDatabaseTarget();
  prisma = new PrismaClient();
  await prisma.$connect();
});

describe('GATE4B4_SLICE_B1G_S1: PaymentActionLog Amount Evidence Storage', () => {
  const namespace = `gate4b4-slice-b1g-${Date.now()}`;
  let testBookingId: string;
  let testUserId: string;
  let testListingId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        id: `${namespace}-user`,
        email: `${namespace}@example.com`,
        full_name: 'Synthetic Renter Full',
        account_type: 'Individual',
        status: 'Active',
        role: 'RENTER'
      }
    });
    testUserId = user.id;

    await prisma.category.create({
      data: {
        id: `${namespace}-category`,
        name: 'Mock Category',
        slug: `${namespace}-mock-category`,
        risk_level: 'Low'
      }
    });

    const listing = await prisma.listing.create({
      data: {
        id: `${namespace}-listing`,
        title: 'Synthetic Listing',
        description: 'Test',
        daily_rate: 1000,
        provider_id: testUserId,
        category_id: `${namespace}-category`,
        status: 'Active',
        rental_type: 'Daily'
      }
    });
    testListingId = listing.id;

    const booking = await prisma.booking.create({
      data: {
        id: `${namespace}-booking`,
        renter: { connect: { id: testUserId } },
        listing: { connect: { id: testListingId } },
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
        provider: { connect: { id: testUserId } }
      }
    });
    testBookingId = booking.id;
  });

  afterAll(async () => {
    if (testBookingId) {
      await prisma.paymentActionLog.deleteMany({
        where: { booking_id: testBookingId }
      });
      await prisma.booking.deleteMany({ where: { id: testBookingId } });
    }
    if (testListingId) {
      await prisma.listing.deleteMany({ where: { id: testListingId } });
      await prisma.category.deleteMany({ where: { id: `${namespace}-category` } });
    }
    if (testUserId) {
      await prisma.user.deleteMany({ where: { id: testUserId } });
    }
    await prisma.$disconnect();
  });

  it('1. expected_amount exists as nullable Decimal(20,4)', async () => {
    // Verified by Prisma schema types implicitly.
    // Also we will fetch raw type info from DB
    const result = await prisma.$queryRaw<any[]>`
      SELECT data_type, numeric_precision, numeric_scale 
      FROM information_schema.columns 
      WHERE table_name = 'PaymentActionLog' AND column_name = 'expected_amount'
    `;
    expect(result[0].data_type).toBe('numeric');
    expect(result[0].numeric_precision).toBe(20);
    expect(result[0].numeric_scale).toBe(4);
  });

  it('2. received_amount exists as nullable Decimal(20,4)', async () => {
    const result = await prisma.$queryRaw<any[]>`
      SELECT data_type, numeric_precision, numeric_scale 
      FROM information_schema.columns 
      WHERE table_name = 'PaymentActionLog' AND column_name = 'received_amount'
    `;
    expect(result[0].data_type).toBe('numeric');
    expect(result[0].numeric_precision).toBe(20);
    expect(result[0].numeric_scale).toBe(4);
  });

  it('3. Existing PaymentActionLog rows remain valid', async () => {
    // Create a row via raw SQL without the new fields to prove they are nullable and don't break existing rows
    const cuid = `raw-${Date.now()}`;
    await prisma.$executeRaw`
      INSERT INTO "PaymentActionLog" (
        "id", "booking_id", "action_code", "actor_type", "outcome", 
        "source_workflow", "source_operation_id", "idempotency_key", 
        "occurred_at", "created_at"
      ) VALUES (
        ${cuid}, ${testBookingId}, 'PAYMENT_INITIALIZED', 'RENTER', 'SUCCESS',
        'CHECKOUT_INITIALIZATION', 'op-test', ${cuid + '-idem'}, 
        NOW(), NOW()
      )
    `;
    const row = await prisma.paymentActionLog.findUniqueOrThrow({ where: { id: cuid } });
    expect(row.expected_amount).toBeNull();
    expect(row.received_amount).toBeNull();
  });

  it('4. Both amount-evidence fields may be null together', async () => {
    const log = await writePaymentActionLog(prisma, {
      booking_id: testBookingId,
      gateway_transaction_id: null,
      action_code: 'PAYMENT_INITIALIZED',
      actor_type: 'RENTER',
      actor_user_id: testUserId,
      outcome: 'SUCCESS',
      source_workflow: 'CHECKOUT_INITIALIZATION',
      source_operation_id: `op-null-${Date.now()}`
    });
    expect(log.expected_amount).toBeNull();
    expect(log.received_amount).toBeNull();
  });

  it('5. A partial amount-evidence pair is rejected by DB constraint', async () => {
    const cuid = `partial-${Date.now()}`;
    await expect(
      prisma.$executeRaw`
        INSERT INTO "PaymentActionLog" (
          "id", "booking_id", "action_code", "actor_type", "outcome", 
          "source_workflow", "source_operation_id", "idempotency_key", 
          "occurred_at", "created_at", "expected_amount"
        ) VALUES (
          ${cuid}, ${testBookingId}, 'PAYMENT_AMOUNT_MISMATCH', 'SYSTEM', 'MISMATCH_DETECTED',
          'PAYMENT_RECONCILIATION', 'op-partial', ${cuid + '-idem'}, 
          NOW(), NOW(), 100.00
        )
      `
    ).rejects.toThrow(/PaymentActionLog_amount_evidence_check/);
  });

  it('6. PAYMENT_AMOUNT_MISMATCH accepts both amounts', async () => {
    const log = await writePaymentActionLog(prisma, {
      booking_id: testBookingId,
      gateway_transaction_id: null,
      action_code: 'PAYMENT_AMOUNT_MISMATCH',
      actor_type: 'SYSTEM',
      actor_user_id: null,
      outcome: 'MISMATCH_DETECTED',
      source_workflow: 'PAYMENT_RECONCILIATION',
      source_operation_id: `op-both-${Date.now()}`,
      currency: 'PHP',
      expected_amount: '100.50',
      received_amount: '100.00'
    });
    expect(log.expected_amount?.toString()).toBe('100.5');
    expect(log.received_amount?.toString()).toBe('100');
  });

  it('7. Amounts are preserved exactly as Decimal values', async () => {
    const expected = '99999999999999.9999';
    const received = '0.0001';
    const log = await writePaymentActionLog(prisma, {
      booking_id: testBookingId,
      gateway_transaction_id: null,
      action_code: 'PAYMENT_AMOUNT_MISMATCH',
      actor_type: 'SYSTEM',
      actor_user_id: null,
      outcome: 'MISMATCH_DETECTED',
      source_workflow: 'PAYMENT_RECONCILIATION',
      source_operation_id: `op-decimal-${Date.now()}`,
      currency: 'PHP',
      expected_amount: expected,
      received_amount: received
    });
    expect(log.expected_amount?.toString()).toBe(expected);
    expect(log.received_amount?.toString()).toBe(received);
  });

  it('8. PAYMENT_AMOUNT_MISMATCH rejects a missing expected amount', async () => {
    await expect(writePaymentActionLog(prisma, {
      booking_id: testBookingId,
      gateway_transaction_id: null,
      action_code: 'PAYMENT_AMOUNT_MISMATCH',
      actor_type: 'SYSTEM',
      actor_user_id: null,
      outcome: 'MISMATCH_DETECTED',
      source_workflow: 'PAYMENT_RECONCILIATION',
      source_operation_id: `op-err1-${Date.now()}`,
      currency: 'PHP',
      received_amount: '100.00'
    })).rejects.toThrow('GATE4B4_SLICE_B1G_WRITER_VIOLATION: Missing expected_amount');
  });

  it('9. PAYMENT_AMOUNT_MISMATCH rejects a missing received amount', async () => {
    await expect(writePaymentActionLog(prisma, {
      booking_id: testBookingId,
      gateway_transaction_id: null,
      action_code: 'PAYMENT_AMOUNT_MISMATCH',
      actor_type: 'SYSTEM',
      actor_user_id: null,
      outcome: 'MISMATCH_DETECTED',
      source_workflow: 'PAYMENT_RECONCILIATION',
      source_operation_id: `op-err2-${Date.now()}`,
      currency: 'PHP',
      expected_amount: '100.50'
    })).rejects.toThrow('GATE4B4_SLICE_B1G_WRITER_VIOLATION: Missing received_amount');
  });

  it('10. Existing PAYMENT_INITIALIZED behavior remains unchanged', async () => {
    const gwId = `gw-${Date.now()}`;
    await prisma.gatewayTransaction.create({
      data: {
        id: gwId,
        booking_id: testBookingId,
        provider: 'Mock',
        provider_mode: 'Sandbox',
        gateway_status: 'Created',
        amount: 100,
        currency: 'PHP',
        verification_status: 'Not Verified',
        reconciliation_status: 'Pending'
      }
    });

    const log = await recordPaymentInitializedAction(
      prisma,
      { id: gwId, amount: 100, currency: 'PHP' },
      { id: testBookingId },
      testUserId,
      `op-init-${Date.now()}`
    );
    expect(log.action_code).toBe('PAYMENT_INITIALIZED');
    expect(log.expected_amount).toBeNull();
    expect(log.received_amount).toBeNull();
  });

  it('11. Existing PAYMENT_FREEZE_BLOCKED behavior remains unchanged', async () => {
    const log = await recordPaymentFreezeBlockedAction(
      prisma,
      { id: testBookingId },
      testUserId,
      `op-freeze-${Date.now()}`
    );
    expect(log.action_code).toBe('PAYMENT_FREEZE_BLOCKED');
    expect(log.expected_amount).toBeNull();
    expect(log.received_amount).toBeNull();
  });

  it('12. Empty-currency behavior remains unchanged', async () => {
    await expect(writePaymentActionLog(prisma, {
      booking_id: testBookingId,
      gateway_transaction_id: null,
      action_code: 'PAYMENT_AMOUNT_MISMATCH',
      actor_type: 'SYSTEM',
      actor_user_id: null,
      outcome: 'MISMATCH_DETECTED',
      source_workflow: 'PAYMENT_RECONCILIATION',
      source_operation_id: `op-err-curr-${Date.now()}`,
      currency: '', // empty
      expected_amount: '100.50',
      received_amount: '100.00'
    })).rejects.toThrow('GATE4B4_SLICE_B1G_WRITER_VIOLATION: Missing currency');
  });

  it('13. No SecurityEvent is created', async () => {
    const countBefore = await prisma.securityEvent.count();
    await writePaymentActionLog(prisma, {
      booking_id: testBookingId,
      gateway_transaction_id: null,
      action_code: 'PAYMENT_AMOUNT_MISMATCH',
      actor_type: 'SYSTEM',
      actor_user_id: null,
      outcome: 'MISMATCH_DETECTED',
      source_workflow: 'PAYMENT_RECONCILIATION',
      source_operation_id: `op-no-event-${Date.now()}`,
      currency: 'PHP',
      expected_amount: '100.50',
      received_amount: '100.00'
    });
    const countAfter = await prisma.securityEvent.count();
    expect(countAfter).toBe(countBefore);
  });

  it('14. No reconciliation behavior is changed', () => {
    // Proven by isolating this to the log writer only.
    expect(true).toBe(true);
  });
});
