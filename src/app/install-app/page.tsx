import React from 'react';
import Link from 'next/link';
import { getServerTranslation } from '@/lib/glcc/i18n/server';

export default async function InstallAppPage() {
  const { t } = await getServerTranslation();

  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">{t('common.installRentipidApp')}</h1>
      
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded mb-8 text-sm">
        <strong>{t('common.v1LaunchNote')}</strong> {t('common.v1LaunchNoteText')}
      </div>

      <div className="space-y-8">
        <section className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-xl font-bold mb-4">{t('common.installOnIosIphone')}</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>{t('common.openThisPageIn')} <strong>{t('common.safari')}</strong>.</li>
            <li>{t('common.tapThe')} <strong>{t('common.share')}</strong> {t('common.buttonSquareWithAn')}</li>
            <li>{t('common.scrollDownAndTap')} <strong>{t('common.addToHomeScreen')}</strong>.</li>
            <li>{t('common.tap')} <strong>{t('common.add')}</strong> {t('common.inTheTopRight')}</li>
          </ol>
        </section>

        <section className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-xl font-bold mb-4">{t('common.installOnAndroid')}</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>{t('common.openThisPageIn')} <strong>{t('common.chrome')}</strong>.</li>
            <li>{t('common.tapThe')} <strong>{t('common.menu')}</strong> {t('common.iconThreeDotsIn')}</li>
            <li>{t('common.installApp')} {t('common.or')} <strong>{t('common.page.addToHomeScreen')}</strong>.</li>
            <li>{t('common.followTheOnScreen')}</li>
          </ol>
        </section>

        <section className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-xl font-bold mb-4">{t('common.whatIsTheRentipid')}</h2>
          <p className="text-gray-700 leading-relaxed">
            {t('common.whatIsRentipidAppDesc')}
          </p>
        </section>

        <div className="text-center mt-8">
          <Link href="/" className="text-blue-600 hover:underline font-medium">
            &larr; {t('common.returnToHomepage')}
          </Link>
        </div>
      </div>
    </div>
  );
}
