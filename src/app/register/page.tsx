"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/lib/glcc/i18n';
import { GLOBAL_COUNTRY_CATALOG } from '@/lib/glcc/country/country-registry';

export default function RegisterRenter() {
  const { t } = useTranslation();
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirm = formData.get('confirm_password') as string;

    if (password !== confirm) {
      setError(t('auth.errors.passwordMismatch'));
      setLoading(false);
      return;
    }

    const payload = {
      full_name: formData.get('full_name'),
      email: formData.get('email'),
      mobile_number: formData.get('mobile_number'),
      password,
      account_type: 'Individual',
      role: 'Renter',
      address: formData.get('address'),
      city: formData.get('city'),
      province: formData.get('province'),
      country: formData.get('country') || 'Philippines',
    };

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        router.push('/login?registered=true');
      } else {
        const data = await res.json();
        setError(data.message || t('auth.errors.registrationFailed'));
      }
    } catch (err) {
      setError(t('auth.errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-lg">
      <div className="bg-white p-8 rounded-xl shadow-sm border">
        <h1 className="text-3xl font-bold mb-2 text-center text-blue-600">{t('auth.register.title')}</h1>
        <p className="text-gray-600 mb-8 text-center">{t('auth.register.subtitle')}</p>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-6 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('auth.register.fullName')}</label>
            <input name="full_name" required className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('auth.register.email')}</label>
              <input type="email" name="email" required className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('auth.register.mobileNumber')}</label>
              <input type="tel" name="mobile_number" required className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('auth.register.password')}</label>
              <input type="password" name="password" required className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('auth.register.confirmPassword')}</label>
              <input type="password" name="confirm_password" required className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
            </div>
          </div>

          <div className="pt-4">
            <h3 className="font-semibold text-gray-800 border-b pb-2 mb-4">{t('auth.register.locationDetails')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Country / Operating Jurisdiction</label>
                <select
                  name="country"
                  defaultValue="PH"
                  className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none bg-white text-gray-900"
                >
                  {GLOBAL_COUNTRY_CATALOG.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('auth.register.address')}</label>
                <input name="address" className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('auth.register.city')}</label>
                  <input name="city" className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('auth.register.province')}</label>
                  <input name="province" className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-start">
            <input type="checkbox" required className="mt-1 mr-2" />
            <span className="text-sm text-gray-600">
              {t('auth.iAgreeToThe')}{' '}
              <Link href="/terms" className="text-blue-600 hover:underline">
                {t('auth.termsOfService')}
              </Link>{' '}
              {t('auth.and')}{' '}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                {t('auth.privacyPolicy')}
              </Link>.
            </span>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 transition disabled:opacity-50 mt-6"
          >
            {loading ? t('auth.register.submitting') : t('auth.register.submit')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          {t('auth.register.alreadyHaveAccount')} <Link href="/login" className="text-blue-600 hover:underline font-medium">{t('auth.register.loginLink')}</Link>
        </div>
        
        <div className="mt-4 pt-4 border-t text-center text-sm">
          <p className="text-gray-500 mb-2">{t('auth.register.wantToList')}</p>
          <div className="space-x-4">
            <Link href="/register/individual" className="text-blue-600 hover:underline font-medium">{t('auth.register.asProvider')}</Link>
            <span className="text-gray-300">|</span>
            <Link href="/register/business" className="text-blue-600 hover:underline font-medium">{t('auth.register.asBusiness')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
