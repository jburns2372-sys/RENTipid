import React from 'react';

export default function SocialFeedbackDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-8 max-w-5xl mx-auto text-gray-100">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <a href="/dashboard/social/feedback" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block flex items-center">
            &larr; Back to Feedback
          </a>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            Feedback Review
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-600 text-white text-xs font-bold uppercase">
              CRITICAL
            </span>
          </h1>
        </div>
        <div className="flex gap-3">
          <button className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 px-4 py-2 rounded-md text-sm font-medium transition-colors">
            Generate AI Response
          </button>
          <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-md transition-colors">
            Escalate to Incident
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
            <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-3">Original Content</h2>
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800 text-gray-300 italic">
              "I was threatened by the host. This is dangerous and fraud!"
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wider">Source Provider</p>
                <p className="text-sm font-medium text-gray-300">MOCK (Event ID: fb_mock_123)</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wider">Received At</p>
                <p className="text-sm font-medium text-gray-300">Aug 13, 2026, 10:45 AM</p>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-3 flex justify-between items-center">
              AI Classification
              <span className="text-xs font-normal text-gray-500">Advisory Only</span>
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Sentiment</span>
                <select className="bg-gray-800 border-gray-700 text-white rounded-md px-3 py-1.5 text-sm w-40 focus:ring-blue-500">
                  <option value="NEGATIVE">NEGATIVE</option>
                  <option value="NEUTRAL">NEUTRAL</option>
                  <option value="POSITIVE">POSITIVE</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Severity</span>
                <select className="bg-gray-800 border-gray-700 text-white rounded-md px-3 py-1.5 text-sm w-40 focus:ring-blue-500">
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Detected Topic</span>
                <input type="text" defaultValue="Safety / Fraud" className="bg-gray-800 border-gray-700 text-white rounded-md px-3 py-1.5 text-sm w-40 focus:ring-blue-500" />
              </div>
              <div className="pt-4 mt-2 border-t border-gray-800 flex justify-end">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-xs font-medium transition-colors">
                  Save Override
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-1 space-y-6">
          <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Case Linkage</h2>
            <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700 border-dashed text-center">
              <p className="text-sm text-gray-400 mb-3">No case currently linked.</p>
              <button className="text-sm text-blue-400 font-medium hover:text-blue-300">
                Link Existing Case
              </button>
            </div>
          </div>

          <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Response Draft</h2>
            <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700 text-sm text-gray-500 italic">
              No response drafted yet. Click "Generate AI Response" to draft a reply.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
