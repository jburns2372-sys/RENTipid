/**
 * RENTipid GLCC v1.1 — Language-Specific QA Schema
 *
 * Machine-readable interfaces, domain definitions, execution state models,
 * and zero-tolerance metric contracts for Work Package P12-E.
 */

export type QaExecutionState = 'NOT_RUN' | 'RUNNING' | 'PASS' | 'FAIL' | 'BLOCKED';

export interface LanguageQaDomainDefinition {
  domainId: string;
  name: string;
  description: string;
  defaultRequired: boolean;
}

export const ALL_QA_DOMAINS: LanguageQaDomainDefinition[] = [
  { domainId: 'QA-01', name: 'Translation Integrity', description: 'Zero missing, zero extra, valid placeholders', defaultRequired: true },
  { domainId: 'QA-02', name: 'Selector Eligibility', description: 'Mode-aware selector gating and fail-closed state', defaultRequired: true },
  { domainId: 'QA-03', name: 'Client Immediate Rerender', description: 'Instant DOM rerender upon apply without reload', defaultRequired: true },
  { domainId: 'QA-04', name: 'SSR Locale Resolution', description: 'Server components resolve matching initial locale', defaultRequired: true },
  { domainId: 'QA-05', name: 'CSR Locale Persistence', description: 'Client context and preference state persistence', defaultRequired: true },
  { domainId: 'QA-06', name: 'Route Persistence', description: 'Locale maintained across internal navigation', defaultRequired: true },
  { domainId: 'QA-07', name: 'Hard Refresh Persistence', description: 'Cookie/session state survives browser hard reload', defaultRequired: true },
  { domainId: 'QA-08', name: 'Guest Experience', description: 'Anonymous users experience full localization', defaultRequired: true },
  { domainId: 'QA-09', name: 'Authenticated Experience', description: 'User profile preference sync and account localization', defaultRequired: true },
  { domainId: 'QA-10', name: 'HTML lang / Direction', description: 'Root HTML element lang and dir attributes', defaultRequired: true },
  { domainId: 'QA-11', name: 'Hydration / Visible Language Flash', description: 'Zero React hydration warnings, zero visible FOUC', defaultRequired: true },
  { domainId: 'QA-12', name: 'Raw Key / Fallback Detection', description: 'Zero raw keys, zero unapproved fallbacks', defaultRequired: true },
  { domainId: 'QA-13', name: 'Locale Injection Security', description: 'Sanitization of headers, query params, cookies', defaultRequired: true },
  { domainId: 'QA-14', name: 'Country Independence', description: 'Locale changes do not alter host country', defaultRequired: true },
  { domainId: 'QA-15', name: 'Display Currency Independence', description: 'Display currency decoupled from language', defaultRequired: true },
  { domainId: 'QA-16', name: 'Charge Currency / Payment Authority', description: 'Checkout and payment processors invariant', defaultRequired: true },
  { domainId: 'QA-17', name: 'RBAC Independence', description: 'User roles and permissions invariant to language', defaultRequired: true },
  { domainId: 'QA-18', name: 'KYC Independence', description: 'Verification authority and rules invariant', defaultRequired: true },
  { domainId: 'QA-19', name: 'Jurisdiction Independence', description: 'Governing legal jurisdiction invariant', defaultRequired: true },
  { domainId: 'QA-20', name: 'Legal / Compliance Authority', description: 'Class C terms versioning and legal provenance', defaultRequired: true },
  { domainId: 'QA-21', name: 'Generated / User Content Boundary', description: 'Preservation of Class D UGC and Class E disclaimers', defaultRequired: true },
  { domainId: 'QA-22', name: 'Accessibility / Layout Expansion', description: 'Resilience against label length expansion and wrapping', defaultRequired: true },
  { domainId: 'QA-23', name: 'RTL Capability', description: 'Right-to-left layout and alignment when applicable', defaultRequired: false },
  { domainId: 'QA-24', name: 'Non-Regression of en-PH / fil-PH', description: 'Preservation of production baseline locales', defaultRequired: true },
];

export interface LanguageQaDomainPlan {
  domainId: string;
  name: string;
  required: boolean;
  status: QaExecutionState;
  scenarioCount: number;
  passedCount: number;
  failedCount: number;
  blockedCount: number;
  evidenceReferences: string[];
  notes: string;
}

export interface LanguageQaPlan {
  qaPlanVersion: string;
  localeTag: string;
  localePackChecksum: string;
  canonicalKeyCount: number;
  direction: 'ltr' | 'rtl';
  fallbackLocale: string;
  requiredDomains: string[];
  optionalDomains: string[];
  executionEnvironment: string;
  generatedAt: string;
  domains: Record<string, LanguageQaDomainPlan>;
}

export interface LanguageQaMetrics {
  rawKeyCount: number;
  requiredFallbackCount: number;
  hydrationWarningCount: number;
  visibleSourceLanguageFlashCount: number;
  placeholderMismatchCount: number;
  securityBoundaryFailures: number;
  financialBoundaryFailures: number;
  authorityBoundaryFailures: number;
}

export interface LanguageQaDomainResult {
  domainId: string;
  name: string;
  status: 'PASS' | 'FAIL' | 'BLOCKED';
  scenarioCount: number;
  passedCount: number;
  failedCount: number;
  blockedCount: number;
  evidenceReferences: string[];
  notes: string;
}

export interface LanguageQaResult {
  qaResultVersion: string;
  localeTag: string;
  localePackChecksum: string;
  executionEnvironment: string;
  overallStatus: 'PASS' | 'FAIL' | 'BLOCKED';
  startedAt: string;
  completedAt: string;
  summary: {
    totalDomains: number;
    passedDomains: number;
    failedDomains: number;
    blockedDomains: number;
    totalScenarios: number;
    passedScenarios: number;
    failedScenarios: number;
  };
  metrics: LanguageQaMetrics;
  domainResults: Record<string, LanguageQaDomainResult>;
  errors: string[];
  warnings: string[];
}
