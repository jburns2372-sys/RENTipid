# RENTipid GLCC P11 — Gate G2 Local Functional Revalidation Report
## Corrected Candidate: `9f5db74f25600e17f41bf3486f7659c95f0c7587`

- **Controlling Document:** `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0`
- **Work Package:** `P11 — v1.0.1 PREVIEW/PRODUCTION`
- **Lifecycle Gate:** `G2 LOCAL FUNCTIONAL — CORRECTED CANDIDATE REVALIDATION`
- **Revalidation Status:** `PROMOTED`
- **Revalidation Date:** `2026-10-02`
- **Branch:** `fix/glcc-v1.0.1-fil-ph-localization`
- **G1 Revalidation Commit Baseline:** `758df5068e9d95de0330c87f6f2d7dc1e260541b`
- **Corrected Runtime Candidate SHA:** `9f5db74f25600e17f41bf3486f7659c95f0c7587`
- **Evidence Reference:** [`docs/governance/glcc-v1.0.1/evidence/p11/g2-local-functional-revalidation.json`](file:///c:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid/docs/governance/glcc-v1.0.1/evidence/p11/g2-local-functional-revalidation.json)

---

## 1. Executive Summary & Gate Purpose

Under the RENTipid Universal Implementation, Promotion & Closure Standard, Gate G2 proves that the corrected runtime candidate (`9f5db74f25600e17f41bf3486f7659c95f0c7587`) is functionally valid in the LOCAL development environment, with rigorous headless real-browser verification of the G7 corrective behavior that previously failed in Preview.

This revalidation verifies:
1. **GLCC-LOC-002 Remediation:** The Language Selector in trusted Preview QA mode now correctly marks `fil-PH` as selectable, communicates `resolverMode: QA`, immediately rerenders UI components on Apply without page reload, and maintains persistence across SSR route transitions and hard refreshes.
2. **Production Fail-Closed Policy:** In explicit Production-policy simulation, `fil-PH`, `en-US`, and `ja-JP` remain fail-closed and strictly blocked (`Unavailable` / `Coming Soon`), and client query/cookie injection attempts are neutralized.
3. **Real-Browser Matrix Coverage:** A complete 26-scenario automated headless browser matrix was executed with 26 / 26 PASS.
4. **Zero Regressions:** 0 React hydration mismatches, 0 flashes of English content on `fil-PH`, 0 raw translation key leaks, and 0 missing translation fallbacks.

---

## 2. Local Application Baseline & Start Verification

| Check | Specification / Command | Result | Status |
|---|---|---|:---:|
| **Server Engine** | Next.js 16.2.12 (Turbopack) | Ready in 2.0s on `http://localhost:3000` | **PASS** |
| **Local URL Reachable** | `GET http://localhost:3000/api/health` | HTTP 200 `{"status":"ready","database":"connected"}` | **PASS** |
| **Startup Fatal Errors** | Next.js console & exception logs | 0 unhandled exceptions, clean execution stream | **PASS** |
| **Database Isolation** | `127.0.0.1:5432/rentipid_local_dev` | Local development database only (0 Production/Preview DB access) | **PASS** |

---

## 3. Trusted QA Policy Local Simulation

- **Simulation Mechanism:** Launching with `NEXT_PUBLIC_VERCEL_ENV="preview"`, `NEXT_PUBLIC_GLCC_PREVIEW_QA_ENABLED="true"`, and `GLCC_ENABLE_LOCAL_QA_MODE="true"`.
- **Server Capability Inspection:** `GET /api/preferences` returns `capabilities.resolverMode: "QA"`.
- **Injection Attack Resistance:** Under production runtime configuration (`NODE_ENV === 'production'` or `VERCEL_ENV === 'production'`), neither `?glcc_qa=true`, nor cookies (`glcc_qa=true`, `rentipid_qa_mode=true`), nor client state can switch resolver mode out of `PRODUCTION`.

---

## 4. Headless Browser Verification Matrix (26 Scenarios)

The automated Playwright browser test suite verified 26 comprehensive scenarios with zero failures:

| # | Scenario Name | Route / Surface | Evaluated Behavior & Assertion | Status |
|---|---|---|---|:---:|
| **1** | en-PH landing | `/` | Default `<html lang="en-PH" dir="ltr">`, English copy rendered | **PASS** |
| **2** | trusted-QA fil-PH selector available | `/` (Modal) | `fil-PH` selectable, no `Unavailable` badge, `aria-disabled="false"` | **PASS** |
| **3** | fil-PH Apply | `/` (Modal) | Apply button persists selection; modal detaches cleanly | **PASS** |
| **4** | immediate rerender | `/` | Immediate CSR update to Filipino without page reload | **PASS** |
| **5** | fil-PH navigation | `/help` | Client-side transition preserves `fil-PH`; `<html lang="fil-PH">` | **PASS** |
| **6** | fil-PH hard refresh | `/help` | SSR reload emits `<html lang="fil-PH">`; 0 hydration warnings | **PASS** |
| **7** | reverse en-PH switch | `/help` -> `/terms` | Live switch back to `en-PH`; immediate rerender; next route persists | **PASS** |
| **8** | Cancel | `/terms` (Modal) | Selecting `fil-PH` and clicking Cancel leaves language at `en-PH` | **PASS** |
| **9** | close without Apply | `/terms` (Modal) | Closing dialog without applying leaves language at `en-PH` | **PASS** |
| **10** | guest persistence | `/terms` | Tamper-evident `rentipid_pref` and `rentipid_locale` cookies set | **PASS** |
| **11** | authenticated flow | `/login` -> `/dashboard/renter` | Authenticated session with test account `renter@rentipid.local` | **PASS** |
| **12** | login/logout | `/api/auth/signout` | Clean logout; post-logout resolver preserves safe guest preference | **PASS** |
| **13** | browse/search | `/browse` | Browse interface loads HTTP 200 with active locale | **PASS** |
| **14** | listing/detail | `/listing/cmu34c46n001jvcrsa6bm75pi` | Listing detail loads HTTP 200 with active locale | **PASS** |
| **15** | renter surface | `/dashboard/renter` | Renter dashboard loads HTTP 200 | **PASS** |
| **16** | provider surface | `/dashboard/provider` | Provider dashboard loads HTTP 200 | **PASS** |
| **17** | Global Preferences | `/` (Modal) | All three tabs (Country, Language, Currency) render correctly | **PASS** |
| **18** | support/help | `/help` | Support and FAQ content render HTTP 200 | **PASS** |
| **19** | legal/compliance | `/terms` | Authoritative legal text and regulatory disclosures intact | **PASS** |
| **20** | admin/Super Admin where authorized | `/admin` | Administrative security boundary enforced | **PASS** |
| **21** | Production fil-PH blocked | `/help` (Modal) | Under Production policy, `fil-PH` displays `Unavailable` and disabled | **PASS** |
| **22** | en-US blocked | Modal | `en-US` (`TRANSLATION_IN_PROGRESS`) displays `Coming Soon` and disabled | **PASS** |
| **23** | ja-JP blocked | Modal | `ja-JP` (`REGISTERED`) displays `Coming Soon` and disabled | **PASS** |
| **24** | query QA injection blocked | Resolver | Under Production policy, `?glcc_qa=true` resolves to `en-PH` | **PASS** |
| **25** | cookie QA injection blocked | Resolver | Under Production policy, `glcc_qa=true` cookie resolves to `en-PH` | **PASS** |
| **26** | country/currency/payment/RBAC | `/api/preferences` | Country (`PH`), display (`PHP`), charge (`PHP`), RBAC unchanged | **PASS** |

**Matrix Summary:** **26 / 26 PASSED (100%)**

---

## 5. Unedited Screenshot Evidence

The following 7 unedited screenshots were captured directly during headless browser execution and saved to [`docs/governance/glcc-v1.0.1/evidence/p11/screenshots/`](file:///c:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid/docs/governance/glcc-v1.0.1/evidence/p11/screenshots):

1. **`01_trusted_qa_fil_ph_selectable.png`**: Demonstrates LanguageSelector under trusted QA mode with `fil-PH` selectable (no `Unavailable` badge).
2. **`02_fil_ph_after_apply.png`**: Demonstrates the immediate UI rerender to Filipino upon applying preference.
3. **`03_fil_ph_after_route_navigation.png`**: Demonstrates route navigation to `/help` retaining Filipino (`html lang="fil-PH"`).
4. **`04_fil_ph_after_hard_refresh.png`**: Demonstrates server-side SSR persistence upon browser reload with zero hydration warnings.
5. **`05_global_preferences_fil_ph.png`**: Demonstrates the full Global Preferences modal in Filipino with Country, Language, and Currency tabs.
6. **`06_authenticated_filipino_surface.png`**: Demonstrates authenticated session surface in Filipino for authorized test account.
7. **`07_production_policy_fil_ph_blocked.png`**: Demonstrates Production-policy enforcement where `fil-PH` is blocked with the `Unavailable` badge.

---

## 6. Runtime Quality Metrics & Guards

| Metric | Target | Measured Output | Status |
|---|---|---|:---:|
| **React Hydration Mismatches** | 0 | 0 | **PASS** |
| **Visible English Content Flash on `fil-PH`** | 0 | 0 | **PASS** |
| **Raw Translation Key Renderings** | 0 | 0 | **PASS** |
| **`fil-PH` Required English Fallbacks** | 0 | 0 | **PASS** |
| **Unapproved Hardcoded UI Strings** | 0 | 0 | **PASS** |
| **Canonical Translation Baseline** | 2,208 keys | `en-PH`: 2,208 (100%), `fil-PH`: 2,208 (100%) | **PASS** |
| **Japanese Work Preserved** | 0 keys | 0 keys (`REGISTERED`) | **PASS** |

---

## 7. Security, Financial & Regulatory Invariants

1. **Country & Currency Boundaries:** Switching languages strictly preserves Country (`PH`) and Display Currency (`PHP`).
2. **Financial Firewall:** `chargeCurrency` is immutably locked to `PHP`. No language switch can mutate settlement, payment provider, fees, ledger, or refund authority.
3. **RBAC & KYC Boundaries:** Locale resolution has zero authority over user roles, permissions, KYC status, or legal jurisdiction.
4. **Controlled Content:** Authoritative legal text (`/terms`) remains strictly guarded against unapproved automated translations.
5. **Database Boundary:** No migrations were performed, no test data was seeded/synced, and the local DB schema remains strictly valid.

---

## 8. Source Immutability Check

```
git status --short
git diff --name-only 9f5db74f25600e17f41bf3486f7659c95f0c7587 HEAD
```
- **Runtime Source Modifications:** **0 lines / 0 files**
- **Prisma Schema Modifications:** **0**
- **Migration Modifications:** **0**

---

## 9. Gate Promotion Determination

All requirements defined in Section 1–28 of the G2 Revalidation Directive have been satisfied with zero failures and full real-browser evidence.

```
============================================================
G2 LOCAL FUNCTIONAL:
PROMOTED — CORRECTED CANDIDATE REVALIDATED
============================================================
```

### Cumulative Corrected-Candidate Lifecycle State:
- **G1 CODE COMPLETE:** `PROMOTED — REVALIDATED`
- **G2 LOCAL FUNCTIONAL:** `PROMOTED — REVALIDATED`
- **G3 LOCAL DATABASE MIGRATED:** `NOT YET REVALIDATED`
- **G4 LOCAL REQUIRED DATA SEEDED/SYNCED:** `NOT YET REVALIDATED`
- **G5 LOCAL ACCEPTANCE PASS — LOCAL CHECKPOINT FROZEN:** `NOT YET REVALIDATED`
- **G6 PREVIEW MIGRATED:** `NOT YET REVALIDATED`
- **G7 PREVIEW ACCEPTANCE PASS — PREVIEW CHECKPOINT FROZEN:** `NOT PROMOTED`
- **G8 PRODUCTION-READY:** `NOT PROMOTED`
- **G9 PRODUCTION DEPLOYMENT/VERIFICATION:** `NOT PROMOTED`
- **G10 COMPLETED:** `NOT PROMOTED`
- **G11 ACCEPTED:** `NOT PROMOTED`
- **G12 CLOSED:** `NOT PROMOTED`
- **G13 VERSION FROZEN:** `NOT PROMOTED`

**Next Permitted Lifecycle Action:** `G3 LOCAL DATABASE MIGRATED REVALIDATION` (to be initiated in subsequent directive).
