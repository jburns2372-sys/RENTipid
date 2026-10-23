/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Trust Profile Contract
 *
 * Implements the server-authoritative trust and verification model for an account.
 * Aggregates identity, KYC, business, and provider verification statuses.
 */

import { type VerificationState } from './verification-state';
import { type DocumentCategory, type SubmittedDocumentReference } from './document-requirement';

export type SubjectType = 'INDIVIDUAL' | 'BUSINESS';
export const ALL_SUBJECT_TYPES: readonly SubjectType[] = Object.freeze(['INDIVIDUAL', 'BUSINESS']);

export interface GlobalTrustProfile {
  readonly accountId: string;
  readonly operatingJurisdiction: string;
  readonly subjectType: SubjectType;
  
  // Decoupled verification states
  readonly identityState: VerificationState;
  readonly kycState: VerificationState;
  readonly businessVerificationState: VerificationState;
  readonly providerVerificationState: VerificationState;
  readonly contactVerificationState: VerificationState;

  // Aggregate composite state
  readonly aggregateState: VerificationState;

  // Documents
  readonly requiredDocuments: readonly DocumentCategory[];
  readonly submittedDocuments: readonly SubmittedDocumentReference[];

  // Provider tracking
  readonly providerAdapter: string;
  readonly providerReference?: string | null;

  // Audit and lifecycle
  readonly verifiedAt?: string | null;
  readonly expiresAt?: string | null;
  readonly reviewAuthority?: string | null;
  readonly blockingReasons: readonly string[];
}
