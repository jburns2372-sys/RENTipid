# GATE 4F SLICE C1 CASE FOUNDATION EVIDENCE

## IMPLEMENTED FOUNDATION

- **Approved Enums**: `IncidentCaseStatus`, `IncidentCaseSeverity`, `IncidentCaseOrigin`, `IncidentCaseHistoryReason`, `IncidentCaseNoteType`, `IncidentCaseEvidenceType`, `IncidentCaseEvidenceSource` have been created exactly as approved.
- **Models and Relations**: 
  - `IncidentCase` acts as the root record, with a nullable, Restrict-constrained relation to `SecurityEvent` to ensure no destructive cascading.
  - `IncidentCaseHistory`, `IncidentCaseNote`, `IncidentCaseEvidence` are linked with Restrict constraints and include idempotency keys for composite uniqueness.
- **Database Constraints**:
  - Timestamp logic ensures chronological flow (`resolved_at >= opened_at`, etc.).
  - Maximum lengths and formats are rigidly enforced (e.g., `case_reference` regex `^INC-[0-9]{8}-[A-Z0-9]{8}$`, exact 64 hex hashes).
  - Reason logic prevents duplicate states or invalid `CREATED` histories.
- **Append-only Trigger Behavior**:
  - `prevent_incident_case_mutation()` PostgreSQL trigger is attached to History, Note, and Evidence tables.
  - It categorically rejects `UPDATE` and `DELETE`, with the narrow exception of allowing PostgreSQL `SetNull` actions triggered by user deletions (without altering any actual forensic content).
- **Privacy Restrictions**:
  - No raw payloads, external URLs, tokens, or credentials can be stored. Length constraints prevent unbounded narratives.
- **Retention/Legal-hold Foundation**:
  - `legal_hold` (Boolean) and `retention_until` (DateTime) fields exist on both the case root and evidence items, pending future policy execution workflows.

## TEST RESULTS
- A targeted test suite verified exactly 24 behaviors over 12 comprehensive tests. 
- All database guard conditions successfully ran in isolation against `rentipid_test_soc`. 
- Tests achieved 100% PASS rate. 

## DEFERRED SCOPE
The following remain expressly deferred and were not implemented in this slice:
- Case writers and automatic responders
- Role-based Access Control (RBAC), UI, and API endpoints
- SOC Analyst and SOC Supervisor roles
- Playbook automation and approval mechanisms
