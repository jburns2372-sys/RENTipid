'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ResetPasswordForm({ token }: { token: string }) {
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage('');
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') || '');
    const confirmation = String(form.get('confirmation') || '');
    if (password !== confirmation) {
      setMessage('Passwords do not match.');
      setPending(false);
      return;
    }

    const response = await fetch('/api/auth/password-reset', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    const body = await response.json().catch(() => ({ message: 'Password reset is temporarily unavailable.' }));
    setMessage(body.message);
    setSuccess(response.ok);
    setPending(false);
  }

  return (
    <main className="container mx-auto max-w-md px-4 py-16">
      <section className="rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Choose a new password</h1>
        {!token ? (
          <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">This reset link is invalid or incomplete.</p>
        ) : success ? (
          <div className="mt-4 space-y-4">
            <p className="rounded bg-green-50 p-3 text-sm text-green-800">{message}</p>
            <Link className="block text-center text-blue-600 hover:underline" href="/login">Sign in</Link>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={submit}>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="password">New password</label>
              <input className="w-full rounded border p-2" id="password" name="password" type="password" minLength={8} maxLength={128} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="confirmation">Confirm new password</label>
              <input className="w-full rounded border p-2" id="confirmation" name="confirmation" type="password" minLength={8} maxLength={128} required />
            </div>
            <button className="w-full rounded bg-blue-600 py-3 font-semibold text-white disabled:opacity-50" disabled={pending} type="submit">
              {pending ? 'Resetting...' : 'Reset password'}
            </button>
            {message && <p className="rounded bg-red-50 p-3 text-sm text-red-700" aria-live="polite">{message}</p>}
          </form>
        )}
      </section>
    </main>
  );
}
