import React from 'react';
import ListingBridgeWizard from '@/components/listings/listingbridge/ListingBridgeWizard';
import { ListingBridgeUiService } from '@/lib/listingbridge/ui/actions';
import Link from 'next/link';

export default async function ListingBridgeImportPage() {
  const uiService = new ListingBridgeUiService();
  const connectorRes = await uiService.getAvailableConnectors();
  const connectors = connectorRes.success && connectorRes.data ? connectorRes.data : [];

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="mb-4">
        <Link
          href="/dashboard/provider/listings/new"
          className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          ← Back to Listing Setup Options
        </Link>
      </div>

      <ListingBridgeWizard
        initialConnectors={connectors}
      />
    </div>
  );
}
