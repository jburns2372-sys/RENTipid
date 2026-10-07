/**
 * RENTipid GLOBAL-MKT / v2.0 — GM-2 Global Account, Renter & Provider Onboarding Test Suite
 *
 * Enforces all GM-2 requirements:
 * 1. ONE Global Account identity model (SystemRole vs MarketplaceRole separation).
 * 2. Dual-role support (RENTER + PROVIDER on a single account).
 * 3. Operating Jurisdiction resolution across all 46 authoritative countries; unknown fails closed.
 * 4. Provider intent vs provider authorization separation (canPublishAsProvider gating).
 * 5. Honest KYC boundary (Auth != KYC != Provider Approved).
 * 6. Country != Language != Display Currency independence.
 * 7. International phone normalization (E.164) with PH non-regression.
 * 8. Security invariant tests (tamper resistance, fail-closed privilege escalation prevention).
 * 9. Commercial activation non-mutation (onboarding does not activate markets).
 * 10. Individual and Business provider profiles with completeness contracts.
 */

import {
  type SystemRole,
  type MarketplaceRole,
  ALL_SYSTEM_ROLES,
  ALL_MARKETPLACE_ROLES,
  hasMarketplaceRole,
  canActAsRenter,
  canActAsProvider,
  mapLegacyUserRoleToSystemAndMarketplace,
} from '@/lib/global-market/account/contracts/marketplace-role';

import {
  type ProviderOnboardingState,
  type RenterOnboardingState,
  type KycState,
  type ProviderType,
  ALL_PROVIDER_ONBOARDING_STATES,
  ALL_RENTER_ONBOARDING_STATES,
  ALL_KYC_STATES,
  ALL_PROVIDER_TYPES,
} from '@/lib/global-market/account/contracts/onboarding-state';

import type { GlobalAccountContext } from '@/lib/global-market/account/contracts/global-account-context';

import {
  resolveOperatingJurisdiction,
  canRegisterInJurisdiction,
  canStartRenterOnboarding,
  canStartProviderOnboarding,
  canPublishAsProvider,
  evaluateProfileCompleteness,
  buildGlobalAccountContext,
  requestProviderOnboardingIntent,
} from '@/lib/global-market/account/services/account-service';

import {
  normalizeInternationalPhone,
  isValidInternationalPhone,
  COUNTRY_CALLING_CODES,
} from '@/lib/global-market/account/services/phone-service';

import {
  getAllJurisdictionProfiles,
  getJurisdictionProfile,
  getAuthoritativeCountryCount,
  getCommerciallyActiveCountries,
} from '@/lib/global-market/registry/market-capability-registry';

import { GLOBAL_COUNTRY_CATALOG } from '@/lib/glcc/country/country-registry';

describe('RENTipid GLOBAL-MKT / v2.0 — GM-2 Global Account & Onboarding', () => {

  describe('1. Role Model & System / Marketplace Role Separation', () => {
    it('defines distinct SystemRole and MarketplaceRole sets', () => {
      expect(ALL_SYSTEM_ROLES).toContain('USER');
      expect(ALL_SYSTEM_ROLES).toContain('ADMIN');
      expect(ALL_SYSTEM_ROLES).toContain('FINANCE_ADMIN');
      expect(ALL_SYSTEM_ROLES).toContain('COMPLIANCE_ADMIN');
      expect(ALL_SYSTEM_ROLES).toContain('SUPER_ADMIN');

      expect(ALL_MARKETPLACE_ROLES).toEqual(['RENTER', 'PROVIDER']);
      // Ensure administrative roles are NOT marketplace roles
      expect(ALL_MARKETPLACE_ROLES).not.toContain('ADMIN');
      expect(ALL_MARKETPLACE_ROLES).not.toContain('USER');
    });

    it('maps legacy user roles safely into system and marketplace roles', () => {
      // Legacy USER
      const userMapped = mapLegacyUserRoleToSystemAndMarketplace('USER', 'Individual');
      expect(userMapped.systemRole).toBe('USER');
      expect(userMapped.marketplaceRoles).toEqual(['RENTER']);

      // Legacy PROVIDER
      const providerMapped = mapLegacyUserRoleToSystemAndMarketplace('PROVIDER', 'Individual');
      expect(providerMapped.systemRole).toBe('USER');
      expect(providerMapped.marketplaceRoles).toContain('PROVIDER');
      expect(providerMapped.marketplaceRoles).toContain('RENTER');

      // Legacy ADMIN
      const adminMapped = mapLegacyUserRoleToSystemAndMarketplace('ADMIN', 'Individual');
      expect(adminMapped.systemRole).toBe('ADMIN');
      expect(adminMapped.marketplaceRoles).toEqual([]);
    });

    it('supports dual-role accounts (both RENTER and PROVIDER)', () => {
      const dualRoles: MarketplaceRole[] = ['RENTER', 'PROVIDER'];

      expect(hasMarketplaceRole(dualRoles, 'RENTER')).toBe(true);
      expect(hasMarketplaceRole(dualRoles, 'PROVIDER')).toBe(true);
      expect(canActAsRenter(dualRoles, 'Active')).toBe(true);
      expect(canActAsProvider(dualRoles, 'Active', 'APPROVED')).toBe(true);
    });

    it('correctly handles renter-only and provider-only roles', () => {
      const renterOnly: MarketplaceRole[] = ['RENTER'];
      expect(canActAsRenter(renterOnly, 'Active')).toBe(true);
      expect(canActAsProvider(renterOnly, 'Active', 'APPROVED')).toBe(false);

      const providerOnly: MarketplaceRole[] = ['PROVIDER'];
      expect(canActAsRenter(providerOnly, 'Active')).toBe(false);
      expect(canActAsProvider(providerOnly, 'Active', 'APPROVED')).toBe(true);
    });
  });

  describe('2. Operating Jurisdiction & 46 Authoritative Country Resolution', () => {
    it('authoritative country count is exactly 46', () => {
      expect(getAuthoritativeCountryCount()).toBe(46);
      expect(GLOBAL_COUNTRY_CATALOG.length).toBe(46);
    });

    it('resolves every single one of the 46 authoritative countries', () => {
      for (const country of GLOBAL_COUNTRY_CATALOG) {
        const resolved = resolveOperatingJurisdiction(country.code);
        expect(resolved).toBe(country.code);

        const profile = getJurisdictionProfile(country.code);
        expect(profile).not.toBeNull();
        expect(profile?.countryCode).toBe(country.code);

        // Account registration capability resolution
        const regCheck = canRegisterInJurisdiction(country.code);
        expect(typeof regCheck.allowed).toBe('boolean');

        // Renter onboarding capability resolution
        const renterCheck = canStartRenterOnboarding(country.code);
        expect(typeof renterCheck.allowed).toBe('boolean');

        // Provider onboarding capability resolution
        const providerCheck = canStartProviderOnboarding(country.code);
        expect(typeof providerCheck.allowed).toBe('boolean');
      }
    });

    it('resolves representative jurisdictions correctly (PH, TH, CN, SG, JP, US, DE)', () => {
      const matrix = ['PH', 'TH', 'CN', 'SG', 'JP', 'US', 'DE'];
      for (const code of matrix) {
        expect(resolveOperatingJurisdiction(code)).toBe(code);
        expect(resolveOperatingJurisdiction(code.toLowerCase())).toBe(code);
      }
    });

    it('fails closed on unknown or invalid countries', () => {
      expect(resolveOperatingJurisdiction('XX')).toBeNull();
      expect(resolveOperatingJurisdiction('FAKE')).toBeNull();
      expect(resolveOperatingJurisdiction('')).toBeNull();
      expect(resolveOperatingJurisdiction(null)).toBeNull();
      expect(resolveOperatingJurisdiction(undefined)).toBeNull();

      expect(canRegisterInJurisdiction('XX').allowed).toBe(false);
      expect(canRegisterInJurisdiction('FAKE').allowed).toBe(false);
      expect(canStartRenterOnboarding('XX').allowed).toBe(false);
      expect(canStartProviderOnboarding('XX').allowed).toBe(false);
    });
  });

  describe('3. Provider Intent vs Provider Authorization & Publication Gating', () => {
    it('defines comprehensive provider onboarding and KYC states', () => {
      expect(ALL_PROVIDER_ONBOARDING_STATES).toEqual([
        'NOT_STARTED',
        'STARTED',
        'INCOMPLETE',
        'DOCUMENTS_REQUIRED',
        'KYC_REQUIRED',
        'UNDER_REVIEW',
        'APPROVED',
        'REJECTED',
        'SUSPENDED',
        'BLOCKED',
      ]);

      expect(ALL_KYC_STATES).toEqual([
        'KYC_NOT_REQUIRED',
        'KYC_REQUIRED',
        'KYC_PENDING',
        'KYC_APPROVED',
        'KYC_REJECTED',
        'KYC_EXPIRED',
        'KYC_BLOCKED',
      ]);
    });

    it('requests provider onboarding safely (intent != approval)', () => {
      const baseContext = buildGlobalAccountContext({
        userId: 'u-provider-intent',
        email: 'provider@example.com',
        fullName: 'Test Provider',
        countryCode: 'PH',
        accountStatus: 'Active',
        providerOnboardingState: 'NOT_STARTED',
        legacyRole: 'USER',
      });

      const intent = requestProviderOnboardingIntent(baseContext, 'INDIVIDUAL');
      expect(intent.success).toBe(true);
      expect(intent.nextState).toBe('DOCUMENTS_REQUIRED');
      // Intent does NOT automatically approve
      expect(intent.nextState).not.toBe('APPROVED');
    });

    it('blocks publication if provider onboarding is not APPROVED', () => {
      const unapprovedUser = {
        marketplaceRoles: ['PROVIDER'] as MarketplaceRole[],
        providerOnboardingState: 'UNDER_REVIEW' as ProviderOnboardingState,
        kycState: 'KYC_APPROVED' as KycState,
        accountStatus: 'Active',
      };

      const result = canPublishAsProvider(unapprovedUser, 'PH');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('ONBOARDING_INCOMPLETE');
    });

    it('blocks publication if KYC is not approved', () => {
      const unverifiedUser = {
        marketplaceRoles: ['PROVIDER'] as MarketplaceRole[],
        providerOnboardingState: 'APPROVED' as ProviderOnboardingState,
        kycState: 'KYC_REQUIRED' as KycState,
        accountStatus: 'Active',
      };

      const result = canPublishAsProvider(unverifiedUser, 'PH');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('KYC_REQUIRED');
    });

    it('blocks publication if account is SUSPENDED or BLOCKED', () => {
      const suspendedUser = {
        marketplaceRoles: ['PROVIDER'] as MarketplaceRole[],
        providerOnboardingState: 'APPROVED' as ProviderOnboardingState,
        kycState: 'KYC_APPROVED' as KycState,
        accountStatus: 'Suspended',
      };

      const result = canPublishAsProvider(suspendedUser, 'PH');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('ACCOUNT_INACTIVE');
    });

    it('blocks publication if account lacks PROVIDER marketplace role', () => {
      const renterOnlyUser = {
        marketplaceRoles: ['RENTER'] as MarketplaceRole[],
        providerOnboardingState: 'APPROVED' as ProviderOnboardingState,
        kycState: 'KYC_APPROVED' as KycState,
        accountStatus: 'Active',
      };

      const result = canPublishAsProvider(renterOnlyUser, 'PH');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('ROLE_REQUIRED');
    });

    it('blocks publication if operating jurisdiction is invalid or unknown', () => {
      const validUser = {
        marketplaceRoles: ['PROVIDER'] as MarketplaceRole[],
        providerOnboardingState: 'APPROVED' as ProviderOnboardingState,
        kycState: 'KYC_APPROVED' as KycState,
        accountStatus: 'Active',
      };

      const result = canPublishAsProvider(validUser, 'INVALID_COUNTRY');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('UNKNOWN_JURISDICTION');
    });

    it('allows publication ONLY when all gates are satisfied', () => {
      const fullyCompliantUser = {
        marketplaceRoles: ['PROVIDER'] as MarketplaceRole[],
        providerOnboardingState: 'APPROVED' as ProviderOnboardingState,
        kycState: 'KYC_APPROVED' as KycState,
        accountStatus: 'Active',
      };

      const result = canPublishAsProvider(fullyCompliantUser, 'PH');
      expect(result.allowed).toBe(true);
    });
  });

  describe('4. Phone Number Normalization & International Handling', () => {
    it('normalizes Philippine phone numbers correctly (preserves existing behavior)', () => {
      const res1 = normalizeInternationalPhone('09171234567', 'PH');
      expect(res1.valid).toBe(true);
      expect(res1.e164).toBe('+639171234567');

      const res2 = normalizeInternationalPhone('+639171234567', 'PH');
      expect(res2.valid).toBe(true);
      expect(res2.e164).toBe('+639171234567');

      const res3 = normalizeInternationalPhone('639171234567', 'PH');
      expect(res3.valid).toBe(true);
      expect(res3.e164).toBe('+639171234567');

      expect(isValidInternationalPhone('09171234567', 'PH')).toBe(true);
    });

    it('normalizes international numbers across representative jurisdictions', () => {
      // Thailand (+66)
      const thRes = normalizeInternationalPhone('0812345678', 'TH');
      expect(thRes.valid).toBe(true);
      expect(thRes.e164).toBe('+66812345678');
      expect(isValidInternationalPhone('0812345678', 'TH')).toBe(true);

      // China (+86)
      const cnRes = normalizeInternationalPhone('13800138000', 'CN');
      expect(cnRes.valid).toBe(true);
      expect(cnRes.e164).toBe('+8613800138000');
      expect(isValidInternationalPhone('13800138000', 'CN')).toBe(true);

      // Singapore (+65)
      const sgRes = normalizeInternationalPhone('91234567', 'SG');
      expect(sgRes.valid).toBe(true);
      expect(sgRes.e164).toBe('+6591234567');
      expect(isValidInternationalPhone('91234567', 'SG')).toBe(true);

      // United States (+1)
      const usRes = normalizeInternationalPhone('2025550123', 'US');
      expect(usRes.valid).toBe(true);
      expect(usRes.e164).toBe('+12025550123');
      expect(isValidInternationalPhone('2025550123', 'US')).toBe(true);

      // Japan (+81)
      const jpRes = normalizeInternationalPhone('09012345678', 'JP');
      expect(jpRes.valid).toBe(true);
      expect(jpRes.e164).toBe('+819012345678');
      expect(isValidInternationalPhone('09012345678', 'JP')).toBe(true);

      // Germany (+49)
      const deRes = normalizeInternationalPhone('015123456789', 'DE');
      expect(deRes.valid).toBe(true);
      expect(deRes.e164).toBe('+4915123456789');
      expect(isValidInternationalPhone('015123456789', 'DE')).toBe(true);
    });

    it('rejects invalid or malformed numbers', () => {
      expect(normalizeInternationalPhone('123', 'PH').valid).toBe(false);
      expect(normalizeInternationalPhone('abc', 'US').valid).toBe(false);
      expect(normalizeInternationalPhone('', 'TH').valid).toBe(false);
      expect(isValidInternationalPhone('123', 'PH')).toBe(false);
    });

    it('has calling code mappings for all 46 jurisdictions', () => {
      for (const country of GLOBAL_COUNTRY_CATALOG) {
        expect(COUNTRY_CALLING_CODES[country.code]).toBeDefined();
        expect(COUNTRY_CALLING_CODES[country.code].length).toBeGreaterThan(0);
      }
    });
  });

  describe('5. Country, Language & Currency Independence', () => {
    it('allows independent country, language, and display currency configuration', () => {
      // Filipino user in Thailand preferring English and PHP
      const context1 = buildGlobalAccountContext({
        userId: 'u1',
        email: 'test1@example.com',
        fullName: 'Juan Dela Cruz',
        countryCode: 'TH',
        languageTag: 'en',
        displayCurrency: 'PHP',
      });

      expect(context1.operatingJurisdiction).toBe('TH');
      expect(context1.languageTag).toBe('en');
      expect(context1.displayCurrency).toBe('PHP');

      // Japanese speaker in Singapore preferring JPY
      const context2 = buildGlobalAccountContext({
        userId: 'u2',
        email: 'test2@example.com',
        fullName: 'Kenji Sato',
        countryCode: 'SG',
        languageTag: 'ja',
        displayCurrency: 'JPY',
      });

      expect(context2.operatingJurisdiction).toBe('SG');
      expect(context2.languageTag).toBe('ja');
      expect(context2.displayCurrency).toBe('JPY');
    });
  });

  describe('6. Provider Types & Profile Completeness Evaluation', () => {
    it('supports INDIVIDUAL and BUSINESS provider types', () => {
      expect(ALL_PROVIDER_TYPES).toEqual(['INDIVIDUAL', 'BUSINESS']);
    });

    it('evaluates profile completeness accurately for individuals', () => {
      const incomplete = evaluateProfileCompleteness({
        fullName: 'John Doe',
        email: 'john@example.com',
        mobileNumber: null,
        operatingJurisdiction: 'US',
        accountType: 'Individual',
      });
      expect(incomplete.isComplete).toBe(false);
      expect(incomplete.missingFields).toContain('mobileNumber');

      const complete = evaluateProfileCompleteness({
        fullName: 'John Doe',
        email: 'john@example.com',
        mobileNumber: '+12025550123',
        operatingJurisdiction: 'US',
        accountType: 'Individual',
      });
      expect(complete.isComplete).toBe(true);
      expect(complete.missingFields.length).toBe(0);
    });

    it('evaluates profile completeness for business providers requiring business profile', () => {
      const missingBusiness = evaluateProfileCompleteness({
        fullName: 'Jane Manager',
        email: 'jane@acme.com',
        mobileNumber: '+639171234567',
        operatingJurisdiction: 'PH',
        accountType: 'Business',
        businessName: null,
      });
      expect(missingBusiness.isComplete).toBe(false);
      expect(missingBusiness.missingFields).toContain('businessName');

      const completeBusiness = evaluateProfileCompleteness({
        fullName: 'Jane Manager',
        email: 'jane@acme.com',
        mobileNumber: '+639171234567',
        operatingJurisdiction: 'PH',
        accountType: 'Business',
        businessName: 'Acme Rentals Inc.',
      });
      expect(completeBusiness.isComplete).toBe(true);
    });
  });

  describe('7. Security Invariants (Section 33)', () => {
    it('client cannot assign ADMIN role via marketplace role API', () => {
      const baseContext = buildGlobalAccountContext({
        userId: 'u-tamper',
        email: 'tamper@example.com',
        fullName: 'Tamper Test',
        countryCode: 'PH',
        accountStatus: 'Active',
        providerOnboardingState: 'NOT_STARTED',
        legacyRole: 'USER',
      });

      const intent = requestProviderOnboardingIntent(baseContext, 'INDIVIDUAL');
      // Intent result only transitions onboarding state, cannot modify systemRole
      expect((intent as any).systemRole).toBeUndefined();
    });

    it('duplicate role request is safe and idempotent', () => {
      const baseContext = buildGlobalAccountContext({
        userId: 'u-idempotent',
        email: 'idempotent@example.com',
        fullName: 'Idempotent Test',
        countryCode: 'PH',
        accountStatus: 'Active',
        providerOnboardingState: 'NOT_STARTED',
        legacyRole: 'USER',
      });

      const intent1 = requestProviderOnboardingIntent(baseContext, 'INDIVIDUAL');
      const intent2 = requestProviderOnboardingIntent(baseContext, 'INDIVIDUAL');
      expect(intent1.nextState).toBe(intent2.nextState);
      expect(intent1.success).toBe(intent2.success);
    });

    it('tampered payloads cannot bypass server authority to publish', () => {
      // Attacker attempts to forge client-side state
      const tamperedUser = {
        marketplaceRoles: ['PROVIDER'] as MarketplaceRole[],
        providerOnboardingState: 'APPROVED' as ProviderOnboardingState,
        kycState: 'KYC_PENDING' as KycState, // KYC not approved
        accountStatus: 'Active',
      };

      expect(canPublishAsProvider(tamperedUser, 'PH').allowed).toBe(false);
    });
  });

  describe('8. Commercial Activation Non-Mutation (Section 32)', () => {
    it('registering accounts or requesting provider onboarding does NOT alter commercially active count', () => {
      const beforeActive = getCommerciallyActiveCountries();
      expect(beforeActive.length).toBe(0);

      // Perform onboarding operations
      resolveOperatingJurisdiction('PH');
      resolveOperatingJurisdiction('TH');
      resolveOperatingJurisdiction('CN');

      const baseContext = buildGlobalAccountContext({
        userId: 'u-activation-test',
        email: 'active@example.com',
        fullName: 'Active Check',
        countryCode: 'PH',
        accountStatus: 'Active',
        providerOnboardingState: 'NOT_STARTED',
        legacyRole: 'USER',
      });
      requestProviderOnboardingIntent(baseContext, 'INDIVIDUAL');

      const afterActive = getCommerciallyActiveCountries();
      expect(afterActive.length).toBe(0);
    });

    it('PH, TH, and CN remain commercially inactive', () => {
      const activeCodes = getCommerciallyActiveCountries().map(p => p.countryCode);
      expect(activeCodes).not.toContain('PH');
      expect(activeCodes).not.toContain('TH');
      expect(activeCodes).not.toContain('CN');
      expect(activeCodes.length).toBe(0);
    });
  });
});
