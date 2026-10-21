# RENTipid ISO Statement of Applicability (SoA) Baseline

**Document ID:** `RENTIPID-ISO-CONFORMITY-001-SOA`  
**Program:** RENTipid ISO Compliance & Conformity Program  
**Project ID:** `RENTIPID-ISO-CONFORMITY-001`  
**Version:** `v1.0`  
**Status:** `BASELINE COMPLETE`  
**Standard Alignment:** ISO/IEC 27001:2022 Clause 6.1.3 d), Annex A, ISO/IEC 27701:2019 Clauses 5, 6, 7  

---

## 1. Statement of Applicability Policy & Boundary Rule

In accordance with ISO/IEC 27001:2022 requirement 6.1.3 d), this Statement of Applicability documents all applicable information security controls, their implementation and operating status, evidence justifications, and documented rationales for any control exclusions.

> **Copyright & Mapping Rule:** In accordance with program instructions, this document does not reproduce proprietary copyrighted ISO standard text. Control identifiers and domain titles reflect those legitimately evidenced in the RENTipid repository. Where exact granular sub-clause mapping cannot be established from repository evidence or licensed material, it is explicitly flagged:  
> `EXACT STANDARD MAPPING — REQUIRES LICENSED STANDARD VERIFICATION`.
>
> **Exclusion Rule:** Controls are never marked `NOT APPLICABLE` for convenience. An exclusion requires documented technical or architectural justification.

---

## 2. Statement of Applicability Matrix (32 Controlled Domains)

### 2.1 Applicable Controls (30 Core Domains)

| SoA ID | Control Domain Title | Applicable | Applicability Rationale | Conformity Status | Implementation | Operating | Inherited Evidence Reference | Accountable Owner | Outstanding Evidence | Related Risks | Treatment Link |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **SOA-01** | Governance & Leadership | **YES** | Mandatory ISO 27001 Cl 5 leadership and policy commitment | `REQUIRES HUMAN EVIDENCE` | IMPLEMENTED | PENDING_REVIEW | `EVD-01`, `EVD-07`, `EVD-18` | Project Owner | Formal executive management sign-off on ISMS policies | `RSK-30` | `TRT-A04` |
| **SOA-02** | Risk Management | **YES** | Mandatory ISO 27001 Cl 6 risk assessment and treatment | `REQUIRES HUMAN EVIDENCE` | IMPLEMENTED | PENDING_APPROVAL | `EVD-24`, `ISO_RISK_METHODOLOGY.md` | CISO / Security Lead | Formal management residual risk acceptance | `RSK-03`, `RSK-05`, `RSK-06`, `RSK-08`, `RSK-09`, `RSK-12`, `RSK-14`, `RSK-15`, `RSK-17`, `RSK-21`, `RSK-22`, `RSK-23`, `RSK-24`, `RSK-26`, `RSK-30` | `TRT-A04` |
| **SOA-03** | Asset Management | **YES** | Mandatory protection of hardware, software, and data assets | `PROVEN — IMPLEMENTED` | IMPLEMENTED | ACCUMULATING | `EVD-09`, `EVD-10`, `ISO_INFORMATION_ASSET_REGISTER.md` | Engineering Lead | Human asset owner appointments | `RSK-01`, `RSK-02`, `RSK-03`, `RSK-04`, `RSK-05`, `RSK-06`, `RSK-07`, `RSK-08`, `RSK-09`, `RSK-10`, `RSK-11`, `RSK-12`, `RSK-13`, `RSK-14`, `RSK-15`, `RSK-16`, `RSK-17`, `RSK-18`, `RSK-19`, `RSK-20`, `RSK-21`, `RSK-22`, `RSK-23`, `RSK-24`, `RSK-25`, `RSK-26`, `RSK-27`, `RSK-28`, `RSK-29`, `RSK-30` | `ISO-C1` Register |
| **SOA-04** | Identity & Authentication | **YES** | Core marketplace user and admin access security | `PROVEN — IMPLEMENTED` | IMPLEMENTED | ACCUMULATING | `EVD-03` (NextAuth/password/session implementation; cookie settings environment-dependent) | Security Lead | Recurring operational login audit logs | `RSK-01`, `RSK-02` | `TRT-A01` |
| **SOA-05** | Authorization & Privileged Access | **YES** | Enforce least privilege and prevent privilege escalation | `REQUIRES HUMAN EVIDENCE` | IMPLEMENTED | PENDING_AUDIT | `EVD-04` (PBAC server guards, proxy route checks) | CISO / Security Lead | Quarterly privileged access certification log | `RSK-03`, `RSK-04` | `TRT-A02` |
| **SOA-06** | Secrets & Cryptography | **YES** | Protect data at rest, in transit, and secret keys | `PROVEN — IMPLEMENTED` | IMPLEMENTED | NOT_PROVEN | `EVD-06` (Phase 5F envelope encryption, key rotation) | Security Lead | Key rotation execution log in production | `RSK-05`, `RSK-10` | `TRT-B01`, `TRT-B02` |
| **SOA-07** | Source Control & Branching | **YES** | Protect code integrity and release traceability | `PROVEN — IMPLEMENTED` | IMPLEMENTED | NOT_PROVEN | `EVD-02`, `EVD-13` (Git worktree, Git workflow; signing not asserted) | Engineering Lead | Remote GitHub branch protection rule export | `RSK-05`, `RSK-25` | `Wave E` |
| **SOA-08** | Secure SDLC | **YES** | Prevent security vulnerabilities during engineering | `PROVEN — IMPLEMENTED` | IMPLEMENTED | NOT_PROVEN | `EVD-01`, `EVD-07`, TypeScript strictness, Zod validation | Engineering Lead | Static application security testing (SAST) logs | `RSK-04`, `RSK-08` | `Wave E` |
| **SOA-09** | Change Management | **YES** | Control modifications to software, schema, and config | `PROVEN — OPERATING CONFORMITY` | IMPLEMENTED | OPERATING | `EVD-07` (RENTipid Universal Promotion Standard) | Governance Lead | Dated historical operation only; ongoing evidence required | `RSK-25` | Universal Promotion Standard |
| **SOA-10** | CI/CD Pipelines | **YES** | Ensure build integrity, automated testing, and safe deploy | `PARTIAL` | PARTIAL | NOT_PROVEN | EVD-02/13 historical evidence; DEF-TOOL-01 current fail-open test command and runtime contract in ISO_C2_SDLC_CHANGE_CONTROL_VERIFICATION.md Section 2 | Engineering Lead | Fail-closed CI enforcement proof after approved scoped repair | `RSK-25` | `Wave E` |
| **SOA-11** | Environment Separation | **YES** | Isolate local dev, preview staging, and live production | `PROVEN — OPERATING CONFORMITY` | IMPLEMENTED | OPERATING | `EVD-08` (Dated Preview isolation restoration report) | Cloud Ops Lead | Dated historical operation only; ongoing evidence required | `RSK-09`, `RSK-10` | Isolation Standard |
| **SOA-12** | Database Security | **YES** | Prevent unauthorized access, tampering, or SQL injection | `PROVEN — IMPLEMENTED` | IMPLEMENTED | NOT_PROVEN | `EVD-08`, `EVD-09` (Prisma parameterization, ownership) | Database Admin | DB connection encryption audit | `RSK-10` | `TRT-B02` |
| **SOA-13** | Logging & Telemetry | **YES** | Provide audit trail for security events and forensics | `PROVEN — IMPLEMENTED` | IMPLEMENTED | SYNTHETIC_ONLY | `EVD-10` (Sanitized audit events, Phase 5J synthetic suite) | SOC Lead | Live recurring operational log streams | `RSK-11`, `RSK-19` | `TRT-D01`, `TRT-D03` |
| **SOA-14** | Autonomous SOC & Alerting | **YES** | Detect adversarial behavior and automated threat response | `PROVEN — IMPLEMENTED` | IMPLEMENTED | ACCUMULATING | `EVD-11` (SOC rule DSL, Gate 4I simulation suite) | SOC Lead | Production alert metric export | `RSK-17`, `RSK-20` | `TRT-D04` |
| **SOA-15** | Vulnerability Management | **YES** | Identify and remediate software and dependency flaws | `PARTIAL` | PARTIAL | ACCUMULATING | `EVD-13` (Dependabot lockfiles, Phase 5I SBOM) | Engineering Lead | Recurring monthly vulnerability triage logs | `RSK-08` | `TRT-E01` |
| **SOA-16** | Supplier Management | **YES** | Manage third-party cloud and processor risk | `REQUIRES EXTERNAL PROVIDER EVIDENCE` | IMPLEMENTED | PENDING_ATTEST | `EVD-20` (Processor & Subprocessor Registry) | DPO / Legal Counsel | Executed vendor DPAs and SOC 2 reports | `RSK-26` | `TRT-E04` |
| **SOA-17** | Cloud Security Controls | **YES** | Assess actual cloud safeguards and shared responsibility | `PARTIAL` | PARTIAL | ACCUMULATING | `EVD-14` (AWS & Vercel deployment blueprints) | Cloud Ops Lead | Evidence of actual deployed configuration and drift review | `RSK-09`, `RSK-24` | `TRT-E02` |
| **SOA-18** | Backup & Recovery | **YES** | Ensure database recovery in event of failure or attack | `PARTIAL` | PLAN_ONLY | PENDING_DRILL | `EVD-15` (AWS RDS backup & restore runbook) | Database Admin | Documented restore drill execution log | `RSK-21`, `RSK-22`, `RSK-23` | `TRT-F01`, `TRT-F02` |
| **SOA-19** | Business Continuity | **YES** | Ensure rental marketplace operational resilience | `PARTIAL` | PLAN_ONLY | PENDING_DRILL | `EVD-16` (Rollback plan, emergency freeze capability) | Cloud Ops Lead | Multi-scenario disaster simulation drill record | `RSK-24` | `TRT-F03` |
| **SOA-20** | Incident Response | **YES** | Structured response to security breaches and outages | `REQUIRES HUMAN EVIDENCE` | IMPLEMENTED | PENDING_EXERCISE | `EVD-12` (Gate 4I 9 scenarios, incident runbooks) | CISO / SOC Lead | Tabletop incident exercise completion record | `RSK-20`, `RSK-27` | `TRT-D05` |
| **SOA-21** | Privacy Management (PIMS) | **YES** | Compliance with ISO/IEC 27701 and privacy regulations | `PROVEN — IMPLEMENTED` | IMPLEMENTED | NOT_PROVEN | `EVD-17` (Phase 6 Privacy Module v1.0, PIA, ROPA) | Data Protection Officer (DPO) | Annual PIMS review audit | `RSK-28` | `TRT-B04` |
| **SOA-22** | Customer Due Diligence (KYC) | **YES** | Prevent fraud and satisfy AML/CDD legal requirements | `PROVEN — IMPLEMENTED` | IMPLEMENTED | VERIFIED_SANDBOX | `EVD-21` (Sumsub sandbox verified integration) | Marketplace Operations Lead | Live production KYC transaction metrics | `RSK-13`, `RSK-17` | `TRT-E03` |
| **SOA-23** | Payment & Payout Security | **YES** | Ensure financial transaction integrity and webhook auth | `REQUIRES EXTERNAL PROVIDER EVIDENCE` | IMPLEMENTED | PENDING_APPROVAL | `EVD-22` (Xendit callback-token fixtures / durable receipts) | Finance Lead | Xendit live merchant sandbox approval | `RSK-07`, `RSK-14`, `RSK-15` | `TRT-C04` |
| **SOA-24** | Data Retention & Disposal | **YES** | Enforce data minimization and statutory disposal limits | `PARTIAL` | PARTIAL | MANUAL_V1_APPROVED | `EVD-19` (Approved retention schedule; manual v1) | Data Protection Officer (DPO) | Manual review evidence; automation deferred, no new worker authorized | `RSK-29` | `TRT-B05` |
| **SOA-25** | Data-Subject Rights (DSR) | **YES** | Satisfy user right to access, rectification, erasure | `PROVEN — IMPLEMENTED` | IMPLEMENTED | ACCUMULATING | `EVD-17`, `EVD-18` (DPO appointment, SAR workflows) | Data Protection Officer (DPO) | Operational DSR intake tracking ledger | `RSK-28` | `TRT-B04` |
| **SOA-26** | Cross-Border Data Flows | **YES** | Regulate international PII movement across 46 countries | `PARTIAL` | PARTIAL | NOT_PROVEN | `EVD-23` (46-country compliance matrix, residency trace) | Legal Counsel / DPO | Formal legal counsel cross-border transfer review | `RSK-12` | `TRT-B03` |
| **SOA-27** | Personnel & Org Controls | **YES** | Ensure personnel trustworthiness and security awareness | `REQUIRES HUMAN EVIDENCE` | PARTIAL | PENDING_RECORDS | `EVD-18`, `EVD-04` (Roles defined, DPO appointed) | Management / HR | Annual security awareness training logs | `RSK-27` | `TRT-A03` |
| **SOA-28** | Internal Audit | **YES** | Independent verification of ISMS/PIMS conformity | `REQUIRES HUMAN EVIDENCE` | PENDING | PENDING_EXEC | ISO_CONFORMITY_MASTER_LEDGER.md Section 4 ISO-C5 roadmap (planned) | Independent Internal Auditor | Completed independent internal audit report | `RSK-01`, `RSK-02`, `RSK-03`, `RSK-04`, `RSK-05`, `RSK-06`, `RSK-07`, `RSK-08`, `RSK-09`, `RSK-10`, `RSK-11`, `RSK-12`, `RSK-13`, `RSK-14`, `RSK-15`, `RSK-16`, `RSK-17`, `RSK-18`, `RSK-19`, `RSK-20`, `RSK-21`, `RSK-22`, `RSK-23`, `RSK-24`, `RSK-25`, `RSK-26`, `RSK-27`, `RSK-28`, `RSK-29`, `RSK-30` | `Phase ISO-C5` |
| **SOA-29** | Management Review | **YES** | Executive oversight and continual suitability of ISMS | `REQUIRES HUMAN EVIDENCE` | PENDING | PENDING_EXEC | ISO_CONFORMITY_MASTER_LEDGER.md Section 4 ISO-C5 roadmap (planned) | Project Owner | Formal signed management review meeting minutes | `RSK-01`, `RSK-02`, `RSK-03`, `RSK-04`, `RSK-05`, `RSK-06`, `RSK-07`, `RSK-08`, `RSK-09`, `RSK-10`, `RSK-11`, `RSK-12`, `RSK-13`, `RSK-14`, `RSK-15`, `RSK-16`, `RSK-17`, `RSK-18`, `RSK-19`, `RSK-20`, `RSK-21`, `RSK-22`, `RSK-23`, `RSK-24`, `RSK-25`, `RSK-26`, `RSK-27`, `RSK-28`, `RSK-29`, `RSK-30` | `Phase ISO-C5` |
| **SOA-30** | Continual Improvement | **YES** | Corrective actions, root-cause analysis, and maturity | `PARTIAL` | IMPLEMENTED | ACCUMULATING | `EVD-07`, `EVD-24` (CAPA framework, incident postmortems) | CISO / Governance Lead | Operational CAPA closure records | `RSK-25` | `Phase ISO-C5/C6` |

---

### 2.2 Applicable supporting boundary obligations

| SoA ID | Boundary | Applicable | Rationale | Core-domain link | Evidence / owner / risk / treatment |
|---|---|---|---|---|---|
| SOA-B01 | Outsourced hosting physical/shared responsibility | YES | No blanket exclusion of supplier physical security or RENTipid endpoints/offices is evidenced. Assess actual facilities and supplier obligations. | CTRL-16, CTRL-17 | EVD-14/20; Cloud Ops Lead and DPO/Legal Counsel; RSK-09, RSK-24, RSK-26; TRT-E02, TRT-E04 |
| SOA-B02 | Payment card data boundary | YES | Reference-oriented contracts do not establish universal non-receipt of PAN/CVV or permit excluding payment security. Verify flows without assuming PCI certification. | CTRL-23 | EVD-22; Finance Lead; RSK-07, RSK-14, RSK-15; TRT-C03, TRT-C04 |

---

## 3. Statement of Applicability Metric Summary

* **Total Controls Evaluated in SoA:** **32**
* **Applicable rows:** **32** (30 core domains plus 2 supporting boundary obligations)
* **Not Applicable:** **0**; no exclusion approved.
* **Conformity Distribution Across 30 Core Domains Only:**
  * `PROVEN — OPERATING CONFORMITY`: **2** (`SOA-09`, `SOA-11`)
  * `PROVEN — IMPLEMENTED`: **11** (`SOA-03`, `SOA-04`, `SOA-06`, `SOA-07`, `SOA-08`, `SOA-12`, `SOA-13`, `SOA-14`, `SOA-21`, `SOA-22`, `SOA-25`)
  * `PARTIAL`: **8** (`SOA-10`, `SOA-15`, `SOA-17`, `SOA-18`, `SOA-19`, `SOA-24`, `SOA-26`, `SOA-30`)
  * `GAPS`: **0** (Retention automation is an approved v1 deferral)
  * `REQUIRES HUMAN EVIDENCE`: **7** (`SOA-01`, `SOA-02`, `SOA-05`, `SOA-20`, `SOA-27`, `SOA-28`, `SOA-29`)
  * `REQUIRES EXTERNAL PROVIDER EVIDENCE`: **2** (`SOA-16`, `SOA-23`)
* **Integrity Validation:** Current C2-R1 assessment supersedes the historical C0/C1 distribution for CTRL-10 only; historic records remain unchanged.

## 4. Scope and licensed-source limits

EXACT STANDARD MAPPING — REQUIRES LICENSED STANDARD VERIFICATION. Every edition/clause label in this package is provisional inherited alignment, not verified licensed text. This is a domain-level applicability baseline, not a verified exhaustive Annex A/27701 control inventory. Two supporting rows are covered by existing core domains; they add no maturity-domain count. All controls remain applicable despite incomplete implementation. Owners match ISO_CONTROL_OWNERSHIP_MATRIX.md. EVD references resolve through ISO_CONFORMITY_EVIDENCE_INHERITANCE_REGISTER.md to pinned paths/sections. Planned wave/phase references are future targets, not completed treatment. Internal audit/management review remain planned under master-ledger Section 4.
