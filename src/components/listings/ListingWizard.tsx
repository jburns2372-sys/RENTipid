"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ListingWizard({ categories }: { categories: any[] }) {
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
        router.push(`/dashboard/provider/listings`);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to create listing');
      }
    } catch (err) {
      setError('An error occurred during submission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between mb-8 border-b pb-4">
        {['Basic Info', 'Pricing & Rules', 'Photos', 'Review'].map((label, i) => (
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
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Listing Title *</label>
              <input required name="title" value={formData.title} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" placeholder="e.g. 2023 Honda Click 125i" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description *</label>
              <textarea required name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" placeholder="Describe your item..."></textarea>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <select required name="category_id" value={formData.category_id} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none">
                  <option value="">Select Category...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Condition</label>
                <select name="condition" value={formData.condition} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none">
                  <option value="New">New</option>
                  <option value="Like New">Like New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Used">Used</option>
                </select>
              </div>
            </div>
            <h3 className="font-medium mt-6 mb-2 border-b pb-1">Location Details</h3>
            <div>
              <label className="block text-sm font-medium mb-1">General Location / Pickup Address *</label>
              <input required name="location" value={formData.location} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">City *</label>
                <input required name="city" value={formData.city} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Province *</label>
                <input required name="province" value={formData.province} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-xl font-semibold mb-4">Pricing & Rental Rules</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Primary Rental Type *</label>
                <select required name="rental_type" value={formData.rental_type} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none">
                  <option value="Hourly">Hourly</option>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Daily Rate (₱) *</label>
                <input required type="number" name="daily_rate" value={formData.daily_rate} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Security Deposit (₱)</label>
                <input type="number" name="security_deposit" value={formData.security_deposit} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Estimated Replacement Value (₱)</label>
                <input type="number" name="replacement_value" value={formData.replacement_value} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Minimum Duration (days)</label>
                <input type="number" name="min_duration" value={formData.min_duration} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Maximum Duration (days)</label>
                <input type="number" name="max_duration" value={formData.max_duration} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" />
              </div>
            </div>
            <div className="pt-2">
              <label className="block text-sm font-medium mb-1">Damage Policy</label>
              <textarea name="damage_policy" value={formData.damage_policy} onChange={handleChange} rows={2} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none" placeholder="e.g. Any scratches will deduct ₱500 from the deposit..."></textarea>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-xl font-semibold mb-4">Photos & Documents</h2>
            <div className="bg-yellow-50 p-4 border border-yellow-200 rounded-lg text-sm text-yellow-800 mb-4">
              <strong>Note:</strong> File uploading is simulated for this foundation phase. Once you submit the listing, you will be able to upload real photos and required category documents on the listing management page.
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <p className="text-gray-500">Upload UI Placeholder</p>
              <p className="text-xs text-gray-400 mt-2">Will be integrated with secure upload endpoint.</p>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-xl font-semibold mb-4">Review & Submit</h2>
            <div className="bg-gray-50 p-6 rounded-lg border text-sm space-y-3">
              <p><strong>Title:</strong> {formData.title}</p>
              <p><strong>Category:</strong> {categories.find(c => c.id === formData.category_id)?.name}</p>
              <p><strong>Location:</strong> {formData.location}, {formData.city}</p>
              <p><strong>Daily Rate:</strong> ₱{formData.daily_rate}</p>
              <p><strong>Security Deposit:</strong> ₱{formData.security_deposit || 'None'}</p>
            </div>
            
            <div className="flex items-start mt-6">
              <input required type="checkbox" className="mt-1 mr-3 flex-shrink-0" />
              <p className="text-sm text-gray-700">
                <strong>Provider Declaration:</strong> I declare that I legally own this asset or am legally authorized to offer it for rent. I agree that this listing must comply with RENTipid policies, applicable laws, safety rules, and category requirements.
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8 pt-6 border-t">
          {step > 1 ? (
            <button type="button" onClick={prevStep} className="px-6 py-2 border rounded font-medium text-gray-600 hover:bg-gray-50 transition">Back</button>
          ) : <div></div>}
          
          <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition disabled:opacity-50">
            {loading ? 'Processing...' : step === 4 ? 'Save as Draft & Continue' : 'Next Step'}
          </button>
        </div>
      </form>
    </div>
  );
}
