/**
 * RENTipid GLCC v1.1 — Production Readiness Schema
 *
 * Machine-readable interfaces, change-set declarations, environment safety contracts,
 * rollback specifications, 34-scenario verification plans, and readiness state models
 * for Work Package P12-H.
 */

export type ProductionReadinessState = 'NOT_EVALUATED' | 'EVALUATING' | 'READY' | 'NOT_READY' | 'BLOCKED';

export type ProductionChangeSetCategory =
  | 'runtime_source'
  | 'translation_bundle'
  | 'locale_registry'
  | 'release_status_metadata'
  | 'environment_configuration'
  | 'database_migration'
  | 'database_seed_sync'
  | 'deployment_configuration';

export interface ProductionChangeItem {
  category: ProductionChangeSetCategory;
  status: 'REQUIRED' | 'NOT_REQUIRED';
  description: string;
  filesAffected: string[];
  justification?: string;
}

export interface ProductionChangeSetDeclaration {
  declaredChanges: ProductionChangeItem[];
  unrelatedRuntimeChangesCount: number;
  unexpectedDatabaseChangesCount: number;
  unexpectedEnvironmentChangesCount: number;
  unexpectedPackageChangesCount: number;
}

export interface ProductionCandidateInput {
  localeTag: string;
  currentReleaseState: 'QA_REQUIRED' | 'TRANSLATION_IN_PROGRESS' | 'REGISTERED' | 'PRODUCTION_READY';
  translationWorkflowState: 'APPROVED_FOR_QA' | 'IN_TRANSLATION' | 'IN_REVIEW' | 'DRAFT';
  localePackValid: boolean;
  languageQaStatus: 'PASS' | 'FAIL' | 'BLOCKED';
  legalComplianceStatus: 'PASS' | 'FAIL' | 'BLOCKED';
  previewActivationStatus: 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED';
  previewAcceptanceStatus: 'PASS' | 'FAIL' | 'BLOCKED';
  previewDeploymentProvenanceStatus: 'PASS' | 'FAIL';
  previewDatabaseIsolationStatus: 'PASS' | 'FAIL';
  previewAuthAcceptanceStatus: 'PASS' | 'FAIL';
  previewSecurityBoundariesStatus: 'PASS' | 'FAIL';
  previewFinancialBoundariesStatus: 'PASS' | 'FAIL';
  previewLegalBoundariesStatus: 'PASS' | 'FAIL';
  enPhNonRegressionStatus: 'PASS' | 'FAIL';
  filPhNonRegressionStatus: 'PASS' | 'FAIL';
  coveragePercentage: number;
  missingRequiredCount: number;
  requiredFallbackCount: number;
  rawKeyCount: number;
  criticalBlockersCount: number;
  highBlockersCount: number;
}

export interface ProductionEnvironmentSafetyInput {
  environmentIdentity: 'Production';
  productionDatabaseIdentity: string;
  productionAlias: string;
  productionSecretsExposed: boolean;
  previewCredentialsReusedAsProduction: boolean;
  testCredentialsNonCustomer: boolean;
  productionQaModeEnabled: boolean;
}

export interface ProductionDeploymentProvenance {
  candidateGitSha: string;
  deployedGitSha: string;
  deploymentId: string;
  deploymentUrl: string;
  productionAlias: string;
  localeTag: string;
  localePackChecksum: string;
  translationPackageChecksum: string;
  previewAcceptanceEvidence: string;
  productionReadinessEvidence: string;
  legalComplianceApprovalEvidence?: string;
}

export interface ProductionDatabaseChangePlan {
  schemaMigrationRequired: boolean;
  seedSyncRequired: boolean;
  migrationFile?: string;
  seedScript?: string;
  rollbackProcedureDefined: boolean;
  isExplicitlyGoverned: boolean;
  noOpEvidence?: string;
}

export interface ProductionAuthVerificationContract {
  testIdentityReference: string;
  isNonCustomer: boolean;
  hasLeastPrivilege: boolean;
  secretExposedInPayload: boolean;
  smokeScenariosCovered: string[];
}

export interface ProductionBoundaryIntegrity {
  financialAuthorityPreserved: boolean;
  rbacPreserved: boolean;
  kycPreserved: boolean;
  jurisdictionPreserved: boolean;
  legalAuthorityPreserved: boolean;
}

export interface ProductionRollbackPlan {
  targetLocaleTag: string;
  currentProductionDeploymentId: string;
  currentProductionSourceSha: string;
  currentLocaleReleaseState: string;
  currentAliasTarget: string;
  databaseRollbackProcedure: string;
  environmentRollbackProcedure: string;
  triggerConditions: string[];
  postRollbackVerificationSteps: string[];
}

export interface ProductionVerificationScenario {
  scenarioId: string;
  name: string;
  category: 'INFRASTRUCTURE' | 'SELECTOR' | 'LOCALIZATION' | 'PERSISTENCE' | 'AUTH' | 'SECURITY' | 'INVARIANTS' | 'NON_REGRESSION';
  description: string;
}

export const PRODUCTION_VERIFICATION_SCENARIOS: ProductionVerificationScenario[] = [
  { scenarioId: 'PR-01', name: 'Deployment Health', category: 'INFRASTRUCTURE', description: 'HTTP 200 on production root and health check' },
  { scenarioId: 'PR-02', name: 'Exact Source Provenance', category: 'INFRASTRUCTURE', description: 'Deployed commit SHA matches approved production candidate SHA' },
  { scenarioId: 'PR-03', name: 'Production DB Identity', category: 'INFRASTRUCTURE', description: 'Verified connected to approved Production primary DB' },
  { scenarioId: 'PR-04', name: 'Production Environment Identity', category: 'INFRASTRUCTURE', description: 'Server reports NODE_ENV=production and VERCEL_ENV=production' },
  { scenarioId: 'PR-05', name: 'Target Language Selector Visibility', category: 'SELECTOR', description: 'Target language is selectable once promoted to PRODUCTION_READY' },
  { scenarioId: 'PR-06', name: 'Non-Ready Languages Blocked', category: 'SELECTOR', description: 'QA_REQUIRED, TRANSLATION_IN_PROGRESS, and REGISTERED remain hidden' },
  { scenarioId: 'PR-07', name: 'Actual Rendered Localization', category: 'LOCALIZATION', description: 'DOM nodes reflect accurate production translation strings' },
  { scenarioId: 'PR-08', name: 'Immediate Rerender', category: 'LOCALIZATION', description: 'UI language updates instantly upon selection without page reload' },
  { scenarioId: 'PR-09', name: 'Route Persistence', category: 'PERSISTENCE', description: 'Selected locale persists across internal Next.js page transitions' },
  { scenarioId: 'PR-10', name: 'Hard Refresh Persistence', category: 'PERSISTENCE', description: 'Locale selection survives browser hard reload (Ctrl+F5)' },
  { scenarioId: 'PR-11', name: 'Correct HTML Lang', category: 'LOCALIZATION', description: 'Root <html> lang attribute matches active locale tag' },
  { scenarioId: 'PR-12', name: 'Correct Direction', category: 'LOCALIZATION', description: 'Root <html> dir attribute renders ltr or rtl correctly' },
  { scenarioId: 'PR-13', name: 'Raw Keys = 0', category: 'LOCALIZATION', description: 'Zero unformatted translation keys rendered in UI' },
  { scenarioId: 'PR-14', name: 'Required Fallback = 0', category: 'LOCALIZATION', description: 'Zero required fallbacks to English for canonical keys' },
  { scenarioId: 'PR-15', name: 'Source-Language Flash = 0', category: 'LOCALIZATION', description: 'Zero visible flash of unlocalized content during render' },
  { scenarioId: 'PR-16', name: 'Hydration Warnings = 0', category: 'LOCALIZATION', description: 'Zero React SSR/CSR hydration mismatch warnings' },
  { scenarioId: 'PR-17', name: 'Guest Behavior', category: 'AUTH', description: 'Anonymous guest users experience full localized UI' },
  { scenarioId: 'PR-18', name: 'Authenticated Login', category: 'AUTH', description: 'Test account authenticates successfully with non-customer credentials' },
  { scenarioId: 'PR-19', name: 'Authenticated Rendering', category: 'AUTH', description: 'Authenticated dashboard and account settings render in target language' },
  { scenarioId: 'PR-20', name: 'Authenticated Route Persistence', category: 'PERSISTENCE', description: 'Locale selection persists across authenticated user routes' },
  { scenarioId: 'PR-21', name: 'Authenticated Hard Refresh', category: 'PERSISTENCE', description: 'Hard refresh preserves authenticated user locale preference' },
  { scenarioId: 'PR-22', name: 'Logout', category: 'AUTH', description: 'Logout preserves valid default language without session corruption' },
  { scenarioId: 'PR-23', name: 'Locale Injection Blocked', category: 'SECURITY', description: 'Header, query parameter, and cookie injection attempts blocked' },
  { scenarioId: 'PR-24', name: 'Production QA Mode Disabled', category: 'SECURITY', description: 'QA testing mode and candidate overrides disabled / fail-closed' },
  { scenarioId: 'PR-25', name: 'Country Independence', category: 'INVARIANTS', description: 'Host property and user countries invariant to language' },
  { scenarioId: 'PR-26', name: 'Display-Currency Independence', category: 'INVARIANTS', description: 'Display currency decoupled from language selection' },
  { scenarioId: 'PR-27', name: 'Charge-Currency / Payment Authority', category: 'INVARIANTS', description: 'Checkout charge currency and gateways invariant' },
  { scenarioId: 'PR-28', name: 'Financial Authority Integrity', category: 'INVARIANTS', description: 'Fees, ledger, settlements, and refund rules invariant' },
  { scenarioId: 'PR-29', name: 'RBAC Independence', category: 'INVARIANTS', description: 'Role permissions and access controls invariant to language' },
  { scenarioId: 'PR-30', name: 'KYC Independence', category: 'INVARIANTS', description: 'Identity verification requirements and authority invariant' },
  { scenarioId: 'PR-31', name: 'Jurisdiction Independence', category: 'INVARIANTS', description: 'Statutory governing jurisdiction invariant to language' },
  { scenarioId: 'PR-32', name: 'Legal / Compliance Authority', category: 'INVARIANTS', description: 'Class C disclosures cite accredited legal versioning' },
  { scenarioId: 'PR-33', name: 'en-PH Non-Regression', category: 'NON_REGRESSION', description: 'Zero regression on baseline English (Philippines) locale' },
  { scenarioId: 'PR-34', name: 'fil-PH Non-Regression', category: 'NON_REGRESSION', description: 'Zero regression on baseline Wikang Filipino locale' },
];

export interface ProductionReadinessEvaluationResult {
  state: ProductionReadinessState;
  isReady: boolean;
  reasons: string[];
}
