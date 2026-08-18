# RENTipid Security Control Registry

Status: `FROZEN_WORKING_REGISTRY`

| Control family | Current implementation/evidence | Classification |
| --- | --- | --- |
| Authentication/session | NextAuth, session callbacks, registration validation | Implemented |
| Server authorization | role/permission helpers, proxy and page/API guards | Implemented; server is authoritative |
| Least privilege | SOC Analyst/Supervisor matrices, finance/compliance separation | Accepted/frozen SOC evidence |
| Separation of duties | approval requester/approver/executor constraints | Accepted/frozen Gates 4G/4H |
| Input validation | Zod/domain validators, mutation services, upload policy | Implemented |
| Upload security | extension/MIME/magic/content checks and size limits | Accepted Level 5 evidence |
| Audit/sanitization | audit/security logs, serializers, safe failure codes | Implemented/frozen |
| Telemetry privacy | pseudonymization/HMAC, bounded summaries, IP safety | Implemented/frozen |
| Detection engineering | rule validation/DSL/evaluator/deduplication/checkpoints | Implemented/frozen |
| Incident response | cases, playbooks, approvals, reversible execution/rollback | Implemented/frozen |
| Controlled simulation | Gate 4I nine-scenario suite and NOOP execution | Complete/frozen capability |
| Emergency freeze | response execution stop with rollback availability | Accepted/frozen |
| Recovery/resilience | leases, checkpoints, backfill/recovery, runbooks | Implemented/accepted |
| Cryptographic protection | envelopes, key providers, blind indexes, profile protection/rotation | Accepted/frozen Level 5 evidence |
| MFA/step-up | MFA/session evidence and models | Accepted/frozen evidence |
| Payment protection | signature validation, reconciliation, live-mode controls | Implemented with Phase 19 NO-GO |
| Database safety | local test-database guard and explicit mutation controls | Implemented |
| Cloud identity | managed identity/Key Vault/storage RBAC target | Phase 19B local implementation/readiness; deployment not inferred |
| Supply chain | lockfiles, CI/dependency evidence | Accepted Level 5 evidence |
| AI governance | policy/guardrails/advisory constraints | Implemented/frozen evidence |
| Privacy/ISMS | privacy services and Level 5M registers/runbooks | Accepted/frozen evidence |

Non-controls:

- hiding a UI control without a server guard;
- a permission constant with no service implementation;
- a Terraform resource not applied;
- a placeholder route;
- a readiness dashboard;
- a historical test result used as proof of current production state.

Canonical manual cross-reference: `../05-SECURITY-SOC-PRIVACY/RENTipid_SECURITY_SOC_PRIVACY_MANUAL.md`
and Master Parts XVII–XXI.
