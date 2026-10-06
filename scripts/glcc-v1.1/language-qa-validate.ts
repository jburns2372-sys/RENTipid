/**
 * RENTipid GLCC v1.1 — Language QA Result Validator
 *
 * Enforces zero-tolerance criteria on LanguageQaResult submissions:
 * - 100% required domain pass rate
 * - Zero raw keys, zero required fallbacks, zero hydration warnings
 * - Zero security, financial, or authority boundary violations
 * - Internal scenario count consistency
 * - Locale pack checksum parity against QA Plan
 */

import {
  LanguageQaPlan,
  LanguageQaResult,
} from './language-qa-schema';

export interface QaResultValidationOutput {
  status: 'PASS' | 'FAIL';
  isValid: boolean;
  errorCount: number;
  warningCount: number;
  errors: string[];
  warnings: string[];
}

/**
 * Validates a LanguageQaResult against its governing LanguageQaPlan.
 */
export function validateLanguageQaResult(
  result: LanguageQaResult,
  plan: LanguageQaPlan
): QaResultValidationOutput {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!result || typeof result !== 'object') {
    return {
      status: 'FAIL',
      isValid: false,
      errorCount: 1,
      warningCount: 0,
      errors: ['Language QA result is null or malformed.'],
      warnings: [],
    };
  }

  if (!plan || typeof plan !== 'object') {
    return {
      status: 'FAIL',
      isValid: false,
      errorCount: 1,
      warningCount: 0,
      errors: ['Language QA plan is null or malformed.'],
      warnings: [],
    };
  }

  // 1. Pack Checksum Parity
  if (result.localePackChecksum !== plan.localePackChecksum) {
    errors.push(
      `CHECKSUM_MISMATCH: Result pack checksum "${result.localePackChecksum}" does not match planned candidate checksum "${plan.localePackChecksum}".`
    );
  }

  if (result.localeTag !== plan.localeTag) {
    errors.push(
      `TAG_MISMATCH: Result localeTag "${result.localeTag}" does not match planned candidate tag "${plan.localeTag}".`
    );
  }

  // 2. Metrics Zero-Tolerance Rules
  const m = result.metrics || ({} as any);
  if ((m.rawKeyCount ?? 0) > 0) {
    errors.push(`METRIC_VIOLATION: Raw key render count must be 0 (found ${m.rawKeyCount}).`);
  }
  if ((m.requiredFallbackCount ?? 0) > 0) {
    errors.push(`METRIC_VIOLATION: Required fallback count must be 0 (found ${m.requiredFallbackCount}).`);
  }
  if ((m.hydrationWarningCount ?? 0) > 0) {
    errors.push(`METRIC_VIOLATION: Hydration warning count must be 0 (found ${m.hydrationWarningCount}).`);
  }
  if ((m.visibleSourceLanguageFlashCount ?? 0) > 0) {
    errors.push(
      `METRIC_VIOLATION: Visible source language flash count must be 0 (found ${m.visibleSourceLanguageFlashCount}).`
    );
  }
  if ((m.placeholderMismatchCount ?? 0) > 0) {
    errors.push(
      `METRIC_VIOLATION: Placeholder mismatch count must be 0 (found ${m.placeholderMismatchCount}).`
    );
  }
  if ((m.securityBoundaryFailures ?? 0) > 0) {
    errors.push(
      `SECURITY_VIOLATION: Security boundary failures must be 0 (found ${m.securityBoundaryFailures}).`
    );
  }
  if ((m.financialBoundaryFailures ?? 0) > 0) {
    errors.push(
      `FINANCIAL_VIOLATION: Financial boundary failures must be 0 (found ${m.financialBoundaryFailures}).`
    );
  }
  if ((m.authorityBoundaryFailures ?? 0) > 0) {
    errors.push(
      `AUTHORITY_VIOLATION: Authority boundary failures must be 0 (found ${m.authorityBoundaryFailures}).`
    );
  }

  // 3. Required Domains Evaluation
  for (const domainId of plan.requiredDomains) {
    const domainResult = result.domainResults?.[domainId];
    if (!domainResult) {
      errors.push(`MISSING_DOMAIN: Required domain "${domainId}" has no result reported.`);
      continue;
    }

    if (domainResult.status === 'FAIL') {
      errors.push(`REQUIRED_DOMAIN_FAILED: Required domain "${domainId}" failed.`);
    } else if (domainResult.status === 'BLOCKED') {
      errors.push(`REQUIRED_DOMAIN_BLOCKED: Required domain "${domainId}" is marked BLOCKED.`);
    } else if (domainResult.status !== 'PASS') {
      errors.push(`REQUIRED_DOMAIN_NOT_PASSED: Required domain "${domainId}" status is "${domainResult.status}".`);
    }

    // Domain internal scenario consistency
    if (domainResult.passedCount + domainResult.failedCount + domainResult.blockedCount !== domainResult.scenarioCount) {
      errors.push(
        `INCONSISTENT_SCENARIOS: Domain "${domainId}" scenario count mismatch (passed=${domainResult.passedCount}, failed=${domainResult.failedCount}, blocked=${domainResult.blockedCount}, total=${domainResult.scenarioCount}).`
      );
    }
  }

  // 4. Summary Scenario Consistency
  const s = result.summary || ({} as any);
  if (s.passedScenarios + s.failedScenarios !== s.totalScenarios) {
    errors.push(
      `SUMMARY_INCONSISTENCY: Summary scenario totals do not balance (passed=${s.passedScenarios}, failed=${s.failedScenarios}, total=${s.totalScenarios}).`
    );
  }

  // 5. Overall Status Consistency
  if (result.overallStatus === 'PASS' && errors.length > 0) {
    errors.push('STATUS_CONFLICT: Result claimed overall PASS despite active validation errors.');
  }

  const isValid = errors.length === 0 && result.overallStatus === 'PASS';

  return {
    status: isValid ? 'PASS' : 'FAIL',
    isValid,
    errorCount: errors.length,
    warningCount: warnings.length,
    errors,
    warnings,
  };
}
