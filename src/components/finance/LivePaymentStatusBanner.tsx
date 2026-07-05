import React from 'react';
import { PrismaClient } from '@prisma/client';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

const prisma = new PrismaClient();

export default async function LivePaymentStatusBanner() {
  const settingsRaw = await prisma.systemSetting.findMany({
    where: {
      setting_key: {
        in: [
          'PAYMONGO_VERIFICATION_APPROVED',
          'PAYMONGO_GCASH_ACTIVE',
          'PAYMONGO_CARD_ACTIVE',
          'PAYMENT_LIVE_PILOT_ENABLED'
        ]
      }
    }
  });

  const s = settingsRaw.reduce((acc, curr) => ({ ...acc, [curr.setting_key]: curr.setting_value }), {} as Record<string, string>);

  const appBaseUrl = process.env.APP_BASE_URL || '';
  const isHttps = appBaseUrl.startsWith('https://') && !appBaseUrl.includes('localhost') && !appBaseUrl.includes('127.0.0.1');

  const isApproved = s['PAYMONGO_VERIFICATION_APPROVED'] === 'Approved';
  const isMethodActive = s['PAYMONGO_GCASH_ACTIVE'] === 'Approved' || s['PAYMONGO_CARD_ACTIVE'] === 'Approved';

  let bannerMessage = '';
  let isReady = false;

  if (!isApproved) {
    bannerMessage = "Live payment remains blocked. PayMongo approval is pending.";
  } else if (!isHttps) {
    bannerMessage = "Live payment remains blocked. Production HTTPS APP_BASE_URL is required.";
  } else if (!isMethodActive) {
    bannerMessage = "Live payment remains blocked. No PayMongo live payment method is active.";
  } else {
    isReady = true;
    bannerMessage = "Ready for one controlled live payment pilot. Finance review and emergency controls remain required.";
  }

  return (
    <div className={`mb-6 p-4 rounded-lg border flex items-start gap-3 shadow-sm ${isReady ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
      <div className="mt-0.5">
        {isReady ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}
      </div>
      <div>
        <h3 className={`font-bold ${isReady ? 'text-green-800' : 'text-red-800'}`}>
          Phase 19B-C: Live Payment Pilot Status
        </h3>
        <p className={`text-sm mt-1 ${isReady ? 'text-green-700' : 'text-red-700'}`}>
          {bannerMessage}
        </p>
      </div>
    </div>
  );
}
