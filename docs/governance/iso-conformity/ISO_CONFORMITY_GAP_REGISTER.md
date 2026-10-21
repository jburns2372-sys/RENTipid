# RENTipid ISO Conformity Gap & Remediation Register

**Document ID:** `RENTIPID-ISO-CONFORMITY-001-GR`  
**Program:** RENTipid ISO Compliance & Conformity Program  
**Project ID:** `RENTIPID-ISO-CONFORMITY-001`  
**Version:** `v1.0`  
**Status:** `ACTIVE — GAPS CATALOGED AND CONSOLIDATED`  

---

## 1. Controlling Policy: Consolidated Remediation Boundary

Under the C0 controlling program rule recorded in the ISO_CONFORMITY_MASTER_LEDGER.md:
> **Non-Repetitive Wave Principle:** When gaps are discovered, the program avoids one-defect-at-a-time execution. Compatible findings are grouped into bounded waves. No technical remediation is performed during package `ISO-C0`. Technical remediation is deferred to targeted waves executed by Codex in subsequent phases.

---

## 2. Gap Classification & Taxonomy

Gaps are strictly categorized by their underlying nature:
1. **Technical Security Gaps:** Deficiencies in code, schema, API contracts, or automated background workers.
2. **Operational Continuity Gaps:** Procedures that exist on paper or in runbooks but lack recorded operational drill evidence.
3. **Human & Organizational Evidence Gaps:** Requirements that depend on human leadership, management sign-off, training, or independent audit.
4. **External Provider Dependencies:** Requirements contingent upon third-party certifications, contractual DPAs, or partner account approvals.

---

## 3. Comprehensive Gap Inventory

| Gap ID | Domain | Classification | Description of Gap | Standard Ref | Evidence State | Target Phase / Remediation Wave |
|---|---|---|---|---|---|---|
| **GAP-01** | Data Retention | Approved v1 deferral | `EVD-17` Retention Governance explicitly accepts MANUAL_GOVERNED_PROCESS, V1_DEFERRED_APPROVED and disabled production automated deletion; `EVD-19` RET-01 records implementation incomplete. Preserve manual-control and deferral boundaries; do not infer authorization to enable deletion. | ISO 27001 A.8.10, ISO 27701 6.5.3 | `PARTIAL` | Wave B / later authorized review of retention deferral |
| **GAP-02** | Vulnerability Management | Operational Continuity | Dependency scanning (Phase 5I SBOM) exists; recurring operational vulnerability scan logs and cadence evidence need formal consolidation. | ISO 27001 A.8.8 | `PARTIAL` | Wave E (CI/CD & Supply Chain) / ISO-C3 |
| **GAP-03** | Cloud Security Controls | Operational Continuity | Infrastructure deployment blueprints exist, but current cloud configuration/drift evidence has not been established by those designs (EVD-14); no running drift service is inferred. | ISO 27017, ISO 27001 A.5.23 | `PARTIAL` | Wave E (CI/CD & Cloud) / ISO-C2 |
| **GAP-04** | Backup & Recovery | Operational Continuity | `EVD-15` documents proposed backup/recovery procedures, not an enabled RDS schedule or completed restore. Historical hosting differs by evidence date; current inventory and restore evidence remain unproven. | ISO 27001 A.8.13, ISO 22301 8.4 | `PARTIAL` | Wave F (Resilience) / ISO-C3 |
| **GAP-05** | Business Continuity | Operational Continuity | Rollback procedures and emergency freeze capabilities exist; a multi-scenario disaster recovery simulation record is pending formal execution. | ISO 22301, ISO 27001 A.5.29 | `PARTIAL` | Wave F (Resilience) / ISO-C3 |
| **GAP-06** | Access Certification | Human / Organizational | PBAC/RBAC code enforcement is proven; a formal quarterly privileged user and service account access review log with management sign-off is required. | ISO 27001 A.5.15, A.5.18 | `REQUIRES HUMAN EVIDENCE` | Wave A (Identity & Access) / ISO-C3 |
| **GAP-07** | Personnel Awareness | Human / Organizational | Security policies and DPO appointment exist; annual security and privacy awareness training records for personnel require formal logging. | ISO 27001 A.6.3 | `REQUIRES HUMAN EVIDENCE` | Wave A (Organizational Controls) / ISO-C3 |
| **GAP-08** | Incident Exercise | Human / Organizational | Autonomous SOC detection is functional; a structured tabletop incident response exercise covering data breach notification requires human sign-off. | ISO 27001 A.5.24–5.28 | `REQUIRES HUMAN EVIDENCE` | Wave D (SOC & Incident) / ISO-C3 |
| **GAP-09** | Risk Treatment Sign-off | Human / Organizational | ISMS risk register is structured (`PHASE5M_ISMS_RISK_AND_CONTROL_REGISTER.md`); formal leadership residual risk acceptance and Statement of Applicability sign-off is needed. | ISO 27001 Cl 6.1.3, 8.3 | `REQUIRES HUMAN EVIDENCE` | Phase ISO-C1 (Project Owner Gate) |
| **GAP-10** | Internal Audit | Human / Organizational | Internal audit framework is planned; independent internal conformity audit execution across all applicable clauses and Annex A controls is scheduled. | ISO 27001 Cl 9.2, ISO 27701 Cl 5.7 | `REQUIRES HUMAN EVIDENCE` | Phase ISO-C5 (Internal Audit) |
| **GAP-11** | Management Review | Human / Organizational | Continual improvement runbook exists; formal executive management review meeting covering audit findings, risks, and resource allocation is required. | ISO 27001 Cl 9.3, ISO 27701 Cl 5.8 | `REQUIRES HUMAN EVIDENCE` | Phase ISO-C5 (Management Review) |
| **GAP-12** | Supplier Attestations | External Provider | Processor registry exists (`PROCESSOR_SUBPROCESSOR_REGISTRY.md`); supplier evidence must be reconciled by provider/date and contractual basis. `EVD-20` verifies standard Vercel/Azure terms but not negotiated Azure DPA; it does not supply all account-specific attestations or Sumsub agreements. AWS guides alone do not establish active AWS services. | ISO 27001 A.5.19–5.22, ISO 27701 | `REQUIRES EXTERNAL PROVIDER EVIDENCE` | Phase ISO-C1 / ISO-C3 |
| **GAP-13** | Payment Sandbox Approval | External Provider | Xendit webhook and integration code complete; real sandbox payment and payout validation in GLOBAL-MKT Batch 2 is blocked pending merchant account activation. | ISO 27001 A.8.24, PCI DSS 4.0.1 | `REQUIRES EXTERNAL PROVIDER EVIDENCE` | External / GLOBAL-MKT Batch 2 Gate |

---

## 4. Grouped Corrective Waves for Subsequent Execution

To prevent fragmented one-off edits, remediation will be executed strictly by grouped waves:

* **Wave A — Identity, Access & Governance:**
  * Scope: Periodic privileged access review documentation, security awareness training records, risk treatment formalization.
  * Target Phases: `ISO-C1` & `ISO-C3`.
* **Wave B — Secrets, Data Protection & Retention:**
  * Scope: Review approved retention deferral and manual evidence; reconcile cross-border legal/privacy unknowns. Any later automation needs separate authorization.
  * Target Phases: `ISO-C1` & `ISO-C2`.
* **Wave C — API, Webhook & Network Controls:**
  * Scope: Rate limit verification, API contract hardening, webhook replay audit. (Inherited baseline already robust).
  * Target Phase: `ISO-C2`.
* **Wave D — SOC, Logging & Incident Management:**
  * Scope: Tabletop incident drill records, breach notification workflow simulation.
  * Target Phase: `ISO-C3`.
* **Wave E — CI/CD, Supply Chain & Supplier Oversight:**
  * Scope: Dependency scanning cadence, vendor DPA repository, cloud configuration drift audit.
  * Target Phases: `ISO-C1`, `ISO-C2`, & `ISO-C3`.
* **Wave F — Resilience & Continuity:**
  * Scope: Documented database backup restore drill, business continuity simulation exercise.
  * Target Phase: `ISO-C3`.

## 5. Independent reconciliation

`EVD-17` is authoritative for approved v1 retention deferral; GAP-01 is PARTIAL, not an unapproved technical gap. CTRL-26 remains PARTIAL because `EVD-23` records UNKNOWN/VALIDATION_REQUIRED. CTRL-30 remains PARTIAL because `EVD-24` is a runbook/register, not a completed recurring improvement cycle. CTRL-01 and CTRL-29 are separate leadership/review domains and both require human evidence; GAP-11 covers their shared missing management-review evidence. Overall counts are domain counts in the control baseline, not the number of rows in this register. No missing artifact is proof that an activity never occurred; it is an evidence requirement.

## 6. ISO-C1-R1 traceability

C0 core maturity remains unchanged. ISO_RISK_TREATMENT_PLAN.md contains 25 actions: 4 conditional technical candidates, 5 human/organizational actions, 3 external/legal actions (overlapping categories). They are not four proven new defects. Retention automation remains approved deferred; ingestion failure/recovery already has implementation evidence. Current cloud/backups require inventory/operating evidence rather than assumed AWS services. All 30 risks map to treatment IDs in ISO_RISK_REGISTER.md Section4. No treatment performed; no inherited technical gate invalidated.

## 7. C2-R1 evidence-supported findings

Current core maturity is 2 operating / 11 implemented / 8 partial / 0 wholly absent domains / 7 human / 2 provider. CTRL-10 moves to PARTIAL for DEF-TOOL-01. Confirmed findings: DEF-RUNTIME-01 registration pre-effect quota gap; DEF-TOOL-01 CI failure suppression/runtime contract; DEF-TOOL-02 recovery harness false-success/unmeasured evidence. Detailed source selectors, actual C1 candidates and primary dispositions are in ISO_C2_RISK_TREATMENT_EVIDENCE_MAP.md and domain reports. Additional RSK-18 candidate requires an evidence-integrity requirement, not automatic checksums. Actual cloud baseline and backup operations remain evidence gaps; no configured AWS service is inferred. Retention and provider deferrals remain scoped. Historical synthetic Phase 5L drill is retained, not equated with current deployed recovery assurance. No remediation executed. Future runtime changes require controlled Preview/Production promotion; isolated recovery proof mutates only approved synthetic fixtures.
