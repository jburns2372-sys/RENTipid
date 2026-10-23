/**
 * RENTipid GLOBAL-MKT / v2.0 — MannyPay Strict Workstream Boundary
 *
 * SECTION 3 ARCHITECTURAL INVARIANT:
 * MannyPay remains a separate previously authorized workstream.
 * It is NOT merged, copied, or modified during GM-6A.
 * Its status is strictly SEPARATE_WORKSTREAM_PENDING.
 */

import { type ProviderVerificationStatus } from '../contracts/payment-provider';

export const MANNYPAY_PROVIDER_ID = 'mannypay';
export const MANNYPAY_STATUS: ProviderVerificationStatus = 'SEPARATE_WORKSTREAM_PENDING';
export const MANNYPAY_IS_GLOBAL_MKT_ACCEPTED = false;
export const MANNYPAY_IS_MODIFIED_IN_GM6A = false;

export interface MannyPayWorkstreamMetadata {
  readonly providerId: string;
  readonly status: ProviderVerificationStatus;
  readonly isGlobalMarketAccepted: boolean;
  readonly note: string;
}

export const MANNYPAY_WORKSTREAM_METADATA: Readonly<MannyPayWorkstreamMetadata> = Object.freeze({
  providerId: MANNYPAY_PROVIDER_ID,
  status: MANNYPAY_STATUS,
  isGlobalMarketAccepted: false,
  note: 'MannyPay remains an isolated separate workstream pending future integration. Not active in GLOBAL-MKT v2.0.',
});
