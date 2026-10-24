/**
 * RENTipid GLCC v1.1 — Language QA Plan Generator
 *
 * Consumes a validated LocalePack candidate and generates a comprehensive,
 * machine-readable LanguageQaPlan covering all 24 QA domains.
 *
 * Dynamically adjusts requirement rules for RTL capabilities, Class C
 * compliance, and baseline non-regression.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  ALL_QA_DOMAINS,
  LanguageQaDomainPlan,
  LanguageQaPlan,
} from './language-qa-schema';
import { isRuntimePathBlocked } from './locale-pack-generate';
import { LocalePack } from './locale-pack-schema';
import { validateLocalePack } from './locale-pack-validate';

/**
 * Generates an exhaustive LanguageQaPlan for a LocalePack candidate.
 */
export function generateLanguageQaPlan(
  pack: LocalePack,
  options?: {
    outputFilePath?: string;
    executionEnvironment?: string;
  }
): LanguageQaPlan {
  // 1. Runtime Installation Firewall
  if (options?.outputFilePath && isRuntimePathBlocked(options.outputFilePath)) {
    throw new Error(
      `RUNTIME_INSTALLATION_FIREWALL: Direct write to runtime directory "${options.outputFilePath}" is blocked.`
    );
  }

  // 2. Candidate Input Contract Verification
  if (!pack || typeof pack !== 'object') {
    throw new Error('QA_CANDIDATE_INPUT_GUARD: Locale pack is null or malformed.');
  }

  if (pack.releaseCandidateState !== 'CANDIDATE_FOR_QA') {
    throw new Error(
      `QA_CANDIDATE_INPUT_GUARD: Invalid candidate state "${pack.releaseCandidateState}". Must be "CANDIDATE_FOR_QA".`
    );
  }

  const packValidation = validateLocalePack(pack);
  if (!packValidation.isValid) {
    throw new Error(
      `QA_CANDIDATE_INPUT_GUARD: Locale pack failed validation (${packValidation.status}): ${packValidation.errors.slice(0, 3).join('; ')}`
    );
  }

  // 3. Domain Requirements Determination
  const isRtl = pack.localeMetadata.direction === 'rtl';
  const requiredDomains: string[] = [];
  const optionalDomains: string[] = [];
  const domains: Record<string, LanguageQaDomainPlan> = {};

  for (const def of ALL_QA_DOMAINS) {
    let isRequired = def.defaultRequired;

    // RTL domain QA-23 is required ONLY if pack is RTL
    if (def.domainId === 'QA-23') {
      isRequired = isRtl;
    }

    if (isRequired) {
      requiredDomains.push(def.domainId);
    } else {
      optionalDomains.push(def.domainId);
    }

    domains[def.domainId] = {
      domainId: def.domainId,
      name: def.name,
      required: isRequired,
      status: 'NOT_RUN',
      scenarioCount: 0,
      passedCount: 0,
      failedCount: 0,
      blockedCount: 0,
      evidenceReferences: [],
      notes: def.description,
    };
  }

  const plan: LanguageQaPlan = {
    qaPlanVersion: '1.1.0',
    localeTag: pack.localeTag,
    localePackChecksum: pack.packChecksum,
    canonicalKeyCount: pack.canonicalKeyCount,
    direction: pack.localeMetadata.direction,
    fallbackLocale: pack.localeMetadata.fallbackLocale,
    requiredDomains,
    optionalDomains,
    executionEnvironment: options?.executionEnvironment ?? 'LOCAL_QA_HARNESS',
    generatedAt: new Date().toISOString(),
    domains,
  };

  // 4. Output write
  if (options?.outputFilePath) {
    const dir = path.dirname(options.outputFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(options.outputFilePath, JSON.stringify(plan, null, 2), 'utf-8');
  }

  return plan;
}
