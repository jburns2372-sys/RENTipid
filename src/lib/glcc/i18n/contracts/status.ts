/**
 * RENTipid GLCC v1.0.1 — Domain Contract: status
 */

export const STATUS_KEYS = [
  "status.general.title"
] as const;

export const STATUS_EN_PH: Record<(typeof STATUS_KEYS)[number], string> = {
  "status.general.title": "Status"
};
