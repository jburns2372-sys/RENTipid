/**
 * RENTipid GLCC v1.0 — Global Preferences Copy Dictionary (P3A Compatibility Bridge)
 *
 * MIGRATION NOTICE:
 * This dictionary is a thin backward-compatibility adapter for GLCC P2 surfaces.
 * It delegates all release-facing copy to the canonical static translation authority
 * (src/lib/glcc/i18n). Do NOT define independent copy strings here.
 * Scheduled for complete deprecation and removal in P3B.
 */

import { t } from '@/lib/glcc/i18n';

export const GLCC_COPY = {
  get title() { return t('globalPreferences.title'); },
  get subtitle() { return t('globalPreferences.subtitle'); },
  get description() { return t('globalPreferences.description'); },

  // Section Headings & Tabs
  get countryTab() { return t('globalPreferences.countryTab'); },
  get languageTab() { return t('globalPreferences.languageTab'); },
  get currencyTab() { return t('globalPreferences.currencyTab'); },
  get previewSection() { return t('globalPreferences.previewSection'); },

  // Controls
  get countryLabel() { return t('globalPreferences.countryLabel'); },
  get countrySearchPlaceholder() { return t('globalPreferences.countrySearchPlaceholder'); },
  get languageLabel() { return t('globalPreferences.languageLabel'); },
  get languageSearchPlaceholder() { return t('globalPreferences.languageSearchPlaceholder'); },
  get currencyLabel() { return t('globalPreferences.currencyLabel'); },
  get currencySearchPlaceholder() { return t('globalPreferences.currencySearchPlaceholder'); },

  // Notes & Hints
  get currencyFixedNote() { return t('globalPreferences.currencyFixedNote'); },
  get currencyOverrideNote() { return t('globalPreferences.currencyOverrideNote'); },
  get previewNotice() { return t('globalPreferences.previewNotice'); },
  get reconciliationNotice() { return t('globalPreferences.reconciliationNotice'); },

  // Previews
  get previewCountry() { return t('globalPreferences.previewCountry'); },
  get previewLanguage() { return t('globalPreferences.previewLanguage'); },
  get previewCurrency() { return t('globalPreferences.previewCurrency'); },
  get previewSampleAmount() { return t('globalPreferences.previewSampleAmount'); },
  get previewSampleDate() { return t('globalPreferences.previewSampleDate'); },

  // Actions
  get applyButton() { return t('globalPreferences.applyButton'); },
  get cancelButton() { return t('globalPreferences.cancelButton'); },
  get closeButton() { return t('globalPreferences.closeButton'); },
  get savingButton() { return t('globalPreferences.savingButton'); },
  get loadingState() { return t('globalPreferences.loadingState'); },

  // Status & Feedback
  get emptySearch() { return t('globalPreferences.emptySearch'); },
  get errorGeneric() { return t('globalPreferences.errorGeneric'); },
  get errorConflict() { return t('globalPreferences.errorConflict'); },
  get errorDisallowedCurrency() { return t('globalPreferences.errorDisallowedCurrency'); },
  get featureDisabled() { return t('globalPreferences.featureDisabled'); },
} as const;

export type GlccCopyKey = keyof typeof GLCC_COPY;
