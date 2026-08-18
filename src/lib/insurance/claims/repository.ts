import type { InsuranceClaimRecord, InsuranceClaimEvidenceRecord, ClaimStatus } from "./types";
import type { InsurancePolicy } from "../types";

export interface NewInsuranceClaim {
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
}

export interface NewInsuranceClaimEvidence {
  claimId: string;
  evidenceType: string;
  fileReference: string;
  mimeType?: string;
  sizeBytes?: number;
  uploadedBy: string;
  idempotencyKey: string;
  partnerTransfer?: "PENDING" | "TRANSFERRED" | "FAILED" | "NOT_REQUIRED";
}

export interface InsuranceClaimRepository {
  findClaimById(id: string): Promise<InsuranceClaimRecord | null>;
  findClaimByExternalId(externalClaimId: string): Promise<InsuranceClaimRecord | null>;
  findClaimByIdempotencyKey(idempotencyKey: string): Promise<InsuranceClaimRecord | null>;
  findClaimsByPolicyId(policyId: string): Promise<readonly InsuranceClaimRecord[]>;
  createClaim(input: NewInsuranceClaim): Promise<InsuranceClaimRecord>;
  updateClaimStatus(id: string, status: ClaimStatus, externalClaimId?: string): Promise<InsuranceClaimRecord>;
  
  addEvidence(input: NewInsuranceClaimEvidence): Promise<InsuranceClaimEvidenceRecord>;
  findEvidenceByIdempotencyKey(idempotencyKey: string): Promise<InsuranceClaimEvidenceRecord | null>;
  getClaimEvidence(claimId: string): Promise<readonly InsuranceClaimEvidenceRecord[]>;
}
