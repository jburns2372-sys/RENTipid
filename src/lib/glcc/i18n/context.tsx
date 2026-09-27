"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useTransition } from 'react';
import { defaultTranslationEngine, t as globalT } from './engine';
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

export function TranslationProvider({ children, initialLocale = 'en-PH' }: TranslationProviderProps) {
  const [locale, setLocaleState] = useState<string>(() => {
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)rentipid_locale=([^;]+)/);
      if (match && match[1]) {
        const cookieLoc = decodeURIComponent(match[1]);
        if (cookieLoc === 'fil-PH' || cookieLoc === 'en-PH') {
          return cookieLoc;
        }
      }
    }
    return initialLocale;
  });
  const [, startTransition] = useTransition();

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
      const customEvent = e as CustomEvent<{ languageTag?: string }>;
      const newTag = customEvent.detail?.languageTag;
      if (newTag && (newTag === 'fil-PH' || newTag === 'en-PH')) {
        setLocaleState(newTag);
      }
    };

    window.addEventListener('rentipid:preference-applied', handlePreferenceEvent);
    return () => window.removeEventListener('rentipid:preference-applied', handlePreferenceEvent);
  }, []);

  const setLocale = useCallback((newLocale: string) => {
    startTransition(() => {
      setLocaleState(newLocale);
      defaultTranslationEngine.setActiveLocale(newLocale);
      if (typeof document !== 'undefined') {
        document.cookie = `rentipid_locale=${encodeURIComponent(newLocale)}; path=/; max-age=2592000; SameSite=Lax`;
        document.documentElement.lang = newLocale;
        document.documentElement.dir = defaultTranslationEngine.getDirection(newLocale);
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
