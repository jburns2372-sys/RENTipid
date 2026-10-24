/**
 * RENTipid GLOBAL-MKT / v2.0 — Marketplace Conversation Contracts
 *
 * Implements one unified global conversation model bound to listing or booking contexts
 * with server-authoritative participant validation.
 */

export type ConversationContextType = 'LISTING_INQUIRY' | 'BOOKING' | 'SUPPORT';

export interface MarketplaceConversation {
  readonly id: string;
  readonly contextType: ConversationContextType;
  readonly contextId: string; // listingId, bookingId, or supportTicketId
  readonly participants: readonly string[]; // Array of authorized userIds
  readonly jurisdictionCode: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly isArchived: boolean;
}
