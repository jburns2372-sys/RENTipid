"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { LocaleMetadata, LocaleReleaseStatus } from '@/lib/glcc/registry-contracts';
import { getDefaultLocaleRegistry } from '@/lib/glcc/default-registries';
import {
  isLocaleEligibleForMode,
  resolveEffectiveResolverMode,
  type ResolverMode,
} from '@/lib/glcc/locale-resolver';
import { useTranslation } from '@/lib/glcc/i18n';

export interface LanguageOptionItem {
  readonly tag: string;
  readonly name: string;
  readonly nativeName: string;
  readonly direction: 'ltr' | 'rtl';
  readonly releaseStatus: LocaleReleaseStatus;
  readonly isSelectable: boolean;
}

export interface LanguageSelectorProps {
  /** The currently applied locale tag (e.g. 'en-PH') */
  readonly currentLocale?: string;
  /** The currently pending selected locale tag */
  readonly selectedLocale?: string;
  /** Callback when candidate option is selected (pending state) */
  readonly onSelect?: (localeTag: string) => void;
  /** Callback when Apply is triggered */
  readonly onApply?: (localeTag: string) => void;
  /** Callback when Cancel is triggered */
  readonly onCancel?: () => void;
  /** Mode override for controlled QA or tests */
  readonly resolverMode?: ResolverMode;
  /** Whether to show the Apply / Cancel action buttons (default true) */
  readonly showActions?: boolean;
  /** Whether to auto-focus the search input on mount (default true) */
  readonly autoFocusSearch?: boolean;
  /** Custom container class */
  readonly className?: string;
  /** Accessible ID prefix */
  readonly id?: string;
  /** WAI-ARIA role semantics: 'listbox' (default) or 'radiogroup' */
  readonly semanticsRole?: 'listbox' | 'radiogroup';
  /** Optional custom list of locales (defaults to authoritative registry) */
  readonly locales?: readonly {
    readonly tag: string;
    readonly name: string;
    readonly nativeName?: string;
    readonly direction?: 'ltr' | 'rtl';
    readonly releaseStatus?: LocaleReleaseStatus;
  }[];
}

export function LanguageSelector({
  currentLocale: propCurrentLocale,
  selectedLocale: propSelectedLocale,
  onSelect,
  onApply,
  onCancel,
  resolverMode: propResolverMode,
  showActions = true,
  autoFocusSearch = true,
  className = '',
  id = 'rentipid-language-selector',
  semanticsRole = 'listbox',
  locales: customLocales,
}: LanguageSelectorProps) {
  const { t, locale: activeContextLocale, resolverMode: contextResolverMode } = useTranslation();

  // Determine effective applied locale
  const currentLocale = propCurrentLocale || activeContextLocale || 'en-PH';

  // State for pending selection: initialized to propSelectedLocale or currentLocale
  const [prevPropSelectedLocale, setPrevPropSelectedLocale] = useState(propSelectedLocale);
  const [pendingLocale, setPendingLocale] = useState<string>(propSelectedLocale || currentLocale);

  if (propSelectedLocale !== prevPropSelectedLocale) {
    setPrevPropSelectedLocale(propSelectedLocale);
    if (propSelectedLocale) {
      setPendingLocale(propSelectedLocale);
    }
  }

  // Determine effective resolver mode enforcing production firewall
  const effectiveMode = useMemo<ResolverMode>(() => {
    if (propResolverMode) {
      return resolveEffectiveResolverMode(propResolverMode);
    }
    if (contextResolverMode) {
      return resolveEffectiveResolverMode(contextResolverMode);
    }
    return resolveEffectiveResolverMode();
  }, [propResolverMode, contextResolverMode]);

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionsListRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  // Auto-focus search input if requested
  useEffect(() => {
    if (autoFocusSearch) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [autoFocusSearch]);

  // Load authoritative locales from registry or custom list
  const allLocales = useMemo<readonly LanguageOptionItem[]>(() => {
    const registry = getDefaultLocaleRegistry();

    if (customLocales && customLocales.length > 0) {
      return customLocales.map((loc) => {
        const regMeta = registry.get(loc.tag);
        const releaseStatus = loc.releaseStatus ?? regMeta?.releaseStatus ?? 'REGISTERED';
        const isSelectable = regMeta ? isLocaleEligibleForMode(regMeta, effectiveMode) : false;
        return {
          tag: loc.tag,
          name: loc.name || regMeta?.name || loc.tag,
          nativeName: loc.nativeName || regMeta?.nativeName || loc.name || loc.tag,
          direction: loc.direction || regMeta?.direction || 'ltr',
          releaseStatus,
          isSelectable,
        };
      });
    }

    const rawList = registry.listAll ? registry.listAll() : registry.listActive();

    return rawList.map((loc: LocaleMetadata) => {
      const isSelectable = isLocaleEligibleForMode(loc, effectiveMode);
      return {
        tag: loc.tag,
        name: loc.name || loc.englishName || loc.tag,
        nativeName: loc.nativeName || loc.name || loc.tag,
        direction: loc.direction || 'ltr',
        releaseStatus: loc.releaseStatus ?? loc.status ?? 'REGISTERED',
        isSelectable,
      };
    });
  }, [customLocales, effectiveMode]);

  // Filter locales according to search query
  const filteredLocales = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return allLocales;
    }
    return allLocales.filter(
      (l) =>
        l.nativeName.toLowerCase().includes(q) ||
        l.name.toLowerCase().includes(q) ||
        l.tag.toLowerCase().includes(q)
    );
  }, [allLocales, searchQuery]);

  // Only selectable locales can be targeted by keyboard navigation
  const selectableFilteredLocales = useMemo(() => {
    return filteredLocales.filter((l) => l.isSelectable);
  }, [filteredLocales]);

  // Candidate selection handler
  const handleSelect = useCallback(
    (tag: string, isSelectable: boolean) => {
      if (!isSelectable) {
        // Ineligible or disabled locale cannot be selected
        return;
      }
      setPendingLocale(tag);
      onSelect?.(tag);
    },
    [onSelect]
  );

  // Apply handler
  const handleApply = useCallback(() => {
    const selectedItem = allLocales.find((l) => l.tag === pendingLocale);
    if (!selectedItem || !selectedItem.isSelectable) {
      // Ineligible locale cannot be applied
      return;
    }
    onApply?.(pendingLocale);
  }, [allLocales, pendingLocale, onApply]);

  // Cancel handler
  const handleCancel = useCallback(() => {
    setPendingLocale(currentLocale);
    setSearchQuery('');
    onCancel?.();
  }, [currentLocale, onCancel]);

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (selectableFilteredLocales.length === 0) return;
        setFocusedIndex((prev) => (prev + 1) % selectableFilteredLocales.length);
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (selectableFilteredLocales.length === 0) return;
        setFocusedIndex((prev) => (prev <= 0 ? selectableFilteredLocales.length - 1 : prev - 1));
        return;
      }

      if (e.key === 'Enter' || e.key === ' ') {
        if (focusedIndex >= 0 && focusedIndex < selectableFilteredLocales.length) {
          e.preventDefault();
          const target = selectableFilteredLocales[focusedIndex];
          handleSelect(target.tag, target.isSelectable);
        }
      }
    },
    [handleCancel, selectableFilteredLocales, focusedIndex, handleSelect]
  );

  const isRadio = semanticsRole === 'radiogroup';
  const containerRole = isRadio ? 'radiogroup' : 'listbox';
  const itemRole = isRadio ? 'radio' : 'option';

  return (
    <div
      id={id}
      role="region"
      aria-label={t('preferences.language')}
      onKeyDown={handleKeyDown}
      className={`flex flex-col w-full bg-white rounded-xl ${className}`}
    >
      {/* Search Header */}
      <div className="relative mb-3">
        <label htmlFor={`${id}-search`} className="sr-only">
          {t('preferences.searchLanguages')}
        </label>
        <div className="relative flex items-center">
          {/* Search Icon */}
          <div className="absolute left-3 text-gray-400 pointer-events-none" aria-hidden="true">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            ref={searchInputRef}
            id={`${id}-search`}
            type="search"
            role="searchbox"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setFocusedIndex(-1);
            }}
            placeholder={t('preferences.searchLanguages')}
            aria-label={t('preferences.searchLanguages')}
            aria-controls={`${id}-listbox`}
            className="w-full pl-9 pr-9 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          {/* Clear button */}
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFocusedIndex(-1);
                searchInputRef.current?.focus();
              }}
              aria-label={t('common.close')}
              className="absolute right-2.5 p-1 text-gray-400 hover:text-gray-600 rounded-md transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Language List Container */}
      <div
        id={`${id}-listbox`}
        ref={optionsListRef}
        role={containerRole}
        aria-label={t('preferences.language')}
        aria-orientation="vertical"
        className="space-y-1.5 max-h-[340px] sm:max-h-[380px] overflow-y-auto pr-1 focus:outline-none"
      >
        {filteredLocales.length === 0 ? (
          <div className="py-8 text-center text-gray-500 text-sm" role="status">
            <p>{t('globalPreferences.emptySearch')}</p>
          </div>
        ) : (
          filteredLocales.map((locale) => {
            const isCurrent = locale.tag === currentLocale;
            const isPending = locale.tag === pendingLocale;
            const isKeyboardFocused =
              selectableFilteredLocales.findIndex((l) => l.tag === locale.tag) === focusedIndex;

            return (
              <button
                key={locale.tag}
                type="button"
                role={itemRole}
                id={`${id}-opt-${locale.tag}`}
                {...(isRadio ? { 'aria-checked': isPending } : { 'aria-selected': isPending })}
                aria-disabled={!locale.isSelectable}
                disabled={!locale.isSelectable}
                onClick={() => handleSelect(locale.tag, locale.isSelectable)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between min-h-[48px] touch-manipulation outline-none ${
                  !locale.isSelectable
                    ? 'opacity-40 bg-gray-50 border-gray-200 cursor-not-allowed text-gray-400'
                    : isPending
                    ? 'bg-blue-50/80 border-blue-500 text-blue-950 font-medium shadow-xs ring-1 ring-blue-500'
                    : isKeyboardFocused
                    ? 'bg-gray-100 border-gray-400 text-gray-900 ring-2 ring-blue-400'
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-800'
                }`}
              >
                {/* Language Labels */}
                <div className="flex flex-col min-w-0 pr-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Native language name (Primary identity) */}
                    <span className="text-sm font-semibold tracking-tight text-gray-900 truncate">
                      {locale.nativeName}
                    </span>
                    {/* Locale tag chip */}
                    <span className="px-1.5 py-0.5 text-[10px] font-mono uppercase bg-gray-100 text-gray-600 rounded">
                      {locale.tag}
                    </span>
                  </div>
                  {/* Secondary display name (English context) */}
                  {locale.name && locale.name !== locale.nativeName && (
                    <span className="text-xs text-gray-500 truncate mt-0.5">{locale.name}</span>
                  )}
                </div>

                {/* Status / Selection Badges & Checkmarks */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Current applied badge */}
                  {isCurrent && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {t('preferences.selectedLanguage')}
                    </span>
                  )}

                  {/* Pending selection indicator */}
                  {isPending && (
                    <div
                      className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs"
                      aria-hidden="true"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Unavailable / Coming Soon indicator */}
                  {!locale.isSelectable && (
                    <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                      {locale.releaseStatus === 'REGISTERED' || locale.releaseStatus === 'TRANSLATION_IN_PROGRESS'
                        ? 'Coming Soon'
                        : 'Unavailable'}
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Action Footer (if showActions is enabled) */}
      {showActions && (
        <div className="flex items-center justify-end gap-2.5 pt-4 mt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
          >
            {t('preferences.cancel')}
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={
              !allLocales.find((l) => l.tag === pendingLocale)?.isSelectable ||
              pendingLocale === currentLocale
            }
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs transition-colors"
          >
            {t('preferences.apply')}
          </button>
        </div>
      )}
    </div>
  );
}

export default LanguageSelector;
