# RENTipid GLCC v1.1 — Global Wave 1 Reviewer Certification Record

**Controlling Master:** RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0  
**Review Scope:** GLOBAL-W1 Multilingual Class C Controlled-Content Review  
**Status:** `PENDING REVIEWER DECISION`  

---

## 1. Governance Authorities

| Role | Name | Title | Status |
| :--- | :--- | :--- | :--- |
| **Legal / Compliance Reviewer** | **Juan Dela Cruz** | Legal/Compliance Reviewer | **ASSIGNED** |
| **Approval Authority** | **Federico P. Diagono Jr.** | Chief Executive Officer / Project Owner, RENTipid | **ASSIGNED** |

---

## 2. Review Workload & Triage Presentation

The controlled multilingual Class C workload covers **241 canonical keys** across **32 languages** (**7,712 target representations**), partitioned into three risk-prioritized tiers:

### Priority 1: High-Risk / Substantive Legal Concepts
- **Canonical Keys:** 16 keys (e.g. `listingWizard.declarationBody`, `listingWizard.damagePolicyPlaceholder`, `trustSafety.neverPayOutsideThe`, `trustSafety.paymentsAreHeldSecurely`, `legalCompliance.paymentsAreHeldIn`, `legalCompliance.prohibitedItemsIncludeWeapons`, etc.)
- **Target Representations:** **512 REVIEW ATTENTION REQUIRED** representations
- **Review Action Required:** `LEGAL_COUNSEL_EXPLICIT_CONFIRMATION`

### Priority 2: Adapted Substantive Compliance Clauses
- **Canonical Keys:** 104 keys (data subject rights, policy catalog, appeal instructions, terms disclosures)
- **Target Representations:** **3,328 SEMANTIC_EQUIVALENT** representations
- **Review Action Required:** `CONFIRM_EQUIVALENCE`

### Priority 3: Low-Risk / Invariant / Terminology Confirmation
- **Canonical Keys:** 121 keys (badges, document types, status tokens, category tags, RA 11967 tokens)
- **Target Representations:** **3,872 SEMANTIC_EQUIVALENT** representations
- **Review Action Required:** `ROUTINE_TERMINOLOGY_ACCEPTANCE`

---

## 3. Technical Pre-Review Findings Summary

- **Technical Review:** `PASS`
- **Canonical Class C Keys:** 241 / 241 resolved to `SRC-GLCC-*` `v1.0.1`
- **Source Version / Checksum Mismatches:** 0
- **Semantically Equivalent:** 7,200 (93.4%)
- **Review Attention Required:** 512 (6.6%)
- **Critical Meaning Drift:** 0
- **Automatic Corrections Made:** 5,923 (pure linguistic corrections across 31 non-English packages)
- **Remaining Technical Defects:** 0
- **Language / Jurisdiction Independence:** PASS (0 substitution errors; Philippine law and platform rules preserved across all translations)

---

## 4. Single Global Reviewer Attestation Text (Draft)

> *"I, Juan Dela Cruz, acting as Legal/Compliance Reviewer for RENTipid, confirm that I reviewed the GLOBAL-W1 Class C multilingual controlled-content review package covering 241 canonical controlled keys and their multilingual representations, including the risk-prioritized human review queue and technical semantic review findings.*
>
> *Subject to any specifically recorded exceptions, I confirm that the reviewed translations preserve the intended controlled legal/compliance meaning of the authoritative source and do not independently alter jurisdiction, obligations, rights, payment authority, KYC requirements, consumer protections, or other controlled legal meaning."*

> [!NOTE]
> This attestation is currently an unexecuted draft. Reviewer assignment does NOT constitute approval. The decision fields below remain in PENDING status.

---

## 5. Reviewer Decision Record

```yaml
REVIEWER: Juan Dela Cruz
ROLE: Legal/Compliance Reviewer
REVIEW_DECISION: PENDING
ALLOWED_VALUES:
  - APPROVED
  - APPROVED WITH EXCEPTIONS
  - REJECTED
REVIEW_DATE: PENDING
APPROVAL_REFERENCE: PENDING
SIGNATURE: null
EXCEPTIONS: NONE RECORDED / PENDING
```

---

## 6. Governed Promotion Rule

1. If `REVIEW_DECISION` = `APPROVED`: Execute `batch-approval-transition.ts` to transition all 32 translation packages to `APPROVED_FOR_QA` and advance to `GLOBAL-W1-F`.
2. If `REVIEW_DECISION` = `APPROVED WITH EXCEPTIONS`: Correct specifically flagged exceptions, obtain reviewer re-confirmation, then execute batch transition.
3. If `REVIEW_DECISION` = `REJECTED`: Halt wave promotion and address reviewer findings.
4. While `REVIEW_DECISION` = `PENDING`: All translation packages remain locked in `COMPLIANCE_REVIEW`.
