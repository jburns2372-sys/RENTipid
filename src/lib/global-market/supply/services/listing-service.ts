/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Listing Domain Service
 *
 * Implements listing creation, draft management, ownership enforcement,
 * and lifecycle transitions.
 */

import { resolveOperatingJurisdiction } from '@/lib/global-market/account/services/account-service';
import { type GlobalListingRecord, type ListingDraftInput } from '../contracts/listing-record';
import { canTransitionListingStatus, type ListingLifecycleState } from '../contracts/listing-lifecycle';

export function validateListingOwnership(
  listing: GlobalListingRecord | null | undefined,
  requestingUserId: string,
  requestingRole?: string
): { allowed: boolean; reason?: string } {
  if (!listing) {
    return { allowed: false, reason: 'Listing not found.' };
  }

  const isAdmin = ['Admin', 'ADMIN', 'Super Admin', 'SUPER_ADMIN', 'Compliance Admin', 'COMPLIANCE_ADMIN'].includes(requestingRole || '');
  if (isAdmin) {
    return { allowed: true };
  }

  if (listing.providerId !== requestingUserId) {
    return { allowed: false, reason: 'FORBIDDEN: You do not have permission to modify this listing.' };
  }

  return { allowed: true };
}

/**
 * Creates a draft listing record. Supports:
 * - createDraftListingRecord(input: ListingDraftInput)
 * - createDraftListingRecord(providerId: string, input: ListingDraftInput)
 */
export function createDraftListingRecord(
  arg1: string | ListingDraftInput,
  arg2?: ListingDraftInput
): GlobalListingRecord {
  let providerId: string;
  let input: ListingDraftInput;

  if (typeof arg1 === 'string') {
    providerId = arg1;
    input = arg2 || ({} as ListingDraftInput);
  } else {
    input = arg1;
    providerId = input.providerId || '';
  }

  if (!providerId) {
    throw new Error('PROVIDER_ID_REQUIRED: Listing draft must specify a valid providerId.');
  }

  const rawCountry = input.countryCode || input.jurisdictionCode;
  const jurisdictionCode = resolveOperatingJurisdiction(rawCountry);
  if (!jurisdictionCode) {
    throw new Error(`UNKNOWN_JURISDICTION: Cannot create listing in unknown jurisdiction '${rawCountry}'.`);
  }

  const now = new Date().toISOString();
  return Object.freeze({
    id: `listing_draft_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    providerId,
    countryCode: jurisdictionCode,
    jurisdictionCode: `JUR-${jurisdictionCode}`,
    categoryId: input.categoryId,
    title: input.title ? input.title.trim() : '',
    description: input.description?.trim(),
    location: input.location,
    pricing: input.pricing,
    status: 'DRAFT',
    createdAt: now,
    updatedAt: now,
    photos: input.photos ? [...input.photos] : [],
    photosCount: input.photos?.length || 0,
    isTestData: Boolean(input.isTestData),
  });
}

/**
 * Updates a draft listing record. Supports:
 * - updateListingDraft(existing, updates, requestingUserId)
 * - updateListingDraft(requestingUserId, existing, updates)
 */
export function updateListingDraft(
  arg1: string | GlobalListingRecord,
  arg2: GlobalListingRecord | Partial<ListingDraftInput>,
  arg3?: string | Partial<ListingDraftInput>
): GlobalListingRecord {
  let requestingUserId: string;
  let existing: GlobalListingRecord;
  let updates: Partial<ListingDraftInput>;

  if (typeof arg1 === 'string') {
    requestingUserId = arg1;
    existing = arg2 as GlobalListingRecord;
    updates = (arg3 || {}) as Partial<ListingDraftInput>;
  } else {
    existing = arg1 as GlobalListingRecord;
    updates = arg2 as Partial<ListingDraftInput>;
    requestingUserId = arg3 as string;
  }

  // Server-authoritative ownership check (Section 13)
  if (requestingUserId && existing.providerId !== requestingUserId) {
    throw new Error(`OWNERSHIP_VIOLATION: User '${requestingUserId}' cannot modify listing owned by '${existing.providerId}'.`);
  }

  // Immutable providerId (Anti-tampering Section 13)
  if (updates.providerId && updates.providerId !== existing.providerId) {
    throw new Error('OWNERSHIP_VIOLATION: Cannot reassign providerId of an existing listing.');
  }

  const now = new Date().toISOString();
  return Object.freeze({
    ...existing,
    title: updates.title !== undefined ? updates.title.trim() : existing.title,
    description: updates.description !== undefined ? updates.description?.trim() : existing.description,
    categoryId: updates.categoryId || existing.categoryId,
    categorySlug: updates.categorySlug || existing.categorySlug,
    location: updates.location || existing.location,
    pricing: updates.pricing || existing.pricing,
    photos: updates.photos ? [...updates.photos] : existing.photos,
    photosCount: updates.photos ? updates.photos.length : existing.photosCount,
    updatedAt: now,
  });
}

/**
 * Transitions a listing to a new lifecycle status if permitted by the transition guard.
 */
export function transitionListingLifecycle(
  listing: GlobalListingRecord,
  targetStatus: ListingLifecycleState,
  actorUserId: string,
  actorRole?: string
): GlobalListingRecord {
  const ownership = validateListingOwnership(listing, actorUserId, actorRole);
  if (!ownership.allowed) {
    throw new Error(`FORBIDDEN: ${ownership.reason}`);
  }

  if (!canTransitionListingStatus(listing.status, targetStatus)) {
    throw new Error(`ILLEGAL_LIFECYCLE_TRANSITION: Cannot transition listing from '${listing.status}' to '${targetStatus}'.`);
  }

  const now = new Date().toISOString();
  return Object.freeze({
    ...listing,
    status: targetStatus,
    publishedAt: targetStatus === 'PUBLISHED' ? now : listing.publishedAt,
    updatedAt: now,
  });
}
