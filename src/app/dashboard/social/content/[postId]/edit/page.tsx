import React from 'react';
import { PrismaClient } from '@prisma/client';
import { redirect, notFound } from 'next/navigation';
import { SocialContentStudioService } from '@/lib/social/social-content-studio';
import { SocialAIAssistant } from '@/lib/social/social-ai-assistant';

const prisma = new PrismaClient();

export default async function EditContentPage({ params }: { params: { postId: string } }) {
  const post = await prisma.marketingPost.findUnique({
    where: { id: params.postId }
  });

  if (!post) {
    notFound();
  }

  const accounts = await prisma.socialAccount.findMany({
    where: { health_status: 'HEALTHY', connection_status: { in: ['CONFIGURED', 'LIVE_READY'] } }
  });
  
  // Assume user auth is retrieved. Mocking admin ID for this P5 Acceptance
  const MOCK_USER_ID = "mock-admin-id"; 
  const MOCK_USER_ROLE = "Admin";

  const isEditable = post.post_status === 'DRAFT';

  async function handleSaveDraft(formData: FormData) {
    'use server';
    const actionType = formData.get('actionType') as string;
    
    if (actionType === 'SUBMIT') {
      await SocialContentStudioService.submitForReview(post!.id, MOCK_USER_ID, MOCK_USER_ROLE);
      redirect('/dashboard/social/content');
    }

    const accountId = formData.get('accountId') as string;
    const postTitle = formData.get('postTitle') as string;
    const caption = formData.get('caption') as string;
    const mediaRef = formData.get('mediaReference') as string;
    const currentVersion = parseInt(formData.get('currentVersion') as string, 10);
    
    // Update draft
    await SocialContentStudioService.updateDraft({
      post_id: post!.id,
      current_version: currentVersion,
      updates: {
        post_title: postTitle,
        caption: caption,
        media_reference: mediaRef || undefined,
        target_account_id: accountId || undefined,
      },
      editor_id: MOCK_USER_ID,
      editor_role: MOCK_USER_ROLE,
      save_snapshot: true,
      change_reason: 'Draft edited via UI'
    });

    redirect('/dashboard/social/content');
  }

  return (
    <div className="p-8 max-w-6xl mx-auto flex gap-8">
      <div className="flex-1">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Edit Content Draft</h1>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">Status:</span>
            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-700">
              {post.post_status}
            </span>
            <span className="text-gray-500 text-sm ml-4">v{post.version}</span>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow border p-6">
          <form action={handleSaveDraft} className="space-y-6">
            <input type="hidden" name="currentVersion" value={post.version} />
            <input type="hidden" name="actionType" id="actionType" value="SAVE" />
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Target Account</label>
                <select name="accountId" className="w-full border rounded p-2" defaultValue="" disabled={!isEditable}>
                  <option value="">Select Account (or Platform default)</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.platform} - {acc.account_name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Platform</label>
                <input type="text" className="w-full border rounded p-2 bg-gray-50" value={post.platform} disabled />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Post Title (Internal)</label>
              <input type="text" name="postTitle" className="w-full border rounded p-2" defaultValue={post.post_title || ""} disabled={!isEditable} />
            </div>

            <div>
               <label className="block text-sm font-medium mb-1">Media Reference (URL or Object Key)</label>
               <input type="text" name="mediaReference" className="w-full border rounded p-2" defaultValue={post.media_file_path || ""} disabled={!isEditable} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Caption</label>
              <textarea name="caption" rows={5} className="w-full border rounded p-2" defaultValue={post.caption || ""} disabled={!isEditable} />
            </div>

            {isEditable && (
              <div className="pt-4 border-t flex justify-between">
                 <button type="submit" onClick={(e) => { (document.getElementById('actionType') as HTMLInputElement).value = 'SAVE' }} className="px-4 py-2 border rounded font-medium hover:bg-gray-50">Save Draft & Create Version</button>
                 <button type="submit" onClick={(e) => { (document.getElementById('actionType') as HTMLInputElement).value = 'SUBMIT' }} className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700">Submit for Review</button>
              </div>
            )}
            {!isEditable && (
               <div className="pt-4 border-t">
                  <p className="text-gray-500 text-sm">This post is locked for review and cannot be edited.</p>
               </div>
            )}
          </form>
        </div>
      </div>

      <div className="w-96">
         <div className="bg-gray-100 rounded-xl border p-4 sticky top-8">
            <h2 className="text-lg font-semibold mb-4 text-center">Channel Preview (Simulated)</h2>
            <div className="bg-white border shadow-sm rounded-lg overflow-hidden">
               <div className="p-4 border-b flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div>
                    <div className="font-bold text-sm">My Brand Name</div>
                    <div className="text-xs text-gray-500">Sponsored • {post.platform}</div>
                  </div>
               </div>
               <div className="p-4 text-sm whitespace-pre-wrap">
                  {post.caption || 'No caption yet...'}
               </div>
               {post.media_file_path && (
                  <div className="bg-gray-200 aspect-video flex items-center justify-center text-gray-400 text-xs p-4 text-center break-all">
                     [Media Attachment Preview]<br/>
                     {post.media_file_path}
                  </div>
               )}
               <div className="px-4 py-3 border-t text-gray-500 text-xs flex justify-between">
                  <span>👍 Like</span>
                  <span>💬 Comment</span>
                  <span>🔗 Share</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
