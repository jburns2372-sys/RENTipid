/**
 * RENTipid GLOBAL-MKT / v2.0 — Verification Domain Separation Contract
 *
 * Explicitly distinguishes independent security, identity, and marketplace domains.
 * Prevents collapsing multiple distinct verification dimensions into a single boolean.
 */

export const VERIFICATION_DOMAINS = [
  'AUTHENTICATION',
  'CONTACT_VERIFICATION',
  'IDENTITY_VERIFICATION',
  'KYC_DUE_DILIGENCE',
  'BUSINESS_VERIFICATION',
  'PROVIDER_ELIGIBILITY',
  'MARKETPLACE_ROLE',
  'MARKET_CAPABILITY',
] as const;

export type VerificationDomain = (typeof VERIFICATION_DOMAINS)[number];

export const ALL_VERIFICATION_DOMAINS: readonly VerificationDomain[] = Object.freeze([...VERIFICATION_DOMAINS]);

export interface VerificationDomainStatus {
  readonly domain: VerificationDomain;
  readonly satisfied: boolean;
  readonly state: string;
  readonly lastEvaluatedAt: string;
  readonly details?: string;
}
