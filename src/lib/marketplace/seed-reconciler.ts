import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { MockPaymentAdapter } from '../payments/adapters/mock-payment-adapter';
import { ProhibitedItemsService } from '../prohibited-items/prohibited-items.service';
import {
  MARKETPLACE_DATASET_VERSION,
  MarketplaceSeedCatalog,
  SeedBookingScenario,
  SeedCategory,
  SeedListing,
  SeedPolicyFixture,
  SeedUser,
  seedEmail,
  seedLabel,
  validateMarketplaceSeedCatalog,
} from './sample-seed-catalog';
import { serializeMarketplaceCategoryMetadata } from './category-metadata';

const CATALOG_PATH = path.resolve(process.cwd(), 'seed-data/rentipid_marketplace_sample_seed_catalog.json');
const SEED_ANCHOR = new Date('2026-08-15T08:00:00.000Z');
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

type ChangeStats = { before: number; reused: number; updated: number; inserted: number; archived: number; after: number };
const emptyStats = (before = 0): ChangeStats => ({ before, reused: 0, updated: 0, inserted: 0, archived: 0, after: 0 });

const categoryControls: Record<string, {
  risk_level: string;
  requires_admin_approval?: boolean;
  requires_deposit?: boolean;
  requires_insurance?: boolean;
  requires_permit?: boolean;
}> = {
  'tools-diy': { risk_level: 'Low' },
  'construction-equipment': { risk_level: 'Medium', requires_deposit: true },
  'heavy-equipment': { risk_level: 'High', requires_admin_approval: true, requires_deposit: true, requires_insurance: true },
  'event-equipment': { risk_level: 'Low' },
  'cameras-av': { risk_level: 'Medium', requires_deposit: true },
  'office-it-equipment': { risk_level: 'Low' },
  'agricultural-equipment': { risk_level: 'Medium', requires_admin_approval: true },
  cars: { risk_level: 'Regulated', requires_admin_approval: true, requires_deposit: true, requires_insurance: true, requires_permit: true },
  motorcycles: { risk_level: 'Regulated', requires_admin_approval: true, requires_deposit: true, requires_insurance: true, requires_permit: true },
  'trucks-utility-vehicles': { risk_level: 'Regulated', requires_admin_approval: true, requires_deposit: true, requires_insurance: true, requires_permit: true },
  'condominiums-apartments': { risk_level: 'Regulated', requires_admin_approval: true, requires_deposit: true, requires_permit: true },
  'rooms-vacation-homes': { risk_level: 'Medium', requires_deposit: true },
  'venues-resorts': { risk_level: 'Regulated', requires_admin_approval: true, requires_deposit: true, requires_permit: true },
  'boats-watercraft': { risk_level: 'Regulated', requires_admin_approval: true, requires_deposit: true, requires_insurance: true, requires_permit: true },
  'commercial-spaces-storage': { risk_level: 'Medium', requires_deposit: true },
};

function differs(existing: Record<string, unknown>, desired: Record<string, unknown>): boolean {
  return Object.entries(desired).some(([key, value]) => {
    const current = existing[key];
    if (current instanceof Date && value instanceof Date) return current.getTime() !== value.getTime();
    return current !== value;
  });
}

function readCatalog(): MarketplaceSeedCatalog {
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8')) as MarketplaceSeedCatalog;
  validateMarketplaceSeedCatalog(catalog);
  return catalog;
}

function assertDatabaseGuard(): { host: string; database: string; classification: string } {
  if (process.env.ALLOW_MARKETPLACE_SAMPLE_SEED !== 'true') throw new Error('ALLOW_MARKETPLACE_SAMPLE_SEED=true is required');
  if (!process.env.SEED_TEST_PASSWORD || process.env.SEED_TEST_PASSWORD.length < 12) throw new Error('SEED_TEST_PASSWORD must be supplied with at least 12 characters');
  if (process.env.NODE_ENV === 'production') throw new Error('Production NODE_ENV is prohibited');
  let databaseUrl: URL;
  try { databaseUrl = new URL(process.env.DATABASE_URL ?? ''); }
  catch { throw new Error('DATABASE_URL is missing or invalid'); }
  const database = databaseUrl.pathname.replace(/^\//, '');
  if (!LOCAL_HOSTS.has(databaseUrl.hostname)) throw new Error('Database host must be exactly localhost or 127.0.0.1');
  if (!/(test|dev|local)/i.test(database)) throw new Error('Database name is not classified as disposable development/test state');
  if (/neon/i.test(databaseUrl.hostname) || /prod(uction)?|main/i.test(database)) throw new Error('Production or Neon main databases are prohibited');
  if (process.env.ENABLE_LIVE_PAYMENTS === 'true' || process.env.PAYMENT_MODE === 'live') throw new Error('Live payments must remain disabled');
  const mock = new MockPaymentAdapter();
  if (!mock.isSandbox() || mock.isLiveModeEnabled()) throw new Error('Mock payment adapter safety invariant failed');
  return { host: databaseUrl.hostname, database, classification: 'LOCAL_ISOLATED_TEST' };
}

async function snapshotProtected(prisma: PrismaClient) {
  const phase13Users = await prisma.user.findMany({ where: { email: { contains: 'organic.', mode: 'insensitive' } }, select: { id: true } });
  const phase13UserIds = phase13Users.map((item) => item.id);
  const phase13Listings = phase13UserIds.length
    ? await prisma.listing.findMany({ where: { provider_id: { in: phase13UserIds } }, select: { id: true } })
    : [];
  const phase13Bookings = phase13UserIds.length
    ? await prisma.booking.findMany({ where: { OR: [{ renter_id: { in: phase13UserIds } }, { provider_id: { in: phase13UserIds } }] }, select: { id: true } })
    : [];
  const phase13BookingIds = phase13Bookings.map((item) => item.id);
  const phase13Claims = phase13BookingIds.length
    ? await prisma.damageClaim.findMany({ where: { booking_id: { in: phase13BookingIds } }, select: { id: true } })
    : [];
  const realUsers = await prisma.user.findMany({ where: { is_test_data: false, NOT: { email: { startsWith: 'gate4' } } }, select: { id: true } });
  const realListings = await prisma.listing.findMany({ where: { is_test_data: false, provider: { NOT: { email: { startsWith: 'gate4' } } } }, select: { id: true } });
  const realBookings = await prisma.booking.findMany({
    where: { is_test_data: false, renter: { NOT: { email: { startsWith: 'gate4' } } }, provider: { NOT: { email: { startsWith: 'gate4' } } } },
    select: { id: true },
  });
  return {
    phase13: { users: phase13Users.map((x) => x.id), listings: phase13Listings.map((x) => x.id), bookings: phase13BookingIds, claims: phase13Claims.map((x) => x.id) },
    real: { users: realUsers.map((x) => x.id), listings: realListings.map((x) => x.id), bookings: realBookings.map((x) => x.id) },
  };
}

function lostIds(before: string[], after: string[]): string[] {
  const remaining = new Set(after);
  return before.filter((id) => !remaining.has(id));
}

async function loadLegacyCategories(prisma: PrismaClient) {
  return prisma.category.findMany({
    where: {
      OR: [
        { name: { in: ['Mock Category', 'Test Category'] } },
        { name: { startsWith: 'gate4' } },
        { slug: { startsWith: 'gate4' } },
        { slug: { startsWith: 'test-cat-' } },
      ],
    },
    include: {
      listings: {
        include: {
          provider: { select: { id: true, email: true } },
          bookings: { include: { renter: { select: { id: true, email: true } }, provider: { select: { id: true, email: true } } } },
        },
      },
    },
  });
}
type LegacyCategory = Awaited<ReturnType<typeof loadLegacyCategories>>[number];

export function isProvenLegacy(category: LegacyCategory): boolean {
  return category.listings.every((listing) =>
    /^(Mock Listing|Synthetic Listing)$/.test(listing.title) &&
    listing.id.startsWith('gate4') &&
    listing.provider.email.startsWith('gate4') &&
    listing.bookings.every((booking) =>
      (booking.id.startsWith('gate4') || booking.id === 'test-booking-webhooks') &&
      booking.renter.email.startsWith('gate4') &&
      booking.provider.email.startsWith('gate4')));
}

async function archiveLegacyTestData(prisma: PrismaClient) {
  const candidates = await loadLegacyCategories(prisma);
  const conflicts = candidates.filter((candidate) => !isProvenLegacy(candidate));
  if (conflicts.length) throw new Error(`Legacy cleanup safety conflict: ${conflicts.map((item) => item.id).join(', ')}`);
  const result = { categoriesArchived: 0, listingsArchived: 0, bookingsMarked: 0, usersMarked: 0 };
  await prisma.$transaction(async (tx) => {
    const userIds = new Set<string>();
    for (const category of candidates) {
      for (const listing of category.listings) {
        userIds.add(listing.provider.id);
        await tx.listing.update({ where: { id: listing.id }, data: { status: 'Archived', is_test_data: true, beta_label: `LEGACY_TEST_ARCHIVED:${listing.id}` } });
        result.listingsArchived += 1;
        for (const booking of listing.bookings) {
          userIds.add(booking.renter.id);
          userIds.add(booking.provider.id);
          await tx.booking.update({ where: { id: booking.id }, data: { is_test_data: true, beta_label: `LEGACY_TEST_ARCHIVED:${booking.id}` } });
          result.bookingsMarked += 1;
        }
      }
      const normalizedId = category.id.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      await tx.category.update({
        where: { id: category.id },
        data: { name: `Archived Legacy Test Category ${category.id}`, slug: `archived-legacy-test-${normalizedId}`, is_active: false },
      });
      result.categoriesArchived += 1;
    }
    for (const userId of userIds) {
      const user = await tx.user.findUnique({ where: { id: userId }, select: { email: true } });
      if (user?.email.startsWith('gate4')) {
        await tx.user.update({ where: { id: userId }, data: { is_test_data: true, beta_label: `LEGACY_TEST_ARCHIVED:${userId}` } });
        result.usersMarked += 1;
      }
    }
  });
  return result;
}

async function reconcileCategories(prisma: PrismaClient, categories: SeedCategory[], stats: ChangeStats) {
  const categoryByName = new Map<string, { id: string; slug: string }>();
  for (const item of categories) {
    const controls = categoryControls[item.slug];
    if (!controls) throw new Error(`Missing existing category controls for ${item.slug}`);
    let existing = await prisma.category.findUnique({ where: { slug: item.slug }, include: { requirements: true } });
    if (!existing) existing = await prisma.category.findFirst({ where: { name: item.name }, include: { requirements: true } });
    const desired = {
      name: item.name,
      slug: item.slug,
      description: `${item.name} rentals. Canonical subcategories: ${item.subcategories.join(', ')}.`,
      icon: item.icon,
      risk_level: controls.risk_level,
      requires_admin_approval: controls.requires_admin_approval ?? false,
      requires_deposit: controls.requires_deposit ?? false,
      requires_insurance: controls.requires_insurance ?? false,
      requires_permit: controls.requires_permit ?? false,
      is_active: true,
    };
    const notes = serializeMarketplaceCategoryMetadata({
      datasetVersion: MARKETPLACE_DATASET_VERSION,
      seedKey: item.seed_key,
      sortOrder: item.sort_order,
      featured: item.featured,
      subcategories: item.subcategories,
    });
    if (!existing) {
      existing = await prisma.category.create({ data: { ...desired, requirements: { create: { notes } } }, include: { requirements: true } });
      stats.inserted += 1;
    } else {
      let updated = false;
      if (differs(existing as unknown as Record<string, unknown>, desired)) {
        existing = await prisma.category.update({ where: { id: existing.id }, data: desired, include: { requirements: true } });
        updated = true;
      }
      if (!existing.requirements) {
        await prisma.categoryRequirement.create({ data: { category_id: existing.id, notes } });
        updated = true;
      } else if (existing.requirements.notes !== notes) {
        await prisma.categoryRequirement.update({ where: { category_id: existing.id }, data: { notes } });
        updated = true;
      }
      if (updated) stats.updated += 1;
      else stats.reused += 1;
    }
    categoryByName.set(item.name, { id: existing.id, slug: item.slug });
  }
  return categoryByName;
}

async function reconcileUser(
  prisma: PrismaClient,
  item: SeedUser,
  kind: 'provider' | 'renter',
  password: string,
  stats: ChangeStats,
) {
  const email = seedEmail(item.email_alias);
  const label = seedLabel(item.seed_key);
  let existing = await prisma.user.findUnique({ where: { email }, include: { profile: true, businessProfile: true } });
  const business = kind === 'provider' && item.provider_type === 'BUSINESS';
  const desired = {
    email,
    full_name: item.display_name,
    account_type: business ? 'Business' : 'Individual',
    role: kind === 'renter' ? 'Renter' : business ? 'Business Provider' : 'Individual Provider',
    status: 'Verified',
    is_test_data: true,
    beta_label: label,
  };
  let entityState: 'inserted' | 'updated' | 'reused';
  if (!existing) {
    existing = await prisma.user.create({
      data: { ...desired, password_hash: await hash(password, 10) },
      include: { profile: true, businessProfile: true },
    });
    entityState = 'inserted';
  } else {
    const update = {
      ...desired,
      ...(!existing.password_hash ? { password_hash: await hash(password, 10) } : {}),
    };
    if (differs(existing as unknown as Record<string, unknown>, update)) {
      existing = await prisma.user.update({ where: { id: existing.id }, data: update, include: { profile: true, businessProfile: true } });
      entityState = 'updated';
    } else {
      entityState = 'reused';
    }
  }
  let profileChanged = false;
  if (business) {
    const profile = { business_name: item.display_name, business_address: item.location, verification_status: 'Verified' };
    if (!existing.businessProfile) {
      await prisma.businessProfile.create({ data: { user_id: existing.id, ...profile } });
      profileChanged = true;
    } else if (differs(existing.businessProfile as unknown as Record<string, unknown>, profile)) {
      await prisma.businessProfile.update({ where: { user_id: existing.id }, data: profile });
      profileChanged = true;
    }
  } else {
    const [city, province = 'Metro Manila'] = item.location.split(',').map((part) => part.trim());
    const profile = { city, province, country: 'Philippines', verification_status: 'Verified', trust_score: 100 };
    if (!existing.profile) {
      await prisma.userProfile.create({ data: { user_id: existing.id, ...profile } });
      profileChanged = true;
    } else if (differs(existing.profile as unknown as Record<string, unknown>, profile)) {
      await prisma.userProfile.update({ where: { user_id: existing.id }, data: profile });
      profileChanged = true;
    }
  }
  if (entityState === 'inserted') stats.inserted += 1;
  else if (entityState === 'updated' || profileChanged) stats.updated += 1;
  else stats.reused += 1;
  return existing.id;
}

function listingPricing(item: SeedListing) {
  const rentalType = item.pricing.unit === 'HOUR' ? 'Hourly' : item.pricing.unit === 'MONTH' ? 'Monthly' : 'Daily';
  return {
    rental_type: rentalType,
    hourly_rate: rentalType === 'Hourly' ? item.pricing.amount_php : null,
    daily_rate: rentalType === 'Daily' ? item.pricing.amount_php : null,
    weekly_rate: null,
    monthly_rate: rentalType === 'Monthly' ? item.pricing.amount_php : null,
  };
}

export function listingStatus(requested: SeedListing['lifecycle_state_requested']): string {
  return { PUBLISHED: 'Published', SUBMITTED: 'Submitted for Review', DRAFT: 'Draft', UNAVAILABLE: 'Unavailable' }[requested];
}

function ensureImageAsset(item: SeedListing): number {
  const destination = path.resolve(process.cwd(), 'public', item.image_asset_key.replace(/^\//, ''));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const hue = [...item.seed_key].reduce((total, char) => total + char.charCodeAt(0), 0) % 360;
  const safeTitle = item.title.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char] ?? char);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><rect width="1200" height="800" fill="hsl(${hue} 55% 35%)"/><rect x="55" y="55" width="1090" height="690" rx="36" fill="none" stroke="white" stroke-opacity=".45" stroke-width="4"/><text x="600" y="365" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="54" font-weight="700">${safeTitle}</text><text x="600" y="440" text-anchor="middle" fill="white" fill-opacity=".82" font-family="Arial,sans-serif" font-size="28">Synthetic RENTipid marketplace sample</text><text x="600" y="675" text-anchor="middle" fill="white" fill-opacity=".65" font-family="monospace" font-size="22">${item.seed_key}</text></svg>\n`;
  if (!fs.existsSync(destination) || fs.readFileSync(destination, 'utf8') !== svg) fs.writeFileSync(destination, svg, 'utf8');
  return Buffer.byteLength(svg);
}

async function reconcileListing(
  prisma: PrismaClient,
  item: SeedListing,
  providerId: string,
  categoryId: string,
  stats: ChangeStats,
) {
  const label = seedLabel(item.seed_key);
  const matches = await prisma.listing.findMany({
    where: { beta_label: label },
    orderBy: { created_at: 'asc' },
  });
  for (const duplicate of matches.slice(1)) {
    if (!duplicate.is_test_data || await prisma.booking.count({ where: { listing_id: duplicate.id } }) > 0) {
      throw new Error(`Unsafe duplicate listing identity ${item.seed_key}`);
    }
  }
  for (const duplicate of matches.slice(1)) {
    await prisma.listing.update({
      where: { id: duplicate.id },
      data: { status: 'Archived', beta_label: `LEGACY_DUPLICATE_ARCHIVED:${duplicate.id}` },
    });
    stats.archived += 1;
  }
  let existing = matches[0] ?? await prisma.listing.findFirst({
    where: { provider_id: providerId, title: item.title, is_test_data: true },
  });
  const [city, province = 'Metro Manila'] = item.location.split(',').map((part) => part.trim());
  const status = listingStatus(item.lifecycle_state_requested);
  const desired = {
    provider_id: providerId,
    category_id: categoryId,
    title: item.title,
    description: `${item.description} Subcategory: ${item.subcategory}.`,
    location: item.location,
    city,
    province,
    country: 'Philippines',
    ...listingPricing(item),
    security_deposit: item.security_deposit_php,
    replacement_value: item.replacement_value_php,
    quantity: 1,
    condition: 'Good',
    pickup_available: item.pickup_available,
    delivery_available: item.delivery_available,
    min_duration: 1,
    damage_policy: 'Standard RENTipid marketplace damage policy applies.',
    rules: `Canonical subcategory: ${item.subcategory}`,
    special_instructions: label,
    availability_start: new Date('2026-08-01T00:00:00.000Z'),
    availability_end: new Date('2030-12-31T23:59:59.000Z'),
    status,
    rejection_reason: null,
    published_at: status === 'Published' ? new Date('2026-08-01T08:00:00.000Z') : null,
    is_test_data: true,
    beta_label: label,
  };
  const fileSize = ensureImageAsset(item);
  if (!existing) {
    existing = await prisma.listing.create({
      data: {
        ...desired,
        photos: {
          create: {
            file_path: item.image_asset_key,
            file_type: 'image/svg+xml',
            file_size: fileSize,
            display_order: 0,
            is_cover: true,
          },
        },
      },
    });
    stats.inserted += 1;
  } else {
    let updated = false;
    if (differs(existing as unknown as Record<string, unknown>, desired)) {
      existing = await prisma.listing.update({ where: { id: existing.id }, data: desired });
      updated = true;
    }
    const photo = await prisma.listingPhoto.findFirst({
      where: { listing_id: existing.id, file_path: item.image_asset_key },
    });
    if (!photo) {
      await prisma.listingPhoto.create({
        data: {
          listing_id: existing.id,
          file_path: item.image_asset_key,
          file_type: 'image/svg+xml',
          file_size: fileSize,
          display_order: 0,
          is_cover: true,
        },
      });
      updated = true;
    } else if (photo.file_type !== 'image/svg+xml' || photo.file_size !== fileSize || !photo.is_cover || photo.display_order !== 0) {
      await prisma.listingPhoto.update({
        where: { id: photo.id },
        data: { file_type: 'image/svg+xml', file_size: fileSize, display_order: 0, is_cover: true },
      });
      updated = true;
    }
    if (updated) stats.updated += 1;
    else stats.reused += 1;
  }
  return existing;
}

async function reconcileFixture(
  prisma: PrismaClient,
  item: SeedPolicyFixture,
  providerId: string,
  categoryId: string,
  stats: ChangeStats,
) {
  const label = seedLabel(item.seed_key);
  const status = item.expected_policy_classification === 'RESTRICTED' ? 'Under Review' : 'Rejected';
  const policySignal = item.seed_key === 'NEG-PROHIBITED-003' ? ' Synthetic fake id detection fixture.' : '';
  const desired = {
    provider_id: providerId,
    category_id: categoryId,
    title: item.title,
    description: `${item.notes}${policySignal}`,
    location: 'Local policy test fixture',
    city: 'Quezon City',
    province: 'Metro Manila',
    country: 'Philippines',
    rental_type: 'Daily',
    daily_rate: 1,
    security_deposit: 0,
    replacement_value: 1,
    quantity: 1,
    condition: 'Good',
    pickup_available: false,
    delivery_available: false,
    rules: `Hidden fixture; expected ${item.expected_policy_classification}`,
    special_instructions: label,
    status,
    rejection_reason: `Hidden policy fixture: ${item.expected_result}`,
    published_at: null,
    is_test_data: true,
    beta_label: label,
  };
  const matches = await prisma.listing.findMany({
    where: { beta_label: label },
    orderBy: { created_at: 'asc' },
  });
  if (matches.length > 1) throw new Error(`Duplicate policy fixture identity ${item.seed_key}`);
  let existing = matches[0] ?? await prisma.listing.findFirst({
    where: { provider_id: providerId, title: item.title, is_test_data: true },
  });
  if (!existing) {
    existing = await prisma.listing.create({ data: desired });
    stats.inserted += 1;
  } else if (differs(existing as unknown as Record<string, unknown>, desired)) {
    existing = await prisma.listing.update({ where: { id: existing.id }, data: desired });
    stats.updated += 1;
  } else {
    stats.reused += 1;
  }
  return existing;
}

function addDuration(start: Date, amount: number, unit: SeedBookingScenario['duration_unit']): Date {
  const end = new Date(start);
  if (unit === 'HOUR') end.setUTCHours(end.getUTCHours() + amount);
  else if (unit === 'MONTH') end.setUTCDate(end.getUTCDate() + amount * 30);
  else end.setUTCDate(end.getUTCDate() + amount);
  return end;
}

export function bookingState(scenario: string) {
  const states: Record<string, { status: string; payment: string }> = {
    PENDING_PROVIDER_APPROVAL: { status: 'Pending Provider Approval', payment: 'Not Required Yet' },
    APPROVED_AWAITING_MOCK_PAYMENT: { status: 'Pending Payment', payment: 'Pending' },
    ACTIVE_RENTAL: { status: 'Ongoing', payment: 'Paid (Mock Escrow)' },
    COMPLETED_WITH_MOCK_PAYMENT: { status: 'Completed', payment: 'Paid (Mock Escrow)' },
    RENTER_CANCELLED: { status: 'Cancelled by Renter', payment: 'Not Required Yet' },
    COMPLETED_WITH_DAMAGE_CLAIM: { status: 'Completed', payment: 'Paid (Mock Escrow)' },
    OPEN_DISPUTE: { status: 'Completed', payment: 'Paid (Mock Escrow)' },
    OVERDUE_RETURN: { status: 'Ongoing', payment: 'Paid (Mock Escrow)' },
  };
  const state = states[scenario];
  if (!state) throw new Error(`Unsupported booking scenario ${scenario}`);
  return state;
}

function listingRate(listing: { hourly_rate: number | null; daily_rate: number | null; monthly_rate: number | null }) {
  return listing.hourly_rate ?? listing.daily_rate ?? listing.monthly_rate ?? 1;
}

async function ensureMockPayment(
  prisma: PrismaClient,
  booking: { id: string; renter_id: string; estimated_total_amount: number },
  seedKey: string,
) {
  const idempotencyKey = `${MARKETPLACE_DATASET_VERSION}:${seedKey}:MOCK`;
  let gateway = await prisma.gatewayTransaction.findUnique({ where: { idempotency_key: idempotencyKey } });
  let inserted = false;
  if (!gateway) {
    gateway = await prisma.gatewayTransaction.create({
      data: {
        booking_id: booking.id,
        provider: 'Mock',
        provider_mode: 'Sandbox',
        idempotency_key: idempotencyKey,
        gateway_reference: `mock-${seedKey.toLowerCase()}`,
        gateway_status: 'Paid Sandbox',
        amount: booking.estimated_total_amount,
        currency: 'PHP',
        verified: true,
        verification_status: 'Skipped Sandbox',
        reconciliation_status: 'Matched',
      },
    });
    inserted = true;
  }
  if (!await prisma.payment.findUnique({ where: { booking_id: booking.id } })) {
    await prisma.payment.create({
      data: {
        booking_id: booking.id,
        user_id: booking.renter_id,
        amount: booking.estimated_total_amount,
        payment_method: 'Mock Gateway',
        status: 'Completed',
        type: 'Rental Payment',
        transaction_id: `MOCK-${seedKey}`,
        gateway_transaction_id: gateway.id,
      },
    });
    inserted = true;
  }
  return inserted;
}

async function reconcileBooking(
  prisma: PrismaClient,
  item: SeedBookingScenario,
  listing: {
    id: string;
    provider_id: string;
    rental_type: string;
    hourly_rate: number | null;
    daily_rate: number | null;
    monthly_rate: number | null;
    security_deposit: number | null;
  },
  renterId: string,
  stats: ChangeStats,
) {
  const label = seedLabel(item.seed_key);
  const matches = await prisma.booking.findMany({
    where: { beta_label: label },
    orderBy: { created_at: 'asc' },
  });
  if (matches.length > 1) throw new Error(`Duplicate booking identity ${item.seed_key}`);
  let existing = matches[0];
  const wasExisting = Boolean(existing);
  const start = new Date(SEED_ANCHOR);
  start.setUTCDate(start.getUTCDate() + item.start_offset_days);
  const end = addDuration(start, item.duration_units, item.duration_unit);
  const state = bookingState(item.scenario);
  const rate = listingRate(listing);
  const baseAmount = rate * item.duration_units;
  const deposit = listing.security_deposit ?? 0;
  const desired = {
    listing_id: listing.id,
    renter_id: renterId,
    provider_id: listing.provider_id,
    start_date: start,
    end_date: end,
    rental_duration: item.duration_units,
    rental_duration_unit: item.duration_unit === 'HOUR' ? 'hours' : item.duration_unit === 'MONTH' ? 'months' : 'days',
    selected_rate_type: listing.rental_type,
    base_rental_amount: baseAmount,
    deposit_amount: deposit,
    platform_fee: baseAmount * 0.1,
    estimated_total_amount: baseAmount + deposit + baseAmount * 0.1,
    pickup_option: 'Pickup',
    delivery_requested: false,
    renter_notes: `Deterministic V1.0 scenario ${item.scenario}`,
    provider_notes: item.scenario === 'OVERDUE_RETURN' ? `Overdue return fixture ${item.seed_key}` : null,
    cancellation_reason: item.scenario === 'RENTER_CANCELLED' ? 'Synthetic renter cancellation' : null,
    status: state.status,
    payment_status: state.payment,
    approved_at: state.status === 'Pending Provider Approval' ? null : new Date(start.getTime() - 86400000),
    cancelled_at: state.status === 'Cancelled by Renter' ? new Date(end.getTime()) : null,
    completed_at: state.status === 'Completed' ? new Date(end.getTime()) : null,
    is_test_data: true,
    beta_label: label,
  };
  let changed = false;
  if (!existing) {
    existing = await prisma.booking.create({ data: desired });
    stats.inserted += 1;
  } else if (differs(existing as unknown as Record<string, unknown>, desired)) {
    existing = await prisma.booking.update({ where: { id: existing.id }, data: desired });
    changed = true;
  }
  const historyNote = `Deterministic seed transition ${item.seed_key}`;
  if (!await prisma.bookingStatusHistory.findFirst({ where: { booking_id: existing.id, notes: historyNote } })) {
    await prisma.bookingStatusHistory.create({
      data: {
        booking_id: existing.id,
        old_status: 'Created',
        new_status: state.status,
        changed_by: 'MARKETPLACE_SAMPLE_SEED',
        notes: historyNote,
        created_at: new Date(start.getTime() - 172800000),
      },
    });
    changed = true;
  }
  if (['ACTIVE_RENTAL', 'COMPLETED_WITH_MOCK_PAYMENT', 'COMPLETED_WITH_DAMAGE_CLAIM', 'OPEN_DISPUTE', 'OVERDUE_RETURN'].includes(item.scenario)) {
    if (await ensureMockPayment(prisma, existing, item.seed_key)) changed = true;
  }
  if (item.scenario === 'COMPLETED_WITH_DAMAGE_CLAIM') {
    const claimNumber = `CLM-${item.seed_key}`;
    if (!await prisma.damageClaim.findUnique({ where: { claim_number: claimNumber } })) {
      await prisma.damageClaim.create({
        data: {
          booking_id: existing.id,
          listing_id: listing.id,
          renter_id: renterId,
          provider_id: listing.provider_id,
          claim_number: claimNumber,
          claim_type: 'Damage',
          claim_status: 'Submitted',
          claim_description: `Synthetic damage claim for ${item.seed_key}`,
          claimed_amount: 500,
          deposit_amount: deposit,
          requested_deduction_amount: 500,
        },
      });
      changed = true;
    }
  }
  if (item.scenario === 'OPEN_DISPUTE') {
    const summary = `Synthetic open dispute for ${item.seed_key}`;
    if (!await prisma.disputeCase.findFirst({ where: { booking_id: existing.id, summary } })) {
      await prisma.disputeCase.create({
        data: {
          booking_id: existing.id,
          opened_by: renterId,
          dispute_type: 'Other',
          dispute_status: 'Open',
          summary,
        },
      });
      changed = true;
    }
  }
  if (wasExisting && changed) stats.updated += 1;
  else if (wasExisting) stats.reused += 1;
  return existing;
}

function duplicateRows(values: string[]): Array<{ identity: string; count: number }> {
  const counts = values.reduce<Record<string, number>>((result, value) => {
    const identity = value.toLowerCase();
    result[identity] = (result[identity] ?? 0) + 1;
    return result;
  }, {});
  return Object.entries(counts)
    .filter(([, count]) => count > 1)
    .map(([identity, count]) => ({ identity, count }));
}

async function verifyFinalState(
  prisma: PrismaClient,
  catalog: MarketplaceSeedCatalog,
  protectedBefore: Awaited<ReturnType<typeof snapshotProtected>>,
) {
  const categorySlugs = catalog.categories.map((item) => item.slug);
  const providerEmails = catalog.providers.map((item) => seedEmail(item.email_alias));
  const renterEmails = catalog.renters.map((item) => seedEmail(item.email_alias));
  const listingLabels = catalog.listings.map((item) => seedLabel(item.seed_key));
  const bookingLabels = catalog.booking_scenarios.map((item) => seedLabel(item.seed_key));
  const fixtureLabels = catalog.negative_policy_fixtures.map((item) => seedLabel(item.seed_key));
  const [categories, providers, renters, listings, bookings, fixtures, legacyVisible, protectedAfter] = await Promise.all([
    prisma.category.findMany({
      where: { slug: { in: categorySlugs }, is_active: true },
      select: { name: true, slug: true, requirements: { select: { notes: true } } },
    }),
    prisma.user.findMany({
      where: { email: { in: providerEmails }, is_test_data: true },
      select: { email: true, profile: { select: { id: true } }, businessProfile: { select: { id: true } } },
    }),
    prisma.user.findMany({
      where: { email: { in: renterEmails }, is_test_data: true },
      select: { email: true, profile: { select: { id: true } } },
    }),
    prisma.listing.findMany({
      where: { beta_label: { in: listingLabels }, is_test_data: true },
      select: { beta_label: true, status: true },
    }),
    prisma.booking.findMany({
      where: { beta_label: { in: bookingLabels }, is_test_data: true },
      select: { beta_label: true },
    }),
    prisma.listing.findMany({
      where: { beta_label: { in: fixtureLabels }, is_test_data: true },
      select: { id: true, beta_label: true, status: true },
    }),
    prisma.category.count({
      where: {
        is_active: true,
        OR: [
          { name: { in: ['Mock Category', 'Test Category'] } },
          { name: { startsWith: 'gate4' } },
          { slug: { startsWith: 'gate4' } },
          { slug: { startsWith: 'test-cat-' } },
        ],
      },
    }),
    snapshotProtected(prisma),
  ]);
  const fixtureIds = fixtures.map((item) => item.id);
  const evaluations = await prisma.listingPolicyEvaluation.findMany({
    where: {
      listingId: { in: fixtureIds },
      evaluationSource: 'MARKETPLACE_SAMPLE_SEED',
      policyVersion: 'PH-V1.0',
    },
    select: {
      listingId: true,
      policyVersion: true,
      classification: true,
      decision: true,
      reasonCode: true,
    },
  });
  const cases = await prisma.listingEnforcementCase.findMany({
    where: { listingId: { in: fixtureIds }, caseStatus: { in: ['OPEN', 'UNDER_REVIEW'] } },
    select: { listingId: true, policyId: true },
  });
  const verification = {
    counts: {
      canonicalTopLevelCategories: categories.length,
      canonicalSubcategories: catalog.categories.reduce((total, item) => total + item.subcategories.length, 0),
      sampleListings: listings.length,
      testProviders: providers.length,
      testRenters: renters.length,
      bookingScenarios: bookings.length,
      hiddenPolicyFixtures: fixtures.length,
      publicPolicyFixtures: fixtures.filter((item) => item.status === 'Published').length,
      publishedSampleListings: listings.filter((item) => item.status === 'Published').length,
      submittedSampleListings: listings.filter((item) => item.status === 'Submitted for Review').length,
      draftSampleListings: listings.filter((item) => item.status === 'Draft').length,
      unavailableSampleListings: listings.filter((item) => item.status === 'Unavailable').length,
      legacyVisible,
    },
    duplicates: {
      categoryNames: duplicateRows(categories.map((item) => item.name)),
      categorySlugs: duplicateRows(categories.map((item) => item.slug)),
      testEmails: duplicateRows([...providers, ...renters].map((item) => item.email)),
      providerProfiles: providers
        .filter((item) => Number(Boolean(item.profile)) + Number(Boolean(item.businessProfile)) !== 1)
        .map((item) => item.email),
      renterProfiles: renters.filter((item) => !item.profile).map((item) => item.email),
      listingIdentities: duplicateRows(listings.map((item) => item.beta_label ?? '')),
      bookingIdentities: duplicateRows(bookings.map((item) => item.beta_label ?? '')),
      fixtureIdentities: duplicateRows(fixtures.map((item) => item.beta_label ?? '')),
      policyEvaluations: duplicateRows(evaluations.map((item) => `${item.listingId}:${item.policyVersion}`)),
      activePolicyCases: duplicateRows(cases.map((item) => `${item.listingId}:${item.policyId}`)),
    },
    policyIntegration: evaluations,
    preservation: {
      phase13Before: Object.fromEntries(Object.entries(protectedBefore.phase13).map(([key, ids]) => [key, ids.length])),
      phase13After: Object.fromEntries(Object.entries(protectedAfter.phase13).map(([key, ids]) => [key, ids.length])),
      phase13Lost: Object.fromEntries(Object.entries(protectedBefore.phase13).map(([key, ids]) => [
        key,
        lostIds(ids, protectedAfter.phase13[key as keyof typeof protectedAfter.phase13]),
      ])),
      realBefore: Object.fromEntries(Object.entries(protectedBefore.real).map(([key, ids]) => [key, ids.length])),
      realAfter: Object.fromEntries(Object.entries(protectedAfter.real).map(([key, ids]) => [key, ids.length])),
      realLost: Object.fromEntries(Object.entries(protectedBefore.real).map(([key, ids]) => [
        key,
        lostIds(ids, protectedAfter.real[key as keyof typeof protectedAfter.real]),
      ])),
    },
  };
  const requiredCounts = [15, 45, 5, 3, 8, 6, 0, 29, 8, 4, 4, 0];
  const actualCounts = [
    verification.counts.canonicalTopLevelCategories,
    verification.counts.sampleListings,
    verification.counts.testProviders,
    verification.counts.testRenters,
    verification.counts.bookingScenarios,
    verification.counts.hiddenPolicyFixtures,
    verification.counts.publicPolicyFixtures,
    verification.counts.publishedSampleListings,
    verification.counts.submittedSampleListings,
    verification.counts.draftSampleListings,
    verification.counts.unavailableSampleListings,
    verification.counts.legacyVisible,
  ];
  const duplicateCount = Object.values(verification.duplicates)
    .reduce((total, rows) => total + rows.length, 0);
  const protectedLost = [
    ...Object.values(verification.preservation.phase13Lost),
    ...Object.values(verification.preservation.realLost),
  ].reduce((total, ids) => total + ids.length, 0);
  if (
    actualCounts.some((count, index) => count !== requiredCounts[index]) ||
    duplicateCount !== 0 ||
    protectedLost !== 0
  ) {
    throw new Error(`Final seed verification failed: ${JSON.stringify(verification)}`);
  }
  return verification;
}

export async function runMarketplaceSampleSeed(prisma: PrismaClient): Promise<void> {
  const guard = assertDatabaseGuard();
  console.log('MARKETPLACE_SAMPLE_SEED_DATABASE_GUARD_PASSED');
  const catalog = readCatalog();
  const protectedBefore = await snapshotProtected(prisma);
  const categorySlugs = catalog.categories.map((item) => item.slug);
  const stats = {
    categories: emptyStats(await prisma.category.count({
      where: { slug: { in: categorySlugs }, is_active: true },
    })),
    providers: emptyStats(await prisma.user.count({
      where: {
        email: { in: catalog.providers.map((item) => seedEmail(item.email_alias)) },
        is_test_data: true,
      },
    })),
    renters: emptyStats(await prisma.user.count({
      where: {
        email: { in: catalog.renters.map((item) => seedEmail(item.email_alias)) },
        is_test_data: true,
      },
    })),
    listings: emptyStats(await prisma.listing.count({
      where: {
        beta_label: { in: catalog.listings.map((item) => seedLabel(item.seed_key)) },
        is_test_data: true,
      },
    })),
    bookings: emptyStats(await prisma.booking.count({
      where: {
        beta_label: { in: catalog.booking_scenarios.map((item) => seedLabel(item.seed_key)) },
        is_test_data: true,
      },
    })),
    fixtures: emptyStats(await prisma.listing.count({
      where: {
        beta_label: { in: catalog.negative_policy_fixtures.map((item) => seedLabel(item.seed_key)) },
        is_test_data: true,
      },
    })),
  };
  const cleanup = await archiveLegacyTestData(prisma);
  const categoryByName = await reconcileCategories(prisma, catalog.categories, stats.categories);
  const providerIds = new Map<string, string>();
  for (const provider of catalog.providers) {
    providerIds.set(
      provider.seed_key,
      await reconcileUser(prisma, provider, 'provider', process.env.SEED_TEST_PASSWORD!, stats.providers),
    );
  }
  const renterIds = new Map<string, string>();
  for (const renter of catalog.renters) {
    renterIds.set(
      renter.seed_key,
      await reconcileUser(prisma, renter, 'renter', process.env.SEED_TEST_PASSWORD!, stats.renters),
    );
  }
  const listingsByKey = new Map<string, Awaited<ReturnType<typeof reconcileListing>>>();
  for (const listing of catalog.listings) {
    const providerId = providerIds.get(listing.provider_seed_key);
    const categoryId = categoryByName.get(listing.category)?.id;
    if (!providerId || !categoryId) throw new Error(`Unresolved listing relation ${listing.seed_key}`);
    listingsByKey.set(
      listing.seed_key,
      await reconcileListing(prisma, listing, providerId, categoryId, stats.listings),
    );
  }
  const fixtureResults: Array<{
    seedKey: string;
    expected: string;
    actual: string;
    decision: string;
    finding: boolean;
  }> = [];
  for (const fixture of catalog.negative_policy_fixtures) {
    const providerId = providerIds.get(fixture.provider_seed_key);
    const categoryName = fixture.category === 'Vehicles' ? 'Cars' : fixture.category;
    const categoryId = categoryByName.get(categoryName)?.id;
    if (!providerId || !categoryId) throw new Error(`Unresolved fixture relation ${fixture.seed_key}`);
    const listing = await reconcileFixture(prisma, fixture, providerId, categoryId, stats.fixtures);
    let evaluation = await prisma.listingPolicyEvaluation.findFirst({
      where: {
        listingId: listing.id,
        evaluationSource: 'MARKETPLACE_SAMPLE_SEED',
        policyVersion: 'PH-V1.0',
      },
    });
    if (!evaluation) {
      evaluation = await ProhibitedItemsService.createPolicyEvaluation({
        listingId: listing.id,
        providerUserId: providerId,
        evaluationSource: 'MARKETPLACE_SAMPLE_SEED',
        submittedTitle: listing.title,
        submittedDescription: listing.description ?? '',
      });
    }
    const finding = evaluation.classification !== fixture.expected_policy_classification;
    if (finding && process.env.ALLOW_POLICY_FIXTURE_INTEGRATION_FINDINGS !== 'true') {
      throw new Error(`Policy integration finding requires owner authorization: ${fixture.seed_key}`);
    }
    fixtureResults.push({
      seedKey: fixture.seed_key,
      expected: fixture.expected_policy_classification,
      actual: evaluation.classification,
      decision: evaluation.decision,
      finding,
    });
  }
  for (const scenario of catalog.booking_scenarios) {
    const listing = listingsByKey.get(scenario.listing_seed_key);
    const renterId = renterIds.get(scenario.renter_seed_key);
    if (!listing || !renterId) throw new Error(`Unresolved booking relation ${scenario.seed_key}`);
    await reconcileBooking(prisma, scenario, listing, renterId, stats.bookings);
  }
  stats.categories.archived = cleanup.categoriesArchived;
  stats.categories.after = await prisma.category.count({
    where: { slug: { in: categorySlugs }, is_active: true },
  });
  stats.providers.after = await prisma.user.count({
    where: {
      email: { in: catalog.providers.map((item) => seedEmail(item.email_alias)) },
      is_test_data: true,
    },
  });
  stats.renters.after = await prisma.user.count({
    where: {
      email: { in: catalog.renters.map((item) => seedEmail(item.email_alias)) },
      is_test_data: true,
    },
  });
  stats.listings.after = await prisma.listing.count({
    where: {
      beta_label: { in: catalog.listings.map((item) => seedLabel(item.seed_key)) },
      is_test_data: true,
    },
  });
  stats.bookings.after = await prisma.booking.count({
    where: {
      beta_label: { in: catalog.booking_scenarios.map((item) => seedLabel(item.seed_key)) },
      is_test_data: true,
    },
  });
  stats.fixtures.after = await prisma.listing.count({
    where: {
      beta_label: { in: catalog.negative_policy_fixtures.map((item) => seedLabel(item.seed_key)) },
      is_test_data: true,
    },
  });
  const verification = await verifyFinalState(prisma, catalog, protectedBefore);
  const inserted = Object.values(stats).reduce((total, item) => total + item.inserted, 0);
  const output = {
    datasetVersion: MARKETPLACE_DATASET_VERSION,
    database: guard,
    stats,
    cleanup,
    fixtureResults,
    verification,
  };
  console.log(`MARKETPLACE_SEED_RESULT ${JSON.stringify(output)}`);
  if (
    inserted === 0 &&
    cleanup.categoriesArchived === 0 &&
    cleanup.listingsArchived === 0 &&
    cleanup.bookingsMarked === 0
  ) {
    console.log('RENTIPID_MARKETPLACE_SEED_IDEMPOTENCY_PASSED');
  }
}
