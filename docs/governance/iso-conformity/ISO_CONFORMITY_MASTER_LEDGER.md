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

assetsRegistered: 25; dataCategoriesRegistered: 21; suppliersRegistered: 10; risksRegistered: 30; lowRisks: 6; moderateRisks: 9; highRisks: 15; criticalRisks: 0; riskAcceptanceRequiringProjectOwner: 15; soaApplicable: 32; soaNotApplicable: 0; technicalRemediationItemsIdentified: 4; humanOrganizationalActionsIdentified: 5; externalLegalActionsIdentified: 3. Treatment actions: 25. Core domains remain 30 (2 operating, 12 implemented, 7 partial, 0 gaps, 7 human, 2 provider). The 32 applicable SoA rows are 30 core plus 2 supporting obligations; no exclusions approved. Four technical candidates are conditional, not proven new defects or authority to implement. Scores are conservative assessment estimates, not human acceptance. Owner decisions remain pending for RSK-03, RSK-05, RSK-06, RSK-08, RSK-09, RSK-12, RSK-14, RSK-15, RSK-17, RSK-21, RSK-22, RSK-23, RSK-24, RSK-26, RSK-30. C1 documentary acceptance does not accept risks, execute treatment, freeze version or start C2.
