/**
 * RENTipid GLCC v1.0 — Translation Payload Sanitizer & Secret Redactor
 *
 * Work Package: GLCC-P7
 * Acceptance Target: SEC-02
 *
 * Implements:
 * 1. Sanitization of dynamic text before dispatch to external translation providers.
 * 2. Redaction of API keys, bearer tokens, JWTs, and secret credentials.
 * 3. Redaction of payment card numbers (13-19 digits).
 * 4. Preservation of redaction markers for safe post-translation restoration or safe display.
 */

export interface SanitizedTranslationPayload {
  readonly sanitizedText: string;
  readonly redactionCount: number;
  readonly redactionTypes: string[];
}

const SECRET_PATTERNS: Array<{ type: string; regex: RegExp }> = [
  // JWT Tokens (header.payload.signature)
  { type: 'JWT_TOKEN', regex: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g },
  // Common API key prefixes (sk_live_, sk_test_, api_key_, etc.)
  { type: 'API_KEY', regex: /(?:sk_live_|sk_test_|ghp_|pat_|api_key_)[A-Za-z0-9_-]{16,}/gi },
  // Credit card numbers (13-19 digits, with optional spaces or dashes)
  { type: 'PAYMENT_CARD', regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g },
  // Generic Bearer Authorization headers in text
  { type: 'AUTH_BEARER', regex: /Bearer\s+[A-Za-z0-9._~+/-]{20,}/gi },
  // Password query parameters or assignment strings
  { type: 'PASSWORD_FIELD', regex: /(?:password|secret|passphrase)\s*[:=]\s*["']?[^"'\s,;]+["']?/gi },
];

/**
 * Sanitizes input text before external translation handoff.
 * Replaces confidential credentials and payment numbers with opaque tokens.
 */
export function sanitizeForTranslation(rawText: string): SanitizedTranslationPayload {
  if (!rawText || typeof rawText !== 'string') {
    return { sanitizedText: '', redactionCount: 0, redactionTypes: [] };
  }

  let text = rawText;
  let count = 0;
  const typesDetected = new Set<string>();

  for (const { type, regex } of SECRET_PATTERNS) {
    if (regex.test(text)) {
      typesDetected.add(type);
      text = text.replace(regex, () => {
        count++;
        return `[REDACTED_${type}]`;
      });
    }
  }

  return {
    sanitizedText: text,
    redactionCount: count,
    redactionTypes: Array.from(typesDetected),
  };
}
