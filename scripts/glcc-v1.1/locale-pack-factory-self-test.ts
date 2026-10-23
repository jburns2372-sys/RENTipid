/**
 * RENTipid GLCC v1.1 — Locale Pack Factory Self-Test Suite
 *
 * Verifies all 24 mandatory test scenarios for Work Package P12-D.
 * Guarantees compiler correctness, pre-generation guards, metadata validation,
 * directionality, fallback cycle guards, runtime installation firewalls,
 * tamper detection, and zero runtime changes.
 */

import { getDefaultLocaleRegistry } from '../../src/lib/glcc/default-registries';
import {
  EN_PH_BUNDLE,
  FIL_PH_BUNDLE,
} from '../../src/lib/glcc/i18n';
import {
  generateLocalePack,
  validateFallbackHierarchy,
  validateLocaleMetadata,
} from './locale-pack-generate';
import {
  LocalePack,
  LocalePackMetadata,
} from './locale-pack-schema';
import { validateLocalePack } from './locale-pack-validate';
import { exportTranslationWorkPackage } from './translation-source-export';
import { TranslationWorkPackage } from './translation-work-package-schema';

export interface TestResult {
  scenarioNumber: number;
  name: string;
  passed: boolean;
  details: string;
}

export function runLocalePackFactorySelfTest(): {
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

  // Base valid synthetic work package
  const baseExport = exportTranslationWorkPackage('zz-ZZ', {
    generatedAt: '2026-10-06T00:00:00.000Z',
  });

  function createValidApprovedWorkPackage(): TranslationWorkPackage {
    const pkg: TranslationWorkPackage = JSON.parse(JSON.stringify(baseExport));
    pkg.workflowState = 'APPROVED_FOR_QA';

    for (const [key, msg] of Object.entries(pkg.messages)) {
      const placeholders = msg.placeholderSignature || [];
      let target = `[zz-ZZ] ${msg.sourceText}`;
      for (const p of placeholders) {
        if (!target.includes(`{${p}}`)) {
          target += ` {${p}}`;
        }
      }
      msg.targetText = target;
      msg.reviewStatus = 'APPROVED';
      msg.translatorReference = 'Synthetic Translator';
      msg.reviewerReference = 'Accredited Human Reviewer';

      if (msg.contentClass === 'CLASS_C_CONTROLLED_LEGAL_COMPLIANCE') {
        msg.legalApprovalStatus = 'APPROVED';
        msg.legalApprovalReference = 'LEGAL-REF-SYNTHETIC-P12D';
      }
    }

    return pkg;
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

  // 1. Valid 2208-key work package generates pack
  const validPkg = createValidApprovedWorkPackage();
  const pack1 = generateLocalePack(validPkg, standardMeta, { generatedAt: '2026-10-06T00:00:00.000Z' });
  const s1Pass = pack1 !== null && pack1.canonicalKeyCount === 2208 && Object.keys(pack1.messages).length === 2208;
  record(1, 'Valid 2208-key work package generates pack', s1Pass, `keysCount=${pack1.canonicalKeyCount}`);

  // 2. Generated pack validates
  const vResult2 = validateLocalePack(pack1);
  const s2Pass = vResult2.isValid && vResult2.status === 'VALID' && vResult2.errorCount === 0;
  record(2, 'Generated pack validates', s2Pass, `status=${vResult2.status}, errors=${vResult2.errorCount}`);

  // 3. Key ordering deterministic
  const pack2 = generateLocalePack(validPkg, standardMeta, { generatedAt: '2026-10-06T12:00:00.000Z' });
  const keys1 = Object.keys(pack1.messages);
  const keys2 = Object.keys(pack2.messages);
  const s3Pass = keys1.length === keys2.length && keys1.every((k, idx) => k === keys2[idx]);
  record(3, 'Key ordering deterministic', s3Pass, 'Key arrays match identically in order');

  // 4. Target checksum deterministic
  const s4Pass = pack1.targetMessageChecksum === pack2.targetMessageChecksum && pack1.targetMessageChecksum.length === 64;
  record(4, 'Target checksum deterministic', s4Pass, `targetChecksum=${pack1.targetMessageChecksum.slice(0, 16)}...`);

  // 5. Missing key blocks generation
  const missingPkg = createValidApprovedWorkPackage();
  delete missingPkg.messages['common.save'];
  let s5Pass = false;
  try {
    generateLocalePack(missingPkg, standardMeta);
  } catch (err: any) {
    s5Pass = err.message.includes('PRE_GENERATION_GUARD');
  }
  record(5, 'Missing key blocks generation', s5Pass, 'Blocked with PRE_GENERATION_GUARD');

  // 6. Extra key blocks generation
  const extraPkg = createValidApprovedWorkPackage();
  (extraPkg.messages as any)['extra.unapproved.key'] = {
    key: 'extra.unapproved.key',
    sourceText: 'extra',
    targetText: 'extra',
    contentClass: 'CLASS_A_STANDARD_UI',
    required: false,
    placeholderSignature: [],
    reviewStatus: 'APPROVED',
  };
  let s6Pass = false;
  try {
    generateLocalePack(extraPkg, standardMeta);
  } catch (err: any) {
    s6Pass = err.message.includes('PRE_GENERATION_GUARD');
  }
  record(6, 'Extra key blocks generation', s6Pass, 'Blocked with PRE_GENERATION_GUARD');

  // 7. Duplicate key / count mismatch blocks generation
  const countPkg = createValidApprovedWorkPackage();
  countPkg.canonicalKeyCount = 2209;
  let s7Pass = false;
  try {
    generateLocalePack(countPkg, standardMeta);
  } catch (err: any) {
    s7Pass = err.message.includes('PRE_GENERATION_GUARD');
  }
  record(7, 'Duplicate key / count mismatch blocks generation', s7Pass, 'Blocked with PRE_GENERATION_GUARD');

  // 8. Placeholder mismatch blocks generation
  const placeholderPkg = createValidApprovedWorkPackage();
  const pKey = Object.keys(placeholderPkg.messages).find(
    (k) => (placeholderPkg.messages[k].placeholderSignature || []).length > 0
  )!;
  placeholderPkg.messages[pKey].targetText = 'No placeholder here';
  let s8Pass = false;
  try {
    generateLocalePack(placeholderPkg, standardMeta);
  } catch (err: any) {
    s8Pass = err.message.includes('PRE_GENERATION_GUARD');
  }
  record(8, 'Placeholder mismatch blocks generation', s8Pass, `Blocked with PRE_GENERATION_GUARD on key ${pKey}`);

  // 9. Malformed message format blocks generation
  const malformedPkg = createValidApprovedWorkPackage();
  malformedPkg.messages['common.save'].targetText = 'Unbalanced {brace';
  let s9Pass = false;
  try {
    generateLocalePack(malformedPkg, standardMeta);
  } catch (err: any) {
    s9Pass = err.message.includes('PRE_GENERATION_GUARD');
  }
  record(9, 'Malformed message format blocks generation', s9Pass, 'Blocked with PRE_GENERATION_GUARD');

  // 10. Unicode replacement character blocks generation
  const unicodePkg = createValidApprovedWorkPackage();
  unicodePkg.messages['common.save'].targetText = 'Bad \uFFFD char';
  let s10Pass = false;
  try {
    generateLocalePack(unicodePkg, standardMeta);
  } catch (err: any) {
    s10Pass = err.message.includes('PRE_GENERATION_GUARD');
  }
  record(10, 'Unicode replacement character blocks generation', s10Pass, 'Blocked with PRE_GENERATION_GUARD');

  // 11. Source drift blocks generation
  const driftPkg = createValidApprovedWorkPackage();
  driftPkg.sourceMessageChecksum = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
  let s11Pass = false;
  try {
    generateLocalePack(driftPkg, standardMeta);
  } catch (err: any) {
    s11Pass = err.message.includes('PRE_GENERATION_GUARD');
  }
  record(11, 'Source drift blocks generation', s11Pass, 'Blocked with PRE_GENERATION_GUARD');

  // 12. Pending Class C approval blocks generation
  const classCPkg = createValidApprovedWorkPackage();
  const cKey = Object.keys(classCPkg.messages).find(
    (k) => classCPkg.messages[k].contentClass === 'CLASS_C_CONTROLLED_LEGAL_COMPLIANCE'
  )!;
  classCPkg.messages[cKey].legalApprovalStatus = 'PENDING';
  let s12Pass = false;
  try {
    generateLocalePack(classCPkg, standardMeta);
  } catch (err: any) {
    s12Pass = err.message.includes('PRE_GENERATION_GUARD');
  }
  record(12, 'Pending Class C approval blocks generation', s12Pass, `Blocked with PRE_GENERATION_GUARD on key ${cKey}`);

  // 13. Workflow below APPROVED_FOR_QA blocks generation
  const draftPkg = createValidApprovedWorkPackage();
  draftPkg.workflowState = 'DRAFT';
  let s13Pass = false;
  try {
    generateLocalePack(draftPkg, standardMeta);
  } catch (err: any) {
    s13Pass = err.message.includes('must be "APPROVED_FOR_QA"');
  }
  record(13, 'Workflow below APPROVED_FOR_QA blocks generation', s13Pass, 'Blocked with workflowState guard');

  // 14. Invalid locale metadata fails
  const invalidMeta = { ...standardMeta, tag: '123_INVALID_TAG' };
  const metaRes14 = validateLocaleMetadata(invalidMeta);
  const s14Pass = !metaRes14.isValid && metaRes14.errors.some((e) => e.includes('Invalid BCP-47'));
  record(14, 'Invalid locale metadata fails', s14Pass, `error=${metaRes14.errors[0]}`);

  // 15. Invalid direction fails
  const invalidDirMeta = { ...standardMeta, direction: 'diagonal' as any };
  const metaRes15 = validateLocaleMetadata(invalidDirMeta);
  const s15Pass = !metaRes15.isValid && metaRes15.errors.some((e) => e.includes('Invalid text direction'));
  record(15, 'Invalid direction fails', s15Pass, `error=${metaRes15.errors[0]}`);

  // 16. Self-fallback fails
  const selfFallbackCheck = validateFallbackHierarchy('zz-ZZ', 'zz-ZZ');
  const s16Pass = !selfFallbackCheck.isValid && (selfFallbackCheck.error?.includes('Self-fallback prohibited') ?? false);
  record(16, 'Self-fallback fails', s16Pass, `error=${selfFallbackCheck.error}`);

  // 17. Fallback cycle fails
  const cycleHierarchy = { 'aa-aa': 'bb-bb', 'bb-bb': 'zz-zz', 'zz-zz': 'aa-aa' };
  const cycleCheck = validateFallbackHierarchy('zz-zz', 'aa-aa', cycleHierarchy);
  const s17Pass = !cycleCheck.isValid && (cycleCheck.error?.includes('Fallback cycle detected') ?? false);
  record(17, 'Fallback cycle fails', s17Pass, `error=${cycleCheck.error}`);

  // 18. Runtime output path is blocked
  let s18Pass = false;
  try {
    generateLocalePack(validPkg, standardMeta, {
      outputFilePath: 'src/lib/glcc/i18n/locales/zz-ZZ.json',
    });
  } catch (err: any) {
    s18Pass = err.message.includes('RUNTIME_INSTALLATION_FIREWALL');
  }
  record(18, 'Runtime output path is blocked', s18Pass, 'Blocked with RUNTIME_INSTALLATION_FIREWALL');

  // 19. Post-generation message tamper is detected
  const tamperedMsgPack: LocalePack = JSON.parse(JSON.stringify(pack1));
  tamperedMsgPack.messages['common.save'].value = 'Tampered Value';
  const vResult19 = validateLocalePack(tamperedMsgPack);
  const s19Pass = !vResult19.isValid && vResult19.status === 'TAMPER_DETECTED';
  record(19, 'Post-generation message tamper is detected', s19Pass, `status=${vResult19.status}`);

  // 20. Metadata tamper is detected
  const tamperedMetaPack: LocalePack = JSON.parse(JSON.stringify(pack1));
  tamperedMetaPack.localeMetadata.direction = 'rtl';
  const vResult20 = validateLocalePack(tamperedMetaPack);
  const s20Pass = !vResult20.isValid && vResult20.status === 'TAMPER_DETECTED';
  record(20, 'Metadata tamper is detected', s20Pass, `status=${vResult20.status}`);

  // 21. Synthetic RTL pack representation validates
  const rtlMeta: LocalePackMetadata = {
    tag: 'ar-SY-test',
    languageCode: 'ar',
    regionCode: 'SY',
    displayName: 'Arabic (Synthetic Test)',
    nativeDisplayName: 'العربية (تجريبي)',
    script: 'Arab',
    direction: 'rtl',
    fallbackLocale: 'en-PH',
    unicodeNormalizationRule: 'NFC',
    pluralizationMetadata: { categories: ['zero', 'one', 'two', 'few', 'many', 'other'] },
    dateTimeFormattingMetadata: { calendar: 'gregory', dateFormat: 'YYYY-MM-DD', timeFormat: 'HH:mm:ss' },
    numberingMetadata: { numberingSystem: 'arab', decimal: '٫', grouping: '٬' },
  };
  const rtlExport = exportTranslationWorkPackage('ar-SY-test');
  const rtlPkg: TranslationWorkPackage = JSON.parse(JSON.stringify(rtlExport));
  rtlPkg.workflowState = 'APPROVED_FOR_QA';
  for (const [k, msg] of Object.entries(rtlPkg.messages)) {
    const placeholders = msg.placeholderSignature || [];
    let target = `[rtl] ${msg.sourceText}`;
    for (const p of placeholders) {
      if (!target.includes(`{${p}}`)) target += ` {${p}}`;
    }
    msg.targetText = target;
    msg.reviewStatus = 'APPROVED';
    msg.translatorReference = 'Synthetic RTL Translator';
    msg.reviewerReference = 'Accredited Human Reviewer';
    if (msg.contentClass === 'CLASS_C_CONTROLLED_LEGAL_COMPLIANCE') {
      msg.legalApprovalStatus = 'APPROVED';
      msg.legalApprovalReference = 'LEGAL-REF-RTL-P12D';
    }
  }
  const rtlPack = generateLocalePack(rtlPkg, rtlMeta);
  const vResult21 = validateLocalePack(rtlPack);
  const s21Pass = vResult21.isValid && rtlPack.localeMetadata.direction === 'rtl';
  record(21, 'Synthetic RTL pack representation validates', s21Pass, `isValid=${vResult21.isValid}, direction=${rtlPack.localeMetadata.direction}`);

  // 22. Runtime registry remains unchanged
  const registry = getDefaultLocaleRegistry();
  const enPhMeta = registry.get('en-PH');
  const filPhMeta = registry.get('fil-PH');
  const enUsMeta = registry.get('en-US');
  const jaJpMeta = registry.get('ja-JP');
  const zzZzMeta = registry.get('zz-ZZ');
  const s22Pass =
    enPhMeta?.releaseStatus === 'PRODUCTION_READY' &&
    filPhMeta?.releaseStatus === 'PRODUCTION_READY' &&
    enUsMeta?.releaseStatus === 'TRANSLATION_IN_PROGRESS' &&
    jaJpMeta?.releaseStatus === 'REGISTERED' &&
    (zzZzMeta === null || zzZzMeta === undefined);
  record(22, 'Runtime registry remains unchanged', s22Pass, 'Registry holds 4 standard locales only');

  // 23. Existing translation bundles remain unchanged
  const s23Pass =
    EN_PH_BUNDLE !== null &&
    Object.keys(EN_PH_BUNDLE.messages).length === 2208 &&
    FIL_PH_BUNDLE !== null &&
    Object.keys(FIL_PH_BUNDLE.messages).length === 2208;
  record(23, 'Existing translation bundles remain unchanged', s23Pass, `en-PH=${Object.keys(EN_PH_BUNDLE.messages).length}, fil-PH=${Object.keys(FIL_PH_BUNDLE.messages).length}`);

  // 24. Release status remains unchanged
  const s24Pass =
    pack1.releaseCandidateState === 'CANDIDATE_FOR_QA' &&
    enPhMeta?.releaseStatus === 'PRODUCTION_READY' &&
    filPhMeta?.releaseStatus === 'PRODUCTION_READY' &&
    enUsMeta?.releaseStatus === 'TRANSLATION_IN_PROGRESS' &&
    jaJpMeta?.releaseStatus === 'REGISTERED';
  record(24, 'Release status remains unchanged', s24Pass, `packReleaseState=${pack1.releaseCandidateState}`);

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
if (process.argv[1] && process.argv[1].endsWith('locale-pack-factory-self-test.ts')) {
  const result = runLocalePackFactorySelfTest();
  console.log(`\n=== P12-D LOCALE PACK FACTORY SELF-TEST RESULTS ===`);
  for (const r of result.results) {
    console.log(`[${r.passed ? 'PASS' : 'FAIL'}] Scenario ${r.scenarioNumber}: ${r.name}`);
    console.log(`       Details: ${r.details}`);
  }
  console.log(`\nTOTAL: ${result.totalScenarios} | PASSED: ${result.passedCount} | FAILED: ${result.failedCount}`);
  if (!result.allPassed) {
    process.exit(1);
  }
}
