"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DocumentUploader({ listingId, existingDocuments, isEditable }: { listingId: string, existingDocuments: any[], isEditable: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [docType, setDocType] = useState('Proof of Ownership');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setLoading(true);
    setError('');

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', docType);

    try {
      const res = await fetch(`/api/listings/${listingId}/documents`, {
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

  return (
    <div>
      {error && <div className="bg-red-50 text-red-600 p-2 rounded text-sm mb-4">{error}</div>}
      
      {existingDocuments.length > 0 ? (
        <div className="space-y-3 mb-6">
          {existingDocuments.map(doc => (
            <div key={doc.id} className="flex items-center justify-between p-3 border rounded bg-gray-50">
              <div className="flex flex-col">
                <span className="font-medium text-sm">{doc.document_type}</span>
                <span className="text-xs text-gray-500">Uploaded on {new Date(doc.uploaded_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full
                  ${doc.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                    doc.status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                    'bg-yellow-100 text-yellow-800'}`}>
                  {doc.status}
                </span>
                <a href={`/api/documents/${doc.id}`} target="_blank" rel="noreferrer" className="text-xs font-medium text-blue-600 hover:underline">View</a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 mb-4">No documents uploaded yet.</p>
      )}

      {isEditable && (
        <div className="bg-gray-50 p-4 rounded border border-gray-200">
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Document Type</label>
            <select value={docType} onChange={e => setDocType(e.target.value)} className="w-full border rounded p-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-600">
              <option value="Proof of Ownership">Proof of Ownership</option>
              <option value="Vehicle Registration (OR/CR)">Vehicle Registration (OR/CR)</option>
              <option value="Business Permit">Business Permit</option>
              <option value="Insurance Policy">Insurance Policy</option>
              <option value="Safety Certificate">Safety Certificate</option>
            </select>
          </div>
          <label className="bg-white border rounded py-2 px-4 w-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition text-sm font-medium">
            {loading ? 'Uploading...' : 'Select File & Upload'}
            <input type="file" className="hidden" accept=".pdf, image/jpeg, image/png" onChange={handleUpload} disabled={loading} />
          </label>
          <p className="text-xs text-gray-400 mt-2 text-center">PDF, JPG, PNG up to 10MB</p>
        </div>
      )}
    </div>
  );
}
