import crypto from "crypto";

export function pseudonymizeTelemetryContext(prefix: string, value: string | undefined | null): string | null {
  if (!value) return null;
  
  const hmacKey = process.env.SECURITY_TELEMETRY_HMAC_KEY;
  if (!hmacKey) {
    // Record a sanitized telemetry configuration failure
    console.error("SECURITY_TELEMETRY_CONFIGURATION_FAILURE: SECURITY_TELEMETRY_HMAC_KEY is missing");
    return null; // Do not use a hard-coded fallback, do not store raw context
  }

  // Normalize inputs before HMAC
  const normalizedValue = value.trim().toLowerCase();
  
  // Use separate context prefixes
  const input = `${prefix}:${normalizedValue}`;

  // HMAC-SHA-256
  return crypto.createHmac("sha256", hmacKey).update(input).digest("hex");
}

export function getTelemetryHmacKeyVersion(): string {
  return process.env.SECURITY_TELEMETRY_HMAC_KEY_VERSION || "MISSING";
}
