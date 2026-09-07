'use client';

import { useState } from 'react';
import { CheckCircle2, Send, Undo2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

type ListingAction = 'approve' | 'reject' | 'publish' | 'unpublish';

export default function AdminListingActions({
  listingId,
  currentStatus,
  approvalRequirementsPass,
}: {
  listingId: string;
  currentStatus: string;
  approvalRequirementsPass: boolean;
}) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<ListingAction | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const isPendingReview = currentStatus === 'Submitted for Review' || currentStatus === 'Under Review';

  async function runAction(action: ListingAction) {
    const rejectionReason = reason.trim();
    if (action === 'reject' && !rejectionReason) {
      setError('A rejection reason is required.');
      return;
    }

    setPendingAction(action);
    setError('');
    try {
      const response = await fetch(`/api/admin/listings/${listingId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: action === 'reject' ? JSON.stringify({ reason: rejectionReason }) : undefined,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Unable to update this listing.');

      setReason('');
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to update this listing.');
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <section className="border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-950">Review decision</h2>
      <p className="mt-1 text-sm text-gray-600">
        {isPendingReview && 'Approve for publication eligibility or return the listing to the provider.'}
        {currentStatus === 'Approved' && 'Approval is complete. Publish separately when the listing is ready for the marketplace.'}
        {currentStatus === 'Published' && 'This listing is live in the marketplace.'}
        {currentStatus === 'Rejected' && 'The review is complete and the provider can correct and resubmit the listing.'}
        {currentStatus === 'Draft' && 'Draft listings are not eligible for admin review.'}
      </p>

      {error && <p role="alert" className="mt-4 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}

      {isPendingReview && (
        <div className="mt-5 space-y-4">
          <button
            type="button"
            onClick={() => runAction('approve')}
            disabled={pendingAction !== null || !approvalRequirementsPass}
            title={!approvalRequirementsPass ? 'Approve required documents and resolve blocking requirements first' : undefined}
            className="flex h-10 w-full items-center justify-center gap-2 bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            <CheckCircle2 size={17} aria-hidden="true" />
            {pendingAction === 'approve' ? 'Approving...' : 'Approve listing'}
          </button>
          {!approvalRequirementsPass && <p className="text-xs font-medium text-amber-800">Required documents or listing requirements are not ready.</p>}

          <div className="border-t border-gray-200 pt-4">
            <label htmlFor="listing-rejection-reason" className="text-sm font-medium text-gray-800">Rejection reason</label>
            <textarea
              id="listing-rejection-reason"
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Explain what the provider must correct"
              className="mt-2 w-full border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
            />
            <button
              type="button"
              onClick={() => runAction('reject')}
              disabled={pendingAction !== null}
              className="mt-3 flex h-10 w-full items-center justify-center gap-2 border border-red-700 px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <XCircle size={17} aria-hidden="true" />
              {pendingAction === 'reject' ? 'Rejecting...' : 'Reject listing'}
            </button>
          </div>
        </div>
      )}

      {currentStatus === 'Approved' && (
        <button type="button" onClick={() => runAction('publish')} disabled={pendingAction !== null} className="mt-5 flex h-10 w-full items-center justify-center gap-2 bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">
          <Send size={17} aria-hidden="true" />
          {pendingAction === 'publish' ? 'Publishing...' : 'Publish listing'}
        </button>
      )}

      {currentStatus === 'Published' && (
        <button type="button" onClick={() => runAction('unpublish')} disabled={pendingAction !== null} className="mt-5 flex h-10 w-full items-center justify-center gap-2 border border-gray-400 px-4 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50">
          <Undo2 size={17} aria-hidden="true" />
          {pendingAction === 'unpublish' ? 'Unpublishing...' : 'Unpublish listing'}
        </button>
      )}
    </section>
  );
}
