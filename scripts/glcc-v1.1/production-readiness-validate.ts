/**
 * RENTipid GLCC v1.1 — Production Readiness Validator
 *
 * Implements validation logic for:
 * 1. Candidate readiness entry contract
 * 2. Production change set & minimal-change enforcement
 * 3. Environment safety & database migration plans
 * 4. Auth verification & non-customer test identities
 * 5. Financial, RBAC, KYC, jurisdiction, and legal boundary integrity
 * 6. Production rollback readiness
 * 7. 34-scenario Production verification plan completeness
 * 8. Production selector eligibility simulation
 */

import {
  PRODUCTION_VERIFICATION_SCENARIOS,
  ProductionAuthVerificationContract,
  ProductionBoundaryIntegrity,
  ProductionCandidateInput,
  ProductionChangeSetDeclaration,
  ProductionDatabaseChangePlan,
  ProductionDeploymentProvenance,
  ProductionEnvironmentSafetyInput,
  ProductionReadinessEvaluationResult,
  ProductionRollbackPlan,
  ProductionVerificationScenario,
} from './production-readiness-schema';

/**
 * Validates candidate readiness for Production entry evaluation.
 */
export function validateProductionCandidateReadiness(
  candidate: ProductionCandidateInput
): ProductionReadinessEvaluationResult {
  const reasons: string[] = [];

  if (candidate.previewAcceptanceStatus !== 'PASS') {
    reasons.push(`Preview acceptance status is "${candidate.previewAcceptanceStatus}". Must be "PASS".`);
  }

  if (candidate.currentReleaseState !== 'QA_REQUIRED') {
    reasons.push(`Current candidate release state is "${candidate.currentReleaseState}". Must be "QA_REQUIRED".`);
  }

  if (candidate.translationWorkflowState !== 'APPROVED_FOR_QA') {
    reasons.push(`Translation workflow state is "${candidate.translationWorkflowState}". Must be "APPROVED_FOR_QA".`);
  }

  if (!candidate.localePackValid) {
    reasons.push('Locale pack structural validity is false.');
  }

  if (candidate.languageQaStatus !== 'PASS') {
    reasons.push(`P12-E language QA status is "${candidate.languageQaStatus}". Must be "PASS".`);
  }

  if (candidate.legalComplianceStatus !== 'PASS') {
    reasons.push(`P12-F legal & compliance status is "${candidate.legalComplianceStatus}". Must be "PASS".`);
  }

  if (candidate.previewActivationStatus !== 'COMPLETED') {
    reasons.push(`Preview activation status is "${candidate.previewActivationStatus}". Must be "COMPLETED".`);
  }

  if (candidate.coveragePercentage < 100) {
    reasons.push(`Canonical key coverage is ${candidate.coveragePercentage}%. Must be 100%.`);
  }

  if (candidate.missingRequiredCount > 0) {
    reasons.push(`Candidate has ${candidate.missingRequiredCount} missing required keys. Must be 0.`);
  }

  if (candidate.requiredFallbackCount > 0) {
    reasons.push(`Candidate has ${candidate.requiredFallbackCount} required English fallbacks. Must be 0.`);
  }

  if (candidate.rawKeyCount > 0) {
    reasons.push(`Candidate has ${candidate.rawKeyCount} raw unformatted translation keys. Must be 0.`);
  }

  if (candidate.criticalBlockersCount > 0) {
    reasons.push(`Candidate has ${candidate.criticalBlockersCount} critical blockers. Must be 0.`);
  }

  if (candidate.highBlockersCount > 0) {
    reasons.push(`Candidate has ${candidate.highBlockersCount} high blockers. Must be 0.`);
  }

  if (candidate.enPhNonRegressionStatus !== 'PASS') {
    reasons.push(`en-PH non-regression status is "${candidate.enPhNonRegressionStatus}". Must be "PASS".`);
  }

  if (candidate.filPhNonRegressionStatus !== 'PASS') {
    reasons.push(`fil-PH non-regression status is "${candidate.filPhNonRegressionStatus}". Must be "PASS".`);
  }

  const isReady = reasons.length === 0;
  return {
    state: isReady ? 'READY' : 'NOT_READY',
    isReady,
    reasons,
  };
}

/**
 * Validates the declared Production change set against the minimal-change principle.
 */
export function validateProductionChangeSet(
  changeSet: ProductionChangeSetDeclaration
): ProductionReadinessEvaluationResult {
  const reasons: string[] = [];

  if (!changeSet.declaredChanges || changeSet.declaredChanges.length === 0) {
    reasons.push('Production change set declaration is empty.');
  }

  if (changeSet.unrelatedRuntimeChangesCount > 0) {
    reasons.push(`Detected ${changeSet.unrelatedRuntimeChangesCount} unrelated runtime changes. Must be 0.`);
  }

  if (changeSet.unexpectedDatabaseChangesCount > 0) {
    reasons.push(`Detected ${changeSet.unexpectedDatabaseChangesCount} unexpected database changes. Must be 0.`);
  }

  if (changeSet.unexpectedEnvironmentChangesCount > 0) {
    reasons.push(`Detected ${changeSet.unexpectedEnvironmentChangesCount} unexpected environment changes. Must be 0.`);
  }

  if (changeSet.unexpectedPackageChangesCount > 0) {
    reasons.push(`Detected ${changeSet.unexpectedPackageChangesCount} unexpected package.json/dependency changes. Must be 0.`);
  }

  const isReady = reasons.length === 0;
  return {
    state: isReady ? 'READY' : 'NOT_READY',
    isReady,
    reasons,
  };
}

/**
 * Validates Production environment safety and security controls.
 */
export function validateProductionEnvironmentSafety(
  env: ProductionEnvironmentSafetyInput
): ProductionReadinessEvaluationResult {
  const reasons: string[] = [];

  if (env.environmentIdentity !== 'Production') {
    reasons.push(`Environment identity "${env.environmentIdentity}" is not Production.`);
  }

  if (!env.productionDatabaseIdentity || env.productionDatabaseIdentity.trim() === '') {
    reasons.push('Production database identity is missing.');
  }

  if (!env.productionAlias || env.productionAlias.trim() === '') {
    reasons.push('Production alias/domain is missing.');
  }

  if (env.productionSecretsExposed) {
    reasons.push('Production secrets exposure detected. Secrets must never be exposed or printed.');
  }

  if (env.previewCredentialsReusedAsProduction) {
    reasons.push('Preview credentials cannot be reused as Production authority.');
  }

  if (!env.testCredentialsNonCustomer) {
    reasons.push('Test credentials must be non-customer accounts.');
  }

  if (env.productionQaModeEnabled) {
    reasons.push('Production QA mode is enabled. Must be disabled/fail-closed in Production.');
  }

  const isReady = reasons.length === 0;
  return {
    state: isReady ? 'READY' : 'NOT_READY',
    isReady,
    reasons,
  };
}

/**
 * Validates Production database and migration governance.
 */
export function validateProductionDatabasePlan(
  plan: ProductionDatabaseChangePlan
): ProductionReadinessEvaluationResult {
  const reasons: string[] = [];

  if (plan.schemaMigrationRequired === undefined || plan.seedSyncRequired === undefined) {
    reasons.push('Unknown database migration requirement. Schema and seed requirements must be explicitly declared.');
  }

  if (!plan.schemaMigrationRequired && !plan.seedSyncRequired) {
    if (!plan.noOpEvidence || plan.noOpEvidence.trim() === '') {
      reasons.push('Database plan declares no-op but lacks documented no-op evidence.');
    }
  } else {
    if (!plan.isExplicitlyGoverned) {
      reasons.push('Database schema/seed changes are required but lack explicit governance authorization.');
    }
    if (!plan.rollbackProcedureDefined) {
      reasons.push('Database rollback procedure is missing for declared schema/seed changes.');
    }
  }

  const isReady = reasons.length === 0;
  return {
    state: isReady ? 'READY' : 'NOT_READY',
    isReady,
    reasons,
  };
}

/**
 * Validates Production authentication verification contract.
 */
export function validateProductionAuthVerification(
  auth: ProductionAuthVerificationContract
): ProductionReadinessEvaluationResult {
  const reasons: string[] = [];

  if (!auth.testIdentityReference || auth.testIdentityReference.trim() === '') {
    reasons.push('Missing test identity reference.');
  }

  if (!auth.isNonCustomer) {
    reasons.push('Auth verification identity must be an accredited non-customer account.');
  }

  if (!auth.hasLeastPrivilege) {
    reasons.push('Auth verification identity must adhere to least-privilege principles.');
  }

  if (auth.secretExposedInPayload) {
    reasons.push('Auth identity secret was exposed in payload. Secrets must never be included in governance evidence.');
  }

  const requiredSmoke = ['login', 'session', 'preferences', 'rendering', 'route', 'hard_refresh', 'logout'];
  for (const s of requiredSmoke) {
    if (!auth.smokeScenariosCovered.includes(s)) {
      reasons.push(`Missing required auth smoke scenario: "${s}".`);
    }
  }

  const isReady = reasons.length === 0;
  return {
    state: isReady ? 'READY' : 'NOT_READY',
    isReady,
    reasons,
  };
}

/**
 * Validates financial, security, RBAC, KYC, and jurisdiction boundaries.
 */
export function validateProductionBoundaries(
  boundaries: ProductionBoundaryIntegrity
): ProductionReadinessEvaluationResult {
  const reasons: string[] = [];

  if (!boundaries.financialAuthorityPreserved) {
    reasons.push('Financial authority boundary violation: charge currencies or payment rules were modified.');
  }

  if (!boundaries.rbacPreserved) {
    reasons.push('RBAC authority boundary violation: roles or permissions were modified.');
  }

  if (!boundaries.kycPreserved) {
    reasons.push('KYC authority boundary violation: verification rules were modified.');
  }

  if (!boundaries.jurisdictionPreserved) {
    reasons.push('Jurisdiction boundary violation: statutory legal jurisdiction was altered.');
  }

  if (!boundaries.legalAuthorityPreserved) {
    reasons.push('Legal/compliance boundary violation: unapproved or unversioned legal content referenced.');
  }

  const isReady = reasons.length === 0;
  return {
    state: isReady ? 'READY' : 'NOT_READY',
    isReady,
    reasons,
  };
}

/**
 * Validates Production rollback plan completeness.
 */
export function validateProductionRollbackPlan(
  plan: ProductionRollbackPlan
): ProductionReadinessEvaluationResult {
  const reasons: string[] = [];

  if (!plan.currentProductionDeploymentId || plan.currentProductionDeploymentId.trim() === '') {
    reasons.push('Missing current Production deployment ID.');
  }

  if (!plan.currentProductionSourceSha || plan.currentProductionSourceSha.length !== 40) {
    reasons.push(`Invalid current Production source SHA: "${plan.currentProductionSourceSha}". Must be a 40-character commit hash.`);
  }

  if (!plan.currentLocaleReleaseState || plan.currentLocaleReleaseState.trim() === '') {
    reasons.push('Missing current locale release state in rollback plan.');
  }

  if (!plan.currentAliasTarget || plan.currentAliasTarget.trim() === '') {
    reasons.push('Missing current Production alias target.');
  }

  if (!plan.triggerConditions || plan.triggerConditions.length < 5) {
    reasons.push('Rollback plan must specify at least 5 distinct trigger conditions.');
  }

  if (!plan.postRollbackVerificationSteps || plan.postRollbackVerificationSteps.length < 2) {
    reasons.push('Rollback plan must specify at least 2 post-rollback verification steps.');
  }

  const isReady = reasons.length === 0;
  return {
    state: isReady ? 'READY' : 'NOT_READY',
    isReady,
    reasons,
  };
}

/**
 * Validates deployment provenance parity between candidate and deployed artifact.
 */
export function validateProductionDeploymentProvenance(
  prov: ProductionDeploymentProvenance
): ProductionReadinessEvaluationResult {
  const reasons: string[] = [];

  if (!prov.candidateGitSha || prov.candidateGitSha.length !== 40) {
    reasons.push(`Invalid candidate Git SHA format: "${prov.candidateGitSha}".`);
  }

  if (!prov.deployedGitSha || prov.deployedGitSha.length !== 40) {
    reasons.push(`Invalid deployed Git SHA format: "${prov.deployedGitSha}".`);
  }

  if (prov.candidateGitSha && prov.deployedGitSha && prov.candidateGitSha !== prov.deployedGitSha) {
    reasons.push(`Deployment SHA mismatch: deployed SHA "${prov.deployedGitSha}" does not match approved candidate SHA "${prov.candidateGitSha}".`);
  }

  if (!prov.deploymentId || prov.deploymentId.trim() === '') {
    reasons.push('Missing Production deployment ID.');
  }

  if (!prov.deploymentUrl || !prov.deploymentUrl.startsWith('https://')) {
    reasons.push(`Invalid Production deployment URL "${prov.deploymentUrl}". Must be HTTPS.`);
  }

  if (!prov.previewAcceptanceEvidence || prov.previewAcceptanceEvidence.trim() === '') {
    reasons.push('Missing Preview acceptance evidence reference.');
  }

  if (!prov.productionReadinessEvidence || prov.productionReadinessEvidence.trim() === '') {
    reasons.push('Missing Production readiness evidence reference.');
  }

  const isReady = reasons.length === 0;
  return {
    state: isReady ? 'READY' : 'NOT_READY',
    isReady,
    reasons,
  };
}

/**
 * Validates the completeness of the 34-scenario Production verification plan.
 */
export function validateProductionVerificationPlan(
  scenarios: ProductionVerificationScenario[]
): ProductionReadinessEvaluationResult {
  const reasons: string[] = [];

  if (!scenarios || scenarios.length < 34) {
    reasons.push(`Production verification plan has ${scenarios?.length || 0} scenarios. Must contain at least 34.`);
  }

  const expectedIds = Array.from({ length: 34 }, (_, i) => `PR-${String(i + 1).padStart(2, '0')}`);
  const presentIds = new Set(scenarios.map((s) => s.scenarioId));

  for (const id of expectedIds) {
    if (!presentIds.has(id)) {
      reasons.push(`Missing required Production verification scenario: "${id}".`);
    }
  }

  const isReady = reasons.length === 0;
  return {
    state: isReady ? 'READY' : 'NOT_READY',
    isReady,
    reasons,
  };
}

/**
 * Simulates Production language selector behavior.
 * Enforces fail-closed rules:
 * - In Production: Only PRODUCTION_READY is selectable. QA_REQUIRED, TRANSLATION_IN_PROGRESS, and REGISTERED are blocked.
 * - Client injection attempts are rejected unconditionally.
 */
export function simulateProductionSelectorEligibility(
  locale: { localeTag: string; releaseStatus: string },
  clientInjectionAttempt: boolean = false
): { isSelectable: boolean; reason: string } {
  if (clientInjectionAttempt) {
    return {
      isSelectable: false,
      reason: 'Client injection attempt rejected. Client values cannot elevate locale selectability in Production.',
    };
  }

  if (locale.releaseStatus === 'PRODUCTION_READY') {
    return {
      isSelectable: true,
      reason: 'Locale is PRODUCTION_READY and selectable in Production.',
    };
  }

  return {
    isSelectable: false,
    reason: `Locale release status "${locale.releaseStatus}" is blocked from Production selector.`,
  };
}
