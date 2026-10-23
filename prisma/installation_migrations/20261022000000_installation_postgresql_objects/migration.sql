-- Versioned installation-only PostgreSQL objects. Legacy migration bytes stay immutable.

-- Functions: authoritative 20260724131703 amendment (including FK-nullification exceptions).

CREATE OR REPLACE FUNCTION require_incident_case_assignment_target()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reason IN ('ASSIGNED', 'REASSIGNED') AND NEW.assigned_to_user_id IS NULL THEN
        RAISE EXCEPTION 'ASSIGNED and REASSIGNED history entries require an assignment target.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION prevent_incident_case_mutation()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF TG_TABLE_NAME = 'IncidentCaseHistory' THEN
            IF (
                NEW.id = OLD.id
                AND NEW.incident_case_id = OLD.incident_case_id
                AND NEW.previous_status IS NOT DISTINCT FROM OLD.previous_status
                AND NEW.new_status = OLD.new_status
                AND NEW.reason = OLD.reason
                AND NEW.reason_note IS NOT DISTINCT FROM OLD.reason_note
                AND NEW.occurred_at = OLD.occurred_at
                AND NEW.idempotency_key = OLD.idempotency_key
                AND (
                    NEW.actor_user_id IS NOT DISTINCT FROM OLD.actor_user_id
                    OR (NEW.actor_user_id IS NULL AND OLD.actor_user_id IS NOT NULL)
                )
                AND (
                    NEW.assigned_to_user_id IS NOT DISTINCT FROM OLD.assigned_to_user_id
                    OR (NEW.assigned_to_user_id IS NULL AND OLD.assigned_to_user_id IS NOT NULL)
                )
                AND (
                    NEW.actor_user_id IS DISTINCT FROM OLD.actor_user_id
                    OR NEW.assigned_to_user_id IS DISTINCT FROM OLD.assigned_to_user_id
                )
            ) THEN
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

DROP TRIGGER IF EXISTS trigger_require_incident_case_assignment_target ON "IncidentCaseHistory";

CREATE TRIGGER trigger_require_incident_case_assignment_target
BEFORE INSERT ON "IncidentCaseHistory"
FOR EACH ROW EXECUTE FUNCTION require_incident_case_assignment_target();

DROP TRIGGER IF EXISTS trigger_prevent_update_delete_history ON "IncidentCaseHistory";

CREATE TRIGGER trigger_prevent_update_delete_history
BEFORE UPDATE OR DELETE ON "IncidentCaseHistory"
FOR EACH ROW EXECUTE FUNCTION prevent_incident_case_mutation();

DROP TRIGGER IF EXISTS trigger_prevent_update_delete_note ON "IncidentCaseNote";

CREATE TRIGGER trigger_prevent_update_delete_note
BEFORE UPDATE OR DELETE ON "IncidentCaseNote"
FOR EACH ROW EXECUTE FUNCTION prevent_incident_case_mutation();

DROP TRIGGER IF EXISTS trigger_prevent_update_delete_evidence ON "IncidentCaseEvidence";

CREATE TRIGGER trigger_prevent_update_delete_evidence
BEFORE UPDATE OR DELETE ON "IncidentCaseEvidence"
FOR EACH ROW EXECUTE FUNCTION prevent_incident_case_mutation();

-- Authoritative ACTIVE-only uniqueness from 20260716032811.

CREATE UNIQUE INDEX "DetectionRule_rule_id_active_idx" ON "DetectionRule" ("rule_id") WHERE "status" = 'ACTIVE';
