"use client";

import React, { useState } from 'react';

export default function ProviderBookingActions({ 
  bookingId, 
  currentStatus,
  hasSignedAgreement = true,
  preRentalInspectionStatus = null,
  releaseTurnoverStatus = null,
  postRentalInspectionStatus = null
}: { 
  bookingId: string, 
  currentStatus: string,
  hasSignedAgreement?: boolean,
  preRentalInspectionStatus?: string | null,
  releaseTurnoverStatus?: string | null,
  postRentalInspectionStatus?: string | null
}) {
  const [rejectReason, setRejectReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);

  const isPending = currentStatus === 'Pending Provider Approval';
  const isApprovedOrPayment = currentStatus === 'Approved' || currentStatus === 'Pending Payment';
  const isConfirmed = currentStatus === 'Confirmed';
  const isOngoing = currentStatus === 'Ongoing';
  const isReturned = currentStatus === 'Returned';
  const isDisputed = currentStatus === 'Disputed';

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold mb-4 border-b pb-2">Actions</h2>
      
      {isPending && !showRejectForm && (
        <div className="space-y-3">
          <form action={`/api/bookings/${bookingId}/status`} method="POST">
            <input type="hidden" name="action" value="APPROVE" />
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 transition">
              Approve Booking
            </button>
          </form>
          <button 
            onClick={() => setShowRejectForm(true)} 
            className="w-full bg-white border border-red-200 text-red-600 font-bold py-2 rounded hover:bg-red-50 transition"
          >
            Reject Booking
          </button>
        </div>
      )}

      {showRejectForm && (
        <form action={`/api/bookings/${bookingId}/status`} method="POST" className="space-y-3 bg-red-50 p-4 rounded border border-red-100">
          <input type="hidden" name="action" value="REJECT" />
          <label className="block text-xs font-bold text-red-800 mb-1">Reason for Rejection</label>
          <textarea 
            name="reason" 
            required 
            rows={2}
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            className="w-full border p-2 rounded outline-none focus:border-red-400 text-sm"
            placeholder="Please explain why..."
          ></textarea>
          <div className="flex space-x-2">
            <button type="button" onClick={() => setShowRejectForm(false)} className="flex-1 bg-white border border-gray-300 text-gray-600 font-bold py-2 rounded hover:bg-gray-50 text-sm">Cancel</button>
            <button type="submit" className="flex-1 bg-red-600 text-white font-bold py-2 rounded hover:bg-red-700 text-sm">Confirm Reject</button>
          </div>
        </form>
      )}

      {isApprovedOrPayment && !showCancelForm && (
        <div className="space-y-3">
          <form action={`/api/bookings/${bookingId}/status`} method="POST">
            <input type="hidden" name="action" value="CONFIRM" />
            <button type="submit" className="w-full bg-green-600 text-white font-bold py-2 rounded hover:bg-green-700 transition">
              Mark as Confirmed
            </button>
          </form>
          <button 
            onClick={() => setShowCancelForm(true)} 
            className="w-full bg-white border border-red-200 text-red-600 font-bold py-2 rounded hover:bg-red-50 transition"
          >
            Cancel Booking
          </button>
        </div>
      )}

      {isConfirmed && !showCancelForm && (
        <div className="space-y-3">
          {!hasSignedAgreement ? (
            <form action={`/api/bookings/${bookingId}/provider-agreement`} method="POST">
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 transition">
                Sign & Accept Agreement
              </button>
            </form>
          ) : !preRentalInspectionStatus ? (
            <a href={`/dashboard/provider/bookings/${bookingId}/inspection`} className="block text-center w-full bg-indigo-600 text-white font-bold py-2 rounded hover:bg-indigo-700 transition">
              Start Pre-Rental Inspection
            </a>
          ) : preRentalInspectionStatus === 'Submitted by Provider' ? (
            <div className="bg-yellow-50 p-3 rounded text-sm text-yellow-800 border border-yellow-200 text-center font-medium">
              Waiting for Renter to confirm condition
            </div>
          ) : preRentalInspectionStatus === 'Requires Review' ? (
            <div className="bg-red-50 p-3 rounded text-sm text-red-800 border border-red-200 text-center font-medium">
              Renter flagged a discrepancy in the inspection
            </div>
          ) : preRentalInspectionStatus === 'Confirmed by Renter' && !releaseTurnoverStatus ? (
            <a href={`/dashboard/provider/bookings/${bookingId}/turnover`} className="block text-center w-full bg-purple-600 text-white font-bold py-2 rounded hover:bg-purple-700 transition">
              Complete Handover (Release)
            </a>
          ) : (
            <div className="bg-gray-50 p-3 rounded text-sm text-gray-500 border border-gray-200 text-center font-medium">
              Processing Handover...
            </div>
          )}

          <button 
            onClick={() => setShowCancelForm(true)} 
            className="w-full bg-white border border-red-200 text-red-600 font-bold py-2 rounded hover:bg-red-50 transition"
          >
            Cancel Booking
          </button>
        </div>
      )}

      {isOngoing && (
        <div className="space-y-3">
          <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 border border-blue-200 text-center font-medium mb-3">
            Item is currently with the renter.
          </div>
          {/* Renter initiates return, or provider can force it via turnover */}
          <a href={`/dashboard/provider/bookings/${bookingId}/turnover?type=return`} className="block text-center w-full bg-teal-600 text-white font-bold py-2 rounded hover:bg-teal-700 transition">
            Confirm Item Returned
          </a>
        </div>
      )}

      {isReturned && (
        <div className="space-y-3">
          {!postRentalInspectionStatus ? (
            <a href={`/dashboard/provider/bookings/${bookingId}/return-inspection`} className="block text-center w-full bg-orange-600 text-white font-bold py-2 rounded hover:bg-orange-700 transition">
              Start Post-Rental Inspection
            </a>
          ) : (
            <div className="bg-gray-50 p-3 rounded text-sm text-gray-500 border border-gray-200 text-center font-medium">
              Return Inspection Submitted
            </div>
          )}
        </div>
      )}

      {isDisputed && (
        <div className="space-y-3">
          <div className="bg-red-50 p-3 rounded text-sm text-red-800 border border-red-200 text-center font-medium mb-3">
            This booking has an active damage claim or dispute.
          </div>
          <a href={`/dashboard/provider/bookings/${bookingId}/claims`} className="block text-center w-full bg-red-600 text-white font-bold py-2 rounded hover:bg-red-700 transition">
            View Damage Claim Status
          </a>
        </div>
      )}

      {showCancelForm && (
        <form action={`/api/bookings/${bookingId}/status`} method="POST" className="space-y-3 bg-red-50 p-4 rounded border border-red-100">
          <input type="hidden" name="action" value="CANCEL_BY_PROVIDER" />
          <label className="block text-xs font-bold text-red-800 mb-1">Reason for Cancellation</label>
          <textarea 
            name="reason" 
            required 
            rows={2}
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            className="w-full border p-2 rounded outline-none focus:border-red-400 text-sm"
            placeholder="Please provide a valid reason..."
          ></textarea>
          <div className="flex space-x-2">
            <button type="button" onClick={() => setShowCancelForm(false)} className="flex-1 bg-white border border-gray-300 text-gray-600 font-bold py-2 rounded hover:bg-gray-50 text-sm">Go Back</button>
            <button type="submit" className="flex-1 bg-red-600 text-white font-bold py-2 rounded hover:bg-red-700 text-sm">Confirm Cancel</button>
          </div>
        </form>
      )}

      {!isPending && !isApprovedOrPayment && !isConfirmed && !isOngoing && !isReturned && (
         <div className="text-center py-4">
           <span className="text-gray-500 font-medium">No actions available at this stage.</span>
         </div>
      )}
    </div>
  );
}
