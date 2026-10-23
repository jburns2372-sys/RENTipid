import { isListingBridgeEnabled } from '@/lib/listingbridge/connectors/feature-flags';
import { createListingBridgePlatformConnectors } from '@/lib/listingbridge/connectors/platform-connectors';
import { ListingBridgeUiService } from '@/lib/listingbridge/ui/actions';
import ListingBridgeImportPage from '@/app/dashboard/provider/listings/import/page';
import { redirect } from 'next/navigation';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

describe('ListingBridge Decommission & Manual Listing Routing', () => {
  it('has ListingBridge feature flags globally disabled', () => {
    expect(isListingBridgeEnabled()).toBe(false);
  });

  it('has zero active runtime platform connectors', () => {
    const connectors = createListingBridgePlatformConnectors();
    expect(connectors).toEqual([]);
    expect(connectors.length).toBe(0);
  });

  it('returns disabled status and zero connectors from UiService', async () => {
    const uiService = new ListingBridgeUiService();
    const res = await uiService.getAvailableConnectors();
    expect(res.success).toBe(false);
    expect(res.errorCode).toBe('LISTINGBRIDGE_DISABLED');
  });

  it('safely redirects /dashboard/provider/listings/import to /dashboard/provider/listings/new', () => {
    ListingBridgeImportPage();
    expect(redirect).toHaveBeenCalledWith('/dashboard/provider/listings/new');
  });
});
