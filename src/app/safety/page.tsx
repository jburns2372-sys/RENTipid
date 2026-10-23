import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { getServerTranslation } from '@/lib/glcc/i18n/server';

export default async function SafetyPage() {
  const { t } = await getServerTranslation();

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">{t('trustSafety.trustSafetyCenter')}</h1>
      
      <div className="bg-blue-50 border border-blue-200 text-blue-900 p-6 rounded-xl mb-8">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-2">
          <ShieldAlert size={20} /> Legal Disclaimer
        </h2>
        <p>
          RENTipid is a rental marketplace platform. Users remain responsible for ensuring that listed assets are legally owned, legally rentable, safe, and compliant with applicable laws and regulations.
        </p>
      </div>

      <div className="prose max-w-none text-gray-700">
        <h2>{t('trustSafety.identityVerificationKyc')}</h2>
        <p>{t('trustSafety.allUsersMustVerify')}</p>

        <h2>{t('trustSafety.securePayments')}</h2>
        <p>{t('trustSafety.neverPayOutsideThe')}</p>
      </div>
    </div>
  );
}
