'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface MediationRequestData {
  id: string;
  requestType: string;
  requestedChange: any;
  providerConsentRequired: boolean;
  providerDecision: string | null;
  authoritativeConsequence: any | null;
  consequenceVersion: string | null;
  renterConfirmationRequired: boolean;
  status: string;
  expiresAt: string;
}

export function MediationCard({
  request,
  role,
}: {
  request: MediationRequestData;
  role: 'Provider' | 'Renter';
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProviderDecision = async (action: 'APPROVE' | 'DECLINE') => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/mediation/provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: request.id, action })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRenterConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/mediation/renter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: request.id, action: 'CONFIRM', consequenceVersion: request.consequenceVersion })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const isExpired = new Date(request.expiresAt).getTime() < Date.now();

  return (
    <div className="border border-gray-300 rounded-lg p-4 shadow-sm bg-white mb-4">
      <h3 className="text-lg font-semibold mb-2">Mediation Request: {request.requestType}</h3>
      <div className="mb-4">
        <p className="text-sm text-gray-600">Status: <span className="font-medium text-gray-900">{request.status}</span></p>
        <p className="text-sm text-gray-600">Expires: {new Date(request.expiresAt).toLocaleString()}</p>
      </div>

      <div className="bg-gray-50 p-3 rounded mb-4">
        <h4 className="font-medium text-sm mb-1">Requested Change:</h4>
        <pre className="text-xs overflow-auto">{JSON.stringify(request.requestedChange, null, 2)}</pre>
      </div>

      {request.authoritativeConsequence && (
        <div className="bg-blue-50 p-3 rounded mb-4 border border-blue-100">
          <h4 className="font-medium text-sm text-blue-900 mb-1">Consequence:</h4>
          <pre className="text-xs text-blue-800 overflow-auto">{JSON.stringify(request.authoritativeConsequence, null, 2)}</pre>
        </div>
      )}

      {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
      
      {isExpired && <p className="text-red-500 font-medium">This request has expired.</p>}

      {!isExpired && role === 'Provider' && request.status === 'WAITING_PROVIDER' && (
        <div className="flex gap-2">
          <button 
            disabled={loading}
            onClick={() => handleProviderDecision('APPROVE')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            Approve Change
          </button>
          <button 
            disabled={loading}
            onClick={() => handleProviderDecision('DECLINE')}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            Decline Change
          </button>
        </div>
      )}

      {!isExpired && role === 'Renter' && request.status === 'WAITING_RENTER_CONFIRMATION' && (
        <div className="flex gap-2">
          <button 
            disabled={loading}
            onClick={handleRenterConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Confirm & Execute
          </button>
        </div>
      )}
    </div>
  );
}
