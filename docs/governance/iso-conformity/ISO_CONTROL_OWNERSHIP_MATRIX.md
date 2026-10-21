# RENTipid ISO Control Ownership Matrix

**Document ID:** `RENTIPID-ISO-CONFORMITY-001-COM`  
**Program:** RENTipid ISO Compliance & Conformity Program  
**Project ID:** `RENTIPID-ISO-CONFORMITY-001`  
**Version:** `v1.0`  
**Status:** `BASELINE COMPLETE`  
**Standard Alignment:** ISO/IEC 27001:2022 Clauses 5.3, 6.1.3, ISO/IEC 27701:2019  

---

## 1. Governance Policy on Roles & Accountability

In accordance with ISO/IEC 27001 Clause 5.3, top management must ensure that the responsibilities and authorities for roles relevant to information security and privacy are assigned and communicated.

> **Named Individual Policy:** In strict adherence to program rules, no fictional or unevidenced human names are assigned. Where a role is defined by functional responsibility but the specific personnel appointment is pending formal documentation, the matrix records:  
> `ROLE ASSIGNMENT REQUIRED`.

---

## 2. Defined Organizational Roles & Scope

1. **Project Owner:** Platform leadership, ultimate risk acceptance, resource allocation, and formal scope/freeze authorization.
2. **Application / Engineering Lead:** Secure SDLC, codebase integrity, API contracts, database migrations, and CI/CD pipelines.
3. **Security / SOC Lead (CISO):** Information security policy, cryptography/key management, autonomous SOC engine, vulnerability triage, and incident response.
4. **Data Protection Officer (DPO):** Privacy Information Management System (PIMS), ROPA, Data Subject Rights (DSR), retention schedules, and regulatory privacy filings.
5. **Cloud Operations Lead:** Infrastructure hosting, environment isolation, secrets vault management, backup/restore drills, and cloud zero-trust.
6. **Finance / Marketplace Operations Lead:** Payment gateways, payout rails, escrow management, and financial reconciliation.
7. **Legal / Regulatory Counsel:** Cross-border transfer mechanisms, jurisdictional compliance matrices (46 countries), and terms of service.
8. **External Certification Body (CAB), outside internal control ownership:** Accredited third-party assessment body responsible for independent Stage 1 and Stage 2 certification audits.

---

## 3. Control Domain Ownership Matrix (30 Applicable Domains)

| Control Domain | Primary Accountable Role | Specific Person Status | Secondary Supporting Roles | Operating Cadence | Evidence Artifact |
|---|---|---|---|---|---|
| **01. Governance & Leadership** | Project Owner | Appointed | CISO, DPO | Annual / Phase Gates | `ISO_CONFORMITY_MASTER_LEDGER.md`, Signed Policies |
| **02. Risk Management** | CISO / Security Lead | `ROLE ASSIGNMENT REQUIRED` | Project Owner, Engineering | Quarterly / Annual | `ISO_RISK_REGISTER.md`, `ISO_RISK_METHODOLOGY.md` |
| **03. Asset Management** | Engineering Lead | `ROLE ASSIGNMENT REQUIRED` | Cloud Ops, Database Admin | Bi-annual | `ISO_INFORMATION_ASSET_REGISTER.md` |
| **04. Identity & Authentication** | Security Lead | `ROLE ASSIGNMENT REQUIRED` | Engineering Lead | Continuous | `src/lib/auth`, Session Logs |
| **05. Authorization & Privileged Access** | CISO / Security Lead | `ROLE ASSIGNMENT REQUIRED` | Engineering, Project Owner | Quarterly | `RENTipid_ROLE_AND_PERMISSION_REGISTRY.md`, Access Review Log |
| **06. Secrets & Cryptography** | Security Lead | `ROLE ASSIGNMENT REQUIRED` | Cloud Ops Lead | Quarterly Rotation | Phase 5F Envelope Keys, Vault Secrets |
| **07. Source Control & Branching** | Engineering Lead | `ROLE ASSIGNMENT REQUIRED` | All Developers | Continuous | Git Worktree, Branch Protection Rules |
| **08. Secure SDLC** | Engineering Lead | `ROLE ASSIGNMENT REQUIRED` | Security Lead | Continuous | Linting, Typecheck, PR Reviews |
| **09. Change Management** | Governance Lead | `ROLE ASSIGNMENT REQUIRED` | Engineering, Project Owner | Per Release Gate | RENTipid Universal Promotion Standard |
| **10. CI/CD Pipelines** | Engineering Lead | `ROLE ASSIGNMENT REQUIRED` | Cloud Ops Lead | Continuous | Vercel CI, GitHub Actions |
| **11. Environment Separation** | Cloud Ops Lead | `ROLE ASSIGNMENT REQUIRED` | Database Admin | Continuous | Local / Preview / Production DB Isolation |
| **12. Database Security** | Database Admin | `ROLE ASSIGNMENT REQUIRED` | Engineering Lead | Continuous | Prisma Schema, Connection Encryption |
| **13. Logging & Telemetry** | SOC Lead | `ROLE ASSIGNMENT REQUIRED` | Engineering Lead | Continuous | Sanitized Audit Event Serializers |
| **14. Autonomous SOC & Alerting** | SOC Lead | `ROLE ASSIGNMENT REQUIRED` | Security Lead | Continuous / Weekly | SOC Rule DSL, Incident Cases |
| **15. Vulnerability Management** | Engineering Lead | `ROLE ASSIGNMENT REQUIRED` | Security Lead | Monthly | Dependabot Alerts, Phase 5I SBOM |
| **16. Supplier Management** | DPO / Legal Counsel | `ROLE ASSIGNMENT REQUIRED` | Cloud Ops, Finance | Bi-annual | `ISO_SUPPLIER_AND_SUBPROCESSOR_REGISTER.md` |
| **17. Cloud Security Controls** | Cloud Ops Lead | `ROLE ASSIGNMENT REQUIRED` | Security Lead | Monthly | AWS & Vercel IAM, Cloud Configuration |
| **18. Backup & Recovery** | Database Admin | `ROLE ASSIGNMENT REQUIRED` | Cloud Ops Lead | Daily Backup / Bi-annual Drill | EVD-15 plans; actual backup configuration/drill records required |
| **19. Business Continuity** | Cloud Ops Lead | `ROLE ASSIGNMENT REQUIRED` | Project Owner, CISO | Annual Simulation | Deployment Rollback Plan, BCDR Runbook |
| **20. Incident Response** | CISO / SOC Lead | `ROLE ASSIGNMENT REQUIRED` | Engineering, Legal, DPO | Event-driven / Bi-annual Drill | Incident Runbooks, Tabletop Exercise Records |
| **21. Privacy Management (PIMS)** | Data Protection Officer (DPO) | Formally Appointed (`2026-08-05` Memo) | Legal, Engineering | Ongoing | Phase 6 Privacy Module, PIA, ROPA |
| **22. Customer Due Diligence (KYC)** | Marketplace Operations Lead | `ROLE ASSIGNMENT REQUIRED` | DPO, Security Lead | Continuous | Sumsub Integration State, AML Ledger |
| **23. Payment & Payout Security** | Finance Lead | `ROLE ASSIGNMENT REQUIRED` | Engineering, Security | Continuous | Payment Gateways, Product-specific authentication; Xendit callback-token fixtures |
| **24. Data Retention & Disposal** | Data Protection Officer (DPO) | Formally Appointed | Engineering, Database Admin | Manual governed review; automation deferred | EVD-17/19 manual governance; no cleanup worker authorized |
| **25. Data-Subject Rights (DSR)** | Data Protection Officer (DPO) | Formally Appointed | Operations, Support | Event-driven; applicable legal deadline requires counsel | DSR Intake Ledger, Fulfillment Evidence |
| **26. Cross-Border Data Flows** | Legal Counsel / DPO | `ROLE ASSIGNMENT REQUIRED` | Engineering, Cloud Ops | Bi-annual / Per Market | GLCC 46-Country Compliance Matrices |
| **27. Personnel & Org Controls** | Management / HR | `ROLE ASSIGNMENT REQUIRED` | CISO, DPO | Annual | Security Awareness Training Records |
| **28. Internal Audit** | Independent Internal Auditor | `ROLE ASSIGNMENT REQUIRED` (Phase ISO-C5) | Project Owner, CISO | Annual / Phase ISO-C5 | Independent Internal Audit Plan & Report |
| **29. Management Review** | Project Owner | Appointed | CISO, DPO, Engineering | Annual / Phase ISO-C5 | Formal Signed Management Review Minutes |
| **30. Continual Improvement** | CISO / Governance Lead | `ROLE ASSIGNMENT REQUIRED` | All Role Owners | Ongoing | CAPA Action Register, Postmortem Reports |

---

## 4. Responsibility Summary

* **Formally Appointed Human Roles Evidenced in Repo:**
  * **Project Owner:** Recorded in EVD-17 Governance (privacy closure); the master ledger preserves decision authority.
  * **Data Protection Officer (DPO):** Formally evidenced by `docs/final-documentation/privacy-module/RENTIPID_DPO_APPOINTMENT_MEMORANDUM_2026-08-05.md`.
* Functional personnel assignments require confirmation wherever flagged, including Governance Lead, Operations, Management/HR and Support; a fixed count of eight is not justified.

## 5. R1 responsibility and evidence limits

Project Owner and DPO roles are recorded in EVD-17 Governance and EVD-18 appointment memo. Other titles are proposed functional roles, not staffed offices or named appointments. Cadences are planned duties, not completed cycles. Evidence Artifact cells identify existing mechanisms and requested future records: signed policies, access certifications, enforced branch rules, key-rotation logs, training, drills and signed review minutes remain unproven unless specifically evidenced in the inheritance register. EVD-04/06/07/08/10/11/13/15/17/18/20 resolve exact existing paths/sections. Supplier staff operate their own services; RENTipid staff own due diligence/configuration and contractual follow-up. CAB responsibility is external certification, not internal audit/control ownership. Internal auditor independence must be maintained; no CAB engagement is asserted. Project Owner alone accepts risk, authorizes scope/deferral changes and freeze; C1 performs none of those decisions.

## Licensed-source boundary

EXACT STANDARD MAPPING — REQUIRES LICENSED STANDARD VERIFICATION. Every edition/clause label is provisional inherited alignment, not verified licensed text or legal conclusions.
