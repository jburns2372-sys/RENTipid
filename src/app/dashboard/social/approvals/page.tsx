import React from 'react';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function SocialApprovalsQueuePage() {
  const posts = await prisma.marketingPost.findMany({
    where: {
      post_status: {
        in: ['SUBMITTED_FOR_REVIEW', 'APPROVED']
      }
    },
    orderBy: { created_at: 'desc' },
    include: {
      listing: true,
      campaign: true
    }
  });

  const submittedPosts = posts.filter(p => p.post_status === 'SUBMITTED_FOR_REVIEW');
  const approvedPosts = posts.filter(p => p.post_status === 'APPROVED');

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Content Approval Queue</h1>
        <Link href="/dashboard/social/schedule" className="bg-green-600 text-white px-4 py-2 rounded font-medium hover:bg-green-700">
          Go to Scheduling Engine
        </Link>
      </div>
      
      <div className="bg-white rounded-xl shadow border p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-orange-600">Pending Approvals ({submittedPosts.length})</h2>
        
        {submittedPosts.length === 0 ? (
          <p className="text-gray-500">No posts pending approval.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-4">Platform</th>
                  <th className="p-4">Content</th>
                  <th className="p-4">Version</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submittedPosts.map(post => (
                  <tr key={post.id} className="border-b">
                    <td className="p-4 font-medium">{post.platform}</td>
                    <td className="p-4 max-w-xs truncate text-gray-700" title={post.caption || 'No caption'}>
                      {post.caption || <span className="italic text-gray-400">Media only</span>}
                    </td>
                    <td className="p-4">v{post.version}</td>
                    <td className="p-4">
                      <Link href={`/dashboard/social/approvals/${post.id}`} className="text-blue-600 hover:underline font-medium">
                        Review & Approve
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow border p-6">
        <h2 className="text-xl font-semibold mb-4 text-green-600">Recently Approved ({approvedPosts.length})</h2>
        
        {approvedPosts.length === 0 ? (
          <p className="text-gray-500">No approved posts.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-4">Platform</th>
                  <th className="p-4">Content</th>
                  <th className="p-4">Version</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {approvedPosts.map(post => (
                  <tr key={post.id} className="border-b">
                    <td className="p-4 font-medium">{post.platform}</td>
                    <td className="p-4 max-w-xs truncate text-gray-700" title={post.caption || 'No caption'}>
                      {post.caption || <span className="italic text-gray-400">Media only</span>}
                    </td>
                    <td className="p-4">v{post.version}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">APPROVED</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
