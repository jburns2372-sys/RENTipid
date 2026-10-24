/**
 * RENTipid GLCC v1.1 — Preview Activation Validator
 *
 * Implements validation logic for:
 * 1. Preview activation candidate eligibility
 * 2. Deployment provenance & git SHA parity
 * 3. Environment isolation & database safety
 * 4. Selector eligibility simulation (Preview vs. Production)
 * 5. Rollback plan validation
 */

import {
  LocaleSelectorSimulationInput,
  PreviewCandidateInput,
  PreviewDeploymentProvenance,
  PreviewEnvironmentSafety,
  PreviewRollbackPlan,
  PreviewValidationResult,
  SelectorEligibilityResult,
} from './preview-activation-schema';

/**
 * Validates candidate eligibility for Preview activation.
 * Enforces zero-tolerance gates: 100% canonical coverage, 0 fallbacks, 0 errors,
 * verified P12-E QA pass, and verified P12-F legal compliance pass.
 */
export function validatePreviewActivationEligibility(
  candidate: PreviewCandidateInput
): PreviewValidationResult {
  const errors: string[] = [];

  if (candidate.workflowState !== 'APPROVED_FOR_QA') {
    errors.push(`Workflow state "${candidate.workflowState}" is not eligible for Preview activation. Must be "APPROVED_FOR_QA".`);
  }

  if (!candidate.localePackValid) {
    errors.push('Locale pack is invalid or has failed structural integrity verification.');
  }

  if (candidate.localeCandidateState !== 'CANDIDATE_FOR_QA') {
    errors.push(`Locale candidate state "${candidate.localeCandidateState}" is invalid. Must be "CANDIDATE_FOR_QA".`);
  }

  if (candidate.qaStatus !== 'PASS') {
    errors.push(`P12-E Language QA status is "${candidate.qaStatus}". Must be "PASS".`);
  }

  if (candidate.legalStatus !== 'PASS') {
    errors.push(`P12-F Legal & Compliance verification status is "${candidate.legalStatus}". Must be "PASS".`);
  }

  if (candidate.coveragePercentage < 100) {
    errors.push(`Canonical coverage is ${candidate.coveragePercentage}%. Must be 100%.`);
  }

  if (candidate.missingRequiredCount > 0) {
    errors.push(`Candidate has ${candidate.missingRequiredCount} missing required keys. Must be 0.`);
  }

  if (candidate.requiredFallbackCount > 0) {
    errors.push(`Candidate has ${candidate.requiredFallbackCount} required English fallbacks. Must be 0.`);
  }

  if (candidate.rawKeyCount > 0) {
    errors.push(`Candidate has ${candidate.rawKeyCount} raw unformatted translation keys. Must be 0.`);
  }

  if (candidate.placeholderErrorCount > 0) {
    errors.push(`Candidate has ${candidate.placeholderErrorCount} placeholder mismatch errors. Must be 0.`);
  }

  if (candidate.formatErrorCount > 0) {
    errors.push(`Candidate has ${candidate.formatErrorCount} message format errors. Must be 0.`);
  }

  if (candidate.unicodeErrorCount > 0) {
    errors.push(`Candidate has ${candidate.unicodeErrorCount} Unicode replacement character errors. Must be 0.`);
  }

  if (candidate.criticalBlockerCount > 0) {
    errors.push(`Candidate has ${candidate.criticalBlockerCount} critical blockers. Must be 0.`);
  }

  if (candidate.highBlockerCount > 0) {
    errors.push(`Candidate has ${candidate.highBlockerCount} high-severity blockers. Must be 0.`);
  }

  return {
    isValid: errors.length === 0,
    status: errors.length === 0 ? 'PASS' : 'FAIL',
    errors,
  };
}

/**
 * Validates deployment provenance for Preview activation.
 * Ensures deployed Git SHA matches the approved candidate SHA exactly,
 * branch matches, and all verification evidence references are attached.
 */
export function validatePreviewDeploymentProvenance(
  provenance: PreviewDeploymentProvenance
): PreviewValidationResult {
  const errors: string[] = [];

  if (!provenance.candidateGitSha || provenance.candidateGitSha.length !== 40) {
    errors.push(`Invalid candidate Git SHA format: "${provenance.candidateGitSha}". Must be a 40-character commit hash.`);
  }

  if (!provenance.deployedGitSha || provenance.deployedGitSha.length !== 40) {
    errors.push(`Invalid deployed Git SHA format: "${provenance.deployedGitSha}". Must be a 40-character commit hash.`);
  }

  if (provenance.candidateGitSha && provenance.deployedGitSha && provenance.candidateGitSha !== provenance.deployedGitSha) {
    errors.push(`Deployment SHA mismatch: deployed SHA "${provenance.deployedGitSha}" does not match approved candidate SHA "${provenance.candidateGitSha}".`);
  }

  if (!provenance.branch || (!provenance.branch.startsWith('feat/') && !provenance.branch.startsWith('fix/'))) {
    errors.push(`Deployment branch "${provenance.branch}" does not match governed branch naming standards.`);
  }

  if (!provenance.deploymentId || provenance.deploymentId.trim() === '') {
    errors.push('Missing deployment ID in provenance record.');
  }

  if (!provenance.deploymentUrl || !provenance.deploymentUrl.startsWith('https://')) {
    errors.push(`Invalid deployment URL "${provenance.deploymentUrl}". Must be a valid secure HTTPS URL.`);
  }

  if (!provenance.localePackChecksum || provenance.localePackChecksum.trim() === '') {
    errors.push('Missing locale-pack checksum in deployment provenance record.');
  }

  if (!provenance.translationPackageChecksum || provenance.translationPackageChecksum.trim() === '') {
    errors.push('Missing translation-package checksum in deployment provenance record.');
  }

  if (!provenance.qaEvidenceReference || provenance.qaEvidenceReference.trim() === '') {
    errors.push('Missing QA evidence reference in deployment provenance record.');
  }

  if (!provenance.legalEvidenceReference || provenance.legalEvidenceReference.trim() === '') {
    errors.push('Missing legal/compliance evidence reference in deployment provenance record.');
  }

  return {
    isValid: errors.length === 0,
    status: errors.length === 0 ? 'PASS' : 'FAIL',
    errors,
  };
}

/**
 * Validates environment safety and database isolation.
 * Guarantees that Preview deployments never connect to Production databases,
 * never target Production aliases, and never expose Production secrets.
 */
export function validatePreviewEnvironmentSafety(
  env: PreviewEnvironmentSafety
): PreviewValidationResult {
  const errors: string[] = [];

  if (env.deploymentEnvironment !== 'Preview') {
    errors.push(`Target environment "${env.deploymentEnvironment}" is not Preview. Target must strictly be "Preview".`);
  }

  if (env.productionTargeted) {
    errors.push('Production environment was flagged as targeted. Preview activation must never target Production.');
  }

  if (!env.previewDatabaseIdentity || env.previewDatabaseIdentity.trim() === '') {
    errors.push('Missing Preview database identity.');
  }

  if (!env.productionDatabaseIdentity || env.productionDatabaseIdentity.trim() === '') {
    errors.push('Missing Production database identity specification.');
  }

  if (
    env.previewDatabaseIdentity &&
    env.productionDatabaseIdentity &&
    env.previewDatabaseIdentity.toLowerCase() === env.productionDatabaseIdentity.toLowerCase()
  ) {
    errors.push(`Database collision detected: Preview DB "${env.previewDatabaseIdentity}" is identical to Production DB.`);
  }

  if (!env.previewDatabaseIsolated) {
    errors.push('Preview database isolation is not verified. Isolation must be confirmed.');
  }

  if (env.productionAliasTargeted) {
    errors.push('Production alias was flagged as targeted. Preview activation must not target production domains.');
  }

  if (env.productionSecretsExposed) {
    errors.push('Production secrets exposure detected. Production secrets must remain isolated.');
  }

  if (!env.testUserProfilesOnly) {
    errors.push('Non-test user accounts detected. Preview testing must exclusively utilize test user profiles.');
  }

  return {
    isValid: errors.length === 0,
    status: errors.length === 0 ? 'PASS' : 'FAIL',
    errors,
  };
}

/**
 * Simulates language-neutral selector eligibility across deployment environments.
 * Enforces fail-closed trust boundaries:
 * - Preview (trusted server): PRODUCTION_READY and QA_REQUIRED are selectable.
 * - Production: Only PRODUCTION_READY is selectable. QA_REQUIRED is strictly blocked.
 * - Client-side injection attempts are unconditionally rejected.
 */
export function simulatePreviewSelectorEligibility(
  locale: LocaleSelectorSimulationInput,
  environment: 'Preview' | 'Production',
  clientInjectionAttempt: boolean = false
): SelectorEligibilityResult {
  // Client injection guard: Client cannot override server trust tier or release status
  if (clientInjectionAttempt) {
    return {
      localeTag: locale.localeTag,
      environment,
      isSelectable: false,
      reason: 'Client-controlled injection attempt rejected; cannot elevate privileges or override server environment.',
      trustTier: 'CLIENT_UNTRUSTED',
    };
  }

  if (environment === 'Preview') {
    if (locale.releaseStatus === 'PRODUCTION_READY') {
      return {
        localeTag: locale.localeTag,
        environment,
        isSelectable: true,
        reason: 'Locale is PRODUCTION_READY and selectable in Preview.',
        trustTier: 'SERVER_TRUSTED',
      };
    }
    if (locale.releaseStatus === 'QA_REQUIRED') {
      return {
        localeTag: locale.localeTag,
        environment,
        isSelectable: true,
        reason: 'Locale is QA_REQUIRED candidate and selectable in trusted Preview.',
        trustTier: 'SERVER_TRUSTED',
      };
    }
    if (locale.releaseStatus === 'TRANSLATION_IN_PROGRESS') {
      return {
        localeTag: locale.localeTag,
        environment,
        isSelectable: false,
        reason: 'Locale is TRANSLATION_IN_PROGRESS and blocked from selector.',
        trustTier: 'SERVER_TRUSTED',
      };
    }
    return {
      localeTag: locale.localeTag,
      environment,
      isSelectable: false,
      reason: 'Locale is REGISTERED and blocked from selector.',
      trustTier: 'SERVER_TRUSTED',
    };
  }

  // Production Environment
  if (locale.releaseStatus === 'PRODUCTION_READY') {
    return {
      localeTag: locale.localeTag,
      environment,
      isSelectable: true,
      reason: 'Locale is PRODUCTION_READY and selectable in Production.',
      trustTier: 'SERVER_TRUSTED',
    };
  }

  return {
    localeTag: locale.localeTag,
    environment,
    isSelectable: false,
    reason: `Locale state "${locale.releaseStatus}" is not eligible in Production environment.`,
    trustTier: 'SERVER_TRUSTED',
  };
}

/**
 * Validates a defined Preview rollback plan.
 * Ensures emergency fallback deployment, prior git SHA, and verification steps
 * are pre-configured before any deployment occurs.
 */
export function validatePreviewRollbackPlan(
  rollback: PreviewRollbackPlan
): PreviewValidationResult {
  const errors: string[] = [];

  if (!rollback.targetLocaleTag || rollback.targetLocaleTag.trim() === '') {
    errors.push('Missing target locale tag in rollback plan.');
  }

  if (!rollback.previousPreviewDeploymentId || rollback.previousPreviewDeploymentId.trim() === '') {
    errors.push('Missing previous Preview deployment ID in rollback plan.');
  }

  if (!rollback.previousApprovedSourceSha || rollback.previousApprovedSourceSha.length !== 40) {
    errors.push(`Invalid previous approved source SHA "${rollback.previousApprovedSourceSha}". Must be a 40-character commit hash.`);
  }

  if (!rollback.previousAliasTarget || rollback.previousAliasTarget.trim() === '') {
    errors.push('Missing previous alias target in rollback plan.');
  }

  if (!rollback.triggerConditions || rollback.triggerConditions.length < 3) {
    errors.push('Rollback plan must specify at least 3 distinct trigger conditions.');
  }

  if (!rollback.rollbackVerificationSteps || rollback.rollbackVerificationSteps.length < 2) {
    errors.push('Rollback plan must define at least 2 rollback verification steps.');
  }

  return {
    isValid: errors.length === 0,
    status: errors.length === 0 ? 'PASS' : 'FAIL',
    errors,
  };
}
