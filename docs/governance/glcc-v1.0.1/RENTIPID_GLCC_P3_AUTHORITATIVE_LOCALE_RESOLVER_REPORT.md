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
                    [Active Resolver Mode?]
                      /                \
                     /                  \
             'PRODUCTION'               'QA'
                 │                        │
                 ▼                        ▼
        [releaseStatus ===       [releaseStatus ===
         'PRODUCTION_READY'?]     'PRODUCTION_READY' or 'QA_REQUIRED'?]
            │          │                 │          │
           Yes         No               Yes         No
            │          │                 │          │
            ▼          ▼                 ▼          ▼
        [ELIGIBLE] [INELIGIBLE]     [ELIGIBLE] [INELIGIBLE]
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

## 5. Cookie Authority & Role Governance

P3 defines the authoritative relationship between request cookies:

1. **`rentipid_pref` (Authoritative Guest Preference Source):**
   - Tamper-evident HMAC-SHA256 signed payload containing `{ v: 1, lng, cnt, cur, man, tz, ts }`.
   - Size limit strictly bounded (< 256 bytes).
   - Constant-time verification prevents timing attacks.
   - Forbidden keys (`userId`, `role`, `chargeCurrency`, `permissions`) strictly rejected.
   - Authoritative candidate for Tier 3 resolution.
2. **`rentipid_locale` (Lightweight Edge/SSR Mirror):**
   - Unsigned convenience cookie mirroring the active locale tag for edge caches and fast SSR detection.
   - Subordinate to `rentipid_pref` in case of conflict.
   - Strictly validated against BCP-47 syntax, registry presence, enabled status, and resolver mode eligibility before acceptance.
   - Tampered, malformed, or ineligible values fail closed without exception.

---

## 6. Server & Client Hydration Parity

### Prior Failure Mode:
In early code, `src/lib/glcc/i18n/context.tsx` inspected `document.cookie` in its `useState` initializer. If a client browser cookie differed from the SSR server render, React emitted hydration mismatch errors and triggered visual locale flipping.

### P3 Corrective Architecture:
1. **Server Side:** [`getServerLocale()`](file:///c:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid/src/lib/glcc/i18n/server.ts) calls `resolveEffectiveLocale({ guestLocale, suggestedLocale, resolverMode })`.
2. **Root Layout:** In [`src/app/layout.tsx`](file:///c:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid/src/app/layout.tsx), `<TranslationProvider initialLocale={locale}>` passes the server-resolved locale to the client provider.
3. **Client Side:** `TranslationProvider` initializes state directly with `useState(initialLocale)`. Route changes synchronize during render without effect cascading.
4. **Hydration Invariant:** `SERVER_EFFECTIVE_LOCALE === CLIENT_INITIAL_EFFECTIVE_LOCALE` for identical request preferences. Zero hydration mismatch.

---

## 7. Early Implementation Reconciliation

| File / Component | Prior State | P3 Finding | Classification | Resolution / Action Taken |
|---|---|---|---|---|
| `src/lib/glcc/preference-resolver.ts` | Pure 5-tier preference tuple resolver | Validated; lacked explicit resolver mode support | **VALIDATED & EXTENDED** | Extended to accept `policy.resolverMode` and re-export P3 `locale-resolver` utilities. |
| `src/lib/glcc/i18n/server.ts` | Ad-hoc `getServerLocale()` checking hardcoded `fil-PH \|\| en-PH` | Bypassed registry status checks; competing precedence | **CORRECTED** | Refactored to delegate to `resolveEffectiveLocale` using signed cookie parsing and Accept-Language. |
| `src/lib/glcc/i18n/context.tsx` | Inspected `document.cookie` during `useState` init; hardcoded tags | Hydration mismatch risk; bypassed registry validation | **CORRECTED** | Initial state bound directly to `initialLocale`; dynamic changes validated via `validateBcp47LocaleTag`. |
| Public & Account Preference APIs | Sets `rentipid_pref` and `rentipid_locale` | Confirmed valid cookie generation | **VALIDATED** | Confirmed roles: `rentipid_pref` is authoritative signed payload; `rentipid_locale` is edge mirror. |
| Translation Dictionaries & UI Migration | Modular bundles in `locales/` | Scope outside P3 | **OUTSIDE P3** | Deferred to P4, P5, and P6 per Master Plan critical sequence. |

---

## 8. Database Impact Decision

```
P3 DATABASE IMPACT:
NONE
```

The existing `UserGlobalPreference` repository contract in [`src/lib/glcc/preference-service.ts`](file:///c:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid/src/lib/glcc/preference-service.ts) already stores and loads `languageTag: string`. No schema changes, Prisma mutations, or database migrations were required.

---

## 9. Quality & Verification Evidence

### A. Focused P3 Test Suite: [`tests/glcc/p3-locale-resolver.test.ts`](file:///c:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid/tests/glcc/p3-locale-resolver.test.ts)
- **Status:** **PASS** (39 of 39 tests passed)
- **Test Scenarios Covered:**
  - 5-tier precedence hierarchy (Explicit > Account > Guest > Suggestion > Default).
  - Production vs Controlled QA mode enforcement.
  - Blocking `fil-PH`, `ja-JP`, and `en-US` from production activation.
  - Controlled QA execution of `fil-PH` without production activation.
  - Rejection of `ja-JP` even in QA mode.
  - Malformed BCP-47 tag handling (fails closed safely).
  - Authenticated account preference participation and non-mutation of stored records.
  - Signed guest cookie verification and tamper resistance.
  - Accept-Language suggestion handling without overriding explicit choices.
  - Platform default anchor and configuration error handling.
  - Architectural firewalls: Language != Country, Language != Currency, Language != chargeCurrency, Language != RBAC.
  - No automatic status promotion invariant.
  - Bidirectional source mapping (`LocaleResolutionSource` <-> `PreferenceSource`).
  - Section 17 conflict resolution matrix (12/12 scenarios verified).

### B. Full GLCC Regression Suite:
- **Status:** **PASS**
- **Results:** **32 of 32 test suites passed, 512 of 512 tests passed** (`npx jest tests/glcc/ --runInBand`).

### C. TypeScript Typecheck:
- **Command:** `npm run typecheck` (`tsc --noEmit`)
- **Status:** **PASS** (0 errors).

### D. ESLint on Changed Files:
- **Command:** `npx eslint src/lib/glcc/locale-resolver.ts src/lib/glcc/default-registries.ts src/lib/glcc/contracts.ts src/lib/glcc/preference-resolver.ts src/lib/glcc/i18n/server.ts src/lib/glcc/i18n/context.tsx tests/glcc/p3-locale-resolver.test.ts`
- **Status:** **PASS** (0 errors, 0 warnings).

### E. Prisma Schema Validation:
- **Command:** `npx prisma validate`
- **Status:** **PASS** (`The schema at prisma\schema.prisma is valid 🚀`).

---

## 10. Promotion Gate Status

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

**Next Permitted Work Package:** `P4 — TRANSLATION CONTRACT`
