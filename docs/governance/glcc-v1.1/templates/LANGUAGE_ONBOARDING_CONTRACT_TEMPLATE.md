# RENTipid GLCC v1.1 — Language Onboarding Contract Template

**Controlling Master:** `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0`  
**Workstream:** `P12 / v1.1 GLOBAL EXPANSION FACTORY`  
**Target Locale:** `[LOCALE_TAG]` (e.g., `es-ES`, `zh-CN`, `ja-JP`)  
**Onboarding Date:** `[YYYY-MM-DD]`  
**Status:** `[REGISTERED / TRANSLATION_IN_PROGRESS / QA_REQUIRED / PRODUCTION_READY]`  

---

## 1. Language Identification

| Field | Specification / Value |
| :--- | :--- |
| **Locale Tag** | `[bcp-47-tag]` (e.g. `ja-JP`) |
| **Language Name (English)** | `[English Name]` |
| **Native Display Name** | `[Endonym in native script]` |
| **Script** | `[e.g., Latin, Kanji/Kana, Cyrillic]` |
| **Text Direction** | `[ltr / rtl]` |
| **Default Fallback Locale** | `en-PH` |
| **Target Country / Market** | `[Country/Region code, e.g., JP]` *(Independent of language logic)* |
| **Unicode / Script Requirements**| UTF-8, Normalization Form NFC, designated font fallbacks |

---

## 2. Ownership & Accountability

- **Language Owner:** `[Name / Engineering Lead]`
- **Translation Owner:** `[Name / Lead Translator / Agency]`
- **QA Owner:** `[Name / Lead QA Engineer]`
- **Legal / Compliance Reviewer:** `[Name / Legal Counsel]`
- **Release Approver:** `[Name / Product & Governance Owner]`

---

## 3. Source Baseline & Dictionary Scope

- **Authoritative Source Locale:** `en-PH`
- **Canonical Key-Set Version:** `v1.0.1` (Baseline: `2,208` keys)
- **Target Key Count:** `2,208` canonical keys
- **Source Checksum Reference:** `[Source dictionary hash]`

### Scope Domains:
- [x] Application Shell & Global Layout
- [x] Navigation & Breadcrumbs
- [x] Forms, Placeholders & Input Labels
- [x] Form Validation Messages & Error States
- [x] Authentication (Login, Register, MFA, Password Reset)
- [x] Account, Profile & Global Preferences
- [x] Property Listings, Search & Filters
- [x] Booking, Rental Agreements & Workflow UI
- [x] Payment Display Notices (Non-authoritative UI)
- [x] System Notifications, Modals & Toast Alerts
- [x] Application Metadata & SEO Tags
- [x] Admin & Super-Admin Console Interfaces
- [x] Controlled Legal / Compliance Content (Class C)
- [x] User-Generated Content Isolation (Class D)

---

## 4. Release State Lifecycle Model

The onboarding language must follow the unidirectional state progression:

```text
[ REGISTERED ]  ───►  [ TRANSLATION_IN_PROGRESS ]  ───►  [ QA_REQUIRED ]  ───►  [ PRODUCTION_READY ]
```

- **Current State:** `[STATE]`
- **State Promotion Approver:** `[Approver]`
- **Promotion Authorization Reference:** `[Directive / Commit]`

---

## 5. Measurable Coverage & Validation Contract

Prior to exiting `TRANSLATION_IN_PROGRESS`, the language pack must satisfy:

| Metric | Target | Actual | Evaluation |
| :--- | :--- | :--- | :--- |
| **Canonical Key Coverage** | `100.0%` | `[0.0%]` | `[PENDING / PASS]` |
| **Missing Required Keys** | `0` | `[Count]` | `[PENDING / PASS]` |
| **Raw Key Rendering Count** | `0` | `[Count]` | `[PENDING / PASS]` |
| **Unapproved Required Fallbacks** | `0` | `[Count]` | `[PENDING / PASS]` |
| **Placeholder Variable Integrity** | `100%` | `[0.0%]` | `[PENDING / PASS]` |
| **ICU Message-Format Syntax** | `100% PASS` | `[PASS/FAIL]` | `[PENDING / PASS]` |
| **Duplicate / Conflicting Keys** | `0` | `[Count]` | `[PENDING / PASS]` |
| **Broken Interpolation Variables** | `0` | `[Count]` | `[PENDING / PASS]` |

---

## 6. Content Classification & Governance Controls

- **Class A (Standard UI):** Governed translation workflow & automated linting.
- **Class B (System & Transactional):** Strict ICU syntax validation, high-priority localization.
- **Class C (Controlled Legal / Compliance):** Requires formal human/legal review and sign-off. Machine translation is strictly non-authoritative.
- **Class D (User-Generated Content):** Original content preserved verbatim. Translations labeled derivative.
- **Class E (AI / Generated Content):** AI content forbidden from replacing statutory or contractual terms.

---

## 7. Security & Authority Invariance Verification

Switching to `[LOCALE_TAG]` must be proven to have **ZERO** impact on:
- [ ] Tenant / Property Country
- [ ] Display Currency (decoupled unless explicitly changed)
- [ ] Charge Currency (locked to lease contract)
- [ ] Payment Processor Routing & Authority
- [ ] Platform Fee Calculations & Surcharges
- [ ] Double-Entry Financial Ledger
- [ ] Payout Routing & Refund Authority
- [ ] Role-Based Access Control (RBAC) Permissions
- [ ] KYC Verification Thresholds & Identity Rules
- [ ] Governing Law & Dispute Jurisdiction
- [ ] Authoritative Legal Document Versioning

---

## 8. SSR / CSR Localization Runtime Guarantees

The compiled language pack must demonstrate:
- [ ] Server-side locale resolution via headers/cookies.
- [ ] Client-side instant switching without mandatory page reload.
- [ ] Persistence across client route navigation.
- [ ] Persistence across hard browser refresh (`Ctrl+F5`).
- [ ] Functional parity between guest visitors and authenticated users.
- [ ] Correct `<html lang="..." dir="...">` rendering.
- [ ] Zero React hydration warnings or mismatch errors.
- [ ] Zero flash of unlocalized content (FOUC).

---

## 9. Deployment Mode Selector Eligibility

- **Production Selector:** Selectable **ONLY** when status is `PRODUCTION_READY`.
- **Preview / Staging Selector:** Selectable when status is `QA_REQUIRED` or `PRODUCTION_READY`.
- **Registered / Drafting:** **NEVER** selectable in UI selectors. Fail-closed enforced.

---

## 10. Required Governance Evidence Checklist

Before final promotion to `PRODUCTION_READY`, attach:
- [ ] `[locale]-onboarding.json` (This completed contract)
- [ ] `[locale]-translation-coverage.json` (100% key validation output)
- [ ] `[locale]-qa-results.json` (Rendering, hydration, SSR/CSR, selector tests)
- [ ] `[locale]-legal-approval.json` (Class C sign-off, if applicable)
- [ ] `[locale]-preview-acceptance.json` (Preview environment staging validation)
- [ ] `[locale]-production-readiness.json` (Operational readiness review)
