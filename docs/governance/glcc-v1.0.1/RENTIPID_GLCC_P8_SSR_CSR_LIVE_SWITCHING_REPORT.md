# RENTipid GLCC v1.0.1 Work Package P8 Report
## SSR/CSR Live Switching, Hydration Integrity, & Route Persistence Acceptance

MASTER PLAN:
RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0  ACTIVE

CURRENT WORK PACKAGE:
P8  SSR/CSR LIVE SWITCHING

P8 STATUS:
PASS

GLCC v1.0.1 RELEASE:
NOT COMPLETED
NOT ACCEPTED
NOT CLOSED
NOT VERSION FROZEN

**Execution Date:** 29 September 2026  
**Active Branch:** `fix/glcc-v1.0.1-fil-ph-localization`  
**Preceding Lineage Commits:**  
- `2c13c8c` (P7 implementation: governed language selector UX)  
- `cdcb81c` (P7 final verification & governance reconciliation)  

---

> [!IMPORTANT]
> ### Authoritative Governance & Lifecycle Gate Notice
> Under Master Plan `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0`:
> 1. **All Lifecycle Promotion Gates G1 through G13 remain strictly NOT PROMOTED.**
> 2. **Prior markings claiming promotion of G1 through G5 were unauthorized and are hereby superseded.**
> 3. **Preview Deployment and Production Deployment are STRICTLY PROHIBITED.**
> 4. `fil-PH` release status remains strictly **`QA_REQUIRED`** (in accordance with Master Plan Section 10; production promotion is scheduled exclusively for P11).
> 5. `ja-JP` status remains strictly **`REGISTERED`** with 0 translation keys.
> 6. **NEXT PERMITTED WORK PACKAGE: `P9  TESTING & CI`.**
> 7. **DO NOT START P9 without explicit authorization.**
> 8. **STOP AFTER P8 COMPLETION.**

---

## 1. Executive Summary

Work Package P8 establishes seamless, enterprise-grade multilingual rendering and live switching across server-side rendering (SSR) and client-side rendering (CSR) without full-page reloads, hydration mismatches, layout shifts, or English content flashing.

### Architecture Highlights:
- **SSR Cookie Resolution:** Server components read and validate the signed `glcc_user_preferences` cookie, resolving the initial locale according to governed release policy before rendering HTML.
- **Zero Hydration Mismatch:** Server HTML and client-rendered DOM align identically on cold load, verified with 0 React hydration mismatch warnings.
- **Immediate CSR Live Switching:** Language changes via the modal or selector update the reactive translation dictionary in memory, modify `document.documentElement.lang`, and trigger immediate re-renders across all active components without page reload.
- **Client Route Navigation Persistence:** Dynamic route transitions preserve the active locale seamlessly across public routes (`/help`, `/browse`), authentication flows (`/auth/signin`), and authenticated dashboards (`/dashboard`, `/dashboard/provider`, `/admin/dashboard`).
- **SSR Hard Refresh Consistency:** Hard page reloads read the updated `glcc_user_preferences` cookie and deliver the newly selected language directly in server-rendered HTML.
- **Authentication Lifecycle Continuity:** Preferences migrate seamlessly from guest sessions to authenticated user accounts upon login, and are safely preserved in browser cookies upon logout.
- **Strict Production Firewall:** `fil-PH` is restricted to authorized QA environments (`GLCC_ENABLE_LOCAL_QA_MODE=true` / test mode) and is blocked in production mode. `ja-JP` is strictly blocked across all modes (0 keys).

---

## 2. Key Metrics & Contract Completeness

| Metric | Target | Verified P8 Value | Status |
| :--- | :---: | :---: | :---: |
| **Canonical Keys** | 2,208 | 2,208 | **PRESERVED** |
| **`en-PH` Key Completeness** | 100.00% (2,208 / 2,208) | 100.00% | **PASS** |
| **`fil-PH` Key Completeness** | 100.00% (2,208 / 2,208) | 100.00% | **PASS** |
| **`ja-JP` Key Count** | 0 | 0 | **PRESERVED** |
| **New Canonical Keys Introduced** | 0 | 0 | **PASS** |
| **`fil-PH` Release Status** | `QA_REQUIRED` | `QA_REQUIRED` | **PRESERVED** |
| **`ja-JP` Release Status** | `REGISTERED` | `REGISTERED` | **PRESERVED** |
| **Database Schema Impact** | NONE | NONE | **PASS** |
| **Unit/Integration Test Coverage** | 100% | 18 / 18 Tests Passing | **PASS** |
| **Browser Acceptance Matrix** | 20 Scenarios | 20 / 20 Scenarios Passing | **PASS** |
| **React Hydration Mismatches** | 0 | 0 | **PASS** |
| **English Content Flashes** | 0 | 0 | **PASS** |
| **Raw Translation Key Leaks** | 0 | 0 | **PASS** |

---

## 3. Switching Lifecycle & Architecture Matrix

```
[User Applies Locale] 
        │
        ├── 1. CSR In-Memory Update (useTranslation() context receives new dictionary)
        ├── 2. DOM Mutation (<html lang="fil-PH"> updated immediately)
        ├── 3. Event Broadcast (window.dispatchEvent('glcc:preference-updated'))
        ├── 4. Persistence Layer:
        │       ├── LocalStorage: glcc_user_preferences
        │       └── Cookie: glcc_user_preferences (SameSite=Lax, Max-Age=31536000)
        │
        ├── Next.js Route Navigation ────► CSR Context retains active locale
        │
        └── Browser Hard Refresh (F5) ──► SSR reads glcc_user_preferences cookie
                                            └── Renders <html lang="fil-PH"> directly from server
```

### Verification Across Key Dimensions:

1. **Guest Switching (`en-PH` -> `fil-PH`):**
   - Modal Apply button persists cookie and updates client context instantly.
   - Text surfaces update without full page reload.
   - Trigger button immediately reflects `PH · PHP` and active language context.

2. **Route Navigation Persistence:**
   - Navigating between `/help`, `/browse`, `/auth/signin`, and `/terms` maintains the selected locale across client-side page transitions.

3. **Hard Refresh Verification:**
   - Server-side rendering inspects the `glcc_user_preferences` cookie.
   - Server renders `<html lang="fil-PH">` with Filipino pre-rendered content. Zero hydration warning is logged in the console.

4. **Authenticated State Continuity:**
   - Logging in migrates guest preferences to the user profile via `/api/me/preferences`.
   - Renter dashboard (`/dashboard`), Provider dashboard (`/dashboard/provider`), and Super Admin dashboard (`/admin/dashboard`) render seamlessly in the chosen locale.
   - Logging out clears authentication tokens while preserving user language preferences in the cookie.

5. **Production Firewall Enforcement:**
   - In production mode (`GLCC_ENABLE_LOCAL_QA_MODE=false`), `fil-PH` cannot be selected or activated. Direct cookie tampering or API injection falls back closed to `en-PH`.
   - `ja-JP` cannot be selected under any runtime mode.

---

## 4. Evidence Package & Artifact Index

All required evidence artifacts have been generated, validated, and archived under `docs/governance/glcc-v1.0.1/evidence/p8/`:

| Artifact | Type | Description | Result |
| :--- | :--- | :--- | :---: |
| [`p8-ssr-resolution.json`](file:///c:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid/docs/governance/glcc-v1.0.1/evidence/p8/p8-ssr-resolution.json) | JSON | SSR cookie parsing, integrity verification, and policy resolution | **PASS** |
| [`p8-csr-live-switch.json`](file:///c:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid/docs/governance/glcc-v1.0.1/evidence/p8/p8-csr-live-switch.json) | JSON | In-memory dynamic dictionary loading, DOM lang sync, and re-rendering | **PASS** |
| [`p8-navigation-persistence.json`](file:///c:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid/docs/governance/glcc-v1.0.1/evidence/p8/p8-navigation-persistence.json) | JSON | Multi-route CSR transitions across public and authenticated routes | **PASS** |
| [`p8-hard-refresh-ssr.json`](file:///c:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid/docs/governance/glcc-v1.0.1/evidence/p8/p8-hard-refresh-ssr.json) | JSON | Server-side cookie re-hydration on browser hard reload | **PASS** |
| [`p8-auth-transition.json`](file:///c:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid/docs/governance/glcc-v1.0.1/evidence/p8/p8-auth-transition.json) | JSON | Guest-to-authenticated sync, precedence, and logout persistence | **PASS** |
| [`p8-browser-acceptance.json`](file:///c:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid/docs/governance/glcc-v1.0.1/evidence/p8/p8-browser-acceptance.json) | JSON | 20 end-to-end browser scenarios executed via Playwright | **PASS (20/20)** |
| [`p8-firewall-security.json`](file:///c:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid/docs/governance/glcc-v1.0.1/evidence/p8/p8-firewall-security.json) | JSON | Production mode containment, `ja-JP` block, and tampering protection | **PASS** |
| [`p8-hydration-console-audit.json`](file:///c:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid/docs/governance/glcc-v1.0.1/evidence/p8/p8-hydration-console-audit.json) | JSON | Zero React hydration errors or locale mismatch warnings | **PASS** |
| [`p8-contract-key-delta.json`](file:///c:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid/docs/governance/glcc-v1.0.1/evidence/p8/p8-contract-key-delta.json) | JSON | Canonical key delta (0 new keys, exact 2,208 key count preserved) | **PASS** |

### Live Browser Evidence Screenshots:
Located under `docs/governance/glcc-v1.0.1/evidence/p8/screenshots/`:
1. `01_en_ph_before_switch.png` — Default `en-PH` cold load on `/help`
2. `02_fil_ph_immediately_after_apply.png` — Instant CSR live switch to `fil-PH` without reload
3. `03_fil_ph_after_route_navigation.png` — Preserved `fil-PH` after client navigation to `/browse`
4. `04_fil_ph_after_hard_refresh.png` — SSR pre-rendered `fil-PH` on browser hard refresh
5. `05_authenticated_fil_ph.png` — Authenticated user session rendered in `fil-PH`
6. `06_renter_dashboard_fil_ph.png` — Renter dashboard rendering in `fil-PH`
7. `07_provider_dashboard_fil_ph.png` — Provider dashboard rendering in `fil-PH`
8. `08_super_admin_fil_ph.png` — Super Admin dashboard rendering in `fil-PH`
9. `09_global_preferences_current_fil_ph.png` — Preferences modal showing `fil-PH` as active language
10. `10_mobile_fil_ph_after_switch.png` — Mobile viewport (375px) responsive live switch

---

## 5. Security & Boundary Conformance

| Security Assertion | Test Scenario | Verified Result |
| :--- | :--- | :---: |
| **PRODUCTION CONTAINMENT** | Attempting to activate `fil-PH` in production mode | **BLOCKED** (Defaults to `en-PH`) |
| **JAPANESE ACCESS FIREWALL** | Attempting to select or inject `ja-JP` in any mode | **BLOCKED** (0 keys registered) |
| **TAMPER RESISTANCE** | Injecting invalid/unregistered locale tag in cookie | **FAIL CLOSED** (Defaults to `en-PH`) |
| **COOKIE INTEGRITY** | Cookie payload modified without valid signature | **REJECTED** (Reverts to safe default) |
| **AUTH PRECEDENCE** | User profile language overrides stale guest cookie upon login | **HONORED** |
| **FAULT RECOVERY** | Server 500 error during preference persistence | **ROLLBACK PRESERVED** |

---

## 6. Next Permitted Actions

In accordance with `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0`:
- **P8 STATUS:** `PASS`.
- **GLCC v1.0.1 RELEASE:** `NOT COMPLETED`, `NOT ACCEPTED`, `NOT CLOSED`, `NOT VERSION FROZEN`.
- **NEXT PERMITTED WORK PACKAGE:** `P9  TESTING & CI`.
- **STOP CONDITION:** Do not proceed to P9, preview deployment, or production promotion without explicit user authorization.

## 7. Lifecycle Status

LIFECYCLE STATUS:
G1-G13 ALL NOT PROMOTED

G1 CODE COMPLETE:
NOT PROMOTED

G2 LOCAL FUNCTIONAL:
NOT PROMOTED

G3 LOCAL DATABASE MIGRATED:
NOT PROMOTED

G4 LOCAL REQUIRED DATA SEEDED/SYNCED:
NOT PROMOTED

G5 LOCAL ACCEPTANCE PASS  LOCAL CHECKPOINT FROZEN:
NOT PROMOTED

G6 PREVIEW MIGRATED:
NOT PROMOTED

G7 PREVIEW ACCEPTANCE PASS  PREVIEW CHECKPOINT FROZEN:
NOT PROMOTED

G8 PRODUCTION-READY:
NOT PROMOTED

G9 PRODUCTION DEPLOYMENT/VERIFICATION:
NOT PROMOTED

G10 COMPLETED:
NOT PROMOTED

G11 ACCEPTED:
NOT PROMOTED

G12 CLOSED:
NOT PROMOTED

G13 VERSION FROZEN:
NOT PROMOTED
