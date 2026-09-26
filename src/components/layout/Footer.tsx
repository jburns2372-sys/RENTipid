import React from 'react';
import Link from 'next/link';
import RentipidLogo from '@/components/brand/RentipidLogo';
import { t } from '@/lib/glcc/i18n';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t py-12 px-4">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <RentipidLogo variant="full" size="sm" showText={true} className="items-start mb-4" />
          <p className="text-gray-500 text-sm mt-4">
            {t('footer.description')}
          </p>
        </div>
        
        <div>
          <h2 className="font-semibold mb-4 text-gray-800">{t('footer.platform')}</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link href="/browse" className="hover:text-blue-600">{t('navigation.browseRentals')}</Link></li>
            <li><Link href="/how-it-works" className="hover:text-blue-600">{t('navigation.howItWorks')}</Link></li>
            <li><Link href="/register/business" className="hover:text-blue-600">{t('navigation.listYourItem')}</Link></li>
          </ul>
        </div>
        
        <div>
          <h2 className="font-semibold mb-4 text-gray-800">{t('footer.trustAndLegal')}</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link href="/help/trust-safety-legal/global-legal-compliance" className="hover:text-blue-600">{t('footer.legalCompliance')}</Link></li>
            <li><Link href="/help/privacy" className="hover:text-blue-600">{t('footer.privacy')}</Link></li>
            <li><Link href="/terms" className="hover:text-blue-600">{t('footer.terms')}</Link></li>
            <li><Link href="/safety" className="hover:text-blue-600">{t('footer.safety')}</Link></li>
            <li><Link href="/prohibited-items" className="hover:text-blue-600">{t('footer.prohibitedItems')}</Link></li>
            <li><Link href="/help/intellectual-property" className="hover:text-blue-600">{t('footer.ip')}</Link></li>
            <li><Link href="/help/complaints-appeals" className="hover:text-blue-600">{t('footer.reportIllegal')}</Link></li>
          </ul>
        </div>
        
        <div>
          <h2 className="font-semibold mb-4 text-gray-800">{t('footer.support')}</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link href="/help" className="hover:text-blue-600">{t('footer.helpCenter')}</Link></li>
            <li><Link href="/contact" className="hover:text-blue-600">{t('footer.contactUs')}</Link></li>
            <li><Link href="/dashboard/provider/social-accounts" className="hover:text-blue-600">{t('footer.socialMedia')}</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="container mx-auto mt-12 pt-8 border-t text-center text-sm text-gray-500">
        <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}
