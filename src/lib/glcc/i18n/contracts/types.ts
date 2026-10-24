/**
 * RENTipid GLCC v1.0.1 — Translation Contract Types
 *
 * Defines the core types, bundle interfaces, content classifications, and validation models.
 */

import type { LocaleReleaseStatus } from '../../registry-contracts';

export type TranslationContentType =
  | 'STANDARD_UI'
  | 'VALIDATION'
  | 'SYSTEM_MESSAGE'
  | 'TRANSACTIONAL_UI'
  | 'LEGAL_CONTROLLED'
  | 'SAFETY_CONTROLLED'
  | 'PAYMENT_CONTROLLED'
  | 'ACCESSIBILITY'
  | 'DOCUMENT_LABEL';

export type RequiredDomain =
  | 'common'
  | 'navigation'
  | 'auth'
  | 'preferences'
  | 'marketplace'
  | 'listing'
  | 'search'
  | 'booking'
  | 'checkout'
  | 'payment'
  | 'account'
  | 'profile'
  | 'provider'
  | 'renter'
  | 'partnerHub'
  | 'messages'
  | 'notifications'
  | 'reviews'
  | 'kyc'
  | 'insurance'
  | 'support'
  | 'helpCenter'
  | 'trustSafety'
  | 'legalCompliance'
  | 'admin'
  | 'superAdmin'
  | 'soc'
  | 'errors'
  | 'validation'
  | 'status'
  | 'documents';

export interface TranslationBundle {
  readonly locale: string;
  readonly direction: 'ltr' | 'rtl';
  readonly version: string;
  readonly isFixture?: boolean;
  readonly releaseStatus?: LocaleReleaseStatus;
  readonly messages: Record<string, string>;
}

export interface TranslationParams {
  [key: string]: string | number;
}

export interface TranslationEngineOptions {
  readonly defaultLocale?: string;
  readonly onMissingKey?: (key: string, locale: string) => void;
  readonly onFallbackUsed?: (key: string, requestedLocale: string, fallbackLocale: string) => void;
}

export interface CurrencyFormatOptions {
  readonly display?: 'symbol' | 'narrowSymbol' | 'code' | 'name';
  readonly minorUnitExponent?: number;
}

export interface PluralForms {
  readonly one: string;
  readonly other: string;
  readonly zero?: string;
  readonly two?: string;
  readonly few?: string;
  readonly many?: string;
}

export interface BundleValidationOptions {
  readonly allowPartial?: boolean;
  readonly releaseStatus?: LocaleReleaseStatus;
}

export interface BundleValidationResult {
  readonly isValid: boolean;
  readonly locale: string;
  readonly totalRequiredKeys: number;
  readonly presentKeysCount: number;
  readonly missingKeys: string[];
  readonly extraKeys: string[];
  readonly emptyKeys: string[];
  readonly coveragePercentage: number;
  readonly placeholderMismatches: Array<{
    key: string;
    expected: string[];
    actual: string[];
  }>;
}
