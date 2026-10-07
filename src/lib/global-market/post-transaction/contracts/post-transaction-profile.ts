/**
 * RENTipid GLOBAL-MKT / v2.0 — Jurisdiction Post-Transaction Profile
 *
 * Defines jurisdiction-specific parameters for deposit, cancellation, refund,
 * claim, dispute, and review policies across all 46 authoritative markets.
 */

import { type CancellationTier } from './cancellation-policy';
import { type DepositModel } from './deposit-lifecycle';

export interface JurisdictionPostTransactionProfile {
  readonly jurisdictionCode: string;
  readonly countryName: string;
  readonly defaultCancellationTier: CancellationTier;
  readonly defaultDepositModel: DepositModel;
  readonly allowsAuthorizationHold: boolean;
  readonly refundEntitlementPolicy: 'STANDARD' | 'STRICT' | 'CONSUMER_RIGHTS_RESERVED';
  readonly claimSubmissionWindowHours: number;
  readonly disputeMediationRequired: boolean;
  readonly reviewWindowDays: number;
  readonly payoutHoldOnOpenClaim: boolean;
  readonly payoutHoldOnOpenDispute: boolean;
  readonly validationStatus: 'CONFIGURED' | 'VALIDATION_REQUIRED' | 'NOT_CONFIGURED';
  readonly knownBlockers: readonly string[];
}
