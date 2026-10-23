import type { ListingBridgeConfidenceState } from '../types/canonical-contract';
import type { RawCandidateFact } from '../extraction/structured-extractor';

export interface CommercialPolicyFieldClassification {
  readonly fieldName: string;
  readonly normalizedValue: unknown;
  readonly confidence: ListingBridgeConfidenceState;
  readonly reasonCode: string;
  readonly requiresReview: true;
}

export interface CommercialPolicyClassificationResult {
  readonly classifications: readonly CommercialPolicyFieldClassification[];
  readonly pricingHints: {
    readonly hourlyRate?: number;
    readonly dailyRate?: number;
    readonly weeklyRate?: number;
    readonly monthlyRate?: number;
    readonly securityDeposit?: number;
    readonly replacementValue?: number;
    readonly currency?: string;
  };
  readonly ruleHints: {
    readonly minDuration?: number;
    readonly maxDuration?: number;
    readonly deliveryFee?: number;
    readonly generalRules?: string;
  };
}

function parseNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }
  if (typeof value === 'string') {
    // Strip currency symbols, commas, spaces
    const clean = value.replace(/[^0-9.-]+/g, '');
    const parsed = parseFloat(clean);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

export class CommercialPolicyClassifier {
  classify(
    pricingFacts: {
      readonly hourlyRate?: RawCandidateFact;
      readonly dailyRate?: RawCandidateFact;
      readonly weeklyRate?: RawCandidateFact;
      readonly monthlyRate?: RawCandidateFact;
      readonly securityDeposit?: RawCandidateFact;
      readonly replacementValue?: RawCandidateFact;
      readonly currency?: RawCandidateFact;
    },
    ruleFacts: {
      readonly minDuration?: RawCandidateFact;
      readonly maxDuration?: RawCandidateFact;
      readonly deliveryFee?: RawCandidateFact;
      readonly generalRules?: RawCandidateFact;
    },
  ): CommercialPolicyClassificationResult {
    const classifications: CommercialPolicyFieldClassification[] = [];

    // Hourly Rate
    const hr = parseNumber(pricingFacts.hourlyRate?.rawValue);
    if (hr !== undefined) {
      const isInvalid = hr < 0 || hr > 1000000;
      classifications.push({
        fieldName: 'pricingHints.hourlyRate',
        normalizedValue: hr,
        confidence: isInvalid ? 'CONFLICT' : 'REVIEW_RECOMMENDED',
        reasonCode: isInvalid ? 'COMMERCIAL_PRICE_OUT_OF_BOUNDS' : 'COMMERCIAL_PRICING_HINT_REQUIRES_REVIEW',
        requiresReview: true,
      });
    }

    // Daily Rate
    const dr = parseNumber(pricingFacts.dailyRate?.rawValue);
    if (dr !== undefined) {
      const isInvalid = dr < 0 || dr > 10000000;
      classifications.push({
        fieldName: 'pricingHints.dailyRate',
        normalizedValue: dr,
        confidence: isInvalid ? 'CONFLICT' : 'REVIEW_RECOMMENDED',
        reasonCode: isInvalid ? 'COMMERCIAL_PRICE_OUT_OF_BOUNDS' : 'COMMERCIAL_PRICING_HINT_REQUIRES_REVIEW',
        requiresReview: true,
      });
    }

    // Weekly Rate
    const wr = parseNumber(pricingFacts.weeklyRate?.rawValue);
    if (wr !== undefined) {
      const isInvalid = wr < 0 || wr > 50000000;
      classifications.push({
        fieldName: 'pricingHints.weeklyRate',
        normalizedValue: wr,
        confidence: isInvalid ? 'CONFLICT' : 'REVIEW_RECOMMENDED',
        reasonCode: isInvalid ? 'COMMERCIAL_PRICE_OUT_OF_BOUNDS' : 'COMMERCIAL_PRICING_HINT_REQUIRES_REVIEW',
        requiresReview: true,
      });
    }

    // Monthly Rate
    const mr = parseNumber(pricingFacts.monthlyRate?.rawValue);
    if (mr !== undefined) {
      const isInvalid = mr < 0 || mr > 100000000;
      classifications.push({
        fieldName: 'pricingHints.monthlyRate',
        normalizedValue: mr,
        confidence: isInvalid ? 'CONFLICT' : 'REVIEW_RECOMMENDED',
        reasonCode: isInvalid ? 'COMMERCIAL_PRICE_OUT_OF_BOUNDS' : 'COMMERCIAL_PRICING_HINT_REQUIRES_REVIEW',
        requiresReview: true,
      });
    }

    // Security Deposit
    const dep = parseNumber(pricingFacts.securityDeposit?.rawValue);
    if (dep !== undefined) {
      const isInvalid = dep < 0 || dep > 100000000;
      classifications.push({
        fieldName: 'pricingHints.securityDeposit',
        normalizedValue: dep,
        confidence: isInvalid ? 'CONFLICT' : 'REVIEW_RECOMMENDED',
        reasonCode: isInvalid ? 'COMMERCIAL_DEPOSIT_OUT_OF_BOUNDS' : 'COMMERCIAL_DEPOSIT_REQUIRES_REVIEW',
        requiresReview: true,
      });
    }

    // Replacement Value
    const repVal = parseNumber(pricingFacts.replacementValue?.rawValue);
    if (repVal !== undefined) {
      const isInvalid = repVal < 0 || repVal > 1000000000;
      classifications.push({
        fieldName: 'pricingHints.replacementValue',
        normalizedValue: repVal,
        confidence: isInvalid ? 'CONFLICT' : 'REVIEW_RECOMMENDED',
        reasonCode: isInvalid ? 'COMMERCIAL_VALUE_OUT_OF_BOUNDS' : 'COMMERCIAL_VALUE_REQUIRES_REVIEW',
        requiresReview: true,
      });
    }

    // Currency
    const currencyStr = typeof pricingFacts.currency?.rawValue === 'string'
      ? pricingFacts.currency.rawValue.trim().toUpperCase()
      : 'PHP';
    classifications.push({
      fieldName: 'pricingHints.currency',
      normalizedValue: currencyStr,
      confidence: 'REVIEW_RECOMMENDED',
      reasonCode: 'COMMERCIAL_CURRENCY_REQUIRES_CONFIRMATION',
      requiresReview: true,
    });

    // Min Duration
    const minDur = parseNumber(ruleFacts.minDuration?.rawValue);
    if (minDur !== undefined) {
      classifications.push({
        fieldName: 'rules.minDuration',
        normalizedValue: Math.floor(minDur),
        confidence: minDur < 1 ? 'CONFLICT' : 'REVIEW_RECOMMENDED',
        reasonCode: minDur < 1 ? 'RULE_DURATION_INVALID' : 'RULE_POLICY_REQUIRES_REVIEW',
        requiresReview: true,
      });
    }

    // Max Duration
    const maxDur = parseNumber(ruleFacts.maxDuration?.rawValue);
    if (maxDur !== undefined) {
      classifications.push({
        fieldName: 'rules.maxDuration',
        normalizedValue: Math.floor(maxDur),
        confidence: maxDur < 1 ? 'CONFLICT' : 'REVIEW_RECOMMENDED',
        reasonCode: maxDur < 1 ? 'RULE_DURATION_INVALID' : 'RULE_POLICY_REQUIRES_REVIEW',
        requiresReview: true,
      });
    }

    // Delivery Fee
    const delFee = parseNumber(ruleFacts.deliveryFee?.rawValue);
    if (delFee !== undefined) {
      classifications.push({
        fieldName: 'rules.deliveryFee',
        normalizedValue: delFee,
        confidence: delFee < 0 ? 'CONFLICT' : 'REVIEW_RECOMMENDED',
        reasonCode: delFee < 0 ? 'COMMERCIAL_PRICE_OUT_OF_BOUNDS' : 'COMMERCIAL_DELIVERY_FEE_REQUIRES_REVIEW',
        requiresReview: true,
      });
    }

    // General Rules
    const genRules = typeof ruleFacts.generalRules?.rawValue === 'string'
      ? ruleFacts.generalRules.rawValue.trim()
      : undefined;
    if (genRules) {
      classifications.push({
        fieldName: 'rules.generalRules',
        normalizedValue: genRules,
        confidence: 'REVIEW_RECOMMENDED',
        reasonCode: 'RULE_TERMS_REQUIRE_PROVIDER_REVIEW',
        requiresReview: true,
      });
    }

    return Object.freeze({
      classifications: Object.freeze(classifications),
      pricingHints: Object.freeze({
        hourlyRate: hr,
        dailyRate: dr,
        weeklyRate: wr,
        monthlyRate: mr,
        securityDeposit: dep,
        replacementValue: repVal,
        currency: currencyStr,
      }),
      ruleHints: Object.freeze({
        minDuration: minDur !== undefined ? Math.floor(minDur) : undefined,
        maxDuration: maxDur !== undefined ? Math.floor(maxDur) : undefined,
        deliveryFee: delFee,
        generalRules: genRules,
      }),
    });
  }
}
