import type { InsuranceIdentifier, InsuranceMoney } from "../types";

export type ClaimStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "PENDING_PARTNER"
  | "PARTNER_RECEIVED"
  | "UNDER_REVIEW"
  | "MORE_INFORMATION_REQUIRED"
  | "APPROVED"
  | "PARTIALLY_APPROVED"
  | "DENIED"
  | "PAID"
  | "CLOSED"
  | "CANCELLED"
  | "FAILED";

export interface InsuranceClaimRecord {
  id: string;
  policyId: string;
  externalClaimId?: string;
  idempotencyKey: string;
  status: ClaimStatus;
  incidentType: string;
  incidentAt: Date;
  incidentSummary?: string;
  claimantUserId?: string;
  claimedAmountMinor?: number;
  currency?: string;
  normalizedSnapshot?: unknown;
  submittedAt: Date;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsuranceClaimEvidenceRecord {
  id: string;
  claimId: string;
  evidenceType: string;
  fileReference: string;
  mimeType?: string;
  sizeBytes?: number;
  uploadedBy: string;
  idempotencyKey: string;
  partnerTransfer: "PENDING" | "TRANSFERRED" | "FAILED" | "NOT_REQUIRED";
  createdAt: Date;
}

export type InsuranceClaimErrorCode =
  | "CLAIM_NOT_FOUND"
  | "POLICY_NOT_FOUND"
  | "INVALID_POLICY_STATUS"
  | "DUPLICATE_CLAIM"
  | "DUPLICATE_EVIDENCE"
  | "IDEMPOTENCY_CONFLICT"
  | "VALIDATION_FAILED"
  | "UNAUTHORIZED"
  | "EVIDENCE_MISMATCH";

export class InsuranceClaimError extends Error {
  constructor(
    readonly code: InsuranceClaimErrorCode,
    message: string,
    readonly retryable = false,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "InsuranceClaimError";
  }
}
