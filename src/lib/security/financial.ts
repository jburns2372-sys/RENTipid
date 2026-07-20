import { Prisma } from "@prisma/client";

export type FinancialComparisonResult = 
  | "MATCH"
  | "MISMATCH"
  | "CURRENCY_MISMATCH"
  | "INVALID_AMOUNT"
  | "MISSING_AMOUNT"
  | "UNSUPPORTED_CURRENCY";

const CURRENCY_SCALE: Record<string, number> = {
  "PHP": 2,
  "USD": 2,
  "JPY": 0
};

function isPrismaDecimal(value: unknown): value is Prisma.Decimal {
  if (value instanceof Prisma.Decimal) return true;
  if (typeof value === "object" && value !== null && "isNegative" in value && typeof (value as Record<string, unknown>).isNegative === "function") return true;
  return false;
}

export function parseToDecimal(value: number | string | Prisma.Decimal): Prisma.Decimal | null {
  if (isPrismaDecimal(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return null;
    // Strict decimal syntax: optional minus, digits, optional dot and digits
    if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return null;
    }
    try {
      return new Prisma.Decimal(trimmed);
    } catch {
      return null;
    }
  }

  if (typeof value === "number") {
    if (Number.isNaN(value) || !Number.isFinite(value)) {
      return null;
    }
    try {
      // Precision previously lost in Prisma Float cannot be restored here.
      const strVal = value.toString();
      // Reject exponent notation for numbers unless explicitly supported.
      if (strVal.toLowerCase().includes('e')) {
        return null;
      }
      return new Prisma.Decimal(strVal);
    } catch {
      return null;
    }
  }

  return null;
}

export function compareFinancials(
  expectedAmount: number | string | Prisma.Decimal | null | undefined, 
  receivedAmount: number | string | Prisma.Decimal | null | undefined, 
  expectedCurrency: string,
  receivedCurrency: string
): FinancialComparisonResult {
  const eCurr = expectedCurrency.toUpperCase();
  const rCurr = receivedCurrency.toUpperCase();

  const eScale = CURRENCY_SCALE[eCurr];
  const rScale = CURRENCY_SCALE[rCurr];

  if (eScale === undefined || rScale === undefined) {
    return "UNSUPPORTED_CURRENCY";
  }

  if (eCurr !== rCurr) {
    return "CURRENCY_MISMATCH";
  }

  if (expectedAmount == null || receivedAmount == null) {
    return "MISSING_AMOUNT";
  }

  const expectedDec = parseToDecimal(expectedAmount);
  const receivedDec = parseToDecimal(receivedAmount);

  if (!expectedDec || !receivedDec) {
    return "INVALID_AMOUNT";
  }

  if (expectedDec.isNegative() || receivedDec.isNegative()) {
    return "INVALID_AMOUNT";
  }

  try {
    const factor = new Prisma.Decimal(10).pow(eScale);
    
    // Convert to minor units using ROUND_HALF_UP
    const expectedMinorUnits = expectedDec.mul(factor).toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);
    const receivedMinorUnits = receivedDec.mul(factor).toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);

    if (expectedMinorUnits.equals(receivedMinorUnits)) {
      return "MATCH";
    }

    return "MISMATCH";
  } catch {
    return "INVALID_AMOUNT";
  }
}
