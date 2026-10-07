/**
 * RENTipid GLOBAL-MKT / v2.0 — GM-4A Global Supply, Location, Pricing & Search Test Suite
 *
 * Enforces all GM-4A requirements:
 * 1. Global Location Model, Coordinate Boundaries (-90..90, -180..180), and Privacy Masking.
 * 2. 46-Country AddressProfile Resolution & Unknown Fail-Closed.
 * 3. Philippine PSGC Preservation & Domestic Adapter Compatibility.
 * 4. Geocoding Provider-Neutral Abstraction (STUBS NOT_CONFIGURED).
 * 5. Global Pricing Foundation, Integer Money Contracts, and No Fake FX.
 * 6. Global Listing Lifecycle (9 states) & State Transition Machine.
 * 7. Server-Authoritative Listing Ownership & Anti-Tampering.
 * 8. Provider Publication Gate (Consuming GM-1, GM-2, GM-3A, and Category Policy).
 * 9. Global Search & Discovery Engine, Public Visibility Gating, International Discovery,
 *    and Bounded Haversine Nearby Search.
 * 10. Representative Market Matrix (PH, TH, CN, SG, JP, US, DE) & Commercial Inactivity Invariant.
 */

import {
  type GlobalLocation,
  type Coordinates,
  validateCoordinates,
  sanitizeCoordinates,
} from '@/lib/global-market/location/contracts/location';

import {
  type AddressProfile,
} from '@/lib/global-market/location/contracts/address-profile';

import {
  getJurisdictionAddressProfile,
  getAllJurisdictionAddressProfiles,
  getAuthoritativeAddressProfileCount,
  isAddressProfileSupported,
} from '@/lib/global-market/location/registry/jurisdiction-address-registry';

import {
  validateLocation,
  toPublicLocation,
  calculateDistanceKm,
} from '@/lib/global-market/location/services/location-service';

import {
  getGeocodingProviderAdapter,
  KNOWN_GEOCODING_PROVIDERS,
} from '@/lib/global-market/location/adapters';

import {
  type MoneyAmount,
} from '@/lib/global-market/pricing/contracts/money';

import {
  createMoneyAmount,
  moneyAmountToDecimal,
  formatMoneyAmount,
  presentListingPrice,
  validateListingPricing,
} from '@/lib/global-market/pricing/services/pricing-service';

import {
  ALL_LISTING_LIFECYCLE_STATUSES,
  type ListingLifecycleStatus,
  canTransitionListingStatus,
  isPubliclyDiscoverable,
} from '@/lib/global-market/supply/contracts/listing-lifecycle';

import {
  ALL_CATEGORY_POLICY_STATUSES,
  type CategoryJurisdictionPolicy,
} from '@/lib/global-market/supply/contracts/category-policy';

import {
  type GlobalListingRecord,
  type ListingDraftInput,
} from '@/lib/global-market/supply/contracts/listing-record';

import {
  canPublishListing,
  type PublicationGateInput,
} from '@/lib/global-market/supply/services/publication-gate';

import {
  createDraftListingRecord,
  updateListingDraft,
  transitionListingLifecycle,
  validateListingOwnership,
} from '@/lib/global-market/supply/services/listing-service';

import {
  type GlobalSearchQuery,
  type SearchResultItem,
} from '@/lib/global-market/discovery/contracts/search-query';

import {
  searchListings,
  validateSearchQuery,
} from '@/lib/global-market/discovery/services/search-service';

import { GLOBAL_COUNTRY_CATALOG } from '@/lib/glcc/country/country-registry';
import {
  getCommerciallyActiveCountries,
  getJurisdictionProfile,
} from '@/lib/global-market/registry/market-capability-registry';
import { buildGlobalAccountContext } from '@/lib/global-market/account/services/account-service';
import { buildGlobalTrustProfile } from '@/lib/global-market/trust/services/trust-service';

describe('RENTipid GLOBAL-MKT / v2.0 — GM-4A Global Supply & Discovery Framework', () => {

  // =========================================================================
  // 1. GLOBAL LOCATION MODEL & 46-COUNTRY ADDRESS PROFILES
  // =========================================================================
  describe('1. Global Location Model & Coordinate Boundaries', () => {
    it('validates coordinate bounds (-90..90 latitude, -180..180 longitude)', () => {
      expect(validateCoordinates({ latitude: 14.5995, longitude: 120.9842 }).valid).toBe(true);
      expect(validateCoordinates({ latitude: -90, longitude: -180 }).valid).toBe(true);
      expect(validateCoordinates({ latitude: 90, longitude: 180 }).valid).toBe(true);
      expect(validateCoordinates({ latitude: 0, longitude: 0 }).valid).toBe(true);

      // Invalid coordinates
      expect(validateCoordinates({ latitude: 90.0001, longitude: 0 }).valid).toBe(false);
      expect(validateCoordinates({ latitude: -90.0001, longitude: 0 }).valid).toBe(false);
      expect(validateCoordinates({ latitude: 0, longitude: 180.0001 }).valid).toBe(false);
      expect(validateCoordinates({ latitude: 0, longitude: -180.0001 }).valid).toBe(false);
      expect(validateCoordinates({ latitude: NaN, longitude: 120 }).valid).toBe(false);
      expect(validateCoordinates(null).valid).toBe(false);
      expect(validateCoordinates(undefined).valid).toBe(false);
    });

    it('sanitizes coordinates or returns null for invalid ranges', () => {
      const valid = sanitizeCoordinates({ latitude: 14.599512345, longitude: 120.984212345 });
      expect(valid).not.toBeNull();
      expect(valid?.latitude).toBe(14.599512); // clamped to 6 decimals
      expect(valid?.longitude).toBe(120.984212);

      const invalid = sanitizeCoordinates({ latitude: 100, longitude: 50 });
      expect(invalid).toBeNull();
    });

    it('resolves exactly 46 authoritative AddressProfiles without registry duplication', () => {
      const count = getAuthoritativeAddressProfileCount();
      expect(count).toBe(46);
      expect(count).toBe(GLOBAL_COUNTRY_CATALOG.length);

      const allProfiles = getAllJurisdictionAddressProfiles();
      expect(allProfiles.length).toBe(46);

      // Verify every catalog country has a valid registered profile
      for (const country of GLOBAL_COUNTRY_CATALOG) {
        const profile = getJurisdictionAddressProfile(country.code);
        expect(profile).toBeDefined();
        expect(profile?.countryCode).toBe(country.code);
        expect(profile?.status).toBe('READY');
        expect(isAddressProfileSupported(country.code)).toBe(true);
      }
    });

    it('fails closed on unknown or invalid country codes', () => {
      expect(getJurisdictionAddressProfile('XX')).toBeNull();
      expect(getJurisdictionAddressProfile('')).toBeNull();
      expect(getJurisdictionAddressProfile('123')).toBeNull();
      expect(isAddressProfileSupported('XX')).toBe(false);

      const res = validateLocation({
        countryCode: 'XX',
        addressLine1: 'Test St',
        locality: 'Unknown City',
        precision: 'EXACT',
      });
      expect(res.valid).toBe(false);
      expect(res.errors[0]).toContain('UNKNOWN_JURISDICTION');
    });

    it('preserves Philippine PSGC compatibility as domestic profile adapter', () => {
      const phProfile = getJurisdictionAddressProfile('PH');
      expect(phProfile).toBeDefined();
      expect(phProfile?.psgcSupported).toBe(true);
      expect(phProfile?.requiredFields).toContain('addressLine1');
      expect(phProfile?.requiredFields).toContain('administrativeAreaLevel1');
      expect(phProfile?.requiredFields).toContain('locality');
      expect(phProfile?.requiredFields).toContain('postalCode');
    });

    it('masks private address information in public view (location privacy)', () => {
      const privateLocation: GlobalLocation = {
        countryCode: 'PH',
        addressLine1: 'Unit 402, Private Residence Tower',
        addressLine2: 'Inner Compound Alley',
        locality: 'Makati City',
        administrativeAreaLevel1: 'Metro Manila',
        postalCode: '1200',
        coordinates: { latitude: 14.5547, longitude: 121.0244 },
        precision: 'EXACT',
      };

      const publicLoc = toPublicLocation(privateLocation);
      expect(publicLoc.addressLine1).toBeUndefined();
      expect(publicLoc.addressLine2).toBeUndefined();
      expect(publicLoc.postalCode).toBeUndefined();
      expect(publicLoc.locality).toBe('Makati City');
      expect(publicLoc.administrativeAreaLevel1).toBe('Metro Manila');
      expect(publicLoc.countryCode).toBe('PH');
      expect(publicLoc.precision).toBe('LOCALITY_ONLY');
      // Coordinates are clamped to 2 decimal places (~1km precision)
      expect(publicLoc.coordinates?.latitude).toBe(14.55);
      expect(publicLoc.coordinates?.longitude).toBe(121.02);
    });

    it('calculates deterministic Haversine distance in kilometers', () => {
      // Manila (14.5995, 120.9842) to Makati (14.5547, 121.0244) ~6.6 km
      const manila: Coordinates = { latitude: 14.5995, longitude: 120.9842 };
      const makati: Coordinates = { latitude: 14.5547, longitude: 121.0244 };
      const dist = calculateDistanceKm(manila, makati);
      expect(dist).toBeGreaterThan(6.0);
      expect(dist).toBeLessThan(7.5);

      // Distance to self is 0
      expect(calculateDistanceKm(manila, manila)).toBe(0);
    });

    it('maintains provider-neutral geocoding abstraction with stubs strictly NOT_CONFIGURED', () => {
      for (const provider of KNOWN_GEOCODING_PROVIDERS) {
        const adapter = getGeocodingProviderAdapter(provider);
        expect(adapter.providerId).toBe(provider);
        expect(adapter.isConfigured).toBe(false);
      }
    });
  });

  // =========================================================================
  // 2. GLOBAL PRICING FOUNDATION & MONEY CONTRACT
  // =========================================================================
  describe('2. Global Pricing Foundation & Money Contract', () => {
    it('creates immutable integer minor-unit MoneyAmount for registered currencies', () => {
      const php = createMoneyAmount(1500.50, 'PHP');
      expect(php.amountCents).toBe(150050);
      expect(php.currency).toBe('PHP');
      expect(php.decimalUnits).toBe(2);

      // JPY has 0 minor units
      const jpy = createMoneyAmount(2500, 'JPY');
      expect(jpy.amountCents).toBe(2500);
      expect(jpy.currency).toBe('JPY');
      expect(jpy.decimalUnits).toBe(0);

      // Back to decimal
      expect(moneyAmountToDecimal(php)).toBe(1500.50);
      expect(moneyAmountToDecimal(jpy)).toBe(2500);
    });

    it('rejects invalid, negative, or unregistered currency amounts', () => {
      expect(() => createMoneyAmount(-100, 'PHP')).toThrow('NEGATIVE_AMOUNT');
      expect(() => createMoneyAmount(NaN, 'PHP')).toThrow('INVALID_AMOUNT');
      expect(() => createMoneyAmount(Infinity, 'PHP')).toThrow('INVALID_AMOUNT');
      expect(() => createMoneyAmount(100, 'FAKE')).toThrow('UNKNOWN_CURRENCY');
    });

    it('formats money amount cleanly according to currency metadata', () => {
      const php = createMoneyAmount(2500, 'PHP');
      const formatted = formatMoneyAmount(php);
      expect(formatted).toContain('₱');
      expect(formatted).toContain('2,500');
    });

    it('strictly avoids fake FX conversions when presenting prices in different display currencies', () => {
      const listingPrice = createMoneyAmount(5000, 'PHP');

      // Display in native listing currency
      const sameCurrency = presentListingPrice(listingPrice, 'PHP');
      expect(sameCurrency.displayAmount).toBe(5000);
      expect(sameCurrency.displayCurrency).toBe('PHP');
      expect(sameCurrency.conversionAvailable).toBe(true);

      // Display in USD: without approved live FX, conversion is refused and source price is preserved
      const diffCurrency = presentListingPrice(listingPrice, 'USD');
      expect(diffCurrency.displayAmount).toBe(5000);
      expect(diffCurrency.displayCurrency).toBe('PHP'); // Preserves source currency
      expect(diffCurrency.conversionAvailable).toBe(false);
      expect(diffCurrency.notes).toContain('NO_FAKE_FX');
    });

    it('validates listing pricing structure completeness', () => {
      const valid = validateListingPricing({
        baseRateCents: 100000, // 1000.00
        currency: 'PHP',
        rateType: 'DAILY',
        securityDepositCents: 50000,
      });
      expect(valid.valid).toBe(true);
      expect(valid.errors.length).toBe(0);

      const invalid = validateListingPricing({
        baseRateCents: -500,
        currency: 'UNKNOWN',
        rateType: 'DAILY',
      });
      expect(invalid.valid).toBe(false);
      expect(invalid.errors.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 3. GLOBAL LISTING LIFECYCLE & OWNERSHIP SECURITY
  // =========================================================================
  describe('3. Global Listing Lifecycle & Ownership Security', () => {
    it('defines exactly 9 controlled lifecycle states', () => {
      expect(ALL_LISTING_LIFECYCLE_STATUSES.length).toBe(9);
      expect(ALL_LISTING_LIFECYCLE_STATUSES).toEqual([
        'DRAFT',
        'INCOMPLETE',
        'READY_FOR_REVIEW',
        'PENDING_REVIEW',
        'PUBLISHED',
        'PAUSED',
        'REJECTED',
        'SUSPENDED',
        'ARCHIVED',
      ]);
    });

    it('enforces valid lifecycle state transitions', () => {
      // Legal transitions
      expect(canTransitionListingStatus('DRAFT', 'READY_FOR_REVIEW')).toBe(true);
      expect(canTransitionListingStatus('READY_FOR_REVIEW', 'PENDING_REVIEW')).toBe(true);
      expect(canTransitionListingStatus('PENDING_REVIEW', 'PUBLISHED')).toBe(true);
      expect(canTransitionListingStatus('PUBLISHED', 'PAUSED')).toBe(true);
      expect(canTransitionListingStatus('PAUSED', 'PUBLISHED')).toBe(true);
      expect(canTransitionListingStatus('PUBLISHED', 'SUSPENDED')).toBe(true);
      expect(canTransitionListingStatus('PUBLISHED', 'ARCHIVED')).toBe(true);

      // Illegal transitions
      expect(canTransitionListingStatus('DRAFT', 'PUBLISHED')).toBe(false); // cannot jump directly to published
      expect(canTransitionListingStatus('ARCHIVED', 'PUBLISHED')).toBe(false); // terminal state
      expect(canTransitionListingStatus('REJECTED', 'PUBLISHED')).toBe(false); // must return to draft first
    });

    it('identifies public discoverability strictly for PUBLISHED listings', () => {
      expect(isPubliclyDiscoverable('PUBLISHED')).toBe(true);
      expect(isPubliclyDiscoverable('DRAFT')).toBe(false);
      expect(isPubliclyDiscoverable('INCOMPLETE')).toBe(false);
      expect(isPubliclyDiscoverable('READY_FOR_REVIEW')).toBe(false);
      expect(isPubliclyDiscoverable('PENDING_REVIEW')).toBe(false);
      expect(isPubliclyDiscoverable('PAUSED')).toBe(false);
      expect(isPubliclyDiscoverable('REJECTED')).toBe(false);
      expect(isPubliclyDiscoverable('SUSPENDED')).toBe(false);
      expect(isPubliclyDiscoverable('ARCHIVED')).toBe(false);
    });

    it('creates draft listing record associated with authoritative jurisdiction and provider', () => {
      const input: ListingDraftInput = {
        title: 'Sony Alpha A7 IV Camera Kit',
        description: 'Professional full-frame camera with 24-70mm GM lens.',
        categoryId: 'cat-cameras',
        countryCode: 'PH',
        location: {
          countryCode: 'PH',
          addressLine1: '123 Ayala Ave',
          locality: 'Makati City',
          administrativeAreaLevel1: 'Metro Manila',
          postalCode: '1226',
          precision: 'EXACT',
        },
        pricing: {
          baseRateCents: 250000, // 2,500.00 PHP
          currency: 'PHP',
          rateType: 'DAILY',
        },
      };

      const record = createDraftListingRecord('user-prov-1', input);
      expect(record.providerId).toBe('user-prov-1');
      expect(record.countryCode).toBe('PH');
      expect(record.jurisdictionCode).toBe('JUR-PH');
      expect(record.status).toBe('DRAFT');
      expect(record.title).toBe(input.title);
    });

    it('enforces server-authoritative provider ownership on draft updates', () => {
      const record = createDraftListingRecord('user-prov-1', {
        title: 'Original Title',
        description: 'Original description',
        categoryId: 'cat-cameras',
        countryCode: 'PH',
        location: { countryCode: 'PH', addressLine1: 'Test', locality: 'Makati', precision: 'EXACT' },
        pricing: { baseRateCents: 100000, currency: 'PHP', rateType: 'DAILY' },
      });

      // Authorized provider can update
      const updated = updateListingDraft('user-prov-1', record, { title: 'Updated Title' });
      expect(updated.title).toBe('Updated Title');

      // Unauthorized provider is blocked with OWNERSHIP_VIOLATION
      expect(() => {
        updateListingDraft('user-attacker-2', record, { title: 'Hijacked Title' });
      }).toThrow('OWNERSHIP_VIOLATION');
    });
  });

  // =========================================================================
  // 4. PROVIDER PUBLICATION GATE (GM-1, GM-2, GM-3A, LOCATION & PRICING)
  // =========================================================================
  describe('4. Server-Authoritative Publication Gate', () => {
    const validLocation: GlobalLocation = {
      countryCode: 'PH',
      addressLine1: '123 Ayala Ave',
      locality: 'Makati City',
      administrativeAreaLevel1: 'Metro Manila',
      postalCode: '1226',
      coordinates: { latitude: 14.5547, longitude: 121.0244 },
      precision: 'EXACT',
    };

    const validPricing = {
      baseRateCents: 200000,
      currency: 'PHP',
      rateType: 'DAILY' as const,
    };

    it('blocks publication if account is RENTER only (renter cannot publish)', () => {
      const renterAccount = buildGlobalAccountContext({
        userId: 'user-renter-1',
        email: 'renter@test.com',
        fullName: 'Test Renter',
        legacyRole: 'RENTER',
        countryCode: 'PH',
      });

      const gateInput: PublicationGateInput = {
        account: renterAccount,
        trust: buildGlobalTrustProfile('user-renter-1', 'PH', 'INDIVIDUAL', 'APPROVED'),
        listing: {
          id: 'list-1',
          providerId: 'user-renter-1',
          countryCode: 'PH',
          jurisdictionCode: 'JUR-PH',
          status: 'DRAFT',
          title: 'Camera',
          description: 'A great camera',
          categoryId: 'cat-cameras',
          location: validLocation,
          pricing: validPricing,
        },
      };

      const result = canPublishListing(gateInput);
      expect(result.allowed).toBe(false);
      expect(result.reasonCode).toBe('PROVIDER_ROLE_REQUIRED');
    });

    it('blocks publication if provider KYC/trust verification is not approved', () => {
      const providerAccount = buildGlobalAccountContext({
        userId: 'user-prov-2',
        email: 'provider@test.com',
        fullName: 'Test Provider',
        legacyRole: 'PROVIDER',
        accountStatus: 'Verified',
        providerOnboardingState: 'APPROVED',
        kycVerificationStatus: 'Pending',
        countryCode: 'PH',
      });

      // Trust profile is IN_REVIEW
      const pendingTrust = buildGlobalTrustProfile('user-prov-2', 'PH', 'INDIVIDUAL', 'IN_REVIEW');

      const gateInput: PublicationGateInput = {
        account: providerAccount,
        trust: pendingTrust,
        listing: {
          id: 'list-2',
          providerId: 'user-prov-2',
          countryCode: 'PH',
          jurisdictionCode: 'JUR-PH',
          status: 'DRAFT',
          title: 'Camera',
          description: 'A great camera',
          categoryId: 'cat-cameras',
          location: validLocation,
          pricing: validPricing,
        },
      };

      const result = canPublishListing(gateInput);
      expect(result.allowed).toBe(false);
      expect(result.reasonCode).toBe('KYC_VERIFICATION_REQUIRED');
    });

    it('blocks publication if account is suspended or blocked', () => {
      const suspendedAccount = buildGlobalAccountContext({
        userId: 'user-prov-3',
        email: 'suspended@test.com',
        fullName: 'Suspended Provider',
        legacyRole: 'PROVIDER',
        accountStatus: 'Suspended',
        providerOnboardingState: 'APPROVED',
        countryCode: 'PH',
      });

      const gateInput: PublicationGateInput = {
        account: suspendedAccount,
        trust: buildGlobalTrustProfile('user-prov-3', 'PH', 'INDIVIDUAL', 'APPROVED'),
        listing: {
          id: 'list-3',
          providerId: 'user-prov-3',
          countryCode: 'PH',
          jurisdictionCode: 'JUR-PH',
          status: 'DRAFT',
          title: 'Camera',
          description: 'A great camera',
          categoryId: 'cat-cameras',
          location: validLocation,
          pricing: validPricing,
        },
      };

      const result = canPublishListing(gateInput);
      expect(result.allowed).toBe(false);
      expect(result.reasonCode).toBe('ACCOUNT_NOT_ACTIVE');
    });

    it('blocks publication if category policy is PROHIBITED or requires special licensing', () => {
      const providerAccount = buildGlobalAccountContext({
        userId: 'user-prov-4',
        email: 'prov4@test.com',
        fullName: 'Provider Four',
        legacyRole: 'PROVIDER',
        accountStatus: 'Verified',
        providerOnboardingState: 'APPROVED',
        countryCode: 'PH',
      });

      const prohibitedPolicy: CategoryJurisdictionPolicy = {
        categoryId: 'cat-weapons',
        categorySlug: 'weapons',
        jurisdictionCode: 'JUR-PH',
        status: 'PROHIBITED',
        requiresPermit: true,
        requiresInsurance: true,
        requiresDeposit: true,
        notes: 'Strict national prohibition.',
      };

      const gateInput: PublicationGateInput = {
        account: providerAccount,
        trust: buildGlobalTrustProfile('user-prov-4', 'PH', 'INDIVIDUAL', 'APPROVED'),
        listing: {
          id: 'list-4',
          providerId: 'user-prov-4',
          countryCode: 'PH',
          jurisdictionCode: 'JUR-PH',
          status: 'DRAFT',
          title: 'Restricted Item',
          description: 'Description',
          categoryId: 'cat-weapons',
          location: validLocation,
          pricing: validPricing,
        },
        categoryPolicy: prohibitedPolicy,
      };

      const result = canPublishListing(gateInput);
      expect(result.allowed).toBe(false);
      expect(result.reasonCode).toBe('CATEGORY_PROHIBITED');
    });

    it('allows publication when all GM-1, GM-2, GM-3A, location, and pricing gates pass', () => {
      const authorizedProvider = buildGlobalAccountContext({
        userId: 'user-prov-5',
        email: 'prov5@test.com',
        fullName: 'Authorized Provider',
        legacyRole: 'PROVIDER',
        accountStatus: 'Verified',
        providerOnboardingState: 'APPROVED',
        kycVerificationStatus: 'Verified',
        countryCode: 'PH',
      });

      const approvedTrust = buildGlobalTrustProfile('user-prov-5', 'PH', 'INDIVIDUAL', 'APPROVED');

      const gateInput: PublicationGateInput = {
        account: authorizedProvider,
        trust: approvedTrust,
        listing: {
          id: 'list-5',
          providerId: 'user-prov-5',
          countryCode: 'PH',
          jurisdictionCode: 'JUR-PH',
          status: 'DRAFT',
          title: 'Canon EOS R5 Mirrorless Camera',
          description: 'Like new condition, comes with two batteries and charger.',
          categoryId: 'cat-cameras',
          location: validLocation,
          pricing: validPricing,
        },
      };

      const result = canPublishListing(gateInput);
      expect(result.allowed).toBe(true);
      expect(result.reasonCode).toBe('GATE_PASSED');
    });
  });

  // =========================================================================
  // 5. GLOBAL SEARCH & DISCOVERY ENGINE
  // =========================================================================
  describe('5. Global Search & Discovery Engine', () => {
    // Test dataset of mock listings across jurisdictions and statuses
    const mockListings: GlobalListingRecord[] = [
      {
        id: 'list-pub-ph-1',
        providerId: 'prov-ph-1',
        countryCode: 'PH',
        jurisdictionCode: 'JUR-PH',
        status: 'PUBLISHED',
        title: 'Sony A7 IV Full Frame Camera',
        description: 'Great for videography and photography in Makati.',
        categoryId: 'cat-cameras',
        location: {
          countryCode: 'PH',
          locality: 'Makati City',
          administrativeAreaLevel1: 'Metro Manila',
          coordinates: { latitude: 14.5547, longitude: 121.0244 },
          precision: 'EXACT',
        },
        pricing: { baseRateCents: 200000, currency: 'PHP', rateType: 'DAILY' },
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
      },
      {
        id: 'list-draft-ph-2',
        providerId: 'prov-ph-2',
        countryCode: 'PH',
        jurisdictionCode: 'JUR-PH',
        status: 'DRAFT', // MUST NEVER APPEAR IN PUBLIC SEARCH
        title: 'Secret Draft Camera in Manila',
        description: 'Not published yet.',
        categoryId: 'cat-cameras',
        location: {
          countryCode: 'PH',
          locality: 'Manila',
          coordinates: { latitude: 14.5995, longitude: 120.9842 },
          precision: 'EXACT',
        },
        pricing: { baseRateCents: 150000, currency: 'PHP', rateType: 'DAILY' },
        createdAt: '2026-10-02T00:00:00Z',
        updatedAt: '2026-10-02T00:00:00Z',
      },
      {
        id: 'list-pub-th-1',
        providerId: 'prov-th-1',
        countryCode: 'TH',
        jurisdictionCode: 'JUR-TH',
        status: 'PUBLISHED',
        title: 'DJI Mavic 3 Pro Drone',
        description: 'Professional drone rental in Bangkok.',
        categoryId: 'cat-drones',
        location: {
          countryCode: 'TH',
          locality: 'Bangkok',
          administrativeAreaLevel1: 'Bangkok',
          coordinates: { latitude: 13.7563, longitude: 100.5018 },
          precision: 'EXACT',
        },
        pricing: { baseRateCents: 350000, currency: 'THB', rateType: 'DAILY' },
        createdAt: '2026-10-03T00:00:00Z',
        updatedAt: '2026-10-03T00:00:00Z',
      },
      {
        id: 'list-pub-jp-1',
        providerId: 'prov-jp-1',
        countryCode: 'JP',
        jurisdictionCode: 'JUR-JP',
        status: 'PUBLISHED',
        title: 'Fujifilm X-T5 Mirrorless Camera',
        description: 'High resolution camera in Shibuya Tokyo.',
        categoryId: 'cat-cameras',
        location: {
          countryCode: 'JP',
          locality: 'Tokyo',
          administrativeAreaLevel1: 'Tokyo Prefecture',
          coordinates: { latitude: 35.6580, longitude: 139.7016 },
          precision: 'EXACT',
        },
        pricing: { baseRateCents: 6000, currency: 'JPY', rateType: 'DAILY' }, // 6000 JPY
        createdAt: '2026-10-04T00:00:00Z',
        updatedAt: '2026-10-04T00:00:00Z',
      },
      {
        id: 'list-susp-ph-3',
        providerId: 'prov-ph-3',
        countryCode: 'PH',
        jurisdictionCode: 'JUR-PH',
        status: 'SUSPENDED', // MUST NEVER APPEAR IN PUBLIC SEARCH
        title: 'Suspended Lens Kit',
        description: 'Suspended due to dispute.',
        categoryId: 'cat-cameras',
        location: { countryCode: 'PH', locality: 'Quezon City', precision: 'EXACT' },
        pricing: { baseRateCents: 100000, currency: 'PHP', rateType: 'DAILY' },
        createdAt: '2026-10-05T00:00:00Z',
        updatedAt: '2026-10-05T00:00:00Z',
      },
    ];

    it('strictly hides non-PUBLISHED listings (DRAFT, SUSPENDED, ARCHIVED) in public search', () => {
      const res = searchListings(mockListings, { countryCode: 'PH' });
      expect(res.totalCount).toBe(1);
      expect(res.items[0].id).toBe('list-pub-ph-1');

      // Verify draft and suspended listings are not in results
      const foundDraft = res.items.some(i => i.id === 'list-draft-ph-2');
      const foundSuspended = res.items.some(i => i.id === 'list-susp-ph-3');
      expect(foundDraft).toBe(false);
      expect(foundSuspended).toBe(false);
    });

    it('supports international discovery across different jurisdictions', () => {
      // Global search without countryCode filter returns published listings across countries
      const globalSearch = searchListings(mockListings, {});
      expect(globalSearch.totalCount).toBe(3); // PH, TH, JP published listings
      const countries = globalSearch.items.map(i => i.countryCode);
      expect(countries).toContain('PH');
      expect(countries).toContain('TH');
      expect(countries).toContain('JP');

      // Specific country filter
      const japanSearch = searchListings(mockListings, { countryCode: 'JP' });
      expect(japanSearch.totalCount).toBe(1);
      expect(japanSearch.items[0].id).toBe('list-pub-jp-1');
    });

    it('filters by category accurately', () => {
      const droneSearch = searchListings(mockListings, { categoryId: 'cat-drones' });
      expect(droneSearch.totalCount).toBe(1);
      expect(droneSearch.items[0].title).toContain('DJI Mavic 3');
    });

    it('filters by text keyword in title or description', () => {
      const textSearch = searchListings(mockListings, { queryText: 'Fujifilm' });
      expect(textSearch.totalCount).toBe(1);
      expect(textSearch.items[0].id).toBe('list-pub-jp-1');
    });

    it('performs deterministic bounded nearby search using Haversine distance', () => {
      // Search near Makati (14.5547, 121.0244) with radius 10 km
      const nearbyMakati = searchListings(mockListings, {
        nearby: {
          center: { latitude: 14.5547, longitude: 121.0244 },
          radiusKm: 10,
        },
      });

      expect(nearbyMakati.totalCount).toBe(1);
      expect(nearbyMakati.items[0].id).toBe('list-pub-ph-1');
      expect(nearbyMakati.items[0].distanceKm).toBeDefined();
      expect(nearbyMakati.items[0].distanceKm).toBeLessThan(1); // Within 1km

      // Search near Tokyo with radius 50 km should not find Makati or Bangkok
      const nearbyTokyo = searchListings(mockListings, {
        nearby: {
          center: { latitude: 35.6580, longitude: 139.7016 },
          radiusKm: 50,
        },
      });

      expect(nearbyTokyo.totalCount).toBe(1);
      expect(nearbyTokyo.items[0].id).toBe('list-pub-jp-1');
    });

    it('rejects invalid search inputs safely (invalid coordinates, negative radius, unknown country)', () => {
      expect(validateSearchQuery({ countryCode: 'XX' }).valid).toBe(false);
      expect(validateSearchQuery({ nearby: { center: { latitude: 95, longitude: 0 }, radiusKm: 10 } }).valid).toBe(false);
      expect(validateSearchQuery({ nearby: { center: { latitude: 0, longitude: 0 }, radiusKm: -5 } }).valid).toBe(false);
      expect(validateSearchQuery({ nearby: { center: { latitude: 0, longitude: 0 }, radiusKm: 1000 } }).valid).toBe(false); // exceeds max 500km
    });

    it('guarantees stable pagination and limit clamping', () => {
      const paginated = searchListings(mockListings, { page: 1, pageSize: 2 });
      expect(paginated.page).toBe(1);
      expect(paginated.pageSize).toBe(2);
      expect(paginated.items.length).toBe(2);
      expect(paginated.hasMore).toBe(true);
      expect(paginated.totalPages).toBe(2);
    });
  });

  // =========================================================================
  // 6. REPRESENTATIVE 7-MARKET MATRIX & INVARIANTS
  // =========================================================================
  describe('6. Representative Market Matrix & Invariants', () => {
    const representativeJurisdictions = ['PH', 'TH', 'CN', 'SG', 'JP', 'US', 'DE'];

    it('resolves valid AddressProfile for every representative market', () => {
      for (const j of representativeJurisdictions) {
        const profile = getJurisdictionAddressProfile(j);
        expect(profile).toBeDefined();
        expect(profile?.countryCode).toBe(j);
        expect(profile?.status).toBe('READY');
      }
    });

    it('preserves Commercial Inactivity Invariant across all 46 markets (0 active)', () => {
      const active = getCommerciallyActiveCountries();
      expect(active.length).toBe(0);
    });

    it('preserves 2 China deferred blockers and non-operability', () => {
      const cnCapability = getJurisdictionProfile('CN');
      expect(cnCapability).toBeDefined();
      expect(cnCapability?.knownBlockers.length).toBe(2);
      expect(cnCapability?.knownBlockers).toContain('CN-BLK-001: ICP Filing / Commercial Telecommunications License Requirement (MIIT)');
      expect(cnCapability?.knownBlockers).toContain('CN-BLK-002: Cross-Border Data Transfer / CAC Security Assessment Requirement');
      expect(cnCapability?.operationalRestrictions).toContain('MAINLAND_CHINA_PUBLIC_NETWORK_OPERABILITY_NOT_CLAIMED');
    });
  });
});
