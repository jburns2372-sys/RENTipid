/**
 * RENTipid GLCC v1.1 — Locale Pack Generator
 *
 * Implements the deterministic compilation of an APPROVED_FOR_QA Translation Work Package
 * into a sealed, machine-readable Locale Pack release candidate.
 *
 * Enforces:
 * - Pre-generation validation guard
 * - Runtime installation firewall
 * - Release-state firewall (locked to CANDIDATE_FOR_QA)
 * - Locale metadata & directionality validation
 * - Fallback cycle & self-fallback guards
 * - Tamper-evident SHA-256 pack checksums
 */

import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import {
  LocalePack,
  LocalePackMessageItem,
  LocalePackMetadata,
  LocalePackValidationSummary,
} from './locale-pack-schema';
import { validateTranslationWorkPackage } from './translation-package-validate';
import {
  calculateCanonicalKeyChecksum,
  calculateSourceMessageChecksum,
} from './translation-source-export';
import { TranslationWorkPackage } from './translation-work-package-schema';

/**
 * Checks whether the target file path points into protected runtime application code.
 */
export function isRuntimePathBlocked(targetPath: string): boolean {
  if (!targetPath) return false;
  const normalized = path.normalize(path.resolve(targetPath)).toLowerCase();
  const blockedPatterns = [
    path.normalize('src/lib/glcc/i18n/locales').toLowerCase(),
    path.normalize('src/lib/glcc/default-registries').toLowerCase(),
    path.normalize('src/lib/glcc/i18n/contracts').toLowerCase(),
  ];
  return blockedPatterns.some((pattern) => normalized.includes(pattern));
}

/**
 * Validates fallback relationships against self-fallback and circular dependency cycles.
 */
export function validateFallbackHierarchy(
  targetTag: string,
  fallbackTag: string,
  knownHierarchy?: Record<string, string>
): { isValid: boolean; error?: string } {
  if (!fallbackTag || typeof fallbackTag !== 'string' || fallbackTag.trim() === '') {
    return { isValid: false, error: 'Fallback locale must be specified and non-empty.' };
  }
  if (targetTag.toLowerCase() === fallbackTag.toLowerCase()) {
    return {
      isValid: false,
      error: `Self-fallback prohibited: locale "${targetTag}" cannot fallback to itself.`,
    };
  }
  if (knownHierarchy) {
    const visited = new Set<string>([targetTag.toLowerCase()]);
    let curr: string | undefined = fallbackTag.toLowerCase();
    while (curr) {
      if (visited.has(curr)) {
        return {
          isValid: false,
          error: `Fallback cycle detected: ${Array.from(visited).join(' -> ')} -> ${curr}.`,
        };
      }
      visited.add(curr);
      curr = knownHierarchy[curr]?.toLowerCase();
    }
  }
  return { isValid: true };
}

/**
 * Validates locale metadata structure and directionality.
 */
export function validateLocaleMetadata(
  meta: LocalePackMetadata,
  fallbackHierarchy?: Record<string, string>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!meta || typeof meta !== 'object') {
    return { isValid: false, errors: ['Locale metadata is null or malformed.'] };
  }

  // Tag check
  if (!meta.tag || !/^[a-z]{2,3}(-[A-Za-z0-9]{2,4})*$/.test(meta.tag)) {
    errors.push(`Invalid BCP-47 locale tag format: "${meta.tag}".`);
  }

  // Direction check
  if (meta.direction !== 'ltr' && meta.direction !== 'rtl') {
    errors.push(`Invalid text direction: "${meta.direction}". Must be "ltr" or "rtl".`);
  }

  // Script & Display Names
  if (!meta.displayName || meta.displayName.trim() === '') {
    errors.push('Locale metadata missing displayName.');
  }
  if (!meta.nativeDisplayName || meta.nativeDisplayName.trim() === '') {
    errors.push('Locale metadata missing nativeDisplayName.');
  }
  if (!meta.script || meta.script.trim() === '') {
    errors.push('Locale metadata missing script.');
  }

  // Fallback checks
  const fallbackCheck = validateFallbackHierarchy(
    meta.tag,
    meta.fallbackLocale,
    fallbackHierarchy
  );
  if (!fallbackCheck.isValid && fallbackCheck.error) {
    errors.push(fallbackCheck.error);
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Calculates SHA-256 checksum over sorted target message values.
 */
export function calculateTargetMessageChecksum(
  messages: Record<string, { value: string }>
): string {
  const sortedKeys = Object.keys(messages).sort();
  const serialized = sortedKeys.map((k) => `${k}=${messages[k]?.value ?? ''}`).join('\n');
  return createHash('sha256').update(serialized).digest('hex');
}

/**
 * Calculates overall tamper-evident pack checksum.
 */
export function calculatePackChecksum(
  localeTag: string,
  targetMessageChecksum: string,
  metadata: LocalePackMetadata
): string {
  const payload = `${localeTag}|${targetMessageChecksum}|${JSON.stringify(metadata)}`;
  return createHash('sha256').update(payload).digest('hex');
}

/**
 * Generates a compiled LocalePack from an APPROVED_FOR_QA translation work package.
 */
export function generateLocalePack(
  workPackage: TranslationWorkPackage,
  metadata: LocalePackMetadata,
  options?: {
    outputFilePath?: string;
    generatedAt?: string;
    fallbackHierarchy?: Record<string, string>;
  }
): LocalePack {
  // 1. Runtime Installation Firewall
  if (options?.outputFilePath && isRuntimePathBlocked(options.outputFilePath)) {
    throw new Error(
      `RUNTIME_INSTALLATION_FIREWALL: Direct write to runtime locale directory "${options.outputFilePath}" is blocked.`
    );
  }

  // 2. Pre-Generation Workflow State Guard
  if (workPackage.workflowState !== 'APPROVED_FOR_QA') {
    throw new Error(
      `PRE_GENERATION_GUARD: Cannot generate locale pack. Work package workflowState must be "APPROVED_FOR_QA" (found "${workPackage.workflowState}").`
    );
  }

  // 3. Pre-Generation Translation Validation Guard
  const validationRes = validateTranslationWorkPackage(workPackage);
  if (!validationRes.isValid) {
    throw new Error(
      `PRE_GENERATION_GUARD: Translation work package failed validation with ${validationRes.errorCount} errors: ${validationRes.errors.slice(0, 3).join('; ')}`
    );
  }

  // 4. Metadata & Fallback Guard
  const metaCheck = validateLocaleMetadata(metadata, options?.fallbackHierarchy);
  if (!metaCheck.isValid) {
    throw new Error(
      `METADATA_GUARD: Invalid locale metadata: ${metaCheck.errors.join('; ')}`
    );
  }

  // 5. Construct Deterministic Messages & Checksums
  const sortedKeys = Object.keys(workPackage.messages).sort();
  const messages: Record<string, LocalePackMessageItem> = {};
  const approvalReferences: Record<string, string> = {};

  for (const key of sortedKeys) {
    const srcMsg = workPackage.messages[key];
    const sourceChecksum = createHash('sha256').update(srcMsg.sourceText).digest('hex');
    const targetChecksum = createHash('sha256').update(srcMsg.targetText).digest('hex');

    messages[key] = {
      key,
      value: srcMsg.targetText,
      contentClass: srcMsg.contentClass,
      placeholderSignature: srcMsg.placeholderSignature,
      sourceChecksum,
      targetChecksum,
      reviewStatus: srcMsg.reviewStatus,
      authoritativeSourceId: srcMsg.authoritativeSourceId,
      authoritativeSourceVersion: srcMsg.authoritativeSourceVersion,
      legalApprovalReference: srcMsg.legalApprovalReference,
    };

    if (srcMsg.legalApprovalReference) {
      approvalReferences[key] = srcMsg.legalApprovalReference;
    }
  }

  const targetMessageChecksum = calculateTargetMessageChecksum(messages);
  const packChecksum = calculatePackChecksum(metadata.tag, targetMessageChecksum, metadata);

  const validationSummary: LocalePackValidationSummary = {
    requiredKeyCount: validationRes.canonicalKeyCount,
    translatedRequiredCount: validationRes.translatedRequiredCount,
    missingRequiredCount: validationRes.missingRequiredCount,
    extraKeyCount: validationRes.extraKeyCount,
    placeholderMismatchCount: validationRes.placeholderMismatchCount,
    formatErrorCount: validationRes.formatErrorCount,
    unicodeErrorCount: validationRes.unicodeErrorCount,
    controlledContentPendingCount: validationRes.controlledContentPendingCount,
  };

  const pack: LocalePack = {
    packVersion: '1.1.0',
    localeTag: metadata.tag,
    sourceLocale: workPackage.sourceLocale,
    workflowPackageVersion: workPackage.packageVersion,
    canonicalKeyCount: sortedKeys.length,
    canonicalKeyChecksum: workPackage.canonicalKeyChecksum,
    sourceMessageChecksum: workPackage.sourceMessageChecksum,
    targetMessageChecksum,
    packChecksum,
    generatedAt: options?.generatedAt ?? new Date().toISOString(),
    workflowState: 'APPROVED_FOR_QA',
    releaseCandidateState: 'CANDIDATE_FOR_QA',
    localeMetadata: metadata,
    messages,
    validationSummary,
    approvalReferences,
  };

  // 6. Write output if path provided
  if (options?.outputFilePath) {
    const dir = path.dirname(options.outputFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(options.outputFilePath, JSON.stringify(pack, null, 2), 'utf-8');
  }

  return pack;
}
