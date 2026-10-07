/**
 * RENTipid GLOBAL-MKT / v2.0 — Document Requirement Contracts
 *
 * Defines the controlled vocabulary of identity, residence, and corporate documentation.
 */

export const DOCUMENT_CATEGORIES = [
  'PASSPORT',
  'NATIONAL_ID',
  'DRIVER_LICENSE',
  'ADDRESS_PROOF',
  'BUSINESS_REGISTRATION',
  'TAX_REGISTRATION',
  'AUTHORIZED_REPRESENTATIVE_DOCUMENT',
  'SELFIE_LIVENESS',
  'OTHER_REGULATED_DOCUMENT',
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const ALL_DOCUMENT_CATEGORIES: readonly DocumentCategory[] = Object.freeze([...DOCUMENT_CATEGORIES]);

export interface DocumentRequirementDefinition {
  readonly category: DocumentCategory;
  readonly mandatory: boolean;
  readonly displayName: string;
  readonly description: string;
  readonly acceptedFileFormats: readonly string[];
  readonly maxFileSizeBytes: number;
}

export interface SubmittedDocumentReference {
  readonly documentId: string;
  readonly category: DocumentCategory;
  readonly fileUrl: string;
  readonly status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  readonly uploadedAt: string;
  readonly reviewedBy?: string | null;
  readonly reviewedAt?: string | null;
  readonly rejectionReason?: string | null;
}
