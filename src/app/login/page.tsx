"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setRegistered(true);
    }
    if (searchParams.get('error')) {
      setError('Invalid email or password');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
        setError(res.error);
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input 
            type="email" 
            name="email" 
            required 
            className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" 
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium">Password</label>
            <a href="#" className="text-xs text-blue-600 hover:underline">Forgot password?</a>
          </div>
          <input 
            type="password" 
            name="password" 
            required 
            className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" 
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 transition disabled:opacity-50 mt-4"
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>
    </>
  );
}

import RentipidLogo from '@/components/brand/RentipidLogo';

export default function Login() {
  return (
    <div className="container mx-auto py-20 px-4 flex justify-center">
      <div className="bg-white p-8 rounded-xl shadow-sm border max-w-md w-full">
        <RentipidLogo variant="full" size="lg" showText={true} className="mb-6" />
        <h1 className="text-2xl font-bold mb-2 text-center text-gray-800">Welcome Back</h1>
        <p className="text-gray-600 mb-8 text-center">Log in to your account</p>

        <Suspense fallback={<div className="text-center text-gray-500 py-4">Loading form...</div>}>
          <LoginForm />
        </Suspense>

        <div className="mt-8 pt-6 border-t text-center text-sm text-gray-600">
          <p className="mb-4">Don't have an account?</p>
          <div className="flex flex-col space-y-2">
            <Link href="/register" className="w-full bg-gray-50 border border-gray-200 text-gray-800 font-medium py-2 rounded hover:bg-gray-100 transition">
              Register as Renter
            </Link>
            <Link href="/register/individual" className="w-full bg-gray-50 border border-gray-200 text-gray-800 font-medium py-2 rounded hover:bg-gray-100 transition">
              Register as Provider
            </Link>
            <Link href="/register/business" className="w-full bg-gray-50 border border-gray-200 text-gray-800 font-medium py-2 rounded hover:bg-gray-100 transition">
              Register as Business
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
