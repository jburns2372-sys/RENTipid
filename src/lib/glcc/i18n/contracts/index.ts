/**
 * RENTipid GLCC v1.0.1 — Authoritative Translation Contract Aggregator
 *
 * One canonical translation contract aggregator representing all 31 application domains.
 */

import { COMMON_KEYS, COMMON_EN_PH } from './common';
import { NAVIGATION_KEYS, NAVIGATION_EN_PH } from './navigation';
import { AUTH_KEYS, AUTH_EN_PH } from './auth';
import { PREFERENCES_KEYS, PREFERENCES_EN_PH } from './preferences';
import { MARKETPLACE_KEYS, MARKETPLACE_EN_PH } from './marketplace';
import { LISTING_KEYS, LISTING_EN_PH } from './listing';
import { SEARCH_KEYS, SEARCH_EN_PH } from './search';
import { BOOKING_KEYS, BOOKING_EN_PH } from './booking';
import { CHECKOUT_KEYS, CHECKOUT_EN_PH } from './checkout';
import { PAYMENT_KEYS, PAYMENT_EN_PH } from './payment';
import { ACCOUNT_KEYS, ACCOUNT_EN_PH } from './account';
import { PROFILE_KEYS, PROFILE_EN_PH } from './profile';
import { PROVIDER_KEYS, PROVIDER_EN_PH } from './provider';
import { RENTER_KEYS, RENTER_EN_PH } from './renter';
import { PARTNERHUB_KEYS, PARTNERHUB_EN_PH } from './partnerHub';
import { MESSAGES_KEYS, MESSAGES_EN_PH } from './messages';
import { NOTIFICATIONS_KEYS, NOTIFICATIONS_EN_PH } from './notifications';
import { REVIEWS_KEYS, REVIEWS_EN_PH } from './reviews';
import { KYC_KEYS, KYC_EN_PH } from './kyc';
import { INSURANCE_KEYS, INSURANCE_EN_PH } from './insurance';
import { SUPPORT_KEYS, SUPPORT_EN_PH } from './support';
import { HELPCENTER_KEYS, HELPCENTER_EN_PH } from './helpCenter';
import { TRUSTSAFETY_KEYS, TRUSTSAFETY_EN_PH } from './trustSafety';
import { LEGALCOMPLIANCE_KEYS, LEGALCOMPLIANCE_EN_PH } from './legalCompliance';
import { ADMIN_KEYS, ADMIN_EN_PH } from './admin';
import { SUPERADMIN_KEYS, SUPERADMIN_EN_PH } from './superAdmin';
import { SOC_KEYS, SOC_EN_PH } from './soc';
import { ERRORS_KEYS, ERRORS_EN_PH } from './errors';
import { VALIDATION_KEYS, VALIDATION_EN_PH } from './validation';
import { STATUS_KEYS, STATUS_EN_PH } from './status';
import { DOCUMENTS_KEYS, DOCUMENTS_EN_PH } from './documents';

export * from './types';

export const TRANSLATION_CONTRACT_VERSION = '1.0.1';

export const GLCC_REQUIRED_DOMAINS = [
  "common",
  "navigation",
  "auth",
  "preferences",
  "marketplace",
  "listing",
  "search",
  "booking",
  "checkout",
  "payment",
  "account",
  "profile",
  "provider",
  "renter",
  "partnerHub",
  "messages",
  "notifications",
  "reviews",
  "kyc",
  "insurance",
  "support",
  "helpCenter",
  "trustSafety",
  "legalCompliance",
  "admin",
  "superAdmin",
  "soc",
  "errors",
  "validation",
  "status",
  "documents"
] as const;

export const GLCC_CANONICAL_KEYS = [
  ...COMMON_KEYS,
  ...NAVIGATION_KEYS,
  ...AUTH_KEYS,
  ...PREFERENCES_KEYS,
  ...MARKETPLACE_KEYS,
  ...LISTING_KEYS,
  ...SEARCH_KEYS,
  ...BOOKING_KEYS,
  ...CHECKOUT_KEYS,
  ...PAYMENT_KEYS,
  ...ACCOUNT_KEYS,
  ...PROFILE_KEYS,
  ...PROVIDER_KEYS,
  ...RENTER_KEYS,
  ...PARTNERHUB_KEYS,
  ...MESSAGES_KEYS,
  ...NOTIFICATIONS_KEYS,
  ...REVIEWS_KEYS,
  ...KYC_KEYS,
  ...INSURANCE_KEYS,
  ...SUPPORT_KEYS,
  ...HELPCENTER_KEYS,
  ...TRUSTSAFETY_KEYS,
  ...LEGALCOMPLIANCE_KEYS,
  ...ADMIN_KEYS,
  ...SUPERADMIN_KEYS,
  ...SOC_KEYS,
  ...ERRORS_KEYS,
  ...VALIDATION_KEYS,
  ...STATUS_KEYS,
  ...DOCUMENTS_KEYS,
] as const;

export type GlccCanonicalTranslationKey = (typeof GLCC_CANONICAL_KEYS)[number];

export const CANONICAL_EN_PH_MESSAGES: Record<GlccCanonicalTranslationKey, string> = {
  ...COMMON_EN_PH,
  ...NAVIGATION_EN_PH,
  ...AUTH_EN_PH,
  ...PREFERENCES_EN_PH,
  ...MARKETPLACE_EN_PH,
  ...LISTING_EN_PH,
  ...SEARCH_EN_PH,
  ...BOOKING_EN_PH,
  ...CHECKOUT_EN_PH,
  ...PAYMENT_EN_PH,
  ...ACCOUNT_EN_PH,
  ...PROFILE_EN_PH,
  ...PROVIDER_EN_PH,
  ...RENTER_EN_PH,
  ...PARTNERHUB_EN_PH,
  ...MESSAGES_EN_PH,
  ...NOTIFICATIONS_EN_PH,
  ...REVIEWS_EN_PH,
  ...KYC_EN_PH,
  ...INSURANCE_EN_PH,
  ...SUPPORT_EN_PH,
  ...HELPCENTER_EN_PH,
  ...TRUSTSAFETY_EN_PH,
  ...LEGALCOMPLIANCE_EN_PH,
  ...ADMIN_EN_PH,
  ...SUPERADMIN_EN_PH,
  ...SOC_EN_PH,
  ...ERRORS_EN_PH,
  ...VALIDATION_EN_PH,
  ...STATUS_EN_PH,
  ...DOCUMENTS_EN_PH,
};
