'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminDocumentActions({
  documentId,
  currentStatus,
  rejectionReason,
  reviewEnabled,
}: {
  documentId: string;
  currentStatus: string;
  rejectionReason?: string | null;
  reviewEnabled: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<'approve' | 'reject' | null>(null);
  const [reason, setReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [error, setError] = useState('');

  async function review(action: 'approve' | 'reject') {
    const rejectionReasonValue = reason.trim();
    if (action === 'reject' && !rejectionReasonValue) {
      setError('A rejection reason is required.');
      return;
    }

    setPending(action);
    setError('');
    try {
      const response = await fetch(`/api/admin/documents/${documentId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: action === 'reject' ? JSON.stringify({ reason: rejectionReasonValue }) : undefined,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Unable to review this document.');

      setShowReject(false);
      setReason('');
      router.refresh();
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Unable to review this document.');
    } finally {
      setPending(null);
    }
  }

  if (currentStatus === 'Approved') {
    return <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700"><Check size={16} /> Approved</span>;
  }

  if (currentStatus === 'Rejected') {
    return (
      <div className="text-right">
        <span className="text-sm font-semibold text-red-700">Rejected</span>
        {rejectionReason && <p className="mt-1 max-w-64 text-xs text-red-700">{rejectionReason}</p>}
      </div>
    );
  }

  if (!reviewEnabled) {
    return <span className="text-sm font-semibold text-gray-700">{currentStatus}</span>;
  }

  return (
    <div className="w-full max-w-72">
      {error && <p role="alert" className="mb-2 text-xs text-red-700">{error}</p>}
      {showReject ? (
        <div className="space-y-2">
          <label htmlFor={`document-reason-${documentId}`} className="sr-only">Document rejection reason</label>
          <input id={`document-reason-${documentId}`} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Required correction" className="h-9 w-full border border-gray-300 px-2 text-sm" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowReject(false)} className="h-8 px-3 text-xs font-medium text-gray-700">Cancel</button>
            <button type="button" onClick={() => review('reject')} disabled={pending !== null} className="h-8 bg-red-700 px-3 text-xs font-semibold text-white disabled:opacity-50">Confirm reject</button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => review('approve')} disabled={pending !== null} className="inline-flex h-9 items-center gap-1 bg-emerald-700 px-3 text-xs font-semibold text-white disabled:opacity-50">
            <Check size={15} /> {pending === 'approve' ? 'Approving...' : 'Approve'}
          </button>
          <button type="button" onClick={() => setShowReject(true)} disabled={pending !== null} className="inline-flex h-9 items-center gap-1 border border-red-700 px-3 text-xs font-semibold text-red-700 disabled:opacity-50">
            <X size={15} /> Reject
          </button>
        </div>
      )}
    </div>
  );
}
