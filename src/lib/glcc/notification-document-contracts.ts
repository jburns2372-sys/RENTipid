/**
 * RENTipid GLCC v1.0 — Notifications & Documents Contracts
 *
 * Work Package: GLCC-P9
 * Acceptance Targets: TRN-01, TRN-03, E2E-01
 *
 * Implements:
 * 1. Immutable document snapshot models for receipts, invoices, and rental agreements.
 * 2. Strict grounding of financial documents in PHP contract truth (PAYMENT_CONTRACT_CURRENCY = 'PHP').
 * 3. Informational FX disclosure reference snapshot for non-PHP display currencies.
 * 4. Recipient-targeted multilingual notification contracts (SMS, Email, Push, In-App).
 * 5. Legal gate enforcement for contractual document templates (TRN-03).
 */

export type DocumentType =
  | 'PAYMENT_RECEIPT'
  | 'RENTAL_AGREEMENT'
  | 'INVOICE'
  | 'SECURITY_DEPOSIT_STATEMENT';

export type NotificationChannel = 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';

export type NotificationType =
  | 'BOOKING_CONFIRMED'
  | 'PAYMENT_RECEIPT'
  | 'REFUND_ISSUED'
  | 'SECURITY_DEPOSIT_HOLD'
  | 'SECURITY_DEPOSIT_RELEASED'
  | 'INSPECTION_REMINDER';

export interface DocumentParty {
  readonly id: string;
  readonly name: string;
  readonly email?: string;
  readonly role: 'RENTER' | 'PROVIDER' | 'PLATFORM';
}

export interface DocumentFxReference {
  readonly quoteId: string;
  readonly displayCurrency: string;
  readonly displayAmount: number;
  readonly referenceRate: number;
  readonly rateSource: string;
  readonly rateTimestamp: string;
}

export interface DocumentFinancialBreakdown {
  readonly baseRentalPhp: number;
  readonly serviceFeePhp: number;
  readonly securityDepositPhp: number;
  readonly deliveryFeePhp: number;
  readonly totalChargePhp: number;
  readonly currency: 'PHP';
  readonly fxReference?: DocumentFxReference;
}

export interface DocumentSnapshot {
  readonly documentId: string;
  readonly documentType: DocumentType;
  readonly bookingId: string;
  readonly transactionReference?: string;
  readonly issuer: DocumentParty;
  readonly recipient: DocumentParty;
  readonly effectiveLocale: string;
  readonly financialBreakdown: DocumentFinancialBreakdown;
  readonly legalVersion?: string;
  readonly legalApprovalStatus?: 'APPROVED' | 'CANONICAL_FALLBACK';
  readonly legalNotice?: string;
  readonly issuedAt: string;
  readonly contentChecksum: string;
}

export interface NotificationRecipient {
  readonly userId: string;
  readonly name: string;
  readonly email?: string;
  readonly phoneNumber?: string;
  readonly preferredLocale: string;
  readonly preferredCurrency?: string;
}

export interface NotificationPayload {
  readonly type: NotificationType;
  readonly bookingId: string;
  readonly recipient: NotificationRecipient;
  readonly channels: NotificationChannel[];
  readonly variables: Record<string, string | number>;
  readonly financialDetails?: {
    readonly authoritativeAmountPhp: number;
    readonly currency: 'PHP';
    readonly displayEstimate?: {
      readonly amount: number;
      readonly currency: string;
    };
  };
}

export interface RenderedNotificationMessage {
  readonly channel: NotificationChannel;
  readonly subject?: string;
  readonly body: string;
  readonly localeUsed: string;
  readonly isFallbackToCanonical: boolean;
}

export interface NotificationDispatchResult {
  readonly notificationId: string;
  readonly recipientId: string;
  readonly renderedMessages: RenderedNotificationMessage[];
  readonly status: 'DISPATCHED' | 'FAILED';
  readonly dispatchedAt: string;
}
