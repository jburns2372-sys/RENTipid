import { PrismaClient } from "@prisma/client";
import { processSecurityEvent } from "../../src/lib/security/events/event-ingestion";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

describe("Ingestion Idempotency", () => {
  let sourceId1: string;
  let sourceId2: string;

  beforeAll(async () => {
    // We only clean up records created by this test script, which we'll track by event_code prefix
  });

  afterAll(async () => {
    // Cleanup removes only records created by the current test run
    await prisma.securityEvent.deleteMany({
      where: { event_code: { startsWith: "TEST_IDEMPOTENT_" } }
    });
    await prisma.authenticationSecurityLog.deleteMany({
      where: { event_code: { startsWith: "TEST_IDEMPOTENT_" } }
    });
    await prisma.$disconnect();
  });

  it("1-10. Prove idempotency and deterministic handling without duplicates", async () => {
    // 1. One AuthenticationSecurityLog source record is created
    const runId = uuidv4();
    const eventCode = `TEST_IDEMPOTENT_LOGIN_${runId}`;
    
    const source1 = await prisma.authenticationSecurityLog.create({
      data: {
        event_code: eventCode,
        outcome: "Success",
        hmac_key_version: "v1",
        environment: "production",
        lifecycle: "production",
        retention_class: "AUTH",
        expires_at: new Date(Date.now() + 100000),
      }
    });
    sourceId1 = source1.id;

    // 2. First processSecurityEvent call creates one normalized SecurityEvent
    const res1 = await processSecurityEvent(source1, "TEST", "TEST");
    if (!res1.success) {
      console.error("INGESTION FAILURE DETAILS:", res1);
    }
    expect(res1.success).toBe(true);

    const check1 = await prisma.securityEvent.count({ where: { event_code: eventCode } });
    expect(check1).toBe(1);

    // 3. Retrying ingestion for the same source record does not create another SecurityEvent.
    // 4. The result is deterministic.
    const res2 = await processSecurityEvent(source1, "TEST", "TEST");
    expect(res2.success).toBe(true);
    expect(res2.duplicate).toBe(true);
    
    const check2 = await prisma.securityEvent.count({ where: { event_code: eventCode } });
    expect(check2).toBe(1); // Still 1

    // 5. Duplicate handling does not create duplicate ingestion-failure records.
    const failureCount = await prisma.securityEventIngestionFailure.count({
      where: { source_record_id: sourceId1 }
    });
    expect(failureCount).toBe(0);

    // 6. A distinct source record creates a distinct SecurityEvent.
    const source2 = await prisma.authenticationSecurityLog.create({
      data: {
        event_code: eventCode, // Same code but distinct record
        outcome: "Success",
        hmac_key_version: "v1",
        environment: "production",
        lifecycle: "production",
        retention_class: "AUTH",
        expires_at: new Date(Date.now() + 100000),
      }
    });
    sourceId2 = source2.id;
    const res3 = await processSecurityEvent(source2, "TEST", "TEST");
    expect(res3.success).toBe(true);

    const check3 = await prisma.securityEvent.count({ where: { event_code: eventCode } });
    expect(check3).toBe(2);

    // 7. Cleanup removes only records created by the current test run.
    await prisma.securityEvent.deleteMany({
      where: { event_code: eventCode }
    });
    await prisma.authenticationSecurityLog.deleteMany({
      where: { event_code: eventCode }
    });

    // 8, 9, 10. Residuals are zero
    const resAuth = await prisma.authenticationSecurityLog.count({ where: { event_code: eventCode }});
    const resEvent = await prisma.securityEvent.count({ where: { event_code: eventCode }});
    const resFail = await prisma.securityEventIngestionFailure.count({ where: { source_record_id: { in: [sourceId1, sourceId2] } }});
    
    expect(resAuth).toBe(0);
    expect(resEvent).toBe(0);
    expect(resFail).toBe(0);
  });
});
