import { redirect } from 'next/navigation';

/**
 * RETIRED: ListingBridge product decommissioned per Owner decision.
 * Providers accessing this route are safely redirected to native manual listing creation.
 */
export default function ListingBridgeImportPage() {
  redirect('/dashboard/provider/listings/new');
}
