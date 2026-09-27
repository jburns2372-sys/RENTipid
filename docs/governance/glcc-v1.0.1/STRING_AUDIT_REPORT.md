# RENTipid GLCC v1.0.1 — Static String Audit & Localization Coverage Report

**Release Target:** GLCC v1.0.1 (Filipino Localization Corrective Release)  
**Defect Reference:** `GLCC-LOC-001`  
**Execution Date:** 2026-09-27  
**Audited Directory:** `src/app`, `src/components` (All TSX/JSX User Interface Modules)  
**Audit Utility:** `docs/governance/glcc-v1.0.1/audit-strings.cjs`

---

## 1. Audit Executive Summary

| Audit Metric | Value | Notes |
|---|---|---|
| **Total TSX Files Scanned** | **287** | Full coverage of all Next.js App Router and Component files |
| **Migrated Translation Keys (`t(...)` calls)** | **398** | Active i18n keys integrated across headers, modals, admin, and banners |
| **Approved Invariant Exclusions** | **5** | Currency codes (`PHP`, `USD`, `JPY`), brand name (`RENTipid`), symbols (`₱`) |
| **Remaining Non-Core Strings** | **2,129** | Secondary / domain pages scheduled for GLCC v1.1 multilingual expansion |
| **Dictionary Key Parity (`en-PH` vs `fil-PH`)** | **100.00% (445 / 445)** | Zero missing keys, full parity verified by automated Jest suite |
| **Core Target Surface Coverage** | **100%** | Super Admin Dashboard, Global Preferences Modal, Header, Footer, Live Banner |

---

## 2. Approved Invariant Exclusions

Under RENTipid GLCC governance and Financial Authority invariants:
1. **Brand Name:** `RENTipid`, `RENTIPID`, `rentipid` — must never be translated.
2. **Currency Codes & Symbols:** `PHP`, `₱` (settlement currency), `USD`, `$`, `JPY`, `¥`, `EUR`, `€` — canonical financial symbols.
3. **Third-Party Provider Identifiers:** `PayMongo`, `Neon`, `AWS`, `Twilio`, `Google`, `Facebook`, `Next.js`, `Prisma` — brand marks.
4. **Standard Acronyms:** `SOC`, `KYC`, `MFA`, `OTP`, `SMS`, `AI`, `API`, `URL`, `UUID`, `UTC`, `JSON`, `HTML`.
5. **System Punctuation & Dividers:** `·`, `•`, `|`, `/`, `-`, `&`, `+`.

---

## 3. High-Priority Remediated Surfaces (GLCC v1.0.1 Scope)

The primary scope of GLCC v1.0.1 was directly rectifying the verified user defect `GLCC-LOC-001`:
1. **Global Preferences Modal (`GlobalPreferencesModal.tsx` & `glcc-copy.ts`):**
   - Transformed from static English getters to dynamic reactive copy respecting active and draft preview locales (`getGlccCopy(locale)`).
   - Rendered tabs (`Wika`, `Rehiyon`, `Salapi`) and actions (`Ilapat ang mga Kagustuhan`, `Kanselahin`) in natural Filipino.
2. **Super Admin Dashboard (`src/app/dashboard/super-admin/page.tsx`):**
   - 100% hard-coded English copy replaced with `getServerTranslation()` calls under `superAdmin.*`.
   - Admin headers, navigation, financial metrics, and SOC operations now render naturally in Filipino.
3. **Live Payment Pilot Banner (`LivePaymentStatusBanner.tsx`):**
   - Replaced hard-coded English status alerts and descriptions with `t('superAdmin.stage19bc_title')` and `t('superAdmin.active_mock_payments')`.
4. **Root Layout & Navigation (`src/app/layout.tsx`):**
   - Added server-side request locale detection via `getServerTranslation()`.
   - Dynamic `<html lang={locale} dir={direction}>` attribute injection.
   - Wrapped entire application in client `<TranslationProvider>`.
5. **Preference API Synchronization (`/api/me/preferences` & `/api/preferences`):**
   - Injected `Set-Cookie` headers for `rentipid_locale` and signed `rentipid_pref` on all update requests.

---

## 4. Key Parity Verification

```
Test Suite: tests/glcc/localization-parity.test.ts
Total Canonical Keys (en-PH): 445
Total Filipino Keys (fil-PH): 445
Missing Keys in fil-PH: 0
Key Parity: 100.00%
Status: PASSED
```

---

## 5. GLCC v1.1 Multilingual Expansion Backlog

The remaining 2,129 hard-coded strings in secondary views (such as individual lease management sub-screens, host analytics deep pages, and messaging modals) are catalogued for GLCC v1.1. They will be progressively extracted into namespaced bundles during global multilingual rollout.
