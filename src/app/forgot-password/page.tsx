'use client';

import { useState } from 'react';
import Link from 'next/link';
import { t } from '@/lib/glcc/i18n';

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    await fetch('/api/auth/password-recovery', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: form.get('email') }),
    }).catch(() => undefined);
    setMessage(t('auth.forgotPassword.genericSuccess'));
    setPending(false);
  }

  return (
    <main className="container mx-auto max-w-md px-4 py-16">
      <section className="rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">{t('auth.forgotPassword.title')}</h1>
        <p className="mt-2 text-sm text-gray-600">
          {t('auth.forgotPassword.subtitle')}
        </p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="email">{t('auth.forgotPassword.emailLabel')}</label>
            <input className="w-full rounded border p-2" id="email" name="email" type="email" required />
          </div>
          <button className="w-full rounded bg-blue-600 py-3 font-semibold text-white disabled:opacity-50" disabled={pending} type="submit">
            {pending ? t('auth.forgotPassword.submitting') : t('auth.forgotPassword.submit')}
          </button>
        </form>
        {message && <p className="mt-4 rounded bg-blue-50 p-3 text-sm text-blue-800" aria-live="polite">{message}</p>}
        <p className="mt-6 text-center text-sm"><Link className="text-blue-600 hover:underline" href="/login">{t('auth.forgotPassword.returnToSignIn')}</Link></p>
      </section>
    </main>
  );
}
