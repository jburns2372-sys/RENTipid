import { PrismaClient } from "@prisma/client";
import { processSecurityEvent } from "@/lib/security/events/event-ingestion";
import { getAdapterForRecord } from "@/lib/security/events/adapters/registry";

const prisma = new PrismaClient();

describe("System Setting Idempotency Validation", () => {
  beforeAll(async () => {
    await prisma.securityEvent.deleteMany({
      where: { source_type: "SYSTEM_SETTING" }
    });
    await prisma.systemSetting.deleteMany({
      where: { setting_key: "TEST_SETTING_IDEMPOTENCY" }
    });
  });

  afterAll(async () => {
    await prisma.securityEvent.deleteMany({
      where: { source_type: "SYSTEM_SETTING" }
    });
    await prisma.systemSetting.deleteMany({
      where: { setting_key: "TEST_SETTING_IDEMPOTENCY" }
    });
    await prisma.$disconnect();
  });

  it("should generate exactly one SecurityEvent and block re-ingestion idempotently", async () => {
    // 1. Create a SystemSetting mutation
    const setting = await prisma.systemSetting.create({
      data: {
        setting_key: "TEST_SETTING_IDEMPOTENCY",
        setting_value: "enabled"
      }
    });

    // 2. Ingest first time
    await processSecurityEvent(setting, "LIVE", "PRODUCTION");

    const eventsAfterFirst = await prisma.securityEvent.findMany({
      where: { source_record_id: setting.id, source_type: "SYSTEM_SETTING" }
    });

    expect(eventsAfterFirst.length).toBe(1);

    // 3. Re-ingest the exact same object
    await processSecurityEvent(setting, "LIVE", "PRODUCTION");

    const eventsAfterSecond = await prisma.securityEvent.findMany({
      where: { source_record_id: setting.id, source_type: "SYSTEM_SETTING" }
    });

    // Count should still be 1 (blocked idempotently)
    expect(eventsAfterSecond.length).toBe(1);
  });
});
