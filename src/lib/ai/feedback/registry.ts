export const FEEDBACK_RATINGS = ['THUMBS_UP', 'THUMBS_DOWN'] as const;
export type FeedbackRating = (typeof FEEDBACK_RATINGS)[number];

export const FEEDBACK_REASONS = [
  'HELPFUL',
  'RESOLVED_MY_ISSUE',
  'ACCURATE',
  'UNCLEAR',
  'INCORRECT',
  'NOT_RELEVANT',
  'OUTDATED',
  'TOO_GENERIC',
  'FAILED_ACTION',
  'OTHER',
] as const;
export type FeedbackReason = (typeof FEEDBACK_REASONS)[number];

const POSITIVE_REASONS = new Set<FeedbackReason>(['HELPFUL', 'RESOLVED_MY_ISSUE', 'ACCURATE', 'OTHER']);
const NEGATIVE_REASONS = new Set<FeedbackReason>([
  'UNCLEAR',
  'INCORRECT',
  'NOT_RELEVANT',
  'OUTDATED',
  'TOO_GENERIC',
  'FAILED_ACTION',
  'OTHER',
]);

export function isFeedbackRating(value: unknown): value is FeedbackRating {
  return typeof value === 'string' && (FEEDBACK_RATINGS as readonly string[]).includes(value);
}

export function isFeedbackReason(value: unknown): value is FeedbackReason {
  return typeof value === 'string' && (FEEDBACK_REASONS as readonly string[]).includes(value);
}

export function isReasonAllowed(rating: FeedbackRating, reason: FeedbackReason) {
  return rating === 'THUMBS_UP' ? POSITIVE_REASONS.has(reason) : NEGATIVE_REASONS.has(reason);
}
