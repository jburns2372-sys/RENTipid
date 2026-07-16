/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { evaluateRuleDsl } from "../../../src/lib/security/rules/dsl/evaluator";

describe("DSL Pure Evaluator", () => {
  it("should evaluate EQUALS correctly", () => {
    const dsl = { field: "event_code", operator: "EQUALS", value: "LOGIN_FAILED" };
    expect(evaluateRuleDsl(dsl, { event_code: "LOGIN_FAILED" })).toBe(true);
    expect(evaluateRuleDsl(dsl, { event_code: "LOGIN_SUCCESS" })).toBe(false);
  });

  it("should evaluate NOT_EQUALS correctly", () => {
    const dsl = { field: "event_code", operator: "NOT_EQUALS", value: "LOGIN_FAILED" };
    expect(evaluateRuleDsl(dsl, { event_code: "LOGIN_SUCCESS" })).toBe(true);
    expect(evaluateRuleDsl(dsl, { event_code: "LOGIN_FAILED" })).toBe(false);
  });

  it("should evaluate CONTAINS correctly", () => {
    const dsl = { field: "action_attempted", operator: "CONTAINS", value: "UPDATE" };
    expect(evaluateRuleDsl(dsl, { action_attempted: "USER_UPDATE_ROLE" })).toBe(true);
    expect(evaluateRuleDsl(dsl, { action_attempted: "USER_CREATE" })).toBe(false);
  });

  it("should evaluate IN correctly", () => {
    const dsl = { field: "event_code", operator: "IN", value: ["LOGIN_FAILED", "PASSWORD_RESET"] };
    expect(evaluateRuleDsl(dsl, { event_code: "LOGIN_FAILED" })).toBe(true);
    expect(evaluateRuleDsl(dsl, { event_code: "LOGOUT" })).toBe(false);
  });

  describe("Null Semantics", () => {
    it("EQUALS with null source value returns false", () => {
      const dsl = { field: "event_code", operator: "EQUALS", value: "LOGIN_FAILED" };
      expect(evaluateRuleDsl(dsl, { event_code: null })).toBe(false);
      expect(evaluateRuleDsl(dsl, {})).toBe(false); // undefined
    });

    it("NOT_EQUALS with null source value returns false", () => {
      const dsl = { field: "event_code", operator: "NOT_EQUALS", value: "LOGIN_FAILED" };
      expect(evaluateRuleDsl(dsl, { event_code: null })).toBe(false);
      expect(evaluateRuleDsl(dsl, {})).toBe(false); // undefined
    });

    it("CONTAINS with null source value returns false", () => {
      const dsl = { field: "event_code", operator: "CONTAINS", value: "LOGIN" };
      expect(evaluateRuleDsl(dsl, { event_code: null })).toBe(false);
      expect(evaluateRuleDsl(dsl, {})).toBe(false); // undefined
    });

    it("IN with null source value returns false", () => {
      const dsl = { field: "event_code", operator: "IN", value: ["LOGIN_FAILED"] };
      expect(evaluateRuleDsl(dsl, { event_code: null })).toBe(false);
      expect(evaluateRuleDsl(dsl, {})).toBe(false); // undefined
    });
  });
});
