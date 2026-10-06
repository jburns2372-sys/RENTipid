/**
 * RENTipid GLCC v1.1 — Preview Activation Schema
 *
 * Machine-readable interfaces, environment contracts, provenance models,
 * selector eligibility rules, 30-scenario acceptance plans, and rollback contracts
 * for Work Package P12-G.
 */

export type PreviewAcceptanceState = 'NOT_RUN' | 'RUNNING' | 'PASS' | 'FAIL' | 'BLOCKED';

export type PreviewEnvironmentType = 'Preview' | 'Production' | 'Development' | 'Test';

export type PreviewTrustTier = 'SERVER_TRUSTED' | 'CLIENT_UNTRUSTED';

export interface PreviewCandidateInput {
  localeTag: string;
  localeCandidateState: 'CANDIDATE_FOR_QA';
  workflowState: 'APPROVED_FOR_QA' | 'IN_TRANSLATION' | 'IN_REVIEW' | 'DRAFT';
  localePackValid: boolean;
  packVersion: string;
  localePackChecksum: string;
  translationPackageChecksum: string;
  canonicalKeyCount: number;
  coveragePercentage: number;
  missingRequiredCount: number;
  requiredFallbackCount: number;
  rawKeyCount: number;
  placeholderErrorCount: number;
  formatErrorCount: number;
  unicodeErrorCount: number;
  criticalBlockerCount: number;
  highBlockerCount: number;
  qaEvidenceReference: string;
  qaStatus: 'PASS' | 'FAIL' | 'BLOCKED';
  legalEvidenceReference: string;
  legalStatus: 'PASS' | 'FAIL' | 'BLOCKED';
}

export interface PreviewDeploymentProvenance {
  candidateGitSha: string;
  deployedGitSha: string;
  branch: string;
  deploymentId: string;
  deploymentUrl: string;
  previewAlias: string;
  buildRuntimeVersion: string;
  localeTag: string;
  localePackChecksum: string;
  translationPackageChecksum: string;
  qaEvidenceReference: string;
  legalEvidenceReference: string;
}

export interface PreviewEnvironmentSafety {
  deploymentEnvironment: PreviewEnvironmentType;
  trustedRuntimeTier: 'QA' | 'Preview';
  productionTargeted: boolean;
  previewDatabaseIdentity: string;
  productionDatabaseIdentity: string;
  previewDatabaseIsolated: boolean;
  productionAliasTargeted: boolean;
  productionSecretsExposed: boolean;
  testUserProfilesOnly: boolean;
}

export interface LocaleSelectorSimulationInput {
  localeTag: string;
  releaseStatus: 'REGISTERED' | 'TRANSLATION_IN_PROGRESS' | 'QA_REQUIRED' | 'PRODUCTION_READY';
  enabled: boolean;
}

export interface SelectorEligibilityResult {
  localeTag: string;
  environment: 'Preview' | 'Production';
  isSelectable: boolean;
  reason: string;
  trustTier: PreviewTrustTier;
}

export interface PreviewScenarioDefinition {
  scenarioId: string;
  name: string;
  description: string;
  category: 'INFRASTRUCTURE' | 'SELECTOR' | 'LOCALIZATION' | 'PERSISTENCE' | 'SECURITY' | 'INVARIANTS' | 'NON_REGRESSION';
}

export const PREVIEW_ACCEPTANCE_SCENARIOS: PreviewScenarioDefinition[] = [
  { scenarioId: 'PV-01', name: 'Deployment Health', description: 'HTTP 200 on preview deployment root and health check', category: 'INFRASTRUCTURE' },
  { scenarioId: 'PV-02', name: 'Exact Deployment Provenance', description: 'Deployed git SHA matches approved candidate SHA exactly', category: 'INFRASTRUCTURE' },
  { scenarioId: 'PV-03', name: 'Preview DB Isolation', description: 'Preview DB host/name verified distinct from Production DB', category: 'INFRASTRUCTURE' },
  { scenarioId: 'PV-04', name: 'Candidate Selector Visibility', description: 'Candidate locale visible in selector under Preview mode', category: 'SELECTOR' },
  { scenarioId: 'PV-05', name: 'Non-Eligible Locale Blocking', description: 'REGISTERED and TRANSLATION_IN_PROGRESS locales remain hidden', category: 'SELECTOR' },
  { scenarioId: 'PV-06', name: 'Actual Rendered Localization', description: 'DOM nodes render candidate translations truthfully', category: 'LOCALIZATION' },
  { scenarioId: 'PV-07', name: 'Immediate Client Rerender', description: 'Language switch updates UI immediately without hard reload', category: 'LOCALIZATION' },
  { scenarioId: 'PV-08', name: 'SSR Locale Resolution', description: 'Server components parse Accept-Language and cookie correctly', category: 'LOCALIZATION' },
  { scenarioId: 'PV-09', name: 'CSR Persistence', description: 'React context and client state persist across user actions', category: 'PERSISTENCE' },
  { scenarioId: 'PV-10', name: 'Route Persistence', description: 'Locale selection persists across Next.js client navigation', category: 'PERSISTENCE' },
  { scenarioId: 'PV-11', name: 'Hard-Refresh Persistence', description: 'Browser hard refresh preserves candidate language selection', category: 'PERSISTENCE' },
  { scenarioId: 'PV-12', name: 'Correct HTML Lang', description: 'Root <html> lang attribute matches active candidate tag', category: 'LOCALIZATION' },
  { scenarioId: 'PV-13', name: 'Correct Direction', description: 'Root <html> dir attribute correctly renders ltr or rtl', category: 'LOCALIZATION' },
  { scenarioId: 'PV-14', name: 'Raw Keys = 0', description: 'Zero unformatted translation keys rendered in UI', category: 'LOCALIZATION' },
  { scenarioId: 'PV-15', name: 'Required Fallback = 0', description: 'Zero required fallbacks to English for canonical keys', category: 'LOCALIZATION' },
  { scenarioId: 'PV-16', name: 'Source-Language Flash = 0', description: 'Zero visible flash of unlocalized content during render', category: 'LOCALIZATION' },
  { scenarioId: 'PV-17', name: 'Hydration Locale Warnings = 0', description: 'Zero React SSR/CSR hydration mismatch warnings', category: 'LOCALIZATION' },
  { scenarioId: 'PV-18', name: 'Guest Flow', description: 'Anonymous guest users experience seamless localization', category: 'LOCALIZATION' },
  { scenarioId: 'PV-19', name: 'Authenticated Flow', description: 'Logged-in user profile preference syncs with candidate locale', category: 'LOCALIZATION' },
  { scenarioId: 'PV-20', name: 'Logout / Session Integrity', description: 'Session termination preserves appropriate fallback/preference', category: 'SECURITY' },
  { scenarioId: 'PV-21', name: 'Locale Injection Blocked', description: 'Host header, query parameter, and cookie injection rejected', category: 'SECURITY' },
  { scenarioId: 'PV-22', name: 'Country Independence', description: 'Country properties invariant to candidate language selection', category: 'INVARIANTS' },
  { scenarioId: 'PV-23', name: 'Display-Currency Independence', description: 'Display currency decoupled from candidate language', category: 'INVARIANTS' },
  { scenarioId: 'PV-24', name: 'Charge-Currency / Payment Authority', description: 'Checkout charge currency and gateways invariant to language', category: 'INVARIANTS' },
  { scenarioId: 'PV-25', name: 'RBAC Independence', description: 'Role permissions and access controls invariant to language', category: 'INVARIANTS' },
  { scenarioId: 'PV-26', name: 'KYC Independence', description: 'Identity verification requirements invariant to language', category: 'INVARIANTS' },
  { scenarioId: 'PV-27', name: 'Jurisdiction Independence', description: 'Statutory jurisdiction invariant to candidate UI language', category: 'INVARIANTS' },
  { scenarioId: 'PV-28', name: 'Legal / Compliance Authority', description: 'Class C legal disclosures cite accredited legal versioning', category: 'INVARIANTS' },
  { scenarioId: 'PV-29', name: 'en-PH Non-Regression', description: 'Zero regression on baseline English (Philippines) locale', category: 'NON_REGRESSION' },
  { scenarioId: 'PV-30', name: 'fil-PH Non-Regression', description: 'Zero regression on baseline Wikang Filipino locale', category: 'NON_REGRESSION' },
];

export interface PreviewScenarioResult {
  scenarioId: string;
  name: string;
  status: PreviewAcceptanceState;
  details?: string;
}

export interface PreviewAcceptanceReport {
  planVersion: string;
  localeTag: string;
  overallStatus: PreviewAcceptanceState;
  totalScenarios: number;
  passedCount: number;
  failedCount: number;
  blockedCount: number;
  results: Record<string, PreviewScenarioResult>;
}

export interface PreviewRollbackPlan {
  targetLocaleTag: string;
  previousPreviewDeploymentId: string;
  previousApprovedSourceSha: string;
  previousLocaleState: string;
  previousAliasTarget: string;
  triggerConditions: string[];
  rollbackVerificationSteps: string[];
}

export interface PreviewValidationResult {
  isValid: boolean;
  status: 'PASS' | 'FAIL' | 'BLOCKED';
  errors: string[];
}
