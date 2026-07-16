import "server-only";
import { SecurityPermission } from "./permissions";
import { Prisma } from "@prisma/client";

const REDACTED_STRING = "[REDACTED]";
const MAX_DEPTH = 5;
const MAX_ARRAY_LENGTH = 100;
const MAX_STRING_LENGTH = 5000;

const SENSITIVE_KEYS = new Set([
  "password", "password_hash", "passwordhash", "session_token", "access_token", 
  "refresh_token", "authorization", "cookie", "cookies", "signature", 
  "webhook_signature", "secret", "api_key", "apikey", "api_secret", 
  "database_url", "connection_string", "stack_trace_private", 
  "private_stack_trace", "prompt", "media_prompt", "card_number", "cvv", 
  "credit_card", "bank_account"
]);

export const MAX_SECURITY_EVENT_SUMMARY_BYTES = 8192;

export function validateSummaryBounds(summary: unknown): boolean {
  if (summary === undefined || summary === null) return true;
  const str = JSON.stringify(summary);
  const bytes = new TextEncoder().encode(str).length;
  return bytes <= MAX_SECURITY_EVENT_SUMMARY_BYTES;
}

/**
 * Returns a typed, privacy-safe authorization context.
 */
export function createPrivacySafeAuthorizationContext(
  user: { id: string; role: string; status: string }, 
  activePermissions: SecurityPermission[]
) {
  return {
    userId: user.id,
    role: user.role,
    status: user.status,
    activePermissions
  };
}

/**
 * Privacy-safe IP representation.
 */
export function serializePrivacySafeIp(ip?: string | null): string {
  if (!ip) return "unknown";
  // Basic masking (e.g., mask last octet of IPv4)
  if (ip.includes(".")) {
    const parts = ip.split(".");
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
  }
  // IPv6 masking
  if (ip.includes(":")) {
    const parts = ip.split(":");
    if (parts.length > 2) return `${parts[0]}:${parts[1]}:xxxx:xxxx:xxxx:xxxx`;
  }
  return "masked";
}

/**
 * Recursively redacts sensitive keys and bounds object depth/length.
 */
export function redactSensitiveData(payload: unknown, depth = 0, seen = new WeakSet()): unknown {
  if (depth > MAX_DEPTH) return "[MAX_DEPTH_REACHED]";
  
  if (payload === null || payload === undefined) return payload;

  // Primitive serialization
  if (typeof payload === 'bigint') return payload.toString();
  if (payload instanceof Date) return payload.toISOString();
  
  // Handle Prisma Decimal
  if (Prisma.Decimal && Prisma.Decimal.isDecimal(payload)) {
    return payload.toNumber();
  }

  if (typeof payload === 'string') {
    return payload.length > MAX_STRING_LENGTH 
      ? payload.substring(0, MAX_STRING_LENGTH) + "...[TRUNCATED]" 
      : payload;
  }

  if (typeof payload !== 'object') return payload;

  // Circular reference protection
  if (seen.has(payload)) return "[CIRCULAR_REFERENCE]";
  seen.add(payload);

  if (Array.isArray(payload)) {
    if (payload.length > MAX_ARRAY_LENGTH) {
      const truncated = payload.slice(0, MAX_ARRAY_LENGTH).map(item => redactSensitiveData(item, depth + 1, seen));
      truncated.push("[ARRAY_TRUNCATED]");
      return truncated;
    }
    return payload.map(item => redactSensitiveData(item, depth + 1, seen));
  }

  // Handle errors
  if (payload instanceof Error) {
    return {
      name: payload.name,
      message: payload.message,
      // Strictly exclude stack trace
    };
  }

  const result: Record<string, unknown> = {};
  for (const key of Object.keys(payload as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    
    // Payment-data masking
    if (lowerKey.includes("card") || lowerKey.includes("account_number") || lowerKey.includes("bank_account") || lowerKey === "cvv") {
      result[key] = "[PAYMENT_DATA_MASKED]";
      continue;
    }

    if (SENSITIVE_KEYS.has(lowerKey) || lowerKey.includes("password") || lowerKey.includes("secret") || lowerKey.includes("token")) {
      result[key] = REDACTED_STRING;
      continue;
    }

    // KYC reference-only output
    if (lowerKey.includes("kyc") || lowerKey.includes("document_url") || lowerKey.includes("file_url")) {
      result[key] = "[DOCUMENT_REFERENCE_ONLY]";
      continue;
    }

    result[key] = redactSensitiveData((payload as Record<string, unknown>)[key], depth + 1, seen);
  }

  return result;
}

/**
 * Specifically targets PaymentWebhookLog untrusted data.
 */
export function sanitizeWebhookSummary(headers: string | null, payload: string | null) {
  let safeHeaders = {};
  let safePayload = {};

  try {
    if (headers) safeHeaders = redactSensitiveData(JSON.parse(headers)) as Record<string, unknown>;
  } catch {
    safeHeaders = { parse_error: "Invalid JSON headers" };
  }

  try {
    if (payload) safePayload = redactSensitiveData(JSON.parse(payload)) as Record<string, unknown>;
  } catch {
    safePayload = { parse_error: "Invalid JSON payload" };
  }

  return {
    headers_summary: JSON.stringify(safeHeaders),
    payload_summary: JSON.stringify(safePayload)
  };
}
