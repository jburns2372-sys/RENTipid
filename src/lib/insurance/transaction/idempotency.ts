import { createHash } from "crypto";

function validatePart(value: string, field: string): string {
  if (!value || value !== value.trim() || value.length > 200) {
    throw new Error(`Invalid ${field}.`);
  }
  return value;
}

export function insuranceDigest(
  namespace: string,
  parts: readonly string[],
): string {
  const normalized = [
    validatePart(namespace, "namespace"),
    ...parts.map((part, index) => validatePart(part, `part-${index}`)),
  ].join("|");
  return createHash("sha256").update(normalized).digest("hex");
}

export function stableRequestHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
