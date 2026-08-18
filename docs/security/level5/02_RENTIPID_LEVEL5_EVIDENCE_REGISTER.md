# RENTIPID LEVEL 5 EVIDENCE REGISTER

## Overview
This register catalogs the currently existing controls and evidence within the RENTipid repository.

### Command Center Checkpoints
- **Phase 4 baseline:** `ed9eb6ca1b0d6d03fe4651e2c4893517ebca58ff`
- **Dashboard implementation:** `ef633e658abf866ef2161461257af4a5a3f73ac3`
- **R1:** `08ec6a2bb75e6c9a80d93778dc9ffe71f4b66bbe`
- **R2:** `a1c2ccd237ca093a53a4639f44b3f77c5197133a`
- **R3:** `e779c48eb4b4be10fe5a7a2804dd572930f4b3fc`
- **Amended R6:** `7d8010ca0af1d56cd268b475488b30d090cfd237`
- **R7:** `a6a43b2f4ba2c6a63c57634cfca2799e65c182e6`

---

## Register Entries

| Evidence ID | Security Domain | File Path / Symbol | Evidence Type | Commit Ref | What it Proves | What it Does Not Prove | Confidence | Classification | Related Phase | Sensitive Review |
|---|---|---|---|---|---|---|---|---|---|---|
| **EV-001** | Authorization | `src/lib/security/permissions.ts` / `requireSecurityPermission` | Implementation | `a6a43b2` | Database-authoritative permission checks exist. | Does not prove proper usage across all endpoints. | High | IMPLEMENTED_AND_EVIDENCED | 5D | Clear |
| **EV-002** | Identity and Access | `src/proxy.ts` / `proxy` | Implementation | `a6a43b2` | Least-privileged SOC_ANALYST dashboard access boundary is enforced via proxy. | Does not prove backend data-layer isolation. | High | IMPLEMENTED_AND_EVIDENCED | 5C | Clear |
| **EV-003** | SOC and Fraud | Prisma Schema / `SecurityEvent` model | Implementation | `ed9eb6c` | Normalized security events are structured and stored. | Does not prove 100% coverage of application events. | High | IMPLEMENTED_AND_EVIDENCED | 5J | Clear |
| **EV-004** | SOC and Fraud | Prisma Schema / `SecurityIncident` model | Implementation | `ed9eb6c` | Incident cases can be tracked and grouped. | Does not prove operational handling SLAs. | High | IMPLEMENTED_AND_EVIDENCED | 5J | Clear |
| **EV-005** | SOC and Fraud | Prisma Schema / `SecurityPlaybook` model | Implementation | `ed9eb6c` | Response playbooks exist as structured entities. | Does not prove autonomous execution safety. | High | IMPLEMENTED_AND_EVIDENCED | 5J | Clear |
| **EV-006** | Governance | Prisma Schema / `SecurityApproval` model | Implementation | `ed9eb6c` | Approval gates are required for high-risk actions. | Does not prove out-of-band identity verification. | High | IMPLEMENTED_AND_EVIDENCED | 5B | Clear |
| **EV-007** | Authorization | Prisma Schema / `SecurityGrant` model | Implementation | `ed9eb6c` | Scoped and consumable grants exist for temporary elevation. | Does not prove zero-trust network boundaries. | High | IMPLEMENTED_AND_EVIDENCED | 5D | Clear |
| **EV-008** | Resilience | `src/app/api/soc/responses/[executionId]/rollback/route.ts` | Implementation | `ed9eb6c` | Reversible response operations are technically supported. | Does not prove successful recovery in all edge cases. | Medium | PARTIALLY_IMPLEMENTED | 5L | Clear |
| **EV-009** | Application Security | `src/lib/security/responses/execution.service.ts` | Implementation | `ed9eb6c` | Concurrency and idempotency protection exist in execution engine. | Does not prove protection against all race conditions. | High | IMPLEMENTED_AND_EVIDENCED | 5E | Clear |
| **EV-010** | Payment Security | Payment Routes (assumed) | Documentation | `ed9eb6c` | Emergency-freeze controls exist conceptually. | Does not prove live network isolation. | Medium | DOCUMENTED_NOT_IMPLEMENTED | 5G | Clear |
| **EV-011** | Privacy | `src/lib/security/dashboard/dto.ts` | Implementation | `08ec6a2` | Privacy-safe dashboard DTOs sanitize feed data. | Does not prove absolute redaction of all PII. | High | IMPLEMENTED_AND_EVIDENCED | 5M | Clear |
| **EV-012** | Database Security | `src/lib/test-database-guard.ts` | Implementation | `ed9eb6c` | Local database mutation guard prevents accidental production edits during tests. | Does not prove infrastructure-level network isolation. | High | IMPLEMENTED_AND_EVIDENCED | 5H | Clear |
| **EV-013** | Governance | `docs/security/phase4/RENTIPID_SOC_COMMAND_CENTER_DASHBOARD_UI_EVIDENCE.md` | Documentation | `a6a43b2` | Audit-oriented evidence documents track Phase 4 acceptance. | Does not prove ongoing operational compliance. | High | IMPLEMENTED_AND_EVIDENCED | 5B | Clear |
| **EV-014** | Security Assurance | `tests/security/**/*.test.ts` | Test | `a6a43b2` | Phase 4 focused and integrated validation passes. | Does not prove resilience against advanced persistent threats. | High | IMPLEMENTED_AND_EVIDENCED | 5N | Clear |
| **EV-015** | Secrets Management | Ephemeral Logs | Operational | N/A | LOCAL_EPHEMERAL_LOG_RETAINS_INVALIDATED_TEMPORARY_CREDENTIAL | Does not prove secret exposure in git. | Low | PARTIALLY_IMPLEMENTED | 5F | **FLAGGED** |

---

## Known Limitations and Evidence-Quality Risks
- **TypeScript Baseline (Technical Debt):** The repository is not a clean TypeScript build. There are 17 total known errors (7 Phase 3 lifecycle-test errors, 10 unrelated pre-existing errors, 0 current command-center errors).
- **Certifications:** No Level 5 certification exists.
- **External Assurance:** No independent penetration test, ISO certification, PCI attestation, disaster-recovery exercise, or production cloud-security assessment is evidenced unless explicitly located and recorded.
- **Environment Context:** Local browser evidence does not prove production hardening.
- **Credential Handling:** An invalidated local credential exposure remains present in an external ephemeral log as a residual evidence-handling issue.
