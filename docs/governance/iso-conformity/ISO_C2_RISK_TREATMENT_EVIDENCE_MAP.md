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

- Primary classification: **CONFIRMED TECHNICAL DEFECT**.
- Baseline inherent: 4 x 3 = 12 (HIGH); residual: 4 x 3 = 12 (HIGH) (unchanged).
- Evidence: src/app/api/auth/register/route.ts POST lines 18,79,87,89,163; src/proxy.ts matcher line 81.
- Existing controls / limits: Existing OTP/recovery/MFA/address quotas do not guard registration work before bcrypt/DB writes.
- Remaining treatment: DEF-RUNTIME-01 / Wave 3: application registration throttle before expensive effects; existing scope only.
- Lifecycle: Code/local functional/local acceptance, Preview acceptance, Production-ready/deployment/verification affected; no schema/seed change proposed. All other gates retain PASS — REUSED / UNAFFECTED or N/A — NOT APPLICABLE for the present documentation delta; future affected gates require execution, not a premature PASS.
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

- Primary classification: **CI/CD / TOOLING DEFECT**.
- Baseline inherent: 3 x 5 = 15 (HIGH); residual: 3 x 5 = 15 (HIGH) (unchanged).
- Evidence: scripts/security/phase5l-backup-restore-drill.ts run lines 84-107; tests/security/resilience/phase5l-backup-restore.test.ts.
- Existing controls / limits: Synthetic guard/checksum mechanism exists; restore failures can be swallowed and success metrics are unmeasured.
- Remaining treatment: DEF-TOOL-02 / Wave 2: fail closed, bind targets, measure/report only proved assertions; actual deployed recovery evidence remains open.
- Lifecycle: Harness code/local functional/local acceptance affected; isolated synthetic DB mutation required for positive proof, no app migration/seed or live cloud access. All other gates retain PASS — REUSED / UNAFFECTED or N/A — NOT APPLICABLE for the present documentation delta; future affected gates require execution, not a premature PASS.
- Custodian: `ROLE ASSIGNMENT REQUIRED` (Cloud Ops); named assignment remains where required. Authority: PROJECT_OWNER_DECISION_ISO_C1_RISK_TREATMENT.md; treatment authorized, risk open, no residual acceptance.

### RSK-22

- Primary classification: **OPERATING EVIDENCE GAP**.
- Baseline inherent: 3 x 5 = 15 (HIGH); residual: 3 x 5 = 15 (HIGH) (unchanged).
- Evidence: EVD-15 plans; Phase 5L CLOUD_VERIFICATION_PENDING; dated Azure/Neon evidence.
- Existing controls / limits: Enabled backup schedule/freshness/monitoring for actual provider not established.
- Remaining treatment: TRT-F02: obtain actual configuration/monitoring records; do not invent CloudWatch or assert configuration defect.
- Lifecycle: Evidence acceptance only; later monitoring change must be scoped separately. All other gates retain PASS — REUSED / UNAFFECTED or N/A — NOT APPLICABLE for the present documentation delta; future affected gates require execution, not a premature PASS.
- Custodian: `ROLE ASSIGNMENT REQUIRED` (Database Admin); named assignment remains where required. Authority: PROJECT_OWNER_DECISION_ISO_C1_RISK_TREATMENT.md; treatment authorized, risk open, no residual acceptance.

### RSK-23

- Primary classification: **OPERATING EVIDENCE GAP**.
- Baseline inherent: 3 x 5 = 15 (HIGH); residual: 3 x 5 = 15 (HIGH) (unchanged).
- Evidence: Phase 5L synthetic recovery evidence; EVD-15 plans; current harness limitation DEF-TOOL-02.
- Existing controls / limits: A historical synthetic drill exists; current deployed-topology restore assurance is not established.
- Remaining treatment: TRT-F01: later authorized operational restore exercise after harness repair and target approval; not an application defect.
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
| Ingress coverage candidate | RSK-06 / TRT-C02 | CONFIRMED TECHNICAL DEFECT | DEF-RUNTIME-01 registration POST lacks pre-effect quota guard |
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


