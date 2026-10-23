"use client";

import React, { useState, useEffect } from 'react';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/lib/glcc/i18n';

export default function NewDamageClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [bookingId, setBookingId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    params.then(p => setBookingId(p.id));
  }, [params]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch(`/api/bookings/${bookingId}/claims`, {
        method: 'POST',
        body: formData
      });
      
      if (res.ok) {
        router.push(`/dashboard/provider/bookings/${bookingId}`);
      } else {
        const data = await res.json();
        alert(data.message || 'Error submitting claim');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
      setLoading(false);
    }
  };

  if (!bookingId) return <div className="p-10 text-center">{t('common.loading')}</div>;

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="mb-6">
        <Link href={`/dashboard/provider/bookings/${bookingId}`} className="text-blue-600 hover:underline text-sm font-medium">
          &larr; {t('provider.backToBooking')}
        </Link>
      </div>

      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-red-600">{t('provider.fileADamageClaim')}</h1>
          <p className="text-gray-500">{t('provider.reportAnIssueTo')}</p>
        </div>
        <AIAssistantButton context="Damage Evidence Bot" />
      </div>

      <div className="bg-yellow-50 text-yellow-800 p-4 rounded border border-yellow-200 font-medium mb-8">
        Important: Submitting this claim will immediately hold the renter's deposit and put the booking in a "Disputed" state. The renter will have a chance to respond before an admin reviews it.
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">{t('provider.claimDetails')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t('provider.claimType')} *</label>
              <select name="claim_type" required className="w-full border p-2 rounded text-sm mb-4">
                <option value="Damage">{t('provider.damage')}</option>
                <option value="Missing Item">{t('provider.missingItem')}</option>
                <option value="Late Return">{t('provider.lateReturn')}</option>
                <option value="Cleaning Fee">{t('provider.cleaningFee')}</option>
                <option value="Excess Usage">{t('provider.excessUsage')}</option>
                <option value="Other">{t('provider.other')}</option>
              </select>

              <label className="block text-sm font-bold text-gray-700 mb-1">{t('provider.requestedDeduction')} (₱) *</label>
              <input type="number" step="0.01" min="0" name="requested_deduction_amount" required placeholder={t('provider.amountToDeductFrom')} className="w-full border p-2 rounded text-sm mb-4" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t('provider.detailedDescription')} *</label>
              <textarea name="claim_description" required placeholder={t('provider.describeWhatHappenedAnd')} className="w-full border p-3 rounded text-sm h-32"></textarea>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">{t('provider.evidencePhotos')}</h2>
          <p className="text-xs text-gray-500 mb-4">{t('provider.pleaseUploadClearEvidence')}</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t('provider.evidencePhoto1')} *</label>
              <input type="file" name="photo_1" accept="image/*" required className="w-full text-xs mb-2" />
              <input type="text" name="caption_1" placeholder={t('provider.captionEGDeep')} className="w-full border p-1 rounded text-xs" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t('provider.evidencePhoto2Optional')}</label>
              <input type="file" name="photo_2" accept="image/*" className="w-full text-xs mb-2" />
              <input type="text" name="caption_2" placeholder={t('provider.caption')} className="w-full border p-1 rounded text-xs" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t('provider.evidencePhoto3Optional')}</label>
              <input type="file" name="photo_3" accept="image/*" className="w-full text-xs mb-2" />
              <input type="text" name="caption_3" placeholder={t('provider.caption')} className="w-full border p-1 rounded text-xs" />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Link href={`/dashboard/provider/bookings/${bookingId}`} className="bg-white border border-gray-300 text-gray-700 font-bold py-3 px-8 rounded-xl hover:bg-gray-50 transition">
            {t('common.cancel')}
          </Link>
          <button type="submit" disabled={loading} className="bg-red-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-red-700 transition disabled:opacity-50">
            {loading ? t('common.loading') : 'Submit Claim & Hold Deposit'}
          </button>
        </div>
      </form>
    </div>
  );
}
