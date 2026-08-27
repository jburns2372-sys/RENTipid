"use client";

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import RentipidLogo from '@/components/brand/RentipidLogo';

type AuthMethodInfo = { method: string; enabled: boolean; configured: boolean };

function useAuthMethods() {
  const [methods, setMethods] = useState<AuthMethodInfo[]>([]);
  useEffect(() => {
    fetch('/api/auth/methods')
      .then((r) => r.json())
      .then((data) => setMethods(data.methods || []))
      .catch(() => setMethods([]));
  }, []);
  const isEnabled = useCallback(
    (id: string) => methods.some((m) => m.method === id && m.enabled),
    [methods],
  );
  return { methods, isEnabled, loaded: methods.length > 0 };
}

/* ── Social / OAuth ─────────────────────────────── */

function SocialButton({
  provider,
  label,
  icon,
  color,
  disabled,
}: {
  provider: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    // Set consent cookie first
    await fetch('/api/auth/oauth/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, accepted: true, termsAccepted: true, privacyAccepted: true }),
    }).catch(() => undefined);
    await signIn(provider, { callbackUrl: '/' });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg border font-medium transition-all duration-200 ${color} disabled:opacity-50 disabled:cursor-not-allowed`}
      id={`auth-btn-${provider}`}
    >
      {icon}
      {loading ? 'Connecting...' : label}
    </button>
  );
}

/* ── Phone OTP ──────────────────────────────────── */

type PhoneStep = 'input' | 'verify';

function PhoneOtpForm({ smsEnabled, whatsappEnabled }: { smsEnabled: boolean; whatsappEnabled: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<PhoneStep>('input');
  const [phone, setPhone] = useState('');
  const [channel, setChannel] = useState<'sms' | 'whatsapp'>(smsEnabled ? 'sms' : 'whatsapp');
  const [challengeId, setChallengeId] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, channel }),
      });
      const data = await res.json();
      if (data.challengeId) {
        setChallengeId(data.challengeId);
        setStep('verify');
      } else {
        // Generic response per enumeration protection
        setStep('verify');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await signIn('phone-otp', {
        redirect: false,
        phone,
        channel,
        challengeId,
        code,
        termsAccepted: 'true',
        privacyAccepted: 'true',
      });
      if (res?.error) {
        setError('Invalid verification code. Please try again.');
        setLoading(false);
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  if (step === 'verify') {
    return (
      <form onSubmit={handleVerify} className="space-y-4">
        <p className="text-sm text-gray-600">
          Enter the verification code sent to your phone via {channel === 'whatsapp' ? 'WhatsApp' : 'SMS'}.
        </p>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm border border-red-200">{error}</div>}
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={8}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="Enter code"
          required
          className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-600 outline-none text-center text-lg tracking-widest"
          id="otp-code-input"
          autoFocus
        />
        <button
          type="submit"
          disabled={loading || !code}
          className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          id="otp-verify-btn"
        >
          {loading ? 'Verifying...' : 'Verify & Sign In'}
        </button>
        <button
          type="button"
          onClick={() => { setStep('input'); setCode(''); setChallengeId(''); setError(''); }}
          className="w-full text-sm text-gray-500 hover:text-gray-700 transition"
        >
          ← Change phone number
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleStart} className="space-y-4">
      {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm border border-red-200">{error}</div>}
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="phone-input">Phone Number</label>
        <input
          id="phone-input"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+63 9XX XXX XXXX"
          required
          className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-600 outline-none"
        />
      </div>
      {smsEnabled && whatsappEnabled && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setChannel('sms')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition ${channel === 'sms' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
            id="channel-sms-btn"
          >
            📱 SMS
          </button>
          <button
            type="button"
            onClick={() => setChannel('whatsapp')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition ${channel === 'whatsapp' ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
            id="channel-whatsapp-btn"
          >
            💬 WhatsApp
          </button>
        </div>
      )}
      <button
        type="submit"
        disabled={loading || !phone.trim()}
        className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        id="phone-start-btn"
      >
        {loading ? 'Sending code...' : 'Send Verification Code'}
      </button>
    </form>
  );
}

/* ── Email / Password ───────────────────────────── */

function EmailPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'email-entry' | 'login'>('email-entry');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const registered = searchParams.get('registered') === 'true';

  const handleEmailContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setMode('login');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await signIn('credentials', { redirect: false, email, password });
      if (res?.error) {
        setError('Invalid email or password');
        setLoading(false);
      } else {
        router.push(searchParams.get('callbackUrl') || '/');
        router.refresh();
      }
    } catch {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (mode === 'login') {
    return (
      <form onSubmit={handleLogin} className="space-y-4">
        {registered && (
          <div className="bg-green-50 text-green-700 p-3 rounded text-sm border border-green-200">
            Registration successful! Please log in.
          </div>
        )}
        {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm border border-red-200">{error}</div>}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="email-login-input">Email</label>
          <input
            id="email-login-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-600 outline-none"
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium" htmlFor="password-input">Password</label>
            <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">Forgot password?</Link>
          </div>
          <input
            id="password-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-600 outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          id="email-login-btn"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        <button
          type="button"
          onClick={() => { setMode('email-entry'); setPassword(''); setError(''); }}
          className="w-full text-sm text-gray-500 hover:text-gray-700 transition"
        >
          ← Back
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleEmailContinue} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="email-entry-input">Email</label>
        <input
          id="email-entry-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-600 outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={!email.trim()}
        className="w-full bg-gray-800 text-white font-bold py-3 rounded-lg hover:bg-gray-900 transition disabled:opacity-50"
        id="email-continue-btn"
      >
        Continue with Email
      </button>
    </form>
  );
}

/* ── Unified Gateway ────────────────────────────── */

function UnifiedGateway() {
  const { isEnabled, loaded } = useAuthMethods();
  const [showPhone, setShowPhone] = useState(false);

  const googleEnabled = isEnabled('google');
  const facebookEnabled = isEnabled('facebook');
  const appleEnabled = isEnabled('apple');
  const smsEnabled = isEnabled('sms');
  const whatsappEnabled = isEnabled('whatsapp');
  const phoneEnabled = smsEnabled || whatsappEnabled;
  const emailEnabled = isEnabled('email');
  const hasSocial = googleEnabled || facebookEnabled || appleEnabled;

  if (!loaded) {
    return <div className="text-center text-gray-500 py-8">Loading sign-in options...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Social / OAuth Buttons */}
      {hasSocial && (
        <div className="space-y-3" id="social-auth-section">
          {googleEnabled && (
            <SocialButton
              provider="google"
              label="Continue with Google"
              color="bg-white hover:bg-gray-50 border-gray-300 text-gray-700"
              icon={<svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>}
            />
          )}
          {facebookEnabled && (
            <SocialButton
              provider="facebook"
              label="Continue with Facebook"
              color="bg-[#1877F2] hover:bg-[#166FE5] border-[#1877F2] text-white"
              icon={<svg className="w-5 h-5" fill="white" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>}
            />
          )}
          {appleEnabled && (
            <SocialButton
              provider="apple"
              label="Continue with Apple"
              color="bg-black hover:bg-gray-900 border-black text-white"
              icon={<svg className="w-5 h-5" fill="white" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>}
            />
          )}
        </div>
      )}

      {/* Phone / OTP */}
      {phoneEnabled && (
        <div id="phone-auth-section">
          {hasSocial && !showPhone && (
            <button
              type="button"
              onClick={() => setShowPhone(true)}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg border border-gray-300 font-medium bg-white hover:bg-gray-50 text-gray-700 transition-all duration-200"
              id="auth-btn-phone"
            >
              📱 Continue with Phone
            </button>
          )}
          {(showPhone || !hasSocial) && (
            <PhoneOtpForm smsEnabled={smsEnabled} whatsappEnabled={whatsappEnabled} />
          )}
        </div>
      )}

      {/* Divider */}
      {(hasSocial || phoneEnabled) && emailEnabled && (
        <div className="flex items-center gap-4">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-sm text-gray-400">or</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>
      )}

      {/* Email / Password */}
      {emailEnabled && (
        <div id="email-auth-section">
          <Suspense fallback={<div className="text-center text-gray-500 py-4">Loading...</div>}>
            <EmailPasswordForm />
          </Suspense>
        </div>
      )}

      {/* Registration link */}
      {emailEnabled && (
        <div className="text-center text-sm text-gray-500 pt-2">
          New to RENTipid?{' '}
          <Link href="/register" className="text-blue-600 hover:underline font-medium">Create an account</Link>
        </div>
      )}

      {/* Terms */}
      <p className="text-xs text-gray-400 text-center leading-relaxed">
        By continuing, you agree to RENTipid&apos;s{' '}
        <Link href="/terms" className="underline hover:text-gray-600">Terms of Service</Link> and{' '}
        <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>.
      </p>
    </div>
  );
}

/* ── Page ────────────────────────────────────────── */

export default function Login() {
  return (
    <div className="container mx-auto py-20 px-4 flex justify-center">
      <div className="bg-white p-8 rounded-xl shadow-sm border max-w-md w-full">
        <RentipidLogo variant="full" size="lg" showText={true} className="mb-6" />
        <h1 className="text-2xl font-bold mb-2 text-center text-gray-800">Sign in or create an account</h1>
        <p className="text-gray-600 mb-8 text-center">Choose how you&apos;d like to continue</p>
        <UnifiedGateway />
      </div>
    </div>
  );
}
