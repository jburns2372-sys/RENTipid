'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookiePreferencesPage() {
  const [preferences, setPreferences] = useState({
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load current preferences from localStorage if exists
    const stored = localStorage.getItem('rentipid_cookie_consent');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPreferences({
          ...parsed,
          necessary: true, // Always true
        });
      } catch {}
    }
  }, []);

  const handleSave = async (action: 'ACCEPT_ALL' | 'REJECT_OPTIONAL' | 'SAVE_GRANULAR' | 'WITHDRAW') => {
    setIsSaving(true);
    setSaved(false);

    let newPrefs = { ...preferences };

    if (action === 'ACCEPT_ALL') {
      newPrefs = { necessary: true, functional: true, analytics: true, marketing: true };
    } else if (action === 'REJECT_OPTIONAL' || action === 'WITHDRAW') {
      newPrefs = { necessary: true, functional: false, analytics: false, marketing: false };
    }

    setPreferences(newPrefs);

    try {
      await fetch('/api/privacy/cookies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          preferences: newPrefs
        }),
      });

      localStorage.setItem('rentipid_cookie_consent', JSON.stringify(newPrefs));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      console.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Cookie Preferences</h1>
      <p className="text-gray-600 mb-8">
        We use cookies and similar tracking technologies to enhance your experience, improve site performance, and assist in our marketing efforts. You can manage your preferences below.
      </p>

      {saved && (
        <div className="bg-green-50 text-green-700 p-4 rounded mb-6 border border-green-200">
          Your cookie preferences have been saved successfully.
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold">Strictly Necessary Cookies</h2>
            <span className="text-sm font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">Always Active</span>
          </div>
          <p className="text-sm text-gray-600">
            These cookies are essential for the website to function properly. They enable basic features like page navigation, secure areas access, and maintaining your session. The website cannot function correctly without these cookies.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold">Functional Cookies</h2>
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input aria-label="Functional Cookies" type="checkbox" className="sr-only" checked={preferences.functional} onChange={() => setPreferences({...preferences, functional: !preferences.functional})} />
                <div className={`block w-10 h-6 rounded-full transition-colors ${preferences.functional ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${preferences.functional ? 'transform translate-x-4' : ''}`}></div>
              </div>
            </label>
          </div>
          <p className="text-sm text-gray-600">
            These cookies enable the website to provide enhanced functionality and personalization, such as remembering your preferences and settings.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold">Analytics Cookies</h2>
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input aria-label="Analytics Cookies" type="checkbox" className="sr-only" checked={preferences.analytics} onChange={() => setPreferences({...preferences, analytics: !preferences.analytics})} />
                <div className={`block w-10 h-6 rounded-full transition-colors ${preferences.analytics ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${preferences.analytics ? 'transform translate-x-4' : ''}`}></div>
              </div>
            </label>
          </div>
          <p className="text-sm text-gray-600">
            These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. They are used to improve the performance of our site.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold">Marketing Cookies</h2>
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input aria-label="Marketing Cookies" type="checkbox" className="sr-only" checked={preferences.marketing} onChange={() => setPreferences({...preferences, marketing: !preferences.marketing})} />
                <div className={`block w-10 h-6 rounded-full transition-colors ${preferences.marketing ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${preferences.marketing ? 'transform translate-x-4' : ''}`}></div>
              </div>
            </label>
          </div>
          <p className="text-sm text-gray-600">
            These cookies are used to track visitors across websites. The intention is to display ads that are relevant and engaging for the individual user and thereby more valuable for publishers and third party advertisers.
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <button 
          onClick={() => handleSave('SAVE_GRANULAR')}
          disabled={isSaving}
          className="flex-1 bg-white border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded hover:bg-gray-50"
        >
          Save Preferences
        </button>
        <button 
          onClick={() => handleSave('REJECT_OPTIONAL')}
          disabled={isSaving}
          className="flex-1 bg-gray-100 text-gray-800 font-medium py-2 px-4 rounded hover:bg-gray-200"
        >
          Reject Optional
        </button>
        <button 
          onClick={() => handleSave('ACCEPT_ALL')}
          disabled={isSaving}
          className="flex-1 bg-blue-600 text-white font-medium py-2 px-4 rounded hover:bg-blue-700"
        >
          Accept All
        </button>
      </div>

      <div className="mt-8 text-center">
        <button 
          onClick={() => handleSave('WITHDRAW')}
          className="text-red-600 hover:underline text-sm font-medium"
        >
          Withdraw Consent
        </button>
        <span className="mx-4 text-gray-300">|</span>
        <Link href="/privacy" className="text-blue-700 hover:underline text-sm font-medium">
          Return to Privacy Policy
        </Link>
      </div>
    </div>
  );
}


