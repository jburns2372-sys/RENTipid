/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars */
// @ts-nocheck
import { validateRuleDsl } from "../../../src/lib/security/rules/dsl/validator";

describe("Rule DSL Validation", () => {
  it("should accept valid scalar string comparison", () => {
    const dsl = { field: "event_code", operator: "EQUALS", value: "TEST_EVENT" };
    const result = validateRuleDsl(dsl);
    if(!result.valid) console.error(result.privacySafeError); expect(result.valid).toBe(true);
  });

  it("should accept valid IN array comparison", () => {
    const dsl = { field: "event_code", operator: "IN", value: ["EVENT_1", "EVENT_2"] };
    const result = validateRuleDsl(dsl);
    if(!result.valid) console.error(result.privacySafeError); expect(result.valid).toBe(true);
  });

  it("should accept valid AND, OR, and NOT logical operators", () => {
    const dsl = {
      AND: [
        { field: "event_code", operator: "EQUALS", value: "A" },
        {
          OR: [
            { field: "actor_user_id", operator: "EQUALS", value: "B" },
            { field: "target_user_id", operator: "NOT_EQUALS", value: "C" }
          ]
        }
      ]
    };
    const result = validateRuleDsl(dsl);
    if(!result.valid) console.error(result.privacySafeError); expect(result.valid).toBe(true);
  });

  it("should reject unknown keys", () => {
    const dsl = { field: "event_code", operator: "EQUALS", value: "A", unknown_key: "malicious" };
    const result = validateRuleDsl(dsl);
    expect(result.valid).toBe(false);
  });

  it("should reject unknown fields", () => {
    const dsl = { field: "malicious_field", operator: "EQUALS", value: "A" };
    const result = validateRuleDsl(dsl);
    expect(result.valid).toBe(false);
  });

  it("should reject unknown operators", () => {
    const dsl = { field: "event_code", operator: "GT", value: "A" };
    const result = validateRuleDsl(dsl);
    expect(result.valid).toBe(false);
  });

  it("should reject scalar/array mismatch", () => {
    const dsl1 = { field: "event_code", operator: "EQUALS", value: ["A"] };
    expect(validateRuleDsl(dsl1).valid).toBe(false);

    const dsl2 = { field: "event_code", operator: "IN", value: "A" };
    expect(validateRuleDsl(dsl2).valid).toBe(false);
  });

  it("should enforce enum validation", () => {
    const validDsl = { field: "severity", operator: "EQUALS", value: "INFO" };
    expect(validateRuleDsl(validDsl).valid).toBe(true);

    const validDslHigh = { field: "severity", operator: "EQUALS", value: "HIGH" };
    expect(validateRuleDsl(validDslHigh).valid).toBe(true);

    const invalidDsl = { field: "severity", operator: "EQUALS", value: "SUPER_CRITICAL" };
    expect(validateRuleDsl(invalidDsl).valid).toBe(false);
  });

  it("should reject CONTAINS for enum fields", () => {
    const dsl = { field: "security_domain", operator: "CONTAINS", value: "IDENTITY" };
    expect(validateRuleDsl(dsl).valid).toBe(false);
  });

  it("should enforce enum validation", () => {
    const dsl = { field: "security_domain", operator: "EQUALS", value: "INVALID_ENUM" };
    expect(validateRuleDsl(dsl).valid).toBe(false);
  });

  it("should treat null behavior as rejected schema natively", () => {
    const dsl = { field: "event_code", operator: "EQUALS", value: null };
    expect(validateRuleDsl(dsl).valid).toBe(false);
  });

  it("should enforce maximum value length", () => {
    const dsl = { field: "event_code", operator: "EQUALS", value: "A".repeat(257) };
    expect(validateRuleDsl(dsl).valid).toBe(false);
  });

  it("should enforce maximum IN-list length", () => {
    const dsl = { field: "event_code", operator: "IN", value: new Array(51).fill("A") };
    expect(validateRuleDsl(dsl).valid).toBe(false);
  });

  it("should accept depths 1, 2, 3 and reject 4, 5", () => {
    const d1 = { field: "event_code", operator: "EQUALS", value: "A" };
    expect(validateRuleDsl(d1).valid).toBe(true);
    
    const d2 = { AND: [d1] };
    expect(validateRuleDsl(d2).valid).toBe(true);
    
    const d3 = { AND: [d2] };
    expect(validateRuleDsl(d3).valid).toBe(true);
    
    const d4 = { AND: [d3] };
    const r4 = validateRuleDsl(d4);
    expect(r4.valid).toBe(false);
    if (!r4.valid) expect(r4.privacySafeError).toBe("DSL_MAX_DEPTH_EXCEEDED");

    const d5 = { AND: [d4] };
    const r5 = validateRuleDsl(d5);
    expect(r5.valid).toBe(false);
    if (!r5.valid) expect(r5.privacySafeError).toBe("DSL_MAX_DEPTH_EXCEEDED");
  });

  it("should enforce maximum condition count", () => {
    const conditions = Array.from({ length: 11 }, (_, i) => ({
      field: "event_code", operator: "EQUALS", value: `A${i}`
    }));
    const dsl = { AND: conditions };
    expect(validateRuleDsl(dsl).valid).toBe(false);
    // @ts-expect-error test
    expect(validateRuleDsl(dsl).privacySafeError).toBe("DSL_MAX_CONDITIONS_EXCEEDED");
  });

  it("should enforce maximum DSL byte size", () => {
    const longString = "A".repeat(250);
    const conditions = Array.from({ length: 10 }, (_, i) => ({
      field: "event_code", operator: "IN", value: Array.from({ length: 50 }, () => longString)
    }));
    // This creates a large valid schema object (if length wasn't enforced)
    // Actually the byte size limit is 10KB. 10 * 50 * 250 = ~125KB
    const dsl = { AND: conditions };
    const result = validateRuleDsl(dsl);
    expect(result.valid).toBe(false);
    // @ts-expect-error test
    expect(result.privacySafeError).toBe("DSL_PAYLOAD_TOO_LARGE");
  });
});
