'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AdminProfileFormClientProps {
  targetUserId: string;
  initialData: any;
  hasEditPermission: boolean;
}

export default function AdminProfileFormClient({ targetUserId, initialData, hasEditPermission }: AdminProfileFormClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: initialData.profile?.first_name || '',
    last_name: initialData.profile?.last_name || '',
    display_name: initialData.profile?.display_name || '',
    verification_status: initialData.profile?.verification_status || 'Unverified',
    account_status: initialData.status || 'Active',
    admin_reason: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.admin_reason || formData.admin_reason.length < 5) {
      setMessage({ type: 'error', text: 'A detailed reason is required for administrative changes.' });
      return;
    }

    if (!window.confirm('Are you sure you want to apply these administrative changes? This action will be audited.')) {
      return;
    }

    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch(`/api/admin/users/${targetUserId}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
      setFormData(prev => ({ ...prev, admin_reason: '' })); // reset reason
      router.refresh(); 
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'An error occurred' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6 border-b pb-2">
        <h2 className="text-xl font-semibold">User Details & Administration</h2>
        {hasEditPermission && !isEditing && (
          <button onClick={() => setIsEditing(true)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Edit Profile
          </button>
        )}
        {isEditing && (
          <button onClick={() => { setIsEditing(false); setMessage({ type: '', text: ''}); }} className="text-gray-500 text-sm font-medium">
            Cancel
          </button>
        )}
      </div>

      {message.text && (
        <div className={`p-4 mb-6 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
          <input
            type="text" name="first_name" value={formData.first_name}
            onChange={handleChange} disabled={!isEditing}
            className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-50 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
          <input
            type="text" name="last_name" value={formData.last_name}
            onChange={handleChange} disabled={!isEditing}
            className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-50 focus:ring-blue-500"
          />
        </div>
        
        <div className="pt-4 border-t mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
          <select
            name="account_status" value={formData.account_status}
            onChange={handleChange} disabled={!isEditing}
            className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-50"
          >
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Verification Status</label>
          <select
            name="verification_status" value={formData.verification_status}
            onChange={handleChange} disabled={!isEditing}
            className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-50"
          >
            <option value="Unverified">Unverified</option>
            <option value="Pending">Pending</option>
            <option value="Verified">Verified</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {isEditing && (
          <div className="pt-4 border-t mt-4">
            <label className="block text-sm font-medium text-red-700 mb-1">Mandatory Administrative Reason</label>
            <textarea
              name="admin_reason"
              value={formData.admin_reason}
              onChange={handleChange}
              required
              rows={3}
              placeholder="State the reason or ticket number for this change..."
              className="w-full px-3 py-2 border border-red-300 rounded-md focus:ring-red-500 focus:border-red-500"
            ></textarea>
            <p className="text-xs text-red-600 mt-1">This reason will be recorded in the immutable audit log.</p>
            
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? 'Applying Changes...' : 'Apply Administrative Changes'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
