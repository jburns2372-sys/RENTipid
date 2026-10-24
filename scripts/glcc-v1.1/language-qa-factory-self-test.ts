/**
 * RENTipid GLCC v1.1 — Language QA Factory Self-Test Suite
 *
 * Verifies all 28 mandatory test scenarios for Work Package P12-E:
 * - QA Plan generation and dynamic domain requirements (RTL vs LTR)
 * - Zero-tolerance metric enforcement (raw keys, fallbacks, hydration, security)
 * - Checksum matching and scenario count consistency
 * - Mode-aware selector eligibility boundaries (fail-closed)
 * - Baseline non-regression requirements (en-PH, fil-PH)
 * - Zero runtime modifications
 */

import { getDefaultLocaleRegistry } from '../../src/lib/glcc/default-registries';
import {
  EN_PH_BUNDLE,
  FIL_PH_BUNDLE,
} from '../../src/lib/glcc/i18n';
import { isLocaleEligibleForMode } from '../../src/lib/glcc/locale-resolver';
import {
  generateLocalePack,
} from './locale-pack-generate';
import {
  LocalePack,
  LocalePackMetadata,
} from './locale-pack-schema';
import { generateLanguageQaPlan } from './language-qa-plan';
import {
  LanguageQaPlan,
  LanguageQaResult,
} from './language-qa-schema';
import { validateLanguageQaResult } from './language-qa-validate';
import { exportTranslationWorkPackage } from './translation-source-export';
import { TranslationWorkPackage } from './translation-work-package-schema';

export interface TestResult {
  scenarioNumber: number;
  name: string;
  passed: boolean;
  details: string;
}

export function runLanguageQaFactorySelfTest(): {
  allPassed: boolean;
  totalScenarios: number;
  passedCount: number;
  failedCount: number;
  results: TestResult[];
} {
  const results: TestResult[] = [];

  function record(num: number, name: string, passed: boolean, details: string) {
    results.push({ scenarioNumber: num, name, passed, details });
  }

  // 1. Build synthetic LTR candidate pack (zz-ZZ)
  const baseExport = exportTranslationWorkPackage('zz-ZZ');
  const validPkg: TranslationWorkPackage = JSON.parse(JSON.stringify(baseExport));
  validPkg.workflowState = 'APPROVED_FOR_QA';

  for (const [k, msg] of Object.entries(validPkg.messages)) {
    const placeholders = msg.placeholderSignature || [];
    let target = `[zz-ZZ] ${msg.sourceText}`;
    for (const p of placeholders) {
      if (!target.includes(`{${p}}`)) target += ` {${p}}`;
    }
    msg.targetText = target;
    msg.reviewStatus = 'APPROVED';
    msg.translatorReference = 'Synthetic QA Translator';
    msg.reviewerReference = 'Accredited Human Reviewer';
    if (msg.contentClass === 'CLASS_C_CONTROLLED_LEGAL_COMPLIANCE') {
      msg.legalApprovalStatus = 'APPROVED';
      msg.legalApprovalReference = 'LEGAL-REF-QA-P12E';
    }
  }

  const standardMeta: LocalePackMetadata = {
    tag: 'zz-ZZ',
    languageCode: 'zz',
    regionCode: 'ZZ',
    displayName: 'Synthetic Language',
    nativeDisplayName: 'Synthetic Endonym',
    script: 'Latn',
    direction: 'ltr',
    fallbackLocale: 'en-PH',
    unicodeNormalizationRule: 'NFC',
    pluralizationMetadata: { categories: ['one', 'other'] },
    dateTimeFormattingMetadata: { calendar: 'gregory', dateFormat: 'YYYY-MM-DD', timeFormat: 'HH:mm:ss' },
    numberingMetadata: { numberingSystem: 'latn', decimal: '.', grouping: ',' },
  };

  const ltrPack = generateLocalePack(validPkg, standardMeta);

  // 1. Valid candidate generates QA plan
  const plan1 = generateLanguageQaPlan(ltrPack);
  const s1Pass = plan1 !== null && plan1.localeTag === 'zz-ZZ';
  record(1, 'Valid candidate generates QA plan', s1Pass, `planTag=${plan1.localeTag}`);

  // 2. Plan contains required domains
  const s2Pass = plan1.requiredDomains.length === 23 && plan1.optionalDomains.length === 1;
  record(2, 'Plan contains required domains', s2Pass, `requiredDomainsCount=${plan1.requiredDomains.length}`);

  // 3. Locale-pack checksum retained
  const s3Pass = plan1.localePackChecksum === ltrPack.packChecksum;
  record(3, 'Locale-pack checksum retained', s3Pass, `checksum=${plan1.localePackChecksum.slice(0, 16)}...`);

  // 4. Applicable directionality domain selected
  const s4Pass = plan1.optionalDomains.includes('QA-23') && !plan1.requiredDomains.includes('QA-23');
  record(4, 'Applicable directionality domain selected', s4Pass, 'QA-23 is optional for LTR pack');

  // Helper to create a valid complete QA Result
  function createValidQaResult(plan: LanguageQaPlan): LanguageQaResult {
    const domainResults: Record<string, any> = {};
    let totalScenarios = 0;

    for (const [id, d] of Object.entries(plan.domains)) {
      const isReq = d.required;
      const count = isReq ? 5 : 0;
      totalScenarios += count;

      domainResults[id] = {
        domainId: id,
        name: d.name,
        status: isReq ? 'PASS' : 'NOT_RUN',
        scenarioCount: count,
        passedCount: count,
        failedCount: 0,
        blockedCount: 0,
        evidenceReferences: [`EVIDENCE-${id}-OK`],
        notes: 'Passed automated validation test suite',
      };
    }

    return {
      qaResultVersion: '1.1.0',
      localeTag: plan.localeTag,
      localePackChecksum: plan.localePackChecksum,
      executionEnvironment: plan.executionEnvironment,
      overallStatus: 'PASS',
      startedAt: '2026-10-06T00:00:00.000Z',
      completedAt: '2026-10-06T00:05:00.000Z',
      summary: {
        totalDomains: Object.keys(plan.domains).length,
        passedDomains: plan.requiredDomains.length,
        failedDomains: 0,
        blockedDomains: 0,
        totalScenarios,
        passedScenarios: totalScenarios,
        failedScenarios: 0,
      },
      metrics: {
        rawKeyCount: 0,
        requiredFallbackCount: 0,
        hydrationWarningCount: 0,
        visibleSourceLanguageFlashCount: 0,
        placeholderMismatchCount: 0,
        securityBoundaryFailures: 0,
        financialBoundaryFailures: 0,
        authorityBoundaryFailures: 0,
      },
      domainResults,
      errors: [],
      warnings: [],
    };
  }

  // 5. Valid complete QA result passes
  const validRes = createValidQaResult(plan1);
  const vResult5 = validateLanguageQaResult(validRes, plan1);
  const s5Pass = vResult5.isValid && vResult5.status === 'PASS';
  record(5, 'Valid complete QA result passes', s5Pass, `status=${vResult5.status}, errors=${vResult5.errorCount}`);

  // 6. Required domain failure fails
  const failedDomainRes = createValidQaResult(plan1);
  failedDomainRes.domainResults['QA-01'].status = 'FAIL';
  failedDomainRes.domainResults['QA-01'].failedCount = 1;
  failedDomainRes.domainResults['QA-01'].passedCount = 4;
  failedDomainRes.summary.failedScenarios = 1;
  failedDomainRes.summary.passedScenarios = failedDomainRes.summary.totalScenarios - 1;
  const vResult6 = validateLanguageQaResult(failedDomainRes, plan1);
  const s6Pass = !vResult6.isValid && vResult6.errors.some((e) => e.includes('REQUIRED_DOMAIN_FAILED'));
  record(6, 'Required domain failure fails', s6Pass, 'Detected REQUIRED_DOMAIN_FAILED for QA-01');

  // 7. Required domain blocked fails
  const blockedDomainRes = createValidQaResult(plan1);
  blockedDomainRes.domainResults['QA-04'].status = 'BLOCKED';
  blockedDomainRes.domainResults['QA-04'].blockedCount = 1;
  blockedDomainRes.domainResults['QA-04'].passedCount = 4;
  const vResult7 = validateLanguageQaResult(blockedDomainRes, plan1);
  const s7Pass = !vResult7.isValid && vResult7.errors.some((e) => e.includes('REQUIRED_DOMAIN_BLOCKED'));
  record(7, 'Required domain blocked fails', s7Pass, 'Detected REQUIRED_DOMAIN_BLOCKED for QA-04');

  // 8. Raw key > 0 fails
  const rawKeyRes = createValidQaResult(plan1);
  rawKeyRes.metrics.rawKeyCount = 1;
  const vResult8 = validateLanguageQaResult(rawKeyRes, plan1);
  const s8Pass = !vResult8.isValid && vResult8.errors.some((e) => e.includes('Raw key render count must be 0'));
  record(8, 'Raw key > 0 fails', s8Pass, 'Blocked with METRIC_VIOLATION on raw keys');

  // 9. Required fallback > 0 fails
  const fallbackRes = createValidQaResult(plan1);
  fallbackRes.metrics.requiredFallbackCount = 2;
  const vResult9 = validateLanguageQaResult(fallbackRes, plan1);
  const s9Pass = !vResult9.isValid && vResult9.errors.some((e) => e.includes('Required fallback count must be 0'));
  record(9, 'Required fallback > 0 fails', s9Pass, 'Blocked with METRIC_VIOLATION on fallback count');

  // 10. Hydration warning > 0 fails
  const hydrationRes = createValidQaResult(plan1);
  hydrationRes.metrics.hydrationWarningCount = 1;
  const vResult10 = validateLanguageQaResult(hydrationRes, plan1);
  const s10Pass = !vResult10.isValid && vResult10.errors.some((e) => e.includes('Hydration warning count must be 0'));
  record(10, 'Hydration warning > 0 fails', s10Pass, 'Blocked with METRIC_VIOLATION on hydration');

  // 11. Visible source-language flash > 0 fails
  const flashRes = createValidQaResult(plan1);
  flashRes.metrics.visibleSourceLanguageFlashCount = 1;
  const vResult11 = validateLanguageQaResult(flashRes, plan1);
  const s11Pass = !vResult11.isValid && vResult11.errors.some((e) => e.includes('Visible source language flash count must be 0'));
  record(11, 'Visible source-language flash > 0 fails', s11Pass, 'Blocked with METRIC_VIOLATION on FOUC');

  // 12. Security boundary failure fails
  const secRes = createValidQaResult(plan1);
  secRes.metrics.securityBoundaryFailures = 1;
  const vResult12 = validateLanguageQaResult(secRes, plan1);
  const s12Pass = !vResult12.isValid && vResult12.errors.some((e) => e.includes('Security boundary failures must be 0'));
  record(12, 'Security boundary failure fails', s12Pass, 'Blocked with SECURITY_VIOLATION');

  // 13. Financial boundary failure fails
  const finRes = createValidQaResult(plan1);
  finRes.metrics.financialBoundaryFailures = 1;
  const vResult13 = validateLanguageQaResult(finRes, plan1);
  const s13Pass = !vResult13.isValid && vResult13.errors.some((e) => e.includes('Financial boundary failures must be 0'));
  record(13, 'Financial boundary failure fails', s13Pass, 'Blocked with FINANCIAL_VIOLATION');

  // 14. Authority boundary failure fails
  const authRes = createValidQaResult(plan1);
  authRes.metrics.authorityBoundaryFailures = 1;
  const vResult14 = validateLanguageQaResult(authRes, plan1);
  const s14Pass = !vResult14.isValid && vResult14.errors.some((e) => e.includes('Authority boundary failures must be 0'));
  record(14, 'Authority boundary failure fails', s14Pass, 'Blocked with AUTHORITY_VIOLATION');

  // 15. Missing Class C approval fails (represented by QA-20 failure)
  const classCFailRes = createValidQaResult(plan1);
  classCFailRes.domainResults['QA-20'].status = 'FAIL';
  classCFailRes.domainResults['QA-20'].failedCount = 1;
  classCFailRes.domainResults['QA-20'].passedCount = 4;
  classCFailRes.summary.failedScenarios = 1;
  classCFailRes.summary.passedScenarios = classCFailRes.summary.totalScenarios - 1;
  const vResult15 = validateLanguageQaResult(classCFailRes, plan1);
  const s15Pass = !vResult15.isValid && vResult15.errors.some((e) => e.includes('REQUIRED_DOMAIN_FAILED: Required domain "QA-20"'));
  record(15, 'Missing Class C approval fails', s15Pass, 'Detected QA-20 failure');

  // 16. Locale-pack checksum mismatch fails
  const checksumMismatchRes = createValidQaResult(plan1);
  checksumMismatchRes.localePackChecksum = 'tampered_pack_checksum_value';
  const vResult16 = validateLanguageQaResult(checksumMismatchRes, plan1);
  const s16Pass = !vResult16.isValid && vResult16.errors.some((e) => e.includes('CHECKSUM_MISMATCH'));
  record(16, 'Locale-pack checksum mismatch fails', s16Pass, 'Detected CHECKSUM_MISMATCH');

  // 17. Inconsistent scenario totals fail
  const inconsistentRes = createValidQaResult(plan1);
  inconsistentRes.summary.totalScenarios = 999; // mismatch
  const vResult17 = validateLanguageQaResult(inconsistentRes, plan1);
  const s17Pass = !vResult17.isValid && vResult17.errors.some((e) => e.includes('SUMMARY_INCONSISTENCY'));
  record(17, 'Inconsistent scenario totals fail', s17Pass, 'Detected SUMMARY_INCONSISTENCY');

  // 18. REGISTERED eligibility simulation blocked
  const registeredMeta = { tag: 'mock-reg', releaseStatus: 'REGISTERED', enabled: true } as any;
  const s18Pass =
    !isLocaleEligibleForMode(registeredMeta, 'PRODUCTION') &&
    !isLocaleEligibleForMode(registeredMeta, 'QA');
  record(18, 'REGISTERED eligibility simulation blocked', s18Pass, 'REGISTERED rejected in Prod and QA');

  // 19. TRANSLATION_IN_PROGRESS eligibility simulation blocked
  const tipMeta = { tag: 'mock-tip', releaseStatus: 'TRANSLATION_IN_PROGRESS', enabled: true } as any;
  const s19Pass =
    !isLocaleEligibleForMode(tipMeta, 'PRODUCTION') &&
    !isLocaleEligibleForMode(tipMeta, 'QA');
  record(19, 'TRANSLATION_IN_PROGRESS eligibility simulation blocked', s19Pass, 'TRANSLATION_IN_PROGRESS rejected in Prod and QA');

  // 20. Unauthorized Production eligibility fails (QA_REQUIRED only eligible in QA)
  const qaReqMeta = { tag: 'mock-qar', releaseStatus: 'QA_REQUIRED', enabled: true } as any;
  const s20Pass =
    !isLocaleEligibleForMode(qaReqMeta, 'PRODUCTION') &&
    isLocaleEligibleForMode(qaReqMeta, 'QA');
  record(20, 'Unauthorized Production eligibility fails', s20Pass, 'QA_REQUIRED blocked in Production, allowed in QA');

  // 21. RTL candidate includes RTL QA
  const rtlMeta: LocalePackMetadata = {
    tag: 'zz-RT',
    languageCode: 'zz',
    regionCode: 'RT',
    displayName: 'Synthetic RTL',
    nativeDisplayName: 'RTL Endonym',
    script: 'Arab',
    direction: 'rtl',
    fallbackLocale: 'en-PH',
    unicodeNormalizationRule: 'NFC',
    pluralizationMetadata: { categories: ['one', 'other'] },
    dateTimeFormattingMetadata: { calendar: 'gregory', dateFormat: 'YYYY-MM-DD', timeFormat: 'HH:mm:ss' },
    numberingMetadata: { numberingSystem: 'arab', decimal: '٫', grouping: '٬' },
  };
  const rtlPack = generateLocalePack(validPkg, rtlMeta);
  const rtlPlan = generateLanguageQaPlan(rtlPack);
  const s21Pass = rtlPlan.requiredDomains.includes('QA-23');
  record(21, 'RTL candidate includes RTL QA', s21Pass, 'QA-23 required in RTL plan');

  // 22. LTR candidate omits unnecessary RTL QA
  const s22Pass = !plan1.requiredDomains.includes('QA-23') && plan1.optionalDomains.includes('QA-23');
  record(22, 'LTR candidate omits unnecessary RTL QA', s22Pass, 'QA-23 optional in LTR plan');

  // 23. en-PH non-regression domain required
  const s23Pass = plan1.requiredDomains.includes('QA-24');
  record(23, 'en-PH non-regression domain required', s23Pass, 'QA-24 is required');

  // 24. fil-PH non-regression domain required
  const s24Pass = plan1.domains['QA-24'].name.includes('en-PH / fil-PH');
  record(24, 'fil-PH non-regression domain required', s24Pass, 'QA-24 name covers fil-PH');

  // 25. Runtime registry unchanged
  const registry = getDefaultLocaleRegistry();
  const enPhMeta = registry.get('en-PH');
  const filPhMeta = registry.get('fil-PH');
  const enUsMeta = registry.get('en-US');
  const jaJpMeta = registry.get('ja-JP');
  const zzZzMeta = registry.get('zz-ZZ');
  const s25Pass =
    enPhMeta?.releaseStatus === 'PRODUCTION_READY' &&
    filPhMeta?.releaseStatus === 'PRODUCTION_READY' &&
    enUsMeta?.releaseStatus === 'TRANSLATION_IN_PROGRESS' &&
    jaJpMeta?.releaseStatus === 'REGISTERED' &&
    (zzZzMeta === null || zzZzMeta === undefined);
  record(25, 'Runtime registry unchanged', s25Pass, 'Default registry has standard 4 locales only');

  // 26. Existing bundles unchanged
  const s26Pass =
    EN_PH_BUNDLE !== null &&
    Object.keys(EN_PH_BUNDLE.messages).length === 2208 &&
    FIL_PH_BUNDLE !== null &&
    Object.keys(FIL_PH_BUNDLE.messages).length === 2208;
  record(26, 'Existing bundles unchanged', s26Pass, `en-PH=${Object.keys(EN_PH_BUNDLE.messages).length}, fil-PH=${Object.keys(FIL_PH_BUNDLE.messages).length}`);

  // 27. Release statuses unchanged
  const s27Pass =
    enPhMeta?.releaseStatus === 'PRODUCTION_READY' &&
    filPhMeta?.releaseStatus === 'PRODUCTION_READY' &&
    enUsMeta?.releaseStatus === 'TRANSLATION_IN_PROGRESS' &&
    jaJpMeta?.releaseStatus === 'REGISTERED';
  record(27, 'Release statuses unchanged', s27Pass, 'No release statuses modified');

  // 28. No runtime pack installed
  const fs = require('fs');
  const path = require('path');
  const runtimeLocalesDir = path.resolve('src/lib/glcc/i18n/locales');
  const runtimeFiles = fs.readdirSync(runtimeLocalesDir);
  const s28Pass = !runtimeFiles.includes('zz-ZZ.ts') && !runtimeFiles.includes('zz-ZZ.json');
  record(28, 'No runtime pack installed', s28Pass, 'Zero synthetic packs in runtime directories');

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  const allPassed = failedCount === 0;

  return {
    allPassed,
    totalScenarios: results.length,
    passedCount,
    failedCount,
    results,
  };
}

// CLI entry point
if (process.argv[1] && process.argv[1].endsWith('language-qa-factory-self-test.ts')) {
  const result = runLanguageQaFactorySelfTest();
  console.log(`\n=== P12-E LANGUAGE QA FACTORY SELF-TEST RESULTS ===`);
  for (const r of result.results) {
    console.log(`[${r.passed ? 'PASS' : 'FAIL'}] Scenario ${r.scenarioNumber}: ${r.name}`);
    console.log(`       Details: ${r.details}`);
  }
  console.log(`\nTOTAL: ${result.totalScenarios} | PASSED: ${result.passedCount} | FAILED: ${result.failedCount}`);
  if (!result.allPassed) {
    process.exit(1);
  }
}
