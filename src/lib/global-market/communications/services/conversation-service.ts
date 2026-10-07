/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Conversation & Message Domain Service
 *
 * Implements server-authoritative participant authorization, anti-forgery system message guards,
 * and privacy sanitization protecting identity and payment data.
 */

import {
  type ConversationContextType,
  type MarketplaceConversation,
} from '../contracts/conversation';
import {
  type MessageType,
  type MarketplaceMessage,
} from '../contracts/message';
import { type GlobalBookingRecord } from '@/lib/global-market/booking/contracts/booking-record';

export interface ConversationAccessResult {
  readonly allowed: boolean;
  readonly reason?: string;
}

/**
 * Validates whether an actor has permission to read or participate in a conversation.
 * Strictly prevents leaking communications to unauthorized third parties.
 */
export function validateConversationAccess(
  conversation: MarketplaceConversation | null | undefined,
  requestingUserId: string,
  requestingRole?: string
): ConversationAccessResult {
  if (!conversation) {
    return { allowed: false, reason: 'CONVERSATION_NOT_FOUND: Conversation does not exist.' };
  }

  const isAdmin = ['Admin', 'ADMIN', 'Super Admin', 'SUPER_ADMIN', 'Support Admin', 'SUPPORT_ADMIN'].includes(
    requestingRole || ''
  );
  if (isAdmin) {
    return { allowed: true };
  }

  if (!conversation.participants.includes(requestingUserId)) {
    return {
      allowed: false,
      reason: 'FORBIDDEN: You are not an authorized participant in this conversation.',
    };
  }

  return { allowed: true };
}

/**
 * Creates a generic marketplace conversation.
 */
export function createMarketplaceConversation(
  contextType: ConversationContextType,
  contextId: string,
  participants: readonly string[],
  jurisdictionCode: string
): MarketplaceConversation {
  if (!participants || participants.length < 2) {
    throw new Error('INVALID_PARTICIPANTS: Conversations must include at least two participants.');
  }

  const uniqueParticipants = Array.from(new Set(participants));
  const now = new Date().toISOString();

  return Object.freeze({
    id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    contextType,
    contextId,
    participants: Object.freeze(uniqueParticipants),
    jurisdictionCode,
    createdAt: now,
    updatedAt: now,
    isArchived: false,
  });
}

/**
 * Creates a conversation strictly bound to an authoritative booking record.
 * Participants are immutable and bound to renter and provider (Anti-injection Section 26).
 */
export function createBookingLinkedConversation(
  booking: GlobalBookingRecord
): MarketplaceConversation {
  const participants = [
    booking.participants.renterId,
    booking.participants.providerId,
  ];

  return createMarketplaceConversation(
    'BOOKING',
    booking.id,
    participants,
    booking.participants.jurisdictionCode
  );
}

/**
 * Sanitizes message content to prevent accidental leakage of sensitive payment or KYC credentials.
 */
export function sanitizeMessageContent(rawContent: string): string {
  if (!rawContent) return '';

  let sanitized = rawContent;

  // Mask 16-digit credit card patterns
  sanitized = sanitized.replace(/\b(?:\d{4}[ -]?){3}\d{4}\b/g, '[REDACTED_PAYMENT_CARD]');

  // Mask CVV 3-4 digit hints
  sanitized = sanitized.replace(/\b(?:cvv|cvc|security code)[:\s]+(\d{3,4})\b/gi, 'cvv: [REDACTED]');

  return sanitized;
}

export interface SendMessageInput {
  readonly conversation: MarketplaceConversation;
  readonly senderId: string;
  readonly senderRole: string; // 'Renter' | 'Provider' | 'Admin' | 'System'
  readonly messageType: MessageType;
  readonly content: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Creates a typed marketplace message.
 * Enforces anti-forgery guards: ordinary users cannot emit SYSTEM_EVENT or BOOKING_STATUS_EVENT.
 */
export function createMarketplaceMessage(input: SendMessageInput): MarketplaceMessage {
  const { conversation, senderId, senderRole, messageType, content, metadata } = input;

  // 1. Participant check (unless system)
  const isSystem = senderRole === 'System' || senderRole === 'SYSTEM' || senderId === 'SYSTEM';
  const isAdmin = ['Admin', 'ADMIN', 'Super Admin', 'SUPER_ADMIN'].includes(senderRole);

  if (!isSystem && !isAdmin) {
    const access = validateConversationAccess(conversation, senderId, senderRole);
    if (!access.allowed) {
      throw new Error(`ACCESS_VIOLATION: ${access.reason}`);
    }
  }

  // 2. Anti-forgery check: Only System or Admin can emit SYSTEM_EVENT or BOOKING_STATUS_EVENT
  if (messageType === 'SYSTEM_EVENT' || messageType === 'BOOKING_STATUS_EVENT') {
    if (!isSystem && !isAdmin) {
      throw new Error(
        `FORGERY_VIOLATION: Ordinary users cannot send '${messageType}'. System events must be server-generated.`
      );
    }
  }

  const cleanContent = sanitizeMessageContent(content);
  const now = new Date().toISOString();

  return Object.freeze({
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    conversationId: conversation.id,
    senderId,
    senderRole,
    messageType,
    content: cleanContent,
    metadata,
    sentAt: now,
    isReadBy: Object.freeze([senderId]),
  });
}
