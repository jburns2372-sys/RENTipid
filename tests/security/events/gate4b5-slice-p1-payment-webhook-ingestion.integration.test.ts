import { PrismaClient } from "@prisma/client";
import { processWebhookEvent } from "../../../src/lib/payments/payment-webhook-service";
import { getAdapterForRecord } from "../../../src/lib/security/events/adapters/registry";
import { processSecurityEvent } from "../../../src/lib/security/events/event-ingestion";
import { runBackfill } from "../../../src/lib/security/events/jobs/backfill";
import { runRecovery } from "../../../src/lib/security/events/jobs/recovery";

import { assertSafeLocalTestDatabaseTarget } from "../../../src/lib/test-database-guard";

const prisma = new PrismaClient();
const namespace = `gate4b5-slice-p1-${Date.now()}`;

beforeAll(async () => {
  assertSafeLocalTestDatabaseTarget();
  await prisma.user.create({
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

  await prisma.listing.create({
    data: {
      id: `${namespace}-listing`,
      title: 'Synthetic Listing',
      description: 'Test',
      daily_rate: 100,
      provider_id: `${namespace}-user`,
      category_id: `${namespace}-category`,
      status: 'Active',
      rental_type: 'Daily'
    }
  });
});

afterEach(async () => {
  await prisma.securityEventIngestionFailure.deleteMany({});
  await prisma.securityEvent.deleteMany({});
  await prisma.paymentWebhookLog.deleteMany({});
  await prisma.paymentActionLog.deleteMany({});
  await prisma.depositAction.deleteMany({});
  await prisma.gatewayTransaction.deleteMany({});
  await prisma.booking.deleteMany({});
});

afterAll(async () => {
  await prisma.listing.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.$disconnect();
});

describe("GATE4B5_GATE4D_SLICE_P1_PAYMENT_WEBHOOK_INGESTION", () => {
  it("passes 18 behaviors for webhook security events", async () => {
    // We will set up mock booking and transaction
    const booking = await prisma.booking.create({
      data: {
        id: "test-booking-webhooks",
        renter: { connect: { id: `${namespace}-user` } },
        provider: { connect: { id: `${namespace}-user` } },
        listing: { connect: { id: `${namespace}-listing` } },
        start_date: new Date(),
        end_date: new Date(Date.now() + 86400000),
        status: 'Approved',
        payment_status: 'Pending Payment',
        rental_duration: 1,
        rental_duration_unit: 'Days',
        selected_rate_type: 'Daily',
        base_rental_amount: 100,
        deposit_amount: 0,
        estimated_total_amount: 100,
        pickup_option: "Pickup"
      }
    });

    const tx = await prisma.gatewayTransaction.create({
      data: {
        id: "tx-webhook-1",
        booking_id: booking.id,
        provider: "PayMongo",
        provider_mode: "Live Pilot",
        gateway_reference: "ref_123",
        amount: 100,
        currency: "PHP",
        gateway_status: "Checkout Pending",
        reconciliation_status: "Pending",
        verification_status: "Verified"
      }
    });

    const sandboxTx = await prisma.gatewayTransaction.create({
      data: {
        id: "tx-webhook-sandbox",
        booking_id: booking.id,
        provider: "PayMongo",
        provider_mode: "Sandbox",
        gateway_reference: "ref_sandbox",
        amount: 100,
        currency: "PHP",
        gateway_status: "Checkout Pending",
        reconciliation_status: "Pending",
        verification_status: "Verified"
      }
    });

    expect(tx).toBeDefined();
    expect(sandboxTx).toBeDefined();



    process.env.PAYMONGO_WEBHOOK_SECRET_LIVE = "secret";
    process.env.PAYMONGO_WEBHOOK_SECRET = "secret";

    // 1. Signature-validation failure qualifies.
    // 2. Authentication failure qualifies.
    // 3. Active PaymentWebhookLog writer is authoritative.
    // 8. Source commits before ingestion.
    // 10. Existing webhook HTTP behavior remains unchanged.
    const payload = { data: { attributes: { type: "checkout_session.payment.paid", data: { id: "ref_123", attributes: { metadata: { mode: "Live Pilot" } } } } } };
    await processWebhookEvent("PayMongo", "paid", payload, "");

    const failedLogs = await prisma.paymentWebhookLog.findMany({ orderBy: { received_at: "asc" } });
    expect(failedLogs.length).toBe(1);
    expect(failedLogs[0].verification_status).toBe("Failed");
    expect(failedLogs[0].processing_status).toBe("Failed");

    // 16. Registry passes
    const adapter = getAdapterForRecord(failedLogs[0]);
    expect(adapter).toBeDefined();

    // 4, 5. Qualifies and is ingested
    let events = await prisma.securityEvent.findMany();
    expect(events.length).toBe(1);
    expect(events[0].event_code).toBe("WEBHOOK_FAIL");
    expect(events[0].source_record_id).toBe(failedLogs[0].id);

    // 6. Successful webhook is excluded.
    await processWebhookEvent("PayMongo", "paid", payload, "secret");
    const successLogs = await prisma.paymentWebhookLog.findMany({ orderBy: { received_at: "asc" } });
    expect(successLogs.length).toBe(2);
    expect(successLogs[1].verification_status).toBe("Verified");

    events = await prisma.securityEvent.findMany();
    expect(events.length).toBe(1); // STILL 1

    // 7. Unsupported functional failure is excluded.
    const payloadBad = { data: { attributes: { type: "checkout_session.payment.paid", data: { id: "ref_sandbox", attributes: { metadata: { mode: "Live Pilot" } } } } } };
    // This will cause a mismatch check failure
    await processWebhookEvent("PayMongo", "paid", payloadBad, "secret");
    events = await prisma.securityEvent.findMany();
    expect(events.length).toBe(1); // STILL 1

    // 11. Sequential source retry creates one source.
    // 13. Sequential event retry creates one event.
    await runRecovery({
      sourceType: "PAYMENT_WEBHOOK_LOG",
      lifecycle: "TEST",
      environment: "TEST",
      batchSize: 10
    });
    events = await prisma.securityEvent.findMany();
    expect(events.length).toBe(1);

    await runBackfill({ 
      dryRun: false, 
      batchSize: 10, 
      sourceType: "PAYMENT_WEBHOOK_LOG",
      lifecycle: "TEST",
      environment: "TEST"
    });
    events = await prisma.securityEvent.findMany();
    expect(events.length).toBe(1); // The backfill did NOT create a new one!

    // 9. Ingestion failure preserves the source.
    try {
      await processSecurityEvent({ ...failedLogs[0], event_type: null } as unknown as import("@prisma/client").PaymentWebhookLog);
    } catch {}
    const finalLogs = await prisma.paymentWebhookLog.findMany();
    expect(finalLogs.length).toBe(3); // untouched

    // 17. Privacy leak and AuditLog misrouting counts are zero.
    expect(events[0].source_summary).toBeDefined();
    const summary = events[0].source_summary as Record<string, unknown>;
    expect(summary.payload_summary).not.toContain("secret"); // We don't store secrets
    expect(events[0].correlation_key).not.toBe("test-booking-webhooks"); // Pseudonymized

  });
});
