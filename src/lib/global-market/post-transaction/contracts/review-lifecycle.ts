/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Review & Reputation Lifecycle Contracts
 *
 * Defines review types, moderation states, verified participant eligibility,
 * and server-authoritative rating aggregates.
 */

export const REVIEW_TYPES = [
  'RENTER_TO_PROVIDER',
  'PROVIDER_TO_RENTER',
  'RENTER_TO_LISTING',
] as const;

export type ReviewType = (typeof REVIEW_TYPES)[number];

export const REVIEW_MODERATION_STATES = [
  'PUBLISHED',
  'PENDING_MODERATION',
  'HIDDEN',
  'REMOVED',
  'FLAGGED',
] as const;

export type ReviewModerationState = (typeof REVIEW_MODERATION_STATES)[number];

export const ALL_REVIEW_MODERATION_STATES: readonly ReviewModerationState[] = Object.freeze([
  ...REVIEW_MODERATION_STATES,
]);

export const LEGAL_REVIEW_MODERATION_TRANSITIONS: Readonly<Record<ReviewModerationState, readonly ReviewModerationState[]>> = Object.freeze({
  PENDING_MODERATION: ['PUBLISHED', 'REMOVED', 'HIDDEN'],
  PUBLISHED: ['FLAGGED', 'HIDDEN', 'REMOVED'],
  FLAGGED: ['PUBLISHED', 'HIDDEN', 'REMOVED'],
  HIDDEN: ['PUBLISHED', 'REMOVED'],
  REMOVED: [], // Terminal
});

export function canTransitionReviewModeration(
  current: ReviewModerationState,
  target: ReviewModerationState
): boolean {
  if (current === target) return true;
  const allowed = LEGAL_REVIEW_MODERATION_TRANSITIONS[current];
  return allowed ? allowed.includes(target) : false;
}

export interface ReviewRecord {
  readonly id: string;
  readonly bookingId: string;
  readonly authorUserId: string;
  readonly authorRole: 'RENTER' | 'PROVIDER';
  readonly targetId: string; // Listing ID or User ID (Provider/Renter)
  readonly reviewType: ReviewType;
  readonly rating: number; // 1 to 5 integer
  readonly title?: string;
  readonly comment: string;
  readonly moderationStatus: ReviewModerationState;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface RatingAggregate {
  readonly targetId: string;
  readonly averageRating: number;
  readonly totalReviews: number;
  readonly distribution: Readonly<Record<number, number>>;
}
