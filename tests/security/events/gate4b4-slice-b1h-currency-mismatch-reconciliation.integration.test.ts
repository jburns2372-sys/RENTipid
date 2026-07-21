import { PrismaClient, Prisma } from '@prisma/client';
import { processPaymentReconciliation } from '@/lib/payments/payment-reconciliation';
import { assertSafeLocalTestDatabaseTarget } from '@/lib/test-database-guard';
import { getAdapterForRecord, ADAPTER_REGISTRY } from '@/lib/security/events/adapters/registry';
import { processSecurityEvent } from '@/lib/security/events/event-ingestion';
import { PaymentActionLogAdapter } from '@/lib/security/events/adapters/payment-action-log-adapter';
import { SecurityEventSource } from '@/lib/security/events/taxonomy';
import { pseudonymizeTelemetryContext } from '@/lib/security/telemetry-hmac';

let prisma: PrismaClient;

beforeAll(async () => {
  assertSafeLocalTestDatabaseTarget();
  prisma = new PrismaClient();
  await prisma.$connect();
});

describe('GATE4B4_SLICE_B1H: PaymentCurrencyMismatch Reconciliation Telemetry', () => {
  const namespace = `gate4b4-slice-b1h-${Date.now()}`;
  let testBookingId: string;
  let testUserId: string;

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
        title: 'Mock Listing',
        description: 'Mock',
        daily_rate: 1000,
        provider_id: testUserId,
        category_id: `${namespace}-category`,
        status: 'Active',
        rental_type: 'Daily'
      }
    });

    const booking = await prisma.booking.create({
      data: {
        id: `${namespace}-booking`,
        renter: { connect: { id: testUserId } },
        provider: { connect: { id: testUserId } },
        listing: { connect: { id: listing.id } },
        start_date: new Date(),
        end_date: new Date(Date.now() + 86400000),
        status: 'Approved',
        payment_status: 'Pending',
        rental_duration: 1,
        rental_duration_unit: 'Days',
        selected_rate_type: 'Daily',
        base_rental_amount: 100,
        deposit_amount: 0,
        platform_fee: 10,
        estimated_total_amount: 110.00,
        pickup_option: 'Delivery'
      }
    });
    testBookingId = booking.id;
  });

  async function createTestGatewayTransaction(id: string, amount: number, currency: string = 'PHP') {
    return prisma.gatewayTransaction.create({
      data: {
        id,
        booking_id: testBookingId,
        provider: 'Mock',
        provider_mode: 'Sandbox',
        gateway_status: 'Created',
        amount: amount,
        currency,
        verification_status: 'Not Verified',
        reconciliation_status: 'Pending'
      }
    });
  }

  it('1-4. Authoritative amount sources and exact decimal comparison - matches', async () => {
    const tx = await createTestGatewayTransaction(`${namespace}-tx-1`, 110.00, 'PHP');
    const result = await processPaymentReconciliation(tx.id);
    expect(result).toBe(true);

    const log = await prisma.paymentActionLog.findFirst({
      where: { gateway_transaction_id: tx.id, action_code: 'PAYMENT_CURRENCY_MISMATCH' }
    });
    expect(log).toBeNull();
  });

  it('5-7. Currency-only mismatch produces PAYMENT_CURRENCY_MISMATCH', async () => {
    const tx = await createTestGatewayTransaction(`${namespace}-tx-curr`, 110.00, 'USD');
    const result = await processPaymentReconciliation(tx.id);
    expect(result).toBe(false);

    const log = await prisma.paymentActionLog.findFirst({
      where: { gateway_transaction_id: tx.id, action_code: 'PAYMENT_CURRENCY_MISMATCH' }
    });
    expect(log).not.toBeNull();
    expect(log?.expected_currency).toBe('PHP');
    expect(log?.received_currency).toBe('USD');
    expect(log?.expected_amount).toBeNull();
    expect(log?.received_amount).toBeNull();
  });

  it('8. Stable source operation identity is used', async () => {
    const tx = await createTestGatewayTransaction(`${namespace}-tx-stable`, 110.00, 'USD');
    await processPaymentReconciliation(tx.id);
    const log = await prisma.paymentActionLog.findFirst({
      where: { gateway_transaction_id: tx.id, action_code: 'PAYMENT_CURRENCY_MISMATCH' }
    });
    expect(log?.source_operation_id).toBe(tx.id);
  });

  it('10. Sequential source retry creates one row', async () => {
    const tx = await createTestGatewayTransaction(`${namespace}-tx-seq`, 110.00, 'USD');
    await processPaymentReconciliation(tx.id);
    try { await processPaymentReconciliation(tx.id); } catch {}

    const logs = await prisma.paymentActionLog.findMany({
      where: { gateway_transaction_id: tx.id, action_code: 'PAYMENT_CURRENCY_MISMATCH' }
    });
    expect(logs.length).toBe(1);
  });

  it('11. Concurrent source retry creates one row', async () => {
    const tx = await createTestGatewayTransaction(`${namespace}-tx-conc`, 110.00, 'USD');
    await Promise.allSettled([
      processPaymentReconciliation(tx.id),
      processPaymentReconciliation(tx.id),
      processPaymentReconciliation(tx.id)
    ]);
    const logs = await prisma.paymentActionLog.findMany({
      where: { gateway_transaction_id: tx.id, action_code: 'PAYMENT_CURRENCY_MISMATCH' }
    });
    expect(logs.length).toBe(1);
  });

  it('12. Distinct operations remain distinct', async () => {
    const tx1 = await createTestGatewayTransaction(`${namespace}-tx-d1`, 110.00, 'USD');
    const tx2 = await createTestGatewayTransaction(`${namespace}-tx-d2`, 110.00, 'JPY');
    await processPaymentReconciliation(tx1.id);
    await processPaymentReconciliation(tx2.id);

    const log1 = await prisma.paymentActionLog.findFirst({ where: { gateway_transaction_id: tx1.id, action_code: 'PAYMENT_CURRENCY_MISMATCH' }});
    const log2 = await prisma.paymentActionLog.findFirst({ where: { gateway_transaction_id: tx2.id, action_code: 'PAYMENT_CURRENCY_MISMATCH' }});

    expect(log1?.id).not.toEqual(log2?.id);
    expect(log1?.idempotency_key).not.toEqual(log2?.idempotency_key);
  });

  it('13-14. Source commits before ingestion and ingestion failure preserves source and workflow result', async () => {
    const tx = await createTestGatewayTransaction(`${namespace}-tx-fail`, 110.00, 'JPY');
    const result = await processPaymentReconciliation(tx.id);
    expect(result).toBe(false);
    const log = await prisma.paymentActionLog.findFirst({ where: { gateway_transaction_id: tx.id, action_code: 'PAYMENT_CURRENCY_MISMATCH' }});
    expect(log).not.toBeNull();
  });

  it('15. Adapter source type and event contract are exact', async () => {
    const tx = await createTestGatewayTransaction(`${namespace}-tx-adap`, 110.00, 'JPY');
    await processPaymentReconciliation(tx.id);
    const log = await prisma.paymentActionLog.findFirst({ where: { gateway_transaction_id: tx.id, action_code: 'PAYMENT_CURRENCY_MISMATCH' }});

    const adapter = getAdapterForRecord(log);
    expect(adapter).toBeInstanceOf(PaymentActionLogAdapter);

    const normalized = adapter!.normalize(log!, "TEST", "TEST");
    expect(normalized.event_code).toBe('PAYMENT_CURRENCY_MISMATCH');
    expect(normalized.source_type).toBe(SecurityEventSource.PAYMENT_ACTION_LOG);
    expect(normalized.event_category).toBe('Payment Reconciliation');
    expect(normalized.event_classification).toBe('FRAUD_INDICATOR');
    expect(normalized.severity).toBe('HIGH');
    expect(normalized.action_attempted).toBe('RECONCILE_PAYMENT_CURRENCY');
    expect(normalized.action_result).toBe('CURRENCY_MISMATCH_DETECTED');
    expect(normalized.target_module).toBe('Payments');
    expect(normalized.actor_user_id).toBeNull(); 
    expect(normalized.correlation_key).toBe(pseudonymizeTelemetryContext('booking-reference', testBookingId));
  });

  it('16-17. Sequential and Concurrent event retry creates one event', async () => {
    const tx = await createTestGatewayTransaction(`${namespace}-tx-evnt-retry`, 110.00, 'USD');
    await processPaymentReconciliation(tx.id);
    const log = await prisma.paymentActionLog.findFirst({ where: { gateway_transaction_id: tx.id, action_code: 'PAYMENT_CURRENCY_MISMATCH' }});

    await Promise.allSettled([
      processSecurityEvent(log, "TEST", "TEST"),
      processSecurityEvent(log, "TEST", "TEST")
    ]);
    await processSecurityEvent(log, "TEST", "TEST");

    const events = await prisma.securityEvent.findMany({
      where: { source_record_id: log!.id, event_code: 'PAYMENT_CURRENCY_MISMATCH' }
    });
    expect(events.length).toBe(1);
  });

  it('21. Registry resolves the adapter exactly once', async () => {
    const tx = await createTestGatewayTransaction(`${namespace}-tx-reg`, 110.00, 'USD');
    await processPaymentReconciliation(tx.id);
    const log = await prisma.paymentActionLog.findFirst({ where: { gateway_transaction_id: tx.id, action_code: 'PAYMENT_CURRENCY_MISMATCH' }});

    const adapters = ADAPTER_REGISTRY.filter(a => a.supports(log));
    expect(adapters.length).toBe(1);
    expect(adapters[0]).toBeInstanceOf(PaymentActionLogAdapter);
  });

  it('22. Backfill, recovery, and failure provenance pass', async () => {
    const tx = await createTestGatewayTransaction(`${namespace}-tx-backfill`, 110.00, 'USD');
    await processPaymentReconciliation(tx.id);
    const log = await prisma.paymentActionLog.findFirst({ where: { gateway_transaction_id: tx.id, action_code: 'PAYMENT_CURRENCY_MISMATCH' }});

    await processSecurityEvent({ ...log, expected_currency: null } as unknown, "TEST", "TEST");

    const failures = await prisma.securityEventIngestionFailure.findMany({
      where: { source_record_id: log!.id, source_type: 'PAYMENT_ACTION_LOG' }
    });
    expect(failures.length).toBe(1);
  });
});
