import React from 'react';
import { PrismaClient } from '@prisma/client';
import { redirect, notFound } from 'next/navigation';
import { SocialApprovalService } from '@/lib/social/social-approval-service';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function ApprovalDetailPage({ params }: { params: { id: string } }) {
  const post = await prisma.marketingPost.findUnique({
    where: { id: params.id },
    include: {
      listing: true,
      campaign: true
    }
  });

  if (!post || post.post_status !== 'SUBMITTED_FOR_REVIEW') {
    notFound();
  }

  // Mocking the user for this P6 implementation
  const MOCK_USER_ID = "mock-reviewer-id"; 
  const MOCK_USER_ROLE = "Admin";
  // To test Segregation of Duties correctly, the reviewer should not be the creator, 
  // or we need a superadmin override. We'll assume mock-reviewer is different from creator.

  async function handleApprove(formData: FormData) {
    'use server';
    const comment = formData.get('comment') as string;
    const override = formData.get('overrideReason') as string;
    
    await SocialApprovalService.approvePost({
      postId: post!.id,
      reviewerId: MOCK_USER_ID,
      reviewerRole: MOCK_USER_ROLE,
      versionNumber: post!.version,
      comment: comment || undefined
    });
    
    redirect('/dashboard/social/approvals');
  }

  async function handleReject(formData: FormData) {
    'use server';
    const comment = formData.get('comment') as string;
    
    if (!comment) {
      throw new Error("Rejection requires a comment.");
    }
    
    await SocialApprovalService.rejectPost({
      postId: post!.id,
      reviewerId: MOCK_USER_ID,
      reviewerRole: MOCK_USER_ROLE,
      versionNumber: post!.version,
      comment: comment
    });
    
    redirect('/dashboard/social/approvals');
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/dashboard/social/approvals" className="text-blue-600 hover:underline mb-6 inline-block">
        &larr; Back to Queue
      </Link>
      
      <h1 className="text-3xl font-bold mb-8">Review Content: v{post.version}</h1>
      
      <div className="bg-white rounded-xl shadow border p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Content Snapshot</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500 font-medium">Platform</p>
            <p className="font-semibold">{post.platform}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Post Type</p>
            <p className="font-semibold">{post.post_type}</p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-500 font-medium mb-1">Caption</p>
          <div className="bg-gray-50 p-4 rounded border text-gray-800 whitespace-pre-wrap">
            {post.caption || <span className="italic text-gray-400">No caption provided</span>}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-blue-800">Review Decision</h2>
        
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-1">Review Comment (Required for Rejection)</label>
            <textarea 
              name="comment" 
              className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500" 
              rows={3}
              placeholder="Enter any feedback or reasons..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-1">SuperAdmin Override Reason (Optional)</label>
            <input 
              name="overrideReason"
              type="text"
              className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500"
              placeholder="If you are the author and must approve, state the emergency reason here"
            />
          </div>
          
          <div className="flex gap-4 pt-4">
            <button 
              formAction={handleApprove}
              className="bg-green-600 text-white px-6 py-2 rounded font-medium hover:bg-green-700 shadow flex-1"
            >
              APPROVE Content
            </button>
            <button 
              formAction={handleReject}
              className="bg-red-600 text-white px-6 py-2 rounded font-medium hover:bg-red-700 shadow flex-1"
            >
              REJECT Content
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
