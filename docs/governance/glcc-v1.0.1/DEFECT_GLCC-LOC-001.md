# RENTipid GLCC v1.0.1 — Corrective Defect Record
**Defect ID:** GLCC-LOC-001  
**Title:** `fil-PH` preference persists but visible application UI remains partially or fully in English  
**Module:** Global Legal, Compliance & Currency (GLCC)  
**Target Release:** GLCC v1.0.1 (Corrective Release)  
**Severity:** HIGH FUNCTIONAL DEFECT (Multilingual Requirement Violation)  
**Discovered Date:** 2026-09-27  
**Reporter:** Project Owner  
**Executor:** Antigravity (Pair Programming Assistant)  
**Base Commit (Frozen v1.0):** `6ae374cf8558fe32450b8f4d0bc03603a1185006`  
**Corrective Branch:** `fix/glcc-v1.0.1-fil-ph-localization`  

---

## 1. Defect Classification

| Dimension | Observed State | Classification |
|---|---|---|
| **Preference Storage** | Database `UserGlobalPreference` and guest cookie `rentipid_pref` persist `fil-PH` correctly | **WORKING** |
| **Language Switching** | Trigger and modal accept `fil-PH` selection and trigger reload/refresh | **PARTIALLY WORKING** |
| **Actual UI Translation** | Pages (e.g. `/dashboard/super-admin`) and modal itself remain visibly English | **DEFECTIVE / INCOMPLETE** |

---

## 2. Verified Root Causes

Detailed investigation of the codebase uncovered five interrelated technical root causes:

1. **Absence of Client Translation Provider / Context:**
   - Client components throughout the repository (`Header`, `Footer`, `login`, `register`, `browse`, etc.) import `t` from `@/lib/glcc/i18n`.
   - `t(key)` was called without a `requestedLocale` parameter.
   - The default engine defaulted to `this.defaultLocale = 'en-PH'`, causing 100% of unparameterized `t()` calls to resolve strictly in English.
   - There was no `TranslationProvider` or React Context in `src/app/layout.tsx` to supply the active locale.

2. **Absence of Server-Side Request Locale Resolution:**
   - Server Components in Next.js App Router (`layout.tsx`, `page.tsx`) had no mechanism to read the incoming `rentipid_pref` cookie or session preference during SSR.
   - `src/app/layout.tsx` hardcoded `<html lang="en">` with no dynamic locale or text direction attributes.

3. **Self-Localization Defect in Global Preferences Modal (`glcc-copy.ts`):**
   - `GlobalPreferencesModal.tsx` retrieved copy through `GLCC_COPY` (`src/components/glcc/glcc-copy.ts`).
   - Every getter in `GLCC_COPY` invoked `t('globalPreferences.*')` without passing the active or draft locale.
   - As a result, the modal tabs (`Region`, `Language`, `Currency`) and action buttons (`Apply Preferences`, `Cancel`) always evaluated to English.

4. **Missing Key Coverage & Hard-Coded English Across Dashboards:**
   - Administrative and operational routes (including `/dashboard/super-admin/page.tsx`) were built with 100% hard-coded English JSX text and zero translation keys.
   - A static string audit revealed **2,142 hard-coded user-visible strings** across 287 TSX files.

5. **Disconnection Between `/api/me/preferences` and Cookie Sync:**
   - When an authenticated user updated their preference, `/api/me/preferences` persisted to the Postgres database but did NOT set a response cookie.
   - Consequently, subsequent page loads could not retrieve the authenticated user's preferred locale from HTTP cookies without a full session database query.

---

## 3. Remediation Plan (GLCC v1.0.1)

1. **Centralized Translation Provider & Hook (`TranslationProvider`, `useTranslation`):**
   - Provide a React Context wrapping the application tree in `src/app/layout.tsx`.
   - Expose `useTranslation()` returning `{ t, locale, setLocale, direction }`.
   - Ensure `t(key)` automatically uses the active locale from context.
2. **Server-Side Request Locale Resolver (`getServerLocale`):**
   - Read request cookies (`rentipid_pref` and `rentipid_locale`) in server components and root layout.
   - Dynamically set `<html lang={locale} dir={direction}>`.
3. **Cookie Synchronization on Authenticated Update:**
   - Update `/api/me/preferences` to set the signed `rentipid_pref` and lightweight `rentipid_locale` cookies on `PATCH`/`PUT`.
4. **Self-Localize Global Preferences Modal:**
   - Pass the active/draft locale to modal copy so that when `fil-PH` is active (or being previewed), all modal tabs, labels, and buttons render in natural Filipino.
5. **Localize Super Admin Dashboard (`/dashboard/super-admin`):**
   - Define canonical keys under `superAdmin.*`.
   - Provide 100% natural Filipino translations in `fil-PH`.
   - Migrate `/dashboard/super-admin/page.tsx` to use localized copy.
6. **Promote Filipino Bundle to Production-Ready:**
   - Remove `isFixture: true` from `fil-PH`.
   - Provide 100% key parity with `en-PH` for all required UI strings.
7. **Automated Parity & Static String Tests:**
   - Implement automated dictionary parity tests (100% coverage requirement).
   - Implement static hard-coded string guard tests.
8. **Universal Promotion Lifecycle:**
   - Progress through G1 (Code Complete), G2 (Local Functional), G3 (Local DB Migrated — verified no change), G4 (Local Data Seeded — verified no change), and G5 (Local Acceptance Pass — Local Checkpoint Frozen).
