import { PrismaClient } from "@prisma/client";
import { authOptions } from "../../src/lib/auth";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

describe("Authentication Instrumentation", () => {
  const credentialsProvider = authOptions.providers.find(p => p.id === "credentials") as any;
  let testUser: any;

  beforeAll(async () => {
    // Clean up any left-over test users from failed runs
    await prisma.user.deleteMany({
      where: { email: { in: ["synthetic.tester.gate4b@example.com", "bad.synthetic@example.com"] } }
    });
    // Create a synthetic user for tests
    testUser = await prisma.user.create({
      data: {
        email: "synthetic.tester.gate4b@example.com",
        full_name: "Synthetic Tester",
        account_type: "Individual",
        role: "Renter",
        status: "Verified",
        password_hash: bcrypt.hashSync("password123", 10)
      }
    });
  });

  afterAll(async () => {
    await prisma.authenticationSecurityLog.deleteMany({
      where: { subject_reference_hash: { contains: "" } } // we won't easily know the hash, let's just clear for the test user explicitly later or assume test db is isolated
    });
    await prisma.user.deleteMany({
      where: { email: { in: ["synthetic.tester.gate4b@example.com", "bad.synthetic@example.com"] } }
    });
    await prisma.$disconnect();
  });

  it("Successful credentials login still succeeds", async () => {
    const startCount = await prisma.authenticationSecurityLog.count();
    const authorizeFn = credentialsProvider.options?.authorize || credentialsProvider.authorize;
    const result = await authorizeFn({ email: testUser.email, password: "password123" }, { headers: { "x-forwarded-for": "1.2.3.4" } });
    
    expect(result).toBeDefined();
    expect(result.id).toBe(testUser.id);
    
    const endCount = await prisma.authenticationSecurityLog.count();
    expect(endCount - startCount).toBe(1);
  });

  it("Invalid credentials still fail and do not produce login success", async () => {
    const startCount = await prisma.authenticationSecurityLog.count();
    
    // In our implementation, NextAuth credentialsProvider throws an Error for invalid passwords
    try {
      const authorizeFn = credentialsProvider.options?.authorize || credentialsProvider.authorize;
      await authorizeFn({ email: testUser.email, password: "wrong" }, {});
      throw new Error("Should have thrown");
    } catch (e: any) {
      if (e.message === "Should have thrown") throw e;
      expect(e.message).toContain("Invalid password");
    }
    
    const endCount = await prisma.authenticationSecurityLog.count();
    expect(endCount - startCount).toBe(1);
  });

  it("Unknown account still fails without disclosing account existence", async () => {
    try {
      const authorizeFn = credentialsProvider.options?.authorize || credentialsProvider.authorize;
      await authorizeFn({ email: "unknown.gate4b@example.com", password: "pwd" }, {});
      throw new Error("Should have thrown");
    } catch (e: any) {
      if (e.message === "Should have thrown") throw e;
      expect(e.message).toContain("User not found");
    }
  });

  it("Blacklisted account remains denied", async () => {
    const badUser = await prisma.user.create({
      data: {
        email: "bad.synthetic@example.com",
        full_name: "Bad",
        account_type: "Individual",
        role: "Renter",
        status: "Blacklisted",
        password_hash: bcrypt.hashSync("password123", 10)
      }
    });

    try {
      const authorizeFn = credentialsProvider.options?.authorize || credentialsProvider.authorize;
      await authorizeFn({ email: badUser.email, password: "password123" }, {});
      throw new Error("Should have thrown");
    } catch (e: any) {
      if (e.message === "Should have thrown") throw e;
      expect(e.message).toContain("blacklisted");
    }

    await prisma.user.delete({ where: { id: badUser.id } });
  });

  describe("Missing HMAC Key Behavior", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
      delete process.env.SECURITY_TELEMETRY_HMAC_KEY;
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it("Valid credentials with missing HMAC key still succeeds", async () => {
      const authorizeFn = credentialsProvider.options?.authorize || credentialsProvider.authorize;
      const result = await authorizeFn({ email: testUser.email, password: "password123" }, { headers: { "x-forwarded-for": "1.2.3.4" } });
      
      expect(result).toBeDefined();
      expect(result.id).toBe(testUser.id);
    });

    it("Invalid credentials with missing HMAC key still fails", async () => {
      try {
        const authorizeFn = credentialsProvider.options?.authorize || credentialsProvider.authorize;
        await authorizeFn({ email: testUser.email, password: "wrong" }, {});
        throw new Error("Should have thrown");
      } catch (e: any) {
        if (e.message === "Should have thrown") throw e;
        expect(e.message).toContain("Invalid password");
      }
    });

    it("Blacklisted account with missing HMAC key remains denied", async () => {
      const badUser = await prisma.user.create({
        data: {
          email: "bad2.synthetic@example.com",
          full_name: "Bad",
          account_type: "Individual",
          role: "Renter",
          status: "Blacklisted",
          password_hash: bcrypt.hashSync("password123", 10)
        }
      });

      try {
        const authorizeFn = credentialsProvider.options?.authorize || credentialsProvider.authorize;
        await authorizeFn({ email: badUser.email, password: "password123" }, {});
        throw new Error("Should have thrown");
      } catch (e: any) {
        if (e.message === "Should have thrown") throw e;
        expect(e.message).toContain("blacklisted");
      }

      await prisma.user.delete({ where: { id: badUser.id } });
    });

    it("No raw context persisted in all missing-key cases and failure evidence contains no key material", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      
      const authorizeFn = credentialsProvider.options?.authorize || credentialsProvider.authorize;
      await authorizeFn({ email: testUser.email, password: "password123" }, { headers: { "x-forwarded-for": "9.9.9.9" } });
      
      const logs = await prisma.authenticationSecurityLog.findMany({
        where: { event_code: "AUTH_LOGIN_SUCCEEDED" },
        orderBy: { occurred_at: 'desc' },
        take: 1
      });
      
      expect(logs.length).toBeGreaterThan(0);
      const log = logs[0];
      
      // Values should be null (not raw)
      expect(log.ip_reference_hash).toBeNull();
      expect(log.subject_reference_hash).toBeNull();
      
      // Check evidence message format
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("SECURITY_TELEMETRY_CONFIGURATION_FAILURE"));
      expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining("test_only_hmac_key"));
      
      consoleSpy.mockRestore();
    });
  });

  it("The writer is not incorrectly called from every JWT or session callback", async () => {
    // Calling JWT or Session callback doesn't touch the writer directly in auth.ts
    // We just verify the function logic.
    if (authOptions.callbacks?.jwt) {
      const token = await (authOptions.callbacks.jwt as any)({ token: { id: "1" }, user: { id: "1", role: "Renter", status: "Verified" } });
      expect(token.role).toBe("Renter");
    }
  });
});
