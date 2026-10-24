import { Prisma, type PrismaClient } from "@prisma/client";
import type {
  InsuranceClaimRepository,
  NewInsuranceClaim,
  NewInsuranceClaimEvidence,
} from "./repository";
import type { InsuranceClaimRecord, InsuranceClaimEvidenceRecord } from "./types";
import { InsuranceClaimError } from "./types";

function claimFromRow(row: any): InsuranceClaimRecord {
  return {
    id: row.id,
    policyId: row.policy_id,
    externalClaimId: row.external_claim_id ?? undefined,
    idempotencyKey: row.idempotency_key,
    status: row.status,
    incidentType: row.incident_type,
    incidentAt: row.incident_at,
    incidentSummary: row.incident_summary ?? undefined,
    claimantUserId: row.claimant_user_id ?? undefined,
    claimedAmountMinor: row.claimed_amount ?? undefined,
    currency: row.currency ?? undefined,
    normalizedSnapshot: row.normalized_snapshot ?? undefined,
    submittedAt: row.submitted_at,
    resolvedAt: row.resolved_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function evidenceFromRow(row: any): InsuranceClaimEvidenceRecord {
  return {
    id: row.id,
    claimId: row.claim_id,
    evidenceType: row.evidence_type,
    fileReference: row.file_reference,
    mimeType: row.mime_type ?? undefined,
    sizeBytes: row.size_bytes ?? undefined,
    uploadedBy: row.uploaded_by,
    idempotencyKey: row.idempotency_key,
    partnerTransfer: row.partner_transfer,
    createdAt: row.created_at,
  };
}

export class PrismaInsuranceClaimRepository implements InsuranceClaimRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findClaimById(id: string) {
    const row = await this.prisma.insuranceClaim.findUnique({ where: { id } });
    return row ? claimFromRow(row) : null;
  }

  async findClaimByExternalId(externalClaimId: string) {
    const row = await this.prisma.insuranceClaim.findFirst({
      where: { external_claim_id: externalClaimId },
    });
    return row ? claimFromRow(row) : null;
  }

  async findClaimByIdempotencyKey(idempotencyKey: string) {
    const row = await this.prisma.insuranceClaim.findUnique({
      where: { idempotency_key: idempotencyKey },
    });
    return row ? claimFromRow(row) : null;
  }

  async findClaimsByPolicyId(policyId: string) {
    const rows = await this.prisma.insuranceClaim.findMany({
      where: { policy_id: policyId },
      orderBy: { created_at: "desc" },
    });
    return rows.map(claimFromRow);
  }

  async createClaim(input: NewInsuranceClaim) {
    try {
      const row = await this.prisma.insuranceClaim.create({
        data: {
          policy_id: input.policyId,
          external_claim_id: input.externalClaimId,
          idempotency_key: input.idempotencyKey,
          status: input.status,
          incident_type: input.incidentType,
          incident_at: input.incidentAt,
          incident_summary: input.incidentSummary,
          claimant_user_id: input.claimantUserId,
          claimed_amount: input.claimedAmountMinor,
          currency: input.currency,
          normalized_snapshot: input.normalizedSnapshot
            ? (input.normalizedSnapshot as any)
            : Prisma.JsonNull,
        },
      });
      return claimFromRow(row);
    } catch (error) {
      if (this.isUniqueConflict(error)) {
        const existing = await this.findClaimByIdempotencyKey(input.idempotencyKey);
        if (existing) {
          if (
            existing.policyId !== input.policyId ||
            existing.incidentType !== input.incidentType ||
            existing.incidentAt.getTime() !== input.incidentAt.getTime() ||
            existing.claimedAmountMinor !== input.claimedAmountMinor
          ) {
            throw new InsuranceClaimError(
              "IDEMPOTENCY_CONFLICT",
              "Conflicting insurance claim replay rejected.",
            );
          }
          return existing;
        }
      }
      throw error;
    }
  }

  async updateClaimStatus(id: string, status: any, externalClaimId?: string) {
    const row = await this.prisma.insuranceClaim.update({
      where: { id },
      data: {
        status,
        external_claim_id: externalClaimId,
        resolved_at: ["CLOSED", "CANCELLED", "FAILED", "PAID", "DENIED"].includes(status)
          ? new Date()
          : undefined,
      },
    });
    return claimFromRow(row);
  }

  async addEvidence(input: NewInsuranceClaimEvidence) {
    try {
      const row = await this.prisma.insuranceClaimEvidence.create({
        data: {
          claim_id: input.claimId,
          evidence_type: input.evidenceType,
          file_reference: input.fileReference,
          mime_type: input.mimeType,
          size_bytes: input.sizeBytes,
          uploaded_by: input.uploadedBy,
          idempotency_key: input.idempotencyKey,
          partner_transfer: input.partnerTransfer ?? "PENDING",
        },
      });
      return evidenceFromRow(row);
    } catch (error) {
      if (this.isUniqueConflict(error)) {
        const existing = await this.findEvidenceByIdempotencyKey(input.idempotencyKey);
        if (existing) {
          if (
            existing.fileReference !== input.fileReference ||
            existing.claimId !== input.claimId
          ) {
            throw new InsuranceClaimError(
              "IDEMPOTENCY_CONFLICT",
              "Conflicting insurance evidence replay rejected.",
            );
          }
          return existing;
        }
      }
      throw error;
    }
  }

  async findEvidenceByIdempotencyKey(idempotencyKey: string) {
    const row = await this.prisma.insuranceClaimEvidence.findUnique({
      where: { idempotency_key: idempotencyKey },
    });
    return row ? evidenceFromRow(row) : null;
  }

  async getClaimEvidence(claimId: string) {
    const rows = await this.prisma.insuranceClaimEvidence.findMany({
      where: { claim_id: claimId },
      orderBy: { created_at: "asc" },
    });
    return rows.map(evidenceFromRow);
  }

  private isUniqueConflict(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    );
  }
}
