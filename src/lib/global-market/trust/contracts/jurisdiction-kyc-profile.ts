/**
 * RENTipid GLOBAL-MKT / v2.0 — Jurisdiction KYC Profile Contract
 *
 * Defines the country-specific KYC policy, document requirements, and verification thresholds.
 */

import { type DocumentCategory } from './document-requirement';
import { type VerificationState } from './verification-state';

export interface ReverificationPolicy {
  readonly expiryMonths: number;
  readonly triggerOnSuspiciousActivity: boolean;
  readonly triggerOnBankChange: boolean;
  readonly triggerOnAddressChange: boolean;
}

export interface JurisdictionKycProfile {
  readonly countryCode: string;
  readonly countryName: string;

  // Verification requirements by role / subject
  readonly renterVerificationRequired: boolean;
  readonly providerVerificationRequired: boolean;
  readonly businessVerificationRequired: boolean;

  // Required document categories
  readonly identityDocumentsRequired: readonly DocumentCategory[];
  readonly addressProofRequired: boolean;
  readonly minimumAge: number;

  // Provider and review settings
  readonly providerAdapter: string;
  readonly manualReviewAllowed: boolean;
  readonly reverificationPolicy: ReverificationPolicy;

  // Domain activity gating requirements
  readonly publicationVerificationRequirement: VerificationState;
  readonly paymentVerificationRequirement: VerificationState;
  readonly payoutVerificationRequirement: VerificationState;

  // Operational status and governance blockers
  readonly status: 'READY' | 'VALIDATION_REQUIRED' | 'NOT_CONFIGURED' | 'BLOCKED';
  readonly blockers: readonly string[];
}
