import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/ai/ai-logger';
import { redirect } from 'next/navigation';
import { MessageSquarePlus } from 'lucide-react';

export default async function FeedbackPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login?callbackUrl=/feedback');
  }

  const user = session.user as any;

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
          <MessageSquarePlus size={32} />
        </div>
        <h1 className="text-3xl font-bold">Beta Feedback</h1>
        <p className="text-gray-500 mt-2">Help us improve RENTipid by reporting issues or suggesting features.</p>
      </div>

      <form className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Feedback Type</label>
          <select name="feedback_type" required className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-600 bg-gray-50">
            <option value="Bug">Report a Bug</option>
            <option value="Suggestion">Feature Suggestion</option>
            <option value="UI Problem">UI/Design Problem</option>
            <option value="Confusing Workflow">Confusing Workflow</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Related Module</label>
          <select name="module" required className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-600 bg-gray-50">
            <option value="General">General / Appwide</option>
            <option value="Listings">Listings</option>
            <option value="Bookings">Bookings & Escrow</option>
            <option value="Inspections">Inspections & Damage Claims</option>
            <option value="Social">Marketing & Social</option>
            <option value="AI">AI Assistant</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <textarea 
            name="message" 
            required 
            rows={5} 
            className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-600 bg-gray-50"
            placeholder="Describe what happened or what you'd like to see..."
          />
        </div>

        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition">
          Submit Feedback
        </button>
      </form>
    </div>
  );
}
