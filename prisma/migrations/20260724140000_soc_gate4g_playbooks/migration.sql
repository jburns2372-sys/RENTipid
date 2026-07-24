-- CreateEnum
CREATE TYPE "SecurityPlaybookStatus" AS ENUM ('DRAFT', 'REVIEW_PENDING', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SecurityResponseActionType" AS ENUM ('ACCOUNT_RESTRICTION', 'PAYMENT_FREEZE', 'BOOKING_FREEZE', 'SESSION_REVOCATION', 'CREDENTIAL_ROTATION', 'INFRASTRUCTURE_ENFORCEMENT', 'MANUAL_PROCEDURE');

-- CreateEnum
CREATE TYPE "SecurityResponseReversibility" AS ENUM ('REVERSIBLE', 'IRREVERSIBLE', 'MANUAL_INTERVENTION_REQUIRED');

-- CreateEnum
CREATE TYPE "SecurityApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'REVOKED', 'CONSUMED');

-- CreateEnum
CREATE TYPE "SecurityApprovalEventType" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'REVOKED', 'CONSUMED');

-- CreateEnum
CREATE TYPE "SecurityApprovalGrantState" AS ENUM ('AVAILABLE', 'CONSUMED', 'REVOKED', 'EXPIRED');

-- CreateTable
CREATE TABLE "SecurityResponsePlaybook" (
    "id" TEXT NOT NULL,
    "playbook_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "SecurityPlaybookStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by_id" TEXT,
    "approved_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityResponsePlaybook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityResponseStep" (
    "id" TEXT NOT NULL,
    "playbook_id" TEXT NOT NULL,
    "playbook_version" INTEGER NOT NULL,
    "step_order" INTEGER NOT NULL,
    "action_type" "SecurityResponseActionType" NOT NULL,
    "human_instruction" TEXT NOT NULL,
    "expected_evidence" TEXT,
    "reversibility" "SecurityResponseReversibility" NOT NULL,
    "duration_seconds" INTEGER,
    "risk_level" "SecuritySeverity" NOT NULL,
    "approval_required" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SecurityResponseStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentCasePlaybookLink" (
    "id" TEXT NOT NULL,
    "incident_case_id" TEXT NOT NULL,
    "playbook_id" TEXT NOT NULL,
    "playbook_version" INTEGER NOT NULL,
    "linked_by_id" TEXT,
    "linked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentCasePlaybookLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityResponseApprovalRequest" (
    "id" TEXT NOT NULL,
    "requester_id" TEXT NOT NULL,
    "approver_id" TEXT,
    "incident_case_id" TEXT NOT NULL,
    "playbook_id" TEXT NOT NULL,
    "playbook_version" INTEGER NOT NULL,
    "status" "SecurityApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "justification" TEXT NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decision_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "idempotency_key" TEXT NOT NULL,

    CONSTRAINT "SecurityResponseApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityResponseApprovalDecision" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "event_type" "SecurityApprovalEventType" NOT NULL,
    "actor_id" TEXT,
    "reason" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idempotency_key" TEXT NOT NULL,

    CONSTRAINT "SecurityResponseApprovalDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityResponseApprovalGrant" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "incident_case_id" TEXT NOT NULL,
    "playbook_id" TEXT NOT NULL,
    "playbook_version" INTEGER NOT NULL,
    "grant_state" "SecurityApprovalGrantState" NOT NULL DEFAULT 'AVAILABLE',
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "revoked_by_id" TEXT,

    CONSTRAINT "SecurityResponseApprovalGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SecurityResponsePlaybook_status_idx" ON "SecurityResponsePlaybook"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityResponsePlaybook_playbook_id_version_key" ON "SecurityResponsePlaybook"("playbook_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityResponseStep_playbook_id_playbook_version_step_orde_key" ON "SecurityResponseStep"("playbook_id", "playbook_version", "step_order");

-- CreateIndex
CREATE UNIQUE INDEX "IncidentCasePlaybookLink_incident_case_id_playbook_id_playb_key" ON "IncidentCasePlaybookLink"("incident_case_id", "playbook_id", "playbook_version");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityResponseApprovalRequest_idempotency_key_key" ON "SecurityResponseApprovalRequest"("idempotency_key");

-- CreateIndex
CREATE INDEX "SecurityResponseApprovalRequest_incident_case_id_idx" ON "SecurityResponseApprovalRequest"("incident_case_id");

-- CreateIndex
CREATE INDEX "SecurityResponseApprovalRequest_status_idx" ON "SecurityResponseApprovalRequest"("status");

-- CreateIndex
CREATE INDEX "SecurityResponseApprovalDecision_request_id_occurred_at_idx" ON "SecurityResponseApprovalDecision"("request_id", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityResponseApprovalDecision_request_id_idempotency_key_key" ON "SecurityResponseApprovalDecision"("request_id", "idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityResponseApprovalGrant_request_id_key" ON "SecurityResponseApprovalGrant"("request_id");

-- CreateIndex
CREATE INDEX "SecurityResponseApprovalGrant_incident_case_id_idx" ON "SecurityResponseApprovalGrant"("incident_case_id");

-- CreateIndex
CREATE INDEX "SecurityResponseApprovalGrant_grant_state_expires_at_idx" ON "SecurityResponseApprovalGrant"("grant_state", "expires_at");

-- AddForeignKey
ALTER TABLE "SecurityResponsePlaybook" ADD CONSTRAINT "SecurityResponsePlaybook_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityResponsePlaybook" ADD CONSTRAINT "SecurityResponsePlaybook_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityResponseStep" ADD CONSTRAINT "SecurityResponseStep_playbook_id_playbook_version_fkey" FOREIGN KEY ("playbook_id", "playbook_version") REFERENCES "SecurityResponsePlaybook"("playbook_id", "version") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentCasePlaybookLink" ADD CONSTRAINT "IncidentCasePlaybookLink_incident_case_id_fkey" FOREIGN KEY ("incident_case_id") REFERENCES "IncidentCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentCasePlaybookLink" ADD CONSTRAINT "IncidentCasePlaybookLink_playbook_id_playbook_version_fkey" FOREIGN KEY ("playbook_id", "playbook_version") REFERENCES "SecurityResponsePlaybook"("playbook_id", "version") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentCasePlaybookLink" ADD CONSTRAINT "IncidentCasePlaybookLink_linked_by_id_fkey" FOREIGN KEY ("linked_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityResponseApprovalRequest" ADD CONSTRAINT "SecurityResponseApprovalRequest_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityResponseApprovalRequest" ADD CONSTRAINT "SecurityResponseApprovalRequest_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityResponseApprovalRequest" ADD CONSTRAINT "SecurityResponseApprovalRequest_incident_case_id_fkey" FOREIGN KEY ("incident_case_id") REFERENCES "IncidentCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityResponseApprovalRequest" ADD CONSTRAINT "SecurityResponseApprovalRequest_playbook_id_playbook_versi_fkey" FOREIGN KEY ("playbook_id", "playbook_version") REFERENCES "SecurityResponsePlaybook"("playbook_id", "version") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityResponseApprovalDecision" ADD CONSTRAINT "SecurityResponseApprovalDecision_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "SecurityResponseApprovalRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityResponseApprovalDecision" ADD CONSTRAINT "SecurityResponseApprovalDecision_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityResponseApprovalGrant" ADD CONSTRAINT "SecurityResponseApprovalGrant_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "SecurityResponseApprovalRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityResponseApprovalGrant" ADD CONSTRAINT "SecurityResponseApprovalGrant_incident_case_id_fkey" FOREIGN KEY ("incident_case_id") REFERENCES "IncidentCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityResponseApprovalGrant" ADD CONSTRAINT "SecurityResponseApprovalGrant_revoked_by_id_fkey" FOREIGN KEY ("revoked_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

