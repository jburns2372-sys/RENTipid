"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  GlobalPreferencesApiResponse,
  DraftPreferenceState,
  EffectivePreferenceState,
  PersistedPreferenceState,
  GlobalPreferenceOptions,
  GlccCapabilities,
  GlccReconciliationState,
  CountryOption,
  LocaleOption,
  CurrencyOption,
} from './types';
import { GLCC_COPY } from './glcc-copy';
import { formatCurrency, formatDate, defaultTranslationEngine } from '@/lib/glcc/i18n';

export interface UseGlobalPreferencesOptions {
  readonly initialData?: GlobalPreferencesApiResponse;
  readonly apiEndpoint?: string;
  readonly isOpen?: boolean;
  readonly isGuest?: boolean;
}

export function useGlobalPreferences(options: UseGlobalPreferencesOptions = {}) {
  const { initialData, isOpen = true, isGuest } = options;
  const apiEndpoint = options.apiEndpoint ?? (isGuest ? '/api/preferences' : '/api/me/preferences');


  const [isLoading, setIsLoading] = useState<boolean>(!initialData);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isConflict, setIsConflict] = useState<boolean>(false);

  const [capabilities, setCapabilities] = useState<GlccCapabilities>(
    initialData?.capabilities ?? {
      v1Enabled: false,
      currencyOverrideEnabled: false,
      countryAutodetectEnabled: false,
    }
  );

  const [reconciliation, setReconciliation] = useState<GlccReconciliationState>({
    status: initialData?.reconciliationStatus ?? 'RESOLVED',
    requiresUserConfirmation: initialData?.requiresUserConfirmation ?? false,
  });

  const [registryOptions, setRegistryOptions] = useState<GlobalPreferenceOptions>(
    initialData?.options ?? {
      locales: [],
      countries: [],
      currencies: [],
    }
  );

  const [serverPreference, setServerPreference] = useState<EffectivePreferenceState | null>(
    initialData?.effectivePreference ?? null
  );

  const [accountPreference, setAccountPreference] = useState<PersistedPreferenceState | null>(
    initialData?.accountPreference ?? null
  );

  const [draft, setDraft] = useState<DraftPreferenceState>(() => ({
    countryCode: initialData?.effectivePreference?.countryCode ?? 'PH',
    languageTag: initialData?.effectivePreference?.languageTag ?? 'en-PH',
    displayCurrency: initialData?.effectivePreference?.displayCurrency ?? 'PHP',
    isManualDisplayOverride: initialData?.effectivePreference?.isManualDisplayOverride ?? false,
  }));

  // Track version for optimistic concurrency control
  const [version, setVersion] = useState<number>(
    initialData?.accountPreference?.version ?? 1
  );

  // Search filter states
  const [countryQuery, setCountryQuery] = useState<string>('');
  const [languageQuery, setLanguageQuery] = useState<string>('');
  const [currencyQuery, setCurrencyQuery] = useState<string>('');

  // Initial fetch effect when modal opens without initialData
  useEffect(() => {
    if (!isOpen || initialData) return;

    let isSubscribed = true;

    async function fetchInitialPreferences() {
      try {
        const res = await fetch(apiEndpoint, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });

        if (!isSubscribed) return;

        if (!res.ok) {
          if (res.status === 403) {
            setError(GLCC_COPY.featureDisabled);
          } else {
            setError(GLCC_COPY.errorGeneric);
          }
          setIsLoading(false);
          return;
        }

        const data: GlobalPreferencesApiResponse = await res.json();
        if (!isSubscribed) return;

        setCapabilities(data.capabilities);
        setReconciliation({
          status: data.reconciliationStatus ?? 'RESOLVED',
          requiresUserConfirmation: data.requiresUserConfirmation ?? false,
        });

        if (data.options) {
          setRegistryOptions(data.options);
        }

        setServerPreference(data.effectivePreference);
        setAccountPreference(data.accountPreference);

        if (data.accountPreference?.version) {
          setVersion(data.accountPreference.version);
        }

        setDraft({
          countryCode: data.effectivePreference.countryCode,
          languageTag: data.effectivePreference.languageTag,
          displayCurrency: data.effectivePreference.displayCurrency,
          isManualDisplayOverride: data.effectivePreference.isManualDisplayOverride ?? false,
        });
      } catch {
        if (isSubscribed) {
          setError(GLCC_COPY.errorGeneric);
        }
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    }

    void fetchInitialPreferences();

    return () => {
      isSubscribed = false;
    };
  }, [isOpen, initialData, apiEndpoint]);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsConflict(false);
    try {
      const res = await fetch(apiEndpoint, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        if (res.status === 403) {
          setError(GLCC_COPY.featureDisabled);
        } else {
          setError(GLCC_COPY.errorGeneric);
        }
        setIsLoading(false);
        return;
      }

      const data: GlobalPreferencesApiResponse = await res.json();
      setCapabilities(data.capabilities);
      setReconciliation({
        status: data.reconciliationStatus ?? 'RESOLVED',
        requiresUserConfirmation: data.requiresUserConfirmation ?? false,
      });

      if (data.options) {
        setRegistryOptions(data.options);
      }

      setServerPreference(data.effectivePreference);
      setAccountPreference(data.accountPreference);

      if (data.accountPreference?.version) {
        setVersion(data.accountPreference.version);
      }

      setDraft({
        countryCode: data.effectivePreference.countryCode,
        languageTag: data.effectivePreference.languageTag,
        displayCurrency: data.effectivePreference.displayCurrency,
        isManualDisplayOverride: data.effectivePreference.isManualDisplayOverride ?? false,
      });
    } catch {
      setError(GLCC_COPY.errorGeneric);
    } finally {
      setIsLoading(false);
    }
  }, [apiEndpoint]);

  // Setters preserving independence
  const setCountry = useCallback(
    (countryCode: string) => {
      const normalizedCode = countryCode.trim().toUpperCase();
      const country = registryOptions.countries.find(c => c.code === normalizedCode);
      if (!country) return;

      setError(null);
      setIsConflict(false);

      setDraft(prev => {
        // Propose configured default currency for newly selected country
        return {
          ...prev,
          countryCode: normalizedCode,
          displayCurrency: country.defaultDisplayCurrency,
          isManualDisplayOverride: false,
        };
      });
    },
    [registryOptions.countries]
  );

  const setLanguage = useCallback((languageTag: string) => {
    const normalizedTag = languageTag.trim();
    setError(null);
    setIsConflict(false);
    setDraft(prev => ({
      ...prev,
      languageTag: normalizedTag,
    }));
  }, []);

  const setCurrency = useCallback(
    (currencyCode: string) => {
      const normalizedCode = currencyCode.trim().toUpperCase();
      setError(null);
      setIsConflict(false);

      if (!capabilities.currencyOverrideEnabled) {
        setError(GLCC_COPY.currencyFixedNote);
        return;
      }

      const currentCountry = registryOptions.countries.find(c => c.code === draft.countryCode);
      if (currentCountry && !currentCountry.allowedDisplayCurrencies.includes(normalizedCode)) {
        setError(GLCC_COPY.errorDisallowedCurrency);
        return;
      }

      setDraft(prev => ({
        ...prev,
        displayCurrency: normalizedCode,
        isManualDisplayOverride: currentCountry
          ? normalizedCode !== currentCountry.defaultDisplayCurrency
          : false,
      }));
    },
    [capabilities.currencyOverrideEnabled, registryOptions.countries, draft.countryCode]
  );

  const resetDraft = useCallback(() => {
    if (serverPreference) {
      setDraft({
        countryCode: serverPreference.countryCode,
        languageTag: serverPreference.languageTag,
        displayCurrency: serverPreference.displayCurrency,
        isManualDisplayOverride: serverPreference.isManualDisplayOverride ?? false,
      });
    }
    setError(null);
    setIsConflict(false);
    setCountryQuery('');
    setLanguageQuery('');
    setCurrencyQuery('');
  }, [serverPreference]);

  const applyPreferences = useCallback(async (): Promise<{
    success: boolean;
    effectivePreference?: EffectivePreferenceState;
    conflict?: boolean;
    error?: string;
  }> => {
    setIsSaving(true);
    setError(null);
    setIsConflict(false);

    try {
      const payload = {
        countryCode: draft.countryCode,
        languageTag: draft.languageTag,
        displayCurrency: draft.displayCurrency,
        isManualDisplayOverride: draft.isManualDisplayOverride,
        expectedVersion: version,
      };

      const res = await fetch(apiEndpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data: GlobalPreferencesApiResponse = await res.json();

      if (res.status === 200 && data.effectivePreference) {
        const effectiveLng = data.effectivePreference.languageTag;
        defaultTranslationEngine.setActiveLocale(effectiveLng);
        if (typeof document !== 'undefined') {
          document.cookie = `rentipid_locale=${encodeURIComponent(effectiveLng)}; path=/; max-age=2592000; SameSite=Lax`;
          document.documentElement.lang = effectiveLng;
          document.documentElement.dir = defaultTranslationEngine.getDirection(effectiveLng);
        }
        setServerPreference(data.effectivePreference);
        setAccountPreference(data.accountPreference);
        if (data.accountPreference?.version) {
          setVersion(data.accountPreference.version);
        }
        setDraft({
          countryCode: data.effectivePreference.countryCode,
          languageTag: data.effectivePreference.languageTag,
          displayCurrency: data.effectivePreference.displayCurrency,
          isManualDisplayOverride: data.effectivePreference.isManualDisplayOverride ?? false,
        });
        setReconciliation(prev => ({ ...prev, requiresUserConfirmation: false }));
        setIsSaving(false);
        return { success: true, effectivePreference: data.effectivePreference };
      }

      if (res.status === 409) {
        setIsConflict(true);
        setError(GLCC_COPY.errorConflict);
        if (typeof data.currentVersion === 'number') {
          setVersion(data.currentVersion);
        }
        setIsSaving(false);
        return { success: false, conflict: true, error: GLCC_COPY.errorConflict };
      }

      if (res.status === 403) {
        const msg = data.error || GLCC_COPY.featureDisabled;
        setError(msg);
        setIsSaving(false);
        return { success: false, error: msg };
      }

      const msg = data.error || GLCC_COPY.errorGeneric;
      setError(msg);
      setIsSaving(false);
      return { success: false, error: msg };
    } catch {
      setError(GLCC_COPY.errorGeneric);
      setIsSaving(false);
      return { success: false, error: GLCC_COPY.errorGeneric };
    }
  }, [draft, version, apiEndpoint]);

  // Filtered lists for search behavior
  const filteredCountries = useMemo<readonly CountryOption[]>(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return registryOptions.countries;
    return registryOptions.countries.filter(
      c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [registryOptions.countries, countryQuery]);

  const filteredLocales = useMemo<readonly LocaleOption[]>(() => {
    const q = languageQuery.trim().toLowerCase();
    if (!q) return registryOptions.locales;
    return registryOptions.locales.filter(
      l =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.tag.toLowerCase().includes(q)
    );
  }, [registryOptions.locales, languageQuery]);

  const filteredCurrencies = useMemo<readonly CurrencyOption[]>(() => {
    const q = currencyQuery.trim().toLowerCase();
    const currentCountry = registryOptions.countries.find(c => c.code === draft.countryCode);
    const allowed = currentCountry ? currentCountry.allowedDisplayCurrencies : [];

    const source = registryOptions.currencies.filter(cur => allowed.includes(cur.code));

    if (!q) return source;
    return source.filter(
      cur =>
        cur.name.toLowerCase().includes(q) ||
        cur.code.toLowerCase().includes(q) ||
        cur.symbol.toLowerCase().includes(q)
    );
  }, [registryOptions.currencies, registryOptions.countries, draft.countryCode, currencyQuery]);

  // Selected entities
  const selectedCountry = useMemo(() => {
    return registryOptions.countries.find(c => c.code === draft.countryCode) ?? null;
  }, [registryOptions.countries, draft.countryCode]);

  const selectedLocale = useMemo(() => {
    return registryOptions.locales.find(l => l.tag === draft.languageTag) ?? null;
  }, [registryOptions.locales, draft.languageTag]);

  const selectedCurrency = useMemo(() => {
    return registryOptions.currencies.find(c => c.code === draft.displayCurrency) ?? null;
  }, [registryOptions.currencies, draft.displayCurrency]);

  // Preview formatting
  const previewFormattedAmount = useMemo(() => {
    return formatCurrency(1250.0, draft.displayCurrency, draft.languageTag);
  }, [draft.languageTag, draft.displayCurrency]);

  const previewFormattedDate = useMemo(() => {
    const referenceDate = new Date(Date.UTC(2026, 8, 25)); // Canonical reference date (Sept 25, 2026)
    return formatDate(referenceDate, draft.languageTag, { dateStyle: 'full' });
  }, [draft.languageTag]);

  // Check if draft has modifications compared to confirmed server state
  const isDirty = useMemo(() => {
    if (!serverPreference) return false;
    return (
      draft.countryCode !== serverPreference.countryCode ||
      draft.languageTag !== serverPreference.languageTag ||
      draft.displayCurrency !== serverPreference.displayCurrency ||
      draft.isManualDisplayOverride !== (serverPreference.isManualDisplayOverride ?? false)
    );
  }, [draft, serverPreference]);

  return {
    isLoading,
    isSaving,
    error,
    isConflict,
    isDirty,
    capabilities,
    reconciliation,
    options: registryOptions,
    serverPreference,
    accountPreference,
    draft,
    version,
    selectedCountry,
    selectedLocale,
    selectedCurrency,
    previewFormattedAmount,
    previewFormattedDate,
    countryQuery,
    setCountryQuery,
    languageQuery,
    setLanguageQuery,
    currencyQuery,
    setCurrencyQuery,
    filteredCountries,
    filteredLocales,
    filteredCurrencies,
    setCountry,
    setLanguage,
    setCurrency,
    resetDraft,
    applyPreferences,
    reload,
  };
}
