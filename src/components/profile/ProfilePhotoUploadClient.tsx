'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePhotoUploadClient({ initialPhotoUrl }: { initialPhotoUrl?: string | null }) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialPhotoUrl || null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file.' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size exceeds 5MB limit.' });
      return;
    }

    setIsUploading(true);
    setMessage({ type: '', text: '' });
    
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const res = await fetch('/api/profile/photo', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload photo');

      setPhotoUrl(data.url);
      setMessage({ type: 'success', text: 'Photo uploaded successfully' });
      router.refresh();
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'An error occurred' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    setIsUploading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/profile/photo', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove photo');

      setPhotoUrl(null);
      setMessage({ type: 'success', text: 'Photo removed successfully' });
      router.refresh();
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'An error occurred' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
      <h2 className="text-xl font-semibold mb-6 border-b pb-2">Profile Photo</h2>
      
      {message.text && (
        <div className={`p-4 mb-4 rounded-md text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="flex items-center space-x-6">
        <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden border border-gray-200 shrink-0">
          {photoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={photoUrl} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <span className="text-3xl text-gray-400">
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
            </span>
          )}
        </div>
        
        <div className="flex flex-col space-y-3">
          <p className="text-sm text-gray-500">JPG, GIF or PNG. Max size of 5MB.</p>
          <div className="flex space-x-3">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*"
            />
            <button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={isUploading}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'Upload Photo'}
            </button>
            {photoUrl && (
              <button 
                onClick={handleRemove}
                disabled={isUploading}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
