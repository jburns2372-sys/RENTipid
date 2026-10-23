"use client";

import React, { useState, useEffect } from 'react';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/lib/glcc/i18n';

export default function ProviderReturnInspectionPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [bookingId, setBookingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [issueFound, setIssueFound] = useState(false);

  useEffect(() => {
    params.then(p => setBookingId(p.id));
  }, [params]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append('type', 'Post-Rental');
    formData.append('issue_found', String(issueFound));

    try {
      const res = await fetch(`/api/bookings/${bookingId}/inspection`, {
        method: 'POST',
        body: formData
      });
      
      if (res.ok) {
        if (issueFound) {
          router.push(`/dashboard/provider/bookings/${bookingId}/claims/new`);
        } else {
          router.push(`/dashboard/provider/bookings/${bookingId}`);
        }
      } else {
        const data = await res.json();
        alert(data.message || 'Error submitting return inspection');
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
          <h1 className="text-3xl font-bold">{t('provider.postRentalReturnInspection')}</h1>
          <p className="text-gray-500">{t('provider.documentTheConditionOf')}</p>
        </div>
        <AIAssistantButton context="Inspection Bot" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">{t('provider.1ReturnPhotos')}</h2>
          <p className="text-xs text-gray-500 mb-4">{t('provider.uploadPhotosShowingThe')}</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t('provider.frontView')} *</label>
              <input type="file" name="photo_front" accept="image/*" required className="w-full text-xs" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t('provider.backView')} *</label>
              <input type="file" name="photo_back" accept="image/*" required className="w-full text-xs" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t('provider.leftSide')} *</label>
              <input type="file" name="photo_left" accept="image/*" required className="w-full text-xs" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t('provider.rightSide')} *</label>
              <input type="file" name="photo_right" accept="image/*" required className="w-full text-xs" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">{t('provider.2ReturnConditionDetails')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t('provider.overallConditionSummary')}</label>
              <textarea name="condition_summary" required placeholder={t('provider.describeOverallConditionUpon')} className="w-full border p-3 rounded text-sm h-24"></textarea>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t('provider.finalMeterOdometerIf')}</label>
              <input type="text" name="odometer_reading" placeholder={t('provider.eG15300')} className="w-full border p-2 rounded text-sm mb-4" />
              
              <label className="block text-sm font-bold text-gray-700 mb-1">{t('provider.accessoriesReturned')}</label>
              <input type="text" name="accessories_checked" placeholder={t('provider.eG2Keys')} className="w-full border p-2 rounded text-sm" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">{t('provider.3IssueAssessment')}</h2>
          
          <div className="bg-gray-50 p-4 rounded border mb-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={issueFound} 
                onChange={(e) => setIssueFound(e.target.checked)} 
                className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
              />
              <span className="font-bold text-gray-900">{t('provider.iFoundAnIssue')}</span>
            </label>
            <p className="text-sm text-gray-500 mt-2 ml-8">
              Check this box if you need to deduct from the security deposit. You will be directed to the Damage Claim form after submitting this inspection.
            </p>
          </div>

          {!issueFound && (
            <div className="bg-green-50 text-green-800 p-4 rounded border border-green-200 font-medium">
              By submitting this inspection with NO ISSUES, the booking will be marked Complete and the Renter's Security Deposit will be authorized for full release.
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={loading} className={`text-white font-bold py-3 px-8 rounded-xl transition disabled:opacity-50 ${issueFound ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
            {loading ? t('common.loading') : issueFound ? 'Submit & File Damage Claim' : 'Submit & Release Deposit'}
          </button>
        </div>
      </form>
    </div>
  );
}
