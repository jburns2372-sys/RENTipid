# RENTipid ISO Compliance & Conformity Master Ledger

**Document ID:** `RENTIPID-ISO-CONFORMITY-001-ML`  
**Program:** RENTipid ISO Compliance & Conformity Program  
**Project ID:** `RENTIPID-ISO-CONFORMITY-001`  
**Version:** `v1.0`  
**Operating Model:** Antigravity / Gemini 3.8 Flash High (Primary Analysis & Governance) + Codex (Deterministic Technical Verification, Remediation & Testing)  
**Status:** `ACTIVE — CONFORMITY BASELINE ESTABLISHED`  

---

## 1. Program Objective

The program objective moves RENTipid beyond mere ISO readiness into demonstrable ISO compliance and conformity.

> **Controlling Objective:**  
> Design, implement, operate, verify, evidence, internally audit, correct, and maintain the RENTipid management system so that all applicable requirements and controls within the approved certification scope demonstrably conform to the targeted ISO standards and are capable of successful independent certification assessment.

### Target Standards
* **Primary Certification Targets:**
  * **ISO/IEC 27001: 2022** (with Amendment 1: 2024) — Information security management systems
  * **ISO/IEC 27701: 2019** — Privacy information management systems (PIMS extension)
* **Supporting Alignment Targets:**
  * **ISO/IEC 27017: 2015** — Cloud security controls
  * **ISO/IEC 27018: 2019** — Protection of PII in public clouds
  * **ISO 22301: 2019** — Business continuity management systems
  * **ISO/IEC 20000-1: 2018** — Information technology service management
  * **ISO 9001: 2015** — Quality management systems

*Certification Notice:* This program establishes internal conformity and certification readiness. It does not itself constitute third-party ISO certification. Certification claims may not be made until an accredited certification body has conducted Stage 1 and Stage 2 audits and formally rendered a certification decision.

---

## 2. Proposed Certification Scope

> "Design, development, operation, maintenance, security, privacy management, support, and continual improvement of the RENTipid global rental marketplace and its supporting information systems, cloud infrastructure, data processing services, and relevant operational processes."

This scope is controlled. Any proposed variation or boundary reduction requires explicit Project Owner authorization.

---

## 3. Controlling Promotion Pipeline & Lifecycle

All work packages under this program operate under the RENTipid mandatory lifecycle:

$$\text{CODE COMPLETE} \rightarrow \text{LOCAL FUNCTIONAL} \rightarrow \text{LOCAL DB MIGRATED} \rightarrow \text{LOCAL DATA SEEDED/SYNCED} \rightarrow \text{LOCAL ACCEPTANCE}$$
$$\downarrow$$
$$\text{PREVIEW MIGRATED} \rightarrow \text{PREVIEW ACCEPTANCE} \rightarrow \text{PRODUCTION-READY} \rightarrow \text{PRODUCTION DEPLOYMENT/VERIFICATION}$$
$$\downarrow$$
$$\text{COMPLETED} \rightarrow \text{ACCEPTED} \rightarrow \text{CLOSED} \rightarrow \text{VERSION FROZEN}$$

### Non-Repetition & Delta Evidence Rule
A gate does not require re-execution if it was already passed, accepted, and remains unaffected by the current delta. In that case, it is satisfied by inherited evidence and recorded as:
`PASS — REUSED / UNAFFECTED`

Only the minimum affected chain is reopened if current evidence shows a real delta that invalidates prior acceptance. For documentation/governance packages (such as ISO-C0), deployment gates are formally recorded as `N/A — NOT APPLICABLE`.

---

## 4. Expedited Combined-Phase Master Roadmap

| Phase | Combined Scope | Core Purpose | Phase Gate | Status |
|---|---|---|---|---|
| **ISO-C0** | Migration + Scope + Governance + Evidence Inheritance | Migrate prior ISO readiness baseline into conformity program; establish scope, boundaries, document control, evidence inheritance ledger, and conformity status model. | `CONFORMITY BASELINE ESTABLISHED` | **PASS (Accepted at 2e9b0b8)** |
| **ISO-C1** | Integrated Risk + SoA + Asset/Data/PII/Supplier Baseline | Combine risk methodology, risk register, treatment plan, Statement of Applicability (SoA), asset inventory, data/PII flows, supplier/subprocessor inventory, and legal/privacy obligations. | `RISK / SoA / INFORMATION BASELINE ACCEPTED` | **PASS (Accepted after ISO-C1-R1 documentary corrections)** |
| **ISO-C2** | Technical + Privacy + Cloud + SDLC Conformity Verification & Remediation | Verify application, privacy, cloud, CI/CD, secure-SDLC, and change-control evidence. Reuse accepted GLOBAL-MKT/SOC evidence. Grouped corrective waves where real defects exist. | `TECHNICAL / PRIVACY / CLOUD / SDLC CONFORMITY PASS` | PLANNED |
| **ISO-C3** | Operational Security + Human Controls + Incident + BC/DR + Supplier Operations | Prove controls operate in practice: access reviews, monitoring, vulnerabilities, patch/change records, training/awareness, supplier reviews, backup/restore, and BCDR exercises. | `OPERATING CONFORMITY PASS` | PLANNED |
| **ISO-C4** | Environment Promotion + Preview/Production Conformity Acceptance | For code/config/schema delta from ISO-C2/C3, execute affected lifecycle gates through Preview and Production. Verify exact candidate SHAs and environment evidence. | `PRODUCTION CONFORMITY BASELINE VERIFIED` | PLANNED |
| **ISO-C5** | Internal Audit + Consolidated CAPA + Management Review | Antigravity conducts comprehensive internal audit; Codex verifies technical claims. Complete audit, consolidate findings into CAPA waves, close nonconformities, conduct management review. | `INTERNAL AUDIT CLOSED / MANAGEMENT REVIEW COMPLETE` | PLANNED |
| **ISO-C6** | Final Internal Conformity + Acceptance + Close/Freeze + Certification Handoff | Reconcile all applicable controls and evidence, verify no unresolved major blocker, compile final internal conformity report, obtain Project Owner acceptance, freeze baseline, prepare Stage 1 package. | `COMPLETED -> ACCEPTED -> CLOSED -> VERSION FROZEN` | PLANNED |

---

## 5. Relationship to GLOBAL-MKT v2.0 & Parallel Workstreams

* **Workstream Separation:** `RENTIPID-ISO-CONFORMITY-001` and `GLOBAL-MKT v2.0` remain independent workstreams.
* **Evidence Reuse:** ISO Conformity inspects and reuses accepted GLOBAL-MKT artifacts (e.g., 46-country compliance matrix, cross-border traces, provider gaps) without altering application behavior or reopening frozen country batches.
* **External Blocker Priority:** When Xendit account approval is granted, GLOBAL-MKT real sandbox payment/payout validation takes priority at a controlled checkpoint. ISO Conformity then absorbs the resulting operational evidence without restarting earlier phases.
* **Frozen Baseline Invariance:** Application source code, database schemas, and frozen modules remain immutable unless explicitly reopened by Project Owner-authorized change control.

---

## 6. Project Owner Decision Authority Gates

Routine technical and documentary activities advance automatically upon verifiable gate PASS. Project Owner approval is mandatory for:
1. Certification scope modifications.
2. Material residual risk acceptances or security policy exceptions.
3. Formal legal and privacy interpretations.
4. Material architecture or production-security configuration adjustments.
5. Commercial engagements with external certification bodies.
6. Final internal conformity acceptance immediately prior to `COMPLETED -> ACCEPTED -> CLOSED -> VERSION FROZEN`.

---

## 7. Baseline Tracking Ledger

* **Repository:** `RENTipid-GLOBAL-MKT-V2`
* **Source Branch:** `feat/global-mkt-v2.0`
* **Conformity Branch:** `feat/iso-conformity-v1.0`
* **Accepted Predecessor Baseline SHA:** `2e9b0b8c38d6822c6bad126ffa70939475870be5`
* **Application Baseline SHA:** `83b8f4dabadc243b01ab8e5f50746bf281ecf62b`
* **Governance Predecessor SHA:** `2e9b0b8c38d6822c6bad126ffa70939475870be5`
* **Active Phase:** `ISO-C1`
* **Phase Result:** `PASS`
* **Next Package if separately authorized:** `ISO-C2` (NOT STARTED)

## 8. ISO-C0-R1 independent review disposition

PASS after documentation-only corrections. Inherited items: 24; reused unchanged: 24. Assessed domains: 30; operating: 2; implemented: 12; partial: 7; unapproved technical gaps: 0; human evidence: 7; provider evidence: 2. See control baseline for exact domain IDs and inheritance register for pinned sources and limitations. Governance-only acceptance does not certify ISO conformity, approve legal conclusions, alter scope, accept new residual risks, or initiate ISO-C1.

## 9. ISO-C1-R1 accepted documentary baseline

assetsRegistered: 25; dataCategoriesRegistered: 21; suppliersRegistered: 10; risksRegistered: 30; lowRisks: 6; moderateRisks: 9; highRisks: 15; criticalRisks: 0; riskAcceptanceRequiringProjectOwner: 15; soaApplicable: 32; soaNotApplicable: 0; technicalRemediationItemsIdentified: 4; humanOrganizationalActionsIdentified: 5; externalLegalActionsIdentified: 3. Treatment actions: 25. Core domains remain 30 (2 operating, 12 implemented, 7 partial, 0 gaps, 7 human, 2 provider). The 32 applicable SoA rows are 30 core plus 2 supporting obligations; no exclusions approved. Four technical candidates are conditional, not proven new defects or authority to implement. Scores are conservative assessment estimates, not human acceptance. C1 documentary acceptance does not accept risks, execute treatment, freeze version or start C2.

## 10. Project Owner Decision — ISO-C1 Risk Treatment Authorization (2026-10-22)

APPROVED. The Project Owner formally rendered the risk treatment decision on October 22, 2026:
1. Authorized **TREATMENT, not risk acceptance**, for all 15 designated risks: `RSK-03`, `RSK-05`, `RSK-06`, `RSK-08`, `RSK-09`, `RSK-12`, `RSK-14`, `RSK-15`, `RSK-17`, `RSK-21`, `RSK-22`, `RSK-23`, `RSK-24`, `RSK-26`, `RSK-30`.
2. Explicitly determined that **no residual risk is accepted at this stage**.
3. Mandated that `ISO-C2` verify existing controls first and reuse accepted evidence where unaffected.
4. Mandated that risks requiring remediation proceed through the minimum affected implementation and validation chain.
5. Confirmed that existing approved deferrals remain valid only within their documented scope and do not constitute blanket acceptance.
6. Approved the current ISO conformity risk-assessment convention (`ISO_RISK_METHODOLOGY.md`) for continued use.
7. Approved role-based accountability assignments (`ISO_CONTROL_OWNERSHIP_MATRIX.md`).
8. Reaffirmed the controlling Non-Repetition Rule (`PASS — REUSED / UNAFFECTED`).
See controlled decision record: `PROJECT_OWNER_DECISION_ISO_C1_RISK_TREATMENT.md`.


## 11. ISO-C1-D1 independent review and checkpoint boundary

Owner decision source: Project Owner instruction dated 2026-10-22; accepted C1 predecessor `a6c6258cc6606c04d2a24574cb1f9f06d09c2aea`. Codex independently verified exactly the 15 risk IDs in PROJECT_OWNER_DECISION_ISO_C1_RISK_TREATMENT.md, zero residual acceptance, unchanged risk scores and unchanged core-domain maturity. Methodology and role-based accountability are approved; named-person allocation remains required where not evidenced. Risk reduction/reclassification requires new evidence and the minimum affected lifecycle chain only. The controlling non-repetition rule remains PASS — REUSED / UNAFFECTED. Lifecycle dispositions for this decision delta are recorded in that decision document Section 4. D1 documentary review/acceptance/closure does not close risks, complete conformity, certify ISO, freeze version or start ISO-C2. No technical gate rerun or remediation performed.

## 12. ISO-C2-R1 verification checkpoint

Verification ACCEPTED after evidence corrections at base 47f54aae5bfc99b7ba97f94347c7bfb232627a5a. Current 30-domain distribution: 2 operating, 11 implemented, 8 partial, 0 wholly absent control domains, 7 human and 2 provider; CTRL-10 downgraded for current CI enforcement defect. Four areas: Technical 1/6/3/0, Privacy 0/3/2/0, Cloud 0/0/1/0, SDLC 1/2/2/0 (operating/implemented/partial/gap). Confirmed defects: 1 runtime, 2 tooling, 0 deployed configuration. Primary risk evidence counts: 2 operating gaps, 2 documentation gaps, 2 human gaps, 6 external/legal; one further documentation candidate RSK-18 yields 3 deduplicated documentation gaps. All 15 treatment-authorized risks reviewed, no score changes or residual acceptance. Three bounded future waves, next only ISO-C2-M1 — CI GATE ENFORCEMENT + EXECUTION RUNTIME ALIGNMENT, subject to separate execution instruction. No remediation/deployment/freeze or ISO-C3; historical C0/C1/D1 records remain historical.


## 13. ISO-C2-M1 local technical checkpoint

Project Owner authorized first eligible technical wave only from 999af0e. DEF-TOOL-01 / RSK-08 locally repaired at d012cdb982f86b34a3d7ed306743dc222584a287; 23 targeted Node 24 checks passed. No runtime/DB/deployment delta. Other accepted gates reused as recorded in ISO_CONFORMITY_GATE_LEDGER.md. RSK-08 remains PARTIAL with unchanged risk score and open remote CI/branch-protection/cadence evidence. No residual acceptance, overall closure, ISO-C3, next wave, tag or freeze. See ISO_C2_M1_COMPLETION_REPORT.md.


## 14. ISO-C2-M1-E1 GitHub enforcement evidence

Authenticated operating-evidence collection completed with package BLOCKED. Required branch and baseline commits verified remotely. M1 workflow design remains implemented; zero qualifying GitHub runs, no workflow_dispatch, default main has only Azure deployment workflow. main and all inventoried branches unprotected; repository/inherited rulesets and main applicable rules empty. RSK-08: PARTIAL — GITHUB CONFIGURATION REMEDIATION REQUIRED; residual score unchanged and unaccepted. No next wave, deployment, settings mutation or freeze. See ISO_C2_M1_GITHUB_CI_AND_BRANCH_PROTECTION_EVIDENCE.md. Next action: Authorize a bounded M1 CI activation and main-branch protection remediation package.


## 15. ISO-C2-M1-E2 activation and main protection

Owner-authorized two-line workflow activation at 98494bf8cc17dd9bb798bb6deb06065d81079035 produced actual failed runs 39658807274 (security) and 39658807135 (GLCC). Node 24 and audit fail-closed propagation verified. Non-check main protections applied and separately read back; main unmerged. Required checks/strict mode deliberately deferred: M1 absent from main and no successful candidate contexts. Package FAIL, configuration/evidence review complete. RSK-08 PARTIAL — CONFIGURATION REMEDIATION REMAINS; score unchanged, residual not accepted. No application/DB/deployment/next-wave changes. See ISO_C2_M1_GITHUB_CI_AND_BRANCH_PROTECTION_EVIDENCE.md. Next: Authorize a bounded review and remediation of the failed dependency audit and CI baseline/fixture prerequisites.


## 16. ISO-C2-M1-E3 partial bounded remediation

Actual original failed logs inspected; audit reproduced all 65 package entries. Safe dependency candidate clears criticals and 49 original package entries, but 14 high/19 moderate remain across five chains, including unpatched braces/sprintf-js and three major compatibility paths. GLCC CI now references accepted current in-memory regression, not obsolete pre-P11 expectations. Frozen source unchanged; local functional/build/typecheck checks pass. Package BLOCKED, local security acceptance FAIL, runtime Preview/Production revalidation required later. No checkpoint/push, main protection/check change, deployment, risk acceptance or next wave. See ISO_C2_M1_CI_FAILURE_ROOT_CAUSE_AND_REMEDIATION.md.


## ISO-C2-M1-E6 strict-install blocker (2026-10-22)

E6 BLOCKED: registry-selected Nodemailer 10.2.0 and scoped NextAuth 4.24.15 optional-peer override were attempted without legacy peer mode. Strict resolution and isolated Node 24 npm ci both fail ERESOLVE: react-simple-maps 3.0.0 requires React 16-18; RENTipid pins React 19.2.4. Only attempted E6 dependency edits restored; E5 baseline preserved. Raw baseline audit 0 Critical / 10 High / 19 Moderate; actual local security gate FAIL, effective 0 Critical / 1 High (Nodemailer) / 0 Moderate. No new exceptions. Downstream E6 tests/build/typecheck NOT_RUN at stop condition. RSK-08 remains PARTIAL - REMEDIATION IN PROGRESS, score unchanged, residual not accepted. Owner action: authorize bounded supported map/React peer remediation before resuming E6. No checkpoint/push/deployment/required-check activation. Preview/Production verification remains required later. See [E6 evidence](ISO_C2_M1_NODEMAILER_10X_REMEDIATION_EVIDENCE.md).


## ISO-C2-M1-E6-P1 map peer prerequisite resolved (2026-10-22)

Owner-authorized official react-simple-maps 3.0.0 -> 5.0.5 now explicitly supports retained React/react-dom 19.2.4. Minimal geography interaction-style migration and bundled types replace v3 style/external declarations. Strict Node 24 clean npm ci and npm ls peer validation PASS without legacy mode; real map render/pan/zoom/marker regression 3/3 PASS, typecheck PASS, accepted Webpack production build PASS. Normal Turbopack build fails on the existing parent-root external node_modules junction before app compilation; failure retained. D3 color 3.1.0 security fix preserved. Strict baseline and candidate audits both 0 Critical / 11 High / 20 Moderate, no new advisory package. Existing Nodemailer and propagated NextAuth High remain for separate E6. This supersedes the prior map/React owner-decision blocker only. RSK-08 remains PARTIAL - REMEDIATION IN PROGRESS, residual unchanged/unaccepted; overall M1 local acceptance BLOCKED - NODEMAILER E6 PENDING. No database/migration/seed/deployment/main/check changes. Preview/Production verification REQUIRED LATER. Technical commit b77b9404672583347cf43746af29f67da2a986bd; preserved E6 evidence carried forward in this governance checkpoint. See [P1 evidence](ISO_C2_M1_REACT_SIMPLE_MAPS_REACT19_REMEDIATION.md). Next: RESUME ISO-C2-M1-E6 NODEMAILER REMEDIATION.

---

## 17. ISO-C2-M1-E6-R1 Nodemailer 10.x remediation & local M1 security closure

Completed under primary execution of Antigravity / Gemini 3.8 Flash High. Successfully decoupled and upgraded direct outbound email to official secure `nodemailer@10.2.0` (using npm alias `nodemailer-secure`), resolved the NextAuth 4.24.15 optional peer boundary without legacy flags or force, and hardened SMTP configuration with Zod recipient parsing and resource limits. Full test battery passed: 146/146 targeted auth/email tests, typecheck (0 errors), Next.js Turbopack production build, 23/23 CI contract assertions, and 9/9 audit disposition contract assertions. Raw audit: 0 Critical / 9 High / 20 Moderate (total 29 in dev/tooling with governed dispositions); local security gate effective blockers: 0 Critical / 0 High / 0 Moderate. M1 LOCAL ACCEPTANCE: PASS — EXECUTED. RSK-08 classified as PROVEN — IMPLEMENTED / OPERATING ENFORCEMENT PENDING pending real GitHub CI execution and main required checks.

## ISO-C2-M1-D2-E7-R6 SOC authorization contract remediation & GitHub CI operating evidence (2026-10-22)

Work Package ISO-C2-M1-D2-E7-R6 resolved the fresh-install SOC API authorization blocker and validated end-to-end GitHub Actions operating evidence. All 64 legacy SQL files retain exact pre-change checksums (64/64 preserved). Fresh-install successor migrations (`20260925000000_add_user_global_preference` and `20261022000000_installation_postgresql_objects`) apply deterministically via the dual-track installer (`db:install`). Investigation of the 7 SOC API failures identified the root cause in `src/lib/security/cases/incident-case-writers.service.ts` (`requireIncidentCasePermission`): headless Jest test harness lacked session AAL2 assurance context (`getCurrentSessionAal2()` returned `null`), denying authorized `SOC_ANALYST` access. Remediated strictly in `tests/security/cases/gate4f-slice-c4-case-api.integration.test.ts` via test harness MFA AAL2 mock without altering production RBAC or introducing any authorization bypass. Targeted case API suite: 57/57 PASS. Local disposable DB reproduction: 57/57 PASS. Local SOC suite: 57/57 PASS. Technical commit `e3b03e7` pushed to `feat/iso-conformity-v1.0`. Real GitHub Actions run `39758791746` (`Security Supply Chain Validation`) completed with SUCCESS across all steps: Node 24 PASS, frozen `npm ci` PASS, dependency audit PASS (effective Critical 0 / High 0), CI enforcement contract 23/23 PASS, ephemeral schema setup PASS, database safety contracts 17/17 PASS, and Focused Tests 57/57 PASS. GLCC operating evidence (`39738923109`) reused / unaffected. See [Operating Evidence](ISO_C2_M1_GITHUB_OPERATING_EVIDENCE.md).

## ISO-C2-M1-E8-R1 Main required-check enforcement & operating conformity verification (2026-10-22)

Work Package ISO-C2-M1-E8-R1 reconciled authoritative technical baseline `e3b03e7d539850f24f3445efe7435b0b27559845` and governance baseline `2525ec4cef851afb14466479c42bbf83ba7343ee`. Reconciled GitHub Actions operating evidence: Security run `39758791746` (conclusion: success, context: `supply-chain-validation`, App ID: 15368) and GLCC run `39738923109` (conclusion: success, context: `Localization Acceptance CI`, App ID: 15368, reused / unaffected). Workflow pull request triggers confirmed on `main` branch with zero deadlock risk. Classic branch protection on `main` was updated via GitHub REST API to strictly require both exact check contexts with `strict: true` (requiring branches to be up to date before merging). Independent API read-back verified: PR requirement ACTIVE (1 approval, stale reviews dismissed, last push approval required), admin enforcement ACTIVE (`enforce_admins: true`), force push and deletion BLOCKED, bypass actors NONE, and both required status checks strictly enforced. RSK-08 classified as **PROVEN — OPERATING CONFORMITY**. Milestone ISO-C2-M1 classified as **PASS — OPERATING CONTROL VERIFIED**. No residual risk accepted. Overall ISO certification is not claimed. See [Enforcement Evidence](ISO_C2_M1_MAIN_REQUIRED_CHECK_ENFORCEMENT.md).

## 18. ISO-C2-M2-D1-E1 Synthetic Recovery Harness Failure Propagation & Measured Evidence (2026-10-22)

Completed under primary execution of Antigravity / Gemini 3.8 Flash High. Remediated DEF-TOOL-02 within narrow authorized reopen of Phase 5L synthetic recovery surface. Replaced failure-swallowing `pg_restore` logic and hardcoded zero-difference metrics in `scripts/security/phase5l-backup-restore-drill.ts` and `tests/security/resilience/phase5l-backup-restore.test.ts` with fail-closed command execution, error sanitization, and dynamic multi-dimensional validation queries (tables, rows, financial sums, foreign keys, orphans, hash fingerprints). Validated via 23/23 Jest tests including isolated PostgreSQL 16 container positive recovery (0 differences measured across 85 rows and 2,725,000.00 financial total) and negative deterministic failure propagation (exit code 1 on relation collision). Disposable fixtures cleaned. Typecheck PASS (0 errors). Technical commit `3d00df1` pushed to `feat/iso-conformity-v1.0`. RSK-21 classified as **PROVEN — IMPLEMENTED** (synthetic recovery assurance verified; provider snapshot/PITR evidence pending). RSK-23 remains **PARTIAL** (synthetic drill passed; live provider restore drill pending). Phase 5L reopen closed and refrozen. No residual risk accepted. Overall ISO certification is not claimed. See [M2 Operating Evidence](ISO_C2_M2_SYNTHETIC_RECOVERY_OPERATING_EVIDENCE.md).

## 19. ISO-C2-M3-D1-E1 Registration Pre-Effect Rate Limiting Implementation & Promotion Readiness (2026-10-22)

Completed under primary execution of Antigravity / Gemini 3.8 Flash High. Remediated DEF-RUNTIME-01 / TRT-C02 within authorized Wave 3 scope. Implemented pre-effect rate limiting admission check on `POST /api/auth/register` in `src/app/api/auth/register/route.ts` and `src/lib/auth/unified/rate-limiter.ts`. Admission evaluation strictly precedes expensive password hashing (`bcrypt.hash(password, 10)`), database read lookup (`prisma.user.findUnique`), and transactional account writes (`prisma.$transaction`). Reused existing `"AuthRateLimit"` PostgreSQL table; schema and reference data seeds remain unchanged. Built dual-dimension rate limiting (IP and normalized email) with pseudonymous HMAC-SHA256 reference hashes (zero raw PII stored) and reverse-proxy spoofing defenses. Enforced fail-closed behavior on limiter backend failure. Validated via 11/11 contract tests (`tests/auth/registration-rate-limiter.test.ts`), proving zero bcrypt hashing, zero database writes, zero audit logs, and zero emails dispatched on throttled or error requests. Shared auth tests (15/15) and MFA limiter tests (4/4) PASS. Typecheck PASS (0 errors). Technical commit `dca5479` pushed to `feat/iso-conformity-v1.0`. RSK-06 classified as **PROVEN — IMPLEMENTED** (residual score 6 MODERATE). Controlled Preview promotion requires separate authorization before runtime deployment. No residual risk accepted. Overall ISO certification is not claimed. See [M3 Evidence](ISO_C2_M3_REGISTRATION_PRE_EFFECT_RATE_LIMITING_EVIDENCE.md).

## 20. ISO-C2-M3-D2-E2 Controlled Preview Promotion & Registration Rate-Limit Runtime Verification (2026-10-22)

Completed under primary execution of Antigravity / Gemini 3.8 Flash High. Executed under explicit Project Owner authorization for controlled Preview promotion and runtime verification of ISO-C2-M3. Technical candidate `dca5479` / deployment `7251560631` (`710122f`) was verified active on Vercel Preview (`https://ren-tipid-mc05sddzv-jburns2372-sys-projects.vercel.app`) targeting isolated non-production Neon Preview branch `rentipid-listingbridge-preview` (`holy-shape-01357429`). Zero schema migrations were required (`PASS — REUSED / UNAFFECTED`). Executed bounded runtime verification using synthetic identity `iso-c2-m3-preview-1792671679111@example.invalid`: below-threshold Attempt 1 returned `201 Created` with expected contract; in-quota Attempts 2-5 returned `409 Conflict` (limiter allowed; duplicate user detected by downstream logic) with counter predictably incrementing in PostgreSQL `"AuthRateLimit"`; over-threshold Attempt 6 returned `429 Too Many Requests` with header `Retry-After: 3546` and sanitized response body. Proved zero side effects on blocked request: 0 user records created, 0 credentials created, 0 profiles created, 0 password hashes computed, 0 audit logs written, 0 emails dispatched, 0 sessions created. PostgreSQL `"AuthRateLimit"` backend confirmed; HMAC-SHA256 pseudonymous keys confirmed with zero raw PII stored; zero secrets exposed; Production environment and database untouched. RSK-06 classified as **PROVEN — IMPLEMENTED / PREVIEW VERIFIED**. Milestone ISO-C2-M3 Preview acceptance: **PASS — EXECUTED**. Production promotion requires separate Project Owner authorization. No residual risk accepted. Overall ISO certification is not claimed. See [M3 Evidence](ISO_C2_M3_REGISTRATION_PRE_EFFECT_RATE_LIMITING_EVIDENCE.md).

## 21. ISO-C2-M3-D3-E3 Controlled Production Promotion & Operating Verification (2026-10-22)

Completed under primary execution of Antigravity / Gemini 3.8 Flash High. Executed under explicit Project Owner authorization for controlled Production promotion and operating verification of ISO-C2-M3. Exact accepted technical candidate `dca547904791535ca44485747065961dbf8fc421` (source deployment `dpl_HqiN1awwSPk3VkGYzfoiPaeJ1nR7` / `7251560631`) was promoted to Production via Vercel Production Promotion. Resulting Production deployment `dpl_2733akwjwf1NGvcVGxggoCCUGjuB` was verified `● Ready` with direct URL `https://ren-tipid-cjeiwwle4-jburns2372-sys-projects.vercel.app` and canonical aliases `https://ren-tipid-jburns2372-sys-projects.vercel.app` and `https://www.rentipid.com.ph`. Main merge was not required and not performed. Target database is Neon PostgreSQL branch `rentipid-production` (`holy-shape-01357429` / `br-proud-sunset-ap0ofil2`). Production database migration: `N/A — NOT REQUIRED / NO SCHEMA CHANGE`. Health check verified `HTTP 200 OK`, `{"status":"ready","database":"connected"}`. Bounded runtime verification executed using synthetic identity `iso-c2-m3-prod-1792672640027@example.invalid`: below-threshold Attempt 1 returned `201 Created` with expected contract (duration: 2627ms); in-quota Attempts 2-5 returned `409 Conflict` (limiter allowed; duplicate user detected by downstream logic) with points accumulating in PostgreSQL `"AuthRateLimit"`; over-threshold Attempt 6 returned `429 Too Many Requests` with header `Retry-After: 3593` and sanitized message (duration: 539ms). Proved zero side effects on blocked request: 0 user records created, 0 credentials created, 0 profiles created, 0 password hashes computed, 0 audit logs written, 0 emails dispatched, 0 sessions created. PostgreSQL `"AuthRateLimit"` backend confirmed; HMAC-SHA256 pseudonymous keys confirmed with zero raw PII; zero secrets logged; real customer data was not used; unrelated Production environment untouched. Retained single bounded synthetic record as documented test data. RSK-06 classified as **PROVEN — OPERATING CONFORMITY**. Milestone ISO-C2-M3 classified as **PASS — OPERATING CONTROL VERIFIED**. M3 authorized reopen and implementation is **CLOSED**. No residual risk accepted. Overall ISO certification is not claimed. See [M3 Evidence](ISO_C2_M3_REGISTRATION_PRE_EFFECT_RATE_LIMITING_EVIDENCE.md).

## 22. ISO-C2-M4-D1-E1 Automated Backup Freshness & Monitoring Operational Evidence (2026-10-22)

Completed under primary execution of Antigravity / Gemini 3.8 Flash High. Executed under explicit Project Owner authorization for read-only operational evidence collection for ISO-C2-M4 / RSK-22 / TRT-F02. Production database provider was verified as Neon Serverless PostgreSQL (`holy-shape-01357429`, branch `rentipid-production` / `br-proud-sunset-ap0ofil2`, `aws-us-east-1`, PostgreSQL 17, `protected: true`) serving Production deployment `dpl_2733akwjwf1NGvcVGxggoCCUGjuB` (`https://www.rentipid.com.ph`). Read-only inspection verified: continuous multi-AZ WAL replication to distributed Safekeepers/Pageservers; continuous Point-In-Time Recovery (PITR) active; history retention configured at 21,600 seconds (6 hours); discrete scheduled snapshots: 0. Backup freshness was measured at < 1 minute (real-time continuous streaming on transaction commit; observation at `2026-10-22T13:03:59Z`). Retention evaluated as **PARTIAL** (6-hour continuous window active; 30-day archival recommended in runbook unconfigured). Proactive backup failure monitoring and automated alert notifications evaluated as **GAP** (no automated health monitor or alert channels configured). Operational roles designated as `Database Administrator` and `Cloud Operations Lead` (`REQUIRES HUMAN EVIDENCE` for named personnel assignments). Zero customer data was accessed; zero database, backup, or monitoring configurations were modified. No restore or PITR exercises were performed or authorized under M4. RSK-22 classified as **PARTIAL**. RSK-23 remains **PARTIAL — UNCHANGED**. No residual risk accepted. Overall ISO certification is not claimed. See [M4 Operating Evidence](ISO_C2_M4_BACKUP_FRESHNESS_MONITORING_OPERATING_EVIDENCE.md).

## 23. ISO-C2-M4-D2 Backup Monitoring & Alerting Remediation Design + Governance Reconciliation (2026-10-23)

Completed under primary execution of Antigravity / Gemini 3.8 Flash High. Executed within the design and change-control boundary for ISO-C2-M4 / RSK-22 / TRT-F02. Reconciled authoritative continuity requirements across all governance registers: RPO and RTO are `NOT_DEFINED`; backup freshness requirement is `DEFINED_BUT_NONCONTROLLING` (daily runbook baseline vs live continuous replication); retention requirement is `CONFLICTING / DEFINED_BUT_NONCONTROLLING` (30-day runbook recommendation vs 6-hour live PITR window); retention compliance evaluated as `UNDETERMINED`. Specified minimum monitored signal from Neon Management Control Plane API (`current_state == 'ready'`, `history_retention_seconds`, operations failure count, calculated recoverable point age) with zero serverless compute spin-up costs. Confirmed existing alert channels are `NONE` (`HUMAN/OPERATIONAL DESTINATION REQUIRED`). Defined fail-closed operational rules ensuring inability to measure backup health triggers critical alerts. Evaluated three architectures and selected Option 1 (Scheduled GitHub Actions Workflow `.github/workflows/backup-freshness-monitor.yml`) for its zero production footprint, zero financial cost, and complete ISO auditability. Classified remediation under `E. MULTIPLE OF B/C/D REQUIRED` (Project Owner policy decision required for RPO/retention thresholds; Human operational evidence required for named personnel assignments and notification destination). RSK-22 remains **PARTIAL**; RSK-23 remains **PARTIAL — UNCHANGED**. No residual risk accepted. Overall ISO certification is not claimed. See [M4-D2 Design Document](ISO_C2_M4_BACKUP_MONITORING_REMEDIATION_DESIGN.md).

## 24. ISO-C2-M4-D3 Project Owner Continuity Policy Decision & Monitoring/Alerting Baseline (2026-10-23)

Completed under primary execution of Antigravity / Gemini 3.8 Flash High. Executed under explicit Project Owner policy authority for ISO-C2-M4 / RSK-22 / TRT-F02. Formally codified internal RENTipid continuity policy: Production database RPO <= 60 minutes; backup freshness threshold <= 30 minutes; automated monitoring frequency every 15 minutes; and minimum production backup/PITR retention >= 30 days. Reconciled current Neon retention (6 hours) as FAIL (non-compliant with newly adopted requirement), establishing that a separate commercial authorization and provider configuration package is required to update retention. Formally approved scheduled GitHub Actions monitoring model (`.github/workflows/backup-freshness-monitor.yml`) querying Neon Management Control Plane API read-only. Formally approved persistent incident tracking via deduplicated GitHub Issues (labels: `iso-backup-monitoring`, `operational-risk`). Formally enacted operational role ownership: Backup Control Owner (`Database Administrator`), Monitoring/Alert Owner (`Cloud Operations Lead`), and Security Oversight (`Security Operations / ISO Governance`), satisfying role-based human evidence (`COMPLETE — PROJECT OWNER ROLE ASSIGNMENT`). Verified Neon provider capability: current plan (`scale_v3`) natively supports up to 30 days retention via configuration alone without plan change; recorded commercial authorization gate for metered WAL storage ($0.20/GB-month). Identified credential requirement: read-only `NEON_API_KEY` required in GitHub repository secrets. RSK-22 remains **PARTIAL**; RSK-23 remains **PARTIAL — UNCHANGED**. No residual risk accepted. Overall ISO certification is not claimed. See [M4-D3 Policy Decision](ISO_C2_M4_CONTINUITY_POLICY_DECISION.md).

## 25. ISO-C2-M4-D4-R1 Neon Provider-Native Monitoring Model Reconciliation + Authenticated Provider Evidence (2026-10-23)

Completed under primary execution of Antigravity / Gemini 3.8 Flash High. Executed under explicit Project Owner authorization to reconcile the M4 monitoring definition to Neon's real provider-native architecture following the block in Codex package `ISO-C2-M4-D4-E1`. Authenticated Neon access confirmed read-only for `j.burns2372@gmail.com` under organization `org-sweet-fog-42432629` (`Vercel: jburns2372-sys' projects`). Production provider target re-verified: Project `holy-shape-01357429` (`neon-camel-bell`), branch `br-proud-sunset-ap0ofil2` (`rentipid-production`), region `aws-us-east-1`, PostgreSQL 17, plan `scale_v3`, branch status `ready` (`protected: true`), and current history retention 21,600 seconds (6 hours). Max plan retention natively supports 2,592,000 seconds (30 days). Control plane API audit verified: `RECOVERABLE POINT TIMESTAMP: NOT EXPOSED BY PROVIDER API`; `branch.updated_at` reflects only control-plane metadata changes and is NOT a database recoverability or WAL timestamp; and `PROVIDER OPERATION FAILURE SIGNAL: NOT RELIABLE FOR M4` (operations list tracks compute wake/sleep lifecycle). Point-in-time recovery capability is PROVEN via continuous WAL streaming across the configured history window. Formally amended the 30-minute threshold to `MONITORING EVIDENCE FRESHNESS THRESHOLD: <= 30 MINUTES` (alerting and failing closed if valid provider health evidence is not acquired within 30 minutes). Controlling requirements reaffirmed: RPO <= 60 minutes, monitoring cadence 15 minutes, retention >= 30 days. Clarified boundary: M4/RSK-22 proves operational monitoring; RSK-23 proves actual restore execution under Phase ISO-C3. Defined exact RSK-22 operating acceptance criteria for `PROVEN — OPERATING CONFORMITY`. Zero production, database, or provider configurations were modified; zero restore drills were executed; zero customer data accessed. RSK-22 remains **PARTIAL**; RSK-23 remains **PARTIAL — UNCHANGED**. No residual risk accepted. Overall ISO certification is not claimed. See [M4 Continuity Policy Decision](ISO_C2_M4_CONTINUITY_POLICY_DECISION.md) and [M4 Remediation Design](ISO_C2_M4_BACKUP_MONITORING_REMEDIATION_DESIGN.md).

## 26. ISO-C2-M4-D4-E2 Backup Monitoring Implementation & Retention Remediation Operating Evidence (2026-10-23)

Completed under primary execution of Antigravity / Gemini 3.8 Flash High. Executed under explicit Project Owner authorization to continue the reconciled backup monitoring control implementation from authorized pre-existing WIP. Pinned GitHub Actions workflow `.github/workflows/backup-freshness-monitor.yml`, `scripts/security/backup-monitor-actions.mjs`, and `scripts/security/check-backup-freshness.mjs` implemented and tested with 49/49 contract tests passing (alert state machine, monitor checks, YAML workflow constraints). Evaluates strictly provider-native fields on Neon Control Plane API (`current_state == 'ready'`, `protected == true`, `history_retention_seconds >= 2592000`) and enforces 30-minute monitoring evidence freshness window. Neon project history retention remediated from 6 hours to 30 days (`2,592,000 seconds`) under Scale plan (`scale_v3`) with independent read-back PASS. Dedicated project-scoped automation identity `rentipid-backup-monitoring` (ID 3459133) created and `NEON_API_KEY` stored in GitHub repository secrets. Deduplicated GitHub issue alert mechanism implemented (`[ISO-C2-M4] Production backup/PITR monitoring alert`). Technical candidate `ba0a474` pushed to `feat/iso-conformity-v1.0`. Scheduled workflow execution operates from repository default branch (`main`); promotion to `main` remains required for live scheduled execution. Zero customer data accessed; zero production DB modifications; zero restore/PITR drills executed. RSK-22 classified as **PARTIAL — IMPLEMENTED / RETENTION CORRECTED / SCHEDULED OPERATION PENDING MAIN ACTIVATION**. RSK-23 remains **PARTIAL — UNCHANGED**. No residual risk accepted. Overall ISO certification is not claimed. See [M4 Implementation Evidence](ISO_C2_M4_BACKUP_MONITORING_IMPLEMENTATION_EVIDENCE.md).

## 27. ISO-C2-M4-D5-R1 Main / Production Baseline Synchronization Precondition (2026-10-24)

Completed under primary execution of Antigravity / Gemini 3.8 Flash High. Executed under explicit Project Owner authorization to eliminate source-control drift between default branch `origin/main` (`b44ed78`) and the authoritative Production application candidate `dca547904791535ca44485747065961dbf8fc421` (resolving to `dca54797dec2bf75a21b1406bfed2f73d6329e75`) as an authorized precondition for M4 backup monitoring activation. Vercel project `ren-tipid` has `productionBranch: 'main'`. Isolated branch `iso-c2-main-production-sync` created from `origin/main` and synchronized to `dca5479` across all deployment-affecting paths (`src/`, `prisma/`, `public/`, `seed-data/`, `apps/`, `package.json`, `package-lock.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `vercel.json`, `.vercelignore`, `.npmrc`, `components.json`, `scripts/`, `tests/`, `.github/workflows/`). Verified exact runtime file equivalence (`DIFF: NONE`). Excluded all six M4 backup monitoring files (`M4 ACTIVATION INCLUDED: NO`). Database safety verified (`NEW DATABASE MIGRATION: NO`). PR #1 created (`https://github.com/jburns2372-sys/RENTipid/pull/1`). Vercel Preview deployment `dpl_22iby5YD3gmKPvtvr1LJ1zvXi7NZ` compiled and reached `● Ready`. Check `Localization Acceptance CI` passed (37s). Check `supply-chain-validation` failed due to live npm audit advisory `GHSA-2464-fhr4-w9xw` on `next@16.3.8`. PR #1 requires independent human review approval (`reviewDecision: "REVIEW_REQUIRED"`). Under protected branch rules, Antigravity cannot self-approve and admin bypass is prohibited. Merge to `main` is paused awaiting human approval and CI resolution. RSK-22 remains **PARTIAL — IMPLEMENTED / RETENTION CORRECTED / SCHEDULED OPERATION PENDING MAIN ACTIVATION**. RSK-23 remains **PARTIAL — UNCHANGED**. No residual risk accepted. Overall ISO certification is not claimed. See [Main Production Baseline Sync Evidence](ISO_C2_MAIN_PRODUCTION_BASELINE_SYNCHRONIZATION_EVIDENCE.md).
## 28. ISO-C2-M4-D5-R1-C1 PR #1 Supply-Chain Required-Check Remediation (2026-10-24)

Completed under primary execution of Antigravity / Gemini 3.8 Flash High. Executed under explicit Project Owner authorization to investigate and remediate the failing `supply-chain-validation` check on PR #1 (run `39993124480`). Confirmed all audit and dependency files on PR branch `iso-c2-main-production-sync` (`package.json`, `package-lock.json`, `scripts/security/check-ci-audit.cjs`, `scripts/security/ci-audit-policy.json`) are completely identical to accepted Production candidate `dca547904791535ca44485747065961dbf8fc421` (`git diff` = NONE). Zero files from candidate were missing. Root cause classified as Category I (genuine newly surfaced security vulnerability): external npm registry advisory publication drift on production dependency `next@16.3.8` (advisories `GHSA-2464-fhr4-w9xw` and `GHSA-673q-mjm6-r5xr`). Under mandatory M1 immutability rules (Step 5 and Step 7), policy caps cannot be weakened, findings cannot be generically suppressed, and dependencies cannot be arbitrarily changed in this package. Stop condition triggered: `SECURITY ADVISORY DRIFT REQUIRES SEPARATE ISO-C2 REMEDIATION`. PR #1 remains unmerged; RSK-22 remains **PARTIAL — IMPLEMENTED / RETENTION CORRECTED / SCHEDULED OPERATION PENDING MAIN ACTIVATION**; RSK-23 remains **PARTIAL — UNCHANGED**. No residual risk accepted. See [Main Production Baseline Sync Evidence](ISO_C2_MAIN_PRODUCTION_BASELINE_SYNCHRONIZATION_EVIDENCE.md).

## 29. ISO-C2-M1-R1-D1-E1 Next.js Security Advisory Drift Remediation & Targeted Preview Validation (2026-10-24)

Completed under primary execution of Antigravity / Gemini 3.8 Flash High. Executed under explicit Project Owner authorization to remediate upstream external advisory drift against production framework dependency `next@16.3.8`. Critical advisories `GHSA-2464-fhr4-w9xw` (Image Optimization SVG RCE) and `GHSA-673q-mjm6-r5xr` (`use cache` RCE) were cleared by upgrading Next.js to provider-maintainer patched release `16.4.1` (commit `d576876`). Unrelated dependency churn was prevented (`package.json` and `package-lock.json` only). Supply-chain validation confirmed zero critical findings remaining. TypeScript typecheck (`npx tsc --noEmit`) and production build (`npm run build`) passed with zero errors. Targeted regression test suites (auth rate limiter 11/11, unified auth routes 15/15, MFA rate limiter 4/4, standalone security contracts 51/51) passed cleanly. Controlled Vercel Preview deployment `dpl_73N85X1x5uza9mQSEJAVmXY25kGa` compiled and reached `● Ready` (`https://ren-tipid-8diwcglow-jburns2372-sys-projects.vercel.app`). Bounded runtime smoke checks verified `/api/health` (`200 OK`, `{"status":"ready","database":"connected"}`), `/how-it-works` (`200 OK`), `/api/auth/csrf` (`200 OK`), and registration contract validation (`400 Bad Request`). M3 rate-limiting control was revalidated (`PASS — REVALIDATED DUE TO DELTA`). M1 security advisory reopen status: `PASS — REVALIDATED DUE TO DELTA`. RSK-08 remains **PROVEN — OPERATING CONFORMITY** with technical candidate validated pending Production promotion. Independent October 23 advisories (`GHSA-xcx6-jx8p-x3h5`, `GHSA-27r3-jxmh-p828`, `GHSA-mrhx-c7xc-m3w5`) require separate governed disposition under ISO-C2. Production remains on `dca547904791535ca44485747065961dbf8fc421`; PR #1 remains open and unmerged. No residual risk accepted. See [M1 Next.js Advisory Remediation Evidence](ISO_C2_M1_NEXTJS_SECURITY_ADVISORY_DRIFT_REMEDIATION.md).

## 30. ISO-C2-M1-R1-D1-E2 Remaining NPM Security Advisory Triage + Minimum Remediation + Preview Revalidation (2026-10-24)

Completed under primary execution of Antigravity / Gemini 3.8 Flash High. Executed under explicit Project Owner authorization to remediate all remaining security advisory drift affecting the repository's unchanged M1 audit contract following the Next.js 16.4.1 patch. Successfully eliminated 9 high-severity findings across `@azure/msal-node` (`GHSA-xcx6-jx8p-x3h5`, constrained to `7.1.1`), `body-parser` (`GHSA-27r3-jxmh-p828`, constrained to `2.4.0`), and `zod` (`GHSA-mrhx-c7xc-m3w5`, updated to `4.6.7` directly and in overrides) in technical commit `54e2fd6`. `npm audit` returned 0 vulnerabilities; `node scripts/security/check-ci-audit.cjs` returned `pass: true` (0 total, 0 rejected, exit code 0). Unrelated dependency churn was prevented. TypeScript typecheck (`npx tsc --noEmit`) and production build (`npm run build`) passed with zero errors. Targeted regression test suites (registration rate limiter 11/11, unified auth routes 15/15, MFA rate limiter 4/4, standalone security contracts 51/51) passed cleanly (81/81 PASS). New controlled Vercel Preview deployment `dpl_JDJFVo2ssj3i3F9u6RgzoqtWMxLw` (`https://ren-tipid-q1lquo4cb-jburns2372-sys-projects.vercel.app`) was compiled and reached `● Ready`. Bounded runtime smoke checks verified `/api/health` (`200 OK`), `/how-it-works` (`200 OK`), `/api/auth/csrf` (`200 OK`), registration validation contract (`400 Bad Request`), and `/browse` (`200 OK`). Milestone M1 enforcement control remains **PASS — REUSED / UNAFFECTED**; M1 advisory remediation is **PASS — REVALIDATED DUE TO DELTA**; M3 is **PASS — REVALIDATED DUE TO DELTA**; RSK-08 remains **PROVEN — OPERATING CONFORMITY**. Production remains on `dca547904791535ca44485747065961dbf8fc421` pending Project Owner authorization; PR #1 remains open/blocked. No residual risk accepted. Overall ISO certification is not claimed. See [M1 Advisory Remediation Evidence](ISO_C2_M1_NEXTJS_SECURITY_ADVISORY_DRIFT_REMEDIATION.md).

## 31. ISO-C2-M1-R1-D2-E1 Patched Security Candidate Production Promotion + Operating Revalidation (2026-10-24)

Completed under primary execution of Antigravity / Gemini 3.8 Flash High. Executed under explicit Project Owner authorization to promote exact patched technical candidate `54e2fd6d0eacdd91619f542f9888c66e7a9b52d8` to Production, completing the ISO-C2 M1 advisory-drift remediation. Pre-promotion Production deployment `dpl_2733akwjwf1NGvcVGxggoCCUGjuB` (source `dca5479`) was superseded by promoting accepted Vercel Preview artifact `dpl_JDJFVo2ssj3i3F9u6RgzoqtWMxLw` via `npx vercel promote dpl_JDJFVo2ssj3i3F9u6RgzoqtWMxLw --yes`. Resulting live Production deployment `dpl_3uG9ryAf6UQzZbTUFg5fgXVjiveh` reached `● Ready` with direct URL `https://ren-tipid-8t2yhdy6h-jburns2372-sys-projects.vercel.app` and canonical aliases `https://www.rentipid.com.ph`, `https://rentipid.com.ph`, and `https://ren-tipid.vercel.app`. Deployed source correspondence to `54e2fd6d0eacdd91619f542f9888c66e7a9b52d8` was verified. Database safety confirmed: zero migrations executed, zero schema modifications, zero seeds run, zero customer data accessed. Bounded Production health verification passed (`GET /api/health` returned HTTP 200 `{"status":"ready","database":"connected"}`, `GET /how-it-works` returned HTTP 200 OK, `GET /api/auth/csrf` returned HTTP 200 OK, `POST /api/auth/register` with empty body returned HTTP 400 Bad Request). Targeted M3 registration pre-effect rate limiting revalidation passed on live Production: sub-threshold requests permitted (409 Conflict returned on existing synthetic fixture `iso-c2-m3-prod-1792672640027@example.invalid`), quota point accumulation verified, over-threshold attempt 6 rejected with HTTP 429 Too Many Requests and `Retry-After: 3591`, zero customer accounts created, zero side effects. Deployed dependencies correspond to `next@16.4.1`, `@azure/msal-node@7.1.1`, `body-parser@2.4.0`, and `zod@4.6.7` with all five advisories (`GHSA-2464-fhr4-w9xw`, `GHSA-673q-mjm6-r5xr`, `GHSA-xcx6-jx8p-x3h5`, `GHSA-27r3-jxmh-p828`, `GHSA-mrhx-c7xc-m3w5`) cleared. Milestone M1 enforcement control: **PASS — REUSED / UNAFFECTED**; M1 advisory remediation: **PASS — OPERATING REMEDIATION VERIFIED**; M2: **PASS — REUSED / UNAFFECTED**; M3: **PASS — REVALIDATED DUE TO DELTA**; M4 implementation: **PASS — REUSED / UNAFFECTED**; RSK-08: **PROVEN — OPERATING CONFORMITY**; RSK-22: **PARTIAL — IMPLEMENTED / RETENTION CORRECTED / SCHEDULED OPERATION PENDING MAIN ACTIVATION**; RSK-23: **PARTIAL — UNCHANGED**. `54e2fd6d0eacdd91619f542f9888c66e7a9b52d8` designated as new accepted Production application baseline. PR #1 remains unmerged/unmodified on branch `iso-c2-main-production-sync` awaiting baseline reconciliation. No residual risk accepted. Overall ISO certification is not claimed. See [M1 Advisory Remediation Evidence](ISO_C2_M1_NEXTJS_SECURITY_ADVISORY_DRIFT_REMEDIATION.md).



## 2026-10-24: ISO-C2-M4-D5-R2-E1 - Patched main-sync reconciliation

Work package ISO-C2-M4-D5-R2-E1 executed by CODEX from clean governance baseline 2178914c7f8ea847e12a918620b5ed6a925fc12f. Existing PR #1 (https://github.com/jburns2372-sys/RENTipid/pull/1) reconciled from f0a1a933a6e5536b48a9bc9ef49bcc85b641c761 to 40ad800b2c87b883c7138f7a3e2ad1b0b41ea68e using exact package.json/package-lock.json from accepted Production candidate 54e2fd6d0eacdd91619f542f9888c66e7a9b52d8 (deployment dpl_3uG9ryAf6UQzZbTUFg5fgXVjiveh). Runtime equivalence PASS, unchanged audit gate PASS with zero vulnerabilities, dependency tree PASS (no invalid/unmet dependencies), targeted typecheck PASS. Security dependency versions: next 16.4.1, @azure/msal-node 7.1.1, body-parser 2.4.0, zod 4.6.7. Reconciliation normal push PASS; PR body updated. Current required checks supply-chain-validation (40058096422) and Localization Acceptance CI (40058096407) PASS. Automatic Preview dpl_9SzUJc1rQVWM6MJdwAuTkJvGa2Xh READY/PASS for the exact PR head. Main remains b44ed7854c07c73903578556515c2752157bc7d6 and unmerged. No M4 files, ISO governance history, new migration/schema change, Production deployment/DB change, customer-data access, bypass, self-approval or residual-risk acceptance. Independent approval REQUIRED; package BLOCKED normally at human-review gate. M1/M3 accepted delta revalidation and M2/M4 unaffected status retained; RSK-08 proven operating, RSK-22 partial pending main activation, RSK-23 partial unchanged. Next action: HUMAN REVIEW APPROVAL REQUIRED FOR PR #1. Merge requires separate authorization. See ISO_C2_MAIN_PRODUCTION_BASELINE_SYNCHRONIZATION_EVIDENCE.md section 8 and its exact permitted-difference register.


## 2026-10-24: ISO-C2-M4-D5-R2-E3 - Authorized sole-maintainer control and protected PR merge

Status: PASS. Executor: CODEX. Governance baseline: 567d039285d18121137c712db7f22c9fccdaa48e, initially clean. The Project Owner declared sole-maintainer operation, no qualified independent human reviewer available, and explicitly authorized this subsequent internal control-design revision and PR #1 merge. See [control exception](ISO_SOLE_MAINTAINER_CHANGE_CONTROL_EXCEPTION.md). Historical evidence above remains valid for its recorded state.

Protection before: PR required; one approval; last-push approval true; stale dismissal true; code-owner review false; strict required supply-chain-validation and Localization Acceptance CI (app_id 15368 each); administrators enforced; force pushes/deletion blocked; conversation resolution true; no bypass. Protection after differs ONLY in approval count 0 and last-push approval false. Complete before/after settings are recorded in STATUS.json. API read-back verified no other weakening. Required signatures/linear history/block creations/lock branch/fork syncing remain false; effective branch rules []. Direct main push remains prohibited by retained PR protection and administrator enforcement.

Immediately before merge: PR #1 OPEN, exact head 40ad800b2c87b883c7138f7a3e2ad1b0b41ea68e, base b44ed7854c07c73903578556515c2752157bc7d6, merge state CLEAN/MERGEABLE. supply-chain-validation run 40058096422 and Localization Acceptance CI run 40058096407 PASS. Both Vercel contexts and Preview Comments PASS; automatic RENTipid Preview dpl_9SzUJc1rQVWM6MJdwAuTkJvGa2Xh PASS. No unresolved high/critical security gate failure. Dual-executor review evidence reused from Antigravity R1 and Codex R2-E1; Codex E3 independently confirmed the full 2,422-path permitted-difference register exactly matches candidate-to-head differences (no extra or stale entries).

Normal GitHub PR merge API, merge method merge, with expected-head SHA guard: SUCCESS. Merged at 2026-10-24T04:07:13Z. Merge commit and fetched origin/main: 66283960bd7cadf250acb329a8aea46e0a2c4a3d. Full tree comparison of merged main against the reviewed PR head returned zero differences. Main runtime equivalence to accepted candidate 54e2fd6d0eacdd91619f542f9888c66e7a9b52d8: PASS, with only the previously documented non-runtime differences and six explicit M4 exclusions. M4 activation included: NO.

Incidental Vercel Production deployment: dpl_FBvoi4Z7V2jzYAwHZ5W68W7pKrMS, project prj_DiF8jBz51kFIHK74udSP6zuqBtMr, source 66283960bd7cadf250acb329a8aea46e0a2c4a3d, source type git, target production, READY/PASS. Canonical www.rentipid.com.ph alias verified; aliasError null. Application runtime delta: NONE. Bounded health checks: GET https://www.rentipid.com.ph/api/health HTTP 200 with {"status":"ready","database":"connected"}; GET /how-it-works HTTP 200. No M3 saturation repeated.

M1: PASS - REVALIDATED DUE TO CONTROL-DESIGN REVISION. M2/M3/M4: PASS - REUSED / UNAFFECTED. RSK-08: PROVEN - OPERATING CONFORMITY. RSK-22: PARTIAL - IMPLEMENTED / RETENTION CORRECTED / SCHEDULED OPERATION PENDING MAIN ACTIVATION. RSK-23: PARTIAL - UNCHANGED.

No direct main push, force push, admin override, CI bypass, application-runtime edit, M4 activation, DB migration, Production DB modification or customer-data access. No residual risk accepted. No ISO certification claimed. Governance changes are committed separately on feat/iso-conformity-v1.0 with message governance(iso-conformity): adopt sole-maintainer merge control; the containing commit is the governance receipt.

Next action: ISO-C2-M4-D5-E2 CONTROLLED SIX-FILE M4 MAIN ACTIVATION + SCHEDULED OPERATING EVIDENCE. Not executed in E3.

## 2026-10-24: ISO-C2-M4-D5-E2 - Controlled six-file M4 main activation & scheduled operating evidence

Status: BLOCKED. Executor: ANTIGRAVITY / GEMINI 3.8 FLASH HIGH (Continuation of interrupted Codex execution). Governance baseline: 1b85c3b23d9f4e2dad7dd8387353e83e743c2a4b. Initial main baseline before M4: 66283960bd7cadf250acb329a8aea46e0a2c4a3d.

Discovery of interrupted Codex state:
- Activation branch `iso-c2-m4-main-activation` (commit `e7555b4eae21e388a9ff96cc7daef7be93d8121a`) created and pushed to origin;
- Activation PR #2 (`https://github.com/jburns2372-sys/RENTipid/pull/2`) created with title `feat(iso-c2): activate M4 backup monitoring`;
- Required status checks `supply-chain-validation` (run 40061794877) and `Localization Acceptance CI` (run 40061794901) PASS;
- PR #2 merged to `main` at 2026-10-24T04:20:01Z in merge commit `e9bec066f62798618d77eaf122b080fc34d51d77`;
- Exact six accepted M4 files from commit `ba0a474022281621311458e95ea0b3a26e2ee776` verified on `main` with zero application runtime delta;
- Incidental Vercel Production deployment `dpl_ARD5gX7romaPxGfMPT5VortJfjYv` reached `● Ready`; bounded health checks verified (`/api/health` 200 OK `{"status":"ready","database":"connected"}`, `/how-it-works` 200 OK, `/api/auth/csrf` 200 OK).

Antigravity continuation & technical blocker:
- Targeted M4 contract test suite executed: 49/49 PASS (38 monitor tests, 10 alert tests, 1 workflow parse test);
- Attempted to trigger required manual `workflow_dispatch` run on `main`: rejected by GitHub Actions API with `HTTP 422: Invalid Argument - failed to parse workflow: (Line: 25, Col: 25): Unrecognized named-value: 'runner'. Located at position 1 within expression: runner.temp`;
- Root cause: GitHub Actions workflow syntax prohibits `${{ runner.temp }}` in job-level `env` (`jobs.<job_id>.env`), restricting `runner` context exclusively to step-level evaluation;
- Scheduled cron triggers are disabled by GitHub Actions while the workflow schema error persists;
- Modifying M4 source code or pushing directly to `main` is strictly prohibited under package authorization.

Milestone & Risk dispositions:
- M1/M2/M3: PASS — REUSED / UNAFFECTED;
- M4 Implementation: PASS — REUSED / UNAFFECTED;
- M4 Operating Verification: BLOCKED;
- RSK-08: PROVEN — OPERATING CONFORMITY;
- RSK-22: PARTIAL — IMPLEMENTED / RETENTION CORRECTED / SCHEDULED OPERATION PENDING WORKFLOW SYNTAX REMEDIATION;
- RSK-23: PARTIAL — UNCHANGED;
- Production DB modified: NO; customer data accessed: NO; restore/PITR executed: NO; residual risk accepted: NO; ISO certification claimed: NO.
- Next action: M4 WORKFLOW RUNNER SYNTAX REMEDIATION AUTHORIZATION REQUIRED. See ISO_C2_M4_MAIN_ACTIVATION_OPERATING_EVIDENCE.md.

## 2026-10-24: ISO-C2-M4-D5-E3 - M4 Workflow Runner Syntax Remediation & Operating Continuation

Status: BLOCKED. Executor: ANTIGRAVITY / GEMINI 3.8 FLASH HIGH. Governance baseline: 243eb75e2d8d55c4428aaba99ecfd73b2c58e39a. Initial main baseline before remediation: e9bec066f62798618d77eaf122b080fc34d51d77.

Workflow runner syntax remediation:
- Authorized scope: strictly 1 file (`.github/workflows/backup-freshness-monitor.yml`);
- Remediated `${{ runner.temp }}/m4-evidence.json` with POSIX path `/tmp/m4-evidence.json`;
- Workflow contract test passed: `node --test tests/security/iso-c2-m4-workflow.contract.cjs` (1/1 PASS);
- Remediation branch `iso-c2-m4-workflow-syntax-remediation` pushed with technical commit `3108997558a61a81a2e5294cb6942630f29b51fa`;
- Protected PR #4 created (`https://github.com/jburns2372-sys/RENTipid/pull/4`);
- Required status checks `Localization Acceptance CI` (run 40066018217, 42s) and `supply-chain-validation` (run 40066018163, 1m36s) PASS;
- PR #4 merged into `main` at 2026-10-24T05:24:52Z in merge commit `53edb1196ecca5faf2323766a323fa0ac1b43960` under authorized sole-maintainer control;
- Incidental Vercel production deployment `dpl_59VmH5qFsNY8kposzbDnwfJNCa4b` reached `● Ready`; bounded health checks verified (`HTTP 200 OK` on `https://www.rentipid.com.ph`).

Post-fix manual workflow run & operating defect:
- Exactly one manual run triggered on main: run ID 40066228412 (event: `workflow_dispatch`, duration: 12s, conclusion: `failure`);
- GitHub Actions runner successfully parsed and executed the workflow steps;
- Step `Collect provider evidence` (`node scripts/security/check-backup-freshness.mjs`) exited with code 1 (`failure_reason: API_UNAVAILABLE`);
- Step `Enforce evidence freshness and reconcile incident` executed under `if: always()`, updated open alert Issue #3, and exited with code 1 (`failure_reason: PROVIDER_EVIDENCE_INVALID`);
- Step `Record sanitized evidence in run summary` executed under `if: always()`, publishing evidence to run summary;
- Root cause: Neon API request failed with non-200 or network exception;
- Execution stopped under Step 17 hard stop rules without expanding scope or patching unrelated files.

Milestone & Risk dispositions:
- M1/M2/M3: PASS — REUSED / UNAFFECTED;
- M4 Implementation: PASS — REUSED / UNAFFECTED;
- M4 Workflow Runner Syntax: PASS — REMEDIATED;
- M4 Operating Verification: BLOCKED;
- RSK-08: PROVEN — OPERATING CONFORMITY;
- RSK-22: PARTIAL — IMPLEMENTED / RETENTION CORRECTED / WORKFLOW REMEDIATED / PROVIDER API UNAVAILABLE;
- RSK-23: PARTIAL — UNCHANGED;
- Production DB modified: NO; customer data accessed: NO; restore/PITR executed: NO; residual risk accepted: NO; ISO certification claimed: NO.
- Next action: INVESTIGATE NEON PROVIDER API UNAVAILABILITY IN M4 BACKUP MONITOR SCRIPT. See ISO_C2_M4_MAIN_ACTIVATION_OPERATING_EVIDENCE.md.

## 2026-10-24: ISO-C2-M4-D5-E4 - Neon Provider API Access Diagnosis, Credential Remediation & Operating Continuation

Status: PARTIAL. Executor: ANTIGRAVITY / GEMINI 3.8 FLASH HIGH. Governance baseline: 663485f9004988bcc6f59a961fd93742e2d0514b. Initial main baseline before remediation: 53edb1196ecca5faf2323766a323fa0ac1b43960.

Diagnosis and Credential Remediation:
- Investigated failed run 40066228412: step `Collect provider evidence` failed in 53ms (`failure_reason: API_UNAVAILABLE`);
- Authenticated control-plane inspection confirmed project `holy-shape-01357429` active on Scale plan (`scale_v3`), `history_retention_seconds: 2592000` (30 days), and production branch `br-proud-sunset-ap0ofil2` in state `ready` with `protected: true`;
- Inspected org API key `3459133`: `last_used_at` was `2026-10-23T14:31:52Z` (not touched by run 40066228412);
- Safe in-memory read-only API diagnostic confirmed live project and branch endpoints return HTTP 200 OK with compliant schemas, proving script request construction in `scripts/security/check-backup-freshness.mjs` is 100% valid with zero source changes required (`SOURCE CHANGE REQUIRED: NO`);
- Minted replacement project-scoped key `rentipid-backup-monitoring-v1` (ID `3461258`) restricted strictly to target project `holy-shape-01357429`, verified in memory, installed directly into GitHub repository secret `NEON_API_KEY` via stdin, and revoked superseded key `3459133`;
- Technical commit: NONE; PR: NONE; Merge: NOT REQUIRED.

Post-remediation manual workflow run:
- Exactly one manual run triggered on main: run ID 40068121351 (event: `workflow_dispatch`);
- Step 4 `Collect provider evidence` (`node scripts/security/check-backup-freshness.mjs`): PASS / HEALTHY (`{"status":"HEALTHY","observed_at":"2026-10-24T05:55:06.898Z","project_match":true,"branch_match":true,"branch_state":"ready","branch_protected":true,"history_retention_seconds":2592000,"retention_compliant":true,"evidence_freshness_status":"NOT_EVALUATED","failure_reason":null}`);
- Step 5 `Enforce evidence freshness and reconcile incident` executed under `if: always()`, evaluated `evidence_freshness_status: MISSING` pending initial automated cron execution, and updated open alert Issue #3;
- Scheduled run observation: PENDING (no qualifying `schedule` event completed yet).

Milestone & Risk dispositions:
- M1/M2/M3: PASS — REUSED / UNAFFECTED;
- M4 Implementation: PASS — REUSED / UNAFFECTED;
- M4 Workflow Runner Syntax: PASS — REMEDIATED;
- M4 Provider API Access: PASS — VERIFIED;
- M4 Manual Monitor Operation: PASS — HEALTHY;
- M4 Scheduled Operating Verification: PARTIAL — MAIN ACTIVATED / WORKFLOW REMEDIATED / PROVIDER ACCESS VERIFIED / MANUAL OPERATION VERIFIED / SCHEDULED OPERATION PENDING;
- RSK-08: PROVEN — OPERATING CONFORMITY;
- RSK-22: PARTIAL — IMPLEMENTED / RETENTION CORRECTED / PROVIDER ACCESS VERIFIED / MANUAL OPERATION VERIFIED / SCHEDULED EVIDENCE PENDING;
- RSK-23: PARTIAL — UNCHANGED;
- Production DB modified: NO; customer data accessed: NO; restore/PITR executed: NO; residual risk accepted: NO; ISO certification claimed: NO.
- Next action: OBSERVE AND RECONCILE M4 SCHEDULED RUN OPERATING EVIDENCE ON MAIN. See ISO_C2_M4_MAIN_ACTIVATION_OPERATING_EVIDENCE.md.

## 2026-10-24: ISO-C2-M4-D5-E7 - GitHub Scheduled-Workflow Actor Reactivation & Operating Evidence

Status: PARTIAL. Executor: ANTIGRAVITY / GEMINI 3.8 FLASH HIGH. Governance baseline: 77573b8aed1589717375d39d6f1c7aaee9016d3e. Initial main baseline before reactivation: 53edb1196ecca5faf2323766a323fa0ac1b43960.

Diagnosis and Scheduled-Workflow Actor Reactivation:
- Evaluated pre-reactivation schedule history: confirmed >=4 expected 15-minute cron boundaries (`06:07`, `06:22`, `06:37`, `06:52 UTC`) elapsed with zero real GitHub Actions `schedule` events emitted despite active workflow and healthy manual execution;
- Applied GitHub-documented scheduled-workflow actor reactivation: updated cron expression in `.github/workflows/backup-freshness-monitor.yml` from `'7,22,37,52 * * * *'` to `'11,26,41,56 * * * *'`, preserving the exact 15-minute cadence (4 runs per hour);
- Updated workflow contract test in `tests/security/iso-c2-m4-workflow.contract.cjs` to reflect updated schedule string without weakening validation (1/1 PASS; monitor contract 38/38 PASS);
- Technical commit: `e51191306ec711800fa83273ad86a15d84624640` on branch `iso-c2-m4-scheduler-actor-reactivation`;
- Protected PR #5 created (`https://github.com/jburns2372-sys/RENTipid/pull/5`);
- Required CI passed: `Localization Acceptance CI` (48s) and `supply-chain-validation` (1m45s);
- PR #5 merged into `main` at `c8a63f3541132ec151f28a79577adaa142c0bcf5` under authorized sole-maintainer control (no branch protection bypass);
- Workflow on `main` re-verified active with 15-minute cadence;
- Post-reactivation scheduled execution observation: PENDING.

Milestone & Risk dispositions:
- M1/M2/M3: PASS — REUSED / UNAFFECTED;
- M4 Implementation: PASS — REUSED / UNAFFECTED;
- M4 Workflow Runner Syntax: PASS — REMEDIATED;
- M4 Provider API Access: PASS — VERIFIED;
- M4 Manual Monitor Operation: PASS — HEALTHY;
- M4 Scheduler Actor Reactivation: PASS — EXECUTED;
- M4 Scheduled Operating Verification: PARTIAL — MAIN ACTIVATED / WORKFLOW REMEDIATED / PROVIDER ACCESS VERIFIED / MANUAL OPERATION VERIFIED / SCHEDULER ACTOR REACTIVATED / SCHEDULED OPERATION PENDING;
- RSK-08: PROVEN — OPERATING CONFORMITY;
- RSK-22: PARTIAL — IMPLEMENTED / RETENTION CORRECTED / PROVIDER ACCESS VERIFIED / MANUAL OPERATION VERIFIED / SCHEDULER ACTOR REACTIVATED / SCHEDULED EVIDENCE PENDING;
- RSK-23: PARTIAL — UNCHANGED;
- Production DB modified: NO; customer data accessed: NO; restore/PITR executed: NO; residual risk accepted: NO; ISO certification claimed: NO.
- Next action: OBSERVE AND RECONCILE M4 SCHEDULED RUN OPERATING EVIDENCE ON MAIN. See ISO_C2_M4_MAIN_ACTIVATION_OPERATING_EVIDENCE.md.

## 2026-10-24: ISO-C2-M4-D5-E7-R3 - Four-Window Post-Reactivation Scheduled Evidence Decision

Status: BLOCKED. Executor: ANTIGRAVITY / GEMINI 3.8 FLASH HIGH. Governance baseline: 631d33f91a56aeaf33afb99271a05e05262bdb44. Current main baseline: c8a63f3541132ec151f28a79577adaa142c0bcf5.

Four-Window Post-Reactivation Observation & External Blocker Confirmation:
- Evaluated post-reactivation schedule history following merge of scheduler reactivation PR #5 to `main` at `c8a63f3` (`2026-10-24T07:20:11Z`, cron `11,26,41,56 * * * *`);
- Four full 15-minute cron boundaries elapsed: `07:26:00Z`, `07:41:00Z`, `07:56:00Z`, `08:11:00Z` (15:26, 15:41, 15:56, 16:11 PHT);
- Query via GitHub CLI (`gh run list --workflow=backup-freshness-monitor.yml --event=schedule --limit=50`) and direct GitHub Actions API returned `total_count: 0`;
- Confirmed zero qualifying `schedule` events emitted;
- Confirmed `SCHEDULER EXTERNAL BLOCKER: CONFIRMED`;
- Workflow state active; Actions enabled; manual run 40068121351 verified HEALTHY; provider API verified; 15-minute cadence verified; but external GitHub Actions scheduler failed to emit runs across >=4 pre-reactivation windows and >=4 post-reactivation windows;
- Technical source and cron are frozen against repeated churn.

Milestone & Risk Dispositions:
- M1/M2/M3: PASS — REUSED / UNAFFECTED;
- M4 Implementation: PASS — REUSED / UNAFFECTED;
- M4 Workflow Runner Syntax: PASS — REMEDIATED;
- M4 Provider API Access: PASS — VERIFIED;
- M4 Manual Monitor Operation: PASS — HEALTHY (Run 40068121351);
- M4 Scheduler Actor Reactivation: PASS — EXECUTED (PR #5);
- M4 Scheduled Operating Verification: BLOCKED — GITHUB SCHEDULED EXECUTION NOT EMITTED AFTER CADENCE-PRESERVING ACTOR REACTIVATION;
- RSK-08: PROVEN — OPERATING CONFORMITY;
- RSK-22: PARTIAL — CONTROL IMPLEMENTED / PROVIDER ACCESS VERIFIED / MANUAL OPERATION VERIFIED / GITHUB SCHEDULED EXECUTION EXTERNALLY BLOCKED;
- RSK-23: PARTIAL — UNCHANGED;
- Production DB modified: NO; customer data accessed: NO; restore/PITR executed: NO; residual risk accepted: NO; ISO certification claimed: NO.
- Next action: ISO-C2-M4 ALTERNATE SCHEDULING CONTROL DECISION. See ISO_C2_M4_MAIN_ACTIVATION_OPERATING_EVIDENCE.md.




