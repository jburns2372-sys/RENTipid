"use client";

import React, { useState, useEffect } from 'react';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/lib/glcc/i18n';

export default function ProviderPreRentalInspectionPage({ params }: { params: Promise<{ id: string }> }) {
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
    formData.append('type', 'Pre-Rental');

    try {
      const res = await fetch(`/api/bookings/${bookingId}/inspection`, {
        method: 'POST',
        body: formData
      });
      
      if (res.ok) {
        router.push(`/dashboard/provider/bookings/${bookingId}`);
      } else {
        const data = await res.json();
        alert(data.message || 'Error submitting inspection');
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
          <h1 className="text-3xl font-bold">{t('admin.preRentalInspection')}</h1>
          <p className="text-gray-500">{t('provider.documentTheAssetCondition')}</p>
        </div>
        <AIAssistantButton context="Inspection Bot" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">{t('provider.1MandatoryPhotos')}</h2>
          <p className="text-xs text-gray-500 mb-4">{t('provider.pleaseUploadClearPhotos')}</p>
          
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
          <h2 className="text-xl font-bold mb-4 border-b pb-2">{t('provider.2AdditionalDocumentation')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t('provider.existingDamagePhotoOptional')}</label>
              <input type="file" name="photo_damage" accept="image/*" className="w-full text-xs mb-2" />
              <textarea name="condition_summary" required placeholder={t('provider.describeOverallConditionAnd')} className="w-full border p-3 rounded text-sm h-24"></textarea>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t('provider.meterOdometerIfApplicable')}</label>
              <input type="file" name="photo_meter" accept="image/*" className="w-full text-xs mb-2" />
              <input type="text" name="odometer_reading" placeholder={t('provider.eG15200')} className="w-full border p-2 rounded text-sm mb-4" />
              
              <label className="block text-sm font-bold text-gray-700 mb-1">{t('provider.accessoriesIncluded')}</label>
              <input type="text" name="accessories_checked" placeholder={t('provider.eG2Keys')} className="w-full border p-2 rounded text-sm" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">{t('provider.3FinalNotes')}</h2>
          <label className="block text-sm font-bold text-gray-700 mb-1">{t('provider.privateNotesToRenter')}</label>
          <textarea name="provider_notes" placeholder={t('provider.anySpecialInstructionsFor')} className="w-full border p-3 rounded text-sm h-20"></textarea>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 transition disabled:opacity-50">
            {loading ? t('common.loading') : 'Submit Pre-Rental Inspection'}
          </button>
        </div>
      </form>
    </div>
  );
}
