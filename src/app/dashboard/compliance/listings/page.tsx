import { redirect } from 'next/navigation';

export default function LegacyComplianceListingQueuePage() {
  redirect('/dashboard/admin/listings');
}
