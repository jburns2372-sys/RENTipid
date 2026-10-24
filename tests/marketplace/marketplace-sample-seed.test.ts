import fs from 'node:fs';
import path from 'node:path';
import { MockPaymentAdapter } from '../../src/lib/payments/adapters/mock-payment-adapter';
import {
  MarketplaceSeedCatalog,
  validateMarketplaceSeedCatalog,
} from '../../src/lib/marketplace/sample-seed-catalog';
import {
  parseMarketplaceCategoryMetadata,
  serializeMarketplaceCategoryMetadata,
} from '../../src/lib/marketplace/category-metadata';
import { canShowMarketplaceTestData } from '../../src/lib/marketplace/test-data-visibility';
import {
  bookingState,
  isProvenLegacy,
  listingStatus,
} from '../../src/lib/marketplace/seed-reconciler';

jest.mock('server-only', () => ({}), { virtual: true });

const root = path.resolve(__dirname, '../..');
const catalog = JSON.parse(
  fs.readFileSync(path.join(root, 'seed-data/rentipid_marketplace_sample_seed_catalog.json'), 'utf8'),
) as MarketplaceSeedCatalog;

describe('RENTipid marketplace sample seed', () => {
  test('catalogue parses with exact identities, hierarchy, distribution, and totals', () => {
    expect(() => validateMarketplaceSeedCatalog(catalog)).not.toThrow();
    expect(catalog.catalog_version).toBe('RENTIPID-MARKETPLACE-SEED-V1.0');
    expect({
      categories: catalog.categories.length,
      listings: catalog.listings.length,
      providers: catalog.providers.length,
      renters: catalog.renters.length,
      bookings: catalog.booking_scenarios.length,
      fixtures: catalog.negative_policy_fixtures.length,
    }).toEqual({ categories: 15, listings: 45, providers: 5, renters: 3, bookings: 8, fixtures: 6 });
  });

  test('category metadata remains one canonical database-backed representation', () => {
    const category = catalog.categories[0];
    const encoded = serializeMarketplaceCategoryMetadata({
      datasetVersion: 'RENTIPID-MARKETPLACE-SEED-V1.0',
      seedKey: category.seed_key,
      sortOrder: category.sort_order,
      featured: category.featured,
      subcategories: category.subcategories,
    });
    expect(parseMarketplaceCategoryMetadata(encoded)).toEqual({
      datasetVersion: 'RENTIPID-MARKETPLACE-SEED-V1.0',
      seedKey: category.seed_key,
      sortOrder: category.sort_order,
      featured: category.featured,
      subcategories: category.subcategories,
    });
  });

  test('cleanup predicate accepts only exact isolated gate-test relations', () => {
    const safe = {
      id: 'gate4-category',
      name: 'Mock Category',
      slug: 'gate4-mock-category',
      listings: [{
        id: 'gate4-listing',
        title: 'Mock Listing',
        provider: { id: 'gate4-user', email: 'gate4@example.com' },
        bookings: [{
          id: 'gate4-booking',
          renter: { id: 'gate4-user', email: 'gate4@example.com' },
          provider: { id: 'gate4-user', email: 'gate4@example.com' },
        }],
      }],
    };
    expect(isProvenLegacy(safe as never)).toBe(true);
    expect(isProvenLegacy({
      ...safe,
      listings: [{ ...safe.listings[0], provider: { id: 'real', email: 'owner@example.com' } }],
    } as never)).toBe(false);
  });

  test('requested lifecycle and booking scenarios map only to current stored values', () => {
    expect(['Published', 'Submitted for Review', 'Draft', 'Unavailable']).toEqual([
      listingStatus('PUBLISHED'),
      listingStatus('SUBMITTED'),
      listingStatus('DRAFT'),
      listingStatus('UNAVAILABLE'),
    ]);
    expect(bookingState('PENDING_PROVIDER_APPROVAL').status).toBe('Pending Provider Approval');
    expect(bookingState('APPROVED_AWAITING_MOCK_PAYMENT').status).toBe('Pending Payment');
    expect(bookingState('ACTIVE_RENTAL').status).toBe('Ongoing');
    expect(bookingState('COMPLETED_WITH_MOCK_PAYMENT').status).toBe('Completed');
    expect(bookingState('RENTER_CANCELLED').status).toBe('Cancelled by Renter');
  });

  test('test-data visibility fails closed outside opted-in localhost development', () => {
    const local = {
      NODE_ENV: 'development',
      DATABASE_URL: 'postgresql://local:redacted@127.0.0.1:5432/rentipid_test',
      SHOW_MARKETPLACE_TEST_DATA: 'true',
    } as NodeJS.ProcessEnv;
    expect(canShowMarketplaceTestData(local)).toBe(true);
    expect(canShowMarketplaceTestData({ ...local, NODE_ENV: 'production' })).toBe(false);
    expect(canShowMarketplaceTestData({ ...local, DATABASE_URL: 'postgresql://redacted@remote.example/db' })).toBe(false);
    expect(canShowMarketplaceTestData({ ...local, SHOW_MARKETPLACE_TEST_DATA: 'false' })).toBe(false);
  });

  test('Browse, Popular Categories, and listing detail share canonical visibility controls', () => {
    const browse = fs.readFileSync(path.join(root, 'src/app/browse/page.tsx'), 'utf8');
    const home = fs.readFileSync(path.join(root, 'src/app/page.tsx'), 'utf8');
    const detail = fs.readFileSync(path.join(root, 'src/app/listing/[id]/page.tsx'), 'utf8');
    expect(browse).toContain("status: 'Published'");
    expect(browse).toContain('is_test_data: false');
    expect(browse).toContain('parseMarketplaceCategoryMetadata');
    expect(home).toContain('parseMarketplaceCategoryMetadata');
    expect(home).toContain('/browse?category=');
    expect(home).not.toContain("{ name: 'Tools'");
    expect(detail).toContain('listing.is_test_data && !canShowMarketplaceTestData()');
  });

  test('mock payments remain sandbox-only and live-disabled', () => {
    const adapter = new MockPaymentAdapter();
    expect(adapter.isSandbox()).toBe(true);
    expect(adapter.isLiveModeEnabled()).toBe(false);
    expect(adapter.getProviderName()).toBe('Mock');
  });
});
