/**
 * @jest-environment node
 */

/**
 * RENTipid GLCC v1.0.1 — Work Package P4 Automated Validation Suite
 *
 * Verifies:
 * 1. Canonical key uniqueness (0 duplicate keys)
 * 2. All 31 required application domains represented and mapped
 * 3. en-PH 100% required key coverage (0 missing, 0 empty)
 * 4. Interpolation placeholder consistency
 * 5. Pluralization contract validity
 * 6. Approved exclusion registry validity
 * 7. 0 unclassified inventory strings (100% assigned to canonical keys or approved exclusions)
 * 8. Production-ready locale completeness rule (strict fail-closed)
 * 9. Non-production locale partial-coverage rule (truthful reporting)
 * 10. fil-PH remains QA_REQUIRED in registry
 * 11. ja-JP remains REGISTERED with 0 translation keys
 * 12. Language / Payment / Currency / RBAC architectural firewall preserved
 */

import {
  GLCC_CANONICAL_KEYS,
  GLCC_REQUIRED_DOMAINS,
  TRANSLATION_CONTRACT_VERSION,
  EN_PH_BUNDLE,
  FIL_PH_BUNDLE,
  validateCanonicalSourceCompleteness,
  validateTranslationBundle,
  extractPlaceholders,
  formatPlural,
  type GlccCanonicalTranslationKey,
} from '@/lib/glcc/i18n';
import { getDefaultLocaleRegistry } from '@/lib/glcc/default-registries';
import fs from 'fs';
import path from 'path';

describe('RENTipid GLCC v1.0.1 — P4 Translation Contract Validation Suite', () => {
  const ROOT_DIR = process.cwd();

  describe('1. Canonical Key Uniqueness & Structure', () => {
    it('has zero duplicate canonical keys', () => {
      const seen = new Set<string>();
      const duplicates: string[] = [];

      for (const key of GLCC_CANONICAL_KEYS) {
        if (seen.has(key)) {
          duplicates.push(key);
        }
        seen.add(key);
      }

      expect(duplicates).toHaveLength(0);
      expect(seen.size).toBe(GLCC_CANONICAL_KEYS.length);
    });

    it('enforces semantic key naming convention (domain.feature.element)', () => {
      for (const key of GLCC_CANONICAL_KEYS) {
        const segments = key.split('.');
        expect(segments.length).toBeGreaterThanOrEqual(2);
        // Keys should be alphanumeric with dots, no spaces
        expect(key).toMatch(/^[a-zA-Z0-9._-]+$/);
        expect(key).not.toContain(' ');
      }
    });

    it('exports authoritative translation contract version 1.0.1', () => {
      expect(TRANSLATION_CONTRACT_VERSION).toBe('1.0.1');
    });
  });

  describe('2. Required Domains Coverage', () => {
    it('represents all 31 required platform domains', () => {
      expect(GLCC_REQUIRED_DOMAINS).toHaveLength(31);

      const requiredDomains = [
        'common', 'navigation', 'auth', 'preferences', 'marketplace',
        'listing', 'search', 'booking', 'checkout', 'payment',
        'account', 'profile', 'provider', 'renter', 'partnerHub',
        'messages', 'notifications', 'reviews', 'kyc', 'insurance',
        'support', 'helpCenter', 'trustSafety', 'legalCompliance',
        'admin', 'superAdmin', 'soc', 'errors', 'validation',
        'status', 'documents'
      ];

      for (const domain of requiredDomains) {
        expect(GLCC_REQUIRED_DOMAINS).toContain(domain);
      }
    });

    it('each required domain has active canonical keys in the contract', () => {
      const DOMAIN_MAP: Record<string, string> = {
        globalPreferences: 'preferences',
        preferences: 'preferences',
        common: 'common',
        navigation: 'navigation',
        footer: 'navigation',
        auth: 'auth',
        account: 'account',
        marketplace: 'marketplace',
        home: 'marketplace',
        listing: 'listing',
        listingWizard: 'listing',
        listingEditForm: 'listing',
        booking: 'booking',
        renter: 'renter',
        providerListings: 'provider',
        providerNewListing: 'provider',
        providerEditListing: 'provider',
        providerListingManage: 'provider',
        photoUploader: 'provider',
        documentUploader: 'documents',
        provider: 'provider',
        fx: 'payment',
        superAdmin: 'superAdmin',
      };

      const domainCounts: Record<string, number> = {};
      for (const d of GLCC_REQUIRED_DOMAINS) {
        domainCounts[d] = 0;
      }

      for (const key of GLCC_CANONICAL_KEYS) {
        const prefix = key.split('.')[0];
        const dom = DOMAIN_MAP[prefix] || prefix;
        if (domainCounts[dom] !== undefined) {
          domainCounts[dom]++;
        }
      }

      for (const count of Object.values(domainCounts)) {
        expect(count).toBeGreaterThan(0);
      }
    });
  });

  describe('3. Canonical en-PH 100% Coverage & Data Quality', () => {
    it('satisfies 100% of canonical contract keys with zero missing and zero empty', () => {
      const completeness = validateCanonicalSourceCompleteness(EN_PH_BUNDLE);
      expect(completeness.isValid).toBe(true);
      expect(completeness.missingCanonicalKeys).toHaveLength(0);
      expect(completeness.emptyKeys).toHaveLength(0);
    });

    it('contains no placeholder tokens (TODO, TBD, undefined, raw key names) in en-PH', () => {
      for (const [key, msg] of Object.entries(EN_PH_BUNDLE.messages)) {
        expect(typeof msg).toBe('string');
        expect(msg.trim().length).toBeGreaterThan(0);
        expect(msg).not.toBe(key);
        expect(msg).not.toContain('TODO');
        expect(msg).not.toContain('TBD');
        expect(msg).not.toContain('PLACEHOLDER_TRANSLATION');
      }
    });
  });

  describe('4. Interpolation Contract Consistency', () => {
    it('detects and validates interpolation variables in canonical messages', () => {
      const keysWithParams: string[] = [];

      for (const [key, msg] of Object.entries(EN_PH_BUNDLE.messages)) {
        const placeholders = extractPlaceholders(msg);
        if (placeholders.length > 0) {
          keysWithParams.push(key);
          // Parameter names must be standard alphanumeric tokens
          for (const param of placeholders) {
            expect(param).toMatch(/^[a-zA-Z0-9_]+$/);
          }
        }
      }

      expect(keysWithParams.length).toBeGreaterThan(0);
      expect(keysWithParams).toContain('globalPreferences.triggerLabel');
    });

    it('enforces exact placeholder parity between en-PH and fil-PH for present keys', () => {
      for (const [key, filMsg] of Object.entries(FIL_PH_BUNDLE.messages)) {
        const enMsg = EN_PH_BUNDLE.messages[key as GlccCanonicalTranslationKey];
        if (enMsg) {
          const enPlaceholders = extractPlaceholders(enMsg).sort();
          const filPlaceholders = extractPlaceholders(filMsg).sort();
          expect(filPlaceholders).toEqual(enPlaceholders);
        }
      }
    });
  });

  describe('5. Pluralization Contract Validation', () => {
    it('correctly uses Intl.PluralRules with standards-based plural categories', () => {
      const forms = {
        one: '{count} item',
        other: '{count} items',
      };

      expect(formatPlural(1, 'en-PH', forms)).toBe('1 item');
      expect(formatPlural(2, 'en-PH', forms)).toBe('2 items');
      expect(formatPlural(5, 'en-PH', forms)).toBe('5 items');
    });

    it('supports complex plural categories in contract', () => {
      const complexForms = {
        zero: 'No results',
        one: '{count} result',
        other: '{count} results',
      };

      expect(formatPlural(1, 'en-PH', complexForms)).toBe('1 result');
      expect(formatPlural(10, 'en-PH', complexForms)).toBe('10 results');
    });
  });

  describe('6. Approved Exclusion Registry & Zero Unclassified Invariant', () => {
    it('p4-translation-exclusions.json exists and defines approved exclusion categories', () => {
      const p = path.join(ROOT_DIR, 'docs/governance/glcc-v1.0.1/evidence/p4/p4-translation-exclusions.json');
      expect(fs.existsSync(p)).toBe(true);

      const exclusions = JSON.parse(fs.readFileSync(p, 'utf8'));
      expect(exclusions.categories.length).toBeGreaterThanOrEqual(8);

      const categoryNames = exclusions.categories.map((c: { category: string }) => c.category);
      expect(categoryNames).toContain('BRAND_NAMES');
      expect(categoryNames).toContain('CURRENCY_CODES_AND_SYMBOLS');
      expect(categoryNames).toContain('TECHNICAL_STANDARDS_AND_ACRONYMS');
      expect(categoryNames).toContain('LOCALE_AND_COUNTRY_CODES');
      expect(categoryNames).toContain('UI_DELIMITERS_AND_SYMBOLS');
      expect(categoryNames).toContain('CONTROLLED_LEGAL_CONTRACT_PROSE');
    });

    it('unclassified required strings is strictly zero (0)', () => {
      const p = path.join(ROOT_DIR, 'docs/governance/glcc-v1.0.1/evidence/p4/p4-pending-p5-migration.json');
      expect(fs.existsSync(p)).toBe(true);

      const pending = JSON.parse(fs.readFileSync(p, 'utf8'));
      expect(pending.unclassifiedStringsCount).toBe(0);
      expect(pending.mappedCanonicalKeysCount).toBeGreaterThan(0);
      expect(pending.runtimeComponentMigrationStatus).toBe('PENDING_P5_MIGRATION');
    });
  });

  describe('7. Production-Ready vs Non-Production Completeness Policy', () => {
    it('PRODUCTION_READY bundle (en-PH) strictly fails if any key is missing', () => {
      const incompleteEnBundle = {
        ...EN_PH_BUNDLE,
        locale: 'en-PH',
        releaseStatus: 'PRODUCTION_READY' as const,
        messages: {
          'common.loading': 'Loading...',
        } as Record<string, string>,
      };

      const result = validateTranslationBundle(incompleteEnBundle, EN_PH_BUNDLE);
      expect(result.isValid).toBe(false);
      expect(result.missingKeys.length).toBeGreaterThan(100);
    });

    it('QA_REQUIRED bundle (fil-PH) truthfully allows partial coverage while measuring missing keys', () => {
      const result = validateTranslationBundle(FIL_PH_BUNDLE, EN_PH_BUNDLE, { allowPartial: true });
      expect(result.isValid).toBe(true);
      expect(result.extraKeys).toHaveLength(0);
      expect(result.placeholderMismatches).toHaveLength(0);
      expect(result.presentKeysCount).toBe(445);
      expect(result.missingKeys.length).toBe(GLCC_CANONICAL_KEYS.length - 445);
      expect(result.coveragePercentage).toBeGreaterThan(20);
    });
  });

  describe('8. Governance & Registry Invariant Check', () => {
    it('fil-PH remains QA_REQUIRED in the authoritative locale registry', () => {
      const registry = getDefaultLocaleRegistry();
      const record = registry.getLocale('fil-PH');
      expect(record).toBeDefined();
      expect(record?.releaseStatus).toBe('QA_REQUIRED');
      expect(record?.enabled).toBe(true);
    });

    it('ja-JP remains REGISTERED in the authoritative locale registry with 0 dictionary keys', () => {
      const registry = getDefaultLocaleRegistry();
      const record = registry.getLocale('ja-JP');
      expect(record).toBeDefined();
      expect(record?.releaseStatus).toBe('REGISTERED');
      expect(record?.enabled).toBe(true);

      // Verify ja-JP is NOT in the active translation bundles
      const jaPath = path.join(ROOT_DIR, 'src/lib/glcc/i18n/locales/ja-JP.ts');
      expect(fs.existsSync(jaPath)).toBe(false);
    });

    it('language translation contract preserves architectural firewalls (no currency/payment/role mutations)', () => {
      // Translation contract handles strings only
      expect(EN_PH_BUNDLE).not.toHaveProperty('currency');
      expect(EN_PH_BUNDLE).not.toHaveProperty('chargeCurrency');
      expect(EN_PH_BUNDLE).not.toHaveProperty('settlementLedger');
      expect(EN_PH_BUNDLE).not.toHaveProperty('roles');
      expect(EN_PH_BUNDLE).not.toHaveProperty('permissions');
    });
  });
});
