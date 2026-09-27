# RENTipid GLCC v1.0.1 — P1 Localization Architecture Audit

**Controlling Document:** `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0`  
**Work Package:** `P1 — LOCALIZATION ARCHITECTURE AUDIT`  
**P0 Governance Baseline:** `b39908a48b5a3d8f287f32953c5d8b21f1faf3c7`  
**Branch:** `fix/glcc-v1.0.1-fil-ph-localization`  
**Date of Audit:** 2026-09-27  
**Module:** Global Legal, Compliance & Currency (GLCC)  
**Status:** **P1 AUDIT COMPLETE — READ-ONLY PASS**

---

## 1. Executive Summary & Baseline Verification

This audit provides a comprehensive, read-only architectural evaluation of the current RENTipid localization infrastructure under the controlling master plan `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0`.

### Baseline Confirmation:
- **Active Branch:** `fix/glcc-v1.0.1-fil-ph-localization`
- **P0 Governance Commit:** `b39908a48b5a3d8f287f32953c5d8b21f1faf3c7` (verified in lineage)
- **Working Tree:** Clean (`nothing to commit, working tree clean`)
- **Runtime Modification Rule:** Zero application, component, dictionary, or test files were modified during this audit (`0 files changed`).

---

## 2. Historical GLCC v1.0 Architecture vs Early v1.0.1 Additions

| Dimension | Frozen GLCC v1.0 Baseline | Early v1.0.1 Additions (Unvalidated) | Architectural Assessment |
|---|---|---|---|
| **Client i18n Consumption** | Direct static import of `t()` singleton from `@/lib/glcc/i18n` | React Context `TranslationProvider` and `useTranslation()` hook in `src/lib/glcc/i18n/context.tsx` | Necessary addition to provide reactive client re-rendering and dynamic active locale tracking. |
| **Server SSR Resolution** | None (hard-coded `en-PH` or `<html lang="en">`) | `getServerLocale()` and `getServerTranslation()` in `src/lib/glcc/i18n/server.ts` | Necessary addition for Next.js App Router Server Component localization. |
| **Cookie Synchronization** | Signed `rentipid_pref` guest cookie (< 256 bytes) | Added `rentipid_locale` lightweight cookie alongside `rentipid_pref` in preference API routes | Enables fast SSR detection without synchronous database queries on every page hit. |
| **Dictionary Status** | `en-PH` canonical; `fil-PH` was fixture (`isFixture: true`) | `fil-PH` promoted to production bundle (`isFixture: false`, 445 keys) | 100% key parity with `en-PH`, but limited to 445 keys. |
| **Modal UI Copy** | Static `GLCC_COPY` getters calling unparameterized `t()` | Dynamic Proxy `getGlccCopy(locale)` | Allows modal tabs and buttons to render in draft preview locale. |
| **Page Migration** | Header, Footer, Auth, Browse partially migrated | `/dashboard/super-admin/page.tsx` and `LivePaymentStatusBanner.tsx` migrated | High-visibility proof, but full application migration remains incomplete. |

---

## 3. Localization File Inventory

```
src/
├── app/
│   ├── api/
│   │   ├── me/preferences/route.ts       (Authenticated preference API & cookie sync)
│   │   └── preferences/route.ts          (Guest preference API & cookie sync)
│   ├── dashboard/super-admin/page.tsx    (Localized Server Component dashboard)
│   └── layout.tsx                        (Root layout: SSR getServerTranslation, TranslationProvider, <html lang/dir>)
├── components/
│   ├── finance/
│   │   └── LivePaymentStatusBanner.tsx   (Localized server-rendered payment status)
│   └── glcc/
│       ├── GlobalPreferencesModal.tsx    (Accessible preferences dialog with tabs/search/preview)
│       ├── GlobalPreferencesTrigger.tsx  (Header trigger button & reload dispatcher)
│       ├── glcc-copy.ts                  (Dynamic proxy translation getters for preferences modal)
│       ├── types.ts                      (UI preference types & API contracts)
│       └── useGlobalPreferences.ts       (Client hook for preference state management)
└── lib/
    └── glcc/
        ├── default-registries.ts         (Default in-memory context: currencies, countries, locales)
        ├── dynamic-translation-service.ts(Dynamic user-generated content translation with SHA-256 hash)
        ├── layout-direction.ts           (Text direction resolution: ltr/rtl)
        ├── preference-reconciler.ts      (Sign-in reconciliation between guest and account preferences)
        ├── preference-resolver.ts        (Strict 5-tier authoritative preference resolver)
        ├── preference-service.ts         (Prisma-backed account preference persistence)
        ├── registry-contracts.ts         (Pure TypeScript contracts for registries)
        ├── server-adapter.ts             (HMAC-SHA256 guest cookie serialization & header extraction)
        └── i18n/
            ├── context.tsx               (React TranslationProvider & useTranslation hook)
            ├── contracts.ts             (445 canonical keys, bundle interfaces, param types)
            ├── engine.ts                 (TranslationEngine class, fallback, parameter interpolation)
            ├── formatters.ts             (Intl.NumberFormat, Intl.DateTimeFormat, Intl.PluralRules)
            ├── index.ts                  (Public module barrel export)
            ├── server.ts                 (Next.js App Router SSR locale and translation resolver)
            ├── validator.ts              (Bundle validation and parity checker)
            └── locales/
                ├── en-PH.ts              (Canonical English base dictionary - 445 keys)
                └── fil-PH.ts             (Filipino dictionary - 445 keys, 100% parity)
```

---

## 4. Authoritative Request Flow Mapping

### A. Guest Request Flow
```
1. Browser HTTP Request (Headers + Cookies)
      ↓
2. Next.js App Router RootLayout (src/app/layout.tsx)
      ↓
3. getServerTranslation() (src/lib/glcc/i18n/server.ts)
   ├── Reads 'rentipid_locale' cookie (direct lightweight tag)
   └── If missing, parses and verifies signed 'rentipid_pref' cookie via server-adapter.ts
   └── If missing/tampered, defaults safely to 'en-PH'
      ↓
4. RootLayout injects <html lang={locale} dir={direction}>
      ↓
5. RootLayout wraps children in <TranslationProvider initialLocale={locale}>
      ↓
6. Server Components invoke defaultTranslationEngine.translate(key, params, locale)
      ↓
7. Rendered HTML sent to browser with zero flash of unlocalized content
      ↓
8. Client Hydration: TranslationProvider initializes with SSR locale
```

### B. Authenticated Request Flow
```
1. Authenticated User Request (Session Cookie + Preference Cookies)
      ↓
2. RootLayout / Server Components invoke getServerTranslation()
      ↓
3. Request cookies provide immediate SSR locale (no blocking database call during HTML stream)
      ↓
4. Client Context initializes with SSR locale
      ↓
5. Background / Modal: useGlobalPreferences fetches GET /api/me/preferences
      ↓
6. /api/me/preferences verifies NextAuth session (getServerSession)
      ↓
7. preference-service.ts reads UserGlobalPreference from Postgres
      ↓
8. preference-reconciler.ts reconciles saved account preference with guest cookies
      ↓
9. Returns EffectiveGlobalPreference with deep-frozen provenance
```

### C. Explicit Language Change Flow
```
1. User clicks Global Preferences Trigger -> Opens GlobalPreferencesModal
      ↓
2. User selects 'fil-PH' in Language Tab -> Draft state updates immediately
      ↓
3. Draft preview renders localized sample date, currency format, and translated modal copy
      ↓
4. User clicks "Ilapat ang mga Kagustuhan" (Apply Preferences)
      ↓
5. useGlobalPreferences sends PATCH to /api/me/preferences (or /api/preferences for guest)
      ↓
6. API validates locale against registries.locales.isSupported()
      ↓
7. API persists preference:
   - Authenticated: upsert into UserGlobalPreference (Prisma) with version increment
   - Guest / Auth: Sets response cookies:
     - Set-Cookie: rentipid_locale=fil-PH; Path=/; SameSite=Lax
     - Set-Cookie: rentipid_pref=<signed HMAC payload>; Path=/; HttpOnly; SameSite=Lax
      ↓
8. API returns 200 OK with EffectiveGlobalPreference
      ↓
9. useGlobalPreferences updates client activeLocale and fires 'rentipid:preference-changed'
      ↓
10. GlobalPreferencesTrigger triggers window.location.reload()
      ↓
11. Full page reloads with fresh cookies -> SSR renders in fil-PH -> Client hydrates in fil-PH
```

---

## 5. Authoritative Component Classification

| Function / Domain | Candidate Authority [File / Function] | Authority Classification | Justification & Architectural Gap |
|---|---|---|---|
| **Locale Registry** | `src/lib/glcc/default-registries.ts` (`locales`) | **PARTIAL** | Defines BCP-47 tags, native names, direction, and fallback, but lacks lifecycle state enum (`PRODUCTION_READY`, `TRANSLATION_IN_PROGRESS`, etc.). |
| **Locale Validation** | `src/lib/glcc/i18n/validator.ts` | **AUTHORITATIVE** | Validates bundle structure, parity, and tag syntax. |
| **Locale Resolution** | `src/lib/glcc/preference-resolver.ts` (`resolveGlobalPreference`) | **AUTHORITATIVE** | Pure 5-tier resolution adhering to Architecture Lock. |
| **Server Locale** | `src/lib/glcc/i18n/server.ts` (`getServerLocale`) | **PARTIAL** | Reads cookies; does not query database if cookies are stripped or blocked. |
| **Client Locale** | `src/lib/glcc/i18n/context.tsx` (`TranslationProvider`, `useTranslation`) | **AUTHORITATIVE** | Standard React Context pattern managing client locale state and synchronization. |
| **Translation Key Contract** | `src/lib/glcc/i18n/contracts.ts` (`GLCC_CANONICAL_KEYS`) | **PARTIAL** | 445 keys present, but 14 major application domains have 0 canonical keys. |
| **Translation Bundles** | `src/lib/glcc/i18n/locales/en-PH.ts` & `fil-PH.ts` | **PARTIAL** | Synchronously bundled in memory; full parity between en/fil, but limited to 445 keys. |
| **Fallback** | `src/lib/glcc/i18n/engine.ts` (`translate`, `deriveSafeFallback`) | **AUTHORITATIVE** | Deterministic 4-step fallback preventing raw dot keys from leaking to UI. |
| **Preference Persistence** | `src/lib/glcc/preference-service.ts` (`saveAccountPreference`) | **AUTHORITATIVE** | Atomic Prisma upsert with optimistic concurrency control. |
| **Cookie Persistence** | `src/lib/glcc/server-adapter.ts` (`serializeGuestPreferenceCookie`) | **AUTHORITATIVE** | HMAC-SHA256 tamper-evident cookie under 256 bytes. |
| **Account Preference** | `src/lib/glcc/preference-service.ts` (`readAccountPreference`) | **AUTHORITATIVE** | Strict session-actor authorization; blocks cross-user reads/writes. |
| **Lang Attribute** | `src/app/layout.tsx` & `src/lib/glcc/i18n/context.tsx` | **AUTHORITATIVE** | Applied during SSR in `<html lang>` and synchronized on client. |
| **Text Direction** | `src/lib/glcc/layout-direction.ts` & `src/lib/glcc/i18n/engine.ts` | **AUTHORITATIVE** | Pure function mapping locale tag to `'ltr' \| 'rtl'`. |
| **Global Preferences UI** | `src/components/glcc/GlobalPreferencesModal.tsx` | **AUTHORITATIVE** | Comprehensive dialog with accessibility compliance and live preview. |

---

## 6. Duplicate Framework & Pattern Audit

1. **Static UI Localization vs Dynamic Content Translation:**
   - `src/lib/glcc/i18n/engine.ts` (`TranslationEngine`): Handles static software UI strings.
   - `src/lib/glcc/dynamic-translation-service.ts` (`DynamicTranslationService`): Handles user-generated content (listing titles, descriptions) with SHA-256 source hashing and sanitization.
   - **Classification:** `LEGITIMATE SEPARATION`. They serve completely distinct concerns and should remain separated.

2. **Server-Side vs Client-Side Translators:**
   - `src/lib/glcc/i18n/server.ts` (`getServerTranslation`): Used in Server Components.
   - `src/lib/glcc/i18n/context.tsx` (`useTranslation`): Used in Client Components.
   - **Classification:** `LEGITIMATE SEPARATION`. Required by Next.js App Router boundary rules.

3. **Direct Static `t()` vs Context `useTranslation().t`:**
   - 19 client components directly import `import { t } from '@/lib/glcc/i18n'`.
   - Direct static `t()` reads from the global singleton, so a client locale switch does NOT re-render those components until the browser reloads.
   - **Classification:** `CONSOLIDATE LATER` (Package P8). Client components should be migrated to `useTranslation().t`.

4. **`GLCC_COPY` Proxy Object:**
   - `src/components/glcc/glcc-copy.ts` proxies properties to `t('globalPreferences.*')`.
   - **Classification:** `REUSE / CONSOLIDATE LATER`. Useful for modal readability, but adds an extra layer over direct `t()` calls.

---

## 7. Locale Registry Audit

### Evaluated Locales in Baseline Context (`default-registries.ts`):
- `en-PH` (English - Philippines, LTR, Default)
- `fil-PH` (Filipino - Philippines, LTR, Fallback: `en-PH`)
- `en-US` (English - United States, LTR)
- `ja-JP` (Japanese, LTR)

### Evaluated Dimensions:
- **BCP-47 Compliance:** PASS (Tags conform to standard syntax `language-region`).
- **Direction Attribute:** PASS (All currently configured as `'ltr'`).
- **Language / Region Separation:** PASS (`language` and `region` properties parsed independently).
- **Lifecycle Status Representation:** **FAIL / P2 GAP**.
  - Current registry only defines `isActive: boolean`.
  - It does NOT distinguish:
    - `REGISTERED`
    - `TRANSLATION_IN_PROGRESS`
    - `QA_REQUIRED`
    - `PRODUCTION_READY`
    - `DISABLED`
  - Consequently, `ja-JP` and `en-US` exist in the registry with `isActive: true` even though their translation bundles are not production-ready.

---

## 8. Country / Language / Currency Separation Audit

Under the controlling Master Plan and Architecture Lock:
- Selecting language **NEVER** mutates country.
- Selecting language **NEVER** mutates display currency.
- Selecting language **NEVER** mutates charge currency (strictly locked to PHP).
- Selecting language **NEVER** mutates authorization, RBAC, payment authority, or legal jurisdiction.

### Formal Audit Results:
- **LANGUAGE / COUNTRY SEPARATION:** **PASS**
- **LANGUAGE / DISPLAY CURRENCY SEPARATION:** **PASS**
- **LANGUAGE / CHARGE CURRENCY SEPARATION:** **PASS**
- **LANGUAGE / AUTHORIZATION SEPARATION:** **PASS**

All four axes are strictly decoupled in `src/lib/glcc/preference-resolver.ts` and guarded by `assertPreferenceInvariants()`.

---

## 9. Server-Side Localization Audit

- **Precedence:** `rentipid_locale` cookie (direct) -> `rentipid_pref` cookie (signed HMAC) -> default `'en-PH'`.
- **SSR HTML Output:** `<html lang={locale} dir={direction}>` is output directly in the initial HTML stream from `src/app/layout.tsx`.
- **Pre-Hydration Rendering:** Server components using `getServerTranslation()` (e.g. `/dashboard/super-admin/page.tsx` and `LivePaymentStatusBanner.tsx`) render 100% in the selected language before any client JavaScript executes.
- **Identified Gap (`ARCH-006`):**
  - `getServerLocale()` does not check `getServerSession()` to look up `UserGlobalPreference` in the database when cookies are absent or blocked.

---

## 10. Client-Side Localization Audit

- **Root Provider:** `<TranslationProvider initialLocale={locale}>` in `src/app/layout.tsx`.
- **State Synchronization:**
  - Updates `document.documentElement.lang` and `document.documentElement.dir`.
  - Synchronizes `document.cookie` with `rentipid_locale`.
  - Listens for window event `rentipid:preference-applied`.
- **Identified Gap (`ARCH-005` & `ARCH-007`):**
  - Direct `t()` usage in 19 client components bypasses React reactivity.
  - Applying preferences currently relies on `window.location.reload()` to force re-render.

---

## 11. Translation Contract Audit

- **Canonical Key Count:** 445 keys
- **en-PH Key Count:** 445 keys
- **fil-PH Key Count:** 445 keys
- **Dictionary Key Parity:** **100.00% (445 / 445)**

### 25 Application Domain Namespace Audit:

| # | Domain Namespace | Key Count in Contracts | Classification |
|---|---|---|---|
| 1 | `common` | 16 | **PARTIAL** |
| 2 | `navigation` | 15 | **PARTIAL** |
| 3 | `auth` | 55 | **PARTIAL** |
| 4 | `preferences` (incl. `globalPreferences`) | 53 | **COMPLETE** |
| 5 | `marketplace` | 18 | **PARTIAL** |
| 6 | `listing` (incl. provider wizard) | 194 | **PARTIAL** |
| 7 | `booking` | 30 | **PARTIAL** |
| 8 | `checkout` | 0 | **ABSENT** |
| 9 | `account` | 14 | **PARTIAL** |
| 10 | `provider` | 4 | **PARTIAL** |
| 11 | `renter` | 24 | **PARTIAL** |
| 12 | `partnerHub` | 0 | **ABSENT** |
| 13 | `messages` | 0 | **ABSENT** |
| 14 | `notifications` | 0 | **ABSENT** |
| 15 | `reviews` | 0 | **ABSENT** |
| 16 | `kyc` | 0 | **ABSENT** |
| 17 | `insurance` | 0 | **ABSENT** |
| 18 | `support` | 0 | **ABSENT** |
| 19 | `trustSafety` | 0 | **ABSENT** |
| 20 | `legalCompliance` | 0 | **ABSENT** |
| 21 | `admin` | 0 | **ABSENT** |
| 22 | `superAdmin` | 18 | **PARTIAL** |
| 23 | `soc` | 0 | **ABSENT** |
| 24 | `errors` | 0 | **ABSENT** |
| 25 | `validation` | 0 | **ABSENT** |

> **Audit Finding:** While dictionary parity is 100% across the existing 445 keys, **14 out of 25 major application domains are completely absent** from the canonical contract.

---

## 12. Hard-Coded String Architecture Audit

- **Total TSX Files Scanned:** 287
- **Active `t(...)` Invocations:** 398
- **Remaining Hard-Coded User-Visible Strings:** 2,129
- **Approved Invariant Exclusions:** 5 (`RENTipid`, `PHP`, `₱`, `$`, `PayMongo`)

### Distinction Between Coverage Scopes:
1. **Core Target Coverage (Super Admin, Global Preferences Modal, Header, Footer):** **~90%** (Remediated as proof of concept).
2. **Full Application Coverage:** **~15.7%** (398 out of ~2,532 total strings across 287 TSX files).

---

## 13. Early Implementation Mapping to Master Plan Packages

| File Path | Nature | Assigned Package | Status |
|---|---|---|---|
| `src/lib/glcc/default-registries.ts` | Locale Registry | **P2 — Locale Registry** | IMPLEMENTATION EXISTS — NOT YET MASTER-PLAN VALIDATED |
| `src/lib/glcc/preference-resolver.ts` | Locale Resolver | **P3 — Authoritative Locale Resolver** | IMPLEMENTATION EXISTS — NOT YET MASTER-PLAN VALIDATED |
| `src/lib/glcc/i18n/server.ts` | Server Locale Resolver | **P3 — Authoritative Locale Resolver** | IMPLEMENTATION EXISTS — NOT YET MASTER-PLAN VALIDATED |
| `src/app/api/me/preferences/route.ts`| Cookie Sync & API | **P3 — Authoritative Locale Resolver** | IMPLEMENTATION EXISTS — NOT YET MASTER-PLAN VALIDATED |
| `src/lib/glcc/i18n/contracts.ts` | Canonical Key Contracts | **P4 — Translation Contract** | IMPLEMENTATION EXISTS — NOT YET MASTER-PLAN VALIDATED |
| `src/lib/glcc/i18n/locales/en-PH.ts` | English Base Dictionary | **P4 — Translation Contract** | IMPLEMENTATION EXISTS — NOT YET MASTER-PLAN VALIDATED |
| `src/app/dashboard/super-admin/page.tsx`| Admin Page Migration | **P5 — Hard-coded String Migration** | IMPLEMENTATION EXISTS — NOT YET MASTER-PLAN VALIDATED |
| `src/components/finance/LivePaymentStatusBanner.tsx`| Live Banner Migration | **P5 — Hard-coded String Migration** | IMPLEMENTATION EXISTS — NOT YET MASTER-PLAN VALIDATED |
| `src/lib/glcc/i18n/locales/fil-PH.ts` | Filipino Dictionary | **P6 — fil-PH Proof Pack** | IMPLEMENTATION EXISTS — NOT YET MASTER-PLAN VALIDATED |
| `src/components/glcc/GlobalPreferencesModal.tsx`| Modal Component | **P7 — Language Selector UX** | IMPLEMENTATION EXISTS — NOT YET MASTER-PLAN VALIDATED |
| `src/components/glcc/GlobalPreferencesTrigger.tsx`| Trigger Component | **P7 — Language Selector UX** | IMPLEMENTATION EXISTS — NOT YET MASTER-PLAN VALIDATED |
| `src/components/glcc/useGlobalPreferences.ts`| Preferences Hook | **P7 — Language Selector UX** | IMPLEMENTATION EXISTS — NOT YET MASTER-PLAN VALIDATED |
| `src/components/glcc/glcc-copy.ts` | Copy Proxy | **P7 — Language Selector UX** | IMPLEMENTATION EXISTS — NOT YET MASTER-PLAN VALIDATED |
| `src/lib/glcc/i18n/context.tsx` | Client React Context | **P8 — SSR/CSR Live Switching** | IMPLEMENTATION EXISTS — NOT YET MASTER-PLAN VALIDATED |
| `src/app/layout.tsx` | Root SSR Layout Injection| **P8 — SSR/CSR Live Switching** | IMPLEMENTATION EXISTS — NOT YET MASTER-PLAN VALIDATED |
| `tests/glcc/localization-parity.test.ts`| Parity Test Suite | **P9 — Testing & CI** | IMPLEMENTATION EXISTS — NOT YET MASTER-PLAN VALIDATED |
| `tests/glcc/hardcoded-string-guard.test.ts`| Hardcoded String Guard | **P9 — Testing & CI** | IMPLEMENTATION EXISTS — NOT YET MASTER-PLAN VALIDATED |
| `tests/glcc/server-client-i18n.test.ts` | SSR/CSR Integration Test | **P9 — Testing & CI** | IMPLEMENTATION EXISTS — NOT YET MASTER-PLAN VALIDATED |

---

## 14. Global Scale Readiness Audit (15+ Locales)

- **N-Language Scalability:** **PARTIAL** (Static synchronous loading creates bundle bloat if 15+ dictionaries are imported simultaneously).
- **RTL Readiness:** **PASS** (Infrastructure in place via `dir={direction}` and `layout-direction.ts`).
- **Dictionary Lazy-Loading:** **FAIL** (Static TypeScript objects imported at boot; dynamic chunk loading not yet implemented).
- **Text Expansion Readiness:** **PARTIAL** (Flex layouts accommodate growth, but some fixed-width buttons require testing).
- **Locale-Aware Formatting:** **PASS** (Standards-based `Intl` utilities in `formatters.ts`).

---

## 15. Agoda-like Behavior Gap Analysis

| Stage | Target Behavior | Observed Implementation State | Status |
|---|---|---|---|
| **1. SELECT LANGUAGE** | User selects language in dialog | Modal lists active locales with native names | **IMPLEMENTED** |
| **2. SAVE** | Preference persists to database and cookie | PATCH persists to Postgres and issues cookies | **IMPLEMENTED** |
| **3. ACTUAL APP LANGUAGE CHANGES** | Rendered UI changes to selected language | Core pages change; non-migrated pages stay English | **PARTIAL** |
| **4. SERVER + CLIENT CONSISTENT** | SSR and CSR render identical language | Consistent when cookies present; fallback when absent | **PARTIAL** |
| **5. RELOAD PERSISTS** | Browser reload keeps selected language | `rentipid_locale` cookie re-hydrates language on reload | **IMPLEMENTED** |
| **6. ROUTE NAVIGATION PERSISTS** | Navigating between routes retains language | Context state and cookie preserve locale across routes | **IMPLEMENTED** |

---

## 16. P1 Gap Register Summary

Detailed specifications are recorded in [p1-gap-register.json](file:///c:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid/docs/governance/glcc-v1.0.1/evidence/p1/p1-gap-register.json):

1. **ARCH-001 (Severity: HIGH):** Locale Registry lacks lifecycle status states (`PRODUCTION_READY`, `TRANSLATION_IN_PROGRESS`, etc.). -> Responsible: **P2**.
2. **ARCH-002 (Severity: HIGH):** Major application domain namespaces absent from canonical contracts (14 of 25 domains missing). -> Responsible: **P4**.
3. **ARCH-003 (Severity: HIGH):** 2,129 user-visible UI strings remain hard-coded in English across 287 TSX files. -> Responsible: **P5**.
4. **ARCH-004 (Severity: MEDIUM):** Dictionaries imported synchronously at boot without lazy loading. -> Responsible: **P4 / P12**.
5. **ARCH-005 (Severity: MEDIUM):** Direct static `t()` calls in 19 client components bypass React reactivity. -> Responsible: **P8**.
6. **ARCH-006 (Severity: MEDIUM):** `getServerLocale()` lacks fallback database lookup when cookies are missing. -> Responsible: **P3**.
7. **ARCH-007 (Severity: LOW):** Language switch relies on `window.location.reload()` for full hydration. -> Responsible: **P7 / P8**.

---

## 17. Lifecycle Gate Status & Execution Boundary

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

- **P1 Audit Status:** **PASS**
- **Next Permitted Work Package:** **P2 — LOCALE REGISTRY**
- **Boundary Rule:** Execution halts at P1. Do NOT start P2 without explicit authorization.
