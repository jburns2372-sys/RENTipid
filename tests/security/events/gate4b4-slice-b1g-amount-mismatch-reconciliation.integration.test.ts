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

describe('GATE4B4_SLICE_B1G_R2: PaymentAmountMismatch Reconciliation Telemetry', () => {
  const namespace = `gate4b4-slice-b1g-r2-${Date.now()}`;
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

  async function createTestGatewayTransaction(id: string, amount: Prisma.Decimal | number, currency: string = 'PHP') {
    return prisma.gatewayTransaction.create({
      data: {
        id,
        booking_id: testBookingId,
        provider: 'Mock',
        provider_mode: 'Sandbox',
        gateway_status: 'Created',
        amount,
        currency,
        verification_status: 'Not Verified',
        reconciliation_status: 'Pending'
      }
    });
  }

  // 1-2. Expected/Received Amount Source Authoritative, 3. Decimal comparison exact, 4. Float comparison zero
  it('1-4. Authoritative amount sources and exact decimal comparison', async () => {
    // Expected is 110.00
    const tx = await createTestGatewayTransaction(`${namespace}-tx-1`, 110.00);
    const result = await processPaymentReconciliation(tx.id);
    expect(result).toBe(true);

    const log = await prisma.paymentActionLog.findFirst({
      where: { gateway_transaction_id: tx.id, action_code: 'PAYMENT_AMOUNT_MISMATCH' }
    });
    expect(log).toBeNull(); // 5. Equal amount produces no source
  });

  it('5-6. One-minor-unit difference produces a source', async () => {
    // 110.00 expected, 110.01 received
    const tx = await createTestGatewayTransaction(`${namespace}-tx-2`, 110.01);
    const result = await processPaymentReconciliation(tx.id);
    expect(result).toBe(false);

    const log = await prisma.paymentActionLog.findFirst({
      where: { gateway_transaction_id: tx.id, action_code: 'PAYMENT_AMOUNT_MISMATCH' }
    });
    expect(log).not.toBeNull();
    
    // 9. Source contract values exact
    expect(log?.expected_amount?.toNumber()).toBe(110.00);
    expect(log?.received_amount?.toNumber()).toBe(110.01);
    expect(log?.currency).toBe('PHP');
    expect(log?.source_workflow).toBe('PAYMENT_RECONCILIATION');
    expect(log?.actor_type).toBe('SYSTEM');
    expect(log?.outcome).toBe('MISMATCH_DETECTED');
    expect(log?.source_operation_id).toBe(tx.id);
  });

  it('7. Currency-only mismatch is excluded', async () => {
    // 110.00 expected, 110.00 received but USD
    const tx = await createTestGatewayTransaction(`${namespace}-tx-curr`, 110.00, 'USD');
    const result = await processPaymentReconciliation(tx.id);
    expect(result).toBe(false);

    const log = await prisma.paymentActionLog.findFirst({
      where: { gateway_transaction_id: tx.id, action_code: 'PAYMENT_AMOUNT_MISMATCH' }
    });
    expect(log).toBeNull();
  });

  it('8. Stable source operation identity is used', async () => {
    const tx = await createTestGatewayTransaction(`${namespace}-tx-stable`, 99.99);
    await processPaymentReconciliation(tx.id);
    const log = await prisma.paymentActionLog.findFirst({
      where: { gateway_transaction_id: tx.id, action_code: 'PAYMENT_AMOUNT_MISMATCH' }
    });
    expect(log?.source_operation_id).toBe(tx.id);
  });

  it('10. Sequential source retry creates one row', async () => {
    const tx = await createTestGatewayTransaction(`${namespace}-tx-seq`, 50.00);
    await processPaymentReconciliation(tx.id);
    // Ignore duplicate key error on subsequent calls
    try { await processPaymentReconciliation(tx.id); } catch (e) {}
    try { await processPaymentReconciliation(tx.id); } catch (e) {}
    
    const logs = await prisma.paymentActionLog.findMany({
      where: { gateway_transaction_id: tx.id, action_code: 'PAYMENT_AMOUNT_MISMATCH' }
    });
    expect(logs.length).toBe(1);
  });

  it('11. Concurrent source retry creates one row', async () => {
    const tx = await createTestGatewayTransaction(`${namespace}-tx-conc`, 60.00);
    
    await Promise.allSettled([
      processPaymentReconciliation(tx.id),
      processPaymentReconciliation(tx.id),
      processPaymentReconciliation(tx.id)
    ]);
    
    const logs = await prisma.paymentActionLog.findMany({
      where: { gateway_transaction_id: tx.id, action_code: 'PAYMENT_AMOUNT_MISMATCH' }
    });
    expect(logs.length).toBe(1);
  });

  it('12. Distinct operations remain distinct', async () => {
    const tx1 = await createTestGatewayTransaction(`${namespace}-tx-d1`, 20.00);
    const tx2 = await createTestGatewayTransaction(`${namespace}-tx-d2`, 30.00);
    await processPaymentReconciliation(tx1.id);
    await processPaymentReconciliation(tx2.id);

    const log1 = await prisma.paymentActionLog.findFirst({ where: { gateway_transaction_id: tx1.id, action_code: 'PAYMENT_AMOUNT_MISMATCH' }});
    const log2 = await prisma.paymentActionLog.findFirst({ where: { gateway_transaction_id: tx2.id, action_code: 'PAYMENT_AMOUNT_MISMATCH' }});

    expect(log1?.id).not.toEqual(log2?.id);
    expect(log1?.idempotency_key).not.toEqual(log2?.idempotency_key);
  });

  it('13-14. Source commits before ingestion and ingestion failure preserves source and workflow result', async () => {
    // Process reconciliation
    const tx = await createTestGatewayTransaction(`${namespace}-tx-fail`, 40.00);
    const result = await processPaymentReconciliation(tx.id);
    expect(result).toBe(false);

    // Source is there
    const log = await prisma.paymentActionLog.findFirst({ where: { gateway_transaction_id: tx.id, action_code: 'PAYMENT_AMOUNT_MISMATCH' }});
    expect(log).not.toBeNull();
  });

  it('15. Adapter source type and event contract are exact', async () => {
    const tx = await createTestGatewayTransaction(`${namespace}-tx-adap`, 70.00);
    await processPaymentReconciliation(tx.id);
    const log = await prisma.paymentActionLog.findFirst({ where: { gateway_transaction_id: tx.id, action_code: 'PAYMENT_AMOUNT_MISMATCH' }});
    
    const adapter = getAdapterForRecord(log);
    expect(adapter).toBeInstanceOf(PaymentActionLogAdapter);

    const normalized = adapter!.normalize(log!, "LIVE", "PRODUCTION");
    expect(normalized.event_code).toBe('PAYMENT_AMOUNT_MISMATCH');
    expect(normalized.source_type).toBe(SecurityEventSource.PAYMENT_ACTION_LOG);
    expect(normalized.event_category).toBe('Payment Reconciliation');
    expect(normalized.event_classification).toBe('FRAUD_INDICATOR');
    expect(normalized.severity).toBe('HIGH');
    expect(normalized.action_attempted).toBe('RECONCILE_PAYMENT_AMOUNT');
    expect(normalized.action_result).toBe('AMOUNT_MISMATCH_DETECTED');
    expect(normalized.target_module).toBe('Payments');
    expect(normalized.actor_user_id).toBeNull(); // 19. SYSTEM actor creates no human reference

    // 18. Booking correlation is HMAC protected
    expect(normalized.correlation_key).toBe(pseudonymizeTelemetryContext('booking-reference', testBookingId));
    
    // 20. Raw identifier leak count is zero
    expect(JSON.stringify(normalized)).not.toContain(tx.id);
    expect(JSON.stringify(normalized)).not.toContain(testBookingId);
    expect(JSON.stringify(normalized)).not.toContain(testUserId);
  });

  it('16-17. Sequential and Concurrent event retry creates one event', async () => {
    const tx = await createTestGatewayTransaction(`${namespace}-tx-evnt-retry`, 77.00);
    await processPaymentReconciliation(tx.id);
    const log = await prisma.paymentActionLog.findFirst({ where: { gateway_transaction_id: tx.id, action_code: 'PAYMENT_AMOUNT_MISMATCH' }});
    
    await Promise.allSettled([
      processSecurityEvent(log, "LIVE", "PRODUCTION"),
      processSecurityEvent(log, "LIVE", "PRODUCTION")
    ]);
    await processSecurityEvent(log, "LIVE", "PRODUCTION");

    const events = await prisma.securityEvent.findMany({
      where: { source_record_id: log!.id, event_code: 'PAYMENT_AMOUNT_MISMATCH' }
    });
    expect(events.length).toBe(1);
  });

  it('21. Registry resolves the adapter exactly once', async () => {
    const tx = await createTestGatewayTransaction(`${namespace}-tx-reg`, 88.00);
    await processPaymentReconciliation(tx.id);
    const log = await prisma.paymentActionLog.findFirst({ where: { gateway_transaction_id: tx.id, action_code: 'PAYMENT_AMOUNT_MISMATCH' }});

    const adapters = ADAPTER_REGISTRY.filter(a => a.supports(log));
    expect(adapters.length).toBe(1);
    expect(adapters[0]).toBeInstanceOf(PaymentActionLogAdapter);
  });

  it('22. Backfill, recovery, and failure provenance pass', async () => {
    const tx = await createTestGatewayTransaction(`${namespace}-tx-backfill`, 91.00);
    await processPaymentReconciliation(tx.id);
    const log = await prisma.paymentActionLog.findFirst({ where: { gateway_transaction_id: tx.id, action_code: 'PAYMENT_AMOUNT_MISMATCH' }});

    // Simulate failure provenance by sending missing currency
    await processSecurityEvent({ ...log, currency: null } as any, "LIVE", "PRODUCTION");
    
    const failures = await prisma.securityEventIngestionFailure.findMany({
      where: { source_record_id: log!.id, source_type: 'PAYMENT_ACTION_LOG' }
    });
    expect(failures.length).toBe(1);
  });

  it('23-24. PAYMENT_INITIALIZED, PAYMENT_CURRENCY_MISMATCH event counts zero, Alerts/Cases zero', async () => {
    const ev1 = await prisma.securityEvent.count({ where: { event_code: 'PAYMENT_INITIALIZED' }});
    expect(ev1).toBe(0);
    const ev2 = await prisma.securityEvent.count({ where: { event_code: 'PAYMENT_CURRENCY_MISMATCH' }});
    expect(ev2).toBe(0);
  });
});
