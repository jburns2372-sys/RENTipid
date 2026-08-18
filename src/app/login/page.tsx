"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import RentipidLogo from '@/components/brand/RentipidLogo';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [methods, setMethods] = useState<any>(null);
  
  const [otpMode, setOtpMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [phone, setPhone] = useState('');

  useEffect(() => {
    fetch('/api/auth/methods')
      .then(res => res.json())
      .then(data => setMethods(data))
      .catch(console.error);

    if (searchParams.get('registered') === 'true') {
      setRegistered(true);
    }
    if (searchParams.get('error')) {
      const err = searchParams.get('error');
      if (err === 'OAuthAccountNotLinked') {
        setError('This email is already associated with another account. Please sign in using your original method.');
      } else {
        setError('Authentication failed. Please try again.');
      }
    }
  }, [searchParams]);

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const callbackUrl = searchParams.get('callbackUrl') || '/';

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError('Invalid credentials');
        setLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError('An error occurred during login');
      setLoading(false);
    }
  };

  const requestOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const phoneNumber = formData.get('phone') as string;
    setPhone(phoneNumber);

    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber }),
      });
      if (res.ok) {
        setOtpSent(true);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  const verifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const code = formData.get('code') as string;
    const callbackUrl = searchParams.get('callbackUrl') || '/';

    try {
      const res = await signIn('otp', {
        redirect: false,
        phone,
        code,
      });

      if (res?.error) {
        setError('Invalid or expired OTP code');
        setLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError('An error occurred during verification');
      setLoading(false);
    }
  };

  if (!methods) return <div className="text-center py-4">Loading secure gateway...</div>;

  return (
    <>
      {registered && (
        <div className="bg-green-50 text-green-700 p-3 rounded mb-6 text-sm border border-green-200">
          Registration successful! Please log in with your new credentials.
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-6 text-sm border border-red-200">
          {error}
        </div>
      )}

      <div className="space-y-4 mb-6">
        {methods.providers.google && (
          <button onClick={() => signIn('google')} className="w-full bg-white border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded shadow-sm hover:bg-gray-50 flex justify-center items-center">
            Sign in with Google
          </button>
        )}
        {methods.providers.facebook && (
          <button onClick={() => signIn('facebook')} className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded shadow-sm hover:bg-blue-700 flex justify-center items-center">
            Sign in with Facebook
          </button>
        )}
        {methods.providers.apple && (
          <button onClick={() => signIn('apple')} className="w-full bg-black text-white font-medium py-2 px-4 rounded shadow-sm hover:bg-gray-900 flex justify-center items-center">
            Sign in with Apple
          </button>
        )}
      </div>

      {(methods.providers.email || methods.providers.otp) && (
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>
      )}

      <div className="flex space-x-2 mb-6">
        {methods.providers.email && (
          <button onClick={() => setOtpMode(false)} className={`flex-1 py-2 text-sm font-medium border-b-2 ${!otpMode ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Email</button>
        )}
        {methods.providers.otp && (
          <button onClick={() => setOtpMode(true)} className={`flex-1 py-2 text-sm font-medium border-b-2 ${otpMode ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Phone OTP</button>
        )}
      </div>

      {!otpMode && methods.providers.email && (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" name="email" required className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" name="password" required className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 disabled:opacity-50 mt-4">
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      )}

      {otpMode && methods.providers.otp && !otpSent && (
        <form onSubmit={requestOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Mobile Number</label>
            <input type="text" name="phone" placeholder="+1234567890" required className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 disabled:opacity-50 mt-4">
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      )}

      {otpMode && methods.providers.otp && otpSent && (
        <form onSubmit={verifyOtp} className="space-y-4">
          <div className="text-sm text-gray-600 mb-2">Enter the code sent to {phone}</div>
          <div>
            <label className="block text-sm font-medium mb-1">6-Digit Code</label>
            <input type="text" name="code" required className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none text-center tracking-widest text-lg" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 disabled:opacity-50 mt-4">
            {loading ? 'Verifying...' : 'Verify & Sign In'}
          </button>
          <button type="button" onClick={() => setOtpSent(false)} className="w-full text-sm text-blue-600 mt-2 hover:underline">
            Use a different number
          </button>
        </form>
      )}
      
      <div className="mt-8 pt-4 border-t text-xs text-center text-gray-500">
        By signing in, you agree to our <Link href="/terms" className="underline">Terms of Use</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.
      </div>
    </>
  );
}

export default function Login() {
  return (
    <div className="container mx-auto py-12 px-4 flex justify-center">
      <div className="bg-white p-8 rounded-xl shadow-sm border max-w-md w-full">
        <RentipidLogo variant="full" size="lg" showText={true} className="mb-6" />
        <h1 className="text-2xl font-bold mb-2 text-center text-gray-800">Sign In</h1>
        <p className="text-gray-600 mb-6 text-center">Access your RENTipid account</p>

        <Suspense fallback={<div className="text-center text-gray-500 py-4">Loading secure gateway...</div>}>
          <LoginForm />
        </Suspense>

        <div className="mt-8 pt-6 border-t text-center text-sm text-gray-600">
          <p className="mb-4">Need an account?</p>
          <div className="flex flex-col space-y-2">
            <Link href="/register" className="w-full bg-gray-50 border border-gray-200 text-gray-800 font-medium py-2 rounded hover:bg-gray-100 transition">
              Create an Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
