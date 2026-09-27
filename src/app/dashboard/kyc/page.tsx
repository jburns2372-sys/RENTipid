"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import { FileUp, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useTranslation } from '@/lib/glcc/i18n';

export default function KYCPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  useEffect(() => {
    // In a real app, we would fetch the user's uploaded documents here
    // For now, we simulate an empty list
  }, []);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;
    const document_type = formData.get('document_type') as string;

    if (!file || file.size === 0) {
      setMessage({ type: 'error', text: 'Please select a file to upload' });
      setLoading(false);
      return;
    }

    // Basic validation
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Invalid file type. Only PDF, JPG, PNG, WEBP allowed.' });
      setLoading(false);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 5MB' });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Document uploaded successfully! It is now under review.' });
        // Add fake document to list to show success in UI immediately
        setDocuments([...documents, {
          id: Math.random().toString(),
          document_type,
          status: 'Submitted',
          uploaded_at: new Date().toISOString()
        }]);
        (e.target as HTMLFormElement).reset();
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.message || 'Upload failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error during upload' });
    } finally {
      setLoading(false);
    }
  };

  const role = (session?.user as any)?.role || 'Renter';

  const getRequiredDocs = () => {
    if (role === 'Renter') return [t('kyc.validGovernmentId'), t('kyc.selfieVerification')];
    if (role === 'Individual Provider') return [t('kyc.validGovernmentId'), t('kyc.selfieVerification'), t('kyc.proofOfAddress'), t('kyc.proofOfOwnershipAuthorization')];
    if (role === 'Business Provider') return [t('kyc.businessPermitRegistration'), t('kyc.validGovernmentId'), t('kyc.proofOfAddress')];
    return [];
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">{t('kyc.accountVerificationKyc')}</h1>
      <p className="text-gray-600 mb-8">{t('kyc.submitRequiredDocumentsTo')}</p>

      {message && (
        <div className={`p-4 rounded-lg mb-8 flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle className="mr-2" size={20} /> : <AlertCircle className="mr-2" size={20} />}
          {message.text}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-20">
            <h3 className="font-semibold text-lg mb-4 border-b pb-2">{t('kyc.requiredDocuments')}</h3>
            <ul className="space-y-3">
              {getRequiredDocs().map((doc, i) => (
                <li key={i} className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 text-xs font-bold">
                    {i+1}
                  </div>
                  <span className="text-sm text-gray-700">{doc}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
              Your documents are encrypted and securely stored. We never share them publicly.
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-6">{t('kyc.uploadDocument')}</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('kyc.documentType')}</label>
                <select name="document_type" required className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-600 outline-none bg-white">
                  <option value="">{t('kyc.selectDocumentType')}</option>
                  <option value="ID">{t('kyc.validGovernmentId')}</option>
                  <option value="Selfie">{t('kyc.selfieVerification')}</option>
                  <option value="ProofOfAddress">{t('kyc.proofOfAddress')}</option>
                  <option value="BusinessPermit">{t('kyc.businessPermitRegistration')}</option>
                  <option value="ProofOfOwnership">{t('kyc.proofOfOwnershipAuthorization')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('kyc.file')}</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition cursor-pointer">
                  <input 
                    type="file" 
                    name="file" 
                    accept=".pdf,.jpg,.jpeg,.png,.webp" 
                    required 
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="mt-2 text-xs text-gray-500">{t('kyc.maxSize5mbFormats')}</p>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="bg-blue-600 text-white font-medium py-2 px-6 rounded hover:bg-blue-700 transition disabled:opacity-50 flex items-center"
              >
                {loading ? t('common.loading') : <><FileUp size={18} className="mr-2" /> {t('kyc.uploadDocument')}</>}
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-6 border-b pb-2">{t('kyc.myUploadedDocuments')}</h2>
            
            {documents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>{t('kyc.noDocumentsUploadedYet')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {documents.map((doc, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center">
                      <div className="bg-blue-100 text-blue-600 p-2 rounded-lg mr-4">
                        <FileUp size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{doc.document_type}</p>
                        <p className="text-xs text-gray-500">Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div>
                      <span className="flex items-center text-xs font-semibold bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                        <Clock size={12} className="mr-1" /> {doc.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <AIAssistantButton context="KYC Verification" />
    </div>
  );
}
