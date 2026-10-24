/**
 * RENTipid GLCC v1.0.1 — Global Preferences Copy Dictionary
 *
 * Resolves copy dynamically against the active runtime locale or an explicitly requested locale.
 */

import { t, defaultTranslationEngine } from '@/lib/glcc/i18n';

export function getGlccCopy(requestedLocale?: string) {
  const loc = requestedLocale || defaultTranslationEngine.getActiveLocale();
  return {
    get title() { return t('globalPreferences.title', undefined, loc); },
    get subtitle() { return t('globalPreferences.subtitle', undefined, loc); },
    get description() { return t('globalPreferences.description', undefined, loc); },

    // Section Headings & Tabs
    get countryTab() { return t('globalPreferences.countryTab', undefined, loc); },
    get languageTab() { return t('globalPreferences.languageTab', undefined, loc); },
    get currencyTab() { return t('globalPreferences.currencyTab', undefined, loc); },
    get previewSection() { return t('globalPreferences.previewSection', undefined, loc); },

    // Controls
    get countryLabel() { return t('globalPreferences.countryLabel', undefined, loc); },
    get countrySearchPlaceholder() { return t('globalPreferences.countrySearchPlaceholder', undefined, loc); },
    get languageLabel() { return t('globalPreferences.languageLabel', undefined, loc); },
    get languageSearchPlaceholder() { return t('globalPreferences.languageSearchPlaceholder', undefined, loc); },
    get currencyLabel() { return t('globalPreferences.currencyLabel', undefined, loc); },
    get currencySearchPlaceholder() { return t('globalPreferences.currencySearchPlaceholder', undefined, loc); },

    // Notes & Hints
    get currencyFixedNote() { return t('globalPreferences.currencyFixedNote', undefined, loc); },
    get currencyOverrideNote() { return t('globalPreferences.currencyOverrideNote', undefined, loc); },
    get previewNotice() { return t('globalPreferences.previewNotice', undefined, loc); },
    get reconciliationNotice() { return t('globalPreferences.reconciliationNotice', undefined, loc); },

    // Previews
    get previewCountry() { return t('globalPreferences.previewCountry', undefined, loc); },
    get previewLanguage() { return t('globalPreferences.previewLanguage', undefined, loc); },
    get previewCurrency() { return t('globalPreferences.previewCurrency', undefined, loc); },
    get previewSampleAmount() { return t('globalPreferences.previewSampleAmount', undefined, loc); },
    get previewSampleDate() { return t('globalPreferences.previewSampleDate', undefined, loc); },

    // Actions
    get applyButton() { return t('globalPreferences.applyButton', undefined, loc); },
    get apply() { return t('globalPreferences.applyButton', undefined, loc); },
    get cancelButton() { return t('globalPreferences.cancelButton', undefined, loc); },
    get cancel() { return t('globalPreferences.cancelButton', undefined, loc); },
    get closeButton() { return t('globalPreferences.closeButton', undefined, loc); },
    get savingButton() { return t('globalPreferences.savingButton', undefined, loc); },
    get loadingState() { return t('globalPreferences.loadingState', undefined, loc); },

    // Status & Feedback
    get emptySearch() { return t('globalPreferences.emptySearch', undefined, loc); },
    get errorGeneric() { return t('globalPreferences.errorGeneric', undefined, loc); },
    get errorConflict() { return t('globalPreferences.errorConflict', undefined, loc); },
    get errorDisallowedCurrency() { return t('globalPreferences.errorDisallowedCurrency', undefined, loc); },
    get featureDisabled() { return t('globalPreferences.featureDisabled', undefined, loc); },
  };
}

export type GlccCopyDictionary = ReturnType<typeof getGlccCopy>;

export const GLCC_COPY: GlccCopyDictionary = new Proxy({} as GlccCopyDictionary, {
  get(_target, prop: string) {
    const copy = getGlccCopy();
    return (copy as Record<string, string>)[prop];
  }
});

export type GlccCopyKey = keyof GlccCopyDictionary;
