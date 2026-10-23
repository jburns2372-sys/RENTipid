import React from 'react';
import Link from 'next/link';

export default function Page() {
  return (
    <div className="container mx-auto py-12 px-4 break-all overflow-x-hidden w-full max-w-full">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p>Version: 1.0.0</p>
      <p>Effective Date: 2026-08-05</p>
      <p>Controller: OneSystems Integration Philippines Inc.</p>
      <p>Data Protection Officer: MAVERIC SIDNEY DE MESA</p>
      <p>Email: dpo@onesystemsphilippines.com</p>
      <div className="mt-8 space-y-4">
        <Link href="/privacy/request" className="block text-blue-700 hover:underline">Submit Request</Link>
        <Link href="/privacy/cookies" className="block text-blue-700 hover:underline">Cookie Preferences</Link>
        <Link href="/dashboard/admin/privacy" className="block text-blue-700 hover:underline">Admin Dashboard</Link>
      </div>
    </div>
  );
}
