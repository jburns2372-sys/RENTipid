import Link from 'next/link';
import { ClipboardCheck, FileCheck2 } from 'lucide-react';
import { redirect } from 'next/navigation';
import {
  getAdminReviewQueue,
  requireAdminListingReviewer,
} from '@/lib/listings/admin-review-service';
import { getServerTranslation } from '@/lib/glcc/i18n/server';

export const dynamic = 'force-dynamic';

function money(value: number | null) {
  return value == null ? 'Not set' : `PHP ${value.toLocaleString('en-PH')}`;
}

export default async function AdminListingReviewQueuePage() {
  const reviewer = await requireAdminListingReviewer().catch(() => null);
  if (!reviewer) redirect('/unauthorized');

  const listings = await getAdminReviewQueue();
  const { t } = await getServerTranslation();

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-gray-200 pb-5">
        <div>
          <p className="text-sm font-medium text-blue-700">{t('admin.adminReview')}</p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-950">{t('admin.listingReviewQueue')}</h1>
        </div>
        <p className="text-sm text-gray-600">{t('admin.pendingCount', { count: listings.length }, `${listings.length} pending`)}</p>
      </header>

      <div className="overflow-x-auto border border-gray-200 bg-white">
        <table className="w-full min-w-[1050px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3">{t('admin.colListing', undefined, 'Listing')}</th>
              <th className="px-4 py-3">{t('admin.colProvider', undefined, 'Provider')}</th>
              <th className="px-4 py-3">{t('admin.categoryRisk')}</th>
              <th className="px-4 py-3">{t('common.status')}</th>
              <th className="px-4 py-3">{t('admin.colPhotos', undefined, 'Photos')}</th>
              <th className="px-4 py-3">{t('admin.documents')}</th>
              <th className="px-4 py-3">{t('admin.dailyRate')}</th>
              <th className="px-4 py-3">{t('admin.colLocation', undefined, 'Location')}</th>
              <th className="px-4 py-3"><span className="sr-only">{t('common.actions')}</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {listings.map((listing) => (
              <tr key={listing.id} className="align-top hover:bg-gray-50">
                <td className="px-4 py-4 font-semibold text-gray-950">{listing.title}</td>
                <td className="px-4 py-4">
                  <span className="block font-medium text-gray-900">{listing.provider.full_name}</span>
                  <span className="block text-xs text-gray-500">{listing.provider.email}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="block text-gray-900">{listing.category.name}</span>
                  <span className={listing.category.risk_level === 'High' || listing.category.risk_level === 'Regulated' ? 'text-xs font-semibold text-red-700' : 'text-xs text-gray-500'}>
                    {listing.category.risk_level}
                  </span>
                </td>
                <td className="px-4 py-4 text-gray-700">
                  <span className="block font-medium">{listing.status}</span>
                  <span className="block text-xs text-gray-500">{t('admin.updatedDate', { date: new Date(listing.updated_at).toLocaleDateString('en-PH') }, `Updated ${new Date(listing.updated_at).toLocaleDateString('en-PH')}`)}</span>
                </td>
                <td className="px-4 py-4 text-gray-700">{listing.photos.length}</td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center gap-1 font-medium ${listing.documentReadiness.ready ? 'text-emerald-700' : 'text-amber-800'}`}>
                    <FileCheck2 size={15} aria-hidden="true" />
                    {listing.documentReadiness.ready ? t('admin.ready', undefined, 'Ready') : t('admin.reviewRequired', undefined, 'Review required')}
                  </span>
                </td>
                <td className="px-4 py-4 text-gray-700">{money(listing.daily_rate)}</td>
                <td className="max-w-48 px-4 py-4 text-gray-700">{[listing.location, listing.city, listing.province].filter(Boolean).join(', ') || 'Not set'}</td>
                <td className="px-4 py-4 text-right">
                  <Link href={`/dashboard/admin/listings/${listing.id}`} className="inline-flex h-9 items-center gap-2 bg-blue-700 px-3 font-semibold text-white hover:bg-blue-800">
                    <ClipboardCheck size={16} aria-hidden="true" /> {t('admin.reviewAction', undefined, 'Review')}
                  </Link>
                </td>
              </tr>
            ))}
            {listings.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-14 text-center text-gray-500">{t('admin.noListingsAreAwaiting')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
