/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Account Context Contract
 *
 * Implements the unified global account identity model, aggregating
 * system identity, marketplace roles, operating jurisdiction, and compliance states.
 */

import type { SystemRole, MarketplaceRole } from './marketplace-role';
import type {
  ProviderOnboardingState,
  RenterOnboardingState,
  KycState,
  ProfileCompletenessReport,
} from './onboarding-state';

export interface GlobalAccountContext {
  readonly userId: string;
  readonly email: string;
  readonly fullName: string;
  readonly mobileNumber: string | null;
  readonly accountType: 'Individual' | 'Business';
  readonly accountStatus: string;
  readonly systemRole: SystemRole;
  readonly marketplaceRoles: readonly MarketplaceRole[];
  readonly operatingJurisdiction: string; // ISO 3166-1 alpha-2 resolved against GM-1
  readonly providerOnboardingState: ProviderOnboardingState;
  readonly renterOnboardingState: RenterOnboardingState;
  readonly kycState: KycState;
  readonly canActAsRenter: boolean;
  readonly canActAsProvider: boolean;
  readonly canPublishAsProvider: boolean;
  readonly profileCompleteness: ProfileCompletenessReport;
  readonly languageTag: string;
  readonly displayCurrency: string;
}
