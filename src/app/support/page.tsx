import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LifeBuoy } from 'lucide-react';
import { getServerTranslation } from '@/lib/glcc/i18n/server';

export default async function SupportPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login?callbackUrl=/support');
  }

  const { t } = await getServerTranslation();

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
          <LifeBuoy size={32} />
        </div>
        <h1 className="text-3xl font-bold">{t('support.supportTickets')}</h1>
        <p className="text-gray-500 mt-2">{t('support.needHelpOpenA')}</p>
      </div>

      <form className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.subject', undefined, 'Subject')}</label>
          <input type="text" required className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-600 bg-gray-50" placeholder={t('support.briefSubject')} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('listing.category', undefined, 'Category')}</label>
          <select name="category" required className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-600 bg-gray-50">
            <option value="Account">{t('support.accountAccess')}</option>
            <option value="KYC">{t('support.kycVerification')}</option>
            <option value="Listing">{t('support.listingManagement')}</option>
            <option value="Booking">{t('support.bookingEscrow')}</option>
            <option value="Dispute">{t('support.damageClaimsDisputes')}</option>
            <option value="Other">{t('provider.other', undefined, 'Other')}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('support.details')}</label>
          <textarea 
            name="message" 
            required 
            rows={5} 
            className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-600 bg-gray-50"
            placeholder={t('support.pleaseProvideAsMuch')}
          />
        </div>

        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition">
          {t('legalCompliance.submitRequest', undefined, 'Submit Ticket')}
        </button>
      </form>
    </div>
  );
}
