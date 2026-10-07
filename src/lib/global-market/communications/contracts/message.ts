/**
 * RENTipid GLOBAL-MKT / v2.0 — Marketplace Message Contracts
 *
 * Implements typed message categories and anti-forgery boundaries
 * distinguishing user chat from server-generated system and booking status events.
 */

export const MESSAGE_TYPES = [
  'USER_MESSAGE',
  'SYSTEM_EVENT',
  'BOOKING_STATUS_EVENT',
  'NOTIFICATION_EVENT_REFERENCE',
] as const;

export type MessageType = (typeof MESSAGE_TYPES)[number];

export interface MarketplaceMessage {
  readonly id: string;
  readonly conversationId: string;
  readonly senderId: string; // userId or 'SYSTEM'
  readonly senderRole: string; // 'Renter' | 'Provider' | 'Admin' | 'System'
  readonly messageType: MessageType;
  readonly content: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly sentAt: string;
  readonly isReadBy: readonly string[];
}
