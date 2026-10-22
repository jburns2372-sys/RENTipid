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

