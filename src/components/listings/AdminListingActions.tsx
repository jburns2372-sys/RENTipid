"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminListingActions({ listingId, currentStatus, canPublish }: { listingId: string, currentStatus: string, canPublish: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  const handleAction = async (action: 'APPROVE' | 'REJECT' | 'PUBLISH') => {
    if (action === 'REJECT' && !reason) {
      alert('Please provide a rejection reason');
      return;
    }

    if (action === 'PUBLISH' && !canPublish) {
      alert('Cannot publish. Check if provider is verified and all required documents are approved.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/listings/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId, action, reason })
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to update listing status');
      }
    } catch (err) {
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 border rounded-lg p-4 space-y-4">
      <h3 className="font-bold text-gray-800 border-b pb-2">Admin Actions</h3>
      
      {currentStatus !== 'Published' && (
        <div className="flex flex-col space-y-3">
          <button 
            onClick={() => handleAction('PUBLISH')} 
            disabled={loading || !canPublish} 
            className="w-full bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Approve & Publish Listing
          </button>
          
          <div className="flex flex-col space-y-2 pt-4 border-t">
            <input 
              type="text" 
              placeholder="Rejection reason..." 
              value={reason} 
              onChange={e => setReason(e.target.value)}
              className="border p-2 text-sm rounded w-full outline-none focus:ring-1 focus:ring-red-600"
            />
            <button 
              onClick={() => handleAction('REJECT')} 
              disabled={loading} 
              className="w-full bg-red-100 text-red-700 py-2 rounded font-bold hover:bg-red-200 transition"
            >
              Reject Listing
            </button>
          </div>
        </div>
      )}

      {currentStatus === 'Published' && (
        <div className="text-center py-4 text-green-600 font-bold">
          Listing is Published
        </div>
      )}
    </div>
  );
}
