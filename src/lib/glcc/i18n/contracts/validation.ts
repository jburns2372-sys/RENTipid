/**
 * RENTipid GLCC v1.0.1 — Domain Contract: validation
 */

export const VALIDATION_KEYS = [
  "validation.general.title"
] as const;

export const VALIDATION_EN_PH: Record<(typeof VALIDATION_KEYS)[number], string> = {
  "validation.general.title": "Validation"
};
