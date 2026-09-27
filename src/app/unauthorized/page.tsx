import React from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { getServerTranslation } from '@/lib/glcc/i18n/server';

export default async function Unauthorized() {
  const { t } = await getServerTranslation();

  return (
    <div className="container mx-auto py-20 px-4 flex justify-center items-center flex-col min-h-[60vh]">
      <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
        <ShieldAlert size={40} />
      </div>
      <h1 className="text-3xl font-bold mb-4 text-gray-900">{t('errors.unauthorized.title')}</h1>
      <p className="text-gray-600 mb-8 max-w-md text-center">
        {t('errors.unauthorized.description')}
      </p>
      <Link href="/" className="bg-blue-600 text-white font-medium py-3 px-8 rounded-full hover:bg-blue-700 transition">
        {t('errors.unauthorized.returnHome')}
      </Link>
    </div>
  );
}
