# ISO-C2 Risk Treatment Evidence Map

Project: RENTIPID-ISO-CONFORMITY-001 / v1.0. Package: ISO-C2-R1. Reviewer: Codex. Baseline: 47f54aae5bfc99b7ba97f94347c7bfb232627a5a. No remediation or technical revalidation executed; no residual risk accepted.

## 1. Unit and classification rule

Exactly 15 owner-authorized risks, one primary disposition per risk. Counts below use risk units; secondary evidence needs may overlap and do not add risks. No score or treatment-authorization state changes. EVD references resolve to exact selectors in ISO_CONFORMITY_EVIDENCE_INHERITANCE_REGISTER.md. The source tree is pinned above, not a claim of fresh current cloud/provider state.

| Classification | Count | Risk IDs |
|---|---:|---|
| CONFIRMED TECHNICAL DEFECT (code/runtime) | 1 | RSK-06 |
| CI/CD / TOOLING DEFECT | 2 | RSK-08, RSK-21 |
| CONFIGURATION DEFECT | 0 | None proved on a deployed resource; CI runtime mismatch is included in its single coupled tooling repair |
| OPERATING EVIDENCE GAP | 2 | RSK-22, RSK-23 |
| DOCUMENTATION GAP | 2 | RSK-05, RSK-09 |
| HUMAN/ORGANIZATIONAL GAP | 2 | RSK-03, RSK-24 |
| EXTERNAL DEPENDENCY | 6 | RSK-12, RSK-14, RSK-15, RSK-17, RSK-26, RSK-30 (2 legal + 4 provider) |
| ALREADY CONTROLLED | 0 | No whole authorized risk is closed/proven merely by a scoped control |
| NOT APPLICABLE | 0 | None |

## 2. Exact risk review

### RSK-03

- Primary classification: **HUMAN/ORGANIZATIONAL GAP**.
- Baseline inherent: 3 x 5 = 15 (HIGH); residual: 2 x 5 = 10 (HIGH) (unchanged).
- Evidence: EVD-04 role registry; src/lib/security/authorization.ts.
- Existing controls / limits: Implemented access guards; human certification not evidenced.
- Remaining treatment: TRT-A02: signed privileged access review; no code defect established.
- Lifecycle: Documentary acceptance only; all runtime/environment gates unaffected. All other gates retain PASS — REUSED / UNAFFECTED or N/A — NOT APPLICABLE for the present documentation delta; future affected gates require execution, not a premature PASS.
- Custodian: `ROLE ASSIGNMENT REQUIRED` (CISO); named assignment remains where required. Authority: PROJECT_OWNER_DECISION_ISO_C1_RISK_TREATMENT.md; treatment authorized, risk open, no residual acceptance.

### RSK-05

- Primary classification: **DOCUMENTATION GAP**.
- Baseline inherent: 4 x 5 = 20 (CRITICAL); residual: 2 x 5 = 10 (HIGH) (unchanged).
- Evidence: EVD-06/13; package.json scripts; repository workflows; core.hooksPath inspection.
- Existing controls / limits: Historical scans/secret handling; no repository-controlled hook requirement or equivalent enforcement acceptance is documented.
- Remaining treatment: TRT-B01: specify required prevention/enforcement scope before proposing optional hook; no proved credential exposure.
- Lifecycle: Documentary baseline only; no code change currently justified. All other gates retain PASS — REUSED / UNAFFECTED or N/A — NOT APPLICABLE for the present documentation delta; future affected gates require execution, not a premature PASS.
- Custodian: `ROLE ASSIGNMENT REQUIRED` (Security Lead); named assignment remains where required. Authority: PROJECT_OWNER_DECISION_ISO_C1_RISK_TREATMENT.md; treatment authorized, risk open, no residual acceptance.

### RSK-06

- Primary classification: **TECHNICAL DEFECT REMEDIATED / OPERATING PROMOTION PENDING**.
- Baseline inherent: 4 x 3 = 12 (HIGH); residual: 2 x 3 = 6 (MODERATE).
- Evidence: src/app/api/auth/register/route.ts POST lines 28-44; src/lib/auth/unified/rate-limiter.ts lines 23-200; tests/auth/registration-rate-limiter.test.ts. Technical commit dca5479; docs/governance/iso-conformity/ISO_C2_M3_REGISTRATION_PRE_EFFECT_RATE_LIMITING_EVIDENCE.md.
- Existing controls / limits: Pre-effect registration quota admission check enforced before bcrypt/DB writes; dual-dimension IP/Email pseudonymous reference hashing; fail-closed behavior verified; zero side effects under throttle.
- Remaining treatment: Controlled Preview promotion and live synthetic runtime quota verification.
- Lifecycle: Code Complete, Local Functional, Local Acceptance: PASS — EXECUTED; Local DB Migrated, Local Seed/Sync, Preview Migrated: PASS — REUSED / UNAFFECTED; Preview Acceptance: NOT_RUN (PREVIEW AUTHORIZATION REQUIRED); Production Deployment: NOT AUTHORIZED.
- Custodian: `ROLE ASSIGNMENT REQUIRED` (Cloud Ops); named assignment remains where required. Authority: PROJECT_OWNER_DECISION_ISO_C1_RISK_TREATMENT.md; treatment authorized, risk open, no residual acceptance.

### RSK-08

- Primary classification: **CI/CD / TOOLING DEFECT**.
- Baseline inherent: 4 x 4 = 16 (HIGH); residual: 3 x 4 = 12 (HIGH) (unchanged).
- Evidence: .github/workflows/security-supply-chain.yml lines 24,30,33; .github/workflows/glcc-ci.yml Node version; package.json engines.
- Existing controls / limits: Lockfile/SBOM mechanism exists; unconditional test failure suppression and stale execution runtime violate a fail-closed gate.
- Remaining treatment: DEF-TOOL-01 / Wave 1: preserve failures and explicit exception policy, align runtime; cadence evidence remains separately open.
- Lifecycle: CI code/functional/local acceptance affected; application DB and deployed behavior unaffected if workflow-only scope held. All other gates retain PASS — REUSED / UNAFFECTED or N/A — NOT APPLICABLE for the present documentation delta; future affected gates require execution, not a premature PASS.
- Custodian: `ROLE ASSIGNMENT REQUIRED` (Engineering); named assignment remains where required. Authority: PROJECT_OWNER_DECISION_ISO_C1_RISK_TREATMENT.md; treatment authorized, risk open, no residual acceptance.

### RSK-09

- Primary classification: **DOCUMENTATION GAP**.
- Baseline inherent: 3 x 5 = 15 (HIGH); residual: 3 x 5 = 15 (HIGH) (unchanged).
- Evidence: EVD-14 design only; ISO_SUPPLIER_AND_SUBPROCESSOR_REGISTER.md; EVD-20 and later EVD-08 hosting history.
- Existing controls / limits: No current reconciled deployment/configuration baseline; no proved drifted resource.
- Remaining treatment: TRT-E02: obtain inventory/configuration evidence; no custom audit script mandated by absence alone.
- Lifecycle: Documentary acceptance only; any later actual cloud change requires a new impact assessment. All other gates retain PASS — REUSED / UNAFFECTED or N/A — NOT APPLICABLE for the present documentation delta; future affected gates require execution, not a premature PASS.
- Custodian: `ROLE ASSIGNMENT REQUIRED` (Cloud Ops); named assignment remains where required. Authority: PROJECT_OWNER_DECISION_ISO_C1_RISK_TREATMENT.md; treatment authorized, risk open, no residual acceptance.

### RSK-12

- Primary classification: **EXTERNAL DEPENDENCY**.
- Baseline inherent: 4 x 4 = 16 (HIGH); residual: 3 x 4 = 12 (HIGH) (unchanged).
- Evidence: EVD-23 country matrix UNKNOWN/VALIDATION_REQUIRED.
- Existing controls / limits: Jurisdiction framework exists; legal transfer mechanisms unverified.
- Remaining treatment: TRT-B03: LEGAL/COUNSEL EVIDENCE; counsel determination, not code remediation.
- Lifecycle: Documentary legal acceptance; no runtime gate reopened now. All other gates retain PASS — REUSED / UNAFFECTED or N/A — NOT APPLICABLE for the present documentation delta; future affected gates require execution, not a premature PASS.
- Custodian: `ROLE ASSIGNMENT REQUIRED` (DPO); named assignment remains where required. Authority: PROJECT_OWNER_DECISION_ISO_C1_RISK_TREATMENT.md; treatment authorized, risk open, no residual acceptance.

### RSK-14

- Primary classification: **EXTERNAL DEPENDENCY**.
- Baseline inherent: 4 x 4 = 16 (HIGH); residual: 3 x 4 = 12 (HIGH) (unchanged).
- Evidence: EVD-21 provider integration review; EVD-22 checklist.
- Existing controls / limits: Separate provider routing; no SEA PayMongo/MannyPay fallback; real Xendit pending.
- Remaining treatment: TRT-C04: vendor account/country/channel/lifecycle evidence; no automatic failover.
- Lifecycle: GLOBAL-MKT real sandbox acceptance remains blocked; current ISO documentation unaffected. All other gates retain PASS — REUSED / UNAFFECTED or N/A — NOT APPLICABLE for the present documentation delta; future affected gates require execution, not a premature PASS.
- Custodian: `ROLE ASSIGNMENT REQUIRED` (Finance Lead); named assignment remains where required. Authority: PROJECT_OWNER_DECISION_ISO_C1_RISK_TREATMENT.md; treatment authorized, risk open, no residual acceptance.

### RSK-15

- Primary classification: **EXTERNAL DEPENDENCY**.
- Baseline inherent: 4 x 5 = 20 (CRITICAL); residual: 3 x 5 = 15 (HIGH) (unchanged).
- Evidence: EVD-22 Xendit checklist Callback preparation and Ordered real validation.
- Existing controls / limits: Durable callback-token fixtures; real account/payment/payout evidence missing.
- Remaining treatment: DEP-01 / TRT-C04: Xendit approval required; code not changed; full lifecycle limits persist.
- Lifecycle: External BLOCKED state belongs to GLOBAL-MKT real sandbox gate, not technical ISO failure. All other gates retain PASS — REUSED / UNAFFECTED or N/A — NOT APPLICABLE for the present documentation delta; future affected gates require execution, not a premature PASS.
- Custodian: `ROLE ASSIGNMENT REQUIRED` (Finance Lead); named assignment remains where required. Authority: PROJECT_OWNER_DECISION_ISO_C1_RISK_TREATMENT.md; treatment authorized, risk open, no residual acceptance.

### RSK-17

- Primary classification: **EXTERNAL DEPENDENCY**.
- Baseline inherent: 4 x 4 = 16 (HIGH); residual: 3 x 4 = 12 (HIGH) (unchanged).
- Evidence: EVD-21 Sumsub observed smoke / Outstanding evidence; src/app/api/listings/route.ts Verified-status guard.
- Existing controls / limits: Role/status checks exist; synthetic API/callback smoke does not prove universal KYC, actual fraud detection or completed marketplace lifecycle.
- Remaining treatment: TRT-E03/A03: retain fail-closed scoped controls; obtain provider lifecycle and human operating evidence before calling risk already controlled.
- Lifecycle: Provider-specific sandbox/full lifecycle gates pending; no forced rerun of prior fixtures. All other gates retain PASS — REUSED / UNAFFECTED or N/A — NOT APPLICABLE for the present documentation delta; future affected gates require execution, not a premature PASS.
- Custodian: `ROLE ASSIGNMENT REQUIRED` (Operations); named assignment remains where required. Authority: PROJECT_OWNER_DECISION_ISO_C1_RISK_TREATMENT.md; treatment authorized, risk open, no residual acceptance.

### RSK-21

- Primary classification: **CI/CD / TOOLING DEFECT** (`PROVEN — IMPLEMENTED`).
- Baseline inherent: 3 x 5 = 15 (HIGH); residual: 3 x 5 = 15 (HIGH) (unchanged).
- Evidence: scripts/security/phase5l-backup-restore-drill.ts; tests/security/resilience/phase5l-backup-restore.test.ts; ISO_C2_M2_SYNTHETIC_RECOVERY_OPERATING_EVIDENCE.md.
- Existing controls / limits: DEF-TOOL-02 repaired under M2: fail-closed pg_dump/pg_restore command execution, credential sanitization, and true measured source-vs-target state metrics (tables, rows, financial sums, relations, orphans, SHA-256 fingerprints) verified on PostgreSQL 16 (23/23 tests PASS). Actual live provider snapshot and PITR evidence remains open under operational governance.
- Remaining treatment: Wave 2 synthetic recovery assurance complete; operational provider restore drill remains open under governance.
- Lifecycle: Harness code/local functional/local acceptance PASS — EXECUTED. Isolated disposable DB used; fixtures cleaned. App DB migration and seed REUSED / UNAFFECTED. Preview/Production deployment N/A — NOT APPLICABLE.
- Custodian: `ROLE ASSIGNMENT REQUIRED` (Cloud Ops); named assignment remains where required. Authority: PROJECT_OWNER_DECISION_ISO_C1_RISK_TREATMENT.md; treatment authorized, risk open, no residual acceptance.

### RSK-22

- Primary classification: **OPERATING EVIDENCE GAP** (`PARTIAL — IMPLEMENTED / RETENTION CORRECTED / PROVIDER ACCESS VERIFIED / MANUAL OPERATION VERIFIED / SCHEDULER ACTOR REACTIVATED / SCHEDULED EVIDENCE PENDING`).
- Baseline inherent: 3 x 5 = 15 (HIGH); residual: 3 x 5 = 15 (HIGH) (unchanged).
- Evidence: EVD-15 plans; ISO_C2_M4_BACKUP_FRESHNESS_MONITORING_OPERATING_EVIDENCE.md; ISO_C2_M4_CONTINUITY_POLICY_DECISION.md; ISO_C2_M4_BACKUP_MONITORING_REMEDIATION_DESIGN.md; ISO_C2_M4_BACKUP_MONITORING_IMPLEMENTATION_EVIDENCE.md; ISO_C2_M4_MAIN_ACTIVATION_OPERATING_EVIDENCE.md; authenticated Neon read-back (`holy-shape-01357429`, branch `rentipid-production`).
- Existing controls / limits: Continuous multi-AZ WAL backup streaming active; 30-day retention remediated on Neon Scale plan (`history_retention_seconds: 2592000`, read-back PASS); monitoring workflow (`.github/workflows/backup-freshness-monitor.yml`) active on main (commit `c8a63f3`); runner syntax and provider API access remediated; manual monitor run 40068121351 verified HEALTHY; scheduler actor reactivated via PR #5 (cron `11,26,41,56 * * * *`).
- Remaining treatment: TRT-F02: observe and reconcile live scheduled cron runs on `main`.
- Lifecycle: Code complete and local acceptance PASS — EXECUTED; 49 contract tests PASS; database schema and seed REUSED / UNAFFECTED; preview/production app deployment N/A — NOT APPLICABLE; manual operating run 40068121351 HEALTHY; scheduler actor reactivated on main; scheduled operating evidence pending.
- Custodian: `Database Administrator` (Backup Control Owner), `Cloud Operations Lead` (Monitoring/Alert Response Owner), `Security Operations / ISO Governance` (Security Oversight); formally enacted by Project Owner. Authority: PROJECT_OWNER_DECISION_ISO_C1_RISK_TREATMENT.md; treatment authorized, risk open, no residual acceptance.

### RSK-23

- Primary classification: **OPERATING EVIDENCE GAP** (`PARTIAL`).
- Baseline inherent: 3 x 5 = 15 (HIGH); residual: 3 x 5 = 15 (HIGH) (unchanged).
- Evidence: Phase 5L synthetic recovery evidence; ISO_C2_M2_SYNTHETIC_RECOVERY_OPERATING_EVIDENCE.md; EVD-15 plans.
- Existing controls / limits: Synthetic recovery assurance harness repaired and verified under M2. Actual deployed-topology periodic and provider (Neon / AWS / Azure) restore assurance remains open and unperformed.
- Remaining treatment: TRT-F01: later authorized operational restore exercise for actual provider after harness repair; not an application defect.
- Lifecycle: Future actual restore drill mutates approved isolated DB; no production/Preview mutation inferred or authorized. All other gates retain PASS — REUSED / UNAFFECTED or N/A — NOT APPLICABLE for the present documentation delta; future affected gates require execution, not a premature PASS.
- Custodian: `ROLE ASSIGNMENT REQUIRED` (Database Admin); named assignment remains where required. Authority: PROJECT_OWNER_DECISION_ISO_C1_RISK_TREATMENT.md; treatment authorized, risk open, no residual acceptance.

### RSK-24

- Primary classification: **HUMAN/ORGANIZATIONAL GAP**.
- Baseline inherent: 2 x 5 = 10 (HIGH); residual: 2 x 5 = 10 (HIGH) (unchanged).
- Evidence: EVD-07/08 dated promotion/isolation; EVD-16 rollback plan.
- Existing controls / limits: No demonstrated multi-zone failover; policy/continuity ownership/exercise evidence pending.
- Remaining treatment: TRT-F03: human review, actual topology and later authorized exercise; no residual Accept.
- Lifecycle: Documentary acceptance now; any future service failover/infra change reopens affected environment gates. All other gates retain PASS — REUSED / UNAFFECTED or N/A — NOT APPLICABLE for the present documentation delta; future affected gates require execution, not a premature PASS.
- Custodian: `ROLE ASSIGNMENT REQUIRED` (Cloud Ops); named assignment remains where required. Authority: PROJECT_OWNER_DECISION_ISO_C1_RISK_TREATMENT.md; treatment authorized, risk open, no residual acceptance.

### RSK-26

- Primary classification: **EXTERNAL DEPENDENCY**.
- Baseline inherent: 3 x 5 = 15 (HIGH); residual: 2 x 5 = 10 (HIGH) (unchanged).
- Evidence: EVD-06 scoped fields; EVD-20 historical terms; current supplier register.
- Existing controls / limits: Some standard terms/scoped encryption evidenced; account-specific assurance/contracts not universal.
- Remaining treatment: TRT-E04: applicable supplier contractual/assurance records; no fabricated SOC/ISO/DPA.
- Lifecycle: Supplier evidence acceptance only; no provider revalidation now. All other gates retain PASS — REUSED / UNAFFECTED or N/A — NOT APPLICABLE for the present documentation delta; future affected gates require execution, not a premature PASS.
- Custodian: `ROLE ASSIGNMENT REQUIRED` (DPO); named assignment remains where required. Authority: PROJECT_OWNER_DECISION_ISO_C1_RISK_TREATMENT.md; treatment authorized, risk open, no residual acceptance.

### RSK-30

- Primary classification: **EXTERNAL DEPENDENCY**.
- Baseline inherent: 4 x 4 = 16 (HIGH); residual: 3 x 4 = 12 (HIGH) (unchanged).
- Evidence: EVD-23 tax/compliance matrices and jurisdiction evidence register.
- Existing controls / limits: Typed framework exists; ongoing legal interpretation/monitoring remains human counsel evidence.
- Remaining treatment: TRT-B03: LEGAL/COUNSEL EVIDENCE; country-specific review.
- Lifecycle: Documentary legal acceptance only; later legal changes do not authorize code until scoped. All other gates retain PASS — REUSED / UNAFFECTED or N/A — NOT APPLICABLE for the present documentation delta; future affected gates require execution, not a premature PASS.
- Custodian: `ROLE ASSIGNMENT REQUIRED` (Legal / DPO); named assignment remains where required. Authority: PROJECT_OWNER_DECISION_ISO_C1_RISK_TREATMENT.md; treatment authorized, risk open, no residual acceptance.

## 3. Four actual C1 conditional items (not the substituted draft list)

| Accepted C1 item | Risk / action | Exact disposition | Evidence and boundary |
|---|---|---|---|
| Secret enforcement/hook candidate | RSK-05 / TRT-B01 | DOCUMENTATION GAP | No compulsory local-hook design/acceptance baseline or complete alternative enforcement evidence; do not invent a hook defect |
| Ingress coverage candidate | RSK-06 / TRT-C02 | TECHNICAL DEFECT REMEDIATED / OPERATING CONFORMITY | DEF-RUNTIME-01 registration POST pre-effect quota guard implemented; 11/11 contract tests PASS; controlled Production promotion executed (deployment dpl_2733akwjwf1NGvcVGxggoCCUGjuB); below-threshold 201 PASS; over-threshold 429 + Retry-After: 3593 PASS; zero throttled side effects verified on Production; M3 closed |
| Dispute evidence checksums candidate | RSK-18 / TRT-D02 | DOCUMENTATION GAP | src/lib/global-market/post-transaction/services/claim-engine.ts submitClaimEvidence checks participant/size and freezes objects; no cryptographic checksum requirement/acceptance basis established. Not among the 15 authorized High risks; no automatic implementation |
| Backup monitoring candidate | RSK-22 / TRT-F02 | OPERATING EVIDENCE GAP | Actual deployed backup monitoring unproven; no specific wrong alarm/config established |

Original claimed hook/drift/restore defects are respectively a documentation gap, a documentation gap, and an operating evidence gap. DEF-TOOL-02 is a separately discovered real assurance-harness defect, not proof a new restore implementation is absent. Retention automation (TRT-B05) is approved deferred and was not one of the four accepted C1 technical items. Existing ingestion failure handling is not a new queue requirement. Candidate counts: 1 confirmed runtime defect, 2 documentation gaps, 1 operating evidence gap; no duplicate addition to the 15-risk totals. Additional confirmed tooling defects are catalogued separately above.


## 4. Subsequent M1 evidence delta

The classifications and source selectors above describe accepted C2-R1 historical findings. DEF-TOOL-01 / RSK-08 source repair and local acceptance are now evidenced by d012cdb982f86b34a3d7ed306743dc222584a287, ISO_C2_M1_COMPLETION_REPORT.md and evidence/iso-c2-m1-ci-enforcement.json. Failure/empty-selection suppression removed; runtime aligned; historical development exception bounded and counted. Remote enforcement, named accountability and recurring triage remain open; RSK-08 stays PARTIAL with residual 12 HIGH, not accepted. No other finding or historical maturity/count is reclassified by this scoped local proof.


## 5. ISO-C2-M1-E1 GitHub operating evidence

2026-10-21T19:03:53.026Z: authenticated GitHub inspection confirms both baseline commits on origin; zero Actions runs for their SHAs/ISO branch. Pushed workflow syntax, fail-closed design and configured Node 24 contract verified; runtime execution unobserved. No manual dispatch; default main lacks both M1 workflows. main protection returns 404 Branch not protected; repository/inherited rulesets and applicable main rules empty. All 22 inventoried branches unprotected. Only observed governance-SHA check is Vercel Preview Comments ID 119422291335 (not qualifying). RSK-08 selects C: PARTIAL — GITHUB CONFIGURATION REMEDIATION REQUIRED; residual 12 HIGH unchanged, not accepted. See ISO_C2_M1_GITHUB_CI_AND_BRANCH_PROTECTION_EVIDENCE.md for exact API references, required settings and local gate reuse. No Wave 2.


## 6. ISO-C2-M1-E2 activation and protection evidence

Activation 98494bf8cc17dd9bb798bb6deb06065d81079035 adds only ISO branch push filters. Security run 39658807274 / check supply-chain-validation and GLCC run 39658807135 / check Localization Acceptance CI executed and failed. Real Node 24 verified. Audit ran and rejected 65 findings (3 critical/28 high/34 moderate); downstream security steps skipped. GLCC runner assertions and DB guard prerequisites failed, zero tests executed. Main classic protection independently verified: PR+1 approval, stale-dismissal, last-push approval, conversation resolution, admin enforcement, no force push/deletion; no unrestricted bypass configured. Required checks/strict mode DEFERRED because main lacks M1 and no context succeeded. RSK-08 selects C: PARTIAL — CONFIGURATION REMEDIATION REMAINS; score unchanged/unaccepted. See ISO_C2_M1_GITHUB_CI_AND_BRANCH_PROTECTION_EVIDENCE.md. Historical E1 absence findings above are superseded only for activation/non-check protection, not rewritten.


## 7. ISO-C2-M1-E3 bounded root-cause evidence

Original runs 39658807274/39658807135 reviewed from actual logs. Full 65-entry audit classification and 23 consolidated via components are recorded in ISO_C2_M1_CI_FAILURE_ROOT_CAUSE_AND_REMEDIATION.md and structured evidence. Safe runtime dependency candidate clears 49 original package entries; current 33 entries (0 critical/14 high/19 moderate), five chains still fail unchanged policy. No exception. Corrected GLCC command reuses accepted current 46/47/25 in-memory runner, 14 checks PASS; historical assertions are not rewritten. 23 affected M1 contracts, 104 targeted tests, image/telemetry smoke, build and typecheck PASS. Runtime change requires later Preview/Production revalidation; no deployment. Three major compatibility and two unpatched-upstream chains remain. RSK-08 PARTIAL — REMEDIATION IN PROGRESS, score unchanged/unaccepted. Changes uncommitted/unpushed under failed local acceptance.


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

## ISO-C2-M3-D1-E1 Registration Pre-Effect Rate Limiting Implementation & Promotion Readiness (2026-10-22)

Work Package ISO-C2-M3-D1-E1 executed under Project Owner authorization for Wave 3 registration pre-effect rate limiting implementation. Confirmed runtime defect DEF-RUNTIME-01 was remediated in `src/app/api/auth/register/route.ts` and `src/lib/auth/unified/rate-limiter.ts`. A pre-effect rate-limit admission check was placed immediately following input validation, strictly before `bcrypt.hash(password, 10)` (first expensive CPU resource side effect), before `prisma.user.findUnique`, and before `prisma.$transaction` creating account records. Reused existing `"AuthRateLimit"` PostgreSQL table; schema and seeds unchanged. Rate limiter keying utilizes dual-dimension pseudonymous reference hashes (HMAC-SHA256) for IP and normalized email with zero raw PII stored. Header spoofing defense extracts the terminal element from `X-Forwarded-For`. Failure behavior is strictly fail-closed. Targeted contract tests (`tests/auth/registration-rate-limiter.test.ts`) verified 11/11 checks PASS, proving zero CPU hashing, zero DB writes, zero audit logs, and zero emails dispatched on throttled or error requests. Shared auth tests (15/15) and MFA limiter tests (4/4) PASS. Typecheck PASS (0 errors). Technical commit `dca5479` pushed to `feat/iso-conformity-v1.0`. RSK-06 classified as **PROVEN — IMPLEMENTED** (residual score 6 MODERATE). Controlled Preview promotion requires separate authorization before runtime deployment. See [M3 Evidence](ISO_C2_M3_REGISTRATION_PRE_EFFECT_RATE_LIMITING_EVIDENCE.md).

## ISO-C2-M3-D2-E2 Controlled Preview Promotion & Registration Rate-Limit Runtime Verification (2026-10-22)

Work Package ISO-C2-M3-D2-E2 executed under explicit Project Owner authorization for controlled Preview promotion and runtime verification of ISO-C2-M3. Technical candidate `dca5479` / deployment `7251560631` (`710122f`) was verified active on Vercel Preview (`https://ren-tipid-mc05sddzv-jburns2372-sys-projects.vercel.app`) targeting isolated non-production Neon Preview branch `rentipid-listingbridge-preview` (`holy-shape-01357429`). Zero schema migrations were required (`PASS — REUSED / UNAFFECTED`). Executed bounded runtime verification using synthetic identity `iso-c2-m3-preview-1792671679111@example.invalid`:
1. Sub-threshold Attempt 1 returned `201 Created` with expected body `{"message":"Registration accepted. Check your email to verify your account."}`.
2. In-quota Attempts 2 through 5 returned `409 Conflict` (limiter allowed; duplicate user detected by downstream logic) with counter predictably incrementing in PostgreSQL `"AuthRateLimit"`.
3. Over-threshold Attempt 6 returned `429 Too Many Requests` with header `Retry-After: 3546` and sanitized message `{"message":"Too many registration attempts. Please try again later."}`.
4. Zero side effects proven on blocked request: 0 user records created, 0 credentials created, 0 profiles created, 0 password hashes computed, 0 audit logs written, 0 emails dispatched, 0 sessions created.
5. Storage backend confirmed as PostgreSQL `"AuthRateLimit"` table; keys confirmed pseudonymous HMAC-SHA256 digests (`auth:register:identity:<hash>` and `auth:register:network:<hash>`) with zero raw PII stored; zero secrets exposed; Production environment and database untouched. RSK-06 classified as **PROVEN — IMPLEMENTED / PREVIEW VERIFIED**. Milestone ISO-C2-M3 Preview acceptance classified as **PASS — EXECUTED**. Production promotion requires separate authorization. See [M3 Evidence](ISO_C2_M3_REGISTRATION_PRE_EFFECT_RATE_LIMITING_EVIDENCE.md).

## ISO-C2-M3-D3-E3 Controlled Production Promotion & Operating Verification (2026-10-22)

Work Package ISO-C2-M3-D3-E3 executed under explicit Project Owner authorization for controlled Production promotion and operating verification of ISO-C2-M3. Exact accepted application candidate `dca547904791535ca44485747065961dbf8fc421` (source deployment `dpl_HqiN1awwSPk3VkGYzfoiPaeJ1nR7` / GitHub deployment `7251560631`) was promoted to Production via Vercel Production Promotion (`npx vercel promote <DEPLOYMENT>`). Resulting Production deployment `dpl_2733akwjwf1NGvcVGxggoCCUGjuB` was verified `● Ready` with direct URL `https://ren-tipid-cjeiwwle4-jburns2372-sys-projects.vercel.app` and canonical aliases `https://ren-tipid-jburns2372-sys-projects.vercel.app` and `https://www.rentipid.com.ph`. Main merge was not required and not performed. Target database is Neon PostgreSQL branch `rentipid-production` (`holy-shape-01357429` / `br-proud-sunset-ap0ofil2`). Production database migration: `N/A — NOT REQUIRED / NO SCHEMA CHANGE`. Production health API verified `HTTP 200 OK`, `{"status":"ready","database":"connected"}`. Bounded runtime verification was executed using synthetic identity `iso-c2-m3-prod-1792672640027@example.invalid`:
1. Below-threshold Attempt 1 returned `201 Created` with expected contract `{"message":"Registration accepted. Check your email to verify your account."}` (duration: 2627ms).
2. In-quota Attempts 2 through 5 returned `409 Conflict` (limiter allowed; conflict detected by downstream logic) with quota points accumulating in PostgreSQL `"AuthRateLimit"`.
3. Over-threshold Attempt 6 returned `429 Too Many Requests` with header `Retry-After: 3593` and sanitized message `{"message":"Too many registration attempts. Please try again later."}` (duration: 539ms).
4. Zero side effects proven on blocked request: 0 user records created, 0 credentials created, 0 profiles created, 0 password hashes computed, 0 audit logs written, 0 emails dispatched, 0 sessions created.
5. Rate limiter storage backend confirmed as PostgreSQL `"AuthRateLimit"` table; keys confirmed pseudonymous HMAC-SHA256 digests with zero raw PII stored; zero secrets exposed; real customer data was not used; unrelated Production environment untouched. Retained single bounded synthetic record as documented test data. RSK-06 classified as **PROVEN — OPERATING CONFORMITY**. Milestone ISO-C2-M3 classified as **PASS — OPERATING CONTROL VERIFIED**. M3 authorized implementation is **CLOSED**. No residual risk accepted. See [M3 Evidence](ISO_C2_M3_REGISTRATION_PRE_EFFECT_RATE_LIMITING_EVIDENCE.md).

## ISO-C2-M1-R1-D1-E1 Next.js Security Advisory Drift Remediation & Targeted Preview Validation (2026-10-24)

Work Package ISO-C2-M1-R1-D1-E1 executed under explicit Project Owner authorization to remediate upstream external advisory drift against production framework dependency `next@16.3.8`. Critical advisories `GHSA-2464-fhr4-w9xw` (Image Optimization SVG RCE) and `GHSA-673q-mjm6-r5xr` (`use cache` RCE) were cleared by upgrading Next.js to provider-maintainer patched release `16.4.1` (commit `d576876`). Unrelated dependency churn was prevented (`package.json` and `package-lock.json` only). Supply-chain validation confirmed zero critical findings remaining. TypeScript typecheck (`npx tsc --noEmit`) and production build (`npm run build`) passed with zero errors. Targeted regression test suites (auth rate limiter 11/11, unified auth routes 15/15, MFA rate limiter 4/4, standalone security contracts 51/51) passed cleanly. Controlled Vercel Preview deployment `dpl_73N85X1x5uza9mQSEJAVmXY25kGa` compiled and reached `● Ready` (`https://ren-tipid-8diwcglow-jburns2372-sys-projects.vercel.app`). Bounded runtime smoke checks verified `/api/health` (`200 OK`, `{"status":"ready","database":"connected"}`), `/how-it-works` (`200 OK`), `/api/auth/csrf` (`200 OK`), and registration contract validation (`400 Bad Request`). M3 rate-limiting control was revalidated (`PASS — REVALIDATED DUE TO DELTA`). M1 security advisory reopen status: `PASS — REVALIDATED DUE TO DELTA`. RSK-08 remains **PROVEN — OPERATING CONFORMITY** with technical candidate validated pending Production promotion. Independent October 23 advisories (`GHSA-xcx6-jx8p-x3h5`, `GHSA-27r3-jxmh-p828`, `GHSA-mrhx-c7xc-m3w5`) require separate governed disposition under ISO-C2. Production remains on `dca547904791535ca44485747065961dbf8fc421`; PR #1 remains open and unmerged. No residual risk accepted. See [M1 Next.js Advisory Remediation Evidence](ISO_C2_M1_NEXTJS_SECURITY_ADVISORY_DRIFT_REMEDIATION.md).

## ISO-C2-M1-R1-D1-E2 Remaining NPM Security Advisory Triage + Minimum Remediation + Preview Revalidation (2026-10-24)

Work Package ISO-C2-M1-R1-D1-E2 executed under explicit Project Owner authorization to remediate all remaining security advisory drift affecting the repository's unchanged M1 audit contract following the Next.js 16.4.1 patch. Successfully eliminated 9 high-severity findings across `@azure/msal-node` (`GHSA-xcx6-jx8p-x3h5`, constrained to `7.1.1`), `body-parser` (`GHSA-27r3-jxmh-p828`, constrained to `2.4.0`), and `zod` (`GHSA-mrhx-c7xc-m3w5`, updated to `4.6.7` directly and in overrides) in technical commit `54e2fd6`. `npm audit` returned 0 vulnerabilities; `node scripts/security/check-ci-audit.cjs` returned `pass: true` (0 total, 0 rejected, exit code 0). Unrelated dependency churn was prevented. TypeScript typecheck (`npx tsc --noEmit`) and production build (`npm run build`) passed with zero errors. Targeted regression test suites (registration rate limiter 11/11, unified auth routes 15/15, MFA rate limiter 4/4, standalone security contracts 51/51) passed cleanly (81/81 PASS). New controlled Vercel Preview deployment `dpl_JDJFVo2ssj3i3F9u6RgzoqtWMxLw` (`https://ren-tipid-q1lquo4cb-jburns2372-sys-projects.vercel.app`) was compiled and reached `● Ready`. Bounded runtime smoke checks verified `/api/health` (`200 OK`), `/how-it-works` (`200 OK`), `/api/auth/csrf` (`200 OK`), registration validation contract (`400 Bad Request`), and `/browse` (`200 OK`). Milestone M1 enforcement control remains **PASS — REUSED / UNAFFECTED**; M1 advisory remediation is **PASS — REVALIDATED DUE TO DELTA**; M3 is **PASS — REVALIDATED DUE TO DELTA**; RSK-08 remains **PROVEN — OPERATING CONFORMITY**. Production remains on `dca547904791535ca44485747065961dbf8fc421` pending Project Owner authorization; PR #1 remains open/blocked. No residual risk accepted. Overall ISO certification is not claimed. See [M1 Advisory Remediation Evidence](ISO_C2_M1_NEXTJS_SECURITY_ADVISORY_DRIFT_REMEDIATION.md).

## ISO-C2-M1-R1-D2-E1 Patched Security Candidate Production Promotion + Operating Revalidation (2026-10-24)

Work Package ISO-C2-M1-R1-D2-E1 executed under explicit Project Owner authorization to promote exact patched technical candidate `54e2fd6d0eacdd91619f542f9888c66e7a9b52d8` to Production, completing the ISO-C2 M1 advisory-drift remediation. Pre-promotion Production deployment `dpl_2733akwjwf1NGvcVGxggoCCUGjuB` (source `dca5479`) was superseded by promoting accepted Vercel Preview artifact `dpl_JDJFVo2ssj3i3F9u6RgzoqtWMxLw` via `npx vercel promote dpl_JDJFVo2ssj3i3F9u6RgzoqtWMxLw --yes`. Resulting live Production deployment `dpl_3uG9ryAf6UQzZbTUFg5fgXVjiveh` reached `● Ready` with direct URL `https://ren-tipid-8t2yhdy6h-jburns2372-sys-projects.vercel.app` and canonical aliases `https://www.rentipid.com.ph`, `https://rentipid.com.ph`, and `https://ren-tipid.vercel.app`. Deployed source correspondence to `54e2fd6d0eacdd91619f542f9888c66e7a9b52d8` was verified. Database safety confirmed: zero migrations executed, zero schema modifications, zero seeds run, zero customer data accessed. Bounded Production health verification passed (`GET /api/health` returned HTTP 200 `{"status":"ready","database":"connected"}`, `GET /how-it-works` returned HTTP 200 OK, `GET /api/auth/csrf` returned HTTP 200 OK, `POST /api/auth/register` with empty body returned HTTP 400 Bad Request). Targeted M3 registration pre-effect rate limiting revalidation passed on live Production: sub-threshold requests permitted (409 Conflict returned on existing synthetic fixture `iso-c2-m3-prod-1792672640027@example.invalid`), quota point accumulation verified, over-threshold attempt 6 rejected with HTTP 429 Too Many Requests and `Retry-After: 3591`, zero customer accounts created, zero side effects. Deployed dependencies correspond to `next@16.4.1`, `@azure/msal-node@7.1.1`, `body-parser@2.4.0`, and `zod@4.6.7` with all five advisories (`GHSA-2464-fhr4-w9xw`, `GHSA-673q-mjm6-r5xr`, `GHSA-xcx6-jx8p-x3h5`, `GHSA-27r3-jxmh-p828`, `GHSA-mrhx-c7xc-m3w5`) cleared. Milestone M1 enforcement control: **PASS — REUSED / UNAFFECTED**; M1 advisory remediation: **PASS — OPERATING REMEDIATION VERIFIED**; M2: **PASS — REUSED / UNAFFECTED**; M3: **PASS — REVALIDATED DUE TO DELTA**; M4 implementation: **PASS — REUSED / UNAFFECTED**; RSK-08: **PROVEN — OPERATING CONFORMITY**; RSK-22: **PARTIAL — IMPLEMENTED / RETENTION CORRECTED / SCHEDULED OPERATION PENDING MAIN ACTIVATION**; RSK-23: **PARTIAL — UNCHANGED**. `54e2fd6d0eacdd91619f542f9888c66e7a9b52d8` designated as new accepted Production application baseline. PR #1 remains unmerged/unmodified on branch `iso-c2-main-production-sync` awaiting baseline reconciliation. No residual risk accepted. Overall ISO certification is not claimed. See [M1 Advisory Remediation Evidence](ISO_C2_M1_NEXTJS_SECURITY_ADVISORY_DRIFT_REMEDIATION.md).

## ISO-C2-M4-D5-E2 Controlled Six-File M4 Main Activation & Scheduled Operating Evidence (2026-10-24)

Work Package ISO-C2-M4-D5-E2 executed under Project Owner authorization, continued by Antigravity following interrupted Codex execution. Discovered that Codex created activation branch `iso-c2-m4-main-activation` (`e7555b4`) containing the exact six accepted M4 technical files from commit `ba0a474022281621311458e95ea0b3a26e2ee776`, opened PR #2, verified all required CI checks passed (`supply-chain-validation` and `Localization Acceptance CI`), and merged PR #2 into `main` at `e9bec066f62798618d77eaf122b080fc34d51d77` under authorized sole-maintainer change control. Incidental Vercel production deployment `dpl_ARD5gX7romaPxGfMPT5VortJfjYv` reached `● Ready` with healthy endpoints. Targeted M4 contract tests passed completely (49/49 PASS). Manual `workflow_dispatch` trigger on `main` was rejected by GitHub Actions API (`HTTP 422: Invalid Argument - failed to parse workflow: Unrecognized named-value: 'runner' in jobs.monitor.env.M4_EVIDENCE_FILE`). In GitHub Actions syntax, `${{ runner.temp }}` is valid only in step-level expressions, causing GitHub Actions to reject dispatch and disable cron scheduling. Because modifying M4 source code or pushing directly to `main` is strictly prohibited under package authorization, package execution is BLOCKED pending governed workflow runner syntax remediation. RSK-22 remains **PARTIAL — IMPLEMENTED / RETENTION CORRECTED / SCHEDULED OPERATION PENDING WORKFLOW SYNTAX REMEDIATION**; RSK-23 remains **PARTIAL — UNCHANGED**. No residual risk accepted. See [M4 Main Activation Evidence](ISO_C2_M4_MAIN_ACTIVATION_OPERATING_EVIDENCE.md).

## ISO-C2-M4-D5-E3 M4 Workflow Runner Syntax Remediation & Operating Continuation (2026-10-24)

Work Package ISO-C2-M4-D5-E3 executed under Project Owner authorization to correct the GitHub Actions runner syntax defect (`${{ runner.temp }}` at job env level in `.github/workflows/backup-freshness-monitor.yml`). Technical remediation commit `3108997` replaced the expression with `/tmp/m4-evidence.json` strictly across 1 file. Workflow contract test passed (1/1 PASS). Protected PR #4 created; all required CI passed (`Localization Acceptance CI` 42s, `supply-chain-validation` 1m36s). PR #4 merged into `main` at `53edb1196ecca5faf2323766a323fa0ac1b43960` under authorized sole-maintainer control. Incidental Vercel production deployment `dpl_59VmH5qFsNY8kposzbDnwfJNCa4b` reached Ready with healthy endpoints. Post-fix manual workflow dispatch run 40066228412 executed on runner; step `Collect provider evidence` exited with code 1 due to `failure_reason: API_UNAVAILABLE` on Neon API; fail-closed monitor actions script updated open alert Issue #3 and exited 1. Under Step 17 hard stop rules, execution stopped without modifying any other technical files. RSK-22 classified as **PARTIAL — IMPLEMENTED / RETENTION CORRECTED / WORKFLOW REMEDIATED / PROVIDER API UNAVAILABLE**. RSK-23 remains **PARTIAL — UNCHANGED**. No residual risk accepted. Overall ISO certification is not claimed. See [M4 Operating Evidence](ISO_C2_M4_MAIN_ACTIVATION_OPERATING_EVIDENCE.md).

---

## ISO-C2-M4-D5-E4 Neon Provider API Access Diagnosis, Credential Remediation & Operating Evidence (2026-10-24)

Work Package ISO-C2-M4-D5-E4 executed under Project Owner authorization to diagnose and remediate provider API access in the M4 backup freshness monitoring automation. Sanitized diagnostics on failed run 40066228412 confirmed step `Collect provider evidence` failed in 53ms (`failure_reason: API_UNAVAILABLE`). Live Neon control plane inspection confirmed project `holy-shape-01357429` active on Scale plan (`scale_v3`), `history_retention_seconds: 2592000` (30 days), and production branch `br-proud-sunset-ap0ofil2` in state `ready` with `protected: true`. Safe in-memory read-only API diagnostic confirmed live project and branch endpoints return HTTP 200 OK with compliant schemas, proving script request construction in `scripts/security/check-backup-freshness.mjs` is 100% valid with zero source changes required (`SOURCE CHANGE REQUIRED: NO`). Minted replacement project-scoped key `rentipid-backup-monitoring-v1` (ID `3461258`) restricted strictly to target project `holy-shape-01357429`, verified in memory, installed directly into GitHub repository secret `NEON_API_KEY` via stdin, and revoked superseded key `3459133`. Post-remediation manual workflow dispatch run 40068121351 executed on `main`: step `Collect provider evidence` PASSED with status `HEALTHY` (project match: true, branch match: true, state: ready, protected: true, retention: 2592000s compliant). Step `Enforce evidence freshness and reconcile incident` evaluated `evidence_freshness_status: MISSING` pending initial automated cron execution. Scheduled run observation: PENDING. Zero customer data accessed; zero database modifications; zero restore/PITR drills executed. RSK-22 classified as **PARTIAL — IMPLEMENTED / RETENTION CORRECTED / PROVIDER ACCESS VERIFIED / MANUAL OPERATION VERIFIED / SCHEDULED EVIDENCE PENDING**. RSK-23 remains **PARTIAL — UNCHANGED**. No residual risk accepted. See [M4 Operating Evidence](ISO_C2_M4_MAIN_ACTIVATION_OPERATING_EVIDENCE.md).

---

## ISO-C2-M4-D5-E7 GitHub Scheduled-Workflow Actor Reactivation & Operating Evidence (2026-10-24)

Work Package ISO-C2-M4-D5-E7 executed under Project Owner authorization to address the absence of real GitHub Actions `schedule` events over >=4 elapsed 15-minute cron boundaries (`06:07`, `06:22`, `06:37`, `06:52 UTC`) following successful manual monitor verification and provider credential rotation. Applied GitHub-documented scheduled-workflow actor reactivation by updating the cron expression in `.github/workflows/backup-freshness-monitor.yml` from `'7,22,37,52 * * * *'` to `'11,26,41,56 * * * *'`, preserving the exact 15-minute cadence (4 executions per hour). Updated `tests/security/iso-c2-m4-workflow.contract.cjs` to reflect the updated schedule string without weakening validation (1/1 PASS; monitor contract 38/38 PASS). Technical commit `e51191306ec711800fa83273ad86a15d84624640` pushed to `iso-c2-m4-scheduler-actor-reactivation` and opened PR #5. Required CI passed cleanly (`Localization Acceptance CI` 48s, `supply-chain-validation` 1m45s). PR #5 merged into `main` at `c8a63f3541132ec151f28a79577adaa142c0bcf5` under authorized sole-maintainer control (no branch protection bypass). Workflow on `main` re-verified active with 15-minute cadence. Post-reactivation scheduled execution observation: PENDING. Zero customer data accessed; zero database modifications; zero restore/PITR drills executed. RSK-22 classified as **PARTIAL — IMPLEMENTED / RETENTION CORRECTED / PROVIDER ACCESS VERIFIED / MANUAL OPERATION VERIFIED / SCHEDULER ACTOR REACTIVATED / SCHEDULED EVIDENCE PENDING**. RSK-23 remains **PARTIAL — UNCHANGED**. No residual risk accepted. See [M4 Operating Evidence](ISO_C2_M4_MAIN_ACTIVATION_OPERATING_EVIDENCE.md).




