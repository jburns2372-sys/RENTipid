# RENTipid GLCC v1.1 — en-US Controlled Legal Approval Dossier (ENUS-D)

**Controlling Master:** `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0`  
**Governing Factory:** `P12 / v1.1 GLOBAL EXPANSION FACTORY (COMPLETE — ACCEPTED — CLOSED — FROZEN)`  
**Language Workstream:** `en-US` (English - United States)  
**Current Action:** `ENUS-D LEGAL / COMPLIANCE REVIEW & CONTROLLED APPROVAL`  
**Date:** 2026-10-06  
**Status:** **`BLOCKED — CONTROLLED APPROVAL REQUIRED`**  

---

## 1. Executive Summary & Security Notice

In strict accordance with the mandatory security standards of **RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0** and the frozen P12-F Legal Control Factory, **Class C (Controlled Legal & Compliance)** copy cannot receive authoritative legal standing through automated AI translation or engineering linguistic review alone.

This dossier documents all **241 Class C controlled items** awaiting formal audit and sign-off by accredited Legal Counsel and Compliance Reviewers before Work Package `en-US` may enter `APPROVED_FOR_QA` (and before locale pack compilation in ENUS-E).

---

## 2. Summary Audit Metrics

| Metric | Measured Count | Status |
| :--- | :---: | :---: |
| **Total Class C Items** | `241` | `100.0%` |
| **Approval Required** | `241` | `100.0%` |
| **Approval Not Required** | `0` | `0.0%` |
| **Already Approved** | `0` | `0.0%` |
| **Pending Approval** | `241` | `100.0%` |
| **Unresolved Sources** | `0` | `0.0%` (All 241 mapped to canonical `SRC-GLCC-*` `v1.0.1`) |
| **Identical Source Reuse** | `239` | `99.17%` |
| **Regionally Adapted Copy** | `2` | `0.83%` |
| **Legal Reviewer Status** | `PENDING GOVERNED ASSIGNMENT` | **Fail-Closed Enforced** |
| **Approval Authority Status** | `PENDING GOVERNED ASSIGNMENT` | **Fail-Closed Enforced** |

---

## 3. Categories of Controlled Items

| Category | Item Count | Scope Overview |
| :--- | :---: | :--- |
| **Regulatory & Statutory Compliance** | `155` | Business permits, safety certificates, risk category warnings, listing permits |
| **Privacy & Data Protection** | `28` | Privacy policy, DPO contact, user data access, consent management |
| **KYC & Identity Verification** | `22` | Valid IDs, proof of ownership, selfie verification, account KYC gates |
| **Consumer Protection & Safety** | `13` | Prohibited items, report illegal activity, consumer safety notices |
| **Terms & Contractual** | `9` | Terms of service, provider declarations, damage policies |
| **Other Controlled Content** | `7` | Administrative compliance controls, audit policies |
| **Payment & Financial Disclaimer** | `5` | Charge currency notices (PHP locked), authoritative price notices |
| **Jurisdiction & Governing Law** | `1` | Governing law disclosures |
| **Intellectual Property** | `1` | Copyright & IP notices |
| **Total** | **`241`** | **Complete Class C Census** |

---

## 4. Regionally Adapted Class C Items (Mandatory Review)

The following 2 items underwent regional US English orthographic adaptation and require explicit legal validation:

1. **`legalCompliance.noPoliciesFoundIn`**
   - Source (`en-PH`): *"No policies found in the catalogue."*
   - Target (`en-US`): *"No policies found in the catalog."*
   - Rationale: US English spelling adaptation (*catalog* vs *catalogue*).
2. **`legalCompliance.policyCatalogue`**
   - Source (`en-PH`): *"Policy Catalogue"*
   - Target (`en-US`): *"Policy Catalog"*
   - Rationale: US English spelling adaptation (*Catalog* vs *Catalogue*).

---

## 5. Required Actions for Governed Remediation

To unblock stage **ENUS-D** and permit progression to **ENUS-E (Locale Pack Generation)**:

1. **Reviewer Assignment:** The Product Owner must assign accredited legal/compliance reviewer(s) in governance records.
2. **Substantive Audit:** Legal counsel must audit the 241 records in `docs/governance/glcc-v1.1/languages/en-US/legal/en-US-controlled-content-records.json`.
3. **Approval Execution:** Assign formal approval references (e.g. `LGL-REV-ENUS-20261006`) and transition `approvalStatus` from `PENDING` to `APPROVED`.
4. **Package Promotion:** Transition `en-US-translation-work-package.json` from `COMPLIANCE_REVIEW` to `APPROVED_FOR_QA`.

*Operating Directive: Under fail-closed governance, no engineering agent may bypass this step.*
