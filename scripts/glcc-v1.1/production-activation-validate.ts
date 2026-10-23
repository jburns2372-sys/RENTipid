/**
 * RENTipid GLCC v1.1 — Production Activation Validator
 *
 * Implements validation logic for:
 * 1. Activation preconditions & authorization checks
 * 2. Release-state transition constraints (QA_REQUIRED -> PRODUCTION_READY only)
 * 3. Deployment provenance & exact Git SHA parity
 * 4. Production verification results validation (PR-01 through PR-34)
 * 5. Automated promotion vs. rollback decision evaluation
 * 6. Rollback execution verification
 */

import {
  ActivationValidationResult,
  ProductionActivationPreconditions,
  ProductionActivationProvenance,
  ProductionPromotionDecision,
  ProductionRollbackExecutionRecord,
  ProductionVerificationExecution,
} from './production-activation-schema';

/**
 * Validates activation preconditions before deployment is permitted.
 */
export function validateActivationPreconditions(
  pre: ProductionActivationPreconditions
): ActivationValidationResult {
  const errors: string[] = [];

  if (!pre.authorizationPresent) {
    errors.push('Activation authorization missing. Formal authorization is required.');
  }

  if (pre.readinessStatus !== 'READY') {
    errors.push(`Production readiness status is "${pre.readinessStatus}". Must be "READY".`);
  }

  if (pre.currentReleaseState !== 'QA_REQUIRED') {
    errors.push(`Current candidate release state is "${pre.currentReleaseState}". Must be "QA_REQUIRED".`);
  }

  if (pre.previewAcceptanceStatus !== 'PASS') {
    errors.push(`Preview acceptance status is "${pre.previewAcceptanceStatus}". Must be "PASS".`);
  }

  if (pre.canonicalCoveragePercentage < 100) {
    errors.push(`Canonical key coverage is ${pre.canonicalCoveragePercentage}%. Must be 100%.`);
  }

  if (pre.missingRequiredKeysCount > 0) {
    errors.push(`Candidate has ${pre.missingRequiredKeysCount} missing required keys. Must be 0.`);
  }

  if (pre.requiredFallbackCount > 0) {
    errors.push(`Candidate has ${pre.requiredFallbackCount} required English fallbacks. Must be 0.`);
  }

  if (pre.rawKeysCount > 0) {
    errors.push(`Candidate has ${pre.rawKeysCount} raw unformatted translation keys. Must be 0.`);
  }

  if (pre.criticalBlockersCount > 0) {
    errors.push(`Candidate has ${pre.criticalBlockersCount} critical blockers. Must be 0.`);
  }

  if (pre.highBlockersCount > 0) {
    errors.push(`Candidate has ${pre.highBlockersCount} high blockers. Must be 0.`);
  }

  if (pre.legalComplianceStatus !== 'PASS') {
    errors.push(`Legal & compliance verification status is "${pre.legalComplianceStatus}". Must be "PASS".`);
  }

  if (!pre.authIdentityAvailable) {
    errors.push('Production auth verification test identity is unavailable.');
  }

  if (!pre.rollbackPlanValid) {
    errors.push('Production rollback plan is invalid or incomplete.');
  }

  if (!pre.verificationPlanComplete) {
    errors.push('Production verification plan is incomplete.');
  }

  if (!pre.declaredChangeSetMatch) {
    errors.push('Undeclared changes detected: active change set does not exactly match authorized change set.');
  }

  return {
    isValid: errors.length === 0,
    status: errors.length === 0 ? 'PASS' : 'BLOCK',
    errors,
  };
}

/**
 * Validates that release-state transitions adhere strictly to governed progression.
 * Only QA_REQUIRED -> PRODUCTION_READY is permitted for final activation.
 */
export function validateReleaseStateTransition(
  fromState: string,
  toState: string
): ActivationValidationResult {
  const errors: string[] = [];

  if (fromState === 'QA_REQUIRED' && toState === 'PRODUCTION_READY') {
    return {
      isValid: true,
      status: 'PASS',
      errors: [],
    };
  }

  errors.push(`Unauthorized release-state transition from "${fromState}" to "${toState}". Only "QA_REQUIRED" -> "PRODUCTION_READY" is permitted for activation.`);

  return {
    isValid: false,
    status: 'BLOCK',
    errors,
  };
}

/**
 * Validates deployment provenance, ensuring exact Git SHA match and correct environment.
 */
export function validateProductionActivationProvenance(
  prov: ProductionActivationProvenance
): ActivationValidationResult {
  const errors: string[] = [];

  if (!prov.authorizedGitSha || prov.authorizedGitSha.length !== 40) {
    errors.push(`Invalid authorized Git SHA format: "${prov.authorizedGitSha}".`);
  }

  if (!prov.deployedGitSha || prov.deployedGitSha.length !== 40) {
    errors.push(`Invalid deployed Git SHA format: "${prov.deployedGitSha}".`);
  }

  if (prov.authorizedGitSha && prov.deployedGitSha && prov.authorizedGitSha !== prov.deployedGitSha) {
    errors.push(`Git SHA mismatch: deployed SHA "${prov.deployedGitSha}" does not match authorized SHA "${prov.authorizedGitSha}".`);
  }

  if (!prov.deploymentId || prov.deploymentId.trim() === '') {
    errors.push('Missing deployment ID in activation provenance.');
  }

  if (!prov.productionAlias || prov.productionAlias.trim() === '') {
    errors.push('Missing Production alias/domain in provenance record.');
  }

  if (!prov.localePackChecksum || prov.localePackChecksum.trim() === '') {
    errors.push('Missing locale-pack checksum in provenance record.');
  }

  if (!prov.translationPackageChecksum || prov.translationPackageChecksum.trim() === '') {
    errors.push('Missing translation-package checksum in provenance record.');
  }

  if (prov.environment !== 'Production') {
    errors.push(`Deployment environment "${prov.environment}" is invalid. Must strictly be "Production".`);
  }

  return {
    isValid: errors.length === 0,
    status: errors.length === 0 ? 'PASS' : 'BLOCK',
    errors,
  };
}

/**
 * Validates that all PR-01 through PR-34 verification scenarios executed and passed.
 */
export function validateProductionVerificationResults(
  execution: ProductionVerificationExecution
): ActivationValidationResult {
  const errors: string[] = [];

  if (execution.failedScenariosCount > 0) {
    errors.push(`${execution.failedScenariosCount} verification scenarios failed.`);
  }

  if (execution.blockedScenariosCount > 0) {
    errors.push(`${execution.blockedScenariosCount} verification scenarios are blocked.`);
  }

  if (execution.notRunScenariosCount > 0) {
    errors.push(`${execution.notRunScenariosCount} verification scenarios were NOT_RUN.`);
  }

  return {
    isValid: errors.length === 0,
    status: errors.length === 0 ? 'PASS' : 'FAIL',
    errors,
  };
}

/**
 * Evaluates whether to PROMOTE or execute ROLLBACK based on verification execution.
 */
export function evaluateRollbackDecision(
  execution: ProductionVerificationExecution
): ProductionPromotionDecision {
  const allPassed =
    execution.failedScenariosCount === 0 &&
    execution.blockedScenariosCount === 0 &&
    execution.notRunScenariosCount === 0;

  if (allPassed) {
    return {
      decision: 'PROMOTE',
      reason: 'All 34 production verification scenarios passed successfully. Promotion to PRODUCTION_READY authorized.',
      timestamp: new Date().toISOString(),
      finalReleaseState: 'PRODUCTION_READY',
    };
  }

  const failureReasons: string[] = [];
  if (execution.failedScenariosCount > 0) failureReasons.push(`${execution.failedScenariosCount} failed`);
  if (execution.blockedScenariosCount > 0) failureReasons.push(`${execution.blockedScenariosCount} blocked`);
  if (execution.notRunScenariosCount > 0) failureReasons.push(`${execution.notRunScenariosCount} not run`);

  return {
    decision: 'ROLLBACK',
    reason: `Verification threshold not satisfied (${failureReasons.join(', ')}). Emergency rollback required.`,
    timestamp: new Date().toISOString(),
    finalReleaseState: 'QA_REQUIRED',
  };
}

/**
 * Validates post-rollback execution record to confirm clean baseline restoration.
 */
export function validateRollbackExecution(
  record: ProductionRollbackExecutionRecord
): ActivationValidationResult {
  const errors: string[] = [];

  if (!record.targetDeploymentId || record.targetDeploymentId.trim() === '') {
    errors.push('Missing rollback target deployment ID.');
  }

  if (!record.targetSourceSha || record.targetSourceSha.length !== 40) {
    errors.push(`Invalid rollback target source SHA: "${record.targetSourceSha}". Must be a 40-character commit hash.`);
  }

  if (!record.targetAlias || record.targetAlias.trim() === '') {
    errors.push('Missing rollback target alias.');
  }

  if (!record.restoredLocaleState || record.restoredLocaleState.trim() === '') {
    errors.push('Missing restored locale release state.');
  }

  if (!record.rollbackTriggerReason || record.rollbackTriggerReason.trim() === '') {
    errors.push('Missing rollback trigger reason.');
  }

  if (record.rollbackExecutionStatus !== 'SUCCESS') {
    errors.push(`Rollback execution status is "${record.rollbackExecutionStatus}". Must be "SUCCESS".`);
  }

  if (record.verificationStatus !== 'PASS') {
    errors.push(`Post-rollback verification status is "${record.verificationStatus}". Must be "PASS".`);
  }

  return {
    isValid: errors.length === 0,
    status: errors.length === 0 ? 'PASS' : 'FAIL',
    errors,
  };
}
