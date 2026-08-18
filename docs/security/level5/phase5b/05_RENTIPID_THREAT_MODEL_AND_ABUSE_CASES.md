# RENTIPID THREAT MODEL AND ABUSE CASES

## 1. STRIDE Threat Scenarios

| Threat ID | Title | Threat Category | Threat Actor | Target Assets | Entry Point | Trust Boundary | Preconditions | Attack Sequence | Security Objective | Existing Controls | Control Limitations | Detection Opportunity | Response Opportunity | Risk IDs | Gap IDs | Additional Risk | Likelihood | Impact | Priority | Target Phase | Ext Assurance | Evidence Class |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **THR-001** | Privilege Escalation via IDOR | Elevation of Privilege (STRIDE) | Authenticated User | API, Data | API Routes | TB-002 | Valid user session | Modifies parameters to access admin endpoints. | Confidentiality, Integrity | `requireSecurityPermission` | Requires complete route coverage. | 403 logs | Auto-ban IP | RSK-002 | N/A | None | Low | High | P2 | 5D | Pen Test | VERIFIED_IMPLEMENTATION |
| **THR-002** | Webhook Forgery | Spoofing (STRIDE) | External Attacker | Escrow Funds | Webhook Endpoint | TB-005 | Knowledge of endpoint | Sends fake payment success webhook. | Integrity | Signature validation | None implemented yet | Invalid sig logs | Drop request | RSK-006 | GAP-007 | None | Low | High | P2 | 5G | PCI Audit | NOT_EVIDENCED |
| **THR-003** | Escrow State Tampering | Tampering (STRIDE) | Insider / DB Compromise | DB | DB Query | TB-003 | DB Access | Modifies escrow status manually. | Integrity | Local DB Guard | Production lacks KMS. | DB audit logs | Emergency Freeze | RSK-008 | GAP-006 | None | Low | High | P2 | 5G | PCI Audit | PLANNED_ARCHITECTURE |
| **THR-004** | AI Prompt Injection | Tampering (STRIDE) | Malicious User | AI Service | AI Prompt | TB-006 | AI feature access | Submits malicious prompt to bypass logic. | Integrity | None | AI not implemented. | Prompt logs | Terminate chat | RSK-026 | GAP-009 | None | Low | High | P2 | 5K | None | NOT_EVIDENCED |
| **THR-005** | Audit Log Deletion | Repudiation (STRIDE) | Compromised Admin | Audit Logs | DB | TB-003 | Admin DB Access | Deletes security events to hide tracks. | Integrity | WORM storage (planned) | Not immutable. | Missing sequential IDs | Alert | RSK-020 | N/A | None | Low | High | P2 | 5J | Pen Test | INFERRED_ARCHITECTURE |
| **THR-006** | Cloud Misconfiguration | Information Disclosure (STRIDE) | External Attacker | Infrastructure | Cloud API | TB-001 | Public bucket / Open port | Accesses unauthenticated storage bucket. | Confidentiality | IAM Policies | Unverified by audit. | CloudTrail | Revoke IAM | RSK-016 | GAP-008 | None | Low | High | P2 | 5H | Cloud Audit | PLANNED_ARCHITECTURE |
| **THR-007** | Third-Party Outage | Denial of Service (STRIDE) | Cloud Provider | Application | Global | TB-001 | Cloud provider fails | Provider goes offline. | Availability | Auto-scaling | Single region. | Uptime checks | Failover | RSK-030 | N/A | None | Medium | High | P1 | 5L | DR Audit | PLANNED_ARCHITECTURE |
| **THR-008** | Secret Exposure | Information Disclosure | Developer | Source Code | GitHub | TB-001 | Commit with secret | Commits API key to repository. | Confidentiality | Code Review | No automated scanning. | Git hooks | Rotate key | RSK-015 | GAP-015 | None | Low | High | P2 | 5F | None | INFERRED_ARCHITECTURE |
| **THR-009** | Unsafe Automated Response | Tampering (STRIDE) | SOC Automation | Infrastructure | SOC Playbook | TB-002 | Triggered Playbook | Flawed logic bans all users. | Availability | Idempotency | Rollbacks untested. | Event anomaly | Rollback | RSK-022, RSK-024 | GAP-005 | None | Low | High | P2 | 5J | None | INFERRED_ARCHITECTURE |

## 2. Abuse Cases

| Abuse Case ID | Actor | Goal | Misused Workflow | Preconditions | Abuse Sequence | Expected Business Effect | Existing Prevention | Existing Detection | Existing Recovery | Missing Control | Related Threats | Related Risks | Target Phase | Acceptance Criteria |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **ABU-001** | Attacker | Steal user accounts | Login | Breached passwords | Uses automated scripts to test breached credentials (Credential Stuffing / Account Takeover). | Mass account theft. | Rate limiting | Failed login spikes | Force password reset | Captcha / MFA | THR-001 | RSK-004, RSK-005 | 5C | MFA required. |
| **ABU-002** | Provider & Renter | Defraud platform | Booking | Collusion | Creates fake listing and books it with stolen card, claims payout. | Financial loss. | Payment Gateway fraud checks | SOC anomaly detection | Withhold payout | KYC Verification | THR-002 | RSK-025 | 5J | Payout delayed until KYC. |
| **ABU-003** | Renter | Stay for free | Refund | Valid booking | Stays, then claims false damage/dispute to force refund. | Revenue loss. | Dispute resolution policy | High dispute rate | Ban user | Automated escrow hold | THR-003 | RSK-008 | 5G | Dispute freezes funds. |
| **ABU-004** | Attacker | Upload malware | KYC / Listing | Valid session | Uploads malicious executable masquerading as a PDF/Image. | Backend compromise. | Zod file extension checks | Antivirus | Restore from backup | Active file scanning | THR-001 | RSK-010 | 5E | Malware upload rejected. |
| **ABU-005** | Insider (SOC) | Snooping | SOC Dashboard | SOC_ANALYST role | Views PII of high-profile users unnecessarily. | Privacy violation. | Proxy least-privilege, DTO redaction | Audit logs | Fire employee | Strict justification gating | THR-001 | RSK-031, RSK-001 | 5C | Logs capture all views. |
| **ABU-006** | Attacker | Extract DB | Application | SQLi / SSRF | Exploits vulnerability to dump database containing plain KYC (Data Theft). | Fines, reputational ruin. | ORM usage | DB exfiltration alerts | Incident response | Encryption at rest | THR-006 | RSK-009 | 5F | Encryption at rest live. |
| **ABU-007** | Attacker | Hijack supply chain | Build pipeline | Compromised dependency | Injects malicious code via npm package. | Complete breach. | Dependabot | CodeQL | Revert package | SBOM / Signed commits | THR-008 | RSK-013, RSK-014 | 5I | Zero critical CVEs. |

## 3. Required Scenario Coverage Matrix

| Required Scenario | Covered By | Notes |
|---|---|---|
| Account takeover | ABU-001 | Mitigated by Phase 5C MFA. |
| Credential stuffing | ABU-001 | Mitigated by Phase 5C rate limiting and MFA. |
| Privilege escalation | THR-001 | Addressed by `requireSecurityPermission`. |
| Broken object-level authorization | THR-001 | Handled via route coverage in Phase 5D. |
| Provider-renter collusion | ABU-002 | Addressed by SOC anomaly detection and KYC. |
| Fake listing | ABU-002 | Detected via KYC and identity checks. |
| Stolen-asset listing | ABU-002 | Detected via KYC and dispute resolution. |
| KYC fraud | ABU-004 | Addressed by secure file upload and identity vendor. |
| KYC data theft | ABU-006, THR-006 | Addressed by encryption at rest (5F) and IAM. |
| Malicious document upload | ABU-004 | Handled via Zod schemas and antivirus scanning (5E). |
| Booking manipulation | THR-001 | Prevented by authorization and input validation (5D). |
| Escrow manipulation | THR-003 | Addressed by DB guardrails and webhook signatures (5G). |
| Payout redirection | THR-003 | Prevented by strict idempotency and identity checks. |
| Webhook forgery | THR-002 | Prevented by signature verification (5G). |
| Replay | THR-002 | Mitigated by idempotency keys across API and payments. |
| Refund abuse | ABU-003 | Addressed by dispute resolution policies. |
| Damage-claim fraud | ABU-003 | Addressed by manual review and escrow freezing. |
| Review manipulation | THR-001 | Prevented by authorization validation. |
| Admin insider misuse | ABU-005, THR-005 | Mitigated by immutable audit logs and proxy boundaries. |
| SOC analyst overreach | ABU-005 | Addressed by DTO redaction and proxy permissions. |
| Approval-grant replay | THR-001 | Prevented by one-time execution tokens (5E). |
| Unsafe automated response | THR-009 | Mitigated by strict rollback checks (5J). |
| Rollback failure | THR-009 | Prevented by idempotency and state machine logic (5L). |
| Audit-log tampering | THR-005 | Addressed by sequential IDs and WORM storage (5J). |
| Secret exposure | THR-008 | Mitigated by git hooks and KMS (5F). |
| Dependency compromise | ABU-007 | Prevented by SBOM and CI scanning (5I). |
| Cloud misconfiguration | THR-006 | Addressed by Cloud Security Assessment (5H). |
| Backup failure | THR-007 | Addressed by automated testing (5L). |
| Restore failure | THR-007 | Addressed by DR testing (5L). |
| AI prompt injection | THR-004 | Prevented by strict prompt boundaries (5K). |
| AI sensitive-data leakage | THR-004 | Prevented by data masking prior to API call (5K). |
| AI unauthorized action | THR-004 | Mitigated by keeping AI strictly read-only (5K). |
| Third-party outage | THR-007 | Addressed by multi-region/multi-cloud DR (5L). |

## 4. Phase 5A P1 Risk Relationships

| Risk ID | Assets & Dependencies | Boundaries & Flows | Threats & Abuse Cases | Architecture Evidence Status | Existing Mitigating Controls | Missing or Incomplete Controls | Residual Production Blocker | Target Phase |
|---|---|---|---|---|---|---|---|---|
| **RSK-001** | AST-003, AST-005, DEP-003 | TB-013, DF-025 | ABU-005 | VERIFIED_IMPLEMENTATION | Proxy boundary routing, baseline permissions. | Formal governance assignments, explicit role separation. | Prevent admin proxy bypass and formalize assignments. | 5D, 5H |
| **RSK-003** | AST-004, DEP-003 | TB-007, DF-010 | THR-001 | VERIFIED_IMPLEMENTATION | Basic NextAuth session tokens. | MFA, strict session timeouts, rotation. | Enforce MFA and strict session limits. | 5C |
| **RSK-009** | AST-006, DEP-010 | TB-008, DF-013 | ABU-004, ABU-006 | NOT_EVIDENCED | None evidenced. | Encryption at rest, isolated storage. | Encryption at rest and isolated storage. | 5F |
| **RSK-013** | AST-019, DEP-006 | TB-011, DF-029 | ABU-007 | NOT_EVIDENCED | None evidenced. | Branch protection, signed commits. | Require branch protection and signed commits. | 5I |
| **RSK-014** | AST-020, DEP-007 | TB-011, DF-029 | ABU-007 | NOT_EVIDENCED | None evidenced. | Automated SCA/SAST pipeline. | Enforce automated SCA/SAST pipeline. | 5I |
| **RSK-018** | AST-022, DEP-002 | TB-013, DF-027, DF-028 | THR-007 | NOT_EVIDENCED | None evidenced. | Automated offline backups, DR tests. | Implement automated, tested offline backups. | 5L |
| **RSK-027** | AST-024, DEP-002 | TB-006, DF-009 | THR-004 | NOT_EVIDENCED | None evidenced. | Prompt injection defense, data masking. | Prevent prompt injection and data leakage. | 5K |
| **RSK-028** | AST-024, DEP-002 | TB-006, DF-009 | THR-004 | NOT_EVIDENCED | None evidenced. | Read-only AI enforcement, action approvals. | Eliminate autonomous write capabilities. | 5K |
| **RSK-030** | AST-001, AST-002, DEP-002, DEP-005 | TB-009, DF-011 | THR-007 | NOT_EVIDENCED | None evidenced. | Multi-provider fallback, failover routing. | Establish multi-provider fallback. | 5M |