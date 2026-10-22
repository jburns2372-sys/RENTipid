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
| **TRT-E01** | `RSK-08`, `RSK-25` | E6-P1 strict map peer prerequisite PASS at official 5.0.5 / React 19.2.4; resume separate E6 Nodemailer remediation. No new advisory package; D3 fix/dispositions preserved. M1 local acceptance and operating conformity remain blocked. See ISO_C2_M1_REACT_SIMPLE_MAPS_REACT19_REMEDIATION.md | `GITHUB_CONFIGURATION_REMEDIATION_REQUIRED / OPERATING_EVIDENCE_NEEDED` | Engineering Lead | `ISO-C3` |
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


## M1-E2 subsequent treatment state

TRT-E01 RSK-08: activation and major main protections implemented; real runs failed, so no operating-conformity acceptance. Required checks/strict enforcement deferred with explicit safe enablement condition in the GitHub evidence report. C: PARTIAL — CONFIGURATION REMEDIATION REMAINS; residual score unchanged/unaccepted. RSK-25 not closed. Next: Authorize a bounded review and remediation of the failed dependency audit and CI baseline/fixture prerequisites.


## M1-E3 treatment state

RSK-08 remains PARTIAL — REMEDIATION IN PROGRESS. No scores or residual acceptance changed; RSK-25 not closed. Local safe dependency candidate is not operating conformity. Exact upstream/compatibility blockers and every audit finding are recorded in ISO_C2_M1_CI_FAILURE_ROOT_CAUSE_AND_REMEDIATION.md. Required-check enforcement and main protections unchanged; no next wave.


## ISO-C2-M1-E6 strict-install blocker (2026-10-22)

E6 BLOCKED: registry-selected Nodemailer 10.2.0 and scoped NextAuth 4.24.15 optional-peer override were attempted without legacy peer mode. Strict resolution and isolated Node 24 npm ci both fail ERESOLVE: react-simple-maps 3.0.0 requires React 16-18; RENTipid pins React 19.2.4. Only attempted E6 dependency edits restored; E5 baseline preserved. Raw baseline audit 0 Critical / 10 High / 19 Moderate; actual local security gate FAIL, effective 0 Critical / 1 High (Nodemailer) / 0 Moderate. No new exceptions. Downstream E6 tests/build/typecheck NOT_RUN at stop condition. RSK-08 remains PARTIAL - REMEDIATION IN PROGRESS, score unchanged, residual not accepted. Owner action: authorize bounded supported map/React peer remediation before resuming E6. No checkpoint/push/deployment/required-check activation. Preview/Production verification remains required later. See [E6 evidence](ISO_C2_M1_NODEMAILER_10X_REMEDIATION_EVIDENCE.md).


## ISO-C2-M1-E6-P1 map peer prerequisite resolved (2026-10-22)

Owner-authorized official react-simple-maps 3.0.0 -> 5.0.5 now explicitly supports retained React/react-dom 19.2.4. Minimal geography interaction-style migration and bundled types replace v3 style/external declarations. Strict Node 24 clean npm ci and npm ls peer validation PASS without legacy mode; real map render/pan/zoom/marker regression 3/3 PASS, typecheck PASS, accepted Webpack production build PASS. Normal Turbopack build fails on the existing parent-root external node_modules junction before app compilation; failure retained. D3 color 3.1.0 security fix preserved. Strict baseline and candidate audits both 0 Critical / 11 High / 20 Moderate, no new advisory package. Existing Nodemailer and propagated NextAuth High remain for separate E6. This supersedes the prior map/React owner-decision blocker only. RSK-08 remains PARTIAL - REMEDIATION IN PROGRESS, residual unchanged/unaccepted; overall M1 local acceptance BLOCKED - NODEMAILER E6 PENDING. No database/migration/seed/deployment/main/check changes. Preview/Production verification REQUIRED LATER. Technical commit b77b9404672583347cf43746af29f67da2a986bd; preserved E6 evidence carried forward in this governance checkpoint. See [P1 evidence](ISO_C2_M1_REACT_SIMPLE_MAPS_REACT19_REMEDIATION.md). Next: RESUME ISO-C2-M1-E6 NODEMAILER REMEDIATION.
