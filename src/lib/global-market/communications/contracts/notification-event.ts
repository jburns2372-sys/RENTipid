/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Notification Event & Intent Contracts
 *
 * Implements domain booking events, provider-neutral notification channels,
 * and delivery intent structures.
 */

export const BOOKING_EVENT_CODES = [
  'BOOKING_REQUESTED',
  'BOOKING_ACCEPTED',
  'BOOKING_DECLINED',
  'BOOKING_PAYMENT_REQUIRED',
  'BOOKING_CONFIRMED',
  'BOOKING_STARTING',
  'BOOKING_ACTIVE',
  'BOOKING_COMPLETED',
  'BOOKING_CANCELLED',
] as const;

export type BookingEventCode = (typeof BOOKING_EVENT_CODES)[number];

export const DELIVERY_CHANNELS = [
  'IN_APP',
  'EMAIL',
  'SMS',
  'WHATSAPP',
  'PUSH',
] as const;

export type DeliveryChannel = (typeof DELIVERY_CHANNELS)[number];

export interface NotificationProfile {
  readonly jurisdictionCode: string;
  readonly supportedChannels: readonly DeliveryChannel[];
  readonly supportsWhatsAppOtpOnly: boolean;
  readonly requiresEmailConfirmation: boolean;
  readonly fallbackChannel: DeliveryChannel;
}

export type NotificationDeliveryStatus =
  | 'PENDING'
  | 'SENT'
  | 'FAILED'
  | 'SKIPPED_DUPLICATE';

export interface NotificationIntent {
  readonly id: string;
  readonly eventCode: BookingEventCode;
  readonly recipientId: string;
  readonly templateKey: string;
  readonly locale: string; // Recipient UI language locale, e.g. 'en-PH', 'th-TH', 'zh-Hans', 'ja-JP'
  readonly channels: readonly DeliveryChannel[];
  readonly payload: Readonly<Record<string, unknown>>;
  readonly idempotencyKey: string;
  readonly deliveryStatus: NotificationDeliveryStatus;
  readonly errorMessage?: string;
  readonly createdAt: string;
}
