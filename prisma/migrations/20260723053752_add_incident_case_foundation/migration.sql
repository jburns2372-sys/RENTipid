-- CreateEnum
CREATE TYPE "IncidentCaseStatus" AS ENUM ('OPEN', 'TRIAGED', 'INVESTIGATING', 'CONTAINMENT_PENDING', 'RESOLVED', 'CLOSED', 'REOPENED');

-- CreateEnum
CREATE TYPE "IncidentCaseSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "IncidentCaseOrigin" AS ENUM ('MANUAL', 'SECURITY_EVENT', 'SECURITY_ALERT', 'EXTERNAL_PROVIDER', 'ADMIN_ESCALATION');

-- CreateEnum
CREATE TYPE "IncidentCaseHistoryReason" AS ENUM ('CREATED', 'TRIAGED', 'ASSIGNED', 'REASSIGNED', 'INVESTIGATION_STARTED', 'CONTAINMENT_REQUESTED', 'RESOLVED', 'CLOSED', 'REOPENED', 'ESCALATED', 'CORRECTION_RECORDED');

-- CreateEnum
CREATE TYPE "IncidentCaseNoteType" AS ENUM ('TRIAGE', 'INVESTIGATION', 'EVIDENCE_REVIEW', 'ESCALATION', 'RESOLUTION', 'CLOSURE', 'REOPENING', 'INTERNAL');

-- CreateEnum
CREATE TYPE "IncidentCaseEvidenceType" AS ENUM ('SECURITY_EVENT', 'AUDIT_LOG', 'SYSTEM_LOG', 'PROVIDER_EVENT', 'TRANSACTION_REFERENCE', 'DOCUMENT_REFERENCE', 'IMAGE_REFERENCE', 'USER_STATEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "IncidentCaseEvidenceSource" AS ENUM ('INTERNAL_SYSTEM', 'EXTERNAL_PROVIDER', 'USER_SUBMITTED', 'ADMINISTRATIVE');

-- CreateTable
CREATE TABLE "IncidentCase" (
    "id" TEXT NOT NULL,
    "case_reference" TEXT NOT NULL,
    "status" "IncidentCaseStatus" NOT NULL DEFAULT 'OPEN',
    "severity" "IncidentCaseSeverity" NOT NULL,
    "origin" "IncidentCaseOrigin" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "opened_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "reopened_at" TIMESTAMP(3),
    "assigned_user_id" TEXT,
    "created_by_user_id" TEXT,
    "originating_security_event_id" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "legal_hold" BOOLEAN NOT NULL DEFAULT false,
    "retention_until" TIMESTAMP(3),

    CONSTRAINT "IncidentCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentCaseHistory" (
    "id" TEXT NOT NULL,
    "incident_case_id" TEXT NOT NULL,
    "previous_status" "IncidentCaseStatus",
    "new_status" "IncidentCaseStatus" NOT NULL,
    "reason" "IncidentCaseHistoryReason" NOT NULL,
    "reason_note" TEXT,
    "actor_user_id" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "idempotency_key" TEXT NOT NULL,

    CONSTRAINT "IncidentCaseHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentCaseNote" (
    "id" TEXT NOT NULL,
    "incident_case_id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "note_type" "IncidentCaseNoteType" NOT NULL,
    "content" TEXT NOT NULL,
    "content_hash" TEXT NOT NULL,
    "is_redacted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idempotency_key" TEXT NOT NULL,

    CONSTRAINT "IncidentCaseNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentCaseEvidence" (
    "id" TEXT NOT NULL,
    "incident_case_id" TEXT NOT NULL,
    "evidence_type" "IncidentCaseEvidenceType" NOT NULL,
    "source_classification" "IncidentCaseEvidenceSource" NOT NULL,
    "added_by_user_id" TEXT,
    "collected_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference_key" TEXT NOT NULL,
    "integrity_hash" TEXT NOT NULL,
    "content_type" TEXT,
    "size_bytes" INTEGER,
    "idempotency_key" TEXT NOT NULL,
    "legal_hold" BOOLEAN NOT NULL DEFAULT false,
    "retention_until" TIMESTAMP(3),

    CONSTRAINT "IncidentCaseEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IncidentCase_case_reference_key" ON "IncidentCase"("case_reference");

-- CreateIndex
CREATE INDEX "IncidentCaseHistory_incident_case_id_occurred_at_id_idx" ON "IncidentCaseHistory"("incident_case_id", "occurred_at", "id");

-- CreateIndex
CREATE UNIQUE INDEX "IncidentCaseHistory_incident_case_id_idempotency_key_key" ON "IncidentCaseHistory"("incident_case_id", "idempotency_key");

-- CreateIndex
CREATE INDEX "IncidentCaseNote_incident_case_id_created_at_id_idx" ON "IncidentCaseNote"("incident_case_id", "created_at", "id");

-- CreateIndex
CREATE UNIQUE INDEX "IncidentCaseNote_incident_case_id_idempotency_key_key" ON "IncidentCaseNote"("incident_case_id", "idempotency_key");

-- CreateIndex
CREATE INDEX "IncidentCaseEvidence_incident_case_id_collected_at_id_idx" ON "IncidentCaseEvidence"("incident_case_id", "collected_at", "id");

-- CreateIndex
CREATE UNIQUE INDEX "IncidentCaseEvidence_incident_case_id_idempotency_key_key" ON "IncidentCaseEvidence"("incident_case_id", "idempotency_key");

-- AddForeignKey
ALTER TABLE "IncidentCase" ADD CONSTRAINT "IncidentCase_assigned_user_id_fkey" FOREIGN KEY ("assigned_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentCase" ADD CONSTRAINT "IncidentCase_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentCase" ADD CONSTRAINT "IncidentCase_originating_security_event_id_fkey" FOREIGN KEY ("originating_security_event_id") REFERENCES "SecurityEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentCaseHistory" ADD CONSTRAINT "IncidentCaseHistory_incident_case_id_fkey" FOREIGN KEY ("incident_case_id") REFERENCES "IncidentCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentCaseHistory" ADD CONSTRAINT "IncidentCaseHistory_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentCaseNote" ADD CONSTRAINT "IncidentCaseNote_incident_case_id_fkey" FOREIGN KEY ("incident_case_id") REFERENCES "IncidentCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentCaseNote" ADD CONSTRAINT "IncidentCaseNote_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentCaseEvidence" ADD CONSTRAINT "IncidentCaseEvidence_incident_case_id_fkey" FOREIGN KEY ("incident_case_id") REFERENCES "IncidentCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentCaseEvidence" ADD CONSTRAINT "IncidentCaseEvidence_added_by_user_id_fkey" FOREIGN KEY ("added_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Check Constraints for IncidentCase
ALTER TABLE "IncidentCase"
  ADD CONSTRAINT "chk_incidentcase_reference" CHECK ("case_reference" ~ '^INC-[0-9]{8}-[A-Z0-9]{8}$'),
  ADD CONSTRAINT "chk_incidentcase_title" CHECK (length("title") > 0 AND length("title") <= 160),
  ADD CONSTRAINT "chk_incidentcase_summary" CHECK ("summary" IS NULL OR length("summary") <= 2000),
  ADD CONSTRAINT "chk_incidentcase_version" CHECK ("version" >= 1),
  ADD CONSTRAINT "chk_incidentcase_resolved_at" CHECK ("resolved_at" IS NULL OR "resolved_at" >= "opened_at"),
  ADD CONSTRAINT "chk_incidentcase_closed_at_req" CHECK ("closed_at" IS NULL OR "resolved_at" IS NOT NULL),
  ADD CONSTRAINT "chk_incidentcase_closed_at" CHECK ("closed_at" IS NULL OR "closed_at" >= "resolved_at"),
  ADD CONSTRAINT "chk_incidentcase_reopened_at_req" CHECK ("reopened_at" IS NULL OR "closed_at" IS NOT NULL),
  ADD CONSTRAINT "chk_incidentcase_reopened_at" CHECK ("reopened_at" IS NULL OR "reopened_at" >= "closed_at"),
  ADD CONSTRAINT "chk_incidentcase_status_resolved" CHECK ("status" != 'RESOLVED' OR "resolved_at" IS NOT NULL),
  ADD CONSTRAINT "chk_incidentcase_status_closed" CHECK ("status" != 'CLOSED' OR ("resolved_at" IS NOT NULL AND "closed_at" IS NOT NULL)),
  ADD CONSTRAINT "chk_incidentcase_status_reopened" CHECK ("status" != 'REOPENED' OR "reopened_at" IS NOT NULL);

-- Check Constraints for IncidentCaseHistory
ALTER TABLE "IncidentCaseHistory"
  ADD CONSTRAINT "chk_incidentcasehistory_idempotency" CHECK (length("idempotency_key") > 0),
  ADD CONSTRAINT "chk_incidentcasehistory_reason_logic" CHECK (
    ("reason" = 'CREATED' AND "previous_status" IS NULL) OR 
    ("reason" != 'CREATED' AND "previous_status" IS NOT NULL)
  ),
  ADD CONSTRAINT "chk_incidentcasehistory_status_change" CHECK (
    "previous_status" IS NULL OR "previous_status" != "new_status"
  ),
  ADD CONSTRAINT "chk_incidentcasehistory_note_len" CHECK ("reason_note" IS NULL OR length("reason_note") <= 1000);

-- Check Constraints for IncidentCaseNote
ALTER TABLE "IncidentCaseNote"
  ADD CONSTRAINT "chk_incidentcasenote_content" CHECK (length("content") > 0 AND length("content") <= 4000),
  ADD CONSTRAINT "chk_incidentcasenote_hash" CHECK ("content_hash" ~ '^[0-9a-fA-F]{64}$'),
  ADD CONSTRAINT "chk_incidentcasenote_idempotency" CHECK (length("idempotency_key") > 0);

-- Check Constraints for IncidentCaseEvidence
ALTER TABLE "IncidentCaseEvidence"
  ADD CONSTRAINT "chk_incidentcaseevidence_reference" CHECK (length("reference_key") > 0 AND length("reference_key") <= 256),
  ADD CONSTRAINT "chk_incidentcaseevidence_hash" CHECK ("integrity_hash" ~ '^[0-9a-fA-F]{64}$'),
  ADD CONSTRAINT "chk_incidentcaseevidence_content_type" CHECK ("content_type" IS NULL OR length("content_type") <= 120),
  ADD CONSTRAINT "chk_incidentcaseevidence_size" CHECK ("size_bytes" IS NULL OR "size_bytes" >= 0),
  ADD CONSTRAINT "chk_incidentcaseevidence_idempotency" CHECK (length("idempotency_key") > 0);

-- Append-Only Trigger Function
CREATE OR REPLACE FUNCTION prevent_incident_case_mutation()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF (TG_TABLE_NAME = 'IncidentCaseHistory' AND NEW.actor_user_id IS NULL AND OLD.actor_user_id IS NOT NULL) THEN
            IF (NEW.id = OLD.id AND NEW.incident_case_id = OLD.incident_case_id AND NEW.previous_status IS NOT DISTINCT FROM OLD.previous_status AND NEW.new_status = OLD.new_status AND NEW.reason = OLD.reason AND NEW.reason_note IS NOT DISTINCT FROM OLD.reason_note AND NEW.occurred_at = OLD.occurred_at AND NEW.idempotency_key = OLD.idempotency_key) THEN
                RETURN NEW;
            END IF;
        END IF;
        IF (TG_TABLE_NAME = 'IncidentCaseNote' AND NEW.actor_user_id IS NULL AND OLD.actor_user_id IS NOT NULL) THEN
            IF (NEW.id = OLD.id AND NEW.incident_case_id = OLD.incident_case_id AND NEW.note_type = OLD.note_type AND NEW.content = OLD.content AND NEW.content_hash = OLD.content_hash AND NEW.is_redacted = OLD.is_redacted AND NEW.created_at = OLD.created_at AND NEW.idempotency_key = OLD.idempotency_key) THEN
                RETURN NEW;
            END IF;
        END IF;
        IF (TG_TABLE_NAME = 'IncidentCaseEvidence' AND NEW.added_by_user_id IS NULL AND OLD.added_by_user_id IS NOT NULL) THEN
            IF (NEW.id = OLD.id AND NEW.incident_case_id = OLD.incident_case_id AND NEW.evidence_type = OLD.evidence_type AND NEW.source_classification = OLD.source_classification AND NEW.collected_at = OLD.collected_at AND NEW.created_at = OLD.created_at AND NEW.reference_key = OLD.reference_key AND NEW.integrity_hash = OLD.integrity_hash AND NEW.content_type IS NOT DISTINCT FROM OLD.content_type AND NEW.size_bytes IS NOT DISTINCT FROM OLD.size_bytes AND NEW.idempotency_key = OLD.idempotency_key AND NEW.legal_hold = OLD.legal_hold AND NEW.retention_until IS NOT DISTINCT FROM OLD.retention_until) THEN
                RETURN NEW;
            END IF;
        END IF;
    END IF;
    RAISE EXCEPTION 'Updates and deletions are strictly prohibited for forensic SOC tables.';
END;
$$ LANGUAGE plpgsql;

-- Apply Triggers
CREATE TRIGGER trigger_prevent_update_delete_history
BEFORE UPDATE OR DELETE ON "IncidentCaseHistory"
FOR EACH ROW EXECUTE FUNCTION prevent_incident_case_mutation();

CREATE TRIGGER trigger_prevent_update_delete_note
BEFORE UPDATE OR DELETE ON "IncidentCaseNote"
FOR EACH ROW EXECUTE FUNCTION prevent_incident_case_mutation();

CREATE TRIGGER trigger_prevent_update_delete_evidence
BEFORE UPDATE OR DELETE ON "IncidentCaseEvidence"
FOR EACH ROW EXECUTE FUNCTION prevent_incident_case_mutation();

