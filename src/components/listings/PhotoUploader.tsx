"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PhotoUploader({ listingId, existingPhotos, isEditable }: { listingId: string, existingPhotos: any[], isEditable: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setLoading(true);
    setError('');

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/api/listings/${listingId}/photos`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.message || 'Upload failed');
      }
    } catch (err) {
      setError('An error occurred during upload');
    } finally {
      setLoading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm('Remove this photo?')) return;
    setLoading(true);
    
    try {
      const res = await fetch(`/api/listings/${listingId}/photos?photoId=${photoId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <div className="bg-red-50 text-red-600 p-2 rounded text-sm mb-4">{error}</div>}
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
        {existingPhotos.map((photo, index) => (
          <div key={photo.id} className="relative group rounded border overflow-hidden aspect-video bg-gray-100">
            <img src={photo.file_path} alt="Listing Photo" className="w-full h-full object-cover" />
            
            {photo.is_cover && (
              <span className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                COVER
              </span>
            )}

            {isEditable && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center space-x-2">
                <button onClick={() => handleDelete(photo.id)} disabled={loading} className="bg-red-600 text-white p-1.5 rounded text-xs hover:bg-red-700">
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}

        {isEditable && existingPhotos.length < 10 && (
          <label className="border-2 border-dashed border-gray-300 rounded aspect-video flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition">
            <span className="text-gray-400 font-medium mb-1">{loading ? 'Uploading...' : 'Add Photo'}</span>
            <span className="text-xs text-gray-400">JPG, PNG (Max 5MB)</span>
            <input type="file" className="hidden" accept="image/jpeg, image/png, image/webp" onChange={handleUpload} disabled={loading} />
          </label>
        )}
      </div>
    </div>
  );
}
