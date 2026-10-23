import React from 'react';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function SocialContentPage() {
  const posts = await prisma.marketingPost.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      listing: true,
      campaign: true
    }
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Social Content Studio</h1>
        <Link href="/dashboard/social/content/new" className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700">
          Create Content
        </Link>
      </div>
      
      <div className="bg-white rounded-xl shadow border p-6">
        <h2 className="text-xl font-semibold mb-4">Content Library</h2>
        
        {posts.length === 0 ? (
          <p className="text-gray-500">No social content created yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-4">Post Type</th>
                  <th className="p-4">Platform</th>
                  <th className="p-4">Content</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Approval</th>
                  <th className="p-4">Version</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map(post => (
                  <tr key={post.id} className="border-b">
                    <td className="p-4 font-medium">{post.post_type}</td>
                    <td className="p-4 font-medium">{post.platform}</td>
                    <td className="p-4 max-w-xs truncate text-gray-700" title={post.caption || 'No caption'}>
                      {post.caption || <span className="italic text-gray-400">Media only</span>}
                      {post.listing && <div className="text-xs text-blue-600 mt-1">Listing: {post.listing.title}</div>}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        post.post_status === 'DRAFT' ? 'bg-gray-200 text-gray-700' :
                        post.post_status === 'SUBMITTED_FOR_REVIEW' ? 'bg-blue-100 text-blue-700' :
                        post.post_status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {post.post_status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        post.approval_status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        post.approval_status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        post.approval_status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {post.approval_status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">v{post.version}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {post.post_status === 'DRAFT' ? (
                          <Link href={`/dashboard/social/content/${post.id}/edit`} className="text-blue-600 hover:underline text-sm">Edit Draft</Link>
                        ) : (
                          <span className="text-gray-400 text-sm">Locked</span>
                        )}
                      </div>
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
