import { compareFinancials } from "@/lib/security/financial";

describe("Financial Comparison Safety", () => {
  it("PHP integer match", () => {
    expect(compareFinancials(100, 100, "PHP", "PHP")).toBe("MATCH");
  });

  it("PHP fractional match", () => {
    expect(compareFinancials(100.50, 100.5, "PHP", "PHP")).toBe("MATCH");
  });

  it("USD match", () => {
    expect(compareFinancials(100.50, 100.5, "USD", "USD")).toBe("MATCH");
  });

  it("JPY match", () => {
    expect(compareFinancials(100, 100, "JPY", "JPY")).toBe("MATCH");
  });

  it("PHP versus USD", () => {
    expect(compareFinancials(100, 100, "PHP", "USD")).toBe("CURRENCY_MISMATCH");
  });

  it("USD versus JPY", () => {
    expect(compareFinancials(100, 100, "USD", "JPY")).toBe("CURRENCY_MISMATCH");
  });

  it("Unsupported expected currency", () => {
    expect(compareFinancials(100, 100, "EUR", "USD")).toBe("UNSUPPORTED_CURRENCY");
  });

  it("Unsupported received currency", () => {
    expect(compareFinancials(100, 100, "USD", "EUR")).toBe("UNSUPPORTED_CURRENCY");
  });

  it("Both currencies unsupported", () => {
    expect(compareFinancials(100, 100, "EUR", "GBP")).toBe("UNSUPPORTED_CURRENCY");
  });

  it("Null expected", () => {
    expect(compareFinancials(null, 100, "USD", "USD")).toBe("MISSING_AMOUNT");
  });

  it("Null received", () => {
    expect(compareFinancials(100, null, "USD", "USD")).toBe("MISSING_AMOUNT");
  });

  it("Empty string", () => {
    expect(compareFinancials("", 100, "USD", "USD")).toBe("INVALID_AMOUNT");
  });

  it("Whitespace-only string", () => {
    expect(compareFinancials("   ", 100, "USD", "USD")).toBe("INVALID_AMOUNT");
  });

  it("Invalid characters", () => {
    expect(compareFinancials("100abc", 100, "USD", "USD")).toBe("INVALID_AMOUNT");
  });

  it("Comma-formatted amount", () => {
    expect(compareFinancials("1,000.00", 1000, "USD", "USD")).toBe("INVALID_AMOUNT");
  });

  it("Exponent string", () => {
    expect(compareFinancials("1e3", 1000, "USD", "USD")).toBe("INVALID_AMOUNT");
  });

  it("NaN", () => {
    expect(compareFinancials(NaN, 100, "USD", "USD")).toBe("INVALID_AMOUNT");
  });

  it("Infinity", () => {
    expect(compareFinancials(100, Infinity, "USD", "USD")).toBe("INVALID_AMOUNT");
  });

  it("Negative amount", () => {
    expect(compareFinancials(-100, 100, "USD", "USD")).toBe("INVALID_AMOUNT");
    expect(compareFinancials("-100", 100, "USD", "USD")).toBe("INVALID_AMOUNT");
  });

  it("Binary floating-point edge case", () => {
    expect(compareFinancials(0.1 + 0.2, 0.3, "USD", "USD")).toBe("MATCH");
  });

  it("One-minor-unit mismatch", () => {
    expect(compareFinancials(100.01, 100.02, "USD", "USD")).toBe("MISMATCH");
  });

  it("ROUND_HALF_UP boundary", () => {
    // 100.005 rounds up to 100.01
    expect(compareFinancials(100.005, 100.01, "USD", "USD")).toBe("MATCH");
    // JPY has scale 0, so 100.5 rounds to 101
    expect(compareFinancials(100.5, 101, "JPY", "JPY")).toBe("MATCH");
  });

  it("Excessive decimal precision", () => {
    expect(compareFinancials(100.001, 100.004, "USD", "USD")).toBe("MATCH"); // Both round to 10000 minor units
  });
});
