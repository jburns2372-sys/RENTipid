/**
 * RENTipid GLCC v1.1 — Locale Pack Validator
 *
 * Enforces rigorous integrity checks on generated Locale Pack release candidates:
 * - Sealed pack checksum and target message checksum verification (tamper detection)
 * - Source-drift verification against active canonical baseline
 * - Canonical key completeness and exact key-set parity (2,208 keys)
 * - Placeholder & message-format validation
 * - Locale metadata & fallback integrity
 * - Class C legal approval reference verification
 */

import {
  GLCC_CANONICAL_KEYS,
  CANONICAL_EN_PH_MESSAGES,
} from '../../src/lib/glcc/i18n/contracts/index';
import {
  calculatePackChecksum,
  calculateTargetMessageChecksum,
  validateLocaleMetadata,
} from './locale-pack-generate';
import {
  LocalePack,
  LocalePackValidationResult,
} from './locale-pack-schema';
import {
  calculateCanonicalKeyChecksum,
  calculateSourceMessageChecksum,
  extractPlaceholderSignature,
} from './translation-source-export';
import { checkMessageFormatSyntax } from './translation-package-validate';

/**
 * Validates a generated LocalePack release candidate.
 */
export function validateLocalePack(
  pack: LocalePack,
  options?: {
    fallbackHierarchy?: Record<string, string>;
  }
): LocalePackValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!pack || typeof pack !== 'object') {
    return {
      status: 'INVALID',
      isValid: false,
      errorCount: 1,
      warningCount: 0,
      errors: ['Locale pack is null or not an object.'],
      warnings: [],
    };
  }

  // 1. Pack Checksum & Message Checksum Verification (Tamper Detection)
  const expectedTargetChecksum = calculateTargetMessageChecksum(pack.messages || {});
  let isTampered = false;

  if (pack.targetMessageChecksum !== expectedTargetChecksum) {
    isTampered = true;
    errors.push(
      `TAMPER_DETECTED: Target message checksum mismatch. Expected: ${expectedTargetChecksum.slice(0, 16)}..., found: ${pack.targetMessageChecksum?.slice(0, 16)}...`
    );
  }

  const expectedPackChecksum = calculatePackChecksum(
    pack.localeTag,
    expectedTargetChecksum,
    pack.localeMetadata
  );

  if (pack.packChecksum !== expectedPackChecksum) {
    isTampered = true;
    errors.push(
      `TAMPER_DETECTED: Pack checksum mismatch. Expected: ${expectedPackChecksum.slice(0, 16)}..., found: ${pack.packChecksum?.slice(0, 16)}...`
    );
  }

  // 2. Source-Drift Detection
  const currentKeys = [...GLCC_CANONICAL_KEYS].sort();
  const currentKeyChecksum = calculateCanonicalKeyChecksum(currentKeys);
  const currentMsgChecksum = calculateSourceMessageChecksum(
    currentKeys,
    CANONICAL_EN_PH_MESSAGES
  );
  let hasSourceDrift = false;

  if (pack.canonicalKeyChecksum !== currentKeyChecksum) {
    hasSourceDrift = true;
    errors.push(
      `SOURCE_DRIFT: Canonical key checksum mismatch against current codebase.`
    );
  }

  if (pack.sourceMessageChecksum !== currentMsgChecksum) {
    hasSourceDrift = true;
    errors.push(
      `SOURCE_DRIFT: Source message checksum mismatch against current codebase.`
    );
  }

  // 3. Key Count & Exact Key-Set Parity
  const packKeys = Object.keys(pack.messages || {}).sort();
  const packKeySet = new Set(packKeys);
  const canonicalKeySet = new Set(currentKeys);

  if (pack.canonicalKeyCount !== currentKeys.length) {
    errors.push(
      `Canonical key count mismatch: pack specifies ${pack.canonicalKeyCount}, expected ${currentKeys.length}.`
    );
  }

  for (const k of currentKeys) {
    if (!packKeySet.has(k)) {
      errors.push(`Missing canonical key: "${k}".`);
    }
  }

  for (const k of packKeys) {
    if (!canonicalKeySet.has(k)) {
      errors.push(`Extra non-canonical key: "${k}".`);
    }
  }

  // 4. Metadata & Fallback Integrity
  const metaCheck = validateLocaleMetadata(pack.localeMetadata, options?.fallbackHierarchy);
  if (!metaCheck.isValid) {
    errors.push(...metaCheck.errors);
  }

  // 5. Message Content & Placeholder Checks
  for (const key of currentKeys) {
    const msg = pack.messages?.[key];
    if (!msg) continue;

    const val = msg.value ?? '';
    if (val.trim() === '') {
      errors.push(`Key "${key}": missing required translation value.`);
    }

    if (val.includes('\uFFFD') || val.includes('\\uFFFD')) {
      errors.push(`Key "${key}": contains invalid Unicode replacement character (U+FFFD).`);
    }

    const syntaxErr = checkMessageFormatSyntax(val);
    if (syntaxErr) {
      errors.push(`Key "${key}": format syntax error - ${syntaxErr}.`);
    }

    const expectedPlaceholders = msg.placeholderSignature || [];
    const actualPlaceholders = extractPlaceholderSignature(val);
    const isPlaceholderMatch =
      expectedPlaceholders.length === actualPlaceholders.length &&
      expectedPlaceholders.every((p, idx) => p === actualPlaceholders[idx]);

    if (!isPlaceholderMatch) {
      errors.push(
        `Key "${key}": placeholder mismatch. Expected: [${expectedPlaceholders.join(', ')}], found: [${actualPlaceholders.join(', ')}].`
      );
    }

    // Class C Legal approval check
    if (msg.contentClass === 'CLASS_C_CONTROLLED_LEGAL_COMPLIANCE') {
      if (!msg.legalApprovalReference || msg.legalApprovalReference.trim() === '') {
        errors.push(
          `Key "${key}": Class C legal content missing required legalApprovalReference.`
        );
      }
    }
  }

  // Determine overall status
  let status: 'VALID' | 'INVALID' | 'TAMPER_DETECTED' | 'SOURCE_DRIFT' = 'VALID';
  if (isTampered) {
    status = 'TAMPER_DETECTED';
  } else if (hasSourceDrift) {
    status = 'SOURCE_DRIFT';
  } else if (errors.length > 0) {
    status = 'INVALID';
  }

  const isValid = errors.length === 0;

  return {
    status,
    isValid,
    errorCount: errors.length,
    warningCount: warnings.length,
    errors,
    warnings,
  };
}

// CLI entry point
if (process.argv[1] && process.argv[1].endsWith('locale-pack-validate.ts')) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: tsx locale-pack-validate.ts <packFilePath>');
    process.exit(1);
  }
  const fs = require('fs');
  const pack = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const res = validateLocalePack(pack);
  console.log(`Validation Status: ${res.status}`);
  console.log(`Valid: ${res.isValid} | Errors: ${res.errorCount} | Warnings: ${res.warningCount}`);
  if (res.errors.length > 0) {
    console.error('Errors:\n' + res.errors.slice(0, 10).map((e: string) => ` - ${e}`).join('\n'));
  }
  process.exit(res.isValid ? 0 : 1);
}
