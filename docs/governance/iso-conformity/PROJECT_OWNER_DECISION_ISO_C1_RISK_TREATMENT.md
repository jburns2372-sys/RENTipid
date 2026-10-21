# RENTipid Project Owner Decision — ISO-C1 Risk Treatment Authorization

**Document ID:** `RENTIPID-ISO-CONFORMITY-001-POD-C1`  
**Program:** RENTipid ISO Compliance & Conformity Program  
**Project ID:** `RENTIPID-ISO-CONFORMITY-001 / v1.0`  
**Work Package:** `ISO-C1-D1 — Project Owner Risk-Treatment Decision Review + Checkpoint`  
**Decision Authority:** Project Owner  
**Decision Date:** `2026-10-22`  
**Status:** `OFFICIALLY APPROVED & RECORDED`  

---

## 1. Formal Decision Statement

Source of authority: the Project Owner instruction in this conversation dated 2026-10-22, referencing accepted ISO-C1 baseline `a6c6258cc6606c04d2a24574cb1f9f06d09c2aea`. The following is a normalized record of that instruction, not a verbatim quotation, new signature, or assertion of a separate review/sign-off of every supporting document.

### 1.1 Authorization of Treatment (No Residual Risk Accepted)
> **Treatment authorized; no residual risk accepted, for:**
> * **RSK-03** (Admin Privileged Access Certification)
> * **RSK-05** (Cloud Secrets & Pre-commit Scanning)
> * **RSK-06** (Ingress API & Edge Rate Limiting)
> * **RSK-08** (Third-Party Dependency Vulnerability Triage)
> * **RSK-09** (Cloud Configuration & Drift Audit)
> * **RSK-12** (Cross-Border Data Residency & Transfer Mechanisms)
> * **RSK-14** (Payment Gateway Availability / No-Fallback Boundary Review)
> * **RSK-15** (Payout Rails & Xendit Merchant Sandbox Approval)
> * **RSK-17** (Marketplace Fraud Scoring Rules)
> * **RSK-21** (Database Ransomware / Destructive Recovery)
> * **RSK-22** (Automated Backup Alarms)
> * **RSK-23** (Backup Restoration Drill Execution)
> * **RSK-24** (Cloud Outage & Recovery Topology Review (multi-zone capability not presumed))
> * **RSK-26** (Third-Party Subprocessor SOC 2 & DPA Review)
> * **RSK-30** (Multi-Jurisdiction Regulatory & Tax Tracking)
>
> **No residual risk is accepted at this stage.**

---

## 2. Controlling Directives for Subsequent Phases (ISO-C2 through ISO-C6)

1. **Verify Existing Controls First:**
   * Package `ISO-C2` shall systematically verify existing technical and operational controls before planning code modifications.
   * Accepted evidence from prior phases and modules shall be reused wherever unaffected by current deltas.
2. **Evidence-Based Risk Reclassification:**
   * A risk that is proven to be already adequately controlled may be reduced or reclassified only when supported by verifiable technical or operational evidence.
3. **Minimum Affected Remediation Chain:**
   * Any risk requiring technical remediation shall proceed strictly through the minimum affected implementation and validation chain, preserving untouched modules in their frozen state.
4. **Preservation of Documented Deferral Scope:**
   * Existing approved v1 deferrals (e.g. data retention manual process `RET-01` / `EVD-17`) remain valid only within their documented scope and do not constitute blanket acceptance of the associated risk.
5. **Approval of Risk Assessment Convention:**
   * The current $5 \times 5$ ISO conformity risk-assessment methodology and scoring convention (`ISO_RISK_METHODOLOGY.md`) is approved for ongoing program use.
6. **Approval of Role-Based Accountability:**
   * Role-based accountability assignments (`ISO_CONTROL_OWNERSHIP_MATRIX.md`) are approved. Named individual assignments may be finalized as organizational or certification evidence later requires.
7. **Controlling Non-Repetition Rule Reaffirmed:**
   * A previously passed, accepted, and unaffected gate shall not be rerun and shall be recorded as:  
     `PASS — REUSED / UNAFFECTED`.

---

## 3. Decision Sign-Off

* **Program Owner Determination:** `APPROVED`
* **Residual Risk Acceptance Recorded:** `NONE (TREATMENT MANDATED)`
* **Current Authorized Action:** Complete ISO-C1-D1 documentary review and checkpoint only. ISO-C2 has not started; this checkpoint does not initiate technical verification or remediation.
* **Next Package if separately instructed:** `ISO-C2 — COMBINED TECHNICAL SECURITY + PRIVACY + CLOUD + SDLC CONFORMITY VERIFICATION`.

## 4. Independent review and lifecycle disposition

Reviewer: Codex. Review package: ISO-C1-D1. Decision record: ACCEPTED after documentary clarifications. Exactly 15 treatment authorizations; zero residual risks accepted. All 30 inherited risk rows retain their baseline inherent/residual likelihood, impact, score and band. Authorization alone does not reduce, close or resolve a risk. Risk reclassification requires new supporting evidence; only the minimum affected lifecycle chain may be reopened. Existing deferrals retain their documented scope; no retention automation or provider approval is granted here.

The methodology and role-accountability approvals recorded here supersede earlier pending-approval wording as of this decision date; historical C1 review reports remain historical evidence. Named-person appointments remain future organizational evidence where required. No invented staff appointment, supplier contract, certification or external sign-off is recorded.

| Lifecycle stage | Disposition | Evidence / boundary |
|---|---|---|
| CODE COMPLETE | PASS — REUSED / UNAFFECTED | Accepted C1/C0 source evidence; no application delta |
| LOCAL FUNCTIONAL | PASS — REUSED / UNAFFECTED | Accepted scoped technical evidence inherited; no rerun |
| LOCAL DATABASE MIGRATED | PASS — REUSED / UNAFFECTED | No schema/migration delta; accepted historical evidence inherited |
| LOCAL REQUIRED DATA SEEDED/SYNCED | PASS — REUSED / UNAFFECTED | No seed/data delta; accepted historical evidence inherited |
| LOCAL ACCEPTANCE PASS | PASS — EXECUTED | Decision-ID reconciliation, baseline score comparison, JSON/reference/scope and changed-document secret checks |
| PREVIEW MIGRATED | N/A — NOT APPLICABLE | No deployed delta |
| PREVIEW ACCEPTANCE PASS | N/A — NOT APPLICABLE | No deployed delta |
| PRODUCTION-READY | N/A — NOT APPLICABLE | Not a release package |
| PRODUCTION DEPLOYMENT/VERIFICATION | N/A — NOT APPLICABLE | No deployment authorized or performed |
| COMPLETED | PASS — EXECUTED | D1 documentary review only |
| ACCEPTED | PASS — EXECUTED | Owner decision record only; no residual-risk acceptance |
| CLOSED | PASS — EXECUTED | D1 package only; risks and treatment actions remain open |
| VERSION FROZEN | N/A — NOT APPLICABLE | Explicitly prohibited; no tag/freeze |

No build, typecheck, application/security tests, migrations, seeds, provider revalidation, Preview or Production validation was executed. No technical remediation or ISO-C2 work was performed. The checkpoint SHA is recorded by Git after commit; it is not self-referenced in this record.
