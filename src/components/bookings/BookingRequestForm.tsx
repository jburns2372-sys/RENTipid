"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { t, formatPluralDuration } from '@/lib/glcc/i18n';
import { BrowsePriceEstimate } from '@/components/glcc';

interface BookingListing {
  id: string;
  rental_type?: string | null;
  hourly_rate?: number | null;
  daily_rate?: number | null;
  weekly_rate?: number | null;
  monthly_rate?: number | null;
  security_deposit?: number | null;
  delivery_fee?: number | null;
  pickup_available?: boolean | null;
  delivery_available?: boolean | null;
  provider_id?: string | null;
  [key: string]: unknown;
}

interface AuthUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  role?: string;
  status?: string;
  kyc_status?: string;
}

export default function BookingRequestForm({ listing, locale }: { listing: BookingListing; locale?: string }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pickupOption, setPickupOption] = useState('Pickup');
  const [deliveryRequested, setDeliveryRequested] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [renterNotes, setRenterNotes] = useState('');
  const [agreed, setAgreed] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isHourly = listing.rental_type === 'Hourly';
  
  let rentalDuration = 0;
  let baseAmount = 0;

  if (startDate && endDate) {
    const s = new Date(startDate);
    const e = new Date(endDate);
    
    if (isHourly) {
      rentalDuration = Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60)));
      baseAmount = rentalDuration * (listing.hourly_rate || 0);
    } else {
      rentalDuration = Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
      if (listing.rental_type === 'Weekly') {
        rentalDuration = Math.max(1, Math.ceil(rentalDuration / 7));
        baseAmount = rentalDuration * (listing.weekly_rate || 0);
      } else if (listing.rental_type === 'Monthly') {
        rentalDuration = Math.max(1, Math.ceil(rentalDuration / 30));
        baseAmount = rentalDuration * (listing.monthly_rate || 0);
      } else {
        baseAmount = rentalDuration * (listing.daily_rate || 0);
      }
    }
  }

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

    const user = session?.user as AuthUser | undefined;
    if (user?.status !== 'Verified') {
      setError(t('booking.errors.kycRequired', undefined, locale));
      return;
    }

    if (user?.id === listing.provider_id) {
      setError(t('booking.errors.cannotBookOwn', undefined, locale));
      return;
    }

    if (!startDate || !endDate || !agreed) {
      setError(t('booking.errors.fillRequired', undefined, locale));
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
        setError(data.message || t('booking.errors.failedSubmit', undefined, locale));
      }
    } catch {
      setError(t('booking.errors.generic', undefined, locale));
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
        <span className="block text-gray-500 text-sm mb-1">{t('booking.rate', { unit: listing.rental_type || '' }, locale)}</span>
        <BrowsePriceEstimate amount={getRateDisplay() || 0} baseCurrency="PHP" locale={locale} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        {error && <div className="bg-red-50 text-red-600 p-3 rounded text-xs font-medium">{error}</div>}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{t('booking.startDate', undefined, locale)}</label>
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
            <label className="block text-xs font-bold text-gray-700 mb-1">{t('booking.endDate', undefined, locale)}</label>
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
          <label className="block text-xs font-bold text-gray-700 mb-1">{t('booking.receiveOption', undefined, locale)}</label>
          <select 
            value={pickupOption} 
            onChange={e => {
              setPickupOption(e.target.value);
              setDeliveryRequested(e.target.value === 'Delivery');
            }}
            className="w-full border p-2 rounded outline-none focus:border-blue-600"
          >
            {listing.pickup_available && <option value="Pickup">{t('booking.pickupAtProvider', undefined, locale)}</option>}
            {listing.delivery_available && <option value="Delivery">{t('booking.deliverToMe', { fee: listing.delivery_fee || 0 }, locale)}</option>}
          </select>
        </div>

        {deliveryRequested && (
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{t('booking.deliveryAddress', undefined, locale)}</label>
            <textarea 
              required 
              rows={2} 
              value={deliveryAddress}
              onChange={e => setDeliveryAddress(e.target.value)}
              className="w-full border p-2 rounded outline-none focus:border-blue-600"
              placeholder={t('booking.deliveryAddressPlaceholder', undefined, locale)}
            ></textarea>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">{t('booking.notesForProvider', undefined, locale)}</label>
          <textarea 
            rows={2} 
            value={renterNotes}
            onChange={e => setRenterNotes(e.target.value)}
            className="w-full border p-2 rounded outline-none focus:border-blue-600"
            placeholder={t('booking.notesPlaceholder', undefined, locale)}
          ></textarea>
        </div>

        {rentalDuration > 0 && (
          <div className="bg-gray-50 p-4 rounded mt-4 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>{t('booking.durationRateCalculation', { rate: (getRateDisplay() || 0).toLocaleString(), duration: formatPluralDuration(rentalDuration, listing.rental_type || 'day', locale) }, locale)}</span>
              <span>₱{baseAmount.toLocaleString()}</span>
            </div>
            {deposit > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>{t('listing.securityDeposit', undefined, locale).replace(/:$/, '')}</span>
                <span>₱{deposit.toLocaleString()}</span>
              </div>
            )}
            {deliveryFee > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>{t('booking.deliveryFee', undefined, locale)}</span>
                <span>₱{deliveryFee.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 pt-2 border-t mt-2">
              <span>{t('booking.estimatedTotal', undefined, locale)}</span>
              <span>₱{total.toLocaleString()}</span>
            </div>
          </div>
        )}

        <div className="pt-2 flex items-start space-x-2">
          <input type="checkbox" id="agree" required checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-1" />
          <label htmlFor="agree" className="text-xs text-gray-600 leading-tight">
            {t('booking.agreementDisclosure', undefined, locale)}
          </label>
        </div>

        <button 
          type="submit" 
          disabled={loading || !agreed}
          className="w-full bg-blue-600 text-white font-bold py-3 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition"
        >
          {loading ? t('booking.submittingRequest', undefined, locale) : t('booking.requestToBook', undefined, locale)}
        </button>
        
        <p className="text-[11px] text-center text-gray-500 font-medium">
          {t('booking.paymentNotice', undefined, locale)}
        </p>
      </form>
    </div>
  );
}
