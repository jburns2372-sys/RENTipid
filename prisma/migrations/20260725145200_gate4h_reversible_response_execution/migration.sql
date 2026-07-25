-- CreateEnum
CREATE TYPE "SecurityExecutionStatus" AS ENUM ('PENDING', 'EXECUTING', 'SUCCEEDED', 'FAILED', 'ROLLBACK_PENDING', 'ROLLED_BACK', 'ROLLBACK_FAILED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "SecurityResponseActionType" ADD VALUE 'NOOP_SIMULATION';

-- CreateTable
CREATE TABLE "SecurityResponseExecution" (
    "id" TEXT NOT NULL,
    "incident_case_id" TEXT NOT NULL,
    "playbook_id" TEXT NOT NULL,
    "playbook_version" INTEGER NOT NULL,
    "approval_request_id" TEXT NOT NULL,
    "approval_grant_id" TEXT NOT NULL,
    "response_type" "SecurityResponseActionType" NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "status" "SecurityExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "idempotency_key" TEXT NOT NULL,
    "requested_by_id" TEXT NOT NULL,
    "executed_by_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "rolled_back_at" TIMESTAMP(3),
    "failure_code" TEXT,
    "lock_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityResponseExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityResponseAction" (
    "id" TEXT NOT NULL,
    "execution_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "action_type" "SecurityResponseActionType" NOT NULL,
    "target_reference" TEXT NOT NULL,
    "before_state" TEXT,
    "after_state" TEXT,
    "status" "SecurityExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "executed_at" TIMESTAMP(3),
    "rolled_back_at" TIMESTAMP(3),
    "failure_metadata" TEXT,

    CONSTRAINT "SecurityResponseAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SecurityResponseExecution_approval_grant_id_key" ON "SecurityResponseExecution"("approval_grant_id");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityResponseExecution_idempotency_key_key" ON "SecurityResponseExecution"("idempotency_key");

-- CreateIndex
CREATE INDEX "SecurityResponseExecution_incident_case_id_idx" ON "SecurityResponseExecution"("incident_case_id");

-- CreateIndex
CREATE INDEX "SecurityResponseExecution_status_idx" ON "SecurityResponseExecution"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityResponseAction_execution_id_sequence_key" ON "SecurityResponseAction"("execution_id", "sequence");

-- AddForeignKey
ALTER TABLE "SecurityResponseExecution" ADD CONSTRAINT "SecurityResponseExecution_incident_case_id_fkey" FOREIGN KEY ("incident_case_id") REFERENCES "IncidentCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityResponseExecution" ADD CONSTRAINT "SecurityResponseExecution_playbook_id_playbook_version_fkey" FOREIGN KEY ("playbook_id", "playbook_version") REFERENCES "SecurityResponsePlaybook"("playbook_id", "version") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityResponseExecution" ADD CONSTRAINT "SecurityResponseExecution_approval_grant_id_fkey" FOREIGN KEY ("approval_grant_id") REFERENCES "SecurityResponseApprovalGrant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityResponseExecution" ADD CONSTRAINT "SecurityResponseExecution_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityResponseExecution" ADD CONSTRAINT "SecurityResponseExecution_executed_by_id_fkey" FOREIGN KEY ("executed_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityResponseAction" ADD CONSTRAINT "SecurityResponseAction_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "SecurityResponseExecution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

