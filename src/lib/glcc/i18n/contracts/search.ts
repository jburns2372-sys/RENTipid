/**
 * RENTipid GLCC v1.0.1 — Domain Contract: search
 */

export const SEARCH_KEYS = [
  "search.general.title"
] as const;

export const SEARCH_EN_PH: Record<(typeof SEARCH_KEYS)[number], string> = {
  "search.general.title": "Search"
};
