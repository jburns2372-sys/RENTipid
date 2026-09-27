# RENTipid GLCC v1.0.1 — P2 Locale Registry Report

**Controlling Document:** `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0`  
**Work Package:** `P2 — LOCALE REGISTRY`  
**P1 Baseline Commit:** `b4c2e446e8f82569b58ca87c4ace9d94b7c8339a`  
**Branch:** `fix/glcc-v1.0.1-fil-ph-localization`  
**Date:** 2026-09-27  
**Module:** Global Legal, Compliance & Currency (GLCC)  
**Status:** **P2 PASS — AUTHORITATIVE LOCALE REGISTRY ESTABLISHED**

---

## 1. Executive Summary & Objective

Under `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0` (Section 4, Page 7), a locale **must NOT become selectable in Production merely because its code exists in a database or its dictionary exists in source code**. 

Work Package P2 establishes the authoritative, scalable Locale Registry and governance lifecycle model required for an Agoda-like N-language application. It enforces strict separation between:
1. `REGISTERED`: Locale metadata recognized by the platform.
2. `TRANSLATION_IN_PROGRESS`: Translation keys under active extraction and dictionary building.
3. `QA_REQUIRED`: Translation dictionary complete for test surfaces, but full-application rendering and zero-fallback verification pending.
4. `PRODUCTION_READY`: Formally accepted across all required application surfaces with verified SSR/CSR rendering, zero English fallbacks, and legal classification.
5. `DISABLED`: Administratively isolated or emergency-disabled.

---

## 2. Baseline Verification

- **Branch:** `fix/glcc-v1.0.1-fil-ph-localization`
- **P1 Lineage Commit:** `b4c2e446e8f82569b58ca87c4ace9d94b7c8339a` (Verified)
- **Working Tree:** Clean prior to P2 execution.
- **P2 Database Impact:** **NONE** (Locale Registry remains code/config-based in memory; no migrations required).

---

## 3. Authoritative Locale Record Definition

The Locale Registry contracts in `src/lib/glcc/registry-contracts.ts` and default context in `src/lib/glcc/default-registries.ts` were normalized to support the required Master Plan metadata while maintaining 100% backward compatibility with existing interfaces:

```typescript
export type LocaleReleaseStatus =
  | 'REGISTERED'
  | 'TRANSLATION_IN_PROGRESS'
  | 'QA_REQUIRED'
  | 'PRODUCTION_READY'
  | 'DISABLED';

export type LegalTranslationStatus =
  | 'NONE'
  | 'REVIEW_REQUIRED'
  | 'APPROVED';

export interface LocaleMetadata {
  readonly tag: string;                     // Canonical BCP 47 (e.g. 'en-PH', 'fil-PH', 'ja-JP')
  readonly localeCode?: string;             // Standard alias for tag
  readonly localeTag?: string;              // Standard alias for tag
  readonly language: string;               // ISO 639-1/2 language code (e.g. 'en', 'fil', 'ja')
  readonly languageCode?: string;           // Standard alias for language
  readonly region?: string;                 // ISO 3166-1 alpha-2 region (e.g. 'PH', 'US', 'JP')
  readonly regionCode?: string;             // Standard alias for region
  readonly script?: string;                 // ISO 15924 script (e.g. 'Latn', 'Jpan', 'Arab')
  readonly direction: 'ltr' | 'rtl';        // Layout text direction
  readonly name: string;                    // Administrative English display name
  readonly englishName?: string;            // Standard alias for name
  readonly nativeName: string;              // Endonym displayed in the language itself
  readonly isActive: boolean;               // General registry presence
  readonly enabled?: boolean;               // Standard alias for isActive
  readonly releaseStatus?: LocaleReleaseStatus; // Governed lifecycle state
  readonly status?: LocaleReleaseStatus;    // Standard alias for releaseStatus
  readonly fallbackTag?: string;            // Approved fallback in same family or base
  readonly fallbackLocale?: string;         // Standard alias for fallbackTag
  readonly translationVersion?: string;     // Versioned dictionary baseline
  readonly bundleVersion?: string;          // Standard alias for translationVersion
  readonly legalTranslationStatus?: LegalTranslationStatus;
  readonly featureFlag?: string;            // Optional rollout feature-flag identifier
  readonly effectiveFrom?: string;          // ISO-8601 validity window
  readonly effectiveTo?: string;            // ISO-8601 validity window
}
```

---

## 4. Production Selectability Rule

The authoritative rule is formally codified in `isLocaleProductionSelectable()`:

```typescript
export function isLocaleProductionSelectable(locale: LocaleMetadata | null | undefined): boolean {
  if (!locale) return false;
  const isEnabled = locale.enabled ?? locale.isActive;
  const status = locale.releaseStatus ?? locale.status ?? 'REGISTERED';
  return isEnabled === true && status === 'PRODUCTION_READY';
}
```

**Governance Mandate:** A locale with status `REGISTERED`, `TRANSLATION_IN_PROGRESS`, `QA_REQUIRED`, or `DISABLED` is **NOT** selectable in production user-facing flows.

---

## 5. Current Locale Classifications (Current Evidence)

In accordance with Section 6 of the P2 directive, all currently registered locales have been classified truthfully:

| Locale Tag | Native Name | English Name | Status | Enabled | Production Selectable | Justification under Master Plan |
|---|---|---|---|---|---|---|
| **`en-PH`** | English | English (Philippines) | **`PRODUCTION_READY`** | `true` | **YES** | Canonical platform default; in active operation across entire application. |
| **`fil-PH`** | Wikang Filipino | Filipino (Philippines) | **`QA_REQUIRED`** | `true` | **NO** | 445 dictionary keys exist and proof surfaces render Filipino, but P1 audit demonstrated only ~15.7% full-application translation coverage (14 of 25 domains absent). Under MIP-001 Page 7, cannot be declared `PRODUCTION_READY` until full-application acceptance. |
| **`en-US`** | English (US) | English (United States) | **`TRANSLATION_IN_PROGRESS`** | `true` | **NO** | Market variant registered in test contexts; full-application acceptance has not occurred. |
| **`ja-JP`** | 日本語 | Japanese | **`REGISTERED`** | `true` | **NO** | Future Wave 1 expansion candidate; metadata registered for readiness. Content deferred per MIP-001 Section 15 Critical Sequencing Rule. |

---

## 6. Standards-Based Validation & Robustness

1. **BCP-47 Tag Validation:**
   - Implemented `validateBcp47LocaleTag(tag)` checking primary language (2-3 letters), optional script (4 letters), optional region (2 letters / 3 digits), and optional variants.
   - Rejects POSIX underscores (`en_PH`), empty strings, malformed delimiters (`invalid--tag`), and non-standard codes.

2. **Deterministic Registry Constraints:**
   - **Duplicate Tag Rejection:** Throw on duplicate `localeTag`.
   - **Direction Validation:** Strictly `'ltr' | 'rtl'`.
   - **Required Names:** Both `nativeName` and `englishName`/`name` must be non-empty strings.
   - **Contradictory Configuration Guard:** Throws if a locale is marked `PRODUCTION_READY` with `isActive: false` or `enabled: false`.
   - **Circular Fallback Detection:** Acyclic graph validation traverses fallback chains; throws on self-referential (`tag === fallbackTag`) or circular (`A -> B -> A`) chains.

3. **Language, Country, Currency & Payment Independence:**
   - Locale Registry contains **ZERO** financial, legal, or jurisdictional authority.
   - Tested and verified: selecting `fil-PH` or `ja-JP` never mutates country (`PH`), display currency (`PHP`), charge currency (`PHP`), or payment authorization.

---

## 7. Authoritative Registry Query API

Consumers query the registry through normalized methods on `LocaleRegistry`:

- `getLocale(localeTag)`: Retrieve locale metadata record.
- `getEnabledLocales(asOf)`: List all enabled locales within effective window.
- `getProductionReadyLocales(asOf)`: List only `PRODUCTION_READY` locales (returns `['en-PH']`).
- `isSupportedLocale(localeTag)`: Check if registered and active.
- `isLocaleProductionSelectable(localeTag, asOf)`: Returns boolean based on production selectability rule.
- `resolveFallbackLocale(localeTag)`: Resolves explicit fallback tag or language family base.

---

## 8. Test Evidence & Quality Checks

- **Focused Test Suite:** `tests/glcc/p2-locale-registry.test.ts`
  - Total Tests: **22 passed, 22 total (100% pass)**
  - Coverage: BCP-47 validation, duplicate rejection, direction, fallback cycles, production selectability, locale classification, native names, financial independence, no auto-promotion.
- **Full GLCC Test Suite:** **31 of 31 test suites passed, 473 of 473 tests passed** (`npx jest tests/glcc/ --runInBand`).
- **TypeScript Typecheck:** `npm run typecheck` passed with **0 errors**.
- **ESLint:** Clean pass on all changed files with **0 errors and 0 warnings**.
- **Prisma Schema Validation:** `npx prisma validate` passed with **0 errors**.

---

## 9. Early Implementation Reconciliation

- **`src/lib/glcc/registry-contracts.ts`**: **VALIDATED WITH P2 LIFECYCLE EXTENSIONS**.
- **`src/lib/glcc/default-registries.ts`**: **VALIDATED WITH P2 LIFECYCLE EXTENSIONS**.

---

## 10. Universal Promotion Lifecycle Status

```
G1 CODE COMPLETE:                     NOT PROMOTED
G2 LOCAL FUNCTIONAL:                  NOT PROMOTED
G3 LOCAL DATABASE MIGRATED:           NOT PROMOTED
G4 LOCAL REQUIRED DATA SEEDED/SYNCED: NOT PROMOTED
G5 LOCAL ACCEPTANCE PASS:             NOT PROMOTED
G6 PREVIEW MIGRATED:                  NOT PROMOTED
G7 PREVIEW ACCEPTANCE PASS:           NOT PROMOTED
G8 PRODUCTION-READY:                  NOT PROMOTED
G9 PRODUCTION DEPLOYMENT:             NOT PROMOTED
G10 COMPLETED:                        NOT PROMOTED
G11 ACCEPTED:                         NOT PROMOTED
G12 CLOSED:                           NOT PROMOTED
G13 VERSION FROZEN:                   NOT PROMOTED
```

- **P2 Work Package Status:** **PASS**
- **Next Permitted Work Package:** **P3 — AUTHORITATIVE LOCALE RESOLVER**
- **Boundary Stop:** Work is halted at P2. P3 has not been started.
