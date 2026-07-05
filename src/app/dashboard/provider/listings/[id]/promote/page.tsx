import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/ai/ai-logger';
import { createProviderPromotionRequest } from '@/app/dashboard/provider/marketing/actions';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import { Sparkles, Send } from 'lucide-react';

export default async function ProviderListingPromotePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (
    role !== 'Individual Provider' && 
    role !== 'Business Provider' &&
    role !== 'Admin' &&
    role !== 'Super Admin'
  ) {
    redirect('/unauthorized');
  }

  const { id } = await params;
  
  const listing = await prisma.listing.findUnique({ where: { id } });
  
  if (!listing || (listing.provider_id !== (session?.user as any).id && role !== 'Admin' && role !== 'Super Admin')) {
    redirect('/unauthorized');
  }

  if (listing.status !== 'Published') {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-100 text-center">
          <h2 className="font-bold text-lg mb-2">Listing Not Published</h2>
          <p>You can only generate promotions for actively published listings. This listing is currently: {listing.status}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Promote: {listing.title}</h1>
      <p className="text-gray-500 mb-8">Generate AI captions and request platform-wide promotion.</p>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 mb-6">
            <h3 className="font-bold text-indigo-900 flex items-center gap-2 mb-2">
              <Sparkles size={18} /> Use AI Listing Promotion Bot
            </h3>
            <p className="text-sm text-indigo-800 mb-4">
              Open the AI Assistant to generate a catchy caption, hashtags, and a call-to-action for this listing. Copy the result into the form.
            </p>
          </div>
        </div>

        <div>
          <form action={async (formData) => {
            'use server';
            const platform = formData.get('platform') as string;
            const caption = formData.get('caption') as string;
            await createProviderPromotionRequest(listing.id, platform, caption);
            redirect('/dashboard/provider/marketing');
          }} className="bg-white border rounded-xl p-6 shadow-sm">
            <h3 className="font-bold mb-4 border-b pb-2">Submit Promotion Request</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Platform</label>
              <select name="platform" className="w-full border rounded-lg px-4 py-2">
                <option>Facebook Page</option>
                <option>Instagram Business</option>
                <option>TikTok</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Caption & Content</label>
              <textarea name="caption" rows={6} required placeholder="Paste your AI generated caption here..." className="w-full border rounded-lg px-4 py-2"></textarea>
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition flex justify-center items-center gap-2">
              <Send size={18} /> Request Admin Approval
            </button>
            <p className="text-xs text-gray-500 text-center mt-3">
              Your promotion will be reviewed by RENTipid Admins before it is scheduled.
            </p>
          </form>
        </div>
      </div>

      <AIAssistantButton context="Marketing" userRole={role} />
    </div>
  );
}
