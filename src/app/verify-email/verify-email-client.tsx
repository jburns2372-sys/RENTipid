'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/glcc/i18n';

export default function VerifyEmailClient({ token, sent }: { token: string; sent: boolean }) {
  const { t } = useTranslation();
  const [message, setMessage] = useState(sent ? t('auth.checkEmailVerification') : '');
  const [verified, setVerified] = useState(false);
  const [pending, setPending] = useState(false);

  async function verify() {
    setPending(true);
    const response = await fetch('/api/auth/email-verification/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const body = await response.json().catch(() => ({ message: t('auth.emailVerificationUnavailable') }));
    setMessage(body.message);
    setVerified(response.ok);
    setPending(false);
  }

  async function resend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    await fetch('/api/auth/email-verification/resend', {
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
        <h1 className="text-2xl font-bold text-gray-900">{t('auth.verifyYourEmailAddress')}</h1>
        {token && !verified && (
          <button className="mt-6 w-full rounded bg-blue-600 py-3 font-semibold text-white disabled:opacity-50" disabled={pending} onClick={verify} type="button">
            {pending ? t('auth.whatsapp.verifying') : t('auth.verifyEmail')}
          </button>
        )}
        {!token && (
          <form className="mt-6 space-y-4" onSubmit={resend}>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="email">{t('auth.forgotPassword.emailLabel')}</label>
              <input className="w-full rounded border p-2" id="email" name="email" type="email" required />
            </div>
            <button className="w-full rounded bg-blue-600 py-3 font-semibold text-white disabled:opacity-50" disabled={pending} type="submit">
              {pending ? t('auth.forgotPassword.submitting') : t('auth.resendVerificationLink')}
            </button>
          </form>
        )}
        {message && <p className={`mt-4 rounded p-3 text-sm ${verified ? 'bg-green-50 text-green-800' : 'bg-blue-50 text-blue-800'}`} aria-live="polite">{message}</p>}
        <p className="mt-6 text-center text-sm"><Link className="text-blue-600 hover:underline" href="/login">{t('auth.forgotPassword.returnToSignIn')}</Link></p>
      </section>
    </main>
  );
}
