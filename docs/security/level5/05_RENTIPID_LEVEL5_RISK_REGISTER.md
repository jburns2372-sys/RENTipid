# RENTIPID LEVEL 5 RISK REGISTER

## Overview
This register catalogs identified cybersecurity risks and their treatments.

---

## Assessed Risks

| Risk ID | Related Gap IDs | Threat Scenario | Assets Affected | Likelihood | Impact | Residual Risk | Priority | Treatment | Target Phase | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| **RSK-001** | N/A | Privileged-account compromise | Admin Accounts | Medium | High | High | P1 | Mitigate | 5C | Open |
| **RSK-002** | N/A | Broken authorization | Application Data | Low | High | Medium | P2 | Mitigate | 5D | Open |
| **RSK-003** | GAP-008 | Session theft | User Sessions | Medium | High | High | P1 | Mitigate | 5D | Open |
| **RSK-004** | N/A | Credential stuffing | User Accounts | Medium | Medium | Medium | P2 | Mitigate | 5D | Open |
| **RSK-005** | N/A | Account takeover | User Accounts | Low | High | Medium | P2 | Mitigate | 5C | Open |
| **RSK-006** | GAP-007 | Payment-webhook forgery | Payment Gateway | Low | High | Medium | P2 | Mitigate | 5G | Open |
| **RSK-007** | GAP-007 | Payment reconciliation failure | Escrow Funds | Low | High | Medium | P2 | Mitigate | 5G | Open |
| **RSK-008** | GAP-007 | Escrow or payout manipulation | Escrow Funds | Low | High | Medium | P2 | Mitigate | 5G | Open |
| **RSK-009** | GAP-006 | KYC and identity-data exposure | User PII | Low | High | High | P1 | Mitigate | 5F | Open |
| **RSK-010** | N/A | Malicious file upload | Cloud Storage | Medium | Medium | Medium | P2 | Mitigate | 5E | Open |
| **RSK-011** | N/A | API abuse | APIs | High | Low | Medium | P2 | Mitigate | 5E | Open |
| **RSK-012** | N/A | Rate-limit bypass | APIs | Medium | Low | Low | P3 | Mitigate | 5E | Open |
| **RSK-013** | N/A | Supply-chain compromise | Source Code | Low | High | High | P1 | Mitigate | 5I | Open |
| **RSK-014** | N/A | Dependency vulnerability | Source Code | High | Medium | High | P1 | Mitigate | 5I | Open |
| **RSK-015** | GAP-015 | Secret leakage | Source Code / Logs | Low | High | Medium | P2 | Mitigate | 5F | Open |
| **RSK-016** | GAP-008 | Cloud misconfiguration | Infrastructure | Low | High | Medium | P2 | Mitigate | 5H | Open |
| **RSK-017** | N/A | Backup failure | Database | Low | High | Medium | P2 | Mitigate | 5L | Open |
| **RSK-018** | N/A | Restore failure | Database | Low | High | High | P1 | Mitigate | 5L | Open |
| **RSK-019** | N/A | Incident-response failure | Operations | Low | High | Medium | P2 | Mitigate | 5M | Open |
| **RSK-020** | N/A | Audit-log tampering | Logs | Low | High | Medium | P2 | Mitigate | 5J | Open |
| **RSK-021** | N/A | SOC alert fatigue | SOC Analysts | High | Medium | Medium | P2 | Mitigate | 5J | Open |
| **RSK-022** | GAP-005 | Unsafe automated response | Infrastructure | Low | High | Medium | P2 | Mitigate | 5J | Open |
| **RSK-023** | N/A | Approval-grant replay | Admin Actions | Low | High | Low | P3 | Mitigate | 5D | Open |
| **RSK-024** | GAP-005 | Rollback failure | State Machine | Low | High | Medium | P2 | Mitigate | 5L | Open |
| **RSK-025** | N/A | Fraud collusion | Marketplace | Low | High | Medium | P2 | Mitigate | 5J | Open |
| **RSK-026** | GAP-009 | AI prompt injection | LLM Integrations | Low | High | Medium | P2 | Mitigate | 5K | Open |
| **RSK-027** | GAP-009 | AI data leakage | LLM Integrations | Low | High | High | P1 | Mitigate | 5K | Open |
| **RSK-028** | GAP-009 | AI unauthorized action | LLM Integrations | Low | High | High | P1 | Mitigate | 5K | Open |
| **RSK-029** | GAP-006 | Privacy-retention failure | User PII | Low | Medium | Medium | P2 | Mitigate | 5M | Open |
| **RSK-030** | N/A | Third-party service outage | External APIs | Medium | High | High | P1 | Accept | 5L | Open |
| **RSK-031** | N/A | Insider misuse | Application Data | Low | High | Medium | P2 | Mitigate | 5M | Open |
| **RSK-032** | GAP-010 | Unmanaged risk exposure | Governance | Low | Medium | Medium | P2 | Mitigate | 5B | Open |

---

## Detailed Example: RSK-009 (KYC and identity-data exposure)
- **Risk ID:** RSK-009
- **Related gap IDs:** GAP-006
- **Threat scenario:** Attacker dumps database and reads plaintext KYC documents and PII.
- **Threat actor or failure source:** External attacker, malicious insider.
- **Assets affected:** User PII, Database.
- **Preconditions:** Network perimeter breached; DB credentials obtained.
- **Existing controls:** Application access controls (EV-001).
- **Control limitations:** No encryption at rest.
- **Likelihood:** Low
- **Impact:** High
- **Inherent risk:** High
- **Residual risk:** High
- **Priority:** P1
- **Business effect:** Reputational damage, loss of user trust.
- **Privacy effect:** Severe data exposure.
- **Financial effect:** Fines and legal costs.
- **Legal or regulatory consideration:** DPA/GDPR violations.
- **Risk owner role:** Chief Information Security Officer (CISO)
- **Treatment:** Mitigate
- **Required approval for acceptance:** Executive Board
- **Target phase:** 5F
- **Target completion gate:** Production encryption rollout.
- **Monitoring metric:** Unencrypted rows in DB.
- **Escalation threshold:** 1 unencrypted new row detected.
- **Status:** Open
