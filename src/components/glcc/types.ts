/**
 * RENTipid GLCC v1.0 — Global Preferences UI Types & Contracts (P2A)
 *
 * Defines the presentation data models, component props, and state interfaces
 * for the reusable Global Preferences UX foundation.
 */

export interface LocaleOption {
  readonly tag: string;
  readonly name: string;
  readonly nativeName: string;
  readonly direction: 'ltr' | 'rtl';
  readonly fallbackTag?: string;
}

export interface CountryOption {
  readonly code: string;
  readonly name: string;
  readonly defaultDisplayCurrency: string;
  readonly allowedDisplayCurrencies: readonly string[];
  readonly defaultLanguageTag: string;
  readonly supportedLanguageTags: readonly string[];
}

export interface CurrencyOption {
  readonly code: string;
  readonly name: string;
  readonly symbol: string;
  readonly minorUnitExponent: number;
}

export interface GlobalPreferenceOptions {
  readonly locales: readonly LocaleOption[];
  readonly countries: readonly CountryOption[];
  readonly currencies: readonly CurrencyOption[];
}

export interface GlccCapabilities {
  readonly v1Enabled: boolean;
  readonly currencyOverrideEnabled: boolean;
  readonly countryAutodetectEnabled: boolean;
}

export interface GlccReconciliationState {
  readonly status: string;
  readonly requiresUserConfirmation: boolean;
}

export interface EffectivePreferenceState {
  readonly languageTag: string;
  readonly countryCode: string;
  readonly displayCurrency: string;
  readonly chargeCurrency: string;
  readonly timezone?: string | null;
  readonly isManualDisplayOverride?: boolean;
  readonly source?: string;
}

export interface PersistedPreferenceState {
  readonly id?: string;
  readonly userId?: string;
  readonly languageTag: string;
  readonly countryCode: string;
  readonly displayCurrency: string;
  readonly isManualDisplayOverride: boolean;
  readonly timezone?: string | null;
  readonly version: number;
  readonly createdAt?: string | Date;
  readonly updatedAt?: string | Date;
}

export interface DraftPreferenceState {
  readonly countryCode: string;
  readonly languageTag: string;
  readonly displayCurrency: string;
  readonly isManualDisplayOverride: boolean;
}

export interface GlobalPreferencesApiResponse {
  readonly status: 'SUCCESS' | 'ERROR';
  readonly reconciliationStatus?: string;
  readonly requiresUserConfirmation?: boolean;
  readonly effectivePreference: EffectivePreferenceState;
  readonly accountPreference: PersistedPreferenceState | null;
  readonly capabilities: GlccCapabilities;
  readonly options?: GlobalPreferenceOptions;
  readonly error?: string;
  readonly code?: string;
  readonly currentVersion?: number;
  readonly expectedVersion?: number;
}

export interface GlobalPreferencesModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onApplied?: (updated: EffectivePreferenceState) => void;
  readonly initialData?: GlobalPreferencesApiResponse;
  readonly apiEndpoint?: string;
  readonly isGuest?: boolean;
}

