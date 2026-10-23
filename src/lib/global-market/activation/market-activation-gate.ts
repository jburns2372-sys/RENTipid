/**
 * RENTipid GLOBAL-MKT / v2.0 — Market Activation Gate
 *
 * Implements the permanent active-market rule, anti-false-active invariants,
 * separation of money/auth/payout authorities, and fail-closed commercial gating.
 */

import {
  MANDATORY_MARKET_CAPABILITIES,
  type MarketCapability,
  type MarketCapabilityRecord,
} from '../contracts/market-capability';
import {
  isActivationStateAtLeast,
  type MarketActivationState,
} from '../contracts/market-activation-state';
import type { JurisdictionProfile } from '../contracts/jurisdiction-profile';

export interface OwnerActivationGate {
  readonly ownerApproved: boolean;
  readonly approverName?: string;
  readonly approvalDate?: string;
  readonly governanceCommit?: string;
  readonly justification?: string;
}

export interface MarketActivationBlocker {
  readonly code: string;
  readonly message: string;
  readonly capability?: MarketCapability;
}

export interface MarketActivationEvaluation {
  readonly countryCode: string;
  readonly eligibleForActivation: boolean;
  readonly isCommerciallyActive: boolean;
  readonly currentState: MarketActivationState | 'UNKNOWN';
  readonly blockingCapabilities: readonly MarketCapabilityRecord[];
  readonly validationRequiredCapabilities: readonly MarketCapabilityRecord[];
  readonly blockers: readonly MarketActivationBlocker[];
  readonly failClosedReason?: string;
}

/**
 * Evaluates whether a jurisdiction profile satisfies all preconditions for commercial activation.
 *
 * Implements Fail-Closed Rule:
 * - Missing profile => FAIL CLOSED
 * - Unknown country => FAIL CLOSED
 * - Missing mandatory capability => FAIL CLOSED
 * - Non-READY capability => FAIL CLOSED
 * - Payment without payout => FAIL CLOSED
 * - Display currency / language conflated with payment/commercial readiness => FAIL CLOSED
 * - Auth conflated with KYC => FAIL CLOSED
 * - Missing Project Owner gate => FAIL CLOSED
 */
export function evaluateJurisdictionActivation(
  profile: JurisdictionProfile | null | undefined,
  ownerGate?: OwnerActivationGate
): MarketActivationEvaluation {
  // Fail-closed on missing, null, or invalid profile
  if (!profile || typeof profile !== 'object' || !profile.countryCode) {
    return {
      countryCode: profile?.countryCode ?? 'UNKNOWN',
      eligibleForActivation: false,
      isCommerciallyActive: false,
      currentState: 'UNKNOWN',
      blockingCapabilities: [],
      validationRequiredCapabilities: [],
      blockers: [
        {
          code: 'FAIL_CLOSED_MISSING_PROFILE',
          message: 'Jurisdiction profile does not exist or is invalid. Operation fails closed.',
        },
      ],
      failClosedReason: 'MISSING_OR_INVALID_PROFILE',
    };
  }

  const blockers: MarketActivationBlocker[] = [];
  const blockingCapabilities: MarketCapabilityRecord[] = [];
  const validationRequiredCapabilities: MarketCapabilityRecord[] = [];

  // Check state holds (SUSPENDED or BLOCKED)
  if (profile.activationState === 'SUSPENDED') {
    blockers.push({
      code: 'STATE_SUSPENDED',
      message: `Jurisdiction ${profile.countryCode} is commercially SUSPENDED.`,
    });
  } else if (profile.activationState === 'BLOCKED') {
    blockers.push({
      code: 'STATE_BLOCKED',
      message: `Jurisdiction ${profile.countryCode} is commercially BLOCKED.`,
    });
  }

  // Check known blockers recorded in profile
  for (const known of profile.knownBlockers ?? []) {
    blockers.push({
      code: 'KNOWN_JURISDICTION_BLOCKER',
      message: known,
    });
  }

  // Evaluate every mandatory capability
  for (const cap of MANDATORY_MARKET_CAPABILITIES) {
    const record = profile.capabilities?.[cap];
    if (!record) {
      blockers.push({
        code: 'MISSING_MANDATORY_CAPABILITY',
        message: `Mandatory capability ${cap} is missing from jurisdiction profile.`,
        capability: cap,
      });
      continue;
    }

    if (record.status !== 'READY') {
      if (record.status === 'BLOCKED' || record.status === 'NOT_CONFIGURED') {
        blockingCapabilities.push(record);
      } else if (record.status === 'VALIDATION_REQUIRED' || record.status === 'UNKNOWN' || record.status === 'PARTIAL') {
        validationRequiredCapabilities.push(record);
      }

      blockers.push({
        code: `CAPABILITY_${record.status}`,
        message: `Mandatory capability ${cap} is not READY (current: ${record.status}). Notes: ${record.notes ?? 'None'}`,
        capability: cap,
      });
    }
  }

  // Explicit Invariant: PAYMENT_COLLECTION != PROVIDER_PAYOUT
  const paymentRecord = profile.capabilities?.PAYMENT_COLLECTION;
  const payoutRecord = profile.capabilities?.PROVIDER_PAYOUT;
  if (paymentRecord?.status === 'READY' && payoutRecord?.status !== 'READY') {
    blockers.push({
      code: 'PAYMENT_WITHOUT_PAYOUT',
      message: 'Provider automated payout must be fully READY before commercial activation can be considered.',
      capability: 'PROVIDER_PAYOUT',
    });
  }
  if (payoutRecord?.status === 'READY' && paymentRecord?.status !== 'READY') {
    blockers.push({
      code: 'PAYOUT_WITHOUT_PAYMENT',
      message: 'Payment collection must be fully READY before commercial activation can be considered.',
      capability: 'PAYMENT_COLLECTION',
    });
  }

  // Explicit Invariant: AUTH != KYC
  const authRecord = profile.capabilities?.ACCOUNT_REGISTRATION;
  const kycRecord = profile.capabilities?.KYC_VERIFICATION;
  if (authRecord?.status === 'READY' && kycRecord?.status !== 'READY') {
    blockers.push({
      code: 'AUTH_WITHOUT_KYC',
      message: 'User authentication does not satisfy mandatory KYC verification.',
      capability: 'KYC_VERIFICATION',
    });
  }

  // Explicit Invariant: DISPLAY_CURRENCY != TRANSACTION_CURRENCY AUTHORITY
  const displayCurrencyRecord = profile.capabilities?.DISPLAY_CURRENCY;
  const pricingRecord = profile.capabilities?.PRICING;
  if (displayCurrencyRecord?.status === 'READY' && pricingRecord?.status !== 'READY') {
    blockers.push({
      code: 'DISPLAY_CURRENCY_WITHOUT_PRICING',
      message: 'Display currency quoting does not satisfy authorized domestic pricing and settlement authority.',
      capability: 'PRICING',
    });
  }

  // Explicit Invariant: LOCALIZATION != COMPLIANCE
  const localizationRecord = profile.capabilities?.LOCALIZATION;
  const complianceRecord = profile.capabilities?.COMPLIANCE;
  if (localizationRecord?.status === 'READY' && complianceRecord?.status !== 'READY') {
    blockers.push({
      code: 'LOCALIZATION_WITHOUT_COMPLIANCE',
      message: 'Language translation availability does not satisfy regulatory compliance obligations.',
      capability: 'COMPLIANCE',
    });
  }

  // Technical eligibility requires zero blockers
  const eligibleForActivation = blockers.length === 0;

  // Project Owner Gate Check:
  // Even if technically eligible, activation requires explicit Project Owner approval
  // and state progression to at least OWNER_ACCEPTED.
  const hasOwnerApproval = Boolean(ownerGate?.ownerApproved === true);
  if (eligibleForActivation && !hasOwnerApproval) {
    blockers.push({
      code: 'OWNER_ACCEPTANCE_REQUIRED',
      message: 'Market activation requires explicit Project Owner signoff under the RENTipid Universal Promotion Standard.',
    });
  }

  // Commercial active determination:
  // A market can be commercially active ONLY IF:
  // 1. All capabilities and technical checks pass (zero blockers)
  // 2. Owner approval has been granted
  // 3. Current activation state is 'ACTIVE'
  const isCommerciallyActive =
    eligibleForActivation &&
    hasOwnerApproval &&
    profile.activationState === 'ACTIVE';

  return {
    countryCode: profile.countryCode,
    eligibleForActivation,
    isCommerciallyActive,
    currentState: profile.activationState,
    blockingCapabilities: Object.freeze(blockingCapabilities),
    validationRequiredCapabilities: Object.freeze(validationRequiredCapabilities),
    blockers: Object.freeze(blockers),
  };
}

/**
 * Evaluates whether a market can be commercially activated.
 * Returns true ONLY IF all capabilities are READY, zero blockers exist, and owner signoff is present.
 */
export function canActivateJurisdiction(
  profile: JurisdictionProfile | null | undefined,
  ownerGate?: OwnerActivationGate
): boolean {
  if (!profile) return false;
  const evalResult = evaluateJurisdictionActivation(profile, ownerGate);
  return evalResult.eligibleForActivation && Boolean(ownerGate?.ownerApproved);
}

/**
 * Returns user-readable reasons why a market cannot be activated.
 */
export function explainJurisdictionBlockers(
  profile: JurisdictionProfile | null | undefined
): readonly MarketActivationBlocker[] {
  const evalResult = evaluateJurisdictionActivation(profile);
  return evalResult.blockers;
}
