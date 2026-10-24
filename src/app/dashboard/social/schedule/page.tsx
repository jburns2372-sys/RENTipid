import React from 'react';
import { PrismaClient } from '@prisma/client';
import { redirect } from 'next/navigation';
import { SocialScheduler } from '@/lib/social/social-scheduler';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function SocialSchedulePage() {
  const approvedPosts = await prisma.marketingPost.findMany({
    where: { post_status: 'APPROVED' },
    orderBy: { updated_at: 'desc' }
  });

  const scheduledPosts = await prisma.marketingPost.findMany({
    where: { post_status: 'SCHEDULED' },
    orderBy: { scheduled_at: 'asc' }
  });

  const accounts = await prisma.socialAccount.findMany({
    where: { health_status: 'HEALTHY', connection_status: { in: ['CONFIGURED', 'LIVE_READY'] } }
  });

  const MOCK_USER_ID = "mock-scheduler-id";

  async function handleSchedule(formData: FormData) {
    'use server';
    const postId = formData.get('postId') as string;
    const accountId = formData.get('accountId') as string;
    const dateStr = formData.get('scheduleDate') as string;
    const timeStr = formData.get('scheduleTime') as string;
    
    if (!postId || !accountId || !dateStr || !timeStr) {
      throw new Error("Missing required scheduling fields.");
    }

    const scheduledDate = new Date(`${dateStr}T${timeStr}`);
    
    await SocialScheduler.schedulePost({
      postId,
      targetAccountId: accountId,
      date: scheduledDate,
      userId: MOCK_USER_ID
    });
    
    redirect('/dashboard/social/schedule');
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Scheduling Engine</h1>
        <Link href="/dashboard/social/approvals" className="text-blue-600 hover:underline font-medium">
          &larr; Back to Approvals
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* left column: queue of approved content ready to schedule */}
        <div className="bg-white rounded-xl shadow border p-6">
          <h2 className="text-xl font-semibold mb-4 text-green-600">Schedule Approved Content</h2>
          
          {approvedPosts.length === 0 ? (
            <p className="text-gray-500">No approved posts waiting to be scheduled.</p>
          ) : (
            <div className="space-y-6">
              {approvedPosts.map(post => (
                <div key={post.id} className="border rounded-lg p-4 bg-gray-50 relative">
                  <div className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">
                    v{post.version}
                  </div>
                  <p className="font-semibold mb-1">{post.platform} Post</p>
                  <p className="text-sm text-gray-700 mb-4 line-clamp-2">{post.caption || 'Media only'}</p>
                  
                  <form className="space-y-3 bg-white p-3 rounded border">
                    <input type="hidden" name="postId" value={post.id} />
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Target Account</label>
                      <select name="accountId" className="w-full border rounded p-1.5 text-sm" required defaultValue="">
                        <option value="" disabled>Select account...</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.platform} - {acc.account_name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                        <input type="date" name="scheduleDate" className="w-full border rounded p-1.5 text-sm" required />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Time</label>
                        <input type="time" name="scheduleTime" className="w-full border rounded p-1.5 text-sm" required />
                      </div>
                    </div>
                    
                    <button formAction={handleSchedule} className="w-full bg-purple-600 text-white py-2 rounded text-sm font-medium hover:bg-purple-700">
                      Submit to Queue
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* right column: timeline of scheduled content */}
        <div className="bg-white rounded-xl shadow border p-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-600">Upcoming Scheduled Posts</h2>
          
          {scheduledPosts.length === 0 ? (
            <p className="text-gray-500">Queue is empty.</p>
          ) : (
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
              {scheduledPosts.map(post => (
                <div key={post.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-purple-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  </div>
                  
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl shadow border bg-white">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-bold text-slate-900">{post.platform}</div>
                      <time className="font-caveat font-medium text-purple-600">
                        {post.scheduled_at ? new Date(post.scheduled_at).toLocaleString() : 'Unknown Time'}
                      </time>
                    </div>
                    <div className="text-slate-600 text-sm line-clamp-2">
                      {post.caption || 'Media only content'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
