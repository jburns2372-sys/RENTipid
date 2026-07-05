import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LifeBuoy } from 'lucide-react';

export default async function SupportPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login?callbackUrl=/support');
  }

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
          <LifeBuoy size={32} />
        </div>
        <h1 className="text-3xl font-bold">Support Tickets</h1>
        <p className="text-gray-500 mt-2">Need help? Open a ticket and our beta team will assist you.</p>
      </div>

      <form className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <input type="text" required className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-600 bg-gray-50" placeholder="Brief subject" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select name="category" required className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-600 bg-gray-50">
            <option value="Account">Account Access</option>
            <option value="KYC">KYC & Verification</option>
            <option value="Listing">Listing Management</option>
            <option value="Booking">Booking & Escrow</option>
            <option value="Dispute">Damage Claims & Disputes</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
          <textarea 
            name="message" 
            required 
            rows={5} 
            className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-600 bg-gray-50"
            placeholder="Please provide as much detail as possible..."
          />
        </div>

        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition">
          Submit Ticket
        </button>
      </form>
    </div>
  );
}
