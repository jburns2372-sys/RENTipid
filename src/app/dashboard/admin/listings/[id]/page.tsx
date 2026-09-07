import Link from 'next/link';
import { AlertTriangle, ArrowLeft, ExternalLink, FileText, ImageIcon } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';
import AdminDocumentActions from '@/components/listings/AdminDocumentActions';
import AdminListingActions from '@/components/listings/AdminListingActions';
import {
  getAdminListingReviewDetail,
  requireAdminListingReviewer,
} from '@/lib/listings/admin-review-service';

export const dynamic = 'force-dynamic';

function money(value: number | null) {
  return value == null ? 'Not set' : `PHP ${value.toLocaleString('en-PH')}`;
}

function dateTime(value: Date | null | undefined) {
  return value ? new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(value) : 'Not recorded';
}

export default async function AdminListingReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const reviewer = await requireAdminListingReviewer().catch(() => null);
  if (!reviewer) redirect('/unauthorized');

  const { id } = await params;
  const detail = await getAdminListingReviewDetail(id).catch((error: { code?: string }) => {
    if (error?.code === 'LISTING_NOT_FOUND') notFound();
    throw error;
  });
  const { listing, auditEvents, documentReadiness } = detail;
  const isPendingReview = listing.status === 'Submitted for Review' || listing.status === 'Under Review';
  const isBlockingRisk = listing.category.risk_level === 'High' || listing.category.risk_level === 'Regulated';
  const approvalRequirementsPass = listing.provider.status === 'Verified' && listing.photos.length > 0 && documentReadiness.ready;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link href="/dashboard/admin/listings" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900">
        <ArrowLeft size={16} aria-hidden="true" /> Back to review queue
      </Link>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <p className="text-sm font-medium text-gray-500">{listing.category.name}</p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-950">{listing.title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-600">{listing.description || 'No description provided.'}</p>
        </div>
        <span className="border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm font-semibold text-gray-800">{listing.status}</span>
      </header>

      {isBlockingRisk && (
        <div className="mb-6 flex gap-3 border border-red-200 bg-red-50 p-4 text-red-900">
          <AlertTriangle className="mt-0.5 shrink-0" size={20} aria-hidden="true" />
          <div>
            <p className="font-semibold">{listing.category.risk_level} compliance review required</p>
            <p className="mt-1 text-sm">Required documents must be explicitly approved before this listing can be approved.</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-base font-semibold text-gray-950"><ImageIcon size={18} /> Listing photos</h2>
              <span className="text-sm text-gray-500">{listing.photos.length} total</span>
            </div>
            {listing.photos.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {listing.photos.map((photo) => (
                  <figure key={photo.id} className="relative aspect-[4/3] overflow-hidden border border-gray-200 bg-gray-100">
                    {/* Existing listing media can come from multiple configured storage hosts. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.file_path} alt={`${listing.title}${photo.is_cover ? ' cover' : ''}`} className="h-full w-full object-cover" />
                    {photo.is_cover && <figcaption className="absolute left-2 top-2 bg-gray-950 px-2 py-1 text-xs font-semibold text-white">Cover</figcaption>}
                  </figure>
                ))}
              </div>
            ) : <p className="text-sm font-medium text-red-700">No listing photos uploaded.</p>}
          </section>

          <section className="border border-gray-200 bg-white p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-base font-semibold text-gray-950"><FileText size={18} /> Required listing documents</h2>
              <span className={`text-sm font-semibold ${documentReadiness.ready ? 'text-emerald-700' : 'text-amber-800'}`}>{documentReadiness.ready ? 'Requirements verified' : 'Verification incomplete'}</span>
            </div>
            {documentReadiness.requiredTypes.length > 0 && (
              <p className="mb-4 text-sm text-gray-600">Required: {documentReadiness.requiredTypes.join(', ')}</p>
            )}
            {listing.documents.length > 0 ? (
              <div className="divide-y divide-gray-200 border-y border-gray-200">
                {listing.documents.map((document) => (
                  <div key={document.id} className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-gray-950">{document.document_type}</p>
                      <p className="mt-1 text-xs text-gray-500">{document.file_type} · Uploaded {dateTime(document.uploaded_at)}</p>
                      <p className="mt-1 text-sm text-gray-700">Status: <span className="font-semibold">{document.status}</span></p>
                      {document.reviewed_at && <p className="mt-1 text-xs text-gray-500">Reviewed {dateTime(document.reviewed_at)} by {document.reviewed_by || 'unknown reviewer'}</p>}
                      <a href={`/api/documents/${document.id}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-900">View secure document <ExternalLink size={14} /></a>
                    </div>
                    <AdminDocumentActions documentId={document.id} currentStatus={document.status} rejectionReason={document.rejection_reason} reviewEnabled={isPendingReview} />
                  </div>
                ))}
              </div>
            ) : <p className="text-sm font-medium text-red-700">No compliance documents uploaded.</p>}
          </section>

          <section className="border border-gray-200 bg-white p-5">
            <h2 className="text-base font-semibold text-gray-950">Review history</h2>
            {auditEvents.length > 0 ? (
              <ol className="mt-4 divide-y divide-gray-200 border-y border-gray-200">
                {auditEvents.map((event) => (
                  <li key={event.id} className="py-3 text-sm">
                    <div className="flex flex-wrap justify-between gap-2"><span className="font-semibold text-gray-900">{event.action}</span><time className="text-gray-500">{dateTime(event.created_at)}</time></div>
                    {event.details && <p className="mt-1 text-gray-600">{event.details}</p>}
                  </li>
                ))}
              </ol>
            ) : <p className="mt-3 text-sm text-gray-500">No listing review events recorded.</p>}
          </section>
        </div>

        <aside className="space-y-6">
          <AdminListingActions listingId={listing.id} currentStatus={listing.status} approvalRequirementsPass={approvalRequirementsPass} />

          <section className="border border-gray-200 bg-white p-5">
            <h2 className="text-base font-semibold text-gray-950">Listing facts</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="text-gray-500">Provider</dt><dd className="font-medium text-gray-900">{listing.provider.full_name}</dd><dd className="text-xs text-gray-500">{listing.provider.email} · {listing.provider.id}</dd></div>
              <div><dt className="text-gray-500">Provider status</dt><dd className="font-medium text-gray-900">{listing.provider.status}</dd></div>
              <div><dt className="text-gray-500">Risk level</dt><dd className="font-medium text-gray-900">{listing.category.risk_level}</dd></div>
              <div><dt className="text-gray-500">Rental type</dt><dd className="font-medium text-gray-900">{listing.rental_type}</dd></div>
              <div><dt className="text-gray-500">Daily rate</dt><dd className="font-medium text-gray-900">{money(listing.daily_rate)}</dd></div>
              <div><dt className="text-gray-500">Security deposit</dt><dd className="font-medium text-gray-900">{money(listing.security_deposit)}</dd></div>
              <div><dt className="text-gray-500">Location</dt><dd className="font-medium text-gray-900">{[listing.location, listing.city, listing.province, listing.country].filter(Boolean).join(', ') || 'Not set'}</dd></div>
              <div><dt className="text-gray-500">Published at</dt><dd className="font-medium text-gray-900">{dateTime(listing.published_at)}</dd></div>
              {listing.rejection_reason && <div><dt className="text-gray-500">Rejection reason</dt><dd className="font-medium text-red-700">{listing.rejection_reason}</dd></div>}
            </dl>
          </section>
        </aside>
      </div>
    </main>
  );
}
