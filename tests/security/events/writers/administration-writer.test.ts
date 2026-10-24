import { logAdministrationEvent } from "@/lib/security/events/writers/administration-writer";
import { PrismaClient } from "@prisma/client";
import { SecurityEnvironment, SecurityLifecycle } from "@/lib/security/events/taxonomy";

const prisma = new PrismaClient();

describe("Administration Writer Validation", () => {
  beforeAll(async () => {
    await prisma.auditLog.deleteMany({
      where: { module: "TestModule" }
    });
    await prisma.user.upsert({
      where: { id: "user-123" },
      update: { role: "Guest", status: "Verified" },
      create: {
        id: "user-123",
        email: "admin-test@example.com",
        full_name: "Admin Test",
        role: "Guest",
        status: "Verified",
        password_hash: "hash",
        account_type: "Individual"
      }
    });
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({
      where: { module: "TestModule" }
    });
    await prisma.user.deleteMany({
      where: { id: "user-123" }
    });
    await prisma.$disconnect();
  });

  it("should persist an AuditLog record and defer ingestion safely", async () => {
    await logAdministrationEvent({
      action: "TEST_ACTION",
      outcome: "COMPLETED",
      actorUserId: "user-123",
      targetType: "TestModule",
      targetId: "target-456",
      metadata: { foo: "bar" }
    });

    // We must wait a tiny bit since processSecurityEvent might be async in the background
    await new Promise(resolve => setTimeout(resolve, 100));

    const log = await prisma.auditLog.findFirst({
      where: { module: "TestModule", action: "TEST_ACTION" }
    });

    expect(log).not.toBeNull();
    expect(log?.actor_user_id).toBe("user-123");
    expect(log?.target_id).toBe("target-456");

    const details = JSON.parse(log?.details || "{}");
    expect(details.foo).toBe("bar");
  });

  it("should strip PII/secrets from the metadata context", async () => {
    await logAdministrationEvent({
      action: "TEST_SANITIZE",
      outcome: "COMPLETED",
      actorUserId: "user-123",
      targetType: "TestModule",
      targetId: "target-789",
      metadata: {
        safeKey: "safeValue",
        passwordHash: "secret123",
        api_token: "abc",
        secret_key: "xyz",
        user_email: "test@example.com",
        phone_number: "1234567890"
      }
    });

    const log = await prisma.auditLog.findFirst({
      where: { module: "TestModule", action: "TEST_SANITIZE" }
    });

    expect(log).not.toBeNull();
    const details = JSON.parse(log?.details || "{}");
    expect(details.safeKey).toBe("safeValue");
    expect(details.passwordHash).toBeUndefined();
    expect(details.api_token).toBeUndefined();
    expect(details.secret_key).toBeUndefined();
    expect(details.user_email).toBeUndefined();
    expect(details.phone_number).toBeUndefined();
  });
});
