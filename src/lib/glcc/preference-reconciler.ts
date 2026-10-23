/**
 * RENTipid GLCC v1.0 — Sign-in Preference Reconciler
 *
 * Implements Owner Decision B:
 * 1. Passive previously stored guest/session preference does NOT silently overwrite
 *    an authenticated user's saved account preference during sign-in.
 * 2. Normal authenticated resolution follows established precedence contract.
 * 3. A genuinely current EXPLICIT user selection remains highest precedence.
 * 4. If current explicit guest selection conflicts with existing account preference:
 *    - Controls active session preference per P1A contract.
 *    - Does NOT automatically overwrite the account.
 *    - Returns USER_CONFIRMATION_REQUIRED indicating explicit confirmation is needed.
 * 5. Deterministic domain behavior; zero automatic writes or side effects.
 */

import {
  type EffectiveGlobalPreference,
  type PlatformDefaultPreference,
  type PreferenceInputTier,
} from './contracts';
import { resolveGlobalPreference } from './preference-resolver';
import type { RegistryContext } from './registry-contracts';

export type ReconciliationOutcome =
  | 'NO_CONFLICT'
  | 'ACCOUNT_PREFERENCE_USED'
  | 'CURRENT_EXPLICIT_SELECTION_USED'
  | 'USER_CONFIRMATION_REQUIRED'
  | 'INVALID_GUEST_PREFERENCE_IGNORED';

export interface PersistedPreferenceState {
  readonly languageTag: string;
  readonly countryCode: string;
  readonly displayCurrency: string;
  readonly isManualDisplayOverride: boolean;
  readonly timezone?: string | null;
  readonly version: number;
}

export interface GuestPreferenceState {
  readonly languageTag?: string | null;
  readonly countryCode?: string | null;
  readonly displayCurrency?: string | null;
  readonly isManualDisplayOverride?: boolean;
  readonly timezone?: string | null;
  readonly timestamp?: number | string;
  readonly isValid?: boolean;
}

export interface ReconciliationResult {
  readonly outcome: ReconciliationOutcome;
  readonly effectivePreference: EffectiveGlobalPreference;
  readonly accountSaveRequired: boolean;
  readonly candidateForAccountSave?: PreferenceInputTier;
  readonly conflictDetails?: readonly {
    readonly field: 'languageTag' | 'countryCode' | 'displayCurrency';
    readonly accountValue: string;
    readonly guestValue: string;
  }[];
}

/**
 * Pure function reconciling guest session context with saved account preferences during sign-in.
 */
export function reconcilePreferencesOnSignIn(
  accountSaved: PersistedPreferenceState | null,
  guestSession: GuestPreferenceState | null,
  registries: RegistryContext,
  platformDefault: PlatformDefaultPreference,
  asOf?: Date | string
): ReconciliationResult {
  // If guest cookie was flagged as invalid or malformed
  if (guestSession && guestSession.isValid === false) {
    const effective = resolveGlobalPreference(
      {
        accountSaved: accountSaved
          ? {
              languageTag: accountSaved.languageTag,
              countryCode: accountSaved.countryCode,
              displayCurrency: accountSaved.displayCurrency,
              isManualDisplayOverride: accountSaved.isManualDisplayOverride,
              timezone: accountSaved.timezone,
            }
          : null,
        guestSession: null, // Discard invalid guest candidate
        platformDefault,
      },
      registries,
      undefined,
      asOf
    );

    return Object.freeze({
      outcome: 'INVALID_GUEST_PREFERENCE_IGNORED',
      effectivePreference: effective,
      accountSaveRequired: false,
    });
  }

  // Case 1: User has no saved account preference yet
  if (!accountSaved) {
    // If guest had explicit manual choices, offer them for save
    const hasManualGuestChoice = Boolean(guestSession?.isManualDisplayOverride);
    const guestTier: PreferenceInputTier | null = guestSession
      ? {
          languageTag: guestSession.languageTag,
          countryCode: guestSession.countryCode,
          displayCurrency: guestSession.displayCurrency,
          isManualDisplayOverride: guestSession.isManualDisplayOverride,
          timezone: guestSession.timezone,
        }
      : null;

    const effective = resolveGlobalPreference(
      {
        guestSession: guestTier,
        platformDefault,
      },
      registries,
      undefined,
      asOf
    );

    return Object.freeze({
      outcome: hasManualGuestChoice ? 'CURRENT_EXPLICIT_SELECTION_USED' : 'NO_CONFLICT',
      effectivePreference: effective,
      accountSaveRequired: hasManualGuestChoice,
      ...(hasManualGuestChoice ? { candidateForAccountSave: guestTier! } : {}),
    });
  }

  // Case 2: User HAS a saved account preference
  const accountTier: PreferenceInputTier = {
    languageTag: accountSaved.languageTag,
    countryCode: accountSaved.countryCode,
    displayCurrency: accountSaved.displayCurrency,
    isManualDisplayOverride: accountSaved.isManualDisplayOverride,
    timezone: accountSaved.timezone,
  };

  // Check if guest has a genuinely active manual override
  const isGuestActiveOverride = Boolean(guestSession?.isManualDisplayOverride);

  if (!isGuestActiveOverride) {
    // Decision B Rule 1: A passive previously stored guest preference does NOT
    // silently overwrite an authenticated user's saved account preference.
    const effective = resolveGlobalPreference(
      {
        accountSaved: accountTier,
        guestSession: null, // Passive guest state suppressed in favor of account preference
        platformDefault,
      },
      registries,
      undefined,
      asOf
    );

    return Object.freeze({
      outcome: 'ACCOUNT_PREFERENCE_USED',
      effectivePreference: effective,
      accountSaveRequired: false,
    });
  }

  // Case 3: Guest HAS an explicit manual choice. Check for conflicts with saved account.
  const conflicts: {
    field: 'languageTag' | 'countryCode' | 'displayCurrency';
    accountValue: string;
    guestValue: string;
  }[] = [];

  if (
    guestSession?.languageTag &&
    guestSession.languageTag.toLowerCase() !== accountSaved.languageTag.toLowerCase()
  ) {
    conflicts.push({
      field: 'languageTag',
      accountValue: accountSaved.languageTag,
      guestValue: guestSession.languageTag,
    });
  }

  if (
    guestSession?.countryCode &&
    guestSession.countryCode.toUpperCase() !== accountSaved.countryCode.toUpperCase()
  ) {
    conflicts.push({
      field: 'countryCode',
      accountValue: accountSaved.countryCode,
      guestValue: guestSession.countryCode.toUpperCase(),
    });
  }

  if (
    guestSession?.displayCurrency &&
    guestSession.displayCurrency.toUpperCase() !== accountSaved.displayCurrency.toUpperCase()
  ) {
    conflicts.push({
      field: 'displayCurrency',
      accountValue: accountSaved.displayCurrency,
      guestValue: guestSession.displayCurrency.toUpperCase(),
    });
  }

  // If no conflict (guest and account values coincide)
  if (conflicts.length === 0) {
    const effective = resolveGlobalPreference(
      {
        accountSaved: accountTier,
        platformDefault,
      },
      registries,
      undefined,
      asOf
    );

    return Object.freeze({
      outcome: 'NO_CONFLICT',
      effectivePreference: effective,
      accountSaveRequired: false,
    });
  }

  // Decision B Rule 4: If an explicit guest choice conflicts with account:
  // - Controls active session preference (per P1A precedence).
  // - DO NOT automatically write to account.
  // - Return USER_CONFIRMATION_REQUIRED.
  const guestTier: PreferenceInputTier = {
    languageTag: guestSession?.languageTag,
    countryCode: guestSession?.countryCode,
    displayCurrency: guestSession?.displayCurrency,
    isManualDisplayOverride: true,
    timezone: guestSession?.timezone,
  };

  const effective = resolveGlobalPreference(
    {
      explicitChoice: guestTier, // Controls active session
      accountSaved: accountTier,
      platformDefault,
    },
    registries,
    undefined,
    asOf
  );

  return Object.freeze({
    outcome: 'USER_CONFIRMATION_REQUIRED',
    effectivePreference: effective,
    accountSaveRequired: true,
    candidateForAccountSave: guestTier,
    conflictDetails: Object.freeze(conflicts),
  });
}
