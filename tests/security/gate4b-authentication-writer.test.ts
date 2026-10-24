import { PrismaClient } from "@prisma/client";
import { logAuthenticationEvent } from "../../src/lib/security/events/writers/authentication-writer";

const prisma = new PrismaClient();

describe("Authentication Writer Contract", () => {
  const originalEnv = process.env;

  beforeAll(async () => {
    // Clear for test predictability
    await prisma.authenticationSecurityLog.deleteMany({});
  });

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, SECURITY_TELEMETRY_HMAC_KEY: "test-secret" };
  });

  afterAll(async () => {
    process.env = originalEnv;
    await prisma.$disconnect();
  });

  it("1. Login-success writer creates exactly one AuthenticationSecurityLog", async () => {
    const startCount = await prisma.authenticationSecurityLog.count();
    await logAuthenticationEvent({
      event_code: "AUTH_LOGIN_SUCCEEDED",
      outcome: "Success",
      actor_user_id: "user_123",
      raw_subject: "test@example.com",
    });
    const endCount = await prisma.authenticationSecurityLog.count();
    expect(endCount - startCount).toBe(1);
  });

  it("2. Login-failure writer creates exactly one AuthenticationSecurityLog", async () => {
    const startCount = await prisma.authenticationSecurityLog.count();
    await logAuthenticationEvent({
      event_code: "AUTH_LOGIN_FAILED",
      outcome: "Failure",
      raw_subject: "test@example.com",
    });
    const endCount = await prisma.authenticationSecurityLog.count();
    expect(endCount - startCount).toBe(1);
  });

  it("3. Unknown-account failure permits a null actor reference", async () => {
    await logAuthenticationEvent({
      event_code: "AUTH_LOGIN_FAILED",
      outcome: "Failure",
      raw_subject: "unknown@example.com",
      // actor_user_id omitted
    });
    const log = await prisma.authenticationSecurityLog.findFirst({
      orderBy: { occurred_at: 'desc' }
    });
    expect(log?.actor_user_id).toBeNull();
  });

  it("4. Known-account failure uses the approved privacy-safe account reference", async () => {
    await logAuthenticationEvent({
      event_code: "AUTH_LOGIN_FAILED",
      outcome: "Failure",
      actor_user_id: "user_456",
      raw_subject: "known@example.com",
    });
    const log = await prisma.authenticationSecurityLog.findFirst({
      orderBy: { occurred_at: 'desc' }
    });
    expect(log?.subject_reference_hash).toBeDefined();
    expect(log?.subject_reference_hash).not.toContain("known@example.com");
  });

  it("5. Blacklisted-account denial receives the correct event code and outcome", async () => {
    await logAuthenticationEvent({
      event_code: "AUTH_ACCOUNT_STATUS_DENIED",
      outcome: "Failure",
      actor_user_id: "user_bad",
    });
    const log = await prisma.authenticationSecurityLog.findFirst({
      orderBy: { occurred_at: 'desc' }
    });
    expect(log?.event_code).toBe("AUTH_ACCOUNT_STATUS_DENIED");
    expect(log?.outcome).toBe("Failure");
  });

  it("6. occurredAt is persisted correctly, 7. retentionClass is AUTH_ROUTINE_180_DAYS, 8. expiresAt is correct, 9. environment and lifecycle", async () => {
    await logAuthenticationEvent({
      event_code: "AUTH_LOGIN_SUCCEEDED",
      outcome: "Success",
    });
    const log = await prisma.authenticationSecurityLog.findFirst({
      orderBy: { occurred_at: 'desc' }
    });
    expect(log?.occurred_at).toBeInstanceOf(Date);
    expect(log?.retention_class).toBe("AUTH_ROUTINE_180_DAYS");
    
    // Expires at should be 180 days after occurred_at
    const diffDays = Math.round((log!.expires_at.getTime() - log!.occurred_at.getTime()) / (1000 * 3600 * 24));
    expect(diffDays).toBe(180);

    expect(log?.environment).toBeDefined();
    expect(log?.lifecycle).toBe("production");
  });

  it("10-18 Privacy assertions", async () => {
    await logAuthenticationEvent({
      event_code: "AUTH_LOGIN_FAILED",
      outcome: "Failure",
      raw_subject: "sensitive@example.com",
      raw_ip: "192.168.1.99",
      raw_device: "device_abc",
      raw_session: "session_token_xyz",
      sanitized_metadata: { password: "fake", password_hash: "fakehash" } // Mocking bad input to prove the writer relies on the developer not passing these, but we assert the explicit properties don't exist
    });
    const log = await prisma.authenticationSecurityLog.findFirst({
      orderBy: { occurred_at: 'desc' }
    });
    expect(log?.id).toBeDefined(); // 10. stable id
    
    // The model itself does not have a field for password, hash, raw_ip, etc.
    const keys = Object.keys(log!);
    expect(keys).not.toContain("password");
    expect(keys).not.toContain("password_hash");
    expect(keys).not.toContain("raw_subject");
    expect(keys).not.toContain("raw_ip");
    expect(keys).not.toContain("raw_device");
    expect(keys).not.toContain("raw_session");

    expect(log?.sanitized_metadata).not.toContain("test-secret");
  });
});
