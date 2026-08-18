# Purpose and Scope
- RENTipid SOC Phase 4 operational scope: Controlled threat response, automated playbook execution, and reversible response execution.
- Supported reversible responses: `ACCOUNT_RESTRICTION`, `NOOP_SIMULATION`.
- Actions intentionally not supported: Irreversible actions, payment movement, permanent account deletion, active external defense, arbitrary code execution.

# Roles and Permissions
- Viewer: Read-only access to incidents and responses (`SECURITY_INCIDENT_VIEW`, `RESPONSE_VIEW`).
- Analyst: Initial review and analysis, can recommend playbooks, approve/reject requests (`RESPONSE_APPROVE`, `RESPONSE_REJECT`).
- Supervisor: High-level authority for critical actions.
- Executor: Authorized to execute an approved grant (`RESPONSE_EXECUTE`).
- Rollback operator: Authorized to revert a response action (`RESPONSE_ROLLBACK`).
- Administrator: Controls platform configuration and can trigger Emergency Freeze (`SOC_ADMIN`).
Separation of duties ensures that `RESPONSE_VIEW`, `RESPONSE_EXECUTE`, and `RESPONSE_ROLLBACK` can be independently assigned, avoiding single-operator abuse.

# Standard Operating Workflow
- Incident review: Analyst examines incoming threat alerts.
- Playbook selection: Analyst matches the threat to a defined playbook.
- Approval request: Analyst submits a scoped approval request.
- Approval decision: An authorized approver (different from requester) approves or rejects.
- Grant issuance: A time-bound grant is issued upon approval.
- Execution: Executor consumes the grant to trigger the response.
- Monitoring: Execution progress and logs are monitored.
- Rollback: If required, a rollback operator restores the target state.
- Case closure: The incident is marked resolved and closed.

# Emergency Freeze
- When to activate: During widespread system compromise, unexpected downstream failures, or suspected SOC tooling breach.
- What it blocks: New playbook executions and grant consumptions.
- Why rollback remains available: To allow restoration of safe state for already restricted targets without requiring full unfreeze.
- How operators verify the state: Operators can view the sanitized, disabled UI state indicating freeze.
- Escalation procedure: Contact SOC Director to analyze risk before unfreezing.

# Failed Execution Procedure
- Preserve evidence: Do not alter logs or manually bypass the database.
- Review sanitized failure code: Check the UI or API response (e.g. `TARGET_NOT_FOUND`).
- Do not repeat with a new idempotency key without investigation.
- Determine rollback eligibility: Check if partial actions were completed safely.
- Escalate rollback failure: Report to Engineering if a rollback fails.
- Record operator notes: Update incident ticket with detailed findings.

# Divergence Procedure
- Do not overwrite legitimate later state: The system detects divergence and halts rollback to protect target data integrity.
- Escalate to authorized supervisor: Inform management of the divergent state.
- Preserve action and audit history: Leave the execution in a failed rollback state.
- Perform manual review: Manually reconcile the target's current state with business requirements.

# Maintenance Checklist
- Daily audit review: Ensure logs match expectations.
- Failed execution review: Investigate any execution stuck in FAILED.
- Expired and revoked grant review: Verify that grants expire as configured.
- Emergency-freeze state review: Ensure freeze is disabled during normal operation.
- Permission review: Confirm RBAC integrity.
- Database-health review: Check Prisma migration state and database connections.
- Test and dependency review: Run the full Jest integration suite safely.
- Evidence-retention review: Comply with data retention and purging policies.

# Recovery Checklist
- Verify repository checkpoint: Ensure current HEAD matches the canonical tag.
- Verify test-database guard: Run `test:db:guard` before running local tests.
- Verify canonical Phase 4 tags: Ensure Git references are unmodified.
- Verify emergency freeze: Can be flipped via `SystemSetting` table if UI is down.
- Verify response API health: Perform a `NOOP_SIMULATION` response.
- Verify no pending rollback failure: Scan database for `ROLLED_BACK_FAILED`.

# Known Limitations
- No irreversible automated action.
- No payment movement.
- No arbitrary code execution.
- No external infrastructure shutdown.
- No unsupervised active defense.
