-- AlterTable
ALTER TABLE "InsuranceClaim" ADD COLUMN     "claimant_user_id" TEXT,
ADD COLUMN     "claimed_amount" INTEGER,
ADD COLUMN     "currency" TEXT;

-- CreateTable
CREATE TABLE "InsuranceClaimEvidence" (
    "id" TEXT NOT NULL,
    "claim_id" TEXT NOT NULL,
    "evidence_type" TEXT NOT NULL,
    "file_reference" TEXT NOT NULL,
    "mime_type" TEXT,
    "size_bytes" INTEGER,
    "uploaded_by" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "partner_transfer" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InsuranceClaimEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceClaimEvidence_idempotency_key_key" ON "InsuranceClaimEvidence"("idempotency_key");

-- CreateIndex
CREATE INDEX "InsuranceClaimEvidence_claim_id_idx" ON "InsuranceClaimEvidence"("claim_id");

-- CreateIndex
CREATE INDEX "InsuranceClaim_claimant_user_id_idx" ON "InsuranceClaim"("claimant_user_id");

-- AddForeignKey
ALTER TABLE "InsuranceClaimEvidence" ADD CONSTRAINT "InsuranceClaimEvidence_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "InsuranceClaim"("id") ON DELETE CASCADE ON UPDATE CASCADE;


