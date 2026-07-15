import { processSecurityEvent } from "@/lib/security/events/event-ingestion";
import { PrismaClient } from "@prisma/client";
import { SecurityEnvironment, SecurityLifecycle } from "@/lib/security/events/taxonomy";

const prisma = new PrismaClient();

describe("SOC Idempotency Hashing and Deduplication", () => {
  beforeEach(async () => {
    await prisma.securityEvent.deleteMany({
      where: { source_type: "SYSTEM_SETTING" }
    });
  });

  it("Same canonical event produces one SecurityEvent", async () => {
    const record = await prisma.systemSetting.findFirst();
    if (!record) return;

    const res1 = await processSecurityEvent(record, SecurityLifecycle.TEST, SecurityEnvironment.TEST);
    expect(res1.success).toBe(true);
    expect(res1.duplicate).toBeUndefined();

    const res2 = await processSecurityEvent(record, SecurityLifecycle.TEST, SecurityEnvironment.TEST);
    expect(res2.success).toBe(true);
    expect(res2.duplicate).toBe(true); 

    const events = await prisma.securityEvent.count({
      where: { source_type: "SYSTEM_SETTING", source_record_id: record.id, lifecycle_type: "TEST" }
    });
    expect(events).toBe(1);
  });

  it("Different lifecycle remains separate", async () => {
    const record = await prisma.systemSetting.findFirst();
    if (!record) return;

    await processSecurityEvent(record, SecurityLifecycle.TEST, SecurityEnvironment.TEST);
    await processSecurityEvent(record, SecurityLifecycle.LIVE, SecurityEnvironment.TEST);
    await processSecurityEvent(record, SecurityLifecycle.SIMULATION, SecurityEnvironment.TEST);

    const events = await prisma.securityEvent.count({
      where: { source_type: "SYSTEM_SETTING", source_record_id: record.id }
    });
    expect(events).toBe(3);
  });

  it("Different environment remains separate", async () => {
    const record = await prisma.systemSetting.findFirst();
    if (!record) return;

    await processSecurityEvent(record, SecurityLifecycle.TEST, SecurityEnvironment.DEVELOPMENT);
    await processSecurityEvent(record, SecurityLifecycle.TEST, SecurityEnvironment.STAGING);
    await processSecurityEvent(record, SecurityLifecycle.TEST, SecurityEnvironment.PRODUCTION);

    const events = await prisma.securityEvent.count({
      where: { source_type: "SYSTEM_SETTING", source_record_id: record.id, lifecycle_type: "TEST" }
    });
    expect(events).toBe(3);
  });

  it("Concurrent identical calls produce exactly one event", async () => {
    const record = await prisma.systemSetting.findFirst();
    if (!record) return;

    const p1 = processSecurityEvent(record, SecurityLifecycle.TEST, SecurityEnvironment.TEST);
    const p2 = processSecurityEvent(record, SecurityLifecycle.TEST, SecurityEnvironment.TEST);
    const p3 = processSecurityEvent(record, SecurityLifecycle.TEST, SecurityEnvironment.TEST);

    const results = await Promise.all([p1, p2, p3]);

    const nonDuplicates = results.filter(r => !r.duplicate && r.success);
    const duplicates = results.filter(r => r.duplicate && r.success);

    expect(nonDuplicates.length).toBe(1);
    expect(duplicates.length).toBe(2);

    const events = await prisma.securityEvent.count({
      where: { source_type: "SYSTEM_SETTING", source_record_id: record.id, lifecycle_type: "TEST", environment: "TEST" }
    });
    expect(events).toBe(1);
  });
});
