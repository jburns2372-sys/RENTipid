/**
 * RENTipid GLOBAL-MKT / v2.0 — GM-4A Targeted Verification & Acceptance Runner
 *
 * Runs comprehensive programmatic verification across:
 * 1. Global Location Model & Coordinate Bounds (-90..90, -180..180)
 * 2. 46-Country AddressProfile Resolution & Registry Invariant (46/46, 0 duplicates)
 * 3. Unknown Jurisdiction Fail-Closed on Location & Address
 * 4. Philippine PSGC Compatibility & Domestic Profile Preservation
 * 5. Location Privacy Protection & Public View Precision Masking
 * 6. Provider-Neutral Geocoding Abstraction & Unconfigured Stubs
 * 7. Global Pricing Foundation, Integer Money Contracts, and No Fake FX
 * 8. Global Listing Lifecycle States (9 states) & State Transition Machine
 * 9. Server-Authoritative Listing Ownership & Anti-Tampering Security
 * 10. Server-Authoritative Publication Gate (Consuming GM-1, GM-2, GM-3A, and Category Policy)
 * 11. Global Search & Discovery Engine, Public Visibility Gating, and International Discovery
 * 12. Bounded Nearby Geosearch (Haversine Distance) & Input Sanitization
 * 13. Representative 7-Market Matrix (PH, TH, CN, SG, JP, US, DE)
 * 14. Zero Commercially Active Jurisdictions & China Deferred Blockers Preservation
 */

import {
  type GlobalLocation,
  type Coordinates,
  validateCoordinates,
  sanitizeCoordinates,
} from '../src/lib/global-market/location/contracts/location';

import {
  getJurisdictionAddressProfile,
  getAllJurisdictionAddressProfiles,
  getAuthoritativeAddressProfileCount,
  isAddressProfileSupported,
} from '../src/lib/global-market/location/registry/jurisdiction-address-registry';

import {
  validateLocation,
  toPublicLocation,
  calculateDistanceKm,
} from '../src/lib/global-market/location/services/location-service';

import {
  getGeocodingProviderAdapter,
  KNOWN_GEOCODING_PROVIDERS,
} from '../src/lib/global-market/location/adapters';

import {
  createMoneyAmount,
  moneyAmountToDecimal,
  formatMoneyAmount,
  presentListingPrice,
  validateListingPricing,
} from '../src/lib/global-market/pricing/services/pricing-service';

import {
  ALL_LISTING_LIFECYCLE_STATUSES,
  canTransitionListingStatus,
  isPubliclyDiscoverable,
} from '../src/lib/global-market/supply/contracts/listing-lifecycle';

import {
  type CategoryJurisdictionPolicy,
} from '../src/lib/global-market/supply/contracts/category-policy';

import {
  createDraftListingRecord,
  updateListingDraft,
} from '../src/lib/global-market/supply/services/listing-service';

import {
  canPublishListing,
} from '../src/lib/global-market/supply/services/publication-gate';

import {
  searchListings,
  validateSearchQuery,
} from '../src/lib/global-market/discovery/services/search-service';

import { GLOBAL_COUNTRY_CATALOG } from '../src/lib/glcc/country/country-registry';
import {
  getCommerciallyActiveCountries,
  getJurisdictionProfile,
} from '../src/lib/global-market/registry/market-capability-registry';
import { buildGlobalAccountContext } from '../src/lib/global-market/account/services/account-service';
import { buildGlobalTrustProfile } from '../src/lib/global-market/trust/services/trust-service';

interface TestRecord {
  code: string;
  name: string;
  passed: boolean;
  details?: string;
}

const records: TestRecord[] = [];

function check(code: string, name: string, passed: boolean, details?: string) {
  records.push({ code, name, passed, details });
  const badge = passed ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
  console.log(`[${badge}] ${code}: ${name}`);
  if (!passed && details) {
    console.log(`       Error: ${details}`);
  }
}

async function runGm4aSuite() {
  console.log('========================================================');
  console.log('RENTipid GLOBAL-MKT / v2.0 — GM-4A ACCEPTANCE SUITE');
  console.log('GLOBAL LOCATION, LISTING, PRICING & SEARCH DISCOVERY');
  console.log('========================================================\n');

  // 1. Global Location Model & Coordinate Bounds
  try {
    const validBounds =
      validateCoordinates({ latitude: 14.5995, longitude: 120.9842 }).valid &&
      validateCoordinates({ latitude: -90, longitude: -180 }).valid &&
      validateCoordinates({ latitude: 90, longitude: 180 }).valid;

    const invalidBounds =
      !validateCoordinates({ latitude: 90.0001, longitude: 0 }).valid &&
      !validateCoordinates({ latitude: -90.0001, longitude: 0 }).valid &&
      !validateCoordinates({ latitude: 0, longitude: 180.0001 }).valid &&
      !validateCoordinates({ latitude: 0, longitude: -180.0001 }).valid;

    const sanitized = sanitizeCoordinates({ latitude: 14.59951234, longitude: 120.98421234 });
    const sanitOk = sanitized !== null && sanitized.latitude === 14.599512;

    check('GM4A-01', 'Global coordinate bounds (-90..90, -180..180) and sanitization', validBounds && invalidBounds && sanitOk);
  } catch (e: any) {
    check('GM4A-01', 'Global coordinate bounds (-90..90, -180..180) and sanitization', false, e.message);
  }

  // 2. 46 Authoritative AddressProfile Resolution & Registry Invariant
  try {
    const count = getAuthoritativeAddressProfileCount();
    const all46 = GLOBAL_COUNTRY_CATALOG.every(c => {
      const p = getJurisdictionAddressProfile(c.code);
      return p !== null && p.countryCode === c.code && p.status === 'READY';
    });
    check('GM4A-02', 'All 46 authoritative jurisdictions resolve AddressProfiles without duplicate registries', count === 46 && all46);
  } catch (e: any) {
    check('GM4A-02', 'All 46 authoritative jurisdictions resolve AddressProfiles without duplicate registries', false, e.message);
  }

  // 3. Unknown Jurisdiction Fail-Closed
  try {
    const closed =
      getJurisdictionAddressProfile('XX') === null &&
      getJurisdictionAddressProfile('') === null &&
      !isAddressProfileSupported('XX') &&
      !validateLocation({ countryCode: 'XX', addressLine1: 'Test', locality: 'City', precision: 'EXACT' }).valid;
    check('GM4A-03', 'Unknown jurisdiction fails closed across address and location validation', closed);
  } catch (e: any) {
    check('GM4A-03', 'Unknown jurisdiction fails closed across address and location validation', false, e.message);
  }

  // 4. Philippine PSGC Compatibility & Domestic Profile Preservation
  try {
    const ph = getJurisdictionAddressProfile('PH');
    const phOk =
      ph !== null &&
      ph.psgcSupported === true &&
      ph.requiredFields.includes('addressLine1') &&
      ph.requiredFields.includes('locality') &&
      ph.requiredFields.includes('administrativeAreaLevel1') &&
      ph.requiredFields.includes('postalCode');
    check('GM4A-04', 'Philippine PSGC compatibility preserved as domestic address adapter', phOk);
  } catch (e: any) {
    check('GM4A-04', 'Philippine PSGC compatibility preserved as domestic address adapter', false, e.message);
  }

  // 5. Location Privacy Protection & Public View Precision Masking
  try {
    const privateLocation: GlobalLocation = {
      countryCode: 'PH',
      addressLine1: 'Unit 402, Secret St',
      addressLine2: 'Apt 4B',
      locality: 'Makati City',
      administrativeAreaLevel1: 'Metro Manila',
      postalCode: '1200',
      coordinates: { latitude: 14.5547, longitude: 121.0244 },
      precision: 'EXACT',
    };
    const pub = toPublicLocation(privateLocation);
    const masked =
      pub.addressLine1 === undefined &&
      pub.addressLine2 === undefined &&
      pub.postalCode === undefined &&
      pub.locality === 'Makati City' &&
      pub.precision === 'LOCALITY_ONLY' &&
      pub.coordinates?.latitude === 14.55 &&
      pub.coordinates?.longitude === 121.02;
    check('GM4A-05', 'Location privacy masks exact private street addresses and clamps coordinates to ~1km', masked);
  } catch (e: any) {
    check('GM4A-05', 'Location privacy masks exact private street addresses and clamps coordinates to ~1km', false, e.message);
  }

  // 6. Provider-Neutral Geocoding Abstraction & Unconfigured Stubs
  try {
    const stubsOk = KNOWN_GEOCODING_PROVIDERS.every(p => {
      const adapter = getGeocodingProviderAdapter(p);
      return adapter.providerId === p && adapter.isConfigured === false;
    });
    check('GM4A-06', 'Provider-neutral geocoding abstraction with stubs strictly NOT_CONFIGURED', stubsOk && KNOWN_GEOCODING_PROVIDERS.length >= 4);
  } catch (e: any) {
    check('GM4A-06', 'Provider-neutral geocoding abstraction with stubs strictly NOT_CONFIGURED', false, e.message);
  }

  // 7. Global Pricing Foundation, Integer Money Contracts, and No Fake FX
  try {
    const php = createMoneyAmount(1500.5, 'PHP');
    const jpy = createMoneyAmount(2500, 'JPY');
    const moneyOk = php.amountCents === 150050 && jpy.amountCents === 2500;

    // No Fake FX check
    const diffCurrency = presentListingPrice(php, 'USD');
    const noFakeFx =
      diffCurrency.displayAmount === 1500.5 &&
      diffCurrency.displayCurrency === 'PHP' &&
      diffCurrency.conversionAvailable === false &&
      (diffCurrency.notes?.includes('NO_FAKE_FX') ?? false);

    check('GM4A-07', 'Global pricing foundation enforces integer minor-unit money and strictly suppresses fake FX', moneyOk && noFakeFx);
  } catch (e: any) {
    check('GM4A-07', 'Global pricing foundation enforces integer minor-unit money and strictly suppresses fake FX', false, e.message);
  }

  // 8. Global Listing Lifecycle States (9 states) & State Transition Machine
  try {
    const nineStates = ALL_LISTING_LIFECYCLE_STATUSES.length === 9;
    const transitionsOk =
      canTransitionListingStatus('DRAFT', 'READY_FOR_REVIEW') &&
      canTransitionListingStatus('READY_FOR_REVIEW', 'PENDING_REVIEW') &&
      canTransitionListingStatus('PENDING_REVIEW', 'PUBLISHED') &&
      canTransitionListingStatus('PUBLISHED', 'PAUSED') &&
      !canTransitionListingStatus('DRAFT', 'PUBLISHED') && // cannot bypass review
      !canTransitionListingStatus('ARCHIVED', 'PUBLISHED'); // terminal
    const discoverable = isPubliclyDiscoverable('PUBLISHED') && !isPubliclyDiscoverable('DRAFT') && !isPubliclyDiscoverable('SUSPENDED');
    check('GM4A-08', 'Controlled 9-state global listing lifecycle with transition guards', nineStates && transitionsOk && discoverable);
  } catch (e: any) {
    check('GM4A-08', 'Controlled 9-state global listing lifecycle with transition guards', false, e.message);
  }

  // 9. Server-Authoritative Listing Ownership & Anti-Tampering Security
  try {
    const draft = createDraftListingRecord('user-prov-1', {
      title: 'Original Title',
      categoryId: 'cat-cameras',
      countryCode: 'PH',
      location: { countryCode: 'PH', locality: 'Makati', precision: 'EXACT' },
      pricing: { baseRateCents: 100000, currency: 'PHP', rateType: 'DAILY' },
    });

    const canOwnerUpdate = updateListingDraft('user-prov-1', draft, { title: 'Updated Title' }).title === 'Updated Title';

    let tamperBlocked = false;
    try {
      updateListingDraft('user-attacker-2', draft, { title: 'Hijacked' });
    } catch (e: any) {
      tamperBlocked = e.message.includes('OWNERSHIP_VIOLATION');
    }

    check('GM4A-09', 'Server-authoritative provider ownership prevents hijacking and payload tampering', canOwnerUpdate && tamperBlocked);
  } catch (e: any) {
    check('GM4A-09', 'Server-authoritative provider ownership prevents hijacking and payload tampering', false, e.message);
  }

  // 10. Server-Authoritative Publication Gate
  try {
    const validLoc: GlobalLocation = {
      countryCode: 'PH',
      addressLine1: '123 Ayala Ave',
      locality: 'Makati City',
      administrativeAreaLevel1: 'Metro Manila',
      postalCode: '1226',
      precision: 'EXACT',
    };
    const validPrice = { baseRateCents: 200000, currency: 'PHP', rateType: 'DAILY' as const };

    // Renter blocked
    const renterCtx = buildGlobalAccountContext({ userId: 'u-renter', email: 'r@t.com', fullName: 'Renter', legacyRole: 'RENTER', countryCode: 'PH' });
    const renterRes = canPublishListing({ account: renterCtx, listing: { id: 'l1', providerId: 'u-renter', countryCode: 'PH', status: 'DRAFT', title: 'T', location: validLoc, pricing: validPrice } });

    // KYC required blocked
    const provPendingKyc = buildGlobalAccountContext({ userId: 'u-prov', email: 'p@t.com', fullName: 'Prov', legacyRole: 'PROVIDER', accountStatus: 'Verified', providerOnboardingState: 'APPROVED', kycVerificationStatus: 'Pending', countryCode: 'PH' });
    const kycRes = canPublishListing({ account: provPendingKyc, trust: buildGlobalTrustProfile('u-prov', 'PH', 'INDIVIDUAL', 'IN_REVIEW'), listing: { id: 'l2', providerId: 'u-prov', countryCode: 'PH', status: 'DRAFT', title: 'T', location: validLoc, pricing: validPrice } });

    // Full approval passes
    const provApproved = buildGlobalAccountContext({ userId: 'u-prov-ok', email: 'ok@t.com', fullName: 'Prov OK', legacyRole: 'PROVIDER', accountStatus: 'Verified', providerOnboardingState: 'APPROVED', kycVerificationStatus: 'Verified', countryCode: 'PH' });
    const passRes = canPublishListing({ account: provApproved, trust: buildGlobalTrustProfile('u-prov-ok', 'PH', 'INDIVIDUAL', 'APPROVED'), listing: { id: 'l3', providerId: 'u-prov-ok', countryCode: 'PH', status: 'DRAFT', title: 'T', location: validLoc, pricing: validPrice } });

    const gateOk =
      renterRes.allowed === false && renterRes.reasonCode === 'PROVIDER_ROLE_REQUIRED' &&
      kycRes.allowed === false && kycRes.reasonCode === 'KYC_VERIFICATION_REQUIRED' &&
      passRes.allowed === true && passRes.reasonCode === 'GATE_PASSED';

    check('GM4A-10', 'Publication gate combines GM-1, GM-2, GM-3A, location, pricing, and category policy', gateOk);
  } catch (e: any) {
    check('GM4A-10', 'Publication gate combines GM-1, GM-2, GM-3A, location, pricing, and category policy', false, e.message);
  }

  // 11. Global Search & Discovery Engine, Public Visibility Gating, and International Discovery
  try {
    const mockListings = [
      {
        id: 'p-ph-1', providerId: 'prov-1', countryCode: 'PH', jurisdictionCode: 'JUR-PH', status: 'PUBLISHED' as const,
        title: 'Sony Alpha Camera', location: { countryCode: 'PH', locality: 'Makati', precision: 'EXACT' as const },
        pricing: { baseRateCents: 200000, currency: 'PHP', rateType: 'DAILY' as const }, createdAt: '2026-10-01Z', updatedAt: '2026-10-01Z',
      },
      {
        id: 'd-ph-2', providerId: 'prov-2', countryCode: 'PH', jurisdictionCode: 'JUR-PH', status: 'DRAFT' as const, // MUST BE HIDDEN
        title: 'Draft Secret Camera', location: { countryCode: 'PH', locality: 'Manila', precision: 'EXACT' as const },
        pricing: { baseRateCents: 150000, currency: 'PHP', rateType: 'DAILY' as const }, createdAt: '2026-10-02Z', updatedAt: '2026-10-02Z',
      },
      {
        id: 'p-jp-1', providerId: 'prov-3', countryCode: 'JP', jurisdictionCode: 'JUR-JP', status: 'PUBLISHED' as const,
        title: 'Fujifilm Camera', location: { countryCode: 'JP', locality: 'Tokyo', precision: 'EXACT' as const },
        pricing: { baseRateCents: 6000, currency: 'JPY', rateType: 'DAILY' as const }, createdAt: '2026-10-03Z', updatedAt: '2026-10-03Z',
      },
    ];

    const pubOnlySearch = searchListings(mockListings, { countryCode: 'PH' });
    const noDraft = pubOnlySearch.totalCount === 1 && pubOnlySearch.items[0].id === 'p-ph-1';

    const intlSearch = searchListings(mockListings, {});
    const intlOk = intlSearch.totalCount === 2 && intlSearch.items.some(i => i.countryCode === 'JP') && intlSearch.items.some(i => i.countryCode === 'PH');

    check('GM4A-11', 'Global search enforces strict public visibility and supports international discovery', noDraft && intlOk);
  } catch (e: any) {
    check('GM4A-11', 'Global search enforces strict public visibility and supports international discovery', false, e.message);
  }

  // 12. Bounded Nearby Geosearch (Haversine Distance) & Input Sanitization
  try {
    const coord1: Coordinates = { latitude: 14.5995, longitude: 120.9842 }; // Manila
    const coord2: Coordinates = { latitude: 14.5547, longitude: 121.0244 }; // Makati
    const dist = calculateDistanceKm(coord1, coord2);
    const distOk = dist > 6.0 && dist < 7.5;

    const invalidSearch = !validateSearchQuery({ countryCode: 'XX' }).valid;
    const invalidCoords = !validateSearchQuery({ nearby: { center: { latitude: 95, longitude: 0 }, radiusKm: 10 } }).valid;
    const negRadius = !validateSearchQuery({ nearby: { center: { latitude: 0, longitude: 0 }, radiusKm: -5 } }).valid;

    check('GM4A-12', 'Deterministic Haversine geosearch with strict boundary & coordinate validation', distOk && invalidSearch && invalidCoords && negRadius);
  } catch (e: any) {
    check('GM4A-12', 'Deterministic Haversine geosearch with strict boundary & coordinate validation', false, e.message);
  }

  // 13. Representative 7-Market Matrix
  try {
    const markets = ['PH', 'TH', 'CN', 'SG', 'JP', 'US', 'DE'];
    const matrixOk = markets.every(m => {
      const profile = getJurisdictionAddressProfile(m);
      return profile !== null && profile.countryCode === m && profile.status === 'READY';
    });
    check('GM4A-13', 'Representative 7-market matrix (PH, TH, CN, SG, JP, US, DE) resolves cleanly', matrixOk);
  } catch (e: any) {
    check('GM4A-13', 'Representative 7-market matrix (PH, TH, CN, SG, JP, US, DE) resolves cleanly', false, e.message);
  }

  // 14. Commercial Inactivity Invariant & China Deferred Blockers Preservation
  try {
    const active = getCommerciallyActiveCountries();
    const activeZero = active.length === 0;

    const cnCapability = getJurisdictionProfile('CN');
    const blockersPreserved =
      cnCapability !== undefined &&
      cnCapability.knownBlockers.length === 2 &&
      cnCapability.knownBlockers.some(b => b.includes('ICP')) &&
      cnCapability.knownBlockers.some(b => b.includes('Cross-Border')) &&
      cnCapability.operationalRestrictions.includes('MAINLAND_CHINA_PUBLIC_NETWORK_OPERABILITY_NOT_CLAIMED');

    check('GM4A-14', 'Commercial inactivity invariant (0 active markets) and China deferred blockers preserved', activeZero && blockersPreserved);
  } catch (e: any) {
    check('GM4A-14', 'Commercial inactivity invariant (0 active markets) and China deferred blockers preserved', false, e.message);
  }

  console.log('\n========================================================');
  const allPassed = records.every(r => r.passed);
  if (allPassed) {
    console.log(`\x1b[32mGM-4A TARGETED VERIFICATION: ALL ${records.length} CHECKS PASSED\x1b[0m`);
    console.log('========================================================');
    process.exit(0);
  } else {
    const failedCount = records.filter(r => !r.passed).length;
    console.log(`\x1b[31mGM-4A TARGETED VERIFICATION: ${failedCount} FAILED OUT OF ${records.length}\x1b[0m`);
    console.log('========================================================');
    process.exit(1);
  }
}

runGm4aSuite().catch(err => {
  console.error('Fatal execution error in GM-4A runner:', err);
  process.exit(1);
});
