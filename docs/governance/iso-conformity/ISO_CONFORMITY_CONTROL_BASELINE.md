# RENTipid ISO Conformity Control Baseline

**Document ID:** `RENTIPID-ISO-CONFORMITY-001-CB`  
**Program:** RENTipid ISO Compliance & Conformity Program  
**Project ID:** `RENTIPID-ISO-CONFORMITY-001`  
**Version:** `v1.0`  
**Status:** `BASELINE EVALUATION COMPLETE`  

---

## 1. Conformity Maturity Taxonomy

To satisfy ISO certification scrutiny, the program explicitly differentiates three dimensions of conformity:

1. **Design Conformity:** The control or policy is formally defined, documented, scoped, and approved.
2. **Implementation Conformity:** The technical control, mechanism, or workflow exists and is verified in code, configuration, or environment architecture.
3. **Operating Conformity:** The control is demonstrably active in live operations, producing verifiable logs, periodic review artifacts, or operational evidence over time.

### Controlled Status Vocabulary
* `PROVEN — OPERATING CONFORMITY`: Control has implementation plus actual dated operational evidence for the identified scope; historical observations do not prove continuous current operation.
* `PROVEN — IMPLEMENTED`: Control is designed and verified in code/configuration, but long-term recurring operational artifacts are still accumulating.
* `PARTIAL`: Core design or partial implementation exists; supplementary tooling or operational rigor is needed.
* `GAP`: Control is required by scope but lacks complete technical implementation or formalization.
* `NOT APPLICABLE`: Control is demonstrably out of scope with documented justification.
* `BLOCKED`: Implementation or verification is halted pending external technical or organizational prerequisites.
* `REQUIRES HUMAN EVIDENCE`: Control requires non-code human action (e.g., executive review, manual access certification, board sign-off).
* `REQUIRES EXTERNAL PROVIDER EVIDENCE`: Control requires third-party proof (e.g., processor compliance certification, vendor DPA, partner onboarding approval).

---

## 2. Assessment of 30 Core Control Domains

| Domain ID | Control Domain | Applicable Standard Clauses | Design | Implementation | Operating | Overall Conformity Status | Inherited Evidence Reference | Corrective Wave / Target Phase |
|---|---|---|---|---|---|---|---|---|
| **CTRL-01** | Governance & Leadership | ISO 27001 Cl 5.1–5.3, ISO 27701 Cl 5.2 | DESIGNED | IMPLEMENTED | PENDING_REVIEW | `REQUIRES HUMAN EVIDENCE` | `EVD-01`, `EVD-07`, `EVD-18` | Wave A / ISO-C5 (Management Review) |
| **CTRL-02** | Risk Management | ISO 27001 Cl 6.1, 8.2, 8.3 | DESIGNED | IMPLEMENTED | PENDING_APPROVAL | `REQUIRES HUMAN EVIDENCE` | `EVD-24` (`PHASE5M_ISMS_RISK_AND_CONTROL_REGISTER.md`) | Wave A / ISO-C1 (Formal Risk Sign-off) |
| **CTRL-03** | Asset Management | ISO 27001 Annex A 5.9–5.14 | DESIGNED | IMPLEMENTED | ACCUMULATING | `PROVEN — IMPLEMENTED` | `EVD-09`, `EVD-10`, `EVD-13` | Wave E / ISO-C1 (Asset Register) |
| **CTRL-04** | Identity & Authentication | ISO 27001 Annex A 5.16, 5.17, 8.5 | DESIGNED | IMPLEMENTED | ACCUMULATING | `PROVEN — IMPLEMENTED` | `EVD-03` (NextAuth, evidenced bcrypt password/session mechanisms, MFA model) | Wave A / ISO-C2 |
| **CTRL-05** | Authorization & Privileged Access | ISO 27001 Annex A 5.15, 5.18, 8.2 | DESIGNED | IMPLEMENTED | PENDING_AUDIT | `REQUIRES HUMAN EVIDENCE` | `EVD-04` (PBAC/RBAC, server guards) | Wave A / ISO-C3 (Quarterly Access Review) |
| **CTRL-06** | Secrets & Cryptography | ISO 27001 Annex A 8.24 | DESIGNED | IMPLEMENTED | NOT_PROVEN | `PROVEN — IMPLEMENTED` | `EVD-06` (Phase 5F envelope encryption) | Wave B / ISO-C2 |
| **CTRL-07** | Source Control & Branching | ISO 27001 Annex A 8.4, 8.32 | DESIGNED | IMPLEMENTED | NOT_PROVEN | `PROVEN — IMPLEMENTED` | `EVD-02`, `EVD-13` (Git workflow exists; remote branch protection enforcement not verified) | Wave E / ISO-C2 |
| **CTRL-08** | Secure SDLC | ISO 27001 Annex A 8.25, 8.27, 8.28 | DESIGNED | IMPLEMENTED | NOT_PROVEN | `PROVEN — IMPLEMENTED` | `EVD-01`, `EVD-07`, TypeScript strictness | Wave E / ISO-C2 |
| **CTRL-09** | Change Management | ISO 27001 Annex A 8.32, Cl 6.3 | DESIGNED | IMPLEMENTED | OPERATING | `PROVEN — OPERATING CONFORMITY` | `EVD-07` (dated executed promotion report, not policy alone) | Historical executed promotion / ongoing evidence required |
| **CTRL-10** | CI/CD Pipelines | ISO 27001 Annex A 8.25, 8.31 | DESIGNED | PARTIAL | NOT_PROVEN | `PARTIAL` | EVD-02/13 historical results; current workflow failure suppression DEF-TOOL-01 (ISO_C2_SDLC_CHANGE_CONTROL_VERIFICATION.md Section 2) | Wave E / ISO-C2 |
| **CTRL-11** | Environment Separation | ISO 27001 Annex A 8.31, ISO 27017 | DESIGNED | IMPLEMENTED | OPERATING | `PROVEN — OPERATING CONFORMITY` | `EVD-08` (dated Preview isolation restoration report Sections 2-3) | Historical isolation restoration / ongoing evidence required |
| **CTRL-12** | Database Security | ISO 27001 Annex A 8.11, 8.24 | DESIGNED | IMPLEMENTED | NOT_PROVEN | `PROVEN — IMPLEMENTED` | `EVD-08`, `EVD-09` (Prisma schema, parameterization) | Wave B / ISO-C2 |
| **CTRL-13** | Logging & Telemetry | ISO 27001 Annex A 8.15, 8.16 | DESIGNED | IMPLEMENTED | SYNTHETIC_ONLY | `PROVEN — IMPLEMENTED` | `EVD-10` (registry + Phase 5J synthetic tests; no recurring live log evidence) | Wave D / ISO-C2 |
| **CTRL-14** | Autonomous SOC & Alerting | ISO 27001 Annex A 8.16, ISO 27035 | DESIGNED | IMPLEMENTED | ACCUMULATING | `PROVEN — IMPLEMENTED` | `EVD-11` (SOC rule DSL, detection engine) | Wave D / ISO-C3 |
| **CTRL-15** | Vulnerability Management | ISO 27001 Annex A 8.8 | DESIGNED | PARTIAL | ACCUMULATING | `PARTIAL` | `EVD-13` (Dependabot lockfiles, SBOM) | Wave E / ISO-C3 (Operational Scan Cadence) |
| **CTRL-16** | Supplier Management | ISO 27001 Annex A 5.19–5.22, ISO 27701 | DESIGNED | IMPLEMENTED | PENDING_ATTEST | `REQUIRES EXTERNAL PROVIDER EVIDENCE` | `EVD-20` (Processor & Subprocessor Registry) | Wave E / ISO-C1/C3 (Vendor DPAs & SOC 2) |
| **CTRL-17** | Cloud Security Controls | ISO 27017, ISO 27002 Cl 5.23 | DESIGNED | PARTIAL | ACCUMULATING | `PARTIAL` | `EVD-14` (AWS & Vercel deployment guides) | Wave E / ISO-C2 (Cloud Config Audit) |
| **CTRL-18** | Backup & Recovery | ISO 27001 Annex A 8.13, ISO 22301 | DESIGNED | PLAN_ONLY | PENDING_DRILL | `PARTIAL` | `EVD-15` (AWS RDS backup & restore plan) | Wave F / ISO-C3 (Documented Restore Drill) |
| **CTRL-19** | Business Continuity | ISO 22301 Cl 8.2–8.4, ISO 27001 A 5.29 | DESIGNED | PLAN_ONLY | PENDING_DRILL | `PARTIAL` | `EVD-16` (Rollback plan, freeze capability) | Wave F / ISO-C3 (BCDR Simulation Exercise) |
| **CTRL-20** | Incident Response | ISO 27001 Annex A 5.24–5.28 | DESIGNED | IMPLEMENTED | PENDING_EXERCISE | `REQUIRES HUMAN EVIDENCE` | `EVD-12` (Gate 4I 9 scenarios, playbooks) | Wave D / ISO-C3 (Tabletop Incident Exercise) |
| **CTRL-21** | Privacy Management (PIMS) | ISO 27701 Cl 6.2–6.5, ISO 27018 | DESIGNED | IMPLEMENTED | NOT_PROVEN | `PROVEN — IMPLEMENTED` | `EVD-17` (Privacy module v1.0, PIA, ROPA) | Wave B / ISO-C1/C2 |
| **CTRL-22** | Customer Due Diligence (KYC) | ISO 27701 Cl 7.2, AML/CDD | DESIGNED | IMPLEMENTED | VERIFIED_SANDBOX | `PROVEN — IMPLEMENTED` | `EVD-21` (Sumsub Sandbox verification) | Continuous / Reused |
| **CTRL-23** | Payment & Payout Security | ISO 27001 Annex A 8.24, PCI DSS 4.0.1 | DESIGNED | IMPLEMENTED | PENDING_APPROVAL | `REQUIRES EXTERNAL PROVIDER EVIDENCE` | `EVD-22` (Xendit callback-token verification, fixture replay controls) | Pending Xendit Approval (Batch 2) |
| **CTRL-24** | Data Retention & Disposal | ISO 27001 Annex A 8.10, ISO 27701 | DESIGNED | PARTIAL | MANUAL_V1_APPROVED | `PARTIAL` | `EVD-19`, `EVD-17` (manual governance; automation V1_DEFERRED_APPROVED) | Wave B / later authorized review of automation deferral |
| **CTRL-25** | Data-Subject Rights (DSR) | ISO 27701 Cl 7.3 | DESIGNED | IMPLEMENTED | ACCUMULATING | `PROVEN — IMPLEMENTED` | `EVD-17`, `EVD-18` (DPO appointment, SAR forms) | Wave B / ISO-C2 |
| **CTRL-26** | Cross-Border Data Flows | ISO 27701 Cl 7.5, GDPR Ch V | DESIGNED | PARTIAL | NOT_PROVEN | `PARTIAL` | `EVD-23` (privacy UNKNOWN; legal validation pending) | Wave B / ISO-C1 |
| **CTRL-27** | Personnel & Org Controls | ISO 27001 Annex A 6.1–6.7 | DESIGNED | PARTIAL | PENDING_RECORDS | `REQUIRES HUMAN EVIDENCE` | `EVD-18`, `EVD-04` (appointment/roles, not training completion) | Wave A / ISO-C3 (Security Training Logs) |
| **CTRL-28** | Internal Audit | ISO 27001 Cl 9.2, ISO 27701 Cl 5.7 | DESIGNED | PENDING | PENDING_EXEC | `REQUIRES HUMAN EVIDENCE` | `EVD-24`; this ledger roadmap ISO-C5 (planned; no completed audit/review record identified) | ISO-C5 (Independent Internal Audit) |
| **CTRL-29** | Management Review | ISO 27001 Cl 9.3, ISO 27701 Cl 5.8 | DESIGNED | PENDING | PENDING_EXEC | `REQUIRES HUMAN EVIDENCE` | `EVD-24`; this ledger roadmap ISO-C5 (planned; no completed audit/review record identified) | ISO-C5 (Formal Executive Review) |
| **CTRL-30** | Continual Improvement | ISO 27001 Cl 10.1, 10.2 | DESIGNED | IMPLEMENTED | ACCUMULATING | `PARTIAL` | `EVD-07`, `EVD-24` (CAPA framework & postmortems) | Wave A / ISO-C5/C6 |

---

## 3. Conformity Maturity Distribution Summary

- Total domains: **30** (mutually exclusive overall-status counts).
- PROVEN — OPERATING CONFORMITY: **2** (CTRL-09, CTRL-11), bounded to dated executed release/isolation records; no fresh live-state validation claimed.
- PROVEN — IMPLEMENTED: **11** (CTRL-03, 04, 06, 07, 08, 12, 13, 14, 21, 22, 25).
- PARTIAL: **8** (CTRL-10, 15, 17, 18, 19, 24, 26, 30).
- GAP: **0** (automation is an approved v1 deferral, not an unapproved technical defect).
- REQUIRES HUMAN EVIDENCE: **7** (CTRL-01, 02, 05, 20, 27, 28, 29). Governance leadership and management review remain separate assessed domains.
- REQUIRES EXTERNAL PROVIDER EVIDENCE: **2** (CTRL-16, CTRL-23).

## 4. Assessment limits

Implemented means the identified mechanism or baseline exists; it does not mean the entire domain or ISO clause is satisfied. Logging evidence is synthetic/implementation evidence. Country matrices retain legal and privacy unknowns. Backup/continuity plans do not prove enabled infrastructure or completed drills. Design status records documented intent, not independently signed approval. Human signatures, provider attestations and operational cycles are never inferred from policy text or register status cells. Exact source paths, selectors and limitations are in the inheritance register. C0/C1 counts are historical; this current assessment incorporates C2-R1 evidence. ISO-C3 has not started.

## 5. C2-R1 current-state revision

CTRL-10 is PARTIAL because current CI commands suppress security-test failures; current workflow runtime also conflicts with the package contract. This changes current core counts to 2 operating / 11 implemented / 8 partial / 0 wholly absent control domains / 7 human / 2 provider. Three confirmed scoped defects (one runtime, two tooling) exist within partial/implemented control areas; zero GAP domains does not mean zero defects. Historical passed builds/tests are not annulled wholesale. See ISO_C2_RISK_TREATMENT_EVIDENCE_MAP.md and ISO_C2_DELTA_IMPACT_MATRIX.md for limited affected claims/gates.
