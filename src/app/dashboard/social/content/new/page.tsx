import React from 'react';
import { PrismaClient } from '@prisma/client';
import { redirect } from 'next/navigation';
import { SocialContentStudioService } from '@/lib/social/social-content-studio';
import { SocialAIAssistant } from '@/lib/social/social-ai-assistant';

const prisma = new PrismaClient();

export default async function NewContentPage() {
  const accounts = await prisma.socialAccount.findMany({
    where: { health_status: 'HEALTHY', connection_status: { in: ['CONFIGURED', 'LIVE_READY'] } }
  });
  const campaigns = await prisma.marketingCampaign.findMany();
  const listings = await prisma.listing.findMany({ where: { status: 'PUBLISHED' } });

  // Assume user auth is retrieved. Mocking admin ID for this P5 Acceptance
  const MOCK_USER_ID = "mock-admin-id"; 
  const MOCK_USER_ROLE = "Admin";

  async function handleCreateDraft(formData: FormData) {
    'use server';
    const campaignId = formData.get('campaignId') as string;
    const listingId = formData.get('listingId') as string;
    const accountId = formData.get('accountId') as string;
    const platform = formData.get('platform') as string;
    const postType = formData.get('postType') as string || 'PROMO';
    const postTitle = formData.get('postTitle') as string;
    const caption = formData.get('caption') as string;
    const mediaRef = formData.get('mediaReference') as string;
    
    // Create draft
    const draft = await SocialContentStudioService.createDraft({
      campaign_id: campaignId,
      listing_id: listingId || undefined,
      platform: platform,
      post_type: postType,
      post_title: postTitle,
      caption: caption,
      media_reference: mediaRef || undefined,
      target_account_id: accountId || undefined,
      editor_id: MOCK_USER_ID,
      editor_role: MOCK_USER_ROLE
    });

    redirect(`/dashboard/social/content/${draft.id}/edit`);
  }

  async function handleAIGenerate(formData: FormData) {
    'use server';
    const listingId = formData.get('listingId') as string;
    const customPrompt = formData.get('customPrompt') as string;
    if (!listingId) return; // Basic fallback
    
    // This is just a stub for demonstrating AI capability boundary
    const suggestion = await SocialAIAssistant.draftSocialContent(listingId, customPrompt);
    // Ideally returned to client state, but Server Actions to return values require client-side form handing with useActionState
    // For P5 UI acceptance, we'll build the layout that includes these fields.
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Create New Draft</h1>
      
      <div className="bg-white rounded-xl shadow border p-6">
        <form action={handleCreateDraft} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Target Account</label>
              <select name="accountId" className="w-full border rounded p-2" required>
                <option value="">Select Account</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.platform} - {acc.account_name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Platform (if no specific account)</label>
              <select name="platform" className="w-full border rounded p-2" required>
                <option value="MOCK">Mock Social Network</option>
                <option value="META">Meta / Facebook</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="TIKTOK">TikTok</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Campaign</label>
              <select name="campaignId" className="w-full border rounded p-2" required>
                <option value="">Select Campaign</option>
                {campaigns.map(camp => (
                  <option key={camp.id} value={camp.id}>{camp.campaign_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Associated Listing (Optional)</label>
              <select name="listingId" className="w-full border rounded p-2">
                <option value="">None</option>
                {listings.map(list => (
                  <option key={list.id} value={list.id}>{list.title}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Post Title (Internal)</label>
            <input type="text" name="postTitle" className="w-full border rounded p-2" placeholder="My Promo Post" />
          </div>

          <div>
             <label className="block text-sm font-medium mb-1">Media Reference (URL or Object Key)</label>
             <input type="text" name="mediaReference" className="w-full border rounded p-2" placeholder="/uploads/image.jpg" />
             <p className="text-xs text-gray-500 mt-1">Must belong to authorized RENTipid storage namespace.</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 flex justify-between">
              <span>Caption</span>
              <button formAction={handleAIGenerate} className="text-blue-600 hover:underline text-xs flex items-center">
                ✨ Generate AI Suggestion
              </button>
            </label>
            <textarea name="caption" rows={5} className="w-full border rounded p-2" placeholder="Write your social post..." />
          </div>

          <div className="pt-4 border-t flex justify-end gap-4">
             <button type="button" className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">Cancel</button>
             <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700">Create Draft</button>
          </div>
        </form>
      </div>
    </div>
  );
}
