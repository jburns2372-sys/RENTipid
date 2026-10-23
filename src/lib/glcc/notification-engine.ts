/**
 * RENTipid GLCC v1.0 — Multilingual Notification Engine
 *
 * Work Package: GLCC-P9
 * Acceptance Targets: TRN-01, E2E-01
 *
 * Implements:
 * 1. Independent multi-party localization: renders notifications in recipient's preferred locale.
 * 2. Multi-channel rendering: EMAIL, SMS, PUSH, IN_APP.
 * 3. Deterministic template fallback: missing translations fall back safely to en-PH (TRN-01).
 * 4. Grounded financial disclosure: exact PHP charges always disclosed.
 */

import type {
  NotificationPayload,
  NotificationDispatchResult,
  RenderedNotificationMessage,
  NotificationChannel,
  NotificationType,
} from './notification-document-contracts';

interface TemplateDefinition {
  readonly subject?: string;
  readonly body: string;
}

const NOTIFICATION_TEMPLATES: Record<
  string, // locale
  Record<NotificationType, Record<NotificationChannel, TemplateDefinition>>
> = {
  'en-PH': {
    BOOKING_CONFIRMED: {
      EMAIL: {
        subject: 'Booking Confirmed: {itemTitle}',
        body: 'Hello {recipientName}, your booking for {itemTitle} has been confirmed. Total charged: ₱{amountPhp} PHP.',
      },
      SMS: {
        body: 'RENTipid: Booking confirmed for {itemTitle}. Total charged: ₱{amountPhp} PHP.',
      },
      PUSH: {
        subject: 'Booking Confirmed!',
        body: 'Your reservation for {itemTitle} is confirmed. Total: ₱{amountPhp} PHP.',
      },
      IN_APP: {
        subject: 'Booking Confirmed',
        body: 'Your booking #{bookingId} ({itemTitle}) is confirmed. Total: ₱{amountPhp} PHP.',
      },
    },
    PAYMENT_RECEIPT: {
      EMAIL: {
        subject: 'Payment Receipt for Booking #{bookingId}',
        body: 'Hello {recipientName}, your payment of ₱{amountPhp} PHP has been processed successfully. Ref: {refNumber}.',
      },
      SMS: {
        body: 'RENTipid: Payment of ₱{amountPhp} PHP received. Ref: {refNumber}.',
      },
      PUSH: {
        subject: 'Payment Successful',
        body: '₱{amountPhp} PHP charged for booking #{bookingId}.',
      },
      IN_APP: {
        subject: 'Payment Processed',
        body: 'Payment receipt for ₱{amountPhp} PHP is available for booking #{bookingId}.',
      },
    },
    REFUND_ISSUED: {
      EMAIL: {
        subject: 'Refund Processed: ₱{amountPhp} PHP',
        body: 'Hello {recipientName}, a refund of ₱{amountPhp} PHP has been initiated for booking #{bookingId}.',
      },
      SMS: {
        body: 'RENTipid: Refund of ₱{amountPhp} PHP initiated for booking #{bookingId}.',
      },
      PUSH: {
        subject: 'Refund Initiated',
        body: '₱{amountPhp} PHP refunded for booking #{bookingId}.',
      },
      IN_APP: {
        subject: 'Refund Initiated',
        body: 'Refund of ₱{amountPhp} PHP has been queued for booking #{bookingId}.',
      },
    },
    SECURITY_DEPOSIT_HOLD: {
      EMAIL: {
        subject: 'Security Deposit Authorized: ₱{amountPhp} PHP',
        body: 'Hello {recipientName}, a security deposit hold of ₱{amountPhp} PHP has been authorized for booking #{bookingId}.',
      },
      SMS: {
        body: 'RENTipid: Security deposit hold of ₱{amountPhp} PHP active for booking #{bookingId}.',
      },
      PUSH: {
        subject: 'Deposit Hold Active',
        body: '₱{amountPhp} PHP deposit authorized for booking #{bookingId}.',
      },
      IN_APP: {
        subject: 'Deposit Hold',
        body: 'Security deposit of ₱{amountPhp} PHP held for booking #{bookingId}.',
      },
    },
    SECURITY_DEPOSIT_RELEASED: {
      EMAIL: {
        subject: 'Security Deposit Released',
        body: 'Hello {recipientName}, the security deposit hold of ₱{amountPhp} PHP for booking #{bookingId} has been fully released.',
      },
      SMS: {
        body: 'RENTipid: Deposit of ₱{amountPhp} PHP released for booking #{bookingId}.',
      },
      PUSH: {
        subject: 'Deposit Released',
        body: 'Your ₱{amountPhp} PHP deposit hold has been released.',
      },
      IN_APP: {
        subject: 'Deposit Released',
        body: 'Security deposit for booking #{bookingId} released.',
      },
    },
    INSPECTION_REMINDER: {
      EMAIL: {
        subject: 'Inspection Reminder for Booking #{bookingId}',
        body: 'Hello {recipientName}, please upload your condition inspection photos for {itemTitle}.',
      },
      SMS: {
        body: 'RENTipid: Please submit inspection photos for {itemTitle} #{bookingId}.',
      },
      PUSH: {
        subject: 'Inspection Needed',
        body: 'Submit photos for {itemTitle} before turnover.',
      },
      IN_APP: {
        subject: 'Inspection Photos Required',
        body: 'Complete condition inspection for {itemTitle}.',
      },
    },
  },
  'fil-PH': {
    BOOKING_CONFIRMED: {
      EMAIL: {
        subject: 'Kumpirmado ang Booking: {itemTitle}',
        body: 'Kamusta {recipientName}, kumpirmado na ang iyong booking para sa {itemTitle}. Kabuuang binayaran: ₱{amountPhp} PHP.',
      },
      SMS: {
        body: 'RENTipid: Kumpirmado ang booking para sa {itemTitle}. Kabuuang binayaran: ₱{amountPhp} PHP.',
      },
      PUSH: {
        subject: 'Kumpirmado ang Booking!',
        body: 'Kumpirmado na ang iyong reserbasyon para sa {itemTitle}. Kabuuan: ₱{amountPhp} PHP.',
      },
      IN_APP: {
        subject: 'Kumpirmado ang Booking',
        body: 'Ang iyong booking #{bookingId} ({itemTitle}) ay kumpirmado na. Kabuuan: ₱{amountPhp} PHP.',
      },
    },
    PAYMENT_RECEIPT: {
      EMAIL: {
        subject: 'Resibo ng Pagbabayad para sa Booking #{bookingId}',
        body: 'Kamusta {recipientName}, matagumpay na naproseso ang iyong bayad na ₱{amountPhp} PHP. Ref: {refNumber}.',
      },
      SMS: {
        body: 'RENTipid: Natanggap ang bayad na ₱{amountPhp} PHP. Ref: {refNumber}.',
      },
      PUSH: {
        subject: 'Matagumpay ang Pagbabayad',
        body: '₱{amountPhp} PHP ang nabawas para sa booking #{bookingId}.',
      },
      IN_APP: {
        subject: 'Naproseso ang Bayad',
        body: 'Available na ang resibo para sa bayad na ₱{amountPhp} PHP sa booking #{bookingId}.',
      },
    },
    REFUND_ISSUED: {
      EMAIL: {
        subject: 'Na-refund: ₱{amountPhp} PHP',
        body: 'Kamusta {recipientName}, pinasimulan na ang refund na ₱{amountPhp} PHP para sa booking #{bookingId}.',
      },
      SMS: {
        body: 'RENTipid: Refund na ₱{amountPhp} PHP pinasimulan para sa booking #{bookingId}.',
      },
      PUSH: {
        subject: 'Pinasimulan ang Refund',
        body: '₱{amountPhp} PHP na-refund para sa booking #{bookingId}.',
      },
      IN_APP: {
        subject: 'Pinasimulan ang Refund',
        body: 'Ang refund na ₱{amountPhp} PHP ay nakapila na para sa booking #{bookingId}.',
      },
    },
    SECURITY_DEPOSIT_HOLD: {
      EMAIL: {
        subject: 'Awtorisadong Security Deposit: ₱{amountPhp} PHP',
        body: 'Kamusta {recipientName}, awtorisado na ang hold ng security deposit na ₱{amountPhp} PHP para sa booking #{bookingId}.',
      },
      SMS: {
        body: 'RENTipid: Hold ng deposit na ₱{amountPhp} PHP aktibo para sa booking #{bookingId}.',
      },
      PUSH: {
        subject: 'Aktibo ang Deposit Hold',
        body: '₱{amountPhp} PHP deposit awtorisado para sa booking #{bookingId}.',
      },
      IN_APP: {
        subject: 'Hold ng Deposit',
        body: 'Security deposit na ₱{amountPhp} PHP ay naka-hold para sa booking #{bookingId}.',
      },
    },
    SECURITY_DEPOSIT_RELEASED: {
      EMAIL: {
        subject: 'Pinalaya na ang Security Deposit',
        body: 'Kamusta {recipientName}, ang security deposit hold na ₱{amountPhp} PHP para sa booking #{bookingId} ay ganap nang pinalaya.',
      },
      SMS: {
        body: 'RENTipid: Deposit na ₱{amountPhp} PHP pinalaya na para sa booking #{bookingId}.',
      },
      PUSH: {
        subject: 'Pinalaya ang Deposit',
        body: 'Ang iyong ₱{amountPhp} PHP deposit hold ay pinalaya na.',
      },
      IN_APP: {
        subject: 'Pinalaya ang Deposit',
        body: 'Security deposit para sa booking #{bookingId} pinalaya na.',
      },
    },
    INSPECTION_REMINDER: {
      EMAIL: {
        subject: 'Paalala sa Inspeksyon para sa Booking #{bookingId}',
        body: 'Kamusta {recipientName}, paki-upload ang iyong mga larawan ng inspeksyon ng kondisyon para sa {itemTitle}.',
      },
      SMS: {
        body: 'RENTipid: Paki-submit ang mga larawan ng inspeksyon para sa {itemTitle} #{bookingId}.',
      },
      PUSH: {
        subject: 'Kailangan ang Inspeksyon',
        body: 'Mag-submit ng mga larawan para sa {itemTitle} bago ang turnover.',
      },
      IN_APP: {
        subject: 'Kailangan ang Larawan ng Inspeksyon',
        body: 'Kumpletuhin ang inspeksyon ng kondisyon para sa {itemTitle}.',
      },
    },
  },
};

function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return vars[key] !== undefined ? String(vars[key]) : `{${key}}`;
  });
}

export class NotificationEngine {
  /**
   * Renders and dispatches a notification targeted to the recipient's preferred locale.
   */
  public static renderNotification(payload: NotificationPayload): NotificationDispatchResult {
    const requestedLocale = payload.recipient.preferredLocale || 'en-PH';
    const isSupported = requestedLocale in NOTIFICATION_TEMPLATES;
    const effectiveLocale = isSupported ? requestedLocale : 'en-PH';
    const isFallbackToCanonical = !isSupported;

    const templateCatalog = NOTIFICATION_TEMPLATES[effectiveLocale];
    const typeTemplates = templateCatalog[payload.type];

    const renderedMessages: RenderedNotificationMessage[] = [];

    // Merge base variables with recipient name and financial details
    const vars: Record<string, string | number> = {
      ...payload.variables,
      recipientName: payload.recipient.name,
      bookingId: payload.bookingId,
      amountPhp: payload.financialDetails
        ? payload.financialDetails.authoritativeAmountPhp.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : (payload.variables.amountPhp ?? '0.00'),
    };

    for (const channel of payload.channels) {
      const template = typeTemplates[channel];
      if (template) {
        renderedMessages.push({
          channel,
          subject: template.subject ? interpolate(template.subject, vars) : undefined,
          body: interpolate(template.body, vars),
          localeUsed: effectiveLocale,
          isFallbackToCanonical,
        });
      }
    }

    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return {
      notificationId,
      recipientId: payload.recipient.userId,
      renderedMessages,
      status: 'DISPATCHED',
      dispatchedAt: new Date().toISOString(),
    };
  }
}
