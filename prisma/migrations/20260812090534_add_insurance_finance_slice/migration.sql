-- AlterTable
ALTER TABLE "FinanceLedger" ADD COLUMN     "amount_minor" INTEGER,
ADD COLUMN     "audit_reference" TEXT,
ADD COLUMN     "currency" TEXT,
ADD COLUMN     "idempotency_key" TEXT,
ADD COLUMN     "policy_id" TEXT,
ADD COLUMN     "source_reference" TEXT;

-- CreateTable
CREATE TABLE "InsuranceReconciliationLog" (
    "id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "policy_id" TEXT,
    "order_reference" TEXT,
    "batch_reference" TEXT,
    "internal_amount_minor" INTEGER,
    "partner_amount_minor" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'PHP',
    "settlement_reference" TEXT,
    "classification" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "resolution_reference" TEXT,
    "audit_reference" TEXT,

    CONSTRAINT "InsuranceReconciliationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceFinanceException" (
    "id" TEXT NOT NULL,
    "policy_id" TEXT,
    "order_reference" TEXT,
    "exception_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "context" JSONB,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "resolution_notes" TEXT,
    "resolved_by_user_id" TEXT,

    CONSTRAINT "InsuranceFinanceException_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InsuranceReconciliationLog_partner_id_idx" ON "InsuranceReconciliationLog"("partner_id");

-- CreateIndex
CREATE INDEX "InsuranceReconciliationLog_batch_reference_idx" ON "InsuranceReconciliationLog"("batch_reference");

-- CreateIndex
CREATE INDEX "InsuranceReconciliationLog_classification_idx" ON "InsuranceReconciliationLog"("classification");

-- CreateIndex
CREATE INDEX "InsuranceFinanceException_status_idx" ON "InsuranceFinanceException"("status");

-- CreateIndex
CREATE INDEX "InsuranceFinanceException_exception_type_idx" ON "InsuranceFinanceException"("exception_type");

-- AddForeignKey
ALTER TABLE "FinanceLedger" ADD CONSTRAINT "FinanceLedger_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "InsurancePolicy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceReconciliationLog" ADD CONSTRAINT "InsuranceReconciliationLog_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "InsurancePartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceReconciliationLog" ADD CONSTRAINT "InsuranceReconciliationLog_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "InsurancePolicy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceFinanceException" ADD CONSTRAINT "InsuranceFinanceException_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "InsurancePolicy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "FinanceLedger_idempotency_key_key" ON "FinanceLedger"("idempotency_key");
