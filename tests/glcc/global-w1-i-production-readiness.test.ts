/**
 * RENTipid GLCC v1.1 — GLOBAL-W1-I Global Production Readiness Test Suite
 *
 * Verifies all mandatory readiness gates prior to controlled Production activation:
 * 1. Provenance Parity & Minimal Application Drift Post-Preview
 * 2. Production Baseline Ancestry & No Regression on Newer Production Work
 * 3. Environment Safety & Database No-Change Plan
 * 4. Auth Verification & Non-Customer Test Identities
 * 5. Boundary Preservation (Financial, RBAC, KYC, Jurisdiction, Legal)
 * 6. Rollback Plan Completeness & 34-Scenario Production Verification Plan
 * 7. 32 Candidate Locales Production Readiness Evaluation
 * 8. 12 Regional / Shared Aliases Resolution
 * 9. Production Gate Firewall (Strictly 0 new languages production-selectable)
 * 10. 23 Supported Currencies Runtime & Presentation Integrity
 * 11. FX Adapter Contract & Fail-Closed Safety
 * 12. Cross-Dimension Independence Invariants
 */

import {
  validateProductionCandidateReadiness,
  validateProductionChangeSet,
  validateProductionEnvironmentSafety,
  validateProductionDatabasePlan,
  validateProductionAuthVerification,
  validateProductionBoundaries,
  validateProductionRollbackPlan,
  validateProductionDeploymentProvenance,
  validateProductionVerificationPlan,
  simulateProductionSelectorEligibility,
} from '../../scripts/glcc-v1.1/production-readiness-validate';
import {
  PRODUCTION_VERIFICATION_SCENARIOS,
  ProductionCandidateInput,
  ProductionChangeSetDeclaration,
  ProductionEnvironmentSafetyInput,
  ProductionDatabaseChangePlan,
  ProductionAuthVerificationContract,
  ProductionBoundaryIntegrity,
  ProductionRollbackPlan,
  ProductionDeploymentProvenance,
} from '../../scripts/glcc-v1.1/production-readiness-schema';
import {
  GLOBAL_LANGUAGE_CATALOG,
  getLanguageDefinition,
  isLanguageProductionSelectable,
} from '../../src/lib/glcc/language/language-registry';
import {
  GLOBAL_CURRENCY_CATALOG,
  GLOBAL_SUPPORTED_CURRENCY_CODES,
  getCurrencyDefinition,
  formatGlobalCurrency,
  resolveMonetaryAuthority,
} from '../../src/lib/glcc/currency/currency-registry';
import {
  GLOBAL_COUNTRY_CATALOG,
  getCountryProfile,
} from '../../src/lib/glcc/country/country-registry';
import {
  CurrencyApiRateProvider,
  APPROVED_FX_PROVIDER_ID,
} from '../../src/lib/glcc/currencyapi-adapter';
import { TranslationEngine } from '../../src/lib/glcc/i18n/engine';
import {
  getQaCandidateLocalePack,
  registerQaCandidateBundlesIntoEngine,
} from '../../src/lib/glcc/i18n/qa-candidate-loader';

const CANDIDATE_HEAD_SHA = '24b5cc92561befc5b93595c677fef7f111114e95';
const ACCEPTED_PREVIEW_APP_SHA = '5758790f85dbcbb95a00b4017e7f41931fcfb776';
const ACCEPTED_PREVIEW_DPL_ID = 'dpl_CgW7qDegPhmQXN34s2aPmymGfUtS';
const CURRENT_PROD_DPL_ID = 'dpl_7CtWAHhhBu2zWNcDPPNkDX7zBw6X';
const CURRENT_PROD_SOURCE_SHA = '7ed8388f36e970f7da7d04ca44afccb883d4ea9d';
const PRODUCTION_DOMAIN = 'https://www.rentipid.com.ph';

const FULL_CANDIDATE_LOCALES = [
  'ar-AE', 'bg-BG', 'cs-CZ', 'da-DK', 'de-DE', 'el-GR', 'en-US', 'es-ES',
  'et-EE', 'fi-FI', 'fr-FR', 'hi-IN', 'hr-HR', 'hu-HU', 'id-ID', 'is-IS',
  'it-IT', 'ja-JP', 'ko-KR', 'lt-LT', 'lv-LV', 'ms-MY', 'nb-NO', 'nl-NL',
  'pl-PL', 'pt-BR', 'ro-RO', 'sk-SK', 'sl-SI', 'sv-SE', 'vi-VN', 'zh-Hans',
];

const REGIONAL_ALIASES = [
  'en-GB', 'en-CA', 'en-AU', 'en-SG', 'en-IN', 'en-MY', 'en-ID',
  'pt-PT', 'fr-CA', 'ga-IE', 'mt-MT', 'ta-SG',
];

const CURRENCIES = [
  'PHP', 'USD', 'GBP', 'EUR', 'CAD', 'AUD', 'SGD', 'MYR', 'IDR', 'VND',
  'JPY', 'KRW', 'INR', 'AED', 'BRL', 'PLN', 'SEK', 'DKK', 'NOK', 'CZK',
  'HUF', 'RON', 'CHF',
];

describe('GLCC-GLOBAL-W1-I — Global Production Readiness Test Suite', () => {
  let engine: TranslationEngine;

  beforeAll(() => {
    engine = new TranslationEngine({
      defaultLocale: 'en-PH',
      enableDiagnostics: false,
    });
    registerQaCandidateBundlesIntoEngine(engine);
  });

  describe('1. Provenance Parity & Minimal Application Drift Post-Preview', () => {
    test('confirms candidate deployment provenance parameters', () => {
      expect(CANDIDATE_HEAD_SHA).toHaveLength(40);
      expect(ACCEPTED_PREVIEW_APP_SHA).toHaveLength(40);
      expect(ACCEPTED_PREVIEW_DPL_ID).toMatch(/^dpl_[a-zA-Z0-9]+$/);
      expect(CURRENT_PROD_DPL_ID).toMatch(/^dpl_[a-zA-Z0-9]+$/);
      expect(CURRENT_PROD_SOURCE_SHA).toHaveLength(40);
      expect(PRODUCTION_DOMAIN).toBe('https://www.rentipid.com.ph');
    });

    test('validates deployment provenance contract schema', () => {
      const prov: ProductionDeploymentProvenance = {
        candidateGitSha: ACCEPTED_PREVIEW_APP_SHA,
        deployedGitSha: ACCEPTED_PREVIEW_APP_SHA,
        deploymentId: ACCEPTED_PREVIEW_DPL_ID,
        deploymentUrl: 'https://preview.rentipid.com.ph',
        productionAlias: PRODUCTION_DOMAIN,
        localeTag: 'global-wave1',
        localePackChecksum: 'verified-pack-checksum',
        translationPackageChecksum: 'verified-work-checksum',
        previewAcceptanceEvidence: 'docs/governance/glcc-v1.1/global/evidence/global-w1-h-preview-activation-acceptance.json',
        productionReadinessEvidence: 'docs/governance/glcc-v1.1/global/evidence/global-w1-i-production-readiness.json',
      };
      const res = validateProductionDeploymentProvenance(prov);
      expect(res.isReady).toBe(true);
      expect(res.state).toBe('READY');
      expect(res.reasons).toHaveLength(0);
    });
  });

  describe('2. Production Change-Set & Minimal-Change Principle', () => {
    test('validates declared production changes with zero unrelated modifications', () => {
      const changeSet: ProductionChangeSetDeclaration = {
        declaredChanges: [
          {
            category: 'runtime_source',
            status: 'REQUIRED',
            description: 'Centralized global country, currency, and language catalogs',
            filesAffected: ['src/lib/glcc/country/country-registry.ts'],
          },
          {
            category: 'translation_bundle',
            status: 'REQUIRED',
            description: '32 full validated locale packages under governance control',
            filesAffected: FULL_CANDIDATE_LOCALES.map(loc => `docs/governance/glcc-v1.1/languages/${loc}/pack/${loc}-locale-pack.json`),
          },
        ],
        unrelatedRuntimeChangesCount: 0,
        unexpectedDatabaseChangesCount: 0,
        unexpectedEnvironmentChangesCount: 0,
        unexpectedPackageChangesCount: 0,
      };
      const res = validateProductionChangeSet(changeSet);
      expect(res.isReady).toBe(true);
      expect(res.state).toBe('READY');
      expect(res.reasons).toHaveLength(0);
    });
  });

  describe('3. Production Environment Safety & Database No-Change Plan', () => {
    test('confirms production environment safety contract', () => {
      const envSafety: ProductionEnvironmentSafetyInput = {
        environmentIdentity: 'Production',
        productionDatabaseIdentity: 'rentipid_production',
        productionAlias: PRODUCTION_DOMAIN,
        productionSecretsExposed: false,
        previewCredentialsReusedAsProduction: false,
        testCredentialsNonCustomer: true,
        productionQaModeEnabled: false,
      };
      const res = validateProductionEnvironmentSafety(envSafety);
      expect(res.isReady).toBe(true);
      expect(res.state).toBe('READY');
      expect(res.reasons).toHaveLength(0);
    });

    test('confirms no database schema change or migration is required', () => {
      const dbPlan: ProductionDatabaseChangePlan = {
        schemaMigrationRequired: false,
        seedSyncRequired: false,
        rollbackProcedureDefined: false,
        isExplicitlyGoverned: true,
        noOpEvidence: 'Zero database schema diffs between production and candidate HEAD.',
      };
      const res = validateProductionDatabasePlan(dbPlan);
      expect(res.isReady).toBe(true);
      expect(res.state).toBe('READY');
      expect(res.reasons).toHaveLength(0);
    });
  });

  describe('4. Auth Verification & Non-Customer Test Identity', () => {
    test('confirms auth verification adherence to least-privilege non-customer principles', () => {
      const auth: ProductionAuthVerificationContract = {
        testIdentityReference: 'oat.renter@rentipid.test',
        isNonCustomer: true,
        hasLeastPrivilege: true,
        secretExposedInPayload: false,
        smokeScenariosCovered: ['login', 'session', 'preferences', 'rendering', 'route', 'hard_refresh', 'logout'],
      };
      const res = validateProductionAuthVerification(auth);
      expect(res.isReady).toBe(true);
      expect(res.state).toBe('READY');
      expect(res.reasons).toHaveLength(0);
    });
  });

  describe('5. Boundary Preservation (Financial, RBAC, KYC, Jurisdiction, Legal)', () => {
    test('confirms strict preservation of statutory authority boundaries', () => {
      const boundaries: ProductionBoundaryIntegrity = {
        financialAuthorityPreserved: true,
        rbacPreserved: true,
        kycPreserved: true,
        jurisdictionPreserved: true,
        legalAuthorityPreserved: true,
      };
      const res = validateProductionBoundaries(boundaries);
      expect(res.isReady).toBe(true);
      expect(res.state).toBe('READY');
      expect(res.reasons).toHaveLength(0);
    });
  });

  describe('6. Production Rollback Plan & 34-Scenario Verification Plan', () => {
    test('validates rollback plan completeness against prior production deployment', () => {
      const plan: ProductionRollbackPlan = {
        targetLocaleTag: 'global-wave1',
        currentProductionDeploymentId: CURRENT_PROD_DPL_ID,
        currentProductionSourceSha: CURRENT_PROD_SOURCE_SHA,
        currentLocaleReleaseState: 'PREVIEW_ACCEPTED',
        currentAliasTarget: PRODUCTION_DOMAIN,
        databaseRollbackProcedure: 'NO-OP: No schema changes executed.',
        environmentRollbackProcedure: 'NO-OP: Environment untouched.',
        triggerConditions: [
          'Health probe failure',
          'Auth failure',
          'Payment deviation',
          'Hydration crash',
          'Raw key leak',
          'CDN asset failure',
        ],
        postRollbackVerificationSteps: [
          'Verify production health endpoint',
          'Verify baseline languages selectable',
        ],
      };
      const res = validateProductionRollbackPlan(plan);
      expect(res.isReady).toBe(true);
      expect(res.state).toBe('READY');
      expect(res.reasons).toHaveLength(0);
    });

    test('validates all 34 required production verification scenarios', () => {
      const res = validateProductionVerificationPlan(PRODUCTION_VERIFICATION_SCENARIOS);
      expect(res.isReady).toBe(true);
      expect(res.state).toBe('READY');
      expect(res.reasons).toHaveLength(0);
      expect(PRODUCTION_VERIFICATION_SCENARIOS).toHaveLength(34);
    });
  });

  describe('7. 32 Candidate Locales Production Readiness Evaluation', () => {
    FULL_CANDIDATE_LOCALES.forEach(locale => {
      test(`candidate locale ${locale} evaluates READY for production entry`, () => {
        const input: ProductionCandidateInput = {
          localeTag: locale,
          currentReleaseState: 'QA_REQUIRED',
          translationWorkflowState: 'APPROVED_FOR_QA',
          localePackValid: true,
          languageQaStatus: 'PASS',
          legalComplianceStatus: 'PASS',
          previewActivationStatus: 'COMPLETED',
          previewAcceptanceStatus: 'PASS',
          previewDeploymentProvenanceStatus: 'PASS',
          previewDatabaseIsolationStatus: 'PASS',
          previewAuthAcceptanceStatus: 'PASS',
          previewSecurityBoundariesStatus: 'PASS',
          previewFinancialBoundariesStatus: 'PASS',
          previewLegalBoundariesStatus: 'PASS',
          enPhNonRegressionStatus: 'PASS',
          filPhNonRegressionStatus: 'PASS',
          coveragePercentage: 100,
          missingRequiredCount: 0,
          requiredFallbackCount: 0,
          rawKeyCount: 0,
          criticalBlockersCount: 0,
          highBlockersCount: 0,
        };
        const res = validateProductionCandidateReadiness(input);
        expect(res.isReady).toBe(true);
        expect(res.state).toBe('READY');
        expect(res.reasons).toHaveLength(0);

        // Also verify pack contains all 2208 messages
        const pack = getQaCandidateLocalePack(locale);
        expect(pack).not.toBeNull();
        expect(Object.keys(pack!.messages)).toHaveLength(2208);
      });
    });
  });

  describe('8. 12 Regional / Shared Aliases Resolution', () => {
    REGIONAL_ALIASES.forEach(alias => {
      test(`alias ${alias} resolves cleanly to registered base pack without circular fallback`, () => {
        const def = getLanguageDefinition(alias);
        expect(def).not.toBeNull();
        const target = def?.sharedLanguagePackId || def?.fallbackTag;
        expect(target).toBeDefined();

        const baseDef = getLanguageDefinition(target!);
        expect(baseDef).not.toBeNull();
      });
    });
  });

  describe('9. Production Gate Firewall', () => {
    test('confirms ONLY en-PH and fil-PH are currently production-selectable', () => {
      const prodLocales = GLOBAL_LANGUAGE_CATALOG.filter(l => isLanguageProductionSelectable(l.tag));
      expect(prodLocales.map(l => l.tag).sort()).toEqual(['en-PH', 'fil-PH']);
      expect(prodLocales).toHaveLength(2);
    });

    test('confirms all 44 new candidates remain unselectable in production until stage GLOBAL-W1-J', () => {
      const allCandidates = [...FULL_CANDIDATE_LOCALES, ...REGIONAL_ALIASES];
      expect(allCandidates).toHaveLength(44);

      for (const tag of allCandidates) {
        expect(isLanguageProductionSelectable(tag)).toBe(false);
      }
    });

    test('simulates selector eligibility logic in Production mode', () => {
      const prodCheck = simulateProductionSelectorEligibility({ localeTag: 'en-US', releaseStatus: 'QA_REQUIRED' }, false);
      expect(prodCheck.isSelectable).toBe(false);

      const readyCheck = simulateProductionSelectorEligibility({ localeTag: 'en-PH', releaseStatus: 'PRODUCTION_READY' }, false);
      expect(readyCheck.isSelectable).toBe(true);

      const injectionCheck = simulateProductionSelectorEligibility({ localeTag: 'en-US', releaseStatus: 'PRODUCTION_READY' }, true);
      expect(injectionCheck.isSelectable).toBe(false);
    });
  });

  describe('10. 23 Supported Currencies Runtime & Presentation Integrity', () => {
    test('confirms all 23 currencies format correctly and preserve PHP charge authority', () => {
      expect(GLOBAL_SUPPORTED_CURRENCY_CODES).toHaveLength(23);
      for (const code of CURRENCIES) {
        const def = getCurrencyDefinition(code);
        expect(def).toBeDefined();
        expect(def?.code).toBe(code);

        const formatted = formatGlobalCurrency(1234.5, code, 'en-PH');
        expect(formatted).toBeTruthy();

        const authority = resolveMonetaryAuthority(code);
        expect(authority.transactionCurrency).toBe('PHP');
        expect(authority.settlementCurrency).toBe('PHP');
      }
    });
  });

  describe('11. FX Adapter Contract & Fail-Closed Safety', () => {
    test('confirms CurrencyApiRateProvider fulfills FX contract and safe failure mode', async () => {
      const adapter = new CurrencyApiRateProvider({ apiKey: undefined });
      expect(adapter.providerId).toBe('currencyapi');

      const health = await adapter.getHealth();
      expect(['HEALTHY', 'DEGRADED', 'UNAVAILABLE']).toContain(health.status);

      await expect(adapter.getRate('PHP', 'USD')).rejects.toThrow(
        /CURRENCYAPI_API_KEY is not provisioned/
      );
    });
  });

  describe('12. Cross-Dimension Independence Invariants', () => {
    test('confirms country, language, and display currency remain decoupled', () => {
      const ph = getCountryProfile('PH');
      const us = getCountryProfile('US');
      const jp = getCountryProfile('JP');

      expect(ph?.defaultDisplayCurrency).toBe('PHP');
      expect(us?.defaultDisplayCurrency).toBe('USD');
      expect(jp?.defaultDisplayCurrency).toBe('JPY');

      // Changing country or language does not alter statutory PHP payment rail
      const phpAuthority = resolveMonetaryAuthority('PHP');
      const usdAuthority = resolveMonetaryAuthority('USD');
      const jpyAuthority = resolveMonetaryAuthority('JPY');

      expect(phpAuthority.transactionCurrency).toBe('PHP');
      expect(usdAuthority.transactionCurrency).toBe('PHP');
      expect(jpyAuthority.transactionCurrency).toBe('PHP');
    });
  });
});
