"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/lib/glcc/i18n';

function getLocalizedDocType(docType: string): string {
  switch (docType) {
    case 'Proof of Ownership':
      return t('documentUploader.types.proofOfOwnership');
    case 'Vehicle Registration (OR/CR)':
      return t('documentUploader.types.vehicleRegistration');
    case 'Business Permit':
      return t('documentUploader.types.businessPermit');
    case 'Insurance Policy':
      return t('documentUploader.types.insurancePolicy');
    case 'Safety Certificate':
      return t('documentUploader.types.safetyCertificate');
    default:
      return docType;
  }
}

function getLocalizedDocStatus(status: string): string {
  switch (status) {
    case 'Approved':
      return t('documentUploader.status.approved');
    case 'Rejected':
      return t('documentUploader.status.rejected');
    case 'Pending':
      return t('documentUploader.status.pending');
    default:
      return status;
  }
}

interface DocumentItem {
  id: string;
  document_type: string;
  status: string;
  uploaded_at: string | Date;
}

export default function DocumentUploader({
  listingId,
  existingDocuments,
  isEditable,
}: {
  listingId: string;
  existingDocuments: DocumentItem[];
  isEditable: boolean;
}) {
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
        setError(data.message || t('documentUploader.errorFailed'));
      }
    } catch {
      setError(t('documentUploader.errorGeneric'));
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
                <span className="font-medium text-sm">{getLocalizedDocType(doc.document_type)}</span>
                <span className="text-xs text-gray-500">{t('documentUploader.uploadedOn', { date: new Date(doc.uploaded_at).toLocaleDateString() })}</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full
                  ${doc.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                    doc.status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                    'bg-yellow-100 text-yellow-800'}`}>
                  {getLocalizedDocStatus(doc.status)}
                </span>
                <a href={`/api/documents/${doc.id}`} target="_blank" rel="noreferrer" className="text-xs font-medium text-blue-600 hover:underline">
                  {t('common.view')}
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 mb-4">{t('documentUploader.empty')}</p>
      )}

      {isEditable && (
        <div className="bg-gray-50 p-4 rounded border border-gray-200">
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('documentUploader.docTypeLabel')}</label>
            <select value={docType} onChange={e => setDocType(e.target.value)} className="w-full border rounded p-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-600">
              <option value="Proof of Ownership">{t('documentUploader.types.proofOfOwnership')}</option>
              <option value="Vehicle Registration (OR/CR)">{t('documentUploader.types.vehicleRegistration')}</option>
              <option value="Business Permit">{t('documentUploader.types.businessPermit')}</option>
              <option value="Insurance Policy">{t('documentUploader.types.insurancePolicy')}</option>
              <option value="Safety Certificate">{t('documentUploader.types.safetyCertificate')}</option>
            </select>
          </div>
          <label className="bg-white border rounded py-2 px-4 w-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition text-sm font-medium">
            {loading ? t('documentUploader.uploading') : t('documentUploader.selectFile')}
            <input type="file" className="hidden" accept=".pdf, image/jpeg, image/png" onChange={handleUpload} disabled={loading} />
          </label>
          <p className="text-xs text-gray-400 mt-2 text-center">{t('documentUploader.formatHelp')}</p>
        </div>
      )}
    </div>
  );
}
