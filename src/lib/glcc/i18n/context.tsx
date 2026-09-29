"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useTransition } from 'react';
import { defaultTranslationEngine, t as globalT } from './engine';
import { validateBcp47LocaleTag } from '../registry-contracts';
import type { GlccCanonicalTranslationKey, TranslationParams } from './contracts';

export interface TranslationContextValue {
  readonly locale: string;
  readonly direction: 'ltr' | 'rtl';
  readonly setLocale: (newLocale: string) => void;
  readonly t: (key: GlccCanonicalTranslationKey | string, params?: TranslationParams, fallbackText?: string) => string;
}

const TranslationContext = createContext<TranslationContextValue | null>(null);

export interface TranslationProviderProps {
  readonly children: React.ReactNode;
  readonly initialLocale?: string;
}

/**
 * Client Translation Provider
 *
 * Invariant: Consumes the server-resolved effective locale on initial render
 * ensuring SERVER_EFFECTIVE_LOCALE === CLIENT_INITIAL_EFFECTIVE_LOCALE without hydration mismatches.
 */
export function TranslationProvider({ children, initialLocale = 'en-PH' }: TranslationProviderProps) {
  // Directly initialize with server-provided initialLocale to guarantee hydration parity
  const [locale, setLocaleState] = useState<string>(initialLocale);
  const [prevInitialLocale, setPrevInitialLocale] = useState<string>(initialLocale);
  const [, startTransition] = useTransition();

  // Adjust state during render if initialLocale prop changes across route navigations (react.dev pattern)
  if (initialLocale !== prevInitialLocale) {
    setPrevInitialLocale(initialLocale);
    setLocaleState(initialLocale);
  }

  // Initialize engine and DOM with current locale
  useEffect(() => {
    defaultTranslationEngine.setActiveLocale(locale);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
      document.documentElement.dir = defaultTranslationEngine.getDirection(locale);
    }
  }, [locale]);

  // Listen for preference changes from other components/tabs
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePreferenceEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{
        languageTag?: string;
        effectivePreference?: { languageTag?: string };
      }>;
      const newTag =
        customEvent.detail?.languageTag ||
        customEvent.detail?.effectivePreference?.languageTag;

      if (newTag && validateBcp47LocaleTag(newTag).isValid) {
        setLocaleState(newTag);
        defaultTranslationEngine.setActiveLocale(newTag);
        if (typeof document !== 'undefined') {
          document.documentElement.lang = newTag;
          document.documentElement.dir = defaultTranslationEngine.getDirection(newTag);
        }
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'rentipid_locale' && e.newValue) {
        if (validateBcp47LocaleTag(e.newValue).isValid) {
          setLocaleState(e.newValue);
          defaultTranslationEngine.setActiveLocale(e.newValue);
        }
      }
    };

    window.addEventListener('rentipid:preference-applied', handlePreferenceEvent);
    window.addEventListener('rentipid:preference-changed', handlePreferenceEvent);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('rentipid:preference-applied', handlePreferenceEvent);
      window.removeEventListener('rentipid:preference-changed', handlePreferenceEvent);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const setLocale = useCallback((newLocale: string) => {
    if (!validateBcp47LocaleTag(newLocale).isValid) {
      return;
    }

    startTransition(() => {
      setLocaleState(newLocale);
      defaultTranslationEngine.setActiveLocale(newLocale);
      if (typeof document !== 'undefined') {
        document.cookie = `rentipid_locale=${encodeURIComponent(newLocale)}; path=/; max-age=2592000; SameSite=Lax`;
        document.documentElement.lang = newLocale;
        document.documentElement.dir = defaultTranslationEngine.getDirection(newLocale);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('rentipid:preference-applied', {
            detail: { languageTag: newLocale },
          })
        );
      }
    });
  }, []);

  const t = useCallback(
    (key: GlccCanonicalTranslationKey | string, params?: TranslationParams, fallbackText?: string) => {
      return defaultTranslationEngine.translate(key, params, locale, fallbackText);
    },
    [locale]
  );

  const direction = defaultTranslationEngine.getDirection(locale);

  const value: TranslationContextValue = {
    locale,
    direction,
    setLocale,
    t,
  };

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
}

export function useTranslation(): TranslationContextValue {
  const context = useContext(TranslationContext);
  if (!context) {
    // Fallback if rendered outside provider
    const currentLocale = defaultTranslationEngine.getActiveLocale();
    return {
      locale: currentLocale,
      direction: defaultTranslationEngine.getDirection(currentLocale),
      setLocale: (loc: string) => defaultTranslationEngine.setActiveLocale(loc),
      t: (key: GlccCanonicalTranslationKey | string, params?: TranslationParams, fallbackText?: string) =>
        globalT(key, params, currentLocale, fallbackText),
    };
  }
  return context;
}
