/**
 * RENTipid GLCC v1.1 — Production Activation Schema
 *
 * Machine-readable interfaces, authorization contracts, sequence specifications,
 * release-state transitions, provenance models, verification execution records,
 * and rollback execution contracts for Work Package P12-I.
 */

export type ProductionActivationLifecycleState =
  | 'ACTIVATION_PLANNED'
  | 'ACTIVATION_AUTHORIZED'
  | 'DEPLOYING'
  | 'VERIFYING'
  | 'PROMOTED'
  | 'ROLLED_BACK'
  | 'FAILED';

export interface ProductionActivationAuthorization {
  authorizationId: string;
  localeTag: string;
  candidateGitSha: string;
  localePackChecksum: string;
  translationPackageChecksum: string;
  productionReadinessEvidenceReference: string;
  authorizedProductionChangeSet: string[];
  authorizedReleaseStateTransition: {
    from: string;
    to: string;
  };
  authorizerIdentity: string;
  authorizedTimestamp: string;
}

export interface ProductionActivationPreconditions {
  authorizationPresent: boolean;
  readinessStatus: 'READY' | 'NOT_READY' | 'BLOCKED';
  currentReleaseState: string;
  previewAcceptanceStatus: string;
  canonicalCoveragePercentage: number;
  missingRequiredKeysCount: number;
  requiredFallbackCount: number;
  rawKeysCount: number;
  criticalBlockersCount: number;
  highBlockersCount: number;
  legalComplianceStatus: string;
  authIdentityAvailable: boolean;
  rollbackPlanValid: boolean;
  verificationPlanComplete: boolean;
  declaredChangeSetMatch: boolean;
}

export interface ProductionActivationProvenance {
  deploymentId: string;
  deploymentUrl: string;
  productionAlias: string;
  deployedGitSha: string;
  authorizedGitSha: string;
  localeTag: string;
  releaseState: string;
  localePackChecksum: string;
  translationPackageChecksum: string;
  environment: 'Production' | 'Preview' | 'Development';
}

export interface ProductionScenarioVerificationResult {
  scenarioId: string;
  name: string;
  category: string;
  status: 'PASS' | 'FAIL' | 'BLOCKED' | 'NOT_RUN';
  details?: string;
}

export interface ProductionVerificationExecution {
  scenarios: Record<string, ProductionScenarioVerificationResult>;
  allPassed: boolean;
  totalScenariosCount: number;
  passedScenariosCount: number;
  failedScenariosCount: number;
  blockedScenariosCount: number;
  notRunScenariosCount: number;
}

export interface ProductionPromotionDecision {
  decision: 'PROMOTE' | 'ROLLBACK';
  reason: string;
  timestamp: string;
  finalReleaseState: string;
}

export interface ProductionRollbackExecutionRecord {
  targetDeploymentId: string;
  targetSourceSha: string;
  targetAlias: string;
  restoredLocaleState: string;
  rollbackTriggerReason: string;
  rollbackExecutionStatus: 'SUCCESS' | 'FAILED';
  verificationStatus: 'PASS' | 'FAIL';
  executedAt: string;
}

export interface FailedActivationEvidenceRecord {
  authorizationId: string;
  localeTag: string;
  failedDeploymentId: string;
  failedGitSha: string;
  failureReason: string;
  failedScenarioId?: string;
  rollbackRecord: ProductionRollbackExecutionRecord;
  finalProductionDeploymentId: string;
  finalLocaleReleaseState: string;
  recordedAt: string;
}

export interface ActivationValidationResult {
  isValid: boolean;
  status: 'PASS' | 'FAIL' | 'BLOCKED';
  errors: string[];
}
