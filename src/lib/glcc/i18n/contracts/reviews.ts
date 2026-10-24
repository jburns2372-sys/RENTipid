/**
 * RENTipid GLCC v1.0.1 — Domain Contract: reviews
 */

export const REVIEWS_KEYS = [
  "reviews.general.title"
] as const;

export const REVIEWS_EN_PH: Record<(typeof REVIEWS_KEYS)[number], string> = {
  "reviews.general.title": "Reviews"
};
