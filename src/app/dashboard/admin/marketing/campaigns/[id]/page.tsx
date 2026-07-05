import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/ai/ai-logger';
import { CheckCircle, XCircle, Send } from 'lucide-react';
import { approvePostAction, rejectPostAction, mockPublishAction } from '@/app/dashboard/admin/marketing/actions';
import { checkSocialGuardrails } from '@/lib/social/social-guardrails';

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (role !== 'Admin' && role !== 'Super Admin') {
    redirect('/unauthorized');
  }

  const { id } = await params;

  const campaign = await prisma.marketingCampaign.findUnique({
    where: { id },
    include: {
      posts: true,
      utmLinks: true,
      analytics: true
    }
  });

  if (!campaign) redirect('/dashboard/admin/marketing');

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{campaign.campaign_name}</h1>
        <p className="text-gray-500">{campaign.campaign_type} | {campaign.campaign_goal}</p>
        <div className="mt-2 inline-flex text-sm px-2 py-1 bg-gray-100 rounded">
          Status: {campaign.campaign_status}
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold border-b pb-2">Campaign Posts & Approval Queue</h2>
        
        {campaign.posts.length === 0 && (
          <p className="text-gray-500">No posts generated for this campaign yet.</p>
        )}

        {campaign.posts.map(post => {
          const guardrail = checkSocialGuardrails(post.caption || "");
          
          return (
            <div key={post.id} className="bg-white border rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">{post.platform}</h3>
                  <span className={`text-xs px-2 py-1 rounded font-medium mt-1 inline-block
                    ${post.post_status === 'Approved' ? 'bg-green-100 text-green-700' : 
                      post.post_status === 'Pending Approval' ? 'bg-yellow-100 text-yellow-700' :
                      post.post_status === 'Published Placeholder' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'}`}>
                    {post.post_status}
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4 whitespace-pre-wrap text-sm border">
                {post.caption}
              </div>

              {!guardrail.isSafe && post.post_status !== 'Published Placeholder' && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4 border border-red-100">
                  <strong>Guardrail Block:</strong> {guardrail.reason}
                </div>
              )}

              <div className="flex gap-2 justify-end">
                {post.post_status === 'Pending Approval' && guardrail.isSafe && (
                  <>
                    <form action={async () => { 'use server'; await rejectPostAction(post.id, 'Admin rejected content'); }}>
                      <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition border border-red-200">
                        <XCircle size={16} /> Reject
                      </button>
                    </form>
                    <form action={async () => { 'use server'; await approvePostAction(post.id); }}>
                      <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition border border-green-200">
                        <CheckCircle size={16} /> Approve
                      </button>
                    </form>
                  </>
                )}

                {post.post_status === 'Approved' && (
                  <form action={async () => { 'use server'; await mockPublishAction(post.id); }}>
                    <button className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition">
                      <Send size={16} /> Publish Now (Mock)
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
