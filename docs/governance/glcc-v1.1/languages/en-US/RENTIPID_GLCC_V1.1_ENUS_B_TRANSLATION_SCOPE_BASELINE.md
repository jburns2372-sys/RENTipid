# RENTipid GLCC v1.1 — en-US Translation Work Package & Scope Baseline (ENUS-B)

**Controlling Master:** `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0`  
**Governing Factory:** `P12 / v1.1 GLOBAL EXPANSION FACTORY (COMPLETE — ACCEPTED — CLOSED — FROZEN)`  
**Language Workstream:** `en-US` (English - United States)  
**Current Action:** `ENUS-B TRANSLATION WORK PACKAGE / SCOPE BASELINE`  
**Date:** 2026-10-06  
**Dedicated Branch:** `feat/glcc-v1.1-en-us`  
**ENUS-A Governance Commit:** `3427d5c16211142bf2e20bcfa6f7847eab5b7811`  
**P12-J Final Governance Commit:** `c3974169e3e294d15541bb173c5037adccca8850`  
**Factory Implementation Source:** `c25111d038190a76c6dfad1759d211cd0459e6cc`  
**Source Locale:** `en-PH`  
**Target Locale:** `en-US`  
**Current en-US Release Status:** `TRANSLATION_IN_PROGRESS`  
**Current Work Package Workflow State:** `SOURCE_LOCKED`  
**ENUS-B Status:** `PASS`  

---

## 1. Executive Summary & Factory Verification

Under explicit Owner Authorization (*"I AUTHORIZE en-US AS THE FIRST REAL LANGUAGE WORKSTREAM"*), stage **ENUS-B** executes the formal scope baseline for `en-US` localization using the frozen P12-C translation workflow factory tooling.

The frozen P12-C export engine (`scripts/glcc-v1.1/translation-source-export.ts`) was executed without modification to generate a non-runtime, machine-readable Translation Work Package capturing all 2,208 canonical keys, exact placeholder signatures, and governance content classifications.

```
Canonical Source (en-PH, 2208 keys)
                │
                ▼ [scripts/glcc-v1.1/translation-source-export.ts]
Governed Work Package (docs/.../work/en-US-translation-work-package.json)
                │
                ▼ [scripts/glcc-v1.1/translation-package-validate.ts]
Structural Integrity Validation: PASS (0 errors, 0 drift, 2208 keys)
                │
                ▼
Workflow State: SOURCE_LOCKED ──► Ready for Drafting in ENUS-C
```

---

## 2. Canonical Source Integrity & Cryptographic Checksums

The active canonical source strings from `src/lib/glcc/i18n/contracts/index.ts` were re-verified against the baseline:

| Metric | Measured Value | Baseline Requirement | Status |
| :--- | :--- | :--- | :---: |
| **Canonical Key Count** | `2,208` keys | `2,208` keys | `PASS` |
| **Canonical Key Checksum (SHA-256)** | `a682064cf1f532c26884104887b012b27be830be39b41e27d0c1d58f77b36fdf` | Expected match | `PASS` |
| **Source Message Checksum (SHA-256)** | `0566572080c895732e61ef62108403a283f6abf12e762eb29ba77a1460c2cbb8` | Expected match | `PASS` |
| **Canonical Source Drift** | `NO` | Zero drift | `PASS` |

---

## 3. Work Package Generation & Storage Isolation

The generated work package is stored strictly in the governed documentation/governance workspace outside the application runtime:

- **Work Package Path:** `docs/governance/glcc-v1.1/languages/en-US/work/en-US-translation-work-package.json`
- **Package Version:** `1.1.0`
- **Workflow State:** `SOURCE_LOCKED`
- **Total Message Entries:** `2,208`
- **Target Text State:** Untranslated (`""` empty strings)
- **Runtime Locale Directory Check:** Zero files created under `src/lib/glcc/i18n/locales/en-US*`
- **Runtime Import Check:** No runtime code imports or depends on this work package

### Structural Validation:
Validated via `scripts/glcc-v1.1/translation-package-validate.ts`:
- Unknown keys: `0`
- Duplicate keys: `0`
- Missing canonical keys: `0`
- Format syntax errors: `0`
- Invalid Unicode replacement characters (`\uFFFD`): `0`
- Structural Validation Result: `PASS (VALID)`

---

## 4. Content Classification Inventory

The 2,208 canonical keys are classified according to the P12-C / P12-F governance classification taxonomy:

| Content Classification Tier | Key Count | Percentage | Handling Rules |
| :--- | :---: | :---: | :--- |
| **Class A: Standard UI Copy** | `1,127` | `51.04%` | General navigation, buttons, titles, static form labels. Governed adaptation workflow. |
| **Class B: System & Transactional** | `310` | `14.04%` | Auth, checkout, payment, booking, errors, validation, and alerts. Strict ICU variable validation. |
| **Class C: Controlled Legal & Compliance** | `216` | `9.78%` | Terms of service, privacy disclosures, statutory notices, dispute clauses. Formal legal review required. |
| **Class D: User-Generated Content Boundary** | `0` | `0.00%` | UGC boundary messages (placeholders isolated). |
| **Class E: AI / Generated Content Boundary** | `347` | `15.72%` | SOC, telemetry alerts, AI prompts/summaries. Non-binding operational copy. |
| **Classification Review Required** | `208` | `9.42%` | Domain-specific edge keys scheduled for tier refinement during ENUS-C drafting. |
| **Total Reconciled Scope** | **`2,208`** | **`100.0%`** | **Exact key reconciliation confirmed (2,208 / 2,208)** |

---

## 5. Interpolation & Placeholder Inventory

Dynamic message placeholders were inventoried across the canonical source text:

- **Messages Containing Placeholders:** `43` messages
- **Total Placeholder Signatures Captured:** `48` occurrences
- **Unique Placeholder Variables:** `21` distinct names
- **Malformed Source Messages:** `0` (Zero unclosed braces, zero invalid brace nesting)
- **Unique Variable Inventory:**
  `amount`, `code`, `count`, `country`, `currency`, `date`, `duration`, `fee`, `id`, `language`, `name`, `price`, `provider`, `rate`, `reason`, `risk`, `seconds`, `status`, `title`, `unit`, `year`

*Rule for Drafting: All 43 dynamic messages must preserve their exact placeholder variable names and ICU syntax in the target text.*

---

## 6. en-US Regional Language & Adaptation Policy

Although source (`en-PH`) and target (`en-US`) share the English language family, `en-US` requires deliberate regional adaptation and must not be treated as a trivial verbatim copy.

### Review Domains for ENUS-C Drafting:
1. **Orthography / Spelling:** Adaptation to standard US English spelling (e.g., *center* vs *centre*, *color* vs *colour*, *license* vs *licence*, *canceled* vs *cancelled*).
2. **Terminology & Idioms:** Context-appropriate US rental and commercial terminology (e.g., *ZIP code* vs *postal code*, *cell phone / mobile phone*, *driver's license*).
3. **Form & Address Labels:** Clear labeling appropriate for US-dialect readers while preserving universal comprehension.
4. **Context-Specific Review Rule:** Automatic or indiscriminate global find-and-replace is strictly prohibited. Every term must be evaluated in its exact UI context.
5. **Placeholder Invariance:** Variable names inside `{...}` (e.g. `{amount}`, `{date}`) must never be translated or altered.

---

## 7. Governing Separation of Concerns

### 7.1 Language vs. Country & Financial Authority Independence
Selection of `en-US` represents purely linguistic preference. It must **never** imply or enforce:
- Country = United States (`US`)
- Display Currency = `USD`
- Charge Currency = `USD`
- Payment gateway routing = US processors
- Legal jurisdiction = United States courts
- KYC authority = United States identity providers

A Philippine customer or international traveler in Manila selecting `en-US` continues transacting in Philippine Pesos (`PHP`) under Philippine property and tenancy laws.

### 7.2 Translatable Text vs. Locale-Aware Formatting
Language translation governs translatable copy only. Runtime formatting engines (`formatters.ts`, `fx-quote-service.ts`) retain exclusive authority over:
- Currency symbol placement and decimal exponent handling
- Numeric thousands separators and decimal points
- Calendar date and timestamp representations
- Telephone and address block formatting

---

## 8. Class C Legal / Compliance Control Plan

For all 216 Class C controlled keys:
- Initial status: `legalApprovalRequired: true`, `legalApprovalStatus: 'PENDING'`.
- Authoritative source reference: `SRC-GLCC-[key]`, version `v1.0.1`.
- Completion of translation text in ENUS-C does **not** grant authoritative legal standing.
- Formal legal sign-off and approval references (`legalApprovalReference`) will be executed under **ENUS-F (Legal / Compliance Review)** prior to any release promotion.

---

## 9. Current Runtime Baseline & Isolation Confirmation

The live application runtime remains completely untouched:

| Runtime Metric | Measured State | Status |
| :--- | :--- | :---: |
| **Runtime en-US Key Count** | `0` | `PASS` |
| **Runtime en-US Coverage** | `0.0%` | `PASS` |
| **Runtime en-US Missing Required Keys** | `2,208` | `PASS` |
| **Runtime en-US Required Fallback** | `2,208` (Fallback to `en-PH`) | `PASS` |
| **Runtime en-US Raw Key Count** | `0` (Safe fallback enforced) | `PASS` |
| **Runtime en-US Release Status** | `TRANSLATION_IN_PROGRESS` | `PASS` |
| **Runtime en-US Bundle Created** | `NO` | `PASS` |
| **Locale Registry Modified** | `NO` | `PASS` |
| **Database Migrations / Seeds** | `NONE` | `PASS` |
| **Production / Preview Deployments** | `NONE` | `PASS` |

---

## 10. ENUS-C Translation Completion Targets

Stage ENUS-B concludes with the work package in `SOURCE_LOCKED`. The authorized next step is **ENUS-C**, which must achieve:
- Translation / adaptation of all 2,208 canonical message entries into `DRAFT` status
- Linguistic review and validation of all placeholder signatures
- Zero format, syntax, or Unicode replacement errors
- Progressing workflow state towards `APPROVED_FOR_QA`
