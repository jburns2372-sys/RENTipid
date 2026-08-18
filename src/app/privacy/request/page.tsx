'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function PrivacyRequestPage() {
    const [requestType, setRequestType] = useState('ACCESS_REQUEST');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ referenceNumber: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/privacy/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_type: requestType,
          requester_email: email,
          requester_message: message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }

      setSuccessData(data);
    } catch (err: unknown) {
      if (err instanceof Error) { setError(err.message); } else { setError('An unknown error occurred'); }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successData) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-2xl text-center">
        <h1 className="text-3xl font-bold mb-6 text-green-600">Request Submitted Successfully</h1>
        <p className="mb-4">Your privacy request has been received. Please keep the following reference number for your records:</p>
        <div className="text-2xl font-mono bg-gray-100 p-4 rounded inline-block mb-8 font-bold">
          {successData.referenceNumber}
        </div>
        <p className="mb-8">We will process your request in accordance with our Privacy Policy and applicable data protection laws. You will receive an email shortly with instructions on how to track the status of your request.</p>
        <Link href="/privacy" className="text-blue-700 hover:underline">Return to Privacy Center</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Submit a Privacy Request</h1>
      <p className="text-gray-600 mb-8">
        Use this form to exercise your data subject rights, such as requesting access to your data or asking for its deletion.
      </p>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded mb-6 border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
        <div>
          <label htmlFor="requestType" className="block text-sm font-medium text-gray-700 mb-2">Request Type</label>
          <select 
            id="requestType"
            value={requestType}
            onChange={(e) => setRequestType(e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
            required
          >
            <option value="ACCESS_REQUEST">Access to my data</option>
            <option value="CORRECTION_REQUEST">Correction of my data</option>
            <option value="DELETION_REQUEST">Erasure or blocking of my data</option>
            <option value="PORTABILITY_REQUEST">Data Portability</option>
            <option value="PROCESSING_OBJECTION">Object to processing</option>
            <option value="CONSENT_WITHDRAWAL">Withdraw consent</option>
          </select>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
          <input 
            id="email"
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
            placeholder="Enter the email associated with your account"
            required
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">Details (Optional)</label>
          <textarea 
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm p-2 border h-32"
            placeholder="Provide any additional details that will help us process your request..."
          />
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}


