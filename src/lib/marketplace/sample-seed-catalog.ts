export const MARKETPLACE_DATASET_VERSION = 'RENTIPID-MARKETPLACE-SEED-V1.0' as const;
export const MARKETPLACE_SEED_LABEL_PREFIX = `${MARKETPLACE_DATASET_VERSION}:`;

export interface SeedCategory {
  seed_key: string;
  name: string;
  slug: string;
  icon: string;
  sort_order: number;
  featured: boolean;
  subcategories: string[];
}

export interface SeedUser {
  seed_key: string;
  display_name: string;
  email_alias: string;
  location: string;
  verification_state: string;
  provider_type?: 'BUSINESS' | 'INDIVIDUAL';
}

export interface SeedListing {
  seed_key: string;
  title: string;
  category: string;
  subcategory: string;
  provider_seed_key: string;
  description: string;
  location: string;
  pricing: { amount_php: number; unit: 'DAY' | 'NIGHT' | 'EVENT' | 'HOUR' | 'MONTH' };
  security_deposit_php: number;
  replacement_value_php: number;
  pickup_available: boolean;
  delivery_available: boolean;
  lifecycle_state_requested: 'PUBLISHED' | 'SUBMITTED' | 'DRAFT' | 'UNAVAILABLE';
  expected_policy_classification: string;
  is_test_data: true;
  public_visibility_expected: boolean;
  image_asset_key: string;
}

export interface SeedPolicyFixture {
  seed_key: string;
  title: string;
  category: string;
  subcategory: string;
  provider_seed_key: string;
  expected_policy_classification: 'PROHIBITED' | 'RESTRICTED' | 'UNSUPPORTED';
  expected_result: string;
  public_visibility_expected: false;
  is_test_data: true;
  notes: string;
}

export interface SeedBookingScenario {
  seed_key: string;
  listing_seed_key: string;
  renter_seed_key: string;
  scenario: string;
  start_offset_days: number;
  duration_units: number;
  duration_unit: 'DAY' | 'NIGHT' | 'EVENT' | 'HOUR' | 'MONTH';
}

export interface MarketplaceSeedCatalog {
  catalog_version: string;
  counts: {
    top_level_categories: number;
    sample_listings: number;
    negative_policy_fixtures: number;
    providers: number;
    renters: number;
    booking_scenarios: number;
  };
  categories: SeedCategory[];
  providers: SeedUser[];
  renters: SeedUser[];
  listings: SeedListing[];
  negative_policy_fixtures: SeedPolicyFixture[];
  booking_scenarios: SeedBookingScenario[];
}

function assertUnique(values: string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`Duplicate ${label} in catalogue`);
}

export function seedEmail(alias: string): string {
  return `${alias}@rentipid.local`;
}

export function seedLabel(seedKey: string): string {
  return `${MARKETPLACE_SEED_LABEL_PREFIX}${seedKey}`;
}

export function validateMarketplaceSeedCatalog(catalog: MarketplaceSeedCatalog): void {
  const expected = {
    catalog_version: MARKETPLACE_DATASET_VERSION,
    categories: 15,
    listings: 45,
    providers: 5,
    renters: 3,
    bookings: 8,
    fixtures: 6,
  };

  if (catalog.catalog_version !== expected.catalog_version) throw new Error('Invalid marketplace catalogue version');
  if (catalog.categories.length !== expected.categories) throw new Error('Marketplace catalogue must contain exactly 15 categories');
  if (catalog.listings.length !== expected.listings) throw new Error('Marketplace catalogue must contain exactly 45 listings');
  if (catalog.providers.length !== expected.providers) throw new Error('Marketplace catalogue must contain exactly 5 providers');
  if (catalog.renters.length !== expected.renters) throw new Error('Marketplace catalogue must contain exactly 3 renters');
  if (catalog.booking_scenarios.length !== expected.bookings) throw new Error('Marketplace catalogue must contain exactly 8 booking scenarios');
  if (catalog.negative_policy_fixtures.length !== expected.fixtures) throw new Error('Marketplace catalogue must contain exactly 6 policy fixtures');

  assertUnique(catalog.categories.map((item) => item.slug.toLowerCase()), 'category slug');
  assertUnique(catalog.categories.map((item) => item.name.toLowerCase()), 'category name');
  assertUnique([...catalog.providers, ...catalog.renters].map((item) => seedEmail(item.email_alias)), 'test email');
  assertUnique(catalog.listings.map((item) => item.seed_key), 'listing identity');
  assertUnique(catalog.booking_scenarios.map((item) => item.seed_key), 'booking identity');
  assertUnique(catalog.negative_policy_fixtures.map((item) => item.seed_key), 'fixture identity');

  const categories = new Map(catalog.categories.map((item) => [item.name, item]));
  const providers = new Set(catalog.providers.map((item) => item.seed_key));
  const renters = new Set(catalog.renters.map((item) => item.seed_key));
  const listings = new Set(catalog.listings.map((item) => item.seed_key));

  for (const listing of catalog.listings) {
    const category = categories.get(listing.category);
    if (!category || !category.subcategories.includes(listing.subcategory)) throw new Error(`Invalid category hierarchy for ${listing.seed_key}`);
    if (!providers.has(listing.provider_seed_key)) throw new Error(`Unknown provider for ${listing.seed_key}`);
  }
  for (const booking of catalog.booking_scenarios) {
    if (!listings.has(booking.listing_seed_key) || !renters.has(booking.renter_seed_key)) throw new Error(`Invalid booking references for ${booking.seed_key}`);
  }

  const lifecycle = catalog.listings.reduce<Record<string, number>>((counts, item) => {
    counts[item.lifecycle_state_requested] = (counts[item.lifecycle_state_requested] ?? 0) + 1;
    return counts;
  }, {});
  if (lifecycle.PUBLISHED !== 29 || lifecycle.SUBMITTED !== 8 || lifecycle.DRAFT !== 4 || lifecycle.UNAVAILABLE !== 4) {
    throw new Error('Invalid marketplace listing lifecycle distribution');
  }
}

