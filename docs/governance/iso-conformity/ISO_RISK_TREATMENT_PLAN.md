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
| **TRT-C02** | `RSK-06` | Remediated DEF-RUNTIME-01: pre-effect registration quota admission check implemented before bcrypt/DB writes; 11/11 targeted tests PASS; zero side effects proven; controlled Production promotion executed (deployment dpl_2733akwjwf1NGvcVGxggoCCUGjuB); below-threshold 201 PASS; over-threshold 429 + Retry-After: 3593 PASS; zero throttled side effects verified on Production; M3 closed | `OPERATING_CONFORMITY_VERIFIED / CLOSED` | Cloud Ops Lead | `ISO-C2` |
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
| **TRT-E01** | `RSK-08`, `RSK-25` | E6-R1 Nodemailer 10.x remediation & local M1 security closure PASS: secure 10.2.0 decoupled via npm alias; NextAuth optional peer satisfied; strict dry-run install PASS; auth/mail tests 146/146 PASS; local security gate PASS (0/0/0 effective blockers); CI/disposition contracts PASS. RSK-08 classified as PROVEN — IMPLEMENTED / OPERATING ENFORCEMENT PENDING until real GitHub CI execution and main branch protections are enforced. See ISO_C2_M1_NODEMAILER_10X_REMEDIATION_EVIDENCE.md | `OPERATING_EVIDENCE_NEEDED` | Engineering Lead | `ISO-C3` |
| **TRT-E02** | `RSK-09` | Reconcile actual cloud inventory; obtain deployed configuration/drift evidence; no AWS service presumed | `DOCUMENTATION_NEEDED / OPERATING_EVIDENCE_NEEDED` | Cloud Ops Lead | `ISO-C2` |
| **TRT-E03** | `RSK-13`, `RSK-17` | Document fail-closed KYC outage handling; no unauthorized manual identity bypass or alternate provider | `DOCUMENTATION_NEEDED` | Operations Lead | `ISO-C1` |
| **TRT-E04** | `RSK-26` | Collect applicable provider/account/contract/assurance evidence; distinguish planned/historical identities and standard terms | `EXTERNAL_PROVIDER_EVIDENCE_NEEDED` | DPO / Legal Counsel | `ISO-C1` / `ISO-C3` |

---

### Wave F — Backup / Recovery / Business Continuity
*Target Phases: `ISO-C3` (Restore Drills & Disaster Simulation)*

| Action ID | Associated Risks | Treatment Action Statement | Classification | Responsible Role | Target Phase |
|---|---|---|---|---|---|
| **TRT-F01** | `RSK-21`, `RSK-23` | Confirmed DEF-TOOL-02 synthetic harness repair in Wave 2; later actual-provider operating restore exercise requires separate authorization | `TECHNICAL_REMEDIATION_NEEDED / OPERATING_EVIDENCE_NEEDED` | Database Admin | `ISO-C3` |
| **TRT-F02** | `RSK-22` | 30-day retention remediated (2,592,000s) on Neon Scale plan; provider-native monitoring workflow (`.github/workflows/backup-freshness-monitor.yml`) active on main (commit `c8a63f3`); runner syntax and provider API access remediated; manual monitor run 40068121351 verified HEALTHY; scheduler actor reactivated via PR #5 (cron `11,26,41,56 * * * *`); >=4 post-reactivation windows elapsed with zero schedule events emitted; GitHub Actions scheduled execution confirmed externally blocked. See ISO_C2_M4_MAIN_ACTIVATION_OPERATING_EVIDENCE.md | `PARTIAL — CONTROL IMPLEMENTED / PROVIDER ACCESS VERIFIED / MANUAL OPERATION VERIFIED / GITHUB SCHEDULED EXECUTION EXTERNALLY BLOCKED` | Cloud Ops Lead | `ISO-C2` |
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

---

## ISO-C2-M1-E6-R1 Nodemailer 10.x remediation & local M1 security closure (2026-10-22)

Direct outbound email upgraded to secure `nodemailer@10.2.0` via npm alias `nodemailer-secure`. NextAuth optional peer constraint cleanly satisfied without `--legacy-peer-deps` or `--force`. Strict clean install PASS, targeted auth/email tests 146/146 PASS, typecheck PASS, Next.js Turbopack build PASS, CI contract 23/23 PASS, audit disposition contract 9/9 PASS. Local security gate PASS (effective 0 Critical / 0 High / 0 Moderate; raw 0 Critical / 9 High / 20 Moderate under authorized dev-only tooling dispositions). RSK-08 classified as PROVEN — IMPLEMENTED / OPERATING ENFORCEMENT PENDING. No residual risk accepted. Real GitHub Actions CI execution and branch protection enforcement remain pending. See [E6-R1 evidence](ISO_C2_M1_NODEMAILER_10X_REMEDIATION_EVIDENCE.md).

## ISO-C2-M1-D2-E7-R6 SOC authorization contract remediation & GitHub CI operating evidence (2026-10-22)

Work Package ISO-C2-M1-D2-E7-R6 resolved the fresh-install SOC API authorization blocker and validated end-to-end GitHub Actions operating evidence. All 64 legacy SQL files retain exact pre-change checksums (64/64 preserved). Fresh-install successor migrations (`20260925000000_add_user_global_preference` and `20261022000000_installation_postgresql_objects`) apply deterministically via the dual-track installer (`db:install`). Investigation of the 7 SOC API failures identified the root cause in `src/lib/security/cases/incident-case-writers.service.ts` (`requireIncidentCasePermission`): headless Jest test harness lacked session AAL2 assurance context (`getCurrentSessionAal2()` returned `null`), denying authorized `SOC_ANALYST` access. Remediated strictly in `tests/security/cases/gate4f-slice-c4-case-api.integration.test.ts` via test harness MFA AAL2 mock without altering production RBAC or introducing any authorization bypass. Targeted case API suite: 57/57 PASS. Local disposable DB reproduction: 57/57 PASS. Local SOC suite: 57/57 PASS. Technical commit `e3b03e7` pushed to `feat/iso-conformity-v1.0`. Real GitHub Actions run `39758791746` (`Security Supply Chain Validation`) completed with SUCCESS across all steps: Node 24 PASS, frozen `npm ci` PASS, dependency audit PASS (effective Critical 0 / High 0), CI enforcement contract 23/23 PASS, ephemeral schema setup PASS, database safety contracts 17/17 PASS, and Focused Tests 57/57 PASS. GLCC operating evidence (`39738923109`) reused / unaffected. See [Operating Evidence](ISO_C2_M1_GITHUB_OPERATING_EVIDENCE.md).

## ISO-C2-M1-E8-R1 Main required-check enforcement & operating conformity verification (2026-10-22)

Work Package ISO-C2-M1-E8-R1 reconciled authoritative technical baseline `e3b03e7d539850f24f3445efe7435b0b27559845` and governance baseline `2525ec4cef851afb14466479c42bbf83ba7343ee`. Reconciled GitHub Actions operating evidence: Security run `39758791746` (conclusion: success, context: `supply-chain-validation`, App ID: 15368) and GLCC run `39738923109` (conclusion: success, context: `Localization Acceptance CI`, App ID: 15368, reused / unaffected). Workflow pull request triggers confirmed on `main` branch with zero deadlock risk. Classic branch protection on `main` was updated via GitHub REST API to strictly require both exact check contexts with `strict: true` (requiring branches to be up to date before merging). Independent API read-back verified: PR requirement ACTIVE (1 approval, stale reviews dismissed, last push approval required), admin enforcement ACTIVE (`enforce_admins: true`), force push and deletion BLOCKED, bypass actors NONE, and both required status checks strictly enforced. RSK-08 classified as **PROVEN — OPERATING CONFORMITY**. Milestone ISO-C2-M1 classified as **PASS — OPERATING CONTROL VERIFIED**. No residual risk accepted. Overall ISO certification is not claimed. See [Enforcement Evidence](ISO_C2_M1_MAIN_REQUIRED_CHECK_ENFORCEMENT.md).

## ISO-C2-M2-D1-E1 Synthetic Recovery Harness Failure Propagation & Measured Evidence (2026-10-22)

Work Package ISO-C2-M2-D1-E1 executed under Project Owner authorization for a narrow reopen of the Phase 5L synthetic recovery surface. Confirmed defect DEF-TOOL-02 was remediated in `scripts/security/phase5l-backup-restore-drill.ts` and `tests/security/resilience/phase5l-backup-restore.test.ts`. External `pg_dump` and `pg_restore` (with `--exit-on-error`) process execution was made fail-closed; error messages and credentials sanitized; and hardcoded success metrics were replaced with real dynamic queries measuring table counts, row counts, financial column totals, foreign key constraints, and orphan relations. Full test battery passed: 23/23 contract and integration tests (including isolated PostgreSQL 16 positive recovery and negative collision tests). Typecheck PASS (0 errors). Technical commit `3d00df1` pushed to `feat/iso-conformity-v1.0`. RSK-21 classified as **PROVEN — IMPLEMENTED** (synthetic recovery assurance verified; provider snapshot/PITR evidence pending). RSK-23 remains **PARTIAL** (synthetic drill passed; real periodic provider restore drill pending). No residual risk accepted. See [M2 Operating Evidence](ISO_C2_M2_SYNTHETIC_RECOVERY_OPERATING_EVIDENCE.md).

## ISO-C2-M4-D1-E1 Automated Backup Freshness & Monitoring Operating Evidence (2026-10-22)

Work Package ISO-C2-M4-D1-E1 executed under Project Owner authorization for read-only operational evidence collection for ISO-C2-M4 / RSK-22 / TRT-F02. Production database provider verified as Neon Serverless PostgreSQL (`holy-shape-01357429`, branch `rentipid-production` / `br-proud-sunset-ap0ofil2`, `aws-us-east-1`, PostgreSQL 17, `protected: true`). Automated backup configuration verified: continuous multi-AZ WAL replication to distributed Safekeepers/Pageservers with continuous Point-In-Time Recovery (PITR) active. History retention window: 21,600 seconds (6 hours). Backup freshness verified: real-time continuous replication (< 1 minute age at observation `2026-10-22T13:03:59Z`). Retention evaluation: PARTIAL (6 hours continuous PITR active; 30-day archival recommended in runbook unconfigured; discrete scheduled snapshots: 0). Proactive failure monitoring and automated alerting: GAP (no automated health monitor or notification channel configured). Operational roles designated as `Database Administrator` and `Cloud Operations Lead` (`REQUIRES HUMAN EVIDENCE` for named assignments). RSK-22 classified as **PARTIAL**. RSK-23 remains **PARTIAL — UNCHANGED** (no restore drill performed or authorized under M4). Zero customer data accessed; zero database, backup, or monitoring configurations modified. No residual risk accepted. See [M4 Operating Evidence](ISO_C2_M4_BACKUP_FRESHNESS_MONITORING_OPERATING_EVIDENCE.md).

## ISO-C2-M4-D4-E2 Backup Monitoring Implementation & Retention Remediation Operating Evidence (2026-10-23)

Work Package ISO-C2-M4-D4-E2 completed the technical implementation of the backup monitoring control (`TRT-F02` / `RSK-22`) from authorized pre-existing WIP. Pinned GitHub Actions workflow `.github/workflows/backup-freshness-monitor.yml`, `scripts/security/backup-monitor-actions.mjs`, and `scripts/security/check-backup-freshness.mjs` implemented and tested with 49/49 contract tests passing (alert state machine, monitor checks, YAML workflow constraints). Evaluates strictly provider-native fields on Neon Control Plane API (`current_state == 'ready'`, `protected == true`, `history_retention_seconds >= 2592000`) and enforces 30-minute monitoring evidence freshness window. Neon project history retention remediated from 6 hours to 30 days (`2,592,000 seconds`) under Scale plan (`scale_v3`) with independent read-back PASS. Dedicated project-scoped automation identity `rentipid-backup-monitoring` (ID 3459133) created and `NEON_API_KEY` stored in GitHub repository secrets. Deduplicated GitHub issue alert mechanism implemented (`[ISO-C2-M4] Production backup/PITR monitoring alert`). Technical candidate `ba0a474` pushed to `feat/iso-conformity-v1.0`. Scheduled workflow execution operates from repository default branch (`main`); promotion to `main` remains required for live scheduled execution. Zero customer data accessed; zero production DB modifications; zero restore/PITR drills executed. RSK-22 classified as **PARTIAL — IMPLEMENTED / RETENTION CORRECTED / SCHEDULED OPERATION PENDING MAIN ACTIVATION**. RSK-23 remains **PARTIAL — UNCHANGED**. No residual risk accepted. See [M4 Implementation Evidence](ISO_C2_M4_BACKUP_MONITORING_IMPLEMENTATION_EVIDENCE.md).

## ISO-C2-M4-D5-E3 M4 Workflow Runner Syntax Remediation & Operating Continuation (2026-10-24)

Work Package ISO-C2-M4-D5-E3 executed under Project Owner authorization to correct the GitHub Actions runner syntax defect (`${{ runner.temp }}` at job env level in `.github/workflows/backup-freshness-monitor.yml`). Technical remediation commit `3108997` replaced the expression with `/tmp/m4-evidence.json` strictly across 1 file. Workflow contract test passed (1/1 PASS). Protected PR #4 created; all required CI passed (`Localization Acceptance CI` 42s, `supply-chain-validation` 1m36s). PR #4 merged into `main` at `53edb1196ecca5faf2323766a323fa0ac1b43960` under authorized sole-maintainer control. Incidental Vercel production deployment `dpl_59VmH5qFsNY8kposzbDnwfJNCa4b` reached Ready with healthy endpoints. Post-fix manual workflow dispatch run 40066228412 executed on runner; step `Collect provider evidence` exited with code 1 due to `failure_reason: API_UNAVAILABLE` on Neon API; fail-closed monitor actions script updated open alert Issue #3 and exited 1. Under Step 17 hard stop rules, execution stopped without modifying any other technical files. RSK-22 classified as **PARTIAL — IMPLEMENTED / RETENTION CORRECTED / WORKFLOW REMEDIATED / PROVIDER API UNAVAILABLE**. RSK-23 remains **PARTIAL — UNCHANGED**. No residual risk accepted. Overall ISO certification is not claimed. See [M4 Operating Evidence](ISO_C2_M4_MAIN_ACTIVATION_OPERATING_EVIDENCE.md).

---

## ISO-C2-M4-D5-E4 Neon Provider API Access Diagnosis, Credential Remediation & Operating Evidence (2026-10-24)

Work Package ISO-C2-M4-D5-E4 executed under Project Owner authorization to diagnose and remediate provider API access in the M4 backup freshness monitoring automation. Sanitized diagnostics on failed run 40066228412 confirmed step `Collect provider evidence` failed in 53ms (`failure_reason: API_UNAVAILABLE`). Live Neon control plane inspection confirmed project `holy-shape-01357429` active on Scale plan (`scale_v3`), `history_retention_seconds: 2592000` (30 days), and production branch `br-proud-sunset-ap0ofil2` in state `ready` with `protected: true`. Safe in-memory read-only API diagnostic confirmed live project and branch endpoints return HTTP 200 OK with compliant schemas, proving script request construction in `scripts/security/check-backup-freshness.mjs` is 100% valid with zero source changes required (`SOURCE CHANGE REQUIRED: NO`). Minted replacement project-scoped key `rentipid-backup-monitoring-v1` (ID `3461258`) restricted strictly to target project `holy-shape-01357429`, verified in memory, installed directly into GitHub repository secret `NEON_API_KEY` via stdin, and revoked superseded key `3459133`. Post-remediation manual workflow dispatch run 40068121351 executed on `main`: step `Collect provider evidence` PASSED with status `HEALTHY` (project match: true, branch match: true, state: ready, protected: true, retention: 2592000s compliant). Step `Enforce evidence freshness and reconcile incident` evaluated `evidence_freshness_status: MISSING` pending initial automated cron execution. Scheduled run observation: PENDING. Zero customer data accessed; zero database modifications; zero restore/PITR drills executed. RSK-22 classified as **PARTIAL — IMPLEMENTED / RETENTION CORRECTED / PROVIDER ACCESS VERIFIED / MANUAL OPERATION VERIFIED / SCHEDULED EVIDENCE PENDING**. RSK-23 remains **PARTIAL — UNCHANGED**. No residual risk accepted. See [M4 Operating Evidence](ISO_C2_M4_MAIN_ACTIVATION_OPERATING_EVIDENCE.md).

---

## ISO-C2-M4-D5-E7 GitHub Scheduled-Workflow Actor Reactivation & Operating Evidence (2026-10-24)

Work Package ISO-C2-M4-D5-E7 executed under Project Owner authorization to address the absence of real GitHub Actions `schedule` events over >=4 elapsed 15-minute cron boundaries (`06:07`, `06:22`, `06:37`, `06:52 UTC`) following successful manual monitor verification and provider credential rotation. Applied GitHub-documented scheduled-workflow actor reactivation by updating the cron expression in `.github/workflows/backup-freshness-monitor.yml` from `'7,22,37,52 * * * *'` to `'11,26,41,56 * * * *'`, preserving the exact 15-minute cadence (4 executions per hour). Updated `tests/security/iso-c2-m4-workflow.contract.cjs` to reflect the updated schedule string without weakening validation (1/1 PASS; monitor contract 38/38 PASS). Technical commit `e51191306ec711800fa83273ad86a15d84624640` pushed to `iso-c2-m4-scheduler-actor-reactivation` and opened PR #5. Required CI passed cleanly (`Localization Acceptance CI` 48s, `supply-chain-validation` 1m45s). PR #5 merged into `main` at `c8a63f3541132ec151f28a79577adaa142c0bcf5` under authorized sole-maintainer control (no branch protection bypass). Workflow on `main` re-verified active with 15-minute cadence. Post-reactivation scheduled execution observation: PENDING. Zero customer data accessed; zero database modifications; zero restore/PITR drills executed. RSK-22 classified as **PARTIAL — IMPLEMENTED / RETENTION CORRECTED / PROVIDER ACCESS VERIFIED / MANUAL OPERATION VERIFIED / SCHEDULER ACTOR REACTIVATED / SCHEDULED EVIDENCE PENDING**. RSK-23 remains **PARTIAL — UNCHANGED**. No residual risk accepted. See [M4 Operating Evidence](ISO_C2_M4_MAIN_ACTIVATION_OPERATING_EVIDENCE.md).

---

## ISO-C2-M4-D5-E7-R3 Post-Reactivation Observation & Confirmed External Scheduler Blocker (2026-10-24)

Work Package ISO-C2-M4-D5-E7-R3 executed under Project Owner authorization for decisive four-window observation following scheduler actor reactivation PR #5 merge into `main` (`c8a63f3541132ec151f28a79577adaa142c0bcf5`, cron `11,26,41,56 * * * *`). Four full post-reactivation cron boundaries elapsed (`07:26`, `07:41`, `07:56`, `08:11 UTC` / `15:26`, `15:41`, `15:56`, `16:11 PHT`). Verification via CLI and GitHub Actions API confirmed 0 qualifying `schedule` events emitted. Confirmed `SCHEDULER EXTERNAL BLOCKER: CONFIRMED`. Milestone ISO-C2-M4 classified as **BLOCKED — GITHUB SCHEDULED EXECUTION NOT EMITTED AFTER CADENCE-PRESERVING ACTOR REACTIVATION**. RSK-22 / TRT-F02 classified as **PARTIAL — CONTROL IMPLEMENTED / PROVIDER ACCESS VERIFIED / MANUAL OPERATION VERIFIED / GITHUB SCHEDULED EXECUTION EXTERNALLY BLOCKED**. RSK-23 remains **PARTIAL — UNCHANGED**. No technical churn permitted. Next action: `ISO-C2-M4 ALTERNATE SCHEDULING CONTROL DECISION`. See [M4 Evidence](ISO_C2_M4_MAIN_ACTIVATION_OPERATING_EVIDENCE.md).







