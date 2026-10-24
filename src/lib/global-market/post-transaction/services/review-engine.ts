/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Review & Reputation Engine
 *
 * Enforces verified booking participation, completion preconditions, duplicate prevention,
 * self-review prohibition, and server-authoritative rating aggregates.
 *
 * PERMANENT INVARIANT: Client CANNOT supply authoritative aggregate score.
 */

import {
  type ReviewRecord,
  type ReviewType,
  type ReviewModerationState,
  type RatingAggregate,
  canTransitionReviewModeration,
} from '../contracts/review-lifecycle';
import { type GlobalBookingRecord } from '@/lib/global-market/booking/contracts/booking-record';

const reviewsById = new Map<string, ReviewRecord>();
const reviewsByTargetId = new Map<string, ReviewRecord[]>();
const reviewIndexByBookingUserTarget = new Set<string>();

export interface SubmitReviewInput {
  readonly booking: GlobalBookingRecord;
  readonly authorUserId: string;
  readonly targetId: string;
  readonly reviewType: ReviewType;
  readonly rating: number; // 1 to 5 integer
  readonly title?: string;
  readonly comment: string;
}

export interface ReviewOperationResult {
  readonly success: boolean;
  readonly review?: ReviewRecord;
  readonly error?: string;
}

/**
 * Submits a verified review for a completed booking.
 */
export async function submitReview(
  input: SubmitReviewInput
): Promise<ReviewOperationResult> {
  const { booking, authorUserId, targetId, reviewType, rating, title, comment } = input;

  // 1. Completion Precondition Check (Section 31, 52)
  if (booking.status !== 'COMPLETED') {
    return {
      success: false,
      error: `INELIGIBLE_BOOKING_STATUS: Reviews can only be submitted for COMPLETED bookings (current status: '${booking.status}').`,
    };
  }

  // 2. Participant Eligibility Check (Section 31, 52)
  const isRenter = authorUserId === booking.participants.renterId;
  const isProvider = authorUserId === booking.participants.providerId;

  if (!isRenter && !isProvider) {
    return {
      success: false,
      error: 'REVIEW_UNAUTHORIZED: User is not an authorized participant of this booking.',
    };
  }

  const authorRole: 'RENTER' | 'PROVIDER' = isRenter ? 'RENTER' : 'PROVIDER';

  // 3. Self-Review Prohibition (Section 52)
  if (authorUserId === targetId) {
    return {
      success: false,
      error: 'SELF_REVIEW_PROHIBITED: Users cannot submit reviews for themselves.',
    };
  }

  if (isProvider && targetId === booking.participants.listingId) {
    return {
      success: false,
      error: 'SELF_REVIEW_PROHIBITED: Providers cannot submit reviews for their own listings.',
    };
  }

  // 4. Duplicate Review Guard (Section 31, 52)
  const deduplicationKey = `${booking.id}_${authorUserId}_${targetId}`;
  if (reviewIndexByBookingUserTarget.has(deduplicationKey)) {
    return {
      success: false,
      error: 'DUPLICATE_REVIEW_PROHIBITED: A review for this booking and target has already been submitted by this user.',
    };
  }

  // 5. Rating Value Validation (Must be integer 1 to 5)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return {
      success: false,
      error: `INVALID_RATING_VALUE: Rating must be an integer between 1 and 5 (received ${rating}).`,
    };
  }

  const now = new Date().toISOString();
  const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const record: ReviewRecord = Object.freeze({
    id: reviewId,
    bookingId: booking.id,
    authorUserId,
    authorRole,
    targetId,
    reviewType,
    rating,
    title,
    comment,
    moderationStatus: 'PUBLISHED',
    createdAt: now,
    updatedAt: now,
  });

  reviewsById.set(reviewId, record);
  reviewIndexByBookingUserTarget.add(deduplicationKey);

  const existingTargetReviews = reviewsByTargetId.get(targetId) || [];
  reviewsByTargetId.set(targetId, [...existingTargetReviews, record]);

  return {
    success: true,
    review: record,
  };
}

/**
 * Calculates server-authoritative aggregate ratings for a listing or provider.
 * Excludes hidden or removed reviews.
 */
export function aggregateRating(targetId: string): RatingAggregate {
  const allReviews = reviewsByTargetId.get(targetId) || [];
  const published = allReviews.filter((r) => r.moderationStatus === 'PUBLISHED');

  if (published.length === 0) {
    return {
      targetId,
      averageRating: 0,
      totalReviews: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;

  for (const rev of published) {
    sum += rev.rating;
    distribution[rev.rating] = (distribution[rev.rating] || 0) + 1;
  }

  const averageRating = Math.round((sum / published.length) * 10) / 10;

  return {
    targetId,
    averageRating,
    totalReviews: published.length,
    distribution,
  };
}

export interface ModerateReviewInput {
  readonly reviewId: string;
  readonly moderatorRole: 'ADMIN' | 'SUPPORT_AGENT' | 'MODERATOR' | 'USER';
  readonly targetStatus: ReviewModerationState;
}

/**
 * Moderates a review (e.g. hides or removes offensive content).
 */
export function moderateReview(input: ModerateReviewInput): ReviewOperationResult {
  const { reviewId, moderatorRole, targetStatus } = input;
  const review = reviewsById.get(reviewId);

  if (!review) {
    return { success: false, error: `REVIEW_NOT_FOUND: Review '${reviewId}' does not exist.` };
  }

  if (moderatorRole === 'USER') {
    return { success: false, error: 'MODERATION_UNAUTHORIZED: Regular users cannot moderate reviews.' };
  }

  if (!canTransitionReviewModeration(review.moderationStatus, targetStatus)) {
    return {
      success: false,
      error: `ILLEGAL_STATE_TRANSITION: Cannot transition review from '${review.moderationStatus}' to '${targetStatus}'.`,
    };
  }

  const updated: ReviewRecord = Object.freeze({
    ...review,
    moderationStatus: targetStatus,
    updatedAt: new Date().toISOString(),
  });

  reviewsById.set(reviewId, updated);

  const targetReviews = reviewsByTargetId.get(review.targetId) || [];
  const updatedTargetReviews = targetReviews.map((r) => (r.id === reviewId ? updated : r));
  reviewsByTargetId.set(review.targetId, updatedTargetReviews);

  return { success: true, review: updated };
}

export function getReviewById(reviewId: string): ReviewRecord | null {
  return reviewsById.get(reviewId) || null;
}
