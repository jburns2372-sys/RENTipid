# RENTipid ISO Risk Treatment Plan

**Document ID:** `RENTIPID-ISO-CONFORMITY-001-RTP`  
**Program:** RENTipid ISO Compliance & Conformity Program  
**Project ID:** `RENTIPID-ISO-CONFORMITY-001`  
**Version:** `v1.0`  
**Status:** `BASELINE COMPLETE`  
**Standard Alignment:** ISO/IEC 27001:2022 Clause 6.1.3, ISO/IEC 27701:2019  

---

## 1. Risk Treatment Policy & Execution Model

Under ISO_CONFORMITY_MASTER_LEDGER.md and accepted C0 boundaries, risk treatments are consolidated into **6 bounded corrective waves** to prevent fragmented, one-defect-at-a-time execution.

> **Remediation Boundary Rule:** Zero technical remediation is executed during governance package `ISO-C1`. This document catalogs required treatments, classifies their nature, and maps them to scheduled downstream phases (`ISO-C2` through `ISO-C5`) for deterministic technical execution by Codex or formal human/executive action.

---

## 2. Treatment Action Classification Taxonomy

Every treatment action is classified into one or more operational categories:
1. `ALREADY_IMPLEMENTED`: Control logic exists in code or configuration; baseline inherited.
2. `OPERATING_EVIDENCE_NEEDED`: Mechanism exists; recurring dated operational logs/records needed.
3. `DOCUMENTATION_NEEDED`: Governance registry, policy text, or runbook formalization required.
4. `TECHNICAL_REMEDIATION_NEEDED`: Code, schema, worker, or script modification required.
5. `HUMAN_EVIDENCE_NEEDED`: Non-code executive, managerial, training, or audit sign-off required.
6. `EXTERNAL_PROVIDER_EVIDENCE_NEEDED`: Third-party contractual, certification, or account approval required.
7. `LEGAL_COUNSEL_DECISION_NEEDED`: Specialized regional regulatory, tax, or legal opinion required.
8. `PROJECT_OWNER_DECISION_NEEDED`: Formal platform owner risk acceptance or scope authorization required.

---

## 3. Consolidated Wave Treatment Matrix

### Wave A — Governance / Identity / Access
*Target Phases: `ISO-C1` (Governance), `ISO-C2` (Auth Hardening), `ISO-C3` (Access Reviews & Training)*

| Action ID | Associated Risks | Treatment Action Statement | Classification | Responsible Role | Target Phase |
|---|---|---|---|---|---|
| **TRT-A01** | `RSK-01`, `RSK-02` | Enforce step-up MFA verification model on high-risk admin actions and sensitive settings | `ALREADY_IMPLEMENTED` / `OPERATING_EVIDENCE_NEEDED` | Security Lead | `ISO-C2` |
| **TRT-A02** | `RSK-03` | Establish quarterly privileged access certification procedure and execute formal sign-off | `HUMAN_EVIDENCE_NEEDED` | CISO / Program Owner | `ISO-C3` |
| **TRT-A03** | `RSK-17`, `RSK-27` | Compile formal annual information security and privacy awareness training records | `HUMAN_EVIDENCE_NEEDED` | Management | `ISO-C3` |
| **TRT-A04** | RSK-03, RSK-05, RSK-06, RSK-08, RSK-09, RSK-12, RSK-14, RSK-15, RSK-17, RSK-21, RSK-22, RSK-23, RSK-24, RSK-26, RSK-30 | Owner direction on all listed High residuals: treatment priorities/ownership and any proposed acceptance; no decision recorded | `PROJECT_OWNER_DECISION_NEEDED` | Project Owner | `ISO-C1` / `ISO-C5` |

---

### Wave B — Secrets / Data Protection / Privacy / Retention
*Target Phases: `ISO-C1` (Legal Mapping), `ISO-C2` (Retention Worker & Encryption), `ISO-C3` (PIMS Operations)*

| Action ID | Associated Risks | Treatment Action Statement | Classification | Responsible Role | Target Phase |
|---|---|---|---|---|---|
| **TRT-B01** | `RSK-05` | Define required prevention/enforcement architecture and acceptance evidence before prescribing a local secret hook | `DOCUMENTATION_NEEDED` | Engineering Lead | `ISO-C2` |
| **TRT-B02** | `RSK-10`, `RSK-11` | Verify scoped Phase 5F coverage; do not claim encryption of all PII/payment tokens | `ALREADY_IMPLEMENTED` | Security Lead | `ISO-C2` |
| **TRT-B03** | `RSK-12`, `RSK-30` | Obtain specialized legal counsel guidance on cross-border data transfer mechanisms for high-tier markets | `LEGAL_COUNSEL_DECISION_NEEDED` | DPO / Legal Counsel | `ISO-C1` / `ISO-C2` |
| **TRT-B04** | `RSK-28` | Establish formal operational tracking ledger for incoming Data Subject Rights (DSR) requests | `DOCUMENTATION_NEEDED` / `OPERATING_EVIDENCE_NEEDED` | DPO | `ISO-C3` |
| **TRT-B05** | `RSK-29` | Preserve manual v1 retention and approved automation deferral; collect governed evidence, seek separate owner authorization before reopening | `DOCUMENTATION_NEEDED` | Engineering Lead | `ISO-C2` |

---

### Wave C — API / Webhook / Network / Application Security
*Target Phases: `ISO-C2` (API Hardening & Idempotency), `GLOBAL-MKT Batch 2` (Payment Sandbox)*

| Action ID | Associated Risks | Treatment Action Statement | Classification | Responsible Role | Target Phase |
|---|---|---|---|---|---|
| **TRT-C01** | `RSK-04`, `RSK-16` | Execute concurrency and BOLA contract stress tests on booking and transaction mutation services | `ALREADY_IMPLEMENTED` / `OPERATING_EVIDENCE_NEEDED` | Engineering Lead | `ISO-C2` |
| **TRT-C02** | `RSK-06` | Confirmed DEF-RUNTIME-01: scoped registration guard before expensive effects; Wave 3, separately authorized with runtime promotion | `TECHNICAL_REMEDIATION_NEEDED` | Cloud Ops Lead | `ISO-C2` |
| **TRT-C03** | `RSK-07` | Reuse accepted product-specific authentication/replay fixtures; Xendit is callback-token, not HMAC | `ALREADY_IMPLEMENTED` | Engineering Lead | `ISO-C2` |
| **TRT-C04** | `RSK-14`, `RSK-15` | Secure Xendit live merchant sandbox approval for full end-to-end payment and payout validation | `EXTERNAL_PROVIDER_EVIDENCE_NEEDED` | Finance Lead | `GLOBAL-MKT Batch 2` |

---

### Wave D — SOC / Logging / Monitoring / Incident Management
*Target Phases: `ISO-C2` (Telemetry Hardening), `ISO-C3` (Tabletop Incident Drill)*

| Action ID | Associated Risks | Treatment Action Statement | Classification | Responsible Role | Target Phase |
|---|---|---|---|---|---|
| **TRT-D01** | `RSK-11` | Reuse accepted synthetic telemetry tests; collect operating evidence separately without redundant reruns | `ALREADY_IMPLEMENTED` | SOC Lead | `ISO-C2` |
| **TRT-D02** | `RSK-18` | Determine and document evidence-integrity requirement/acceptance basis; Object.freeze is not a cryptographic checksum and absence alone proves no defect | `DOCUMENTATION_NEEDED` | Engineering Lead | `ISO-C2` |
| **TRT-D03** | `RSK-19` | Inspect existing SecurityEventIngestionFailure/recovery evidence before prescribing a duplicate queue | `ALREADY_IMPLEMENTED / OPERATING_EVIDENCE_NEEDED` | Cloud Ops Lead | `ISO-C2` |
| **TRT-D04** | `RSK-20` | Conduct quarterly SOC alert tuning, rule performance review, and false-positive suppression | `OPERATING_EVIDENCE_NEEDED` | SOC Lead | `ISO-C3` |
| **TRT-D05** | `RSK-20`, `RSK-27` | Conduct structured incident response tabletop simulation (data breach & unauthorized access) | `HUMAN_EVIDENCE_NEEDED` | CISO / SOC Lead | `ISO-C3` |

---

### Wave E — CI/CD / Supply Chain / Cloud / Supplier Oversight
*Target Phases: `ISO-C1` (Supplier Repository), `ISO-C2` (Cloud Audit), `ISO-C3` (Supplier DPA Verification)*

| Action ID | Associated Risks | Treatment Action Statement | Classification | Responsible Role | Target Phase |
|---|---|---|---|---|---|
| **TRT-E01** | `RSK-08`, `RSK-25` | DEF-TOOL-01 local M1 repair accepted; M1-E1 confirms GitHub activation and main protection/required-check configuration gaps. Separately authorize configuration remediation; preserve existing audit exception and gather operating cadence evidence | `GITHUB_CONFIGURATION_REMEDIATION_REQUIRED / OPERATING_EVIDENCE_NEEDED` | Engineering Lead | `ISO-C3` |
| **TRT-E02** | `RSK-09` | Reconcile actual cloud inventory; obtain deployed configuration/drift evidence; no AWS service presumed | `DOCUMENTATION_NEEDED / OPERATING_EVIDENCE_NEEDED` | Cloud Ops Lead | `ISO-C2` |
| **TRT-E03** | `RSK-13`, `RSK-17` | Document fail-closed KYC outage handling; no unauthorized manual identity bypass or alternate provider | `DOCUMENTATION_NEEDED` | Operations Lead | `ISO-C1` |
| **TRT-E04** | `RSK-26` | Collect applicable provider/account/contract/assurance evidence; distinguish planned/historical identities and standard terms | `EXTERNAL_PROVIDER_EVIDENCE_NEEDED` | DPO / Legal Counsel | `ISO-C1` / `ISO-C3` |

---

### Wave F — Backup / Recovery / Business Continuity
*Target Phases: `ISO-C3` (Restore Drills & Disaster Simulation)*

| Action ID | Associated Risks | Treatment Action Statement | Classification | Responsible Role | Target Phase |
|---|---|---|---|---|---|
| **TRT-F01** | `RSK-21`, `RSK-23` | Confirmed DEF-TOOL-02 synthetic harness repair in Wave 2; later actual-provider operating restore exercise requires separate authorization | `TECHNICAL_REMEDIATION_NEEDED / OPERATING_EVIDENCE_NEEDED` | Database Admin | `ISO-C3` |
| **TRT-F02** | `RSK-22` | Obtain actual deployed backup-monitoring/freshness configuration/evidence; absence of CloudWatch export alone establishes no defect | `OPERATING_EVIDENCE_NEEDED` | Cloud Ops Lead | `ISO-C2` |
| **TRT-F03** | `RSK-24` | Plan later authorized continuity exercise for evidenced topology; multi-zone failover not presumed | `HUMAN_EVIDENCE_NEEDED / OPERATING_EVIDENCE_NEEDED` | Cloud Ops Lead | `ISO-C3` |

---

## 4. Current C2-R1 reconciliation (C1 history preserved)

25 existing treatment IDs retained. Accepted C1 historically identified four conditional items: TRT-B01, TRT-C02, TRT-D02, TRT-F02. They are evaluated in the C2 evidence map, not replaced by retention/drift/restore-script inventions. Current confirmed technical actions are TRT-C02 (runtime), TRT-E01 (CI enforcement) and TRT-F01 (assurance harness): three bounded waves. Current row classifications can overlap operating/documentary follow-up; the four historical C1 candidate count is not a current confirmed-defect count.

B01/D02 now require documented requirement/evidence basis; F02 requires operating configuration/monitoring evidence. E02 remains cloud inventory/configuration evidence, not presumed custom script. Retention B05 remains manual/approved deferred. Existing ingestion failure/recovery D03 prevents a duplicate queue prescription. Owner D1 approves treatment, methodology and role accountability; no risk score reduced, no residual accepted, no new named staff assigned. The detailed execution plan and lifecycle impacts are ISO_C2_CONSOLIDATED_REMEDIATION_PLAN.md and ISO_C2_DELTA_IMPACT_MATRIX.md. No treatment or ISO-C3 execution performed.

## Licensed-source boundary

EXACT STANDARD MAPPING — REQUIRES LICENSED STANDARD VERIFICATION. Every edition/clause label is provisional inherited alignment, not verified licensed text or legal conclusions.


## M1-E1 scoped treatment evidence

TRT-E01 RSK-08 local implementation is accepted, but PARTIAL — GITHUB CONFIGURATION REMEDIATION REQUIRED. Source/local acceptance is not rolled back. Main ruleset/protection and a bounded safe workflow activation path require separate authorization; no GitHub settings changed here. No implication of RSK-25 closure or accepted residual risk. See ISO_C2_M1_GITHUB_CI_AND_BRANCH_PROTECTION_EVIDENCE.md.
