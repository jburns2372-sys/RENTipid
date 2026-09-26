"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/lib/glcc/i18n';

export default function ListingWizard({ categories }: { categories: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // State for form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    location: '',
    city: '',
    province: '',
    country: 'Philippines',
    rental_type: 'Daily',
    hourly_rate: '',
    daily_rate: '',
    weekly_rate: '',
    monthly_rate: '',
    security_deposit: '',
    replacement_value: '',
    quantity: 1,
    condition: 'Good',
    pickup_available: true,
    delivery_available: false,
    delivery_fee: '',
    min_duration: 1,
    max_duration: '',
    late_penalty: '',
    damage_policy: '',
    rules: '',
    included_accessories: '',
    excluded_accessories: '',
    special_instructions: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, status: 'Draft' })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.id) {
          router.push(`/dashboard/provider/listings/${data.id}`);
        } else {
          router.push(`/dashboard/provider/listings`);
        }
      } else {
        const data = await res.json();
        setError(data.message || t('listingWizard.errorFailed'));
      }
    } catch {
      setError(t('listingWizard.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = [
    t('listingWizard.stepBasicInfo'),
    t('listingWizard.stepPricingRules'),
    t('listingWizard.stepPhotos'),
    t('listingWizard.stepReview'),
  ];

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between mb-8 border-b pb-4">
        {stepLabels.map((label, i) => (
          <div key={i} className={`flex flex-col items-center flex-1 ${step >= i + 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 ${step >= i + 1 ? 'bg-blue-100' : 'bg-gray-100'}`}>
              {i + 1}
            </div>
            <span className="text-sm font-medium">{label}</span>
          </div>
        ))}
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-6 text-sm">{error}</div>}

      <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }}>
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-xl font-semibold mb-4">{t('listingWizard.basicInfoHeading')}</h2>
            <div>
              <label className="block text-sm font-medium mb-1">{t('listingWizard.titleLabel')}</label>
              <input required name="title" value={formData.title} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" placeholder={t('listingWizard.titlePlaceholder')} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('listingWizard.descriptionLabel')}</label>
              <textarea required name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" placeholder={t('listingWizard.descriptionPlaceholder')}></textarea>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('listingWizard.categoryLabel')}</label>
                <select required name="category_id" value={formData.category_id} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none">
                  <option value="">{t('listingWizard.categorySelectPlaceholder')}</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('listingWizard.conditionLabel')}</label>
                <select name="condition" value={formData.condition} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none">
                  <option value="New">{t('listingWizard.condition.new')}</option>
                  <option value="Like New">{t('listingWizard.condition.likeNew')}</option>
                  <option value="Good">{t('listingWizard.condition.good')}</option>
                  <option value="Fair">{t('listingWizard.condition.fair')}</option>
                  <option value="Used">{t('listingWizard.condition.used')}</option>
                </select>
              </div>
            </div>
            <h3 className="font-medium mt-6 mb-2 border-b pb-1">{t('listingWizard.locationHeading')}</h3>
            <div>
              <label className="block text-sm font-medium mb-1">{t('listingWizard.locationLabel')}</label>
              <input required name="location" value={formData.location} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('listingWizard.cityLabel')}</label>
                <input required name="city" value={formData.city} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('listingWizard.provinceLabel')}</label>
                <input required name="province" value={formData.province} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-xl font-semibold mb-4">{t('listingWizard.pricingHeading')}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('listingWizard.rentalTypeLabel')}</label>
                <select required name="rental_type" value={formData.rental_type} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none">
                  <option value="Hourly">{t('listingWizard.rentalType.hourly')}</option>
                  <option value="Daily">{t('listingWizard.rentalType.daily')}</option>
                  <option value="Weekly">{t('listingWizard.rentalType.weekly')}</option>
                  <option value="Monthly">{t('listingWizard.rentalType.monthly')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('listingWizard.dailyRateLabel')}</label>
                <input required type="number" name="daily_rate" value={formData.daily_rate} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('listingWizard.securityDepositLabel')}</label>
                <input type="number" name="security_deposit" value={formData.security_deposit} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('listingWizard.replacementValueLabel')}</label>
                <input type="number" name="replacement_value" value={formData.replacement_value} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('listingWizard.minDurationLabel')}</label>
                <input type="number" name="min_duration" value={formData.min_duration} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('listingWizard.maxDurationLabel')}</label>
                <input type="number" name="max_duration" value={formData.max_duration} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
              </div>
            </div>
            <div className="pt-2">
              <label className="block text-sm font-medium mb-1">{t('listingWizard.damagePolicyLabel')}</label>
              <textarea name="damage_policy" value={formData.damage_policy} onChange={handleChange} rows={2} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" placeholder={t('listingWizard.damagePolicyPlaceholder')}></textarea>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-xl font-semibold mb-4">{t('listingWizard.photosHeading')}</h2>
            <div className="bg-yellow-50 p-4 border border-yellow-200 rounded-lg text-sm text-yellow-800 mb-4">
              <strong>{t('listingWizard.photosNoteTitle')}</strong> {t('listingWizard.photosNoteBody')}
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <p className="text-gray-500">{t('listingWizard.uploadPlaceholder')}</p>
              <p className="text-xs text-gray-400 mt-2">{t('listingWizard.uploadSubtext')}</p>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-xl font-semibold mb-4">{t('listingWizard.reviewHeading')}</h2>
            <div className="bg-gray-50 p-6 rounded-lg border text-sm space-y-3">
              <p><strong>{t('listingWizard.reviewTitle')}</strong> {formData.title}</p>
              <p><strong>{t('listingWizard.reviewCategory')}</strong> {categories.find(c => c.id === formData.category_id)?.name}</p>
              <p><strong>{t('listingWizard.reviewLocation')}</strong> {formData.location}, {formData.city}</p>
              <p><strong>{t('listingWizard.reviewDailyRate')}</strong> ₱{formData.daily_rate}</p>
              <p><strong>{t('listingWizard.reviewSecurityDeposit')}</strong> ₱{formData.security_deposit || 'None'}</p>
            </div>
            
            <div className="flex items-start mt-6">
              <input required type="checkbox" className="mt-1 mr-3 flex-shrink-0" />
              <p className="text-sm text-gray-700">
                <strong>{t('listingWizard.declarationTitle')}</strong> {t('listingWizard.declarationBody')}
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8 pt-6 border-t">
          {step > 1 ? (
            <button type="button" onClick={prevStep} className="px-6 py-2 border rounded font-medium text-gray-600 hover:bg-gray-50 transition">{t('listingWizard.backButton')}</button>
          ) : <div></div>}
          
          <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition disabled:opacity-50">
            {loading ? t('listingWizard.processingButton') : step === 4 ? t('listingWizard.submitDraftButton') : t('listingWizard.nextButton')}
          </button>
        </div>
      </form>
    </div>
  );
}
