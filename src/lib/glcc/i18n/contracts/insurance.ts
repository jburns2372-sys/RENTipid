/**
 * RENTipid GLCC v1.0.1 — Domain Contract: insurance
 */

export const INSURANCE_KEYS = [
  "insurance.general.title"
] as const;

export const INSURANCE_EN_PH: Record<(typeof INSURANCE_KEYS)[number], string> = {
  "insurance.general.title": "Insurance"
};
