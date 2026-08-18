import { NextResponse } from "next/server";
import { InsuranceTransactionError } from "./types";

export function requiredString(value: unknown, field: string): string {
  if (
    typeof value !== "string" ||
    !value ||
    value !== value.trim() ||
    value.length > 200
  ) {
    throw new InsuranceTransactionError(
      "INVALID_REQUEST",
      `Invalid ${field}.`,
    );
  }
  return value;
}

export function insuranceErrorResponse(error: unknown): NextResponse {
  if (error instanceof InsuranceTransactionError) {
    const status =
      error.code === "ORDER_OWNERSHIP_MISMATCH"
        ? 403
        : error.code.endsWith("_NOT_FOUND") ||
            error.code === "OFFER_NOT_FOUND"
          ? 404
          : error.code.includes("IDEMPOTENCY") ||
              error.code.includes("CONFLICT")
            ? 409
            : 400;
    return NextResponse.json(
      { error: "Insurance request could not be completed.", code: error.code },
      { status },
    );
  }
  return NextResponse.json(
    { error: "Insurance is temporarily unavailable." },
    { status: 503 },
  );
}
