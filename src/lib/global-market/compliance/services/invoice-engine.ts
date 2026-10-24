/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Invoice & Receipt Engine
 *
 * Implements server-authoritative issuance of receipts, invoices, and credit notes.
 *
 * PERMANENT INVARIANTS:
 * - Invoice amounts derive STRICTLY from authoritative booking, payment, and refund records.
 * - Client input CANNOT dictate invoice amounts or currencies.
 */

import {
  type MarketplaceInvoiceRecord,
  type InvoiceDocumentType,
} from '../contracts/invoice-profile';
import { type GlobalBookingRecord } from '@/lib/global-market/booking/contracts/booking-record';
import { type PaymentAttemptRecord } from '@/lib/global-market/financial/contracts/payment-record';
import { type RefundInstruction } from '@/lib/global-market/post-transaction/contracts/refund-lifecycle';

const invoicesById = new Map<string, MarketplaceInvoiceRecord>();
const invoicesByIdempotency = new Map<string, MarketplaceInvoiceRecord>();
const invoicesByBookingId = new Map<string, MarketplaceInvoiceRecord[]>();

export interface GenerateReceiptInput {
  readonly booking: GlobalBookingRecord;
  readonly paymentRecord: PaymentAttemptRecord;
  readonly providerTaxId?: string;
  readonly renterTaxId?: string;
  readonly idempotencyKey: string;
}

export interface GenerateCreditNoteInput {
  readonly booking: GlobalBookingRecord;
  readonly originalInvoiceId: string;
  readonly refundInstruction: RefundInstruction;
  readonly reason: string;
  readonly idempotencyKey: string;
}

export interface InvoiceOperationResult {
  readonly success: boolean;
  readonly invoice?: MarketplaceInvoiceRecord;
  readonly isIdempotentReplay?: boolean;
  readonly error?: string;
}

/**
 * Generates an authoritative receipt/invoice for a confirmed, paid booking.
 */
export async function generateBookingReceipt(
  input: GenerateReceiptInput
): Promise<InvoiceOperationResult> {
  const { booking, paymentRecord, providerTaxId, renterTaxId, idempotencyKey } = input;

  // 1. Idempotency Check
  if (invoicesByIdempotency.has(idempotencyKey)) {
    const existing = invoicesByIdempotency.get(idempotencyKey)!;
    return {
      success: true,
      invoice: existing,
      isIdempotentReplay: true,
    };
  }

  // 2. Authoritative Amount Extraction (no client tampering)
  const baseRental = booking.moneySnapshot.baseRentalAmountMinorUnits;
  const securityDeposit = booking.moneySnapshot.securityDepositAmountMinorUnits;
  const platformFee = booking.moneySnapshot.platformFeeMinorUnits;
  const totalAmount = paymentRecord.authoritativeAmountMinorUnits;
  const currency = paymentRecord.transactionCurrency;

  const now = new Date().toISOString();
  const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const invoiceNumber = `REC-${booking.participants.jurisdictionCode}-${Date.now().toString().slice(-6)}`;

  const isDomesticPH = booking.participants.jurisdictionCode === 'PH';
  const documentType: InvoiceDocumentType = isDomesticPH ? 'RECEIPT' : 'INVOICE';

  const record: MarketplaceInvoiceRecord = Object.freeze({
    invoiceId,
    invoiceNumber,
    documentType,
    bookingId: booking.id,
    bookingReference: booking.bookingReference,
    paymentAttemptId: paymentRecord.id,
    jurisdictionCode: booking.participants.jurisdictionCode,
    providerUserId: booking.participants.providerId,
    renterUserId: booking.participants.renterId,
    currency,
    baseRentalAmountMinorUnits: baseRental,
    securityDepositMinorUnits: securityDeposit,
    platformFeeMinorUnits: platformFee,
    taxAmountMinorUnits: 0, // Separated unless explicit tax calculation attached
    totalAmountMinorUnits: totalAmount,
    providerTaxId,
    customerTaxId: renterTaxId,
    legalDisclaimers: Object.freeze([
      'Issued automatically by RENTipid Marketplace Platform.',
      'Peer-to-peer rental transactions are between independent users under RENTipid Terms of Service.',
    ]),
    status: 'ISSUED',
    issuedAt: now,
    idempotencyKey,
  });

  invoicesById.set(invoiceId, record);
  invoicesByIdempotency.set(idempotencyKey, record);

  const existingForBooking = invoicesByBookingId.get(booking.id) || [];
  invoicesByBookingId.set(booking.id, [...existingForBooking, record]);

  return {
    success: true,
    invoice: record,
  };
}

/**
 * Generates an authoritative credit note for an approved refund.
 */
export async function generateRefundCreditNote(
  input: GenerateCreditNoteInput
): Promise<InvoiceOperationResult> {
  const { booking, originalInvoiceId, refundInstruction, reason, idempotencyKey } = input;

  if (invoicesByIdempotency.has(idempotencyKey)) {
    const existing = invoicesByIdempotency.get(idempotencyKey)!;
    return {
      success: true,
      invoice: existing,
      isIdempotentReplay: true,
    };
  }

  const originalInvoice = invoicesById.get(originalInvoiceId);
  if (!originalInvoice) {
    return {
      success: false,
      error: `ORIGINAL_INVOICE_NOT_FOUND: Invoice '${originalInvoiceId}' does not exist.`,
    };
  }

  const now = new Date().toISOString();
  const creditNoteId = `cn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const creditNoteNumber = `CN-${booking.participants.jurisdictionCode}-${Date.now().toString().slice(-6)}`;

  const record: MarketplaceInvoiceRecord = Object.freeze({
    invoiceId: creditNoteId,
    invoiceNumber: creditNoteNumber,
    documentType: 'CREDIT_NOTE',
    bookingId: booking.id,
    bookingReference: booking.bookingReference,
    refundInstructionId: refundInstruction.id,
    jurisdictionCode: booking.participants.jurisdictionCode,
    providerUserId: booking.participants.providerId,
    renterUserId: booking.participants.renterId,
    currency: refundInstruction.currency,
    baseRentalAmountMinorUnits: 0,
    securityDepositMinorUnits: 0,
    platformFeeMinorUnits: 0,
    taxAmountMinorUnits: 0,
    totalAmountMinorUnits: refundInstruction.approvedAmountMinorUnits,
    legalDisclaimers: Object.freeze([
      `Credit note adjustment for original invoice ${originalInvoice.invoiceNumber}.`,
      `Reason: ${reason}`,
    ]),
    status: 'ISSUED',
    issuedAt: now,
    idempotencyKey,
  });

  invoicesById.set(creditNoteId, record);
  invoicesByIdempotency.set(idempotencyKey, record);

  const existingForBooking = invoicesByBookingId.get(booking.id) || [];
  invoicesByBookingId.set(booking.id, [...existingForBooking, record]);

  return {
    success: true,
    invoice: record,
  };
}

export function getInvoiceById(invoiceId: string): MarketplaceInvoiceRecord | null {
  return invoicesById.get(invoiceId) || null;
}

export function getInvoicesByBookingId(bookingId: string): readonly MarketplaceInvoiceRecord[] {
  return invoicesByBookingId.get(bookingId) || [];
}
