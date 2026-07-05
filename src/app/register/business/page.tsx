"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import RentipidLogo from '@/components/brand/RentipidLogo';

export default function RegisterBusinessProvider() {
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
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    const payload = {
      full_name: formData.get('authorized_representative'), // Map representative to full_name for auth
      email: formData.get('email'),
      mobile_number: formData.get('mobile_number'),
      password,
      account_type: 'Business',
      role: 'Business Provider',
      address: formData.get('business_address'),
      city: formData.get('city'),
      province: formData.get('province'),
      country: formData.get('country') || 'Philippines',
      business_name: formData.get('business_name'),
      business_registration_number: formData.get('business_registration_number'),
      authorized_representative: formData.get('authorized_representative')
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
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-2xl">
      <div className="bg-white p-8 rounded-xl shadow-sm border">
        <RentipidLogo variant="full" size="lg" showText={true} className="mb-6" />
        <h1 className="text-2xl font-bold mb-2 text-center text-gray-800">Register Your Business</h1>
        <p className="text-gray-600 mb-8 text-center">List your company's assets, properties, or fleet on RENTipid.</p>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-6 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-b pb-4">
            <h3 className="font-semibold text-gray-800 mb-4 text-lg">Business Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Business Name *</label>
                <input name="business_name" required className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Business Registration Number (DTI/SEC/Permit) *</label>
                <input name="business_registration_number" required className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Business Address *</label>
                <input name="business_address" required className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">City *</label>
                  <input name="city" required className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Province *</label>
                  <input name="province" required className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="border-b pb-4">
            <h3 className="font-semibold text-gray-800 mb-4 text-lg">Authorized Representative & Login</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Representative Full Name *</label>
                <input name="authorized_representative" required className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Business Email *</label>
                  <input type="email" name="email" required className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Mobile Number *</label>
                  <input type="tel" name="mobile_number" required className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Password *</label>
                  <input type="password" name="password" required className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Confirm Password *</label>
                  <input type="password" name="confirm_password" required className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <div className="flex items-start">
              <input type="checkbox" required className="mt-1 mr-2 flex-shrink-0" />
              <span className="text-sm text-gray-600">
                I agree to the <Link href="/terms" className="text-blue-600 hover:underline">Terms and Conditions</Link> and <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
              </span>
            </div>
            <div className="flex items-start">
              <input type="checkbox" required className="mt-1 mr-2 flex-shrink-0" />
              <span className="text-sm text-gray-600">
                I declare that the business legally owns the assets listed or is legally authorized to rent them out on behalf of the owners.
              </span>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 transition disabled:opacity-50 mt-6"
          >
            {loading ? 'Creating Business Account...' : 'Register Business'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account? <Link href="/login" className="text-blue-600 hover:underline font-medium">Log in</Link>
        </div>
      </div>
    </div>
  );
}
