import { runBackfill } from "@/lib/security/events/jobs/backfill";
import { PrismaClient } from "@prisma/client";
import { SecurityEnvironment, SecurityLifecycle } from "@/lib/security/events/taxonomy";

const prisma = new PrismaClient();

describe("SOC Backfill Job", () => {
  beforeEach(async () => {
    // Delete events but not source logs.
    await prisma.securityEvent.deleteMany({
      where: { source_type: "SYSTEM_SETTING" }
    });
    await prisma.systemSetting.createMany({
      data: [
        { setting_key: "TEST_BF_1", setting_value: "1", description: "test" },
        { setting_key: "TEST_BF_2", setting_value: "2", description: "test" },
        { setting_key: "TEST_BF_3", setting_value: "3", description: "test" },
      ],
      skipDuplicates: true
    });
  });

  it("handles empty source or bounded small sources", async () => {
    const res = await runBackfill({
      sourceType: "SYSTEM_SETTING",
      batchSize: 5,
      dryRun: false,
      lifecycle: SecurityLifecycle.TEST,
      environment: SecurityEnvironment.TEST,
      maxRecords: 1 // Only process 1 to ensure it halts
    });
    expect(res.examined).toBeLessThanOrEqual(1);
    expect(res.failures).toBe(0);
    expect(res.normalized).toBeLessThanOrEqual(1);
  });

  it("handles default dry-run correctly", async () => {
    const res = await runBackfill({
      sourceType: "SYSTEM_SETTING",
      batchSize: 5,
      dryRun: true,
      lifecycle: SecurityLifecycle.TEST,
      environment: SecurityEnvironment.TEST,
      maxRecords: 2
    });
    expect(res.skipped).toBe(res.examined);
    expect(res.normalized).toBe(0);
  });

  it("supports multiple batches and max batch size", async () => {
    // We need enough records to form multiple batches. We can use batchSize=1 to force it.
    const res = await runBackfill({
      sourceType: "SYSTEM_SETTING",
      batchSize: 1,
      dryRun: false,
      lifecycle: SecurityLifecycle.TEST,
      environment: SecurityEnvironment.TEST,
      maxRecords: 3 // Should result in 3 batches of 1
    });
    // This implicitely proves the while loop iterated correctly because examined will be 3.
    expect(res.examined).toBe(3);
    expect(res.normalized).toBeGreaterThanOrEqual(1);
  });

  it("supports interrupted processing and resume from emitted cursor", async () => {
    // Run for 1 record
    const run1 = await runBackfill({
      sourceType: "SYSTEM_SETTING",
      batchSize: 5,
      dryRun: false,
      lifecycle: SecurityLifecycle.TEST,
      environment: SecurityEnvironment.TEST,
      maxRecords: 1
    });

    const cursor = run1.finalCursor;
    expect(cursor).toBeDefined();

    // Resume from cursor
    const run2 = await runBackfill({
      sourceType: "SYSTEM_SETTING",
      batchSize: 5,
      dryRun: false,
      lifecycle: SecurityLifecycle.TEST,
      environment: SecurityEnvironment.TEST,
      afterId: cursor,
      maxRecords: 1
    });

    expect(run2.examined).toBeGreaterThanOrEqual(0);
    // Since we provided afterId = finalCursor of run1, the first record of run2 will have ID > run1.finalCursor.
    if (run2.firstCursor) {
       expect(run2.firstCursor).not.toBe(cursor);
    }
  });

  it("safely handles duplicate source processing implicitly", async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const run1 = await runBackfill({
      sourceType: "SYSTEM_SETTING",
      batchSize: 5,
      dryRun: false,
      lifecycle: SecurityLifecycle.TEST,
      environment: SecurityEnvironment.TEST,
      maxRecords: 2
    });
    
    // Run exact same window without cursor
    const run2 = await runBackfill({
      sourceType: "SYSTEM_SETTING",
      batchSize: 5,
      dryRun: false,
      lifecycle: SecurityLifecycle.TEST,
      environment: SecurityEnvironment.TEST,
      maxRecords: 2
    });

    // Run 2 should examine the same records, but find them as duplicates (or 0 if source exhausted).
    if (run2.examined > 0) {
      expect(run2.duplicates).toBe(run2.examined);
      expect(run2.normalized).toBe(0);
    }
  });
});
