# ISMS Operations Runbook

| PROCEDURE | OWNER | INPUT | REVIEW_CADENCE | EVIDENCE | ESCALATION | APPROVAL | FAILURE_ACTION |
|---|---|---|---|---|---|---|---|
| PRIVILEGED_ACCESS_REVIEW | CISO | IAM List, Role Assignments | QUARTERLY | Access Review Log | CIO | CISO | Revoke unverified access |
| ROLE_PERMISSION_REVIEW | CISO | PBAC Configuration | QUARTERLY | Permission Audit Log | CIO | CISO | Revert to baseline |
| SERVICE_ACCOUNT_REVIEW | Cloud Ops | Cloud IAM Service Accounts | QUARTERLY | SA Review Log | CISO | Cloud Ops Lead | Disable SA |
| SECRET_AND_KEY_REVIEW | CISO | Vault secrets | QUARTERLY | Key Rotation Log | CIO | CISO | Force rotate key |
| DEPENDENCY_RISK_REVIEW | Engineering Lead | SBOM, Dependabot Alerts | MONTHLY | Dependency Scan Report | CISO | Engineering Lead | Block builds |
| BACKUP_RESTORE_REVIEW | Database Admin | DB Backup Logs | MONTHLY | Restore Drill Record | CISO | DB Admin | Trigger manual backup |
| SECURITY_EVENT_RULE_REVIEW | SOC Lead | Alert Tuning Metrics | QUARTERLY | Rule Update Log | CISO | SOC Lead | Revert rule |
| AI_ACTION_POLICY_REVIEW | Data Science Lead | AI Guard Logs | QUARTERLY | AI Policy Update Log | CISO | Data Science Lead | Block AI tool |
| PROCESSOR_REVIEW | DPO | Vendor DPAs | ANNUAL | Processor Review Log | Legal Counsel | DPO | Terminate vendor |
| PRIVACY_REQUEST_REVIEW | DPO | Privacy Ops Dashboard | MONTHLY | Privacy Request Metrics | Legal Counsel | DPO | Manual audit of requests |
| SECURITY_EXCEPTION_REVIEW | CISO | Exception Register | QUARTERLY | Exception Status Report | Management | CISO | Revoke exception |
| INCIDENT_POSTMORTEM | SOC Lead | Closed Incident Cases | POST-INCIDENT | Postmortem Report | Management | CISO | Follow up on action items |
