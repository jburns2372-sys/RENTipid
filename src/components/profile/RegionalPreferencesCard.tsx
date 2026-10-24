"use client";

import React, { useState, useEffect } from 'react';
import { GlobalPreferencesModal, GLCC_COPY } from '@/components/glcc';
import type { EffectivePreferenceState } from '@/components/glcc';
import {
  t,
  getCountryDisplayName,
  getLanguageDisplayName,
  defaultTranslationEngine,
} from '@/lib/glcc/i18n';

interface RegionalPreferencesCardProps {
  readonly className?: string;
}

interface PreferencesData {
  effectivePreference: EffectivePreferenceState;
  capabilities: {
    v1Enabled: boolean;
    currencyOverrideEnabled: boolean;
    countryAutodetectEnabled: boolean;
    chargeCurrency: string;
  };
  reconciliationStatus?: string;
  requiresUserConfirmation?: boolean;
}

export default function RegionalPreferencesCard({ className = '' }: RegionalPreferencesCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<PreferencesData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isSubscribed = true;

    async function loadPreferences() {
      try {
        const res = await fetch('/api/me/preferences', {
          headers: { Accept: 'application/json' },
        });

        if (!isSubscribed) return;

        if (!res.ok) {
          if (res.status === 403 || res.status === 503) {
            setError(GLCC_COPY.featureDisabled);
          } else {
            setError(GLCC_COPY.errorGeneric);
          }
          setIsLoading(false);
          return;
        }

        const json = await res.json();
        if (!isSubscribed) return;

        setData(json);
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

    void loadPreferences();

    return () => {
      isSubscribed = false;
    };
  }, []);

  const handleApplied = (updated: EffectivePreferenceState) => {
    setData((prev) =>
      prev
        ? {
            ...prev,
            effectivePreference: updated,
            requiresUserConfirmation: false,
          }
        : null
    );
    setIsModalOpen(false);
  };

  // If feature is disabled by flag, cleanly suppress or display notice
  if (data && !data.capabilities.v1Enabled) {
    return null;
  }

  const effectiveLocale = data?.effectivePreference.languageTag || 'en-PH';
  const effectiveDir = defaultTranslationEngine.getDirection(effectiveLocale);

  return (
    <div
      lang={effectiveLocale}
      dir={effectiveDir}
      className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 ${className}`}
    >
      <div className="flex justify-between items-center mb-6 border-b pb-2">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{t('account.preferences.title', undefined, effectiveLocale)}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {t('account.preferences.description', undefined, effectiveLocale)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          disabled={isLoading || Boolean(error)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50 transition-colors"
          aria-label={t('account.preferences.editAriaLabel', undefined, effectiveLocale)}
        >
          {t('account.preferences.editButton', undefined, effectiveLocale)}
        </button>
      </div>

      {data?.requiresUserConfirmation && (
        <div
          role="status"
          className="p-3 mb-6 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span aria-hidden="true">ℹ️</span>
            <span>{GLCC_COPY.reconciliationNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="text-amber-800 font-semibold underline text-xs ml-3 hover:text-amber-950 shrink-0"
          >
            {t('globalPreferences.reviewNotice', undefined, effectiveLocale)}
          </button>
        </div>
      )}

      {error ? (
        <div className="p-4 rounded-md bg-amber-50 text-amber-800 text-sm">
          {error}
        </div>
      ) : isLoading ? (
        <div className="py-6 text-center text-sm text-gray-400">
          {GLCC_COPY.loadingState}
        </div>
      ) : data?.effectivePreference ? (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-4 rounded-lg bg-gray-50/70 border border-gray-100">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              {GLCC_COPY.languageLabel}
            </label>
            <p className="font-semibold text-gray-900 text-base">
              {data.effectivePreference.languageTag === 'en-PH'
                ? 'English (Philippines)'
                : data.effectivePreference.languageTag === 'fil-PH'
                ? 'Filipino'
                : getLanguageDisplayName(data.effectivePreference.languageTag, effectiveLocale)}
            </p>
            <span className="text-xs text-gray-400 font-mono mt-0.5 block">
              {data.effectivePreference.languageTag}
            </span>
          </div>

          <div className="p-4 rounded-lg bg-gray-50/70 border border-gray-100">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              {GLCC_COPY.countryLabel}
            </label>
            <p className="font-semibold text-gray-900 text-base">
              {data.effectivePreference.countryCode === 'PH'
                ? 'Philippines'
                : getCountryDisplayName(data.effectivePreference.countryCode, effectiveLocale)}
            </p>
            <span className="text-xs text-gray-400 font-mono mt-0.5 block">
              {t('account.preferences.regionCode', { code: data.effectivePreference.countryCode }, effectiveLocale)}
            </span>
          </div>

          <div className="p-4 rounded-lg bg-gray-50/70 border border-gray-100">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              {GLCC_COPY.currencyLabel}
            </label>
            <p className="font-semibold text-gray-900 text-base">
              {data.effectivePreference.displayCurrency}
            </p>
            <span className="text-xs text-gray-400 mt-0.5 block">
              {data.effectivePreference.isManualDisplayOverride ? t('account.preferences.manualOverride', undefined, effectiveLocale) : t('account.preferences.standardDefault', undefined, effectiveLocale)}
            </span>
          </div>

          <div className="md:col-span-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
            <span>
              <strong>{t('globalPreferences.notePrefix', undefined, effectiveLocale)}</strong> {GLCC_COPY.previewNotice}
            </span>
          </div>
        </div>
      ) : null}

      {isModalOpen && (
        <GlobalPreferencesModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onApplied={handleApplied}
          apiEndpoint="/api/me/preferences"
          isGuest={false}
        />
      )}
    </div>
  );
}
