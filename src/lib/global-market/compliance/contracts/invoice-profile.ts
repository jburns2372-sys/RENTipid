/**
 * RENTipid GLOBAL-MKT / v2.0 — Invoice & Receipt Framework Contracts
 *
 * Defines document types, invoice generation structures, and credit note relations.
 *
 * PERMANENT INVARIANT:
 * Invoice amounts MUST derive from authoritative booking, payment, and refund records.
 * Client input cannot dictate financial document amounts or currencies.
 */

export const INVOICE_DOCUMENT_TYPES = [
  'RECEIPT',
  'INVOICE',
  'TAX_INVOICE',
  'CREDIT_NOTE',
  'DEBIT_NOTE',
  'OTHER_REQUIRED_DOCUMENT',
] as const;

export type InvoiceDocumentType = (typeof INVOICE_DOCUMENT_TYPES)[number];

export type InvoiceLifecycleStatus = 'ISSUED' | 'VOIDED' | 'ADJUSTED';

export interface MarketplaceInvoiceRecord {
  readonly invoiceId: string;
  readonly invoiceNumber: string;
  readonly documentType: InvoiceDocumentType;
  readonly bookingId: string;
  readonly bookingReference: string;
  readonly paymentAttemptId?: string;
  readonly refundInstructionId?: string;
  readonly jurisdictionCode: string;
  readonly providerUserId: string;
  readonly renterUserId: string;
  readonly currency: string;
  readonly baseRentalAmountMinorUnits: number;
  readonly securityDepositMinorUnits: number;
  readonly platformFeeMinorUnits: number;
  readonly taxAmountMinorUnits: number;
  readonly totalAmountMinorUnits: number;
  readonly providerTaxId?: string;
  readonly platformTaxId?: string;
  readonly customerTaxId?: string;
  readonly legalDisclaimers: readonly string[];
  readonly status: InvoiceLifecycleStatus;
  readonly issuedAt: string;
  readonly voidedAt?: string;
  readonly replacedByInvoiceId?: string;
  readonly idempotencyKey: string;
}

export interface JurisdictionInvoiceRequirement {
  readonly jurisdictionCode: string;
  readonly requiredDocumentTypes: readonly InvoiceDocumentType[];
  readonly taxInvoiceMandatory: boolean;
  readonly platformVatRegistrationNumber?: string;
  readonly requiredLegalFooters: readonly string[];
  readonly requiresSequentialNumbering: boolean;
  readonly allowsDigitalIssuance: boolean;
}
