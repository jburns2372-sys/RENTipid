/**
 * RENTipid GLCC v1.1 — Translation Source Export Factory
 *
 * Deterministically exports canonical GLCC keys, source strings, placeholder signatures,
 * and content classifications into a machine-readable Translation Work Package.
 */

import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import {
  GLCC_CANONICAL_KEYS,
  CANONICAL_EN_PH_MESSAGES,
  type GlccCanonicalTranslationKey,
} from '../../src/lib/glcc/i18n/contracts/index';
import {
  TranslationContentClass,
  TranslationWorkPackage,
  TranslationWorkPackageMessage,
} from './translation-work-package-schema';

/**
 * Classifies a canonical translation key into its governance content class.
 */
export function classifyKey(key: string): TranslationContentClass {
  const domain = key.split('.')[0];
  const lower = key.toLowerCase();

  // Class C: Controlled Legal & Compliance
  if (
    domain === 'legalCompliance' ||
    domain === 'kyc' ||
    domain === 'trustSafety' ||
    lower.includes('.terms') ||
    lower.includes('.privacy') ||
    lower.includes('.compliance') ||
    lower.includes('.disclosure') ||
    lower.includes('.statutory') ||
    lower.includes('.regulatory') ||
    lower.includes('.jurisdiction')
  ) {
    return 'CLASS_C_CONTROLLED_LEGAL_COMPLIANCE';
  }

  // Class B: System & Transactional Messages
  if (
    domain === 'auth' ||
    domain === 'checkout' ||
    domain === 'payment' ||
    domain === 'booking' ||
    domain === 'errors' ||
    domain === 'validation' ||
    domain === 'status' ||
    domain === 'notifications' ||
    domain === 'documents' ||
    domain === 'insurance'
  ) {
    return 'CLASS_B_SYSTEM_TRANSACTIONAL';
  }

  // Class D: User-Generated Content Boundary
  if (
    lower.includes('.user_content') ||
    lower.includes('.ugc') ||
    lower.includes('.user_input') ||
    key === 'reviews.placeholder' ||
    key === 'messages.composer_placeholder'
  ) {
    return 'CLASS_D_USER_GENERATED_BOUNDARY';
  }

  // Class E: AI / Generated Content Boundary
  if (
    domain === 'soc' ||
    lower.includes('.ai_') ||
    lower.includes('.smart_') ||
    lower.includes('.generated_')
  ) {
    return 'CLASS_E_AI_GENERATED_BOUNDARY';
  }

  // Class A: Standard UI
  if (
    domain === 'common' ||
    domain === 'navigation' ||
    domain === 'preferences' ||
    domain === 'marketplace' ||
    domain === 'listing' ||
    domain === 'search' ||
    domain === 'account' ||
    domain === 'profile' ||
    domain === 'provider' ||
    domain === 'renter' ||
    domain === 'partnerHub' ||
    domain === 'messages' ||
    domain === 'reviews' ||
    domain === 'support' ||
    domain === 'helpCenter' ||
    domain === 'admin' ||
    domain === 'superAdmin'
  ) {
    return 'CLASS_A_STANDARD_UI';
  }

  return 'CLASSIFICATION_REVIEW_REQUIRED';
}

/**
 * Extracts placeholder names from source string deterministically.
 */
export function extractPlaceholderSignature(text: string): string[] {
  if (!text || typeof text !== 'string') return [];
  // Match standard {name} or ICU {name, plural, ...}
  const matches = text.matchAll(/\{(\w+)(?:,[^}]*)?\}/g);
  const placeholders = new Set<string>();
  for (const m of matches) {
    if (m[1]) {
      placeholders.add(m[1]);
    }
  }
  return Array.from(placeholders).sort();
}

/**
 * Computes SHA-256 hash of sorted canonical keys.
 */
export function calculateCanonicalKeyChecksum(keys: readonly string[]): string {
  const sorted = [...keys].sort();
  return createHash('sha256').update(sorted.join('\n')).digest('hex');
}

/**
 * Computes SHA-256 hash of canonical keys and source text values.
 */
export function calculateSourceMessageChecksum(
  keys: readonly string[],
  messages: Record<string, string>
): string {
  const sorted = [...keys].sort();
  const serialized = sorted.map((k) => `${k}=${messages[k] ?? ''}`).join('\n');
  return createHash('sha256').update(serialized).digest('hex');
}

/**
 * Exports a canonical translation work package for a target locale.
 */
export function exportTranslationWorkPackage(
  targetLocale: string,
  options?: {
    outputFilePath?: string;
    generatedAt?: string;
  }
): TranslationWorkPackage {
  const sortedKeys = [...GLCC_CANONICAL_KEYS].sort();
  const keyChecksum = calculateCanonicalKeyChecksum(sortedKeys);
  const messageChecksum = calculateSourceMessageChecksum(
    sortedKeys,
    CANONICAL_EN_PH_MESSAGES
  );

  const messages: Record<string, TranslationWorkPackageMessage> = {};

  for (const key of sortedKeys) {
    const sourceText = CANONICAL_EN_PH_MESSAGES[key as GlccCanonicalTranslationKey] ?? '';
    const contentClass = classifyKey(key);
    const placeholders = extractPlaceholderSignature(sourceText);
    const isClassC = contentClass === 'CLASS_C_CONTROLLED_LEGAL_COMPLIANCE';

    messages[key] = {
      key,
      sourceText,
      targetText: '',
      contentClass,
      required: true,
      placeholderSignature: placeholders,
      reviewStatus: 'UNTRANSLATED',
      translatorReference: '',
      reviewerReference: '',
      notes: '',
      authoritativeSourceId: isClassC ? `SRC-GLCC-${key}` : undefined,
      authoritativeSourceVersion: isClassC ? 'v1.0.1' : undefined,
      jurisdiction: isClassC ? 'GLOBAL/PH' : undefined,
      legalApprovalRequired: isClassC,
      legalApprovalStatus: isClassC ? 'PENDING' : 'NOT_APPLICABLE',
      legalApprovalReference: undefined,
      isAiDraft: false,
    };
  }

  const workPackage: TranslationWorkPackage = {
    packageVersion: '1.1.0',
    targetLocale,
    sourceLocale: 'en-PH',
    canonicalKeyCount: sortedKeys.length,
    canonicalKeyChecksum: keyChecksum,
    sourceMessageChecksum: messageChecksum,
    generatedAt: options?.generatedAt ?? new Date().toISOString(),
    workflowState: 'SOURCE_LOCKED',
    messages,
  };

  if (options?.outputFilePath) {
    const dir = path.dirname(options.outputFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      options.outputFilePath,
      JSON.stringify(workPackage, null, 2),
      'utf-8'
    );
  }

  return workPackage;
}

// CLI entry point
if (process.argv[1] && process.argv[1].endsWith('translation-source-export.ts')) {
  const targetLocale = process.argv[2];
  const outputPath = process.argv[3];
  if (!targetLocale) {
    console.error('Usage: tsx translation-source-export.ts <targetLocale> [outputPath]');
    process.exit(1);
  }
  const result = exportTranslationWorkPackage(targetLocale, { outputFilePath: outputPath });
  console.log(`Exported work package for ${targetLocale}: ${result.canonicalKeyCount} keys.`);
  console.log(`Canonical Key Checksum: ${result.canonicalKeyChecksum}`);
  console.log(`Source Message Checksum: ${result.sourceMessageChecksum}`);
}
