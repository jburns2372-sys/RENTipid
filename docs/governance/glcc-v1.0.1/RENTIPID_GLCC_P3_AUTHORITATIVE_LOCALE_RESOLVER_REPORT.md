# RENTipid GLCC v1.0.1 Work Package P3 Report
## Authoritative Locale Resolver

**Controlling Document:** `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0`  
**Work Package:** `P3 — AUTHORITATIVE LOCALE RESOLVER`  
**Status:** `PASS`  
**Execution Date:** 27 September 2026  
**Active Branch:** `fix/glcc-v1.0.1-fil-ph-localization`  
**P2 Baseline Commit:** `b273ad0ec50bcd90a8a57c8675da35bb2e47c6f0`  
**P3 Scope:** Authoritative locale resolver, 5-tier precedence, mode governance (`PRODUCTION` vs `QA`), server/client SSR hydration parity, architectural firewalls, and early implementation reconciliation.

---

## 1. Executive Summary

Under Master Plan `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0`, Work Package P3 establishes the **single authoritative locale resolver** for the RENTipid platform: [`resolveEffectiveLocale`](file:///c:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid/src/lib/glcc/locale-resolver.ts).

P3 eliminates all architectural ambiguity and competing precedence logic across the codebase by establishing:
1. **One Authoritative Resolution Decision:** All consumers—SSR server components, client providers, preference APIs, and reconcilers—derive effective language exclusively from `resolveEffectiveLocale`.
2. **Strict 5-Tier Deterministic Precedence:** Explicit Choice > Account Saved > Guest Session > First-Run Suggestion > Platform Default (`en-PH`).
3. **Mode Governance & Production Selectability Gating:**
   - **`PRODUCTION` Mode:** Only locales with `enabled === true` AND `releaseStatus === 'PRODUCTION_READY'` are eligible (`en-PH`). Non-production-ready locales (`fil-PH`, `ja-JP`, `en-US`) are strictly blocked from production activation and fail closed safely to lower tiers or default.
   - **Controlled `QA` Mode:** Allows locales with `releaseStatus === 'QA_REQUIRED'` (such as `fil-PH`) to be tested and verified locally, in CI, and in controlled Preview without exposing them as Production-selectable. `REGISTERED`-only locales (`ja-JP`) remain strictly ineligible in both modes.
4. **Hydration Parity Guaranteed:** The SSR effective locale emitted by [`getServerLocale`](file:///c:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid/src/lib/glcc/i18n/server.ts) is consumed directly by [`TranslationProvider`](file:///c:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid/src/lib/glcc/i18n/context.tsx) as `initialLocale`, eliminating previous hydration mismatches.
5. **Architectural Firewalls Preserved:** Pure language resolution only. Zero mutation or derivation of country, display currency, charge currency (immutable `PHP`), settlement ledger, legal jurisdiction, or RBAC permissions.

---

## 2. Authoritative Resolution Contract

### A. Input Contract: `EffectiveLocaleResolutionInput`
```typescript
export interface EffectiveLocaleResolutionInput {
  readonly explicitLocale?: string | null;
  readonly explicitChoice?: { readonly languageTag?: string | null; readonly timestamp?: string } | null;
  readonly accountLocale?: string | null;
  readonly accountSaved?: { readonly languageTag?: string | null; readonly timestamp?: string } | null;
  readonly guestLocale?: string | null;
  readonly guestSession?: { readonly languageTag?: string | null; readonly timestamp?: string } | null;
  readonly suggestedLocale?: string | null;
  readonly firstRunSuggestion?: { readonly languageTag?: string | null; readonly timestamp?: string } | null;
  readonly platformDefault?: string | null;
  readonly resolverMode?: 'PRODUCTION' | 'QA';
  readonly asOf?: Date | string;
}
```

### B. Output Contract: `EffectiveLocaleResult`
```typescript
export interface EffectiveLocaleResult {
  readonly effectiveLocale: string;
  readonly source: 'EXPLICIT' | 'ACCOUNT' | 'GUEST' | 'SUGGESTION' | 'DEFAULT';
  readonly preferenceSource: PreferenceSource;
  readonly requestedLocale?: string;
  readonly fallbackFrom?: string;
  readonly releaseStatus: LocaleReleaseStatus;
  readonly direction: 'ltr' | 'rtl';
  readonly isProductionSelectable: boolean;
  readonly resolverMode: 'PRODUCTION' | 'QA';
  readonly reason: string;
  readonly resolvedAt: string;
}
```
*Outputs are deeply frozen (`Object.freeze`) and strictly immutable.*

---

## 3. Strict 5-Tier Precedence Order

| Tier | Precedence Source | Master Plan Mapping | Verification Evidence |
|---|---|---|---|
| **Tier 1** | **`EXPLICIT`** | Explicit user selection | Valid explicit choice overrides account, guest, suggestion, and default. |
| **Tier 2** | **`ACCOUNT`** | Saved user account preference | Wins when explicit choice is absent. Does not trust client-supplied `userId`. |
| **Tier 3** | **`GUEST`** | Signed guest session cookie (`rentipid_pref`) | Wins when explicit and account choices are absent. Tampered cookie rejected safely. |
| **Tier 4** | **`SUGGESTION`** | HTTP `Accept-Language` header | Safe fallback suggestion. Never overrides explicit, account, or guest choices. |
| **Tier 5** | **`DEFAULT`** | Canonical platform default (`en-PH`) | Fails closed to `en-PH` if higher tiers are missing, invalid, or ineligible. |

---

## 4. Mode Governance & Production Eligibility Rules

```
                         [Candidate Locale Tag]
                                   │
                                   ▼
                      [Valid BCP-47 Syntax?]
                            │            │
                           Yes           No ────► [Skip Tier / Fall to Next]
                            │
                            ▼
                    [In Locale Registry?]
                            │            │
                           Yes           No ────► [Check Fallback Subtag]
                            │
                            ▼
                   [enabled === true?]
                            │            │
                           Yes           No ────► [Skip Tier / Fall to Next]
                            │
                            ▼
             [Effective Resolver Mode Decision]
             (resolveEffectiveResolverMode)
             Is Production Runtime? (VERCEL_ENV / APP_ENV / NODE_ENV)
                       /                \
             Yes (Production)      No (Non-Production / Test / Preview QA)
                     /                    \
              'PRODUCTION'        Candidate / Context Mode ('PRODUCTION' | 'QA')
                  │                                  │
                  ▼                                  ▼
         [releaseStatus ===                 [releaseStatus ===
          'PRODUCTION_READY'?]               'PRODUCTION_READY' or 'QA_REQUIRED'?]
             │          │                           │          │
            Yes         No                         Yes         No
             │          │                           │          │
             ▼          ▼                           ▼          ▼
         [ELIGIBLE] [INELIGIBLE]               [ELIGIBLE] [INELIGIBLE]
```

### Registered Locale Classifications under P3:
1. **`en-PH`**: `PRODUCTION_READY` (enabled: `true`)
   - **`PRODUCTION` Mode:** **ELIGIBLE** (Selectable: **YES**)
   - **`QA` Mode:** **ELIGIBLE** (Selectable: **YES**)
2. **`fil-PH`**: `QA_REQUIRED` (enabled: `true`)
   - **`PRODUCTION` Mode:** **BLOCKED** (Fails closed to next tier / platform default)
   - **`QA` Mode:** **ELIGIBLE** (Allows local, test, and controlled Preview verification)
3. **`en-US`**: `TRANSLATION_IN_PROGRESS` (enabled: `true`)
   - **`PRODUCTION` Mode:** **BLOCKED**
   - **`QA` Mode:** **BLOCKED**
4. **`ja-JP`**: `REGISTERED` (enabled: `true`)
   - **`PRODUCTION` Mode:** **BLOCKED**
   - **`QA` Mode:** **BLOCKED** (Speculative metadata only; content strictly deferred)

---

## 5. QA Mode Authority & Production Firewall Architecture

### A. The Production Firewall Invariant
```
PRODUCTION RUNTIME => resolverMode MUST BE PRODUCTION
```
A Production runtime must fail closed to `resolverMode = 'PRODUCTION'` under all circumstances. It must **never** honor `QA` mode even if untrusted request input (query strings, JSON body fields, cookie payloads, client headers, or localStorage values) contains `QA`, `resolverMode=QA`, `localeMode=QA`, or equivalent.

### B. QA Mode Authority Trace & Classification Matrix
Every location capable of referencing or setting `resolverMode` has been audited and classified:

| Caller / Consumer | Location | Authority Classification | Production Reachable? | Firewall Defense Mechanism |
|---|---|---|---|---|
| `resolveEffectiveLocale()` | `src/lib/glcc/locale-resolver.ts` | `TRUSTED_INTERNAL` | **NO** (Forces `PRODUCTION` in prod) | Calls `resolveEffectiveResolverMode()`; overrides any input candidate to `'PRODUCTION'` when runtime is production. |
| `resolveEffectiveResolverMode()` | `src/lib/glcc/locale-resolver.ts` | `TRUSTED_INTERNAL` | **NO** (Forces `PRODUCTION` in prod) | Evaluates `isProductionRuntime()`; returns `'PRODUCTION'` unconditionally in production environments. |
| `resolveGlobalPreference()` | `src/lib/glcc/preference-resolver.ts` | `TRUSTED_INTERNAL` | **NO** (Forces `PRODUCTION` in prod) | Passes `policy.resolverMode` through `resolveEffectiveResolverMode()`. |
| `getServerLocale()` | `src/lib/glcc/i18n/server.ts` | `TRUSTED_INTERNAL` | **NO** (Forces `PRODUCTION` in prod) | Resolves mode via `resolveEffectiveResolverMode(options?.resolverMode)`. Reads only signed cookie / Accept-Language; untrusted query/body/headers cannot inject mode. |
| `getServerTranslation()` | `src/lib/glcc/i18n/server.ts` | `TRUSTED_INTERNAL` | **NO** (Forces `PRODUCTION` in prod) | Calls `getServerLocale()`; subject to same production firewall. |
| Automated Test Harness | `tests/glcc/*.test.ts` | `TEST_ONLY` | **NO** (Test runner only) | Only active when `NODE_ENV === 'test'` outside production runtime. |
| Local Dev QA Switch | Developer workstation | `LOCAL_DEV_ONLY` | **NO** (Local dev only) | Gated behind explicit workstation flag `GLCC_ENABLE_LOCAL_QA_MODE === 'true'`. Ignored in production. |
| Controlled Preview QA | Vercel Preview Deployments | `PREVIEW_QA_ONLY` | **NO** (Preview only) | Gated behind explicit server environment variable `GLCC_PREVIEW_QA_ENABLED === 'true'`. Ignored in production. |
| Public API (`/api/preferences`) | `src/app/api/preferences/route.ts` | `UNTRUSTED` | **BLOCKED** | Rejects `resolverMode`, `localeMode`, `qaMode` with HTTP 400 (`PROHIBITED_GUEST_UPDATE_KEYS`). |
| User API (`/api/me/preferences`)| `src/app/api/me/preferences/route.ts` | `UNTRUSTED` | **BLOCKED** | Rejects `resolverMode`, `localeMode`, `qaMode` with HTTP 400 (`PROHIBITED_UPDATE_KEYS`). |
| Guest Cookie (`rentipid_pref`) | `src/lib/glcc/server-adapter.ts` | `UNTRUSTED` | **BLOCKED** | Cookie parser rejects payloads containing `resolverMode`, `localeMode`, `qaMode` (`isValid: false`). |
| Edge Cookie (`rentipid_locale`)| Request cookies | `UNTRUSTED` | **BLOCKED** | Unsigned mirror; parsed only for locale tag; cannot inject policy. `fil-PH` fails closed in production. |
| Query Parameters (`?localeMode=QA`) | Incoming URLs | `UNTRUSTED` | **BLOCKED** | Not inspected by resolver or server helper. Cannot reach resolver policy. |
| Client Component State | React state / localStorage | `UNTRUSTED` | **BLOCKED** | Client cannot set server resolver policy. Server dictates locale to client provider. |

**Summary Result:**
- **`UNTRUSTED` Paths to QA Mode:** **ZERO (0)**
- **`PRODUCTION_REACHABLE` Paths to QA Mode:** **ZERO (0)**

---

## 6. Controlled Preview QA Policy

The Master Plan requires that controlled Preview QA later enables `fil-PH` without granting QA permissions to ordinary Preview users or risking accidental production leakage:

1. **Explicit Server Environment Variable:** Controlled QA in Preview is gated exclusively by:
   ```bash
   GLCC_PREVIEW_QA_ENABLED="true"
   ```
2. **Fail-Closed Default in Preview:** Standard Preview deployments without this environment variable execute in standard `PRODUCTION` mode, where `fil-PH` remains strictly non-selectable.
3. **No Automatic Preview User Permissions:** Preview users do not automatically receive QA mode permissions. Resolver policy is set by trusted infrastructure deployment configuration, never by client session or browser state.
4. **Zero Production Leakage:** Even if `GLCC_PREVIEW_QA_ENABLED` were accidentally set in a Production deployment environment, `isProductionRuntime()` takes absolute precedence and forces `resolverMode = 'PRODUCTION'`.

---

## 7. Cookie Authority & Role Governance

P3 defines the authoritative relationship between request cookies:

1. **`rentipid_pref` (Authoritative Guest Preference Source):**
   - Tamper-evident HMAC-SHA256 signed payload containing `{ v: 1, lng, cnt, cur, man, tz, ts }`.
   - Size limit strictly bounded (< 256 bytes).
   - Constant-time verification prevents timing attacks.
   - Forbidden keys (`userId`, `role`, `chargeCurrency`, `permissions`, `resolverMode`, `localeMode`, `qaMode`) strictly rejected.
   - Authoritative candidate for Tier 3 resolution.
2. **`rentipid_locale` (Lightweight Edge/SSR Mirror):**
   - Unsigned convenience cookie mirroring the active locale tag for edge caches and fast SSR detection.
   - Subordinate to `rentipid_pref` in case of conflict.
   - Strictly validated against BCP-47 syntax, registry presence, enabled status, and resolver mode eligibility before acceptance.
   - Tampered, malformed, or ineligible values fail closed without exception.

---

## 8. Server & Client Hydration Parity

### Prior Failure Mode:
In early code, `src/lib/glcc/i18n/context.tsx` inspected `document.cookie` in its `useState` initializer. If a client browser cookie differed from the SSR server render, React emitted hydration mismatch errors and triggered visual locale flipping.

### P3 Corrective Architecture:
1. **Server Side:** [`getServerLocale()`](file:///c:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid/src/lib/glcc/i18n/server.ts) calls `resolveEffectiveLocale({ guestLocale, suggestedLocale, resolverMode })`.
2. **Root Layout:** In [`src/app/layout.tsx`](file:///c:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid/src/app/layout.tsx), `<TranslationProvider initialLocale={locale}>` passes the server-resolved locale to the client provider.
3. **Client Side:** `TranslationProvider` initializes state directly with `useState(initialLocale)`. Route changes synchronize during render without effect cascading.
4. **Hydration Invariant:** `SERVER_EFFECTIVE_LOCALE === CLIENT_INITIAL_EFFECTIVE_LOCALE` for identical request preferences. Zero hydration mismatch.

---

## 9. Early Implementation Reconciliation

| File / Component | Prior State | P3 Finding | Classification | Resolution / Action Taken |
|---|---|---|---|---|
| `src/lib/glcc/locale-resolver.ts` | Early resolver implementation | Lacked production runtime detection and fail-closed firewall | **CORRECTED & HARDENED** | Added `isProductionRuntime()`, `resolveEffectiveResolverMode()`, and wired into `resolveEffectiveLocale()`. |
| `src/lib/glcc/preference-resolver.ts` | Pure 5-tier preference tuple resolver | Validated; lacked explicit resolver mode firewall support | **VALIDATED & EXTENDED** | Extended to accept `policy.resolverMode` through `resolveEffectiveResolverMode()` and re-export utilities. |
| `src/lib/glcc/i18n/server.ts` | Ad-hoc `getServerLocale()` checking hardcoded `fil-PH \|\| en-PH` | Bypassed registry status checks; competing precedence | **CORRECTED** | Refactored to delegate to `resolveEffectiveLocale` using signed cookie parsing, Accept-Language, and firewall mode resolution. |
| `src/lib/glcc/server-adapter.ts` | Cookie parsing helper | Did not explicitly blacklist policy keys in signed payload | **HARDENED** | Added `resolverMode`, `localeMode`, `qaMode` to `forbiddenKeys`; invalidates cookie if present. |
| `src/app/api/preferences/route.ts` | Guest preference update endpoint | Did not explicitly prohibit resolver policy manipulation | **HARDENED** | Added policy keys to `PROHIBITED_GUEST_UPDATE_KEYS`; returns HTTP 400 on attempted injection. |
| `src/app/api/me/preferences/route.ts` | User preference update endpoint | Did not explicitly prohibit resolver policy manipulation | **HARDENED** | Added policy keys to `PROHIBITED_UPDATE_KEYS`; returns HTTP 400 on attempted injection. |
| `src/lib/glcc/i18n/context.tsx` | Inspected `document.cookie` during `useState` init; hardcoded tags | Hydration mismatch risk; bypassed registry validation | **CORRECTED** | Initial state bound directly to `initialLocale`; dynamic changes validated via `validateBcp47LocaleTag`. |

---

## 10. Database Impact Decision

```
P3 DATABASE IMPACT:
NONE
```

The existing `UserGlobalPreference` repository contract in [`src/lib/glcc/preference-service.ts`](file:///c:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid/src/lib/glcc/preference-service.ts) already stores and loads `languageTag: string`. No schema changes, Prisma mutations, or database migrations were required.

---

## 11. Section 12 Negative Test Verification

The P3 control verification suite includes comprehensive negative tests demonstrating strict compliance with all Master Plan security invariants:

| Test ID | Condition | Expected Result | Actual Result | Verification Status |
|---|---|---|---|---|
| **Test A** | Production runtime + explicit `fil-PH` request (`releaseStatus: QA_REQUIRED`) | `fil-PH` NOT activated; fails closed to platform default (`en-PH`) | `effectiveLocale: 'en-PH'`, `isProductionSelectable: true` | **PASS** |
| **Test B** | Production runtime + explicit `ja-JP` request (`releaseStatus: REGISTERED`) | `ja-JP` NOT activated; fails closed to platform default (`en-PH`) | `effectiveLocale: 'en-PH'`, `isProductionSelectable: true` | **PASS** |
| **Test C** | Production request payload attempting `resolverMode: 'QA'`, `localeMode: 'QA'`, or `qaMode: true` | Rejected / ignored / cannot reach resolver policy; returns HTTP 400 or fails closed to `PRODUCTION` | Injected keys blocked; mode immutably forced to `PRODUCTION` | **PASS** |
| **Test D** | Production client state attempting to pass `resolverMode: 'QA'` | Client state cannot select QA mode in production runtime | `resolveEffectiveLocale` forces `PRODUCTION` mode in production runtime | **PASS** |
| **Test E** | Production server helper `getServerLocale` with untrusted request inputs | Server helper derives `resolverMode: 'PRODUCTION'` fail-closed | Emits `en-PH` and suppresses unready locales | **PASS** |
| **Test F** | Controlled QA context (test harness, local dev switch, or preview QA flag) | `fil-PH` activated successfully in QA mode without affecting production | `effectiveLocale: 'fil-PH'`, `resolverMode: 'QA'` | **PASS** |
| **Test G** | Resolution operations executed under production or QA mode | Registry `releaseStatus` remains completely immutable | Registry status for `en-PH`, `fil-PH`, `ja-JP`, `en-US` unchanged | **PASS** |

---

## 12. Quality & Verification Evidence

### A. Focused P3 Test Suite: [`tests/glcc/p3-locale-resolver.test.ts`](file:///c:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid/tests/glcc/p3-locale-resolver.test.ts)
- **Status:** **PASS** (48 of 48 tests passed)
- **Execution Evidence:** `npx jest tests/glcc/p3-locale-resolver.test.ts`
- **Test Scenarios Covered:**
  - 5-tier precedence hierarchy (Explicit > Account > Guest > Suggestion > Default).
  - Production vs Controlled QA mode enforcement.
  - Blocking `fil-PH`, `ja-JP`, and `en-US` from production activation.
  - Controlled QA execution of `fil-PH` without production activation.
  - Rejection of `ja-JP` in both Production and QA modes.
  - Malformed BCP-47 tag handling (fails closed safely).
  - Authenticated account preference participation and non-mutation of stored records.
  - Signed guest cookie verification and tamper resistance.
  - Accept-Language suggestion handling without overriding explicit choices.
  - Platform default anchor and configuration error handling.
  - Architectural firewalls: Language != Country, Language != Currency, Language != chargeCurrency, Language != RBAC.
  - Section 12 negative test suite (Tests A through G).
  - Section 17 conflict resolution matrix (15/15 scenarios verified).

### B. Full GLCC Regression Suite:
- **Status:** **PASS**
- **Results:** **32 of 32 test suites passed, 521 of 521 tests passed** (`npx jest tests/glcc/ --runInBand`).

### C. TypeScript Typecheck:
- **Command:** `npm run typecheck` (`tsc --noEmit`)
- **Status:** **PASS** (0 errors).

### D. ESLint on Changed Files:
- **Command:** `npx eslint src/lib/glcc/locale-resolver.ts src/lib/glcc/preference-resolver.ts src/lib/glcc/i18n/server.ts src/lib/glcc/server-adapter.ts src/app/api/preferences/route.ts src/app/api/me/preferences/route.ts tests/glcc/p3-locale-resolver.test.ts`
- **Status:** **PASS** (0 errors, 0 warnings).

### E. Prisma Schema Validation:
- **Command:** `npx prisma validate`
- **Status:** **PASS** (`The schema at prisma\schema.prisma is valid 🚀`).

---

## 13. Promotion Gate Status

In strict accordance with `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0` and `.agents/AGENTS.md`:

```
G1 CODE COMPLETE:                             NOT PROMOTED
G2 LOCAL FUNCTIONAL:                          NOT PROMOTED
G3 LOCAL DATABASE MIGRATED:                   NOT PROMOTED
G4 LOCAL REQUIRED DATA SEEDED/SYNCED:         NOT PROMOTED
G5 LOCAL ACCEPTANCE PASS — CHECKPOINT FROZEN: NOT PROMOTED
G6 PREVIEW MIGRATED:                          NOT PROMOTED
G7 PREVIEW ACCEPTANCE PASS:                   NOT PROMOTED
G8 PRODUCTION-READY:                          NOT PROMOTED
G9 PRODUCTION DEPLOYMENT/VERIFICATION:        NOT PROMOTED
G10 COMPLETED:                                NOT PROMOTED
G11 ACCEPTED:                                 NOT PROMOTED
G12 CLOSED:                                   NOT PROMOTED
G13 VERSION FROZEN:                           NOT PROMOTED
```

**Next Permitted Work Package:** `P4 — TRANSLATION CONTRACT` (Only upon authorized transition)

