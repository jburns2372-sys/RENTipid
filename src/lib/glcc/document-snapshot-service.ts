/**
 * RENTipid GLCC v1.0 — Document Snapshot & Generation Service
 *
 * Work Package: GLCC-P9
 * Acceptance Targets: TRN-03, E2E-01
 *
 * Implements:
 * 1. Immutable document snapshot creation with deterministic SHA-256 checksums.
 * 2. Strict grounding in PHP financial contract truth (PAYMENT_CONTRACT_CURRENCY = 'PHP').
 * 3. Informational FX reference serialization for non-PHP display estimates.
 * 4. Legal translation gate enforcement for contractual agreements (TRN-03).
 */

import { createHash } from 'crypto';
import type {
  DocumentSnapshot,
  DocumentType,
  DocumentParty,
  DocumentFinancialBreakdown,
  DocumentFxReference,
} from './notification-document-contracts';
import { globalLegalTranslationGate } from './legal-translation-gate';

export interface CreateDocumentSnapshotInput {
  readonly documentType: DocumentType;
  readonly bookingId: string;
  readonly transactionReference?: string;
  readonly issuer: DocumentParty;
  readonly recipient: DocumentParty;
  readonly requestedLocale?: string;
  readonly breakdown: {
    readonly baseRentalPhp: number;
    readonly serviceFeePhp: number;
    readonly securityDepositPhp: number;
    readonly deliveryFeePhp: number;
    readonly totalChargePhp: number;
  };
  readonly fxReference?: DocumentFxReference;
  readonly legalVersion?: string;
}

export class DocumentSnapshotService {
  /**
   * Generates a tamper-evident, immutable document snapshot.
   */
  public static createSnapshot(input: CreateDocumentSnapshotInput): DocumentSnapshot {
    const locale = (input.requestedLocale || 'en-PH').trim();

    // 1. Enforce strict PHP financial contract truth
    const financialBreakdown: DocumentFinancialBreakdown = {
      baseRentalPhp: input.breakdown.baseRentalPhp,
      serviceFeePhp: input.breakdown.serviceFeePhp,
      securityDepositPhp: input.breakdown.securityDepositPhp,
      deliveryFeePhp: input.breakdown.deliveryFeePhp,
      totalChargePhp: input.breakdown.totalChargePhp,
      currency: 'PHP',
      fxReference: input.fxReference,
    };

    // 2. Evaluate legal translation gate for regulated agreements (TRN-03)
    let legalApprovalStatus: 'APPROVED' | 'CANONICAL_FALLBACK' | undefined;
    let legalNotice: string | undefined;

    if (input.documentType === 'RENTAL_AGREEMENT') {
      const legalVersion = input.legalVersion || '1.0.0';
      const legalEval = globalLegalTranslationGate.evaluatePublication({
        documentType: 'rental_agreement',
        sourceVersion: legalVersion,
        requestedLocale: locale,
      });

      if (legalEval.outcome === 'APPROVED_TRANSLATED_VERSION' || legalEval.outcome === 'APPROVED_CANONICAL') {
        legalApprovalStatus = 'APPROVED';
      } else {
        legalApprovalStatus = 'CANONICAL_FALLBACK';
        legalNotice = 'Official legal agreement terms rendered in canonical English (en-PH). Machine translation of binding clauses is prohibited under platform policy.';
      }
    }

    const issuedAt = new Date().toISOString();
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // 3. Compute deterministic content checksum
    const rawPayload = JSON.stringify({
      documentId,
      documentType: input.documentType,
      bookingId: input.bookingId,
      transactionReference: input.transactionReference,
      issuer: input.issuer,
      recipient: input.recipient,
      effectiveLocale: locale,
      financialBreakdown,
      legalApprovalStatus,
      issuedAt,
    });

    const contentChecksum = createHash('sha256').update(rawPayload).digest('hex');

    return Object.freeze({
      documentId,
      documentType: input.documentType,
      bookingId: input.bookingId,
      transactionReference: input.transactionReference,
      issuer: input.issuer,
      recipient: input.recipient,
      effectiveLocale: locale,
      financialBreakdown,
      legalVersion: input.legalVersion,
      legalApprovalStatus,
      legalNotice,
      issuedAt,
      contentChecksum,
    });
  }
}
