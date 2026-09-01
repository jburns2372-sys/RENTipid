import { computeSha256 } from '../utils/idempotency';
import type { RawCandidateFact } from '../extraction/structured-extractor';

export interface ProhibitedDataDetection {
  readonly fieldName: string;
  readonly classification: 'GUEST_PII' | 'PAYMENT_CREDENTIAL' | 'AUTH_SECRET' | 'REPUTATION_REVIEW' | 'PRIVATE_ANALYTICS';
  readonly reasonCode: string;
  readonly safeHash: string;
}

export interface ProhibitedFilterResult {
  readonly cleanPayload: Record<string, unknown>;
  readonly prohibitedDetections: readonly ProhibitedDataDetection[];
  readonly hasProhibitedContent: boolean;
}

const PROHIBITED_FIELD_RULES: readonly {
  pattern: RegExp;
  classification: ProhibitedDataDetection['classification'];
  reasonCode: string;
}[] = Object.freeze([
  {
    pattern: /^(credit_?card|card_?number|cvv|cvc|bank_?account|routing_?number|iban|swift)/i,
    classification: 'PAYMENT_CREDENTIAL',
    reasonCode: 'PROHIBITED_PAYMENT_DATA',
  },
  {
    pattern: /^(token|access_?token|refresh_?token|secret|password|api_?key|private_?key|auth_?header|session)/i,
    classification: 'AUTH_SECRET',
    reasonCode: 'PROHIBITED_CREDENTIAL_DATA',
  },
  {
    pattern: /^(guest_?id|guest_?name|renter_?name|buyer_?id|user_?email|guest_?phone|customer_?pii|guest_?messages|messages|chat_?history)/i,
    classification: 'GUEST_PII',
    reasonCode: 'PROHIBITED_GUEST_PII',
  },
  {
    pattern: /^(reviews|ratings?|review_?count|stars|superhost|badge|ranking|third_?party_?reviews|reputation)/i,
    classification: 'REPUTATION_REVIEW',
    reasonCode: 'PROHIBITED_REPUTATION_DATA',
  },
  {
    pattern: /^(analytics|views_?count|impression_?count|internal_?notes|transaction_?history|platform_?metrics)/i,
    classification: 'PRIVATE_ANALYTICS',
    reasonCode: 'PROHIBITED_ANALYTICS_DATA',
  },
]);

export class ProhibitedDataFilter {
  filter(
    payload: Record<string, unknown>,
    prohibitedCandidates: readonly RawCandidateFact[] = [],
  ): ProhibitedFilterResult {
    const cleanPayload: Record<string, unknown> = {};
    const prohibitedDetections: ProhibitedDataDetection[] = [];

    // Scan all keys in payload
    for (const [key, value] of Object.entries(payload)) {
      const detection = this.detectProhibitedKey(key, value);
      if (detection) {
        prohibitedDetections.push(detection);
      } else {
        cleanPayload[key] = value;
      }
    }

    // Also process prohibited candidate facts extracted by extractor
    for (const cand of prohibitedCandidates) {
      if (!prohibitedDetections.some((d) => d.fieldName === cand.sourceField)) {
        const detection = this.detectProhibitedKey(cand.sourceField, cand.rawValue);
        if (detection) {
          prohibitedDetections.push(detection);
        }
      }
    }

    return Object.freeze({
      cleanPayload: Object.freeze(cleanPayload),
      prohibitedDetections: Object.freeze(prohibitedDetections),
      hasProhibitedContent: prohibitedDetections.length > 0,
    });
  }

  private detectProhibitedKey(key: string, value: unknown): ProhibitedDataDetection | undefined {
    for (const rule of PROHIBITED_FIELD_RULES) {
      if (rule.pattern.test(key)) {
        const safeHash = computeSha256(
          typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? ''),
        );
        return Object.freeze({
          fieldName: key,
          classification: rule.classification,
          reasonCode: rule.reasonCode,
          safeHash,
        });
      }
    }
    return undefined;
  }
}
