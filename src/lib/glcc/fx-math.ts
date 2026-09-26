/**
 * RENTipid GLCC v1.0 — FX Exact Money & Decimal Arithmetic Engine
 *
 * Work Package: GLCC-P5A
 *
 * Implements:
 * 1. Exact, reproducible arbitrary-precision decimal arithmetic using Prisma.Decimal.
 * 2. Absolute prohibition of binary IEEE-754 float calculations for authoritative money.
 * 3. Exact exponent handling across 0-digit (JPY), 2-digit (PHP, USD, EUR), and 3-digit (BHD, KWD) currencies.
 * 4. Configurable, versioned rounding policies (ROUND_HALF_UP, ROUND_HALF_EVEN, ROUND_FLOOR, ROUND_CEIL).
 * 5. Deterministic BigInt minor-unit serialization.
 * 6. High-precision rate intermediate calculations with verifiable reproducibility.
 */

import { Prisma } from '@prisma/client';
import type { ExactMoney, FxRoundingPolicyRef, FxFeePolicy } from './fx-contracts';

/**
 * Maps GLCC rounding policy references to Prisma.Decimal rounding modes.
 */
function getDecimalRoundingMode(policy: FxRoundingPolicyRef): Prisma.Decimal.Rounding {
  switch (policy) {
    case 'ROUND_HALF_EVEN':
      return Prisma.Decimal.ROUND_HALF_EVEN;
    case 'ROUND_FLOOR':
      return Prisma.Decimal.ROUND_FLOOR;
    case 'ROUND_CEIL':
      return Prisma.Decimal.ROUND_CEIL;
    case 'ROUND_HALF_UP':
    case 'TEST_ROUNDING_POLICY':
    default:
      return Prisma.Decimal.ROUND_HALF_UP;
  }
}

/**
 * Validates and converts an amount into a strict canonical decimal string.
 * Rejects NaN, Infinity, and malformed strings.
 */
export function sanitizeDecimalString(val: string | number | Prisma.Decimal): string {
  if (val instanceof Prisma.Decimal) {
    if (val.isNaN() || !val.isFinite()) {
      throw new Error(`Invalid decimal value: ${val.toString()}`);
    }
    return val.toFixed();
  }

  if (typeof val === 'number') {
    if (Number.isNaN(val) || !Number.isFinite(val)) {
      throw new Error(`Invalid number value: ${val}`);
    }
    const str = val.toString();
    if (str.toLowerCase().includes('e')) {
      throw new Error(`Scientific notation rejected for authoritative money: ${str}`);
    }
    return new Prisma.Decimal(str).toFixed();
  }

  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
      throw new Error(`Invalid decimal string format: "${val}"`);
    }
    return trimmed;
  }

  throw new Error(`Unsupported money value type: ${typeof val}`);
}

/**
 * Creates an immutable ExactMoney instance with exact decimal representation and minor units.
 */
export function createExactMoney(
  amount: string | number | Prisma.Decimal,
  currencyCode: string,
  currencyExponent: number,
  roundingPolicyRef?: string
): ExactMoney {
  const amountStr = sanitizeDecimalString(amount);
  const dec = new Prisma.Decimal(amountStr);

  if (currencyExponent < 0 || currencyExponent > 6 || !Number.isInteger(currencyExponent)) {
    throw new Error(`Invalid currency exponent: ${currencyExponent}`);
  }

  // Calculate integer minor units exactly
  const factor = new Prisma.Decimal(10).pow(currencyExponent);
  const minorDec = dec.mul(factor).toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);
  const amountMinor = BigInt(minorDec.toFixed(0));

  // Canonicalize string to exact exponent decimal places if specified
  const canonicalAmount = dec.toFixed(currencyExponent);

  return Object.freeze({
    amountExact: canonicalAmount,
    currencyCode: currencyCode.toUpperCase(),
    currencyExponent,
    amountMinor,
    roundingPolicyRef,
  });
}

export interface ConvertMoneyInput {
  readonly sourceMoney: ExactMoney;
  readonly targetCurrency: string;
  readonly targetExponent: number;
  readonly rate: string | Prisma.Decimal;
  readonly roundingPolicyRef?: FxRoundingPolicyRef;
  readonly feePolicy?: FxFeePolicy;
}

export interface ConvertMoneyResult {
  readonly targetMoney: ExactMoney;
  readonly intermediateAmount: string;
  readonly effectiveRate: string;
  readonly feeApplied: string;
}

/**
 * Performs exact decimal conversion from source money to target money.
 *
 * Sequence:
 * 1. Source Exact Decimal × Normalized Rate Decimal
 * 2. Optional Fee / Spread adjustment
 * 3. Intermediate exact product
 * 4. Target exponent rounding using specified policy
 * 5. Exact minor-unit calculation
 */
export function convertMoney(input: ConvertMoneyInput): ConvertMoneyResult {
  const sourceDec = new Prisma.Decimal(input.sourceMoney.amountExact);
  const rawRateDec = new Prisma.Decimal(sanitizeDecimalString(input.rate));

  if (rawRateDec.isNegative() || rawRateDec.isZero()) {
    throw new Error(`Conversion rate must be strictly positive: ${rawRateDec.toString()}`);
  }

  let effectiveRateDec = rawRateDec;
  let feeDec = new Prisma.Decimal(0);

  // Apply spread policy if configured
  if (input.feePolicy?.spreadBps && input.feePolicy.spreadBps > 0) {
    const spreadMultiplier = new Prisma.Decimal(1).sub(
      new Prisma.Decimal(input.feePolicy.spreadBps).div(10000)
    );
    effectiveRateDec = effectiveRateDec.mul(spreadMultiplier);
  }

  // Compute exact intermediate product
  let intermediateDec = sourceDec.mul(effectiveRateDec);

  // Apply percentage fee if configured
  if (input.feePolicy?.percentageFee) {
    const feeRate = new Prisma.Decimal(input.feePolicy.percentageFee);
    const calculatedFee = intermediateDec.mul(feeRate);
    feeDec = feeDec.add(calculatedFee);
    intermediateDec = intermediateDec.add(calculatedFee);
  }

  // Apply fixed fee if configured
  if (input.feePolicy?.fixedFee) {
    const fixedFeeDec = new Prisma.Decimal(input.feePolicy.fixedFee);
    feeDec = feeDec.add(fixedFeeDec);
    intermediateDec = intermediateDec.add(fixedFeeDec);
  }

  const roundingPolicy = input.roundingPolicyRef ?? 'ROUND_HALF_UP';
  const roundingMode = getDecimalRoundingMode(roundingPolicy);

  // Round intermediate to target minor unit exponent
  const roundedDec = intermediateDec.toDecimalPlaces(input.targetExponent, roundingMode);

  const targetMoney = createExactMoney(
    roundedDec,
    input.targetCurrency,
    input.targetExponent,
    roundingPolicy
  );

  return {
    targetMoney,
    intermediateAmount: intermediateDec.toFixed(),
    effectiveRate: effectiveRateDec.toFixed(),
    feeApplied: feeDec.toFixed(input.targetExponent),
  };
}

/**
 * Exact decimal addition without binary float drift.
 */
export function addExact(a: string | Prisma.Decimal, b: string | Prisma.Decimal): string {
  const decA = new Prisma.Decimal(sanitizeDecimalString(a));
  const decB = new Prisma.Decimal(sanitizeDecimalString(b));
  return decA.add(decB).toFixed();
}

/**
 * Exact decimal multiplication.
 */
export function mulExact(a: string | Prisma.Decimal, b: string | Prisma.Decimal): string {
  const decA = new Prisma.Decimal(sanitizeDecimalString(a));
  const decB = new Prisma.Decimal(sanitizeDecimalString(b));
  return decA.mul(decB).toFixed();
}

/**
 * Exact decimal division with configurable decimal places and rounding mode.
 */
export function divExact(
  numerator: string | Prisma.Decimal,
  denominator: string | Prisma.Decimal,
  precision: number = 8,
  roundingMode: Prisma.Decimal.Rounding = Prisma.Decimal.ROUND_HALF_UP
): string {
  const numDec = new Prisma.Decimal(sanitizeDecimalString(numerator));
  const denDec = new Prisma.Decimal(sanitizeDecimalString(denominator));

  if (denDec.isZero()) {
    throw new Error('Division by zero');
  }

  return numDec.div(denDec).toDecimalPlaces(precision, roundingMode).toFixed();
}

/**
 * Demonstration helper proving why binary float math fails for money while Prisma.Decimal succeeds.
 */
export function verifyFloatVsDecimalProof(): {
  binaryFloatResult: number;
  exactDecimalResult: string;
  isBinaryFloatFlawed: boolean;
  isExactDecimalCorrect: boolean;
} {
  const binaryFloatResult = 0.1 + 0.2;
  const exactDecimalResult = addExact('0.1', '0.2');

  return {
    binaryFloatResult,
    exactDecimalResult,
    isBinaryFloatFlawed: binaryFloatResult !== 0.3, // 0.30000000000000004
    isExactDecimalCorrect: exactDecimalResult === '0.3',
  };
}
