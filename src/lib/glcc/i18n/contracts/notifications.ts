/**
 * RENTipid GLCC v1.0.1 — Domain Contract: notifications
 */

export const NOTIFICATIONS_KEYS = [
  "notifications.general.title"
] as const;

export const NOTIFICATIONS_EN_PH: Record<(typeof NOTIFICATIONS_KEYS)[number], string> = {
  "notifications.general.title": "Notifications"
};
