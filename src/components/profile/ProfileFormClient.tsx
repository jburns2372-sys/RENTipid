'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AddressForm } from '../address/AddressForm';
import { NormalizedAddress } from '@/lib/address/types';
import { Prisma, User } from '@prisma/client';

type InputFieldProps = {
  label: string;
  name: string;
  type?: string;
  disabled?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const InputField = ({ label, name, type = 'text', disabled, value, onChange }: InputFieldProps) => (
  <div className="mb-4">
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      id={name}
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

export interface ExtendedUserProfile extends Prisma.UserProfileGetPayload<{ include: { global_address: true } }> {
  alternate_mobile_number?: string;
  emergency_contact_name?: string;
  emergency_contact_number?: string;
  email_notifications_enabled?: boolean;
}

export interface ExtendedBusinessProfile extends Prisma.BusinessProfileGetPayload<{ include: { global_business_address: true } }> {
  business_type?: string;
  business_contact_number?: string;
  business_email?: string;
}

interface ProfileFormClientProps {
  user: Partial<User> | null;
  initialUserProfile: ExtendedUserProfile | null;
  initialBusinessProfile: ExtendedBusinessProfile | null;
}

export default function ProfileFormClient({ user, initialUserProfile, initialBusinessProfile }: ProfileFormClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: initialUserProfile?.first_name || '',
    last_name: initialUserProfile?.last_name || '',
    display_name: initialUserProfile?.display_name || '',
    alternate_mobile_number: initialUserProfile?.alternate_mobile_number || '',
    emergency_contact_name: initialUserProfile?.emergency_contact_name || '',
    emergency_contact_number: initialUserProfile?.emergency_contact_number || '',
    email_notifications_enabled: initialUserProfile?.email_notifications_enabled ?? true,
    
    business_name: initialBusinessProfile?.business_name || '',
    business_type: initialBusinessProfile?.business_type || '',
    business_contact_number: initialBusinessProfile?.business_contact_number || '',
    business_email: initialBusinessProfile?.business_email || '',
  });

  const [addressData, setAddressData] = useState<NormalizedAddress | null>((initialUserProfile?.global_address as NormalizedAddress | null) || null);
  const [businessAddressData, setBusinessAddressData] = useState<NormalizedAddress | null>((initialBusinessProfile?.global_business_address as NormalizedAddress | null) || null);

  const [message, setMessage] = useState({ type: '', text: '' });

  const isProvider = ['Individual Provider', 'Business Provider'].includes(user?.role || '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        ...formData,
        global_address: addressData,
        global_business_address: isProvider ? businessAddressData : undefined
      };

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
      router.refresh();
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'An error occurred' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
      <div className="flex justify-between items-center mb-6 border-b pb-2">
        <h2 className="text-xl font-semibold">Profile Details</h2>
        {!isEditing ? (
          <button 
            type="button" 
            onClick={() => setIsEditing(true)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Edit Profile
          </button>
        ) : (
          <button 
            type="button" 
            onClick={() => {
              setIsEditing(false);
              setMessage({ type: '', text: '' });
            }}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium"
          >
            Cancel Edit
          </button>
        )}
      </div>

      {message.text && (
        <div className={`p-4 mb-6 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave}>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
          </div>
          <InputField label="First Name" name="first_name" value={formData.first_name} onChange={handleChange} disabled={!isEditing} />
          <InputField label="Last Name" name="last_name" value={formData.last_name} onChange={handleChange} disabled={!isEditing} />
          <InputField label="Display Name" name="display_name" value={formData.display_name} onChange={handleChange} disabled={!isEditing} />
          <InputField label="Alternate Mobile" name="alternate_mobile_number" value={formData.alternate_mobile_number} onChange={handleChange} disabled={!isEditing} />

          <div className="md:col-span-2 mt-4">
            <AddressForm 
              initialAddress={addressData} 
              onAddressChange={setAddressData} 
              disabled={!isEditing} 
            />
          </div>

          <div className="md:col-span-2 mt-4 border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
          </div>
          <InputField label="Contact Name" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleChange} disabled={!isEditing} />
          <InputField label="Contact Number" name="emergency_contact_number" value={formData.emergency_contact_number} onChange={handleChange} disabled={!isEditing} />

          {isProvider && (
            <>
              <div className="md:col-span-2 mt-4 border-t pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Business Information</h3>
              </div>
              <InputField label="Business Name" name="business_name" value={formData.business_name} onChange={handleChange} disabled={!isEditing} />
              <InputField label="Business Type" name="business_type" value={formData.business_type} onChange={handleChange} disabled={!isEditing} />
              <InputField label="Business Email" name="business_email" type="email" value={formData.business_email} onChange={handleChange} disabled={!isEditing} />
              <InputField label="Business Contact Number" name="business_contact_number" value={formData.business_contact_number} onChange={handleChange} disabled={!isEditing} />
              
              <div className="md:col-span-2 mt-4 mb-2">
                <h4 className="text-md font-medium text-gray-700 mb-2">Business Address</h4>
                <AddressForm 
                  initialAddress={businessAddressData} 
                  onAddressChange={setBusinessAddressData} 
                  disabled={!isEditing} 
                />
              </div>
            </>
          )}

          <div className="md:col-span-2 mt-4 border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="email_notifications_enabled"
                checked={formData.email_notifications_enabled}
                onChange={handleChange}
                disabled={!isEditing}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
              />
              <span className="text-sm font-medium text-gray-700">Receive email notifications</span>
            </label>
          </div>
        </div>

        {isEditing && (
          <div className="mt-8 pt-6 border-t flex justify-end space-x-4">
            <a href="/account/delete" role="button" className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 px-4 py-2 rounded font-medium transition-colors inline-block">
              Delete Account
            </a>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
