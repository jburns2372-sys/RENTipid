# ISMS Risk and Control Register

| RISK_ID | ASSET_OR_PROCESS | THREAT | VULNERABILITY | IMPACT | LIKELIHOOD | INHERENT_RISK | EXISTING_CONTROLS | RESIDUAL_RISK | CONTROL_OWNER | TREATMENT | DUE_DATE_STATUS | ACCEPTANCE_AUTHORITY | EVIDENCE | REVIEW_CADENCE |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| RISK-001 | User Accounts | ACCOUNT_TAKEOVER | Weak Passwords | HIGH | MEDIUM | HIGH | MFA, Step-up Auth, Brute Force Rules | LOW | CISO | ACCEPT | COMPLETED | Management | Security Logs | ANNUAL |
| RISK-002 | Payments | PAYMENT_MANIPULATION | Parameter Tampering | HIGH | LOW | HIGH | Integrity Hashes, Webhook Replay Rules | LOW | Finance Director | ACCEPT | COMPLETED | Management | Payment Tests | ANNUAL |
| RISK-003 | Admin Panel | PRIVILEGE_ESCALATION | BOLA, Broken RBAC | HIGH | MEDIUM | HIGH | PBAC, Role Checks, Privilege Escalation Rules | LOW | CISO | ACCEPT | COMPLETED | Management | Phase 4 Tests | ANNUAL |
| RISK-004 | PII Data | SENSITIVE_DATA_DISCLOSURE | Insecure Direct Object Reference | HIGH | MEDIUM | HIGH | Data Classification, Privacy Serializers | LOW | DPO | ACCEPT | COMPLETED | Management | Phase 5M Tests | ANNUAL |
| RISK-005 | Vaults | KEY_COMPROMISE | Accidental Commit | HIGH | LOW | HIGH | Secret Scanning, Key Rotation Runbooks | LOW | CISO | ACCEPT | COMPLETED | Management | Phase 5F Runbooks | ANNUAL |
| RISK-006 | Dependencies | DEPENDENCY_COMPROMISE | Supply Chain Attack | HIGH | MEDIUM | HIGH | SBOM, Dependency Rules | LOW | Engineering Lead | ACCEPT | COMPLETED | Management | Phase 5I SBOM | ANNUAL |
| RISK-007 | GenAI Module | AI_PROMPT_INJECTION | Injection Payloads | HIGH | MEDIUM | HIGH | AI Guard, LLM Input Validation | LOW | Data Science | ACCEPT | COMPLETED | Management | Phase 5K Logs | ANNUAL |
| RISK-008 | GenAI Tools | AI_HIGH_RISK_ACTION | Hallucination execution | HIGH | LOW | HIGH | Tool Scoping, AI Governance Rules | LOW | Data Science | ACCEPT | COMPLETED | Management | Phase 5K Logs | ANNUAL |
| RISK-009 | SOC | SECURITY_EVENT_LOSS | Log Dropping | HIGH | LOW | MEDIUM | DB Transactions, Dead Letter Queues | LOW | CISO | ACCEPT | COMPLETED | Management | Phase 5J Tests | ANNUAL |
| RISK-010 | Database | BACKUP_RESTORE_FAILURE | Untested Backups | HIGH | LOW | HIGH | Backup Runbooks, DR Testing | LOW | Database Admin | ACCEPT | COMPLETED | Management | Phase 5L Runbooks | ANNUAL |
| RISK-011 | Infrastructure | CLOUD_CONFIGURATION_DRIFT | Manual changes | MEDIUM | LOW | MEDIUM | Terraform state locks | LOW | Cloud Ops | ACCEPT | COMPLETED | Management | Terraform Pipeline | ANNUAL |
| RISK-012 | Privacy Ops | PRIVACY_REQUEST_FAILURE | Ignored Request | HIGH | LOW | MEDIUM | Privacy Workflow | LOW | DPO | ACCEPT | COMPLETED | Management | Phase 5M Tests | ANNUAL |
| RISK-013 | Privacy Ops | UNAUTHORIZED_DATA_EXPORT | Over-permission | HIGH | LOW | HIGH | Identity checks | LOW | DPO | ACCEPT | COMPLETED | Management | Phase 5M Tests | ANNUAL |
| RISK-014 | Privacy Ops | RETENTION_FAILURE | Retaining data too long | MEDIUM | LOW | MEDIUM | Retention Policies | LOW | DPO | ACCEPT | COMPLETED | Management | Retention Registry | ANNUAL |
| RISK-015 | Vendors | THIRD_PARTY_PROCESSOR_FAILURE | Breach at vendor | HIGH | LOW | HIGH | Processor Register, DPAs | LOW | DPO | ACCEPT | COMPLETED | Management | Processor Register | ANNUAL |
