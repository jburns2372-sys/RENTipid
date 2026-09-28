/**
 * RENTipid GLCC v1.0.1 — Authoritative Filipino Translation Contract Aggregator
 *
 * Aggregates all 31 application domain translations for the fil-PH bundle.
 */

import type { GlccCanonicalTranslationKey } from '../../contracts';
import { COMMON_FIL_PH } from './common';
import { NAVIGATION_FIL_PH } from './navigation';
import { AUTH_FIL_PH } from './auth';
import { PREFERENCES_FIL_PH } from './preferences';
import { MARKETPLACE_FIL_PH } from './marketplace';
import { LISTING_FIL_PH } from './listing';
import { SEARCH_FIL_PH } from './search';
import { BOOKING_FIL_PH } from './booking';
import { CHECKOUT_FIL_PH } from './checkout';
import { PAYMENT_FIL_PH } from './payment';
import { ACCOUNT_FIL_PH } from './account';
import { PROFILE_FIL_PH } from './profile';
import { PROVIDER_FIL_PH } from './provider';
import { RENTER_FIL_PH } from './renter';
import { PARTNERHUB_FIL_PH } from './partnerHub';
import { MESSAGES_FIL_PH } from './messages';
import { NOTIFICATIONS_FIL_PH } from './notifications';
import { REVIEWS_FIL_PH } from './reviews';
import { KYC_FIL_PH } from './kyc';
import { INSURANCE_FIL_PH } from './insurance';
import { SUPPORT_FIL_PH } from './support';
import { HELPCENTER_FIL_PH } from './helpCenter';
import { TRUSTSAFETY_FIL_PH } from './trustSafety';
import { LEGALCOMPLIANCE_FIL_PH } from './legalCompliance';
import { ADMIN_FIL_PH } from './admin';
import { SUPERADMIN_FIL_PH } from './superAdmin';
import { SOC_FIL_PH } from './soc';
import { ERRORS_FIL_PH } from './errors';
import { VALIDATION_FIL_PH } from './validation';
import { STATUS_FIL_PH } from './status';
import { DOCUMENTS_FIL_PH } from './documents';

export const CANONICAL_FIL_PH_MESSAGES: Record<GlccCanonicalTranslationKey, string> = {
  ...COMMON_FIL_PH,
  ...NAVIGATION_FIL_PH,
  ...AUTH_FIL_PH,
  ...PREFERENCES_FIL_PH,
  ...MARKETPLACE_FIL_PH,
  ...LISTING_FIL_PH,
  ...SEARCH_FIL_PH,
  ...BOOKING_FIL_PH,
  ...CHECKOUT_FIL_PH,
  ...PAYMENT_FIL_PH,
  ...ACCOUNT_FIL_PH,
  ...PROFILE_FIL_PH,
  ...PROVIDER_FIL_PH,
  ...RENTER_FIL_PH,
  ...PARTNERHUB_FIL_PH,
  ...MESSAGES_FIL_PH,
  ...NOTIFICATIONS_FIL_PH,
  ...REVIEWS_FIL_PH,
  ...KYC_FIL_PH,
  ...INSURANCE_FIL_PH,
  ...SUPPORT_FIL_PH,
  ...HELPCENTER_FIL_PH,
  ...TRUSTSAFETY_FIL_PH,
  ...LEGALCOMPLIANCE_FIL_PH,
  ...ADMIN_FIL_PH,
  ...SUPERADMIN_FIL_PH,
  ...SOC_FIL_PH,
  ...ERRORS_FIL_PH,
  ...VALIDATION_FIL_PH,
  ...STATUS_FIL_PH,
  ...DOCUMENTS_FIL_PH,
};
