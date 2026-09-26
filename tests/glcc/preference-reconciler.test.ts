/**
 * RENTipid GLCC v1.0 — Sign-in Preference Reconciler Unit Tests
 *
 * Verifies Owner Decision B:
 * 1. Passive guest preference does NOT overwrite saved account preference on sign-in (ACCOUNT_PREFERENCE_USED).
 * 2. Conflicting explicit manual guest choice returns USER_CONFIRMATION_REQUIRED and sets active session
 *    without auto-writing to the account.
 * 3. Non-conflicting guest and account preferences return NO_CONFLICT.
 * 4. New user with explicit guest choice returns CURRENT_EXPLICIT_SELECTION_USED.
 * 5. Malformed/invalid guest cookie returns INVALID_GUEST_PREFERENCE_IGNORED while preserving account preference.
 */

import {
  reconcilePreferencesOnSignIn,
  type PersistedPreferenceState,
  type GuestPreferenceState,
} from '../../src/lib/glcc/preference-reconciler';
import { createInMemoryRegistryContext } from '../../src/lib/glcc/registry-contracts';
import type { PlatformDefaultPreference } from '../../src/lib/glcc/contracts';

describe('GLCC v1.0 — Sign-in Preference Reconciler (Owner Decision B)', () => {
  const registries = createInMemoryRegistryContext({
    currencies: [
      { code: 'PHP', minorUnitExponent: 2, name: 'Peso', symbol: '₱', isActive: true },
      { code: 'USD', minorUnitExponent: 2, name: 'Dollar', symbol: '$', isActive: true },
      { code: 'JPY', minorUnitExponent: 0, name: 'Yen', symbol: '¥', isActive: true },
    ],
    countries: [
      {
        code: 'PH',
        name: 'Philippines',
        defaultDisplayCurrency: 'PHP',
        allowedDisplayCurrencies: ['PHP', 'USD', 'JPY'],
        defaultLanguageTag: 'en-PH',
        supportedLanguageTags: ['en-PH', 'fil-PH'],
        isActive: true,
      },
      {
        code: 'US',
        name: 'United States',
        defaultDisplayCurrency: 'USD',
        allowedDisplayCurrencies: ['USD'],
        defaultLanguageTag: 'en-US',
        supportedLanguageTags: ['en-US'],
        isActive: true,
      },
    ],
    locales: [
      { tag: 'en-PH', language: 'en', region: 'PH', direction: 'ltr', name: 'English (PH)', nativeName: 'English', isActive: true, fallbackTag: 'en' },
      { tag: 'fil-PH', language: 'fil', region: 'PH', direction: 'ltr', name: 'Filipino', nativeName: 'Filipino', isActive: true, fallbackTag: 'en-PH' },
      { tag: 'en-US', language: 'en', region: 'US', direction: 'ltr', name: 'English (US)', nativeName: 'English', isActive: true, fallbackTag: 'en' },
    ],
  });

  const platformDefault: PlatformDefaultPreference = {
    languageTag: 'en-PH',
    countryCode: 'PH',
    displayCurrency: 'PHP',
    chargeCurrency: 'PHP',
    timezone: 'Asia/Manila',
  };

  const savedAccount: PersistedPreferenceState = {
    languageTag: 'en-PH',
    countryCode: 'PH',
    displayCurrency: 'PHP',
    isManualDisplayOverride: false,
    timezone: 'Asia/Manila',
    version: 2,
  };

  describe('Rule 1: Passive Guest Preferences Do Not Overwrite Account', () => {
    it('applies saved account preference when guest session is passive (no manual override)', () => {
      const passiveGuest: GuestPreferenceState = {
        languageTag: 'en-US',
        countryCode: 'US',
        displayCurrency: 'USD',
        isManualDisplayOverride: false, // Passive / ambient suggestion
      };

      const result = reconcilePreferencesOnSignIn(savedAccount, passiveGuest, registries, platformDefault);

      expect(result.outcome).toBe('ACCOUNT_PREFERENCE_USED');
      expect(result.accountSaveRequired).toBe(false);
      expect(result.effectivePreference.countryCode).toBe('PH');
      expect(result.effectivePreference.displayCurrency).toBe('PHP');
      expect(result.effectivePreference.languageTag).toBe('en-PH');
      expect(result.effectivePreference.provenance.country.source).toBe('ACCOUNT_SAVED');
    });
  });

  describe('Rule 4: Explicit Manual Guest Choice Conflicting with Account', () => {
    it('sets active session to explicit choice and returns USER_CONFIRMATION_REQUIRED without writing to account', () => {
      const explicitGuest: GuestPreferenceState = {
        languageTag: 'fil-PH',
        countryCode: 'PH',
        displayCurrency: 'USD', // Conflict with account PHP
        isManualDisplayOverride: true, // Explicit manual choice during guest browsing
      };

      const result = reconcilePreferencesOnSignIn(savedAccount, explicitGuest, registries, platformDefault);

      expect(result.outcome).toBe('USER_CONFIRMATION_REQUIRED');
      expect(result.accountSaveRequired).toBe(true);
      expect(result.candidateForAccountSave?.displayCurrency).toBe('USD');
      expect(result.candidateForAccountSave?.languageTag).toBe('fil-PH');

      // Invariant: Controls current active session according to P1A contract
      expect(result.effectivePreference.displayCurrency).toBe('USD');
      expect(result.effectivePreference.languageTag).toBe('fil-PH');

      // Conflict details exposed
      expect(result.conflictDetails).toBeDefined();
      expect(result.conflictDetails?.some(c => c.field === 'displayCurrency')).toBe(true);
      expect(result.conflictDetails?.some(c => c.field === 'languageTag')).toBe(true);
    });
  });

  describe('Rule 3: Non-conflicting Guest and Account Choices', () => {
    it('returns NO_CONFLICT when explicit guest values match saved account values', () => {
      const matchingGuest: GuestPreferenceState = {
        languageTag: 'en-PH',
        countryCode: 'PH',
        displayCurrency: 'PHP',
        isManualDisplayOverride: true,
      };

      const result = reconcilePreferencesOnSignIn(savedAccount, matchingGuest, registries, platformDefault);

      expect(result.outcome).toBe('NO_CONFLICT');
      expect(result.accountSaveRequired).toBe(false);
      expect(result.effectivePreference.countryCode).toBe('PH');
      expect(result.effectivePreference.displayCurrency).toBe('PHP');
    });
  });

  describe('First-time User (No Saved Account Record)', () => {
    it('returns CURRENT_EXPLICIT_SELECTION_USED and offers candidate for account save when guest made manual choice', () => {
      const explicitGuest: GuestPreferenceState = {
        languageTag: 'fil-PH',
        countryCode: 'PH',
        displayCurrency: 'USD',
        isManualDisplayOverride: true,
      };

      const result = reconcilePreferencesOnSignIn(null, explicitGuest, registries, platformDefault);

      expect(result.outcome).toBe('CURRENT_EXPLICIT_SELECTION_USED');
      expect(result.accountSaveRequired).toBe(true);
      expect(result.candidateForAccountSave?.displayCurrency).toBe('USD');
      expect(result.effectivePreference.displayCurrency).toBe('USD');
      expect(result.effectivePreference.languageTag).toBe('fil-PH');
    });

    it('returns NO_CONFLICT when guest was purely ambient for a first-time user', () => {
      const result = reconcilePreferencesOnSignIn(null, null, registries, platformDefault);

      expect(result.outcome).toBe('NO_CONFLICT');
      expect(result.accountSaveRequired).toBe(false);
      expect(result.effectivePreference.countryCode).toBe('PH');
      expect(result.effectivePreference.displayCurrency).toBe('PHP');
    });
  });

  describe('Malformed / Invalid Guest Cookie Handling', () => {
    it('ignores invalid guest cookie and preserves saved account preference', () => {
      const invalidGuest: GuestPreferenceState = {
        isValid: false, // Malformed or tampered signature
      };

      const result = reconcilePreferencesOnSignIn(savedAccount, invalidGuest, registries, platformDefault);

      expect(result.outcome).toBe('INVALID_GUEST_PREFERENCE_IGNORED');
      expect(result.accountSaveRequired).toBe(false);
      expect(result.effectivePreference.countryCode).toBe('PH');
      expect(result.effectivePreference.displayCurrency).toBe('PHP');
      expect(result.effectivePreference.provenance.country.source).toBe('ACCOUNT_SAVED');
    });
  });
});
