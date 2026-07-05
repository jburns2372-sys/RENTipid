"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDocumentActions({ docId, currentStatus }: { docId: string, currentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  const handleAction = async (action: 'APPROVE' | 'REJECT') => {
    if (action === 'REJECT' && !reason) {
      alert('Please provide a rejection reason');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/documents/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: docId, action, reason })
      });

      if (res.ok) {
        setShowReject(false);
        router.refresh();
      } else {
        alert('Failed to update document status');
      }
    } catch (err) {
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (currentStatus === 'Approved') {
    return <span className="text-green-600 font-bold text-sm">✓ Approved</span>;
  }

  return (
    <div className="flex flex-col items-end">
      {showReject ? (
        <div className="flex flex-col space-y-2 mt-2 w-64">
          <input 
            type="text" 
            placeholder="Rejection reason..." 
            value={reason} 
            onChange={e => setReason(e.target.value)}
            className="border p-1.5 text-xs rounded"
          />
          <div className="flex space-x-2">
            <button onClick={() => handleAction('REJECT')} disabled={loading} className="bg-red-600 text-white px-2 py-1 rounded text-xs">Confirm Reject</button>
            <button onClick={() => setShowReject(false)} className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="flex space-x-2">
          <button onClick={() => handleAction('APPROVE')} disabled={loading} className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded text-xs font-semibold transition">
            Approve
          </button>
          <button onClick={() => setShowReject(true)} disabled={loading} className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded text-xs font-semibold transition">
            Reject
          </button>
        </div>
      )}
    </div>
  );
}
