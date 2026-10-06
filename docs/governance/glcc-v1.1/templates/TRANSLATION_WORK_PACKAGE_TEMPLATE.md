# RENTipid GLCC v1.1 — Translation Work Package Governance Template

**Controlling Master:** `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0`  
**Workstream:** `P12 / v1.1 GLOBAL EXPANSION FACTORY`  
**Document:** `TRANSLATION WORK PACKAGE TEMPLATE`  
**Version:** `1.1.0`  

---

## 1. Overview & Purpose

This template governs the standard machine-readable translation lifecycle for onboarding any new international language into RENTipid.

The workflow standardizes how translation source dictionaries are exported, classified, drafted, reviewed linguistically, audited for legal compliance, validated for syntax and interpolation integrity, and packaged for downstream test ingestion in Work Package P12-D.

---

## 2. Canonical Source Baseline

- **Authoritative Source Locale:** `en-PH`
- **Canonical Key Count:** `2,208` keys
- **Authoritative Contract:** `src/lib/glcc/i18n/contracts/index.ts`
- **Baseline Checksums:**
  - Canonical Key Checksum: `a682064cf1f532c26884104887b012b27be830be39b41e27d0c1d58f77b36fdf`
  - Source Message Checksum: `0566572080c895732e61ef62108403a283f6abf12e762eb29ba77a1460c2cbb8`
- **Immutability Principle:** Source keys and messages cannot be altered by translators. Any change to the source schema requires governed master updates.

---

## 3. Translation Workflow State Progression

Work packages transition through five formal workflow states. Progression is unidirectional:

```text
[ SOURCE_LOCKED ] ──► [ DRAFT ] ──► [ LINGUISTIC_REVIEW ] ──► [ COMPLIANCE_REVIEW ] ──► [ APPROVED_FOR_QA ]
```

### State Definitions:
1. **SOURCE_LOCKED:** Source keys, baseline checksums, and placeholders are locked. Package generated for target locale.
2. **DRAFT:** Translators or AI translation assistants populate translations. Incomplete work allowed; non-runtime.
3. **LINGUISTIC_REVIEW:** All 2,208 required keys translated. Linguists audit accuracy, natural fluency, and grammar.
4. **COMPLIANCE_REVIEW:** Controlled Class C content (legal, regulatory, KYC, terms) is separately audited by legal counsel.
5. **APPROVED_FOR_QA:** Structural validation passes (100% key parity, 0 placeholder errors, 0 format syntax errors, 100% Class C sign-offs). Package is ready for handoff to P12-D compiler.

*(Note: `APPROVED_FOR_QA` is a translation factory state and does NOT equal `PRODUCTION_READY` or grant Production selector eligibility).*

---

## 4. Content Classification & Responsibilities

| Class | Name | Scope & Domains | Governance Rules |
| :--- | :--- | :--- | :--- |
| **Class A** | Standard UI | Buttons, navigation, listing UI, profile | Standard translator workflow & linguistic review. |
| **Class B** | System & Transactional | Validation messages, auth errors, payments | Strict ICU syntax checking; high-priority clarity. |
| **Class C** | Controlled Legal / Compliance | Terms, Privacy, KYC disclaimers, jurisdiction | **Requires accredited human legal sign-off.** AI drafts cannot self-approve. |
| **Class D** | User-Generated Content Boundary | Placeholders for chat, reviews, descriptions | Preserves raw user content; translation strictly derivative. |
| **Class E** | AI / Generated Content Boundary | AI assistant prompts, summaries | Must not displace authoritative legal/financial terms. |

---

## 5. AI Drafting Boundaries & Safeguards

AI assistance may be leveraged for productivity under strict guardrails:
- **Permitted AI Tasks:** Drafting initial suggestions for Class A and Class B content, terminology consistency audits, missing key detection.
- **Initial Status:** All AI-generated outputs MUST enter as `DRAFT` with `isAiDraft: true`.
- **Prohibited AI Autonomy:**
  - AI may **NOT** sign off on linguistic reviews.
  - AI may **NOT** grant legal/compliance approval for Class C content.
  - AI may **NOT** promote locale release status in the registry.
  - AI may **NOT** write directly to production runtime bundles.
  - AI translations cannot replace authoritative legal contract text.

---

## 6. Placeholder & Format Integrity Rules

1. **Exact Token Preservation:** If source contains `{count}` or `{name}`, target translation must contain the exact same `{count}` or `{name}`.
2. **No Token Removal:** Translators must not delete placeholder variables.
3. **No Token Invention:** Translators must not introduce new `{variables}` not present in the source string.
4. **No Renaming:** Variables must remain in English token naming (`{count}`, not `{bilang}`).
5. **Valid ICU / Braces:** Unbalanced braces (`{`, `}`) or corrupt nested syntax will trigger automated validation failure.
6. **No Unicode Replacement Characters:** Replacement character `\uFFFD` is strictly rejected.

---

## 7. Source-Drift Protection

- Every exported package records `canonicalKeyChecksum` and `sourceMessageChecksum`.
- During validation, the validator recalculates the active canonical checksums from the code base.
- If the canonical schema changes after export, validation fails with `status: SOURCE_DRIFT`.
- Translators must re-synchronize the package against the latest baseline before proceeding.

---

## 8. Controlled Class C Legal Approval Requirements

For any key tagged `CLASS_C_CONTROLLED_LEGAL_COMPLIANCE`:
- `legalApprovalRequired: true`
- `legalApprovalStatus` must be explicitly marked `APPROVED`.
- `legalApprovalReference` must cite a formal legal memorandum, ticket, or counsel review ID.
- `reviewerReference` must name the designated accredited legal counsel.
- Packages with `PENDING` or `REJECTED` Class C keys cannot enter `APPROVED_FOR_QA`.

---

## 9. Validation Gate & Handoff to P12-D

A work package is deemed complete and ready for P12-D only when:
1. `validateTranslationWorkPackage()` reports `status: 'VALID'` with `errorCount: 0`.
2. Total canonical key coverage equals 100% (`2,208 / 2,208`).
3. Zero missing keys, zero extra keys, zero duplicate keys.
4. Zero placeholder mismatches or broken interpolation signatures.
5. Zero message-format syntax errors and zero `\uFFFD` characters.
6. Zero unapproved Class C legal/compliance keys.
7. Package is formally saved as `docs/governance/glcc-v1.1/evidence/p12/[locale]-work-package.json`.

---

## 10. Downstream Handoff

Upon achieving `APPROVED_FOR_QA`, the validated work package is handed off to **Work Package P12-D (Locale Pack Generation & Validation)** to compile typed TypeScript bundles and update test fixtures under formal governance.
