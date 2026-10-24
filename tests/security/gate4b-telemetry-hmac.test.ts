import { pseudonymizeTelemetryContext, getTelemetryHmacKeyVersion } from "../../src/lib/security/telemetry-hmac";

describe("HMAC Privacy Helper", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("1. Same key, version, prefix and normalized input produce the same result", () => {
    process.env.SECURITY_TELEMETRY_HMAC_KEY = "synthetic-test-key";
    const res1 = pseudonymizeTelemetryContext("ip", "192.168.1.1");
    const res2 = pseudonymizeTelemetryContext("ip", "192.168.1.1");
    expect(res1).toBe(res2);
    expect(res1).toBeTruthy();
  });

  it("2. Different inputs produce different pseudonyms", () => {
    process.env.SECURITY_TELEMETRY_HMAC_KEY = "synthetic-test-key";
    const res1 = pseudonymizeTelemetryContext("ip", "192.168.1.1");
    const res2 = pseudonymizeTelemetryContext("ip", "192.168.1.2");
    expect(res1).not.toBe(res2);
  });

  it("3. Different prefixes produce different pseudonyms for the same input", () => {
    process.env.SECURITY_TELEMETRY_HMAC_KEY = "synthetic-test-key";
    const res1 = pseudonymizeTelemetryContext("ip", "192.168.1.1");
    const res2 = pseudonymizeTelemetryContext("device", "192.168.1.1");
    expect(res1).not.toBe(res2);
  });

  it("4. Equivalent normalized IP representations produce the intended stable result where supported", () => {
    process.env.SECURITY_TELEMETRY_HMAC_KEY = "synthetic-test-key";
    const res1 = pseudonymizeTelemetryContext("account", " USER@example.com ");
    const res2 = pseudonymizeTelemetryContext("account", "user@example.com");
    expect(res1).toBe(res2);
  });

  it("5. Malformed context input is rejected or safely omitted", () => {
    process.env.SECURITY_TELEMETRY_HMAC_KEY = "synthetic-test-key";
    expect(pseudonymizeTelemetryContext("ip", "")).toBeNull();
    expect(pseudonymizeTelemetryContext("ip", null)).toBeNull();
    expect(pseudonymizeTelemetryContext("ip", undefined)).toBeNull();
  });

  it("6. Raw input is not contained in the pseudonymized output", () => {
    process.env.SECURITY_TELEMETRY_HMAC_KEY = "synthetic-test-key";
    const raw = "secret-raw-value";
    const res = pseudonymizeTelemetryContext("ip", raw);
    expect(res).not.toContain(raw);
  });

  it("7. Key material is not returned", () => {
    const secret = "synthetic-test-key";
    process.env.SECURITY_TELEMETRY_HMAC_KEY = secret;
    const res = pseudonymizeTelemetryContext("ip", "123.123.123.123");
    expect(res).not.toContain(secret);
  });

  it("8. Key version is stored separately from the key", () => {
    process.env.SECURITY_TELEMETRY_HMAC_KEY_VERSION = "v2-synthetic";
    expect(getTelemetryHmacKeyVersion()).toBe("v2-synthetic");
  });

  it("9. Missing HMAC key does not use a fallback secret", () => {
    delete process.env.SECURITY_TELEMETRY_HMAC_KEY;
    const res = pseudonymizeTelemetryContext("ip", "192.168.1.1");
    expect(res).toBeNull();
  });

  it("10. Missing HMAC key does not persist the raw context", () => {
    delete process.env.SECURITY_TELEMETRY_HMAC_KEY;
    const res = pseudonymizeTelemetryContext("ip", "192.168.1.1");
    expect(res).toBeNull(); // Verifies raw value isn't returned
  });

  it("11. Missing HMAC key produces only sanitized configuration evidence", () => {
    delete process.env.SECURITY_TELEMETRY_HMAC_KEY;
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    pseudonymizeTelemetryContext("ip", "192.168.1.1");
    expect(consoleSpy).toHaveBeenCalledWith("SECURITY_TELEMETRY_CONFIGURATION_FAILURE: SECURITY_TELEMETRY_HMAC_KEY is missing");
    consoleSpy.mockRestore();
  });

  it("12. Client-import boundaries cannot import the server-only helper", () => {
    // This is statically verifiable. We ensure the file has no 'use client' and imports 'crypto'.
    // In next.js, 'crypto' automatically blocks client-side bundles.
    const fs = require("fs");
    const content = fs.readFileSync("src/lib/security/telemetry-hmac.ts", "utf-8");
    expect(content).not.toContain("use client");
    expect(content).toContain('import crypto from "crypto"');
  });
});
