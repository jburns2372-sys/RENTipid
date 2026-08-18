-- Reconcile the incident-case reopen timestamp contract with the approved
-- RESOLVED -> REOPENED and CLOSED -> REOPENED lifecycle transitions.
ALTER TABLE "IncidentCase"
  DROP CONSTRAINT "chk_incidentcase_reopened_at_req",
  DROP CONSTRAINT "chk_incidentcase_reopened_at";

ALTER TABLE "IncidentCase"
  ADD CONSTRAINT "chk_incidentcase_reopened_at_req" CHECK (
    "reopened_at" IS NULL OR "resolved_at" IS NOT NULL
  ),
  ADD CONSTRAINT "chk_incidentcase_reopened_at" CHECK (
    "reopened_at" IS NULL
    OR (
      "closed_at" IS NOT NULL
      AND "reopened_at" >= "closed_at"
    )
    OR (
      "closed_at" IS NULL
      AND "resolved_at" IS NOT NULL
      AND "reopened_at" >= "resolved_at"
    )
  );
