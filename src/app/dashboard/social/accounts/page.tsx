import React from 'react';
import { PrismaClient } from '@prisma/client';
import { getServerTranslation } from '@/lib/glcc/i18n/server';

const prisma = new PrismaClient();

export default async function SocialAccountsPage() {
  const { t } = await getServerTranslation();
  const accounts = await prisma.socialAccount.findMany({
    orderBy: { updated_at: 'desc' }
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">{t('soc.socialAccountsProviders')}</h1>
      
      <div className="bg-white rounded-xl shadow border p-6">
        <h2 className="text-xl font-semibold mb-4">{t('soc.connectedProviders')}</h2>
        
        {accounts.length === 0 ? (
          <p className="text-gray-500">{t('soc.noSocialAccountsConfigured')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-4">{t('admin.colProvider', undefined, 'Provider')}</th>
                  <th className="p-4">{t('soc.accountIdentifier')}</th>
                  <th className="p-4">{t('soc.maturityStatus')}</th>
                  <th className="p-4">{t('soc.health')}</th>
                  <th className="p-4">{t('soc.capabilities')}</th>
                  <th className="p-4">{t('soc.lastSync')}</th>
                  <th className="p-4">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map(acc => {
                  let capabilities = [];
                  try {
                    capabilities = acc.capabilities ? JSON.parse(acc.capabilities) : [];
                  } catch(e) {}
                  
                  return (
                    <tr key={acc.id} className="border-b">
                      <td className="p-4 font-medium">{acc.platform}</td>
                      <td className="p-4">
                        {acc.account_name} <br/>
                        <span className="text-sm text-gray-500">{acc.account_handle}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          acc.connection_status === 'DISABLED' ? 'bg-gray-200 text-gray-700' :
                          acc.connection_status === 'CONFIGURED' ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {acc.connection_status}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          acc.health_status === 'HEALTHY' ? 'bg-green-100 text-green-700' :
                          acc.health_status === 'RATE_LIMITED' ? 'bg-yellow-100 text-yellow-700' :
                          acc.health_status === 'AUTH_REQUIRED' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {acc.health_status}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-600 max-w-xs truncate" title={capabilities.join(', ')}>
                        {capabilities.length} capabilities
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {acc.last_sync_at ? new Date(acc.last_sync_at).toLocaleString() : 'Never'}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button className="text-blue-600 hover:underline text-sm">{t('soc.configure')}</button>
                          <button className="text-blue-600 hover:underline text-sm">{t('soc.validate')}</button>
                          <button className="text-red-600 hover:underline text-sm">{t('soc.disable')}</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-8 bg-gray-50 rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-2">{t('soc.providerIntegrationsAvailable')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {['Meta', 'Instagram', 'TikTok', 'Google', 'WhatsApp', 'Viber', 'MockSocialAdapter'].map(p => (
            <div key={p} className="bg-white border rounded p-4 text-center">
              <span className="font-medium block">{p}</span>
              <span className="text-xs text-gray-500 mt-2 block">
                {p === 'MockSocialAdapter' ? 'LIVE' : 'PARTNER READY'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
