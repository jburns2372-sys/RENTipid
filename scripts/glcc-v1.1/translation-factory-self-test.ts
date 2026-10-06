/**
 * RENTipid GLCC v1.1 — Translation Factory Self-Test Suite
 *
 * Verifies all 16 mandatory test scenarios using synthetic test locale `zz-ZZ`.
 * Ensures factory determinism, strict validation, source-drift guards,
 * and confirms zero runtime registry modifications.
 */

import { getDefaultLocaleRegistry } from '../../src/lib/glcc/default-registries';
import {
  exportTranslationWorkPackage,
  classifyKey,
} from './translation-source-export';
import { validateTranslationWorkPackage } from './translation-package-validate';
import {
  TranslationWorkPackage,
  TranslationWorkPackageMessage,
} from './translation-work-package-schema';

export interface TestResult {
  scenarioNumber: number;
  name: string;
  passed: boolean;
  details: string;
}

export function runFactorySelfTest(): {
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

  // Baseline export
  const export1 = exportTranslationWorkPackage('zz-ZZ', { generatedAt: '2026-10-06T00:00:00.000Z' });
  const export2 = exportTranslationWorkPackage('zz-ZZ', { generatedAt: '2026-10-06T12:00:00.000Z' });

  // 1. Export contains exactly 2208 canonical keys
  const keys1 = Object.keys(export1.messages);
  const s1Pass = export1.canonicalKeyCount === 2208 && keys1.length === 2208;
  record(
    1,
    'Export contains exactly 2208 canonical keys',
    s1Pass,
    `canonicalKeyCount=${export1.canonicalKeyCount}, messageKeysLength=${keys1.length}`
  );

  // 2. Deterministic key ordering
  const keys2 = Object.keys(export2.messages);
  const s2Pass =
    keys1.length === keys2.length &&
    keys1.every((k, idx) => k === keys2[idx]);
  record(2, 'Deterministic key ordering', s2Pass, 'Key arrays match identically in sequence');

  // 3. Deterministic source checksums
  const s3Pass =
    export1.canonicalKeyChecksum === export2.canonicalKeyChecksum &&
    export1.sourceMessageChecksum === export2.sourceMessageChecksum;
  record(
    3,
    'Deterministic source checksums',
    s3Pass,
    `keyChecksum=${export1.canonicalKeyChecksum.slice(0, 16)}..., msgChecksum=${export1.sourceMessageChecksum.slice(0, 16)}...`
  );

  // Helper: Create a fully translated synthetic package for zz-ZZ
  function createSyntheticValidPackage(): TranslationWorkPackage {
    const pkg: TranslationWorkPackage = JSON.parse(JSON.stringify(export1));
    pkg.workflowState = 'APPROVED_FOR_QA';

    for (const [key, msg] of Object.entries(pkg.messages)) {
      const placeholders = msg.placeholderSignature || [];
      // Generate synthetic target string containing all required placeholders
      let target = `[zz-ZZ] ${msg.sourceText}`;
      // ensure placeholders remain intact
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
        msg.legalApprovalReference = 'LEGAL-SYNTHETIC-REF-001';
      }
    }

    return pkg;
  }

  // 4. Complete synthetic valid package passes structural validation
  const validPkg = createSyntheticValidPackage();
  const vResult4 = validateTranslationWorkPackage(validPkg);
  const s4Pass = vResult4.isValid && vResult4.status === 'VALID' && vResult4.errorCount === 0;
  record(
    4,
    'Complete synthetic valid package passes structural validation',
    s4Pass,
    `status=${vResult4.status}, errorCount=${vResult4.errorCount}, translatedCount=${vResult4.translatedRequiredCount}`
  );

  // 5. Missing key fails
  const missingPkg = createSyntheticValidPackage();
  delete missingPkg.messages['common.save'];
  const vResult5 = validateTranslationWorkPackage(missingPkg);
  const s5Pass = !vResult5.isValid && vResult5.errors.some((e) => e.includes('Missing 1 canonical keys'));
  record(5, 'Missing key fails', s5Pass, `isValid=${vResult5.isValid}, errors=${vResult5.errors[0]}`);

  // 6. Extra key fails
  const extraPkg = createSyntheticValidPackage();
  (extraPkg.messages as any)['unauthorized.extra.key'] = {
    key: 'unauthorized.extra.key',
    sourceText: 'extra',
    targetText: 'extra',
    contentClass: 'CLASS_A_STANDARD_UI',
    required: false,
    placeholderSignature: [],
    reviewStatus: 'APPROVED',
  };
  const vResult6 = validateTranslationWorkPackage(extraPkg);
  const s6Pass = !vResult6.isValid && vResult6.extraKeyCount === 1;
  record(6, 'Extra key fails', s6Pass, `isValid=${vResult6.isValid}, extraKeyCount=${vResult6.extraKeyCount}`);

  // 7. Duplicate key fails (checked via count mismatch if duplicate added to array or count manipulated)
  const dupPkg = createSyntheticValidPackage();
  dupPkg.canonicalKeyCount = 2209; // simulate duplicate key count inconsistency
  const vResult7 = validateTranslationWorkPackage(dupPkg);
  const s7Pass = !vResult7.isValid && vResult7.errors.some((e) => e.includes('count mismatch'));
  record(7, 'Duplicate/count mismatch fails', s7Pass, `isValid=${vResult7.isValid}, error=${vResult7.errors[0]}`);

  // 8. Placeholder removal fails
  const removePlaceholderPkg = createSyntheticValidPackage();
  const keyWithPlaceholder = Object.keys(removePlaceholderPkg.messages).find(
    (k) => (removePlaceholderPkg.messages[k].placeholderSignature || []).length > 0
  )!;
  removePlaceholderPkg.messages[keyWithPlaceholder].targetText = 'Text without any placeholder';
  const vResult8 = validateTranslationWorkPackage(removePlaceholderPkg);
  const s8Pass = !vResult8.isValid && vResult8.placeholderMismatchCount > 0;
  record(
    8,
    'Placeholder removal fails',
    s8Pass,
    `placeholderMismatchCount=${vResult8.placeholderMismatchCount}, key=${keyWithPlaceholder}`
  );

  // 9. Unauthorized placeholder addition fails
  const addPlaceholderPkg = createSyntheticValidPackage();
  const keyWithoutPlaceholder = Object.keys(addPlaceholderPkg.messages).find(
    (k) => (addPlaceholderPkg.messages[k].placeholderSignature || []).length === 0
  )!;
  addPlaceholderPkg.messages[keyWithoutPlaceholder].targetText = 'Text with {unauthorized_variable}';
  const vResult9 = validateTranslationWorkPackage(addPlaceholderPkg);
  const s9Pass = !vResult9.isValid && vResult9.placeholderMismatchCount > 0;
  record(
    9,
    'Unauthorized placeholder addition fails',
    s9Pass,
    `placeholderMismatchCount=${vResult9.placeholderMismatchCount}, key=${keyWithoutPlaceholder}`
  );

  // 10. Malformed message format fails
  const malformedPkg = createSyntheticValidPackage();
  malformedPkg.messages['common.save'].targetText = 'Unbalanced {opening brace';
  const vResult10 = validateTranslationWorkPackage(malformedPkg);
  const s10Pass = !vResult10.isValid && vResult10.formatErrorCount > 0;
  record(10, 'Malformed message format fails', s10Pass, `formatErrorCount=${vResult10.formatErrorCount}`);

  // 11. Invalid Unicode replacement character fails
  const unicodePkg = createSyntheticValidPackage();
  unicodePkg.messages['common.save'].targetText = 'Invalid \uFFFD Character';
  const vResult11 = validateTranslationWorkPackage(unicodePkg);
  const s11Pass = !vResult11.isValid && vResult11.unicodeErrorCount > 0;
  record(11, 'Invalid Unicode replacement character fails', s11Pass, `unicodeErrorCount=${vResult11.unicodeErrorCount}`);

  // 12. Canonical checksum mismatch fails
  const keyChecksumPkg = createSyntheticValidPackage();
  keyChecksumPkg.canonicalKeyChecksum = '0000000000000000000000000000000000000000000000000000000000000000';
  const vResult12 = validateTranslationWorkPackage(keyChecksumPkg);
  const s12Pass = vResult12.hasSourceDrift && vResult12.status === 'SOURCE_DRIFT';
  record(12, 'Canonical checksum mismatch fails', s12Pass, `status=${vResult12.status}, hasSourceDrift=${vResult12.hasSourceDrift}`);

  // 13. Source checksum mismatch returns SOURCE_DRIFT
  const msgChecksumPkg = createSyntheticValidPackage();
  msgChecksumPkg.sourceMessageChecksum = '1111111111111111111111111111111111111111111111111111111111111111';
  const vResult13 = validateTranslationWorkPackage(msgChecksumPkg);
  const s13Pass = vResult13.hasSourceDrift && vResult13.status === 'SOURCE_DRIFT';
  record(13, 'Source checksum mismatch returns SOURCE_DRIFT', s13Pass, `status=${vResult13.status}, hasSourceDrift=${vResult13.hasSourceDrift}`);

  // 14. Incomplete controlled Class C approval fails
  const classCPkg = createSyntheticValidPackage();
  const classCKey = Object.keys(classCPkg.messages).find(
    (k) => classCPkg.messages[k].contentClass === 'CLASS_C_CONTROLLED_LEGAL_COMPLIANCE'
  )!;
  classCPkg.messages[classCKey].legalApprovalStatus = 'PENDING';
  const vResult14 = validateTranslationWorkPackage(classCPkg);
  const s14Pass = !vResult14.isValid && vResult14.controlledContentPendingCount > 0;
  record(
    14,
    'Incomplete controlled Class C approval fails',
    s14Pass,
    `controlledContentPendingCount=${vResult14.controlledContentPendingCount}, key=${classCKey}`
  );

  // 15. AI/DRAFT package cannot become authoritative legal content
  const aiPkg = createSyntheticValidPackage();
  aiPkg.messages[classCKey].isAiDraft = true;
  aiPkg.messages[classCKey].reviewerReference = 'AI Assistant Automated Review';
  aiPkg.messages[classCKey].legalApprovalStatus = 'APPROVED';
  const vResult15 = validateTranslationWorkPackage(aiPkg);
  const s15Pass = !vResult15.isValid && vResult15.errors.some((e) => e.includes('AI draft cannot self-approve'));
  record(15, 'AI/DRAFT package cannot become authoritative legal content', s15Pass, `isValid=${vResult15.isValid}, error=${vResult15.errors[0]}`);

  // 16. Runtime locale registry remains unchanged
  const registry = getDefaultLocaleRegistry();
  const enPhMeta = registry.get('en-PH');
  const filPhMeta = registry.get('fil-PH');
  const enUsMeta = registry.get('en-US');
  const jaJpMeta = registry.get('ja-JP');
  const zzZzMeta = registry.get('zz-ZZ');

  const s16Pass =
    enPhMeta?.releaseStatus === 'PRODUCTION_READY' &&
    filPhMeta?.releaseStatus === 'PRODUCTION_READY' &&
    enUsMeta?.releaseStatus === 'TRANSLATION_IN_PROGRESS' &&
    jaJpMeta?.releaseStatus === 'REGISTERED' &&
    (zzZzMeta === null || zzZzMeta === undefined);

  record(
    16,
    'Runtime locale registry remains unchanged',
    s16Pass,
    `en-PH=${enPhMeta?.releaseStatus}, fil-PH=${filPhMeta?.releaseStatus}, en-US=${enUsMeta?.releaseStatus}, ja-JP=${jaJpMeta?.releaseStatus}, zz-ZZ=${zzZzMeta}`
  );

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
if (process.argv[1] && process.argv[1].endsWith('translation-factory-self-test.ts')) {
  const result = runFactorySelfTest();
  console.log(`\n=== P12-C FACTORY SELF-TEST RESULTS ===`);
  for (const r of result.results) {
    console.log(`[${r.passed ? 'PASS' : 'FAIL'}] Scenario ${r.scenarioNumber}: ${r.name}`);
    console.log(`       Details: ${r.details}`);
  }
  console.log(`\nTOTAL: ${result.totalScenarios} | PASSED: ${result.passedCount} | FAILED: ${result.failedCount}`);
  if (!result.allPassed) {
    process.exit(1);
  }
}
