"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function BookingRequestForm({ listing }: { listing: any }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pickupOption, setPickupOption] = useState('Pickup');
  const [deliveryRequested, setDeliveryRequested] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [renterNotes, setRenterNotes] = useState('');
  const [agreed, setAgreed] = useState(false);
  
  const [rentalDuration, setRentalDuration] = useState(0);
  const [baseAmount, setBaseAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isHourly = listing.rental_type === 'Hourly';
  
  useEffect(() => {
    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      let duration = 0;
      
      if (isHourly) {
        // Just simple hour diff for demo
        duration = Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60)));
        setBaseAmount(duration * (listing.hourly_rate || 0));
      } else {
        // Daily diff
        duration = Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
        if (listing.rental_type === 'Weekly') {
          duration = Math.max(1, Math.ceil(duration / 7));
          setBaseAmount(duration * (listing.weekly_rate || 0));
        } else if (listing.rental_type === 'Monthly') {
          duration = Math.max(1, Math.ceil(duration / 30));
          setBaseAmount(duration * (listing.monthly_rate || 0));
        } else {
          setBaseAmount(duration * (listing.daily_rate || 0));
        }
      }
      setRentalDuration(duration);
    } else {
      setRentalDuration(0);
      setBaseAmount(0);
    }
  }, [startDate, endDate, listing, isHourly]);

  const deposit = listing.security_deposit || 0;
  const deliveryFee = deliveryRequested ? (listing.delivery_fee || 0) : 0;
  const total = baseAmount + deposit + deliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    const user = session?.user as any;
    if (user?.status !== 'Verified') {
      setError('You must be a Verified user to request a booking. Please complete KYC verification in your dashboard.');
      return;
    }

    if (user?.id === listing.provider_id) {
      setError('You cannot book your own listing.');
      return;
    }

    if (!startDate || !endDate || !agreed) {
      setError('Please fill all required fields and agree to the policies.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: listing.id,
          start_date: startDate,
          end_date: endDate,
          rental_duration: rentalDuration,
          rental_duration_unit: listing.rental_type,
          pickup_option: pickupOption,
          delivery_requested: deliveryRequested,
          delivery_address: deliveryAddress,
          renter_notes: renterNotes
        })
      });

      const data = await res.json();
      if (res.ok) {
        router.push(`/dashboard/renter/bookings/${data.booking_id}`);
      } else {
        setError(data.message || 'Failed to submit booking request');
      }
    } catch (err) {
      setError('An error occurred while submitting the booking.');
    } finally {
      setLoading(false);
    }
  };

  const getRateDisplay = () => {
    switch (listing.rental_type) {
      case 'Hourly': return listing.hourly_rate;
      case 'Weekly': return listing.weekly_rate;
      case 'Monthly': return listing.monthly_rate;
      default: return listing.daily_rate;
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-24">
      <div className="mb-6 pb-6 border-b">
        <span className="block text-gray-500 text-sm mb-1">{listing.rental_type} Rate</span>
        <span className="text-3xl font-bold text-gray-900">₱{getRateDisplay()?.toLocaleString() || 0}</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        {error && <div className="bg-red-50 text-red-600 p-3 rounded text-xs font-medium">{error}</div>}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Start Date/Time</label>
            <input 
              type={isHourly ? "datetime-local" : "date"} 
              required
              min={new Date().toISOString().slice(0, 10)}
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              className="w-full border p-2 rounded outline-none focus:border-blue-600"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">End Date/Time</label>
            <input 
              type={isHourly ? "datetime-local" : "date"} 
              required
              min={startDate || new Date().toISOString().slice(0, 10)}
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              className="w-full border p-2 rounded outline-none focus:border-blue-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Receive Option</label>
          <select 
            value={pickupOption} 
            onChange={e => {
              setPickupOption(e.target.value);
              setDeliveryRequested(e.target.value === 'Delivery');
            }}
            className="w-full border p-2 rounded outline-none focus:border-blue-600"
          >
            {listing.pickup_available && <option value="Pickup">Pickup at Provider</option>}
            {listing.delivery_available && <option value="Delivery">Deliver to Me (+₱{listing.delivery_fee})</option>}
          </select>
        </div>

        {deliveryRequested && (
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Delivery Address</label>
            <textarea 
              required 
              rows={2} 
              value={deliveryAddress}
              onChange={e => setDeliveryAddress(e.target.value)}
              className="w-full border p-2 rounded outline-none focus:border-blue-600"
              placeholder="Enter full delivery address..."
            ></textarea>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Notes for Provider</label>
          <textarea 
            rows={2} 
            value={renterNotes}
            onChange={e => setRenterNotes(e.target.value)}
            className="w-full border p-2 rounded outline-none focus:border-blue-600"
            placeholder="Any questions or special requests..."
          ></textarea>
        </div>

        {rentalDuration > 0 && (
          <div className="bg-gray-50 p-4 rounded mt-4 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>₱{getRateDisplay()?.toLocaleString()} x {rentalDuration} {listing.rental_type}(s)</span>
              <span>₱{baseAmount.toLocaleString()}</span>
            </div>
            {deposit > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Security Deposit</span>
                <span>₱{deposit.toLocaleString()}</span>
              </div>
            )}
            {deliveryFee > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span>₱{deliveryFee.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 pt-2 border-t mt-2">
              <span>Estimated Total</span>
              <span>₱{total.toLocaleString()}</span>
            </div>
          </div>
        )}

        <div className="pt-2 flex items-start space-x-2">
          <input type="checkbox" id="agree" required checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-1" />
          <label htmlFor="agree" className="text-xs text-gray-600 leading-tight">
            I understand that this booking request is subject to provider approval, rental rules, deposit requirements, and RENTipid platform policies.
          </label>
        </div>

        <button 
          type="submit" 
          disabled={loading || !agreed}
          className="w-full bg-blue-600 text-white font-bold py-3 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition"
        >
          {loading ? 'Submitting Request...' : 'Request to Book'}
        </button>
        
        <p className="text-[11px] text-center text-gray-500 font-medium">
          Payment processing will be activated in the next phase.<br/>This booking request does not collect payment yet.
        </p>
      </form>
    </div>
  );
}
