import { redactSensitiveData, createPrivacySafeAuthorizationContext, serializePrivacySafeIp, sanitizeWebhookSummary, validateSummaryBounds, MAX_SECURITY_EVENT_SUMMARY_BYTES } from "@/lib/security/serializers";
import { SECURITY_PERMISSIONS } from "@/lib/security/permissions";
import { Prisma } from "@prisma/client";

describe("Privacy Serializers Matrix", () => {
  it("SER-P1-001 & SER-P1-002 - Password fields and hashes removed", () => {
    const payload = {
      user: { id: "123", email: "test@example.com" },
      session: { token: "super_secret_token_123" },
      password_hash: "hash",
      safe: "yes"
    };
    const result = redactSensitiveData(payload) as Record<string, unknown>;
    const sessionObj = result.session as Record<string, unknown>;
    expect(sessionObj.token).toBe("[REDACTED]");
    expect(result.password_hash).toBe("[REDACTED]");
    expect(result.safe).toBe("yes");
  });

  it("SER-P1-003 & SER-P1-004 & SER-P1-005 & SER-P1-006 - Tokens, auth headers, cookies removed", () => {
    const payload = { 
      session_token: "x", access_token: "y", refresh_token: "z",
      authorization: "Bearer x", cookie: "session=1", cookies: "x" 
    };
    const result = redactSensitiveData(payload) as Record<string, unknown>;
    expect(Object.values(result).every(v => v === "[REDACTED]")).toBe(true);
  });

  it("SER-P1-007 - Private stack traces excluded", () => {
    const error = new Error("Test error message");
    (error as unknown as Record<string, unknown>).stack_trace_private = "secret_stack";
    const result = redactSensitiveData(error) as Record<string, unknown>;
    expect(result.name).toBe("Error");
    expect(result.message).toBe("Test error message");
    expect(result.stack).toBeUndefined();
    expect((result as Record<string, unknown>).stack_trace_private).toBeUndefined();
  });

  it("SER-P1-008 - Complete AI prompts excluded", () => {
    const payload = { prompt: "System prompt instructions", media_prompt: "Draw a cat" };
    const result = redactSensitiveData(payload) as Record<string, unknown>;
    expect(result.prompt).toBe("[REDACTED]");
    expect(result.media_prompt).toBe("[REDACTED]");
  });

  it("SER-P1-009 - Payment data masked", () => {
    const payload = { credit_card: "1234", card_number: "5678", bank_account: "999" };
    const result = redactSensitiveData(payload) as Record<string, unknown>;
    expect(result.credit_card).toBe("[PAYMENT_DATA_MASKED]");
    expect(result.card_number).toBe("[PAYMENT_DATA_MASKED]");
    expect(result.bank_account).toBe("[PAYMENT_DATA_MASKED]");
  });

  it("SER-P1-010 - KYC documents reduced to approved references", () => {
    const payload = { kyc_document: "file.pdf", document_url: "https://bucket/file" };
    const result = redactSensitiveData(payload) as Record<string, unknown>;
    expect(result.kyc_document).toBe("[DOCUMENT_REFERENCE_ONLY]");
    expect(result.document_url).toBe("[DOCUMENT_REFERENCE_ONLY]");
  });

  describe("validateSummaryBounds and limits", () => {

    it("accepts null or undefined", () => {
      expect(validateSummaryBounds(null)).toBe(true);
      expect(validateSummaryBounds(undefined)).toBe(true);
    });

    it("accepts object exactly below the limit", () => {
      const obj = { data: "a".repeat(MAX_SECURITY_EVENT_SUMMARY_BYTES - 20) };
      expect(validateSummaryBounds(obj)).toBe(true);
    });

    it("rejects object above the limit", () => {
      const obj = { data: "a".repeat(MAX_SECURITY_EVENT_SUMMARY_BYTES + 10) };
      expect(validateSummaryBounds(obj)).toBe(false);
    });

    it("redactSensitiveData enforces deep nesting limit", () => {
      const obj: Record<string, unknown> = {};
      let current = obj;
      for (let i = 0; i < 10; i++) {
        current.nested = {};
        current = current.nested as Record<string, unknown>;
      }
      const result = redactSensitiveData(obj) as Record<string, unknown>;
      // Expect it to cap at MAX_DEPTH (5)
      expect(JSON.stringify(result)).toContain("[MAX_DEPTH_REACHED]");
    });

    it("redactSensitiveData enforces oversized arrays limit", () => {
      const arr = new Array(200).fill("a");
      const result = redactSensitiveData(arr) as string[];
      expect(result.length).toBe(101); // 100 items + [ARRAY_TRUNCATED]
      expect(result[100]).toBe("[ARRAY_TRUNCATED]");
    });

    it("redactSensitiveData enforces long strings limit", () => {
      const longStr = "a".repeat(10000);
      const result = redactSensitiveData(longStr) as string;
      expect(result.length).toBe(5000 + "...[TRUNCATED]".length);
      expect(result.endsWith("[TRUNCATED]")).toBe(true);
    });

    it("redactSensitiveData rejects circular structures", () => {
      const obj: Record<string, unknown> = {};
      obj.self = obj;
      const result = redactSensitiveData(obj) as Record<string, unknown>;
      expect(result.self).toBe("[CIRCULAR_REFERENCE]");
    });

    it("redactSensitiveData handles secret-bearing nested objects safely", () => {
      const payload = { safe: { deep: { password: "123" } } };
      const result = redactSensitiveData(payload) as Record<string, Record<string, Record<string, string>>>;
      expect(result.safe.deep.password).toBe("[REDACTED]");
    });
  });


  it("SER-P1-011 - IP privacy policy enforced", () => {
    expect(serializePrivacySafeIp("192.168.1.100")).toBe("192.168.1.xxx");
    expect(serializePrivacySafeIp("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toBe("2001:0db8:xxxx:xxxx:xxxx:xxxx");
    expect(serializePrivacySafeIp(null)).toBe("unknown");
  });

  it("SER-P1-012 & SER-P1-013 & SER-P1-014 - Decimal, BigInt, Dates serialized safely", () => {
    const date = new Date("2024-01-01T00:00:00Z");
    const payload = { val: new Prisma.Decimal("10.5"), big: BigInt(9007199254740991), date };
    const result = redactSensitiveData(payload) as Record<string, unknown>;
    expect(result.val).toBe(10.5);
    expect(result.big).toBe("9007199254740991");
    expect(result.date).toBe("2024-01-01T00:00:00.000Z");
  });

  it("SER-P1-015 - Circular structures handled", () => {
    const circular: Record<string, unknown> = { name: "Root" };
    circular.self = circular;
    const result = redactSensitiveData(circular) as Record<string, unknown>;
    expect(result.self).toBe("[CIRCULAR_REFERENCE]");
  });

  it("SER-P1-016 - Deep objects bounded", () => {
    const deepObj = { a: { b: { c: { d: { e: { f: { g: "too deep" } } } } } } };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = redactSensitiveData(deepObj) as any;
    expect(result.a.b.c.d.e.f).toBe("[MAX_DEPTH_REACHED]");
  });

  it("SER-P1-017 - Long arrays bounded & Long strings truncated", () => {
    const arr = Array(150).fill("test");
    const longString = "A".repeat(6000);
    const payload = { arr, longString };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = redactSensitiveData(payload) as any;
    expect(result.arr.length).toBe(101);
    expect(result.arr[100]).toBe("[ARRAY_TRUNCATED]");
    expect(result.longString.length).toBeLessThan(5100);
    expect(result.longString).toContain("[TRUNCATED]");
  });

  it("SER-P1-018 - Nested secret-like keys redacted", () => {
    const payload = { config: { inner: { api_key: "123" } } };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = redactSensitiveData(payload) as any;
    expect(result.config.inner.api_key).toBe("[REDACTED]");
  });

  it("SER-P1-019 & SER-P1-020 - Webhook sanitization", () => {
    const h = JSON.stringify({ Authorization: "Bearer xyz", "x-webhook-signature": "123" });
    const p = JSON.stringify({ card_number: "4444", customer: "John" });
    const result = sanitizeWebhookSummary(h, p);
    expect(result.headers_summary).toContain("[REDACTED]");
    expect(result.payload_summary).toContain("[PAYMENT_DATA_MASKED]");
    expect(result.payload_summary).toContain("John");
  });

  it("SER-P1-021 - Technical details context safe extraction", () => {
    const user = { id: "123", role: "Super Admin", status: "Verified", password_hash: "secret" };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const context = createPrivacySafeAuthorizationContext(user as any, [SECURITY_PERMISSIONS.DASHBOARD_VIEW]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((context as any).password_hash).toBeUndefined();
    expect(context.userId).toBe("123");
    expect(context.role).toBe("Super Admin");
  });
});
