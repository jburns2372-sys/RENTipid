/**
 * RENTipid GLOBAL-MKT / v2.0 — Provider Environment Status Contracts
 *
 * Defines explicit provider readiness states to prevent boolean collapse.
 * Adheres strictly to the Truthful Acceptance Rule.
 */

export const PROVIDER_ENVIRONMENT_STATUSES = [
  'NOT_CONFIGURED',
  'DOCUMENTATION_VERIFIED',
  'SANDBOX_CREDENTIALS_REQUIRED',
  'SANDBOX_CONFIGURED',
  'SANDBOX_VERIFIED',
  'PRODUCTION_ONBOARDING_REQUIRED',
  'PRODUCTION_CREDENTIALS_REQUIRED',
  'PRODUCTION_READY',
] as const;

export type ProviderEnvironmentStatus = (typeof PROVIDER_ENVIRONMENT_STATUSES)[number];

export interface ProviderEnvironmentInspection {
  readonly providerId: string;
  readonly providerName: string;
  readonly environmentStatus: ProviderEnvironmentStatus;
  readonly hasSandboxCredentials: boolean;
  readonly hasProductionCredentials: boolean;
  readonly supportedJurisdictions: readonly string[];
  readonly blockerSummary?: string;
}
