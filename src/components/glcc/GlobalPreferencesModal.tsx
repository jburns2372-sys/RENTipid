"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { GlobalPreferencesModalProps } from './types';
import { useGlobalPreferences } from './useGlobalPreferences';
import { getGlccCopy } from './glcc-copy';
import { defaultTranslationEngine } from '@/lib/glcc/i18n';
import { useTranslation } from '@/lib/glcc/i18n/context';
import { LanguageSelector } from './LanguageSelector';

type PreferenceTab = 'country' | 'language' | 'currency';

export default function GlobalPreferencesModal({
  isOpen,
  onClose,
  onApplied,
  initialData,
  apiEndpoint,
  isGuest,
}: GlobalPreferencesModalProps) {
  const [activeTab, setActiveTab] = useState<PreferenceTab>('country');
  const dialogRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const {
    isLoading,
    isSaving,
    error,
    isConflict,
    capabilities,
    reconciliation,
    draft,
    serverPreference,
    selectedCountry,
    selectedLocale,
    selectedCurrency,
    previewFormattedAmount,
    previewFormattedDate,
    countryQuery,
    setCountryQuery,
    currencyQuery,
    setCurrencyQuery,
    filteredCountries,
    filteredCurrencies,
    setCountry,
    setLanguage,
    setCurrency,
    resetDraft,
    applyPreferences,
  } = useGlobalPreferences({
    initialData,
    apiEndpoint,
    isOpen,
    isGuest,
  });

  const { locale: contextLocale } = useTranslation();
  const activeUiLocale = (draft.languageTag === 'fil-PH' || contextLocale === 'fil-PH' || initialData?.effectivePreference?.languageTag === 'fil-PH') ? 'fil-PH' : 'en-PH';
  const copy = getGlccCopy(activeUiLocale);

  const handleCancel = useCallback(() => {
    resetDraft();
    onClose();
  }, [resetDraft, onClose]);

  const handleApply = useCallback(async () => {
    const result = await applyPreferences();
    if (result.success && result.effectivePreference) {
      onApplied?.(result.effectivePreference);
      onClose();
    }
  }, [applyPreferences, onApplied, onClose]);

  // Handle ESC key to cancel
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleCancel]);

  // Focus search input on tab change
  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
    }
  }, [isOpen, activeTab]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 transition-opacity animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCancel();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="glcc-modal-title"
        aria-describedby="glcc-modal-description"
        lang={draft.languageTag}
        dir={defaultTranslationEngine.getDirection(draft.languageTag)}
        className="flex flex-col w-full max-h-[92vh] sm:max-h-[88vh] sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 id="glcc-modal-title" className="text-xl font-bold text-gray-900">
              {copy.title}
            </h2>
            <p id="glcc-modal-description" className="text-xs sm:text-sm text-gray-500 mt-0.5">
              {copy.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            aria-label={copy.closeButton}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Informative Banners */}
        {reconciliation.requiresUserConfirmation && (
          <div
            role="status"
            className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-center gap-2"
          >
            <span aria-hidden="true">ℹ️</span>
            <span>{copy.reconciliationNotice}</span>
          </div>
        )}

        {isConflict && (
          <div
            role="alert"
            className="px-5 py-2.5 bg-rose-50 border-b border-rose-200 text-xs text-rose-900 font-medium flex items-center gap-2"
          >
            <span aria-hidden="true">⚠️</span>
            <span>{copy.errorConflict}</span>
          </div>
        )}

        {error && !isConflict && (
          <div
            role="alert"
            className="px-5 py-2.5 bg-rose-50 border-b border-rose-200 text-xs text-rose-800 flex items-center gap-2"
          >
            <span aria-hidden="true">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {!capabilities.v1Enabled && (
          <div
            role="alert"
            className="px-5 py-2.5 bg-gray-100 border-b border-gray-200 text-xs text-gray-700 flex items-center gap-2"
          >
            <span aria-hidden="true">🔒</span>
            <span>{copy.featureDisabled}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div role="tablist" aria-label="Preference Categories" className="flex border-b border-gray-200 px-5 pt-2 gap-2 bg-white">
          <button
            type="button"
            role="tab"
            id="glcc-tab-country"
            aria-selected={activeTab === 'country'}
            aria-controls="glcc-panel-country"
            aria-label={copy.countryTab === 'Region' ? 'Region' : `${copy.countryTab} (Region)`}
            onClick={() => setActiveTab('country')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'country'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>{copy.countryTab}</span>
            <span className="text-[10px] bg-gray-100 text-gray-700 font-bold px-1.5 py-0.5 rounded">
              {draft.countryCode}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            id="glcc-tab-language"
            aria-selected={activeTab === 'language'}
            aria-controls="glcc-panel-language"
            aria-label={copy.languageTab === 'Language' ? 'Language' : `${copy.languageTab} (Language)`}
            onClick={() => setActiveTab('language')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'language'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>{copy.languageTab}</span>
            <span className="text-[10px] bg-gray-100 text-gray-700 font-bold px-1.5 py-0.5 rounded">
              {draft.languageTag}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            id="glcc-tab-currency"
            aria-selected={activeTab === 'currency'}
            aria-controls="glcc-panel-currency"
            aria-label={copy.currencyTab === 'Currency' ? 'Currency' : `${copy.currencyTab} (Currency)`}
            onClick={() => setActiveTab('currency')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'currency'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>{copy.currencyTab}</span>
            <span className="text-[10px] bg-gray-100 text-gray-700 font-bold px-1.5 py-0.5 rounded">
              {draft.displayCurrency}
            </span>
          </button>
        </div>

        {/* Tab Panels Container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-500 text-sm">
              <svg className="animate-spin h-6 w-6 text-blue-600 mb-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>{copy.loadingState}</span>
            </div>
          ) : (
            <>
              {/* Country Panel */}
              {activeTab === 'country' && (
                <div
                  id="glcc-panel-country"
                  role="tabpanel"
                  aria-labelledby="glcc-tab-country"
                  className="space-y-3"
                >
                  <label htmlFor="country-search-input" className="block text-xs font-semibold text-gray-700">
                    {copy.countryLabel}
                  </label>
                  <input
                    ref={searchInputRef}
                    id="country-search-input"
                    type="search"
                    value={countryQuery}
                    onChange={(e) => setCountryQuery(e.target.value)}
                    placeholder={copy.countrySearchPlaceholder}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />

                  <div role="radiogroup" aria-label={copy.countryLabel} className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {filteredCountries.length === 0 ? (
                      <p className="text-xs text-gray-500 py-3 text-center">{copy.emptySearch}</p>
                    ) : (
                      filteredCountries.map((c) => {
                        const isSelected = draft.countryCode === c.code;
                        return (
                          <button
                            key={c.code}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => setCountry(c.code)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm flex items-center justify-between transition ${
                              isSelected
                                ? 'bg-blue-50/70 border-blue-500 text-blue-900 font-semibold'
                                : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'
                            }`}
                          >
                            <div>
                              <span>{c.name}</span>
                              <span className="ml-2 text-xs font-mono text-gray-400">({c.code})</span>
                            </div>
                            <span className="text-xs text-gray-500">
                              Default: <span className="font-semibold text-gray-700">{c.defaultDisplayCurrency}</span>
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Language Panel */}
              {activeTab === 'language' && (
                <div
                  id="glcc-panel-language"
                  role="tabpanel"
                  aria-labelledby="glcc-tab-language"
                  className="space-y-3"
                >
                  <LanguageSelector
                    id="glcc-language-selector"
                    currentLocale={serverPreference?.languageTag || 'en-PH'}
                    selectedLocale={draft.languageTag}
                    onSelect={(tag) => setLanguage(tag)}
                    onApply={handleApply}
                    onCancel={handleCancel}
                    showActions={false}
                    autoFocusSearch={true}
                    semanticsRole="radiogroup"
                    resolverMode={process.env.NODE_ENV === 'test' || process.env.GLCC_ENABLE_LOCAL_QA_MODE === 'true' ? 'QA' : undefined}
                  />
                </div>
              )}

              {/* Currency Panel */}
              {activeTab === 'currency' && (
                <div
                  id="glcc-panel-currency"
                  role="tabpanel"
                  aria-labelledby="glcc-tab-currency"
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <label htmlFor="currency-search-input" className="block text-xs font-semibold text-gray-700">
                      {copy.currencyLabel}
                    </label>
                    <span className="text-[11px] text-gray-500">
                      {capabilities.currencyOverrideEnabled
                        ? copy.currencyOverrideNote
                        : copy.currencyFixedNote}
                    </span>
                  </div>

                  {capabilities.currencyOverrideEnabled ? (
                    <>
                      <input
                        ref={searchInputRef}
                        id="currency-search-input"
                        type="search"
                        value={currencyQuery}
                        onChange={(e) => setCurrencyQuery(e.target.value)}
                        placeholder={copy.currencySearchPlaceholder}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />

                      <div role="radiogroup" aria-label={copy.currencyLabel} className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                        {filteredCurrencies.length === 0 ? (
                          <p className="text-xs text-gray-500 py-3 text-center">{copy.emptySearch}</p>
                        ) : (
                          filteredCurrencies.map((cur) => {
                            const isSelected = draft.displayCurrency === cur.code;
                            const isDefault = selectedCountry?.defaultDisplayCurrency === cur.code;

                            return (
                              <button
                                key={cur.code}
                                type="button"
                                role="radio"
                                aria-checked={isSelected}
                                onClick={() => setCurrency(cur.code)}
                                className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm flex items-center justify-between transition ${
                                  isSelected
                                    ? 'bg-blue-50/70 border-blue-500 text-blue-900 font-semibold'
                                    : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-base">{cur.symbol}</span>
                                  <span>{cur.name}</span>
                                  <span className="text-xs font-mono text-gray-400">({cur.code})</span>
                                </div>
                                {isDefault && (
                                  <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
                                    Default
                                  </span>
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 space-y-1.5">
                      <div className="font-semibold flex items-center gap-1.5 text-gray-900">
                        <span>🔒</span>
                        <span>{selectedCurrency?.name || draft.displayCurrency} ({draft.displayCurrency})</span>
                      </div>
                      <p className="text-gray-500 leading-relaxed">
                        {copy.currencyFixedNote}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Preview Card */}
              <div
                aria-label={copy.previewSection}
                className="mt-4 p-4 rounded-xl bg-gray-50/70 border border-gray-200/80 space-y-2.5 text-xs text-gray-700"
              >
                <div className="font-bold text-gray-900 flex items-center justify-between">
                  <span>{copy.previewSection}</span>
                  <span className="text-[10px] font-normal text-gray-500 uppercase tracking-wider">
                    Draft Configuration
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-gray-200/60">
                  <div>
                    <span className="block text-[11px] text-gray-500">{copy.previewCountry}</span>
                    <span className="font-semibold text-gray-800">{selectedCountry?.name || draft.countryCode}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-gray-500">{copy.previewLanguage}</span>
                    <span className="font-semibold text-gray-800">{selectedLocale?.name || draft.languageTag}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-gray-500">{copy.previewCurrency}</span>
                    <span className="font-semibold text-gray-800">{draft.displayCurrency}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-gray-500">{copy.previewSampleAmount}</span>
                    <span className="font-bold text-blue-600">{previewFormattedAmount}</span>
                  </div>
                </div>

                <div className="text-[11px] text-gray-500 flex items-center justify-between pt-1">
                  <span>
                    {copy.previewSampleDate}: <span className="text-gray-700 font-medium">{previewFormattedDate}</span>
                  </span>
                </div>

                <p className="text-[10px] text-gray-400 italic pt-1 border-t border-gray-100 leading-tight">
                  {copy.previewNotice}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50/50">
          <button
            id="glcc-preferences-cancel"
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg border border-gray-300 transition disabled:opacity-50"
          >
            {copy.cancelButton}
          </button>
          <button
            id="glcc-preferences-apply"
            type="button"
            onClick={handleApply}
            disabled={isSaving || !capabilities.v1Enabled || isLoading}
            className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
          >
            {isSaving && (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            <span>{isSaving ? copy.savingButton : copy.applyButton}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
