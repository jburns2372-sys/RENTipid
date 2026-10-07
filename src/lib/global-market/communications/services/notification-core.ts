/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Notification Core Service
 *
 * Implements provider-neutral notification intent generation, localized template selection
 * (COUNTRY != LANGUAGE), delivery failure isolation, and duplicate notification protection.
 */

import {
  type BookingEventCode,
  type DeliveryChannel,
  type NotificationIntent,
  type NotificationDeliveryStatus,
} from '../contracts/notification-event';
import { resolveJurisdictionNotificationProfile } from '../registry/jurisdiction-notification-registry';
import { type GlobalBookingRecord } from '@/lib/global-market/booking/contracts/booking-record';

export interface LocalizedTemplateMessage {
  readonly title: string;
  readonly body: string;
}

const NOTIFICATION_TEMPLATES: Readonly<Record<string, Record<string, LocalizedTemplateMessage>>> = Object.freeze({
  BOOKING_REQUESTED: {
    'en-US': { title: 'New Booking Request', body: 'You have a new booking request for your listing.' },
    'en-PH': { title: 'New Booking Request', body: 'You received a new booking request for your listing.' },
    'fil-PH': { title: 'Bagong Kahilingan sa Pag-arkila', body: 'Mayroon kang bagong kahilingan sa pag-arkila.' },
    'th-TH': { title: 'คำขอจองใหม่', body: 'คุณได้รับคำขอจองใหม่สำหรับรายการของคุณ' },
    'zh-Hans': { title: '新预订请求', body: '您的房源收到了新的预订请求。' },
    'ja-JP': { title: '新しい予約リクエスト', body: 'リスティングに新しい予約リクエストが届きました。' },
    'de-DE': { title: 'Neue Buchungsanfrage', body: 'Sie haben eine neue Buchungsanfrage für Ihr Inserat erhalten.' },
  },
  BOOKING_ACCEPTED: {
    'en-US': { title: 'Booking Accepted', body: 'Your rental booking has been accepted by the provider.' },
    'en-PH': { title: 'Booking Accepted', body: 'Your rental booking has been accepted by the provider.' },
    'fil-PH': { title: 'Tinanggap ang Pag-arkila', body: 'Tinanggap ng may-ari ang iyong pag-arkila.' },
    'th-TH': { title: 'การจองได้รับการยอมรับแล้ว', body: 'ผู้ให้บริการยอมรับคำขอเช่าของคุณแล้ว' },
    'zh-Hans': { title: '预订已接受', body: '房东已接受您的租赁预订。' },
    'ja-JP': { title: '予約が承認されました', body: '予約リクエストがプロバイダーによって承認されました。' },
    'de-DE': { title: 'Buchung akzeptiert', body: 'Ihre Buchung wurde vom Anbieter akzeptiert.' },
  },
  BOOKING_DECLINED: {
    'en-US': { title: 'Booking Declined', body: 'Your booking request was declined.' },
    'en-PH': { title: 'Booking Declined', body: 'Your booking request was declined.' },
    'fil-PH': { title: 'Tinanggihan ang Pag-arkila', body: 'Tinanggihan ang iyong kahilingan sa pag-arkila.' },
    'th-TH': { title: 'การจองถูกปฏิเสธ', body: 'คำขอจองของคุณถูกปฏิเสธ' },
    'zh-Hans': { title: '预订已拒绝', body: '您的预订请求已被拒绝。' },
    'ja-JP': { title: '予約が拒否されました', body: '予約リクエストは拒否されました。' },
    'de-DE': { title: 'Buchung abgelehnt', body: 'Ihre Buchungsanfrage wurde abgelehnt.' },
  },
  BOOKING_CONFIRMED: {
    'en-US': { title: 'Booking Confirmed', body: 'Your rental booking is now confirmed.' },
    'en-PH': { title: 'Booking Confirmed', body: 'Your rental booking is confirmed and ready.' },
    'fil-PH': { title: 'Kumpirmado ang Pag-arkila', body: 'Kumpirmado na ang iyong pag-arkila.' },
    'th-TH': { title: 'ยืนยันการจองแล้ว', body: 'การจองการเช่าของคุณได้รับการยืนยันแล้ว' },
    'zh-Hans': { title: '预订已确认', body: '您的租赁预订现已确认。' },
    'ja-JP': { title: '予約が確定しました', body: 'レンタル予約が確定しました。' },
    'de-DE': { title: 'Buchung bestätigt', body: 'Ihre Mietbuchung ist jetzt bestätigt.' },
  },
  BOOKING_COMPLETED: {
    'en-US': { title: 'Rental Completed', body: 'Your rental has been successfully completed. Thank you!' },
    'en-PH': { title: 'Rental Completed', body: 'Your rental has completed. Thank you for renting with RENTipid!' },
    'fil-PH': { title: 'Kumpleto na ang Pag-arkila', body: 'Matagumpay na natapos ang pag-arkila. Maraming salamat!' },
    'th-TH': { title: 'การเช่าเสร็จสมบูรณ์', body: 'การเช่าของคุณเสร็จสมบูรณ์เรียบร้อยแล้ว ขอบคุณที่ใช้บริการ' },
    'zh-Hans': { title: '租赁已完成', body: '您的租赁已顺利完成。感谢您的使用！' },
    'ja-JP': { title: 'レンタル完了', body: 'レンタルが正常に完了しました。ご利用ありがとうございました。' },
    'de-DE': { title: 'Miete abgeschlossen', body: 'Ihre Miete wurde erfolgreich abgeschlossen. Vielen Dank!' },
  },
  BOOKING_CANCELLED: {
    'en-US': { title: 'Booking Cancelled', body: 'The rental booking has been cancelled.' },
    'en-PH': { title: 'Booking Cancelled', body: 'The rental booking was cancelled.' },
    'fil-PH': { title: 'Kinansela ang Pag-arkila', body: 'Kinansela ang pag-arkila.' },
    'th-TH': { title: 'การจองถูกยกเลิก', body: 'การจองการเช่าถูกยกเลิกแล้ว' },
    'zh-Hans': { title: '预订已取消', body: '租赁预订已被取消。' },
    'ja-JP': { title: '予約がキャンセルされました', body: 'レンタル予約はキャンセルされました。' },
    'de-DE': { title: 'Buchung storniert', body: 'Die Buchung wurde storniert.' },
  },
});

/**
 * Resolves localized notification template content.
 * Falls back safely to 'en-US' if requested locale is missing.
 */
export function resolveNotificationContent(
  eventCode: BookingEventCode,
  locale: string
): LocalizedTemplateMessage {
  const eventTemplates = NOTIFICATION_TEMPLATES[eventCode] || NOTIFICATION_TEMPLATES['BOOKING_REQUESTED'];
  if (eventTemplates[locale]) {
    return eventTemplates[locale];
  }
  // Fallback to en-US
  return eventTemplates['en-US'] || { title: 'Marketplace Update', body: 'You have a new update regarding your booking.' };
}

export interface BuildNotificationIntentInput {
  readonly eventCode: BookingEventCode;
  readonly recipientId: string;
  readonly recipientLocale?: string;
  readonly jurisdictionCode: string;
  readonly booking: GlobalBookingRecord;
  readonly idempotencyKey?: string;
}

/**
 * Generates an immutable NotificationIntent.
 * Reconciles recipient locale and jurisdiction notification capabilities.
 */
export function buildNotificationIntent(
  input: BuildNotificationIntentInput
): NotificationIntent {
  const { eventCode, recipientId, recipientLocale, jurisdictionCode, booking, idempotencyKey } = input;
  const locale = recipientLocale || 'en-US';

  const profile = resolveJurisdictionNotificationProfile(jurisdictionCode);
  const channels: readonly DeliveryChannel[] = profile ? profile.supportedChannels : Object.freeze(['IN_APP']);

  const template = resolveNotificationContent(eventCode, locale);
  const now = new Date().toISOString();
  const intentId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const resolvedIdempotencyKey = idempotencyKey || `idemp_notif_${eventCode}_${booking.id}_${recipientId}`;

  return Object.freeze({
    id: intentId,
    eventCode,
    recipientId,
    templateKey: eventCode,
    locale,
    channels,
    payload: Object.freeze({
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      listingTitle: booking.listingSnapshot.title,
      currency: booking.moneySnapshot.bookingPriceCurrency,
      amountMinorUnits: booking.moneySnapshot.estimatedTotalAmountMinorUnits,
      title: template.title,
      body: template.body,
    }),
    idempotencyKey: resolvedIdempotencyKey,
    deliveryStatus: 'PENDING',
    createdAt: now,
  });
}

// In-memory idempotency deduplication tracker for local delivery isolation
const PROCESSED_IDEMPOTENCY_KEYS = new Set<string>();

export interface NotificationDeliveryResult {
  readonly success: boolean;
  readonly status: NotificationDeliveryStatus;
  readonly intent: NotificationIntent;
  readonly error?: string;
}

/**
 * Dispatches a notification intent to delivery channels with:
 * 1. Delivery failure isolation: External delivery failure NEVER aborts or rolls back booking state.
 * 2. Idempotency protection: Duplicate calls with the same idempotency key are safely skipped.
 */
export async function dispatchNotificationIntent(
  intent: NotificationIntent,
  externalDeliveryAdapter?: (intent: NotificationIntent) => Promise<boolean>
): Promise<NotificationDeliveryResult> {
  // 1. Idempotency Check
  if (PROCESSED_IDEMPOTENCY_KEYS.has(intent.idempotencyKey)) {
    const skippedIntent: NotificationIntent = Object.freeze({
      ...intent,
      deliveryStatus: 'SKIPPED_DUPLICATE',
    });
    return {
      success: true,
      status: 'SKIPPED_DUPLICATE',
      intent: skippedIntent,
    };
  }

  // 2. Delivery Execution with Fault Isolation
  try {
    if (externalDeliveryAdapter) {
      const delivered = await externalDeliveryAdapter(intent);
      if (!delivered) {
        throw new Error('ADAPTER_DELIVERY_FAILED: External notification provider returned false.');
      }
    }

    // Mark as processed
    PROCESSED_IDEMPOTENCY_KEYS.add(intent.idempotencyKey);

    const sentIntent: NotificationIntent = Object.freeze({
      ...intent,
      deliveryStatus: 'SENT',
    });

    return {
      success: true,
      status: 'SENT',
      intent: sentIntent,
    };
  } catch (err: unknown) {
    // Isolated delivery failure — do not throw to protect booking state (Section 34)
    const errorMessage = err instanceof Error ? err.message : String(err);
    const failedIntent: NotificationIntent = Object.freeze({
      ...intent,
      deliveryStatus: 'FAILED',
      errorMessage,
    });

    return {
      success: false,
      status: 'FAILED',
      error: errorMessage,
      intent: failedIntent,
    };
  }
}
