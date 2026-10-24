import React from 'react';

export default function SocialFeedbackDashboardPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto text-gray-100">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Feedback Intelligence</h1>
        <p className="text-gray-400">Monitor and respond to AI-classified social feedback.</p>
      </header>

      <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-4">
            <select className="bg-gray-800 border-gray-700 text-white rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500">
              <option>All Sources</option>
              <option>Facebook</option>
              <option>Instagram</option>
            </select>
            <select className="bg-gray-800 border-gray-700 text-white rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500">
              <option>Any Sentiment</option>
              <option>Negative</option>
              <option>Positive</option>
            </select>
            <select className="bg-gray-800 border-gray-700 text-white rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500">
              <option>Any Severity</option>
              <option>CRITICAL</option>
              <option>HIGH</option>
            </select>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-700 text-sm font-semibold text-gray-400">
                <th className="p-3">Source</th>
                <th className="p-3 w-1/3">Feedback</th>
                <th className="p-3">Sentiment</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                <td className="p-3">
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-900/30 text-blue-400 text-xs font-medium">
                    MOCK
                  </span>
                </td>
                <td className="p-3 truncate max-w-xs text-gray-300">
                  I was threatened by the host. This is dangerous and fraud!
                </td>
                <td className="p-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-900/30 text-red-400 text-xs font-medium">
                    NEGATIVE
                  </span>
                </td>
                <td className="p-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-600 text-white text-xs font-bold">
                    CRITICAL
                  </span>
                </td>
                <td className="p-3 text-gray-400">NEW</td>
                <td className="p-3 text-right">
                  <a href="/dashboard/social/feedback/123" className="text-blue-400 hover:text-blue-300 font-medium">
                    Review
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
