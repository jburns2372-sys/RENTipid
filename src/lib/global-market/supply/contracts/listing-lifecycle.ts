/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Listing Lifecycle Contract
 *
 * Implements controlled listing states and legal state transitions.
 */

export const LISTING_LIFECYCLE_STATES = [
  'DRAFT',
  'INCOMPLETE',
  'READY_FOR_REVIEW',
  'PENDING_REVIEW',
  'PUBLISHED',
  'PAUSED',
  'REJECTED',
  'SUSPENDED',
  'ARCHIVED',
] as const;

export type ListingLifecycleState = (typeof LISTING_LIFECYCLE_STATES)[number];
export type ListingLifecycleStatus = ListingLifecycleState; // Alias

export const ALL_LISTING_LIFECYCLE_STATES: readonly ListingLifecycleState[] = Object.freeze([
  ...LISTING_LIFECYCLE_STATES,
]);

export const ALL_LISTING_LIFECYCLE_STATUSES = ALL_LISTING_LIFECYCLE_STATES; // Alias

export const LEGAL_LISTING_TRANSITIONS: Readonly<Record<ListingLifecycleState, readonly ListingLifecycleState[]>> = Object.freeze({
  DRAFT: ['INCOMPLETE', 'READY_FOR_REVIEW', 'ARCHIVED'], // Draft cannot jump directly to published; must undergo review
  INCOMPLETE: ['DRAFT', 'READY_FOR_REVIEW', 'ARCHIVED'],
  READY_FOR_REVIEW: ['PENDING_REVIEW', 'DRAFT', 'ARCHIVED'],
  PENDING_REVIEW: ['PUBLISHED', 'REJECTED', 'DRAFT'],
  PUBLISHED: ['PAUSED', 'SUSPENDED', 'ARCHIVED', 'DRAFT'],
  PAUSED: ['PUBLISHED', 'ARCHIVED', 'DRAFT'],
  REJECTED: ['DRAFT', 'ARCHIVED'],
  SUSPENDED: ['DRAFT', 'ARCHIVED', 'PUBLISHED'],
  ARCHIVED: [], // Terminal
});

export function canTransitionListingStatus(
  current: ListingLifecycleState,
  target: ListingLifecycleState
): boolean {
  if (current === target) return true;
  const allowed = LEGAL_LISTING_TRANSITIONS[current];
  return allowed ? allowed.includes(target) : false;
}

export function isPubliclyDiscoverable(status: ListingLifecycleState): boolean {
  return status === 'PUBLISHED';
}
