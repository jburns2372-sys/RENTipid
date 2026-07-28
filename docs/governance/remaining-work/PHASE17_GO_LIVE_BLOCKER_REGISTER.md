# PHASE 17 Go-Live Blocker Register

| Blocker ID | Description | Remediation | Status |
|---|---|---|---|
| BLK-17-001 | Missing dedicated production read-only credential | Provision an expiring read-only credential for the DBA-confirmed logical database on Azure PostgreSQL server `rentipid-postgres-db` through an approved secret path. | UNRESOLVED |
| BLK-17-002 | Logical database and schema not confirmed | DBA must identify the production logical database and schema without exposing connection details. | UNRESOLVED |
| BLK-17-003 | Authorized network path not confirmed | DBA and Security Administrator must approve the audit runner and its network route to the Azure server. | UNRESOLVED |
| BLK-17-004 | Azure restore evidence not confirmed | DBA must confirm current backup/restore capability and provide sanitized evidence. | UNRESOLVED |
| BLK-17-005 | Owner connection authorization not signed | Owner must sign the PHASE 17 authorization form after the preceding controls are satisfied. | UNRESOLVED |
