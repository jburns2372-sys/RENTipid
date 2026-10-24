"use client";

import React, { useState, useEffect, useRef } from 'react';
import type { EffectivePreferenceState } from './types';
import GlobalPreferencesModal from './GlobalPreferencesModal';
import { t, defaultTranslationEngine } from '@/lib/glcc/i18n';

export interface GlobalPreferencesTriggerProps {
  readonly isGuest?: boolean;
  readonly className?: string;
  readonly variant?: 'header' | 'compact' | 'text';
}

interface SummaryState {
  countryCode: string;
  languageTag: string;
  displayCurrency: string;
}

export default function GlobalPreferencesTrigger({
  isGuest = false,
  className = '',
  variant = 'header',
}: GlobalPreferencesTriggerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const [preference, setPreference] = useState<SummaryState>({
    countryCode: 'PH',
    languageTag: 'en-PH',
    displayCurrency: 'PHP',
  });
  const triggerRef = useRef<HTMLButtonElement>(null);

  const endpoint = isGuest ? '/api/preferences' : '/api/me/preferences';

  useEffect(() => {
    let isSubscribed = true;

    async function loadPreferenceSummary() {
      try {
        const res = await fetch(endpoint, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });

        if (!isSubscribed) return;

        if (!res.ok) {
          if (res.status === 403 || res.status === 503) {
            setIsEnabled(false);
          } else if (res.status === 401 && !isGuest) {
            // Fall back to guest endpoint if unauthenticated
            const guestRes = await fetch('/api/preferences', {
              headers: { Accept: 'application/json' },
            });
            if (guestRes.ok && isSubscribed) {
              const guestData = await guestRes.json();
              setIsEnabled(Boolean(guestData.capabilities?.v1Enabled));
              if (guestData.effectivePreference) {
                setPreference({
                  countryCode: guestData.effectivePreference.countryCode || 'PH',
                  languageTag: guestData.effectivePreference.languageTag || 'en-PH',
                  displayCurrency: guestData.effectivePreference.displayCurrency || 'PHP',
                });
              }
              return;
            }
            setIsEnabled(false);
          } else {
            setIsEnabled(false);
          }
          return;
        }

        const data = await res.json();
        if (!isSubscribed) return;

        setIsEnabled(Boolean(data.capabilities?.v1Enabled));
        if (data.effectivePreference) {
          setPreference({
            countryCode: data.effectivePreference.countryCode || 'PH',
            languageTag: data.effectivePreference.languageTag || 'en-PH',
            displayCurrency: data.effectivePreference.displayCurrency || 'PHP',
          });
        }
      } catch {
        if (isSubscribed) {
          setIsEnabled(false);
        }
      }
    }

    void loadPreferenceSummary();

    return () => {
      isSubscribed = false;
    };
  }, [endpoint, isGuest]);

  // If feature flag evaluation failed or disabled, do not render a dead control
  if (isEnabled === false) {
    return null;
  }

  const handleApplied = (updated: EffectivePreferenceState) => {
    setPreference({
      countryCode: updated.countryCode,
      languageTag: updated.languageTag,
      displayCurrency: updated.displayCurrency,
    });
    setIsModalOpen(false);
    triggerRef.current?.focus();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('rentipid:preference-applied', {
          detail: {
            languageTag: updated.languageTag,
            countryCode: updated.countryCode,
            displayCurrency: updated.displayCurrency,
          },
        })
      );
      window.dispatchEvent(new CustomEvent('rentipid:preference-changed', { detail: updated }));
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsModalOpen(true)}
        aria-label={t(
          'globalPreferences.triggerLabel',
          {
            language: preference.languageTag,
            country: preference.countryCode,
            currency: preference.displayCurrency,
          },
          preference.languageTag
        )}
        aria-haspopup="dialog"
        aria-expanded={isModalOpen}
        lang={preference.languageTag}
        dir={defaultTranslationEngine.getDirection(preference.languageTag)}
        className={
          className ||
          'inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs sm:text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[38px] touch-manipulation'
        }
      >
        {/* Globe icon */}
        <svg
          className="w-4 h-4 text-gray-500 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
          />
        </svg>

        {variant === 'text' ? (
          <span>
            {t(
              'globalPreferences.triggerText',
              {
                country: preference.countryCode,
                currency: preference.displayCurrency,
              },
              preference.languageTag
            )}
          </span>
        ) : (
          <>
            <span className="hidden sm:inline">
              {preference.countryCode} · {preference.displayCurrency}
            </span>
            <span className="sm:hidden font-semibold text-xs">
              {preference.displayCurrency}
            </span>
          </>
        )}
      </button>

      {isModalOpen && (
        <GlobalPreferencesModal
          isOpen={isModalOpen}
          onClose={handleClose}
          onApplied={handleApplied}
          isGuest={isGuest}
          apiEndpoint={endpoint}
        />
      )}
    </>
  );
}
