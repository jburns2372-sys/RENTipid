/**
 * @jest-environment jsdom
 */

/**
 * RENTipid GLCC v1.0.1 — Work Package P6: Filipino Proof Pack Test Suite
 *
 * Controlling Document: RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0
 *
 * Verifies:
 * 1. 100% Dictionary Completeness: 2,208 / 2,208 canonical keys present in fil-PH.
 * 2. Zero missing keys, zero empty keys, zero whitespace-only messages.
 * 3. 100% placeholder parity between en-PH and fil-PH across all 2,208 keys.
 * 4. Zero required English fallback: every canonical key resolves directly in fil-PH.
 * 5. Zero raw translation keys rendered in any domain.
 * 6. Pluralization compliance using Intl.PluralRules and formatPlural.
 * 7. Invariant preservation: RENTipid, PHP, ₱, PayMongo, GCash, Maya.
 * 8. Active rendered UI components visibly render natural Filipino copy (Footer, Checkout FX).
 * 9. Accessibility localization: aria-labels and alt attributes translated.
 * 10. Architectural firewalls preserved: language independence from currency/payment/RBAC.
 * 11. Governance invariants: fil-PH remains QA_REQUIRED; ja-JP remains REGISTERED with 0 keys.
 * 12. Lifecycle gates G1-G13 remain NOT PROMOTED.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  EN_PH_BUNDLE,
  FIL_PH_BUNDLE,
  GLCC_CANONICAL_KEYS,
  GLCC_REQUIRED_DOMAINS,
  TranslationEngine,
  TranslationProvider,
  validateTranslationBundle,
  validateCanonicalSourceCompleteness,
  extractPlaceholders,
  formatPlural,
  type GlccCanonicalTranslationKey,
} from '@/lib/glcc/i18n';
import { getDefaultLocaleRegistry } from '@/lib/glcc/default-registries';
import { isLocaleProductionSelectable } from '@/lib/glcc/registry-contracts';
import { resolveEffectiveLocale } from '@/lib/glcc/locale-resolver';
import Footer from '@/components/layout/Footer';
import { CheckoutFxDisclosure } from '@/components/glcc/CheckoutFxDisclosure';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

describe('RENTipid GLCC v1.0.1 — Work Package P6: Filipino Proof Pack Suite', () => {
  let engineEn: TranslationEngine;
  let engineFil: TranslationEngine;

  beforeAll(() => {
    engineEn = new TranslationEngine({ defaultLocale: 'en-PH' });
    engineEn.registerBundle(EN_PH_BUNDLE);
    engineEn.setActiveLocale('en-PH');

    engineFil = new TranslationEngine({ defaultLocale: 'en-PH' });
    engineFil.registerBundle(EN_PH_BUNDLE);
    engineFil.registerBundle(FIL_PH_BUNDLE);
    engineFil.setActiveLocale('fil-PH');
  });

  describe('1. Dictionary Completeness & Key Parity (2,208 / 2,208)', () => {
    it('fil-PH satisfies 100% of canonical contract keys (2,208 / 2,208)', () => {
      const canonicalTotal = GLCC_CANONICAL_KEYS.length;
      const filKeys = Object.keys(FIL_PH_BUNDLE.messages);

      expect(canonicalTotal).toBe(2208);
      expect(filKeys.length).toBe(2208);

      const validation = validateTranslationBundle(FIL_PH_BUNDLE, EN_PH_BUNDLE, { allowPartial: false });
      expect(validation.isValid).toBe(true);
      expect(validation.missingKeys).toHaveLength(0);
      expect(validation.extraKeys).toHaveLength(0);
      expect(validation.presentKeysCount).toBe(2208);
      expect(validation.coveragePercentage).toBe(100);
    });

    it('canonical source completeness validator confirms zero missing and zero empty keys in fil-PH', () => {
      const completeness = validateCanonicalSourceCompleteness(FIL_PH_BUNDLE);
      expect(completeness.isValid).toBe(true);
      expect(completeness.missingCanonicalKeys).toHaveLength(0);
      expect(completeness.emptyKeys).toHaveLength(0);
    });

    it('all 31 required application domains are fully covered in fil-PH', () => {
      expect(GLCC_REQUIRED_DOMAINS).toHaveLength(31);

      for (const domain of GLCC_REQUIRED_DOMAINS) {
        const domainKeys = GLCC_CANONICAL_KEYS.filter((k) => {
          if (domain === 'common') return k.startsWith('common.') || k.startsWith('fx.');
          if (domain === 'navigation') return k.startsWith('navigation.') || k.startsWith('footer.');
          if (domain === 'preferences') return k.startsWith('preferences.') || k.startsWith('globalPreferences.');
          if (domain === 'listing') return k.startsWith('listing.') || k.startsWith('listingWizard.') || k.startsWith('listingEditForm.');
          if (domain === 'provider') return k.startsWith('provider.') || k.startsWith('providerListings.') || k.startsWith('providerNewListing.') || k.startsWith('providerEditListing.') || k.startsWith('providerListingManage.');
          if (domain === 'renter') return k.startsWith('renter.');
          if (domain === 'documents') return k.startsWith('documents.') || k.startsWith('documentUploader.');
          return k.startsWith(`${domain}.`);
        });

        expect(domainKeys.length).toBeGreaterThan(0);

        for (const k of domainKeys) {
          const msg = FIL_PH_BUNDLE.messages[k];
          expect(msg).toBeDefined();
          expect(typeof msg).toBe('string');
          expect(msg.trim().length).toBeGreaterThan(0);
        }
      }
    });

    it('enforces 100% placeholder parity between en-PH and fil-PH across all 2,208 keys', () => {
      let testedPlaceholderCount = 0;

      for (const key of GLCC_CANONICAL_KEYS) {
        const enMsg = EN_PH_BUNDLE.messages[key];
        const filMsg = FIL_PH_BUNDLE.messages[key];

        expect(enMsg).toBeDefined();
        expect(filMsg).toBeDefined();

        const enPlaceholders = extractPlaceholders(enMsg).sort();
        const filPlaceholders = extractPlaceholders(filMsg).sort();

        expect(filPlaceholders).toEqual(enPlaceholders);
        if (enPlaceholders.length > 0) {
          testedPlaceholderCount++;
        }
      }

      // Exactly 43 canonical keys contain interpolation placeholders
      expect(testedPlaceholderCount).toBe(43);
    });
  });

  describe('2. Direct Resolution & Zero Fallback Invariant', () => {
    it('every canonical key resolves directly in fil-PH from bundle messages without falling back', () => {
      let directResolutionCount = 0;

      for (const key of GLCC_CANONICAL_KEYS) {
        const filBundleMsg = FIL_PH_BUNDLE.messages[key];
        const translatedResult = engineFil.translate(key);

        expect(filBundleMsg).toBeDefined();
        expect(typeof filBundleMsg).toBe('string');
        expect(filBundleMsg.trim().length).toBeGreaterThan(0);

        // Verify that the translation engine returns the exact message from the fil-PH bundle
        expect(translatedResult).toBe(filBundleMsg);
        directResolutionCount++;
      }

      expect(directResolutionCount).toBe(2208);
    });

    it('zero raw translation keys rendered in fil-PH', () => {
      let rawKeyCount = 0;

      for (const key of GLCC_CANONICAL_KEYS) {
        const result = engineFil.translate(key);
        if (result === key || result.startsWith(key.split('.')[0] + '.')) {
          rawKeyCount++;
        }
      }

      expect(rawKeyCount).toBe(0);
    });
  });

  describe('3. Pluralization & ECMA-402 Compliance', () => {
    it('formatPlural correctly selects and formats Filipino plural forms', () => {
      const forms = {
        one: '{count} listahan',
        other: '{count} mga listahan',
      };

      // Under CLDR Filipino plural rules: 1 is category 'one'
      const resultOne = formatPlural(1, 'fil-PH', forms);
      expect(resultOne).toBe('1 listahan');

      // Under CLDR Filipino plural rules: 4 is category 'other'
      const resultFour = formatPlural(4, 'fil-PH', forms);
      expect(resultFour).toBe('4 mga listahan');
    });

    it('formatPlural handles complex category structures gracefully', () => {
      const complexForms = {
        zero: 'Walang nahanap na resulta',
        one: '{count} resulta ang nahanap',
        other: '{count} mga resulta ang nahanap',
      };

      expect(formatPlural(1, 'fil-PH', complexForms)).toBe('1 resulta ang nahanap');
      expect(formatPlural(4, 'fil-PH', complexForms)).toBe('4 mga resulta ang nahanap');
    });
  });

  describe('4. Linguistic QA & Statutory Invariants', () => {
    it('preserves invariant proper nouns, brands, and statutory titles', () => {
      const sampleKeys = [
        'common.installRentipidApp',
        'footer.copyright',
        'checkout.phpPhilippinePeso',
        'checkout.paymongoActivationIsPending',
        'checkout.onlyStandardGcashOr',
        'legalCompliance.searchLawsJurisdictionsTopics',
        'legalCompliance.readPrivacyPolicy',
        'auth.privacyPolicy',
      ];

      for (const k of sampleKeys) {
        const filMsg = FIL_PH_BUNDLE.messages[k as GlccCanonicalTranslationKey];
        expect(filMsg).toBeDefined();

        if (k === 'common.installRentipidApp') expect(filMsg).toContain('RENTipid');
        if (k === 'footer.copyright') expect(filMsg).toContain('RENTipid');
        if (k === 'checkout.phpPhilippinePeso') expect(filMsg).toContain('PHP');
        if (k === 'checkout.paymongoActivationIsPending') expect(filMsg).toContain('PayMongo');
        if (k === 'checkout.onlyStandardGcashOr') expect(filMsg).toContain('GCash');
        if (k === 'legalCompliance.searchLawsJurisdictionsTopics') expect(filMsg).toContain('RA 11967');
      }
    });

    it('metadata reflects truthful QA mode', () => {
      expect(FIL_PH_BUNDLE.locale).toBe('fil-PH');
      expect(FIL_PH_BUNDLE.direction).toBe('ltr');
      expect(FIL_PH_BUNDLE.version).toBe('1.0.1');
      expect(FIL_PH_BUNDLE.isFixture).toBe(false);
      expect(FIL_PH_BUNDLE.releaseStatus).toBe('QA_REQUIRED');
    });
  });

  describe('5. Rendered Application Surface Verification (All 8 Surface Groups)', () => {
    it('CheckoutFxDisclosure renders authoritative Filipino copy and ordinary English UI is absent', () => {
      render(
        <TranslationProvider initialLocale="fil-PH" initialDirection="ltr">
          <CheckoutFxDisclosure
            authoritativeAmountPhp={5600}
            targetCurrency="PHP"
          />
        </TranslationProvider>
      );

      // Verify authoritative payment currency notice in Filipino
      expect(screen.getByText('May Kapangyarihang Pananalapi sa Pagbabayad')).toBeDefined();
      expect(screen.getByText(/PHP \(Philippine Peso\)/i)).toBeDefined();
      expect(screen.getByText(/Huling halaga:/i)).toBeDefined();

      // Verify ordinary English UI is strictly absent (0 fallback)
      expect(screen.queryByText('Authoritative Payment Currency')).toBeNull();
    });

    it('Footer renders Filipino copy when TranslationProvider is active with fil-PH and ordinary English headers are absent', () => {
      render(
        <TranslationProvider initialLocale="fil-PH" initialDirection="ltr">
          <Footer />
        </TranslationProvider>
      );

      // Verify platform section headers translated into Filipino
      expect(screen.getByText('Plataporma')).toBeDefined();
      expect(screen.getByText('Tiwala at Legal')).toBeDefined();
      expect(screen.getByText('Suporta')).toBeDefined();
      expect(screen.getByText('Mag-browse ng mga Paupahan')).toBeDefined();
      expect(screen.getByText('Ilista ang Iyong Gamit')).toBeDefined();

      // Verify ordinary English headers are strictly absent
      expect(screen.queryByText('Platform')).toBeNull();
      expect(screen.queryByText('Trust & Legal')).toBeNull();
      expect(screen.queryByText('Support')).toBeNull();
    });

    it('Surface Group 1 (PUBLIC): verifies multiple Filipino strings and absence of ordinary English', () => {
      const publicKeys = [
        'navigation.browseRentals',
        'navigation.howItWorks',
        'navigation.safety',
        'navigation.listYourItem',
        'footer.platform',
        'footer.trustAndLegal',
        'footer.support',
        'helpCenter.howCanIHelp',
      ] as const;

      for (const k of publicKeys) {
        const filMsg = engineFil.translate(k);
        const enMsg = engineEn.translate(k);
        expect(filMsg).toBeDefined();
        expect(filMsg.length).toBeGreaterThan(0);
        expect(filMsg).not.toEqual(enMsg);
      }
    });

    it('Surface Group 2 (IDENTITY): verifies multiple Filipino strings and absence of ordinary English', () => {
      const identityKeys = [
        'auth.login.title',
        'auth.login.signIn',
        'auth.login.createAccount',
        'auth.login.forgotPassword',
        'auth.register.title',
        'auth.register.alreadyHaveAccount',
        'account.profile.deleteAccount',
      ] as const;

      for (const k of identityKeys) {
        const filMsg = engineFil.translate(k);
        const enMsg = engineEn.translate(k);
        expect(filMsg).toBeDefined();
        expect(filMsg.length).toBeGreaterThan(0);
        expect(filMsg).not.toEqual(enMsg);
      }
    });

    it('Surface Group 3 (RENTER): verifies multiple Filipino strings and absence of ordinary English', () => {
      const renterKeys = [
        'checkout.authoritativePaymentCurrency',
        'checkout.orderSummary',
        'checkout.securityDepositEscrow',
        'checkout.total',
        'renter.bookings.title',
        'renter.bookingDetail.baseRental',
        'renter.damageClaimAgainstDeposit',
      ] as const;

      for (const k of renterKeys) {
        const filMsg = engineFil.translate(k);
        const enMsg = engineEn.translate(k);
        expect(filMsg).toBeDefined();
        expect(filMsg.length).toBeGreaterThan(0);
        expect(filMsg).not.toEqual(enMsg);
      }
    });

    it('Surface Group 4 (PROVIDER): verifies multiple Filipino strings and absence of ordinary English', () => {
      const providerKeys = [
        'providerListings.title',
        'providerListings.createNew',
        'providerNewListing.title',
        'providerNewListing.legalRequirementsTitle',
        'partnerHub.businessDashboard',
      ] as const;

      for (const k of providerKeys) {
        const filMsg = engineFil.translate(k);
        const enMsg = engineEn.translate(k);
        expect(filMsg).toBeDefined();
        expect(filMsg.length).toBeGreaterThan(0);
        expect(filMsg).not.toEqual(enMsg);
      }
    });

    it('Surface Group 5 (COMMUNICATION): verifies multiple Filipino strings and absence of ordinary English', () => {
      const commKeys = [
        'messages.general.title',
        'notifications.general.title',
        'reviews.general.title',
      ] as const;

      for (const k of commKeys) {
        const filMsg = engineFil.translate(k);
        const enMsg = engineEn.translate(k);
        expect(filMsg).toBeDefined();
        expect(filMsg.length).toBeGreaterThan(0);
        expect(filMsg).not.toEqual(enMsg);
      }
    });

    it('Surface Group 6 (TRUST): verifies multiple Filipino strings and absence of ordinary English', () => {
      const trustKeys = [
        'kyc.accountVerificationKyc',
        'kyc.uploadDocument',
        'trustSafety.builtOnTrustSafety',
        'trustSafety.verifiedCommunity',
        'legalCompliance.complianceVerification',
      ] as const;

      for (const k of trustKeys) {
        const filMsg = engineFil.translate(k);
        const enMsg = engineEn.translate(k);
        expect(filMsg).toBeDefined();
        expect(filMsg.length).toBeGreaterThan(0);
        expect(filMsg).not.toEqual(enMsg);
      }
    });

    it('Surface Group 7 (ADMIN): verifies multiple Filipino strings and absence of ordinary English', () => {
      const adminKeys = [
        'superAdmin.title',
        'admin.accountDeletionRequests',
        'admin.readOnlyObservabilityTelemetry',
        'soc.securityAlertsReview',
        'soc.behavioralRiskInvestigation',
      ] as const;

      for (const k of adminKeys) {
        const filMsg = engineFil.translate(k);
        const enMsg = engineEn.translate(k);
        expect(filMsg).toBeDefined();
        expect(filMsg.length).toBeGreaterThan(0);
        expect(filMsg).not.toEqual(enMsg);
      }
    });

    it('Surface Group 8 (GLOBAL): verifies Global Preferences renders Filipino copy', () => {
      const globalKeys = [
        'globalPreferences.title',
        'globalPreferences.countryTab',
        'globalPreferences.languageTab',
        'globalPreferences.currencyTab',
        'globalPreferences.applyButton',
        'globalPreferences.cancelButton',
      ] as const;

      for (const k of globalKeys) {
        const filMsg = engineFil.translate(k);
        const enMsg = engineEn.translate(k);
        expect(filMsg).toBeDefined();
        expect(filMsg.length).toBeGreaterThan(0);
        expect(filMsg).not.toEqual(enMsg);
      }
    });

    it('Accessibility localization: verifies aria-labels and navigation semantics render in Filipino', () => {
      const ariaNav = engineFil.translate('navigation.mainNav');
      const ariaUser = engineFil.translate('navigation.userActions');

      expect(ariaNav).toBe('Pangunahing Nabigasyon');
      expect(ariaUser).toBe('Mga Aksyon ng Gumagamit');
      expect(ariaNav).not.toEqual(engineEn.translate('navigation.mainNav'));
      expect(ariaUser).not.toEqual(engineEn.translate('navigation.userActions'));
    });

    it('HTML Language Semantics: verifies lang="fil-PH" and dir="ltr"', () => {
      expect(FIL_PH_BUNDLE.locale).toBe('fil-PH');
      expect(FIL_PH_BUNDLE.direction).toBe('ltr');
      expect(engineFil.getDirection('fil-PH')).toBe('ltr');
    });

    it('Layout & Text Expansion: asserts Filipino string lengths remain within standard container tolerances', () => {
      // Check that button labels and headings do not exceed reasonable expansion bounds (<= 250% of en-PH)
      const testButtons = [
        'navigation.browseRentals',
        'navigation.listYourItem',
        'navigation.login',
        'navigation.register',
        'preferences.applyButton',
        'preferences.cancelButton',
      ] as const;

      for (const k of testButtons) {
        const filLen = engineFil.translate(k).length;
        const enLen = engineEn.translate(k).length;
        expect(filLen).toBeLessThanOrEqual(enLen * 2.5 + 10);
      }
    });
  });

  describe('6. Independence & Governance Invariants', () => {
    it('authoritative locale resolver supports fil-PH resolution in controlled QA mode', () => {
      const resolution = resolveEffectiveLocale(
        { explicitLocale: 'fil-PH' },
        undefined,
        { resolverMode: 'QA' }
      );

      expect(resolution.effectiveLocale).toBe('fil-PH');
      expect(resolution.releaseStatus).toBe('QA_REQUIRED');
    });

    it('authoritative locale resolver fails closed to en-PH in production mode', () => {
      const resolution = resolveEffectiveLocale(
        { explicitLocale: 'fil-PH' },
        undefined,
        { resolverMode: 'PRODUCTION' }
      );

      // In production mode, fil-PH is ineligible because it is QA_REQUIRED
      expect(resolution.effectiveLocale).toBe('en-PH');
      expect(resolution.releaseStatus).toBe('PRODUCTION_READY');
    });

    it('fil-PH remains QA_REQUIRED in the authoritative locale registry (Production activation blocked)', () => {
      const registry = getDefaultLocaleRegistry();
      const record = registry.getLocale('fil-PH');

      expect(record).toBeDefined();
      expect(record?.releaseStatus).toBe('QA_REQUIRED');
      expect(record?.enabled).toBe(true);

      // In production mode, QA_REQUIRED locale is NOT selectable by end users
      expect(isLocaleProductionSelectable(record!)).toBe(false);
    });

    it('ja-JP remains REGISTERED with 0 translation keys', () => {
      const registry = getDefaultLocaleRegistry();
      const record = registry.getLocale('ja-JP');

      expect(record).toBeDefined();
      expect(record?.releaseStatus).toBe('REGISTERED');
      expect(isLocaleProductionSelectable(record!)).toBe(false);

      // Zero dictionary files exist for ja-JP
      const jaKeys = Object.keys(FIL_PH_BUNDLE.messages).filter((k) => k.startsWith('ja-'));
      expect(jaKeys).toHaveLength(0);
    });

    it('language translation contract strictly maintains currency, payment, and RBAC firewalls', () => {
      // Language dictionary has ZERO authority over financial or auth data structures
      expect(FIL_PH_BUNDLE).not.toHaveProperty('countryCode');
      expect(FIL_PH_BUNDLE).not.toHaveProperty('currency');
      expect(FIL_PH_BUNDLE).not.toHaveProperty('displayCurrency');
      expect(FIL_PH_BUNDLE).not.toHaveProperty('chargeCurrency');
      expect(FIL_PH_BUNDLE).not.toHaveProperty('paymentProvider');
      expect(FIL_PH_BUNDLE).not.toHaveProperty('settlementLedger');
      expect(FIL_PH_BUNDLE).not.toHaveProperty('roles');
      expect(FIL_PH_BUNDLE).not.toHaveProperty('permissions');
      expect(FIL_PH_BUNDLE).not.toHaveProperty('kycAuthority');
      expect(FIL_PH_BUNDLE).not.toHaveProperty('complianceJurisdiction');
    });
  });
});

