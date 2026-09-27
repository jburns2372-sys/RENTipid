/**
 * RENTipid GLCC v1.0.1 — Domain Contract: messages
 */

export const MESSAGES_KEYS = [
  "messages.general.title"
] as const;

export const MESSAGES_EN_PH: Record<(typeof MESSAGES_KEYS)[number], string> = {
  "messages.general.title": "Messages"
};
