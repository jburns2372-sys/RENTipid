# RENTipid GLCC v1.1 — Action P12-B Language Onboarding Contract Report

**Controlling Master:** `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0`  
**Workstream:** `P12 / v1.1 GLOBAL EXPANSION FACTORY`  
**Current Action:** `P12-B LANGUAGE ONBOARDING CONTRACT`  
**Evaluation Date:** 2026-10-06  
**Governed Branch:** `feat/glcc-v1.1-global-expansion-factory`  
**P12 Kickoff Governance Commit:** `0d7d9dac179b0aecfca83c0159aae3a7aced11df`  
**Base Governance Commit:** `6533e882d0f6a52fb8f2eb4eaa6eb04c2c4121dd`  
**Frozen v1.0.1 Application Source:** `7ed8388f36e970f7da7d04ca44afccb883d4ea9d`  
**Active Production Deployment ID:** `dpl_7CtWAHhhBu2zWNcDPPNkDX7zBw6X`  
**Owner Authorization:** `I AUTHORIZE P12 / v1.1 GLOBAL EXPANSION FACTORY` (`CONFIRMED`)  
**P12-B Status:** `PASS`  

---

## 1. Executive Summary & Objective

Work Package action **P12-B** establishes the authoritative, reusable **Language Onboarding Contract** for the RENTipid Global Expansion Factory.

Every language candidate targeted for RENTipid expansion must satisfy this contract before implementation begins, throughout drafting and testing, and prior to any Preview or Production promotion.

This action is strictly architectural and governance-oriented:
- **Runtime Source Changes:** `0`
- **Translation Code Changes:** `0`
- **Locale Registry Modifications:** `0`
- **First Language Implementation Priority:** `NOT YET AUTHORIZED` (Language-neutral baseline maintained)

---

## 2. Preserved v1.0.1 Baseline & Kickoff State

All prior milestones from GLCC v1.0.1 and P12 Kickoff are preserved without re-execution:

| Gate / Milestone | Status | Details |
| :--- | :--- | :--- |
| **v1.0.1 Lifecycle** | `PRESERVED — VALIDATED` | Gates G1 through G13 Complete, Closed, Frozen |
| **v1.0.1 Frozen Application Source** | `7ed8388f36e970f7da7d04ca44afccb883d4ea9d` | Verified via Git SHA and Git Tags |
| **Canonical Release Tags** | `PRESERVED — PASS` | `rentipid-glcc-v1.0.1-frozen`, `glcc-v1.0.1` |
| **v1.0.1 Immutability Boundary** | `DEFINED — PASS` | Zero code changes to v1.0.1 frozen source |
| **P12 Entry Criteria** | `PASS` | Authorized by Owner Directive |
| **P12 Factory Stages** | `DEFINED — PASS` | Stages P12-A through P12-J established |
| **v1.1 Non-Regression Baseline** | `DEFINED — PASS` | 13 Architectural Invariants active |
| **en-PH State** | `PRODUCTION_READY` | 100% Coverage (2,208 keys), Selectable in Prod |
| **fil-PH State** | `PRODUCTION_READY` | 100% Coverage (2,208 keys), Selectable in Prod |
| **en-US State** | `TRANSLATION_IN_PROGRESS` | Non-Production (Fail-Closed) |
| **ja-JP State** | `REGISTERED` | Non-Production (Fail-Closed, 0 keys) |
| **Canonical Key Count** | `2208` | Unified baseline key schema |

---

## 3. Reusable Language Onboarding Contract Specification

Every new language onboarded into RENTipid must document and satisfy five mandatory contract areas:

### 3.1. Language Identification
- **Locale Tag:** BCP 47 compliant string (e.g., `en-PH`, `fil-PH`, `en-US`, `ja-JP`).
- **Language Name:** Standard English name and native script name.
- **Script & Text Direction:** Script system (Latin, Han, Kana, Arabic, etc.) and reading direction (`ltr` or `rtl`).
- **Fallback Locale:** Explicitly defined fallback locale (defaults to `en-PH` for enterprise consistency).
- **Target Countries/Markets:** Optional geographic reference, maintaining complete structural independence between language and country.
- **Unicode/Script Requirements:** Minimum UTF-8 encoding requirements, normalization forms (`NFC`), and font rendering support.

### 3.2. Ownership & Accountability
- **Language Owner:** Lead engineer/architect responsible for lifecycle compliance.
- **Translation Owner:** Linguistic specialist or translation agency responsible for dictionary quality.
- **QA Owner:** Test engineer verifying coverage, rendering, SSR/CSR, and regression prevention.
- **Legal/Compliance Reviewer:** Legal counsel or compliance lead approving statutory Class C content.
- **Release Approver:** Product owner / governance lead authorizing state promotions.

### 3.3. Source Baseline
- **Canonical Key-Set Version:** Semver of the authoritative RENTipid dictionary schema.
- **Canonical Key Count:** Exact count of canonical keys required (Baseline: `2,208`).
- **Source Locale:** Primary reference dictionary (`en-PH`).
- **Source Content Checksum:** Cryptographic hash of the source baseline dictionary to detect schema drift.

### 3.4. Translation Scope
Every onboarding language must account for all system domains:
1. Application UI & Shell
2. Navigation & Breadcrumbs
3. Forms, Placeholders & Input Labels
4. Form Validation Messages & Error States
5. Authentication (Login, Register, MFA, Password Reset)
6. Account, Profile & Settings
7. Property Listings & Discovery
8. Search & Geo-Filtering
9. Booking, Rental Agreements & Lease Workflows
10. Payment & Billing Display Text (non-authoritative)
11. System Notifications & Toast Alerts
12. Application Metadata & SEO Tags
13. Admin & Super-Admin Console Interfaces
14. Controlled Legal & Regulatory Disclosures
15. User-Generated Content Boundaries (Class D isolation)

---

## 4. Governed Release State Transitions

Languages transition through a strictly unidirectional 4-stage lifecycle model. **No state may be skipped.**

```text
[ REGISTERED ]  ───►  [ TRANSLATION_IN_PROGRESS ]  ───►  [ QA_REQUIRED ]  ───►  [ PRODUCTION_READY ]
```

### Transition Gates:

1. **REGISTERED:**
   - *Entry:* Locale metadata is registered in the code base; releaseStatus is set to `REGISTERED`.
   - *Behavior:* Fail-closed in all environments; excluded from selectors.
   - *Exit:* Owner/governance explicitly authorizes translation work.

2. **TRANSLATION_IN_PROGRESS:**
   - *Entry:* Formal translation work commences against canonical baseline.
   - *Behavior:* Fail-closed in Production; visible only in dedicated dev testing flags.
   - *Exit:* Translation bundle achieves structural completeness and passes automated linting.

3. **QA_REQUIRED:**
   - *Entry:* 100% canonical key coverage achieved; zero missing keys; zero raw key leaks; message-format passes.
   - *Behavior:* Eligible for Preview/staging evaluation; fail-closed in Production.
   - *Exit:* Passes automated QA, Preview acceptance, security, legal, and financial invariance tests.

4. **PRODUCTION_READY:**
   - *Entry:* Formal owner acceptance and governance approval; passes G1–G13 promotion gates.
   - *Behavior:* Publicly selectable in Production environment.

**LANGUAGE RELEASE STATE MODEL:** `DEFINED — PASS`

---

## 5. Translation Coverage Contract

For any candidate language to exit `TRANSLATION_IN_PROGRESS` and enter `QA_REQUIRED`, it must satisfy measurable, zero-tolerance quality gates:

- **Canonical Required Key Coverage:** `100.0%`
- **Missing Required Keys:** `0`
- **Raw Translation Keys Leaked in UI:** `0`
- **Unapproved Source-Language Fallback:** `0`
- **Placeholder Variable Integrity:** `100%` (Exact match of `{count}`, `{name}`, etc.)
- **ICU / Message-Format Integrity:** `100%` (Valid syntax, valid pluralization trees)
- **Duplicate or Conflicting Key Definitions:** `0`
- **Invalid Unicode Replacement Characters (U+FFFD):** `0`
- **Broken Interpolation Variables:** `0`

**TRANSLATION COVERAGE CONTRACT:** `DEFINED — PASS`

---

## 6. Content Classification & Governance Boundaries

Translatable content across RENTipid is partitioned into five distinct classes with differentiated governance requirements:

| Class | Classification Name | Description | Governance & Translation Rules |
| :--- | :--- | :--- | :--- |
| **Class A** | **Standard UI** | Buttons, menus, headers, general layout text | Standard governed translation workflow & automated review |
| **Class B** | **System & Transactional** | Validation errors, payment display notices, alerts | Strict message-format linting, high-priority localization |
| **Class C** | **Controlled Legal & Compliance** | Terms of Service, Privacy Policy, KYC disclosures | **Strict human/legal review required.** Machine translation forbidden from becoming authoritative without formal legal provenance. |
| **Class D** | **User-Generated Content (UGC)** | Listing descriptions, landlord/renter chat, reviews | **Original content preserved verbatim.** Any translation must be clearly labeled as derivative and non-authoritative. |
| **Class E** | **AI / Generated Content** | Listing summaries, search suggestions, AI assistant | Must never silently displace authoritative legal, financial, or system contractual content. |

**CONTENT CLASSIFICATION CONTRACT:** `DEFINED — PASS`

---

## 7. Language Pack Contract

Each compiled language pack must comprise a deterministic, typed bundle with complete metadata:
- Exact Locale Metadata structure
- Release Status indicator
- Provenance & source-language relationship
- Complete translation dictionary matching canonical key paths
- Total canonical key count and coverage percentage
- Fallback count (must be `0` for production promotion)
- Semantic version of translation pack
- Cryptographic hash / timestamp of last validation run
- References to QA test run artifacts
- Formal legal sign-off references for Class C content

**LANGUAGE PACK CONTRACT:** `DEFINED — PASS`

---

## 8. Locale Metadata Contract

The locale metadata definition in `src/lib/glcc/` must specify:
- `tag`: BCP 47 language tag (e.g. `fil-PH`, `ja-JP`)
- `code`: ISO 639-1 language code (e.g. `fil`, `ja`)
- `region`: ISO 3166-1 alpha-2 region component (if applicable, e.g. `PH`, `JP`)
- `displayName`: Canonical name in English
- `nativeName`: Endonym in native script
- `script`: Writing system script identifier
- `direction`: Text reading direction (`ltr` | `rtl`)
- `fallback`: Default fallback locale tag
- `releaseStatus`: Governed status (`REGISTERED`, `TRANSLATION_IN_PROGRESS`, `QA_REQUIRED`, `PRODUCTION_READY`)
- `numberFormat`: Decimal, thousands, and currency grouping standards
- `dateTimeFormat`: Date order, calendar system, and time conventions
- `pluralRules`: Plural categories supported (`one`, `other`, `few`, `many`, etc.)
- `normalization`: Unicode normalization form (`NFC`)

### Prohibited Scope:
Locale metadata must **NEVER** define or influence:
- Payment processor authority
- Transaction charge currency
- Financial ledger settlement rules
- KYC verification requirements
- Legal jurisdiction or dispute arbitration law

**LOCALE METADATA CONTRACT:** `DEFINED — PASS`

---

## 9. Security & Authority Invariants

Switching the active user interface language must **NEVER** alter, compromise, or bypass:
1. **Property/Tenant Country:** Host country remains bound to the property or entity.
2. **Display Currency:** Display currency remains decoupled unless the user explicitly alters it.
3. **Charge Currency:** Checkout transactions are strictly charged in the lease agreement currency.
4. **Payment Authority:** Gateway routing and processing rules are invariant to UI language.
5. **Fee Calculations:** Service fees, platform taxes, and surcharges cannot vary by language.
6. **Financial Ledger:** Double-entry journal entries and settlement amounts are invariant.
7. **Refund & Payout Authority:** Payout destinations and refund authorizations are invariant.
8. **Role-Based Access Control (RBAC):** Permissions and role capabilities remain identical.
9. **KYC Verification:** Document verification standards and compliance status remain invariant.
10. **Jurisdiction & Governing Law:** Legal dispute jurisdiction remains anchored to property/legal contracts.
11. **Authoritative Legal Source:** Translated Class C terms point to authoritative legal versions with clear version references.

**LANGUAGE AUTHORITY INVARIANTS:** `DEFINED — PASS`

---

## 10. SSR / CSR Localization Contract

Every newly onboarded language must adhere to the runtime architecture proven in v1.0.1:
- **Server-Side Resolution:** Server components resolve the language from headers and secure cookies.
- **Client-Side Immediate Switching:** UI updates immediately upon selection without requiring a full page reload.
- **Route Navigation Persistence:** Selected locale persists across internal client navigation.
- **Hard-Refresh Persistence:** Cookie and server state persist the locale across browser hard refreshes (`Ctrl+F5`).
- **Authenticated & Guest Parity:** Works seamlessly for anonymous guests and updates profile preferences for authenticated users.
- **HTML Document Attributes:** Server renders correct `<html lang="..." dir="...">` attributes.
- **Zero Hydration Mismatches:** Client-side hydration produces zero React hydration warnings.
- **Zero Flash of Unlocalized Content (FOUC):** Initial HTML renders in the resolved language.

**SSR/CSR LOCALIZATION CONTRACT:** `DEFINED — PASS`

---

## 11. Language Selector Contract

The language selection interface (`GlobalPreferencesModal`, header switcher) must enforce strict deployment-mode filtering:
- **Production Mode:** Only locales with `releaseStatus === 'PRODUCTION_READY'` are selectable.
- **Trusted QA / Preview Mode:** Locales with `PRODUCTION_READY` and `QA_REQUIRED` are selectable.
- **Non-Selectable Locales:** Locales in `REGISTERED` or `TRANSLATION_IN_PROGRESS` are **NEVER** selectable in any UI selector.
- **Fail-Closed Principle:** Direct manipulation of cookies, query parameters, or local storage cannot force an unapproved locale in Production.

**LANGUAGE SELECTOR CONTRACT:** `DEFINED — PASS`

---

## 12. Legal & Compliance Onboarding Contract

For any Class C content (Terms, Privacy, Disclosures), the onboarding package must include:
- Authoritative English source document identifier and version SHA.
- Translated document identifier and target version number.
- Identified accredited translator or certified legal localization partner.
- Documented legal/compliance approval reference and sign-off date.
- Explicit jurisdictional applicability clause.
- Prohibition against unreviewed machine translation.

**LEGAL/COMPLIANCE ONBOARDING CONTRACT:** `DEFINED — PASS`

---

## 13. QA Evidence Contract

Before any candidate language can be promoted to `PRODUCTION_READY`, evidence must be generated across 20 distinct verification vectors:
1. Automated translation key coverage test (100%).
2. Message-format and ICU syntax validation.
3. Language selector eligibility validation across modes.
4. Live rendered UI text inspection.
5. Immediate client-side re-render without reload.
6. Multi-page route persistence.
7. Browser hard-refresh persistence.
8. Guest user flow localization.
9. Authenticated user flow localization.
10. SSR initial payload inspection.
11. CSR client hydration check.
12. HTML `lang` and `dir` attribute correctness.
13. Zero raw translation key leaks.
14. Zero fallback leaks in localized UI.
15. Payment and financial authority invariance test.
16. RBAC permission invariance test.
17. KYC and verification boundary test.
18. Legal and compliance source provenance check.
19. Preview environment staging acceptance test.
20. Final operational production-readiness review.

**LANGUAGE QA EVIDENCE CONTRACT:** `DEFINED — PASS`

---

## 14. Reusable Onboarding Artifact Set

For each language onboarding campaign under P12, the factory mandates standard governance artifacts:

```text
docs/governance/glcc-v1.1/evidence/p12/
├── [locale]-onboarding.json
├── [locale]-translation-coverage.json
├── [locale]-qa-results.json
├── [locale]-legal-approval.json (if Class C included)
├── [locale]-preview-acceptance.json
└── [locale]-production-readiness.json

docs/governance/glcc-v1.1/
└── RENTIPID_GLCC_V1.1_[LOCALE]_ONBOARDING_REPORT.md
```

**LANGUAGE ONBOARDING ARTIFACT CONTRACT:** `DEFINED — PASS`

---

## 15. Language Entry & Exit Checklist

### Entry Checklist (Permit to Begin Translation):
- [ ] Owner directive authorizing specific candidate language.
- [ ] Locale registered in registry with status `REGISTERED`.
- [ ] Language Owner, Translation Owner, and QA Owner assigned.
- [ ] Canonical key-set version and key count fixed (2,208 keys).
- [ ] Class C legal handling requirements defined.
- [ ] Fallback locale established.
- [ ] Non-regression baseline confirmed.

### Exit Checklist (Permit to Promote to Production):
- [ ] 100% canonical key coverage confirmed.
- [ ] 0 missing keys, 0 raw key leaks, 0 required fallbacks.
- [ ] All message-format and interpolation tests pass.
- [ ] Preview environment acceptance pass.
- [ ] Authenticated and guest flows verified.
- [ ] Security, financial, RBAC, and KYC authority invariance verified.
- [ ] Class C legal review documented and approved.
- [ ] Production readiness review approved.
- [ ] Explicit owner promotion directive issued.

**LANGUAGE ENTRY/EXIT CONTRACT:** `DEFINED — PASS`

---

## 16. Implementation Priority Status

```text
FIRST LANGUAGE IMPLEMENTATION PRIORITY:
NOT YET AUTHORIZED
```

Action P12-B maintains strict language-neutrality. The candidate inventory (`en-US`, `ja-JP`) remains purely observational until a subsequent owner directive authorizes the active implementation order.

---

## 17. Action P12-B Determination

```text
============================================================
P12-B Language Onboarding Contract Status Block
============================================================
WORKSTREAM: P12 / v1.1 Global Expansion Factory
ACTION: P12-B Language Onboarding Contract

[x] BASELINE VERIFIED                           — PASS
[x] LANGUAGE RELEASE STATE MODEL DEFINED       — PASS
[x] TRANSLATION COVERAGE CONTRACT DEFINED       — PASS
[x] CONTENT CLASSIFICATION CONTRACT DEFINED     — PASS
[x] LANGUAGE PACK CONTRACT DEFINED              — PASS
[x] LOCALE METADATA CONTRACT DEFINED            — PASS
[x] LANGUAGE AUTHORITY INVARIANTS DEFINED       — PASS
[x] SSR/CSR LOCALIZATION CONTRACT DEFINED       — PASS
[x] LANGUAGE SELECTOR CONTRACT DEFINED          — PASS
[x] LEGAL/COMPLIANCE ONBOARDING DEFINED         — PASS
[x] LANGUAGE QA EVIDENCE CONTRACT DEFINED       — PASS
[x] ONBOARDING ARTIFACT SET DEFINED             — PASS
[x] ENTRY / EXIT CHECKLIST DEFINED              — PASS
[x] FIRST LANGUAGE PRIORITY PRESERVED (NONE)   — PASS
[x] ZERO RUNTIME SOURCE MODIFICATIONS           — PASS

OVERALL P12-B STATUS: PASS
NEXT PERMITTED ACTION: P12-C TRANSLATION SOURCE/WORKFLOW FACTORY
============================================================
```
