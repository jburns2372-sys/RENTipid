'use client';

import { useState } from 'react';
import Link from 'next/link';

const GENERIC_MESSAGE = 'If an eligible account exists, instructions will be sent.';

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
    setMessage(GENERIC_MESSAGE);
    setPending(false);
  }

  return (
    <main className="container mx-auto max-w-md px-4 py-16">
      <section className="rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Reset your password</h1>
        <p className="mt-2 text-sm text-gray-600">
          Enter the email address attached to your RENTipid password credential.
        </p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="email">Email address</label>
            <input className="w-full rounded border p-2" id="email" name="email" type="email" required />
          </div>
          <button className="w-full rounded bg-blue-600 py-3 font-semibold text-white disabled:opacity-50" disabled={pending} type="submit">
            {pending ? 'Submitting...' : 'Send reset instructions'}
          </button>
        </form>
        {message && <p className="mt-4 rounded bg-blue-50 p-3 text-sm text-blue-800" aria-live="polite">{message}</p>}
        <p className="mt-6 text-center text-sm"><Link className="text-blue-600 hover:underline" href="/login">Return to sign in</Link></p>
      </section>
    </main>
  );
}
