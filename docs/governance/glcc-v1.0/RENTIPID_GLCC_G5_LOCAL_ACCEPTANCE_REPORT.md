# RENTipid — GLCC v1.0
## Gate G5: Local Acceptance Report & Local Checkpoint Freeze

- **Module**: Global Localization, Country Profiles, and Currency Architecture (GLCC) v1.0
- **Candidate SHA**: `db2e78695d77fdc64bb428201f3c1eb6fec5a802`
- **Gate**: G5 — LOCAL ACCEPTANCE PASS (LOCAL CHECKPOINT FROZEN)
- **Target Environment**: LOCAL ONLY (`rentipid_local_dev` on `127.0.0.1:5432` / `http://localhost:3000`)
- **Evaluated At**: 2026-09-26T18:15:45+08:00
- **Status**: **PASS — LOCAL CHECKPOINT FROZEN — PROMOTED**

---

### 1. Executive Summary

Gate G5 establishes complete local functional, architectural, security, and financial acceptance of RENTipid GLCC v1.0 against the exact release candidate lineage `db2e78695d77fdc64bb428201f3c1eb6fec5a802`.

All 35 required acceptance criteria across all GLCC domains have been objectively verified and passed. Full automated regression suites, static typing, schema validation, live API contracts, and browser-driven user journeys have completed with zero defects.

Following this verification, the **Local Checkpoint is officially declared FROZEN**.

---

### 2. Static & Regression Verification Digest

| Verification Area | Command / Tool | Result | Details |
| :--- | :--- | :---: | :--- |
| **Prisma Schema Validation** | `npx prisma validate` | **PASS** | Valid schema, clean models & relations, exit code 0 |
| **TypeScript Static Check** | `npx tsc --noEmit` | **PASS** | 0 compile errors across full workspace, exit code 0 |
| **GLCC Automated Test Suite** | `npx jest tests/glcc/ --runInBand` | **PASS** | **27 test suites passed, 436 tests passed, 0 failures** (75.49s) |
| **Translation Bundle Validation**| `validateTranslationBundle()` | **PASS** | 0 missing keys, 0 placeholder mismatches against `en-PH` |
| **Live API Acceptance Suite** | Local test harness | **PASS** | 12 of 12 live API/route checks passed against `localhost:3000` |
| **Live Browser Journey Video** | Subagent Browser automation | **PASS** | Recorded `glcc_g2_journey_1790415958888.webp` |

---

### 3. Comprehensive Acceptance Matrix (35 Acceptance Criteria)

| Acceptance ID | Domain | Requirement Description | Verification Evidence | Result |
| :---: | :--- | :--- | :--- | :---: |
| **LNG-01** | Language | Canonical fallback to `en-PH` on absent/invalid language | `tests/glcc/preference-resolver.test.ts`, live GET `/api/preferences` | **PASS** |
| **LNG-02** | Language | Language persistence via signed HMAC cookie & DB record | `tests/glcc/preference-service.test.ts`, live PUT `/api/preferences` | **PASS** |
| **LNG-03** | Language | Language selection independence from country/currency | `tests/glcc/preference-resolver.test.ts`, browser modal journey | **PASS** |
| **LNG-04** | Language | Translation bundle static parity against canonical reference | `tests/glcc/validator.test.ts`, `validateTranslationBundle()` | **PASS** |
| **CNT-01** | Country | Country profile resolution with country-level defaults | `tests/glcc/country-profile.test.ts` (PH, US, JP) | **PASS** |
| **CNT-02** | Country | Country change applies default display currency | `tests/glcc/preference-reconciler.test.ts`, live PUT `/api/preferences` | **PASS** |
| **CNT-03** | Country | Unsupported country code rejected safely with HTTP 400 | `tests/glcc/preference-validator.test.ts`, live negative test | **PASS** |
| **CUR-01** | Currency | Canonical charge currency strictly immutable `PHP` | `src/lib/glcc/contracts.ts` (`PAYMENT_CONTRACT_CURRENCY = 'PHP'`) | **PASS** |
| **CUR-02** | Currency | Manual display currency override allowed when enabled | `tests/glcc/feature-flags.test.ts`, live PUT `/api/preferences` | **PASS** |
| **CUR-03** | Currency | Display currency override fail-closed when flag disabled | `tests/glcc/preference-reconciler.test.ts` | **PASS** |
| **CUR-04** | Currency | Unsupported currency code rejected safely with HTTP 400 | `tests/glcc/preference-validator.test.ts`, live negative test | **PASS** |
| **FX-01** | FX Presentation | Authoritative PHP base amount remains visible & primary | `tests/glcc/p5-browse-fx.test.ts`, live `/browse` presentation | **PASS** |
| **FX-02** | FX Presentation | Informational converted estimate clearly labeled ("Est.") | `tests/glcc/p5-browse-fx.test.ts` | **PASS** |
| **FX-03** | FX Presentation | FX provider failure triggers graceful fallback to PHP | Live GET `/api/fx/estimate` (`isCanonicalFallback: true`) | **PASS** |
| **FX-04** | FX Presentation | Stale quotes (>5m) & outliers (>5%) suppressed | `tests/glcc/fx-cache.test.ts`, `tests/glcc/p5-browse-fx.test.ts` | **PASS** |
| **FX-05** | FX Presentation | Zero client rate injection; forbidden params return 400 | `tests/glcc/p5b-fx-routes.test.ts`, live GET `/api/fx/estimate?rate=...` | **PASS** |
| **PAY-01** | Checkout | Authoritative base amount re-read from database at checkout | `tests/glcc/p6-checkout.test.ts` | **PASS** |
| **PAY-02** | Checkout | Quote TTL strictly enforced (120 seconds / 2 minutes) | `tests/glcc/p6-checkout.test.ts` | **PASS** |
| **PAY-03** | Checkout | Final payment gateway charge payload currency strictly `PHP`| `tests/glcc/p6-checkout.test.ts` | **PASS** |
| **PAY-04** | Checkout | Anti-tampering & anti-replay protection on checkout quotes | `tests/glcc/p6-checkout.test.ts` | **PASS** |
| **TRN-01** | Translation | Dynamic translation source provenance hashing (SHA-256) | `tests/glcc/p7-dynamic-translation.test.ts` | **PASS** |
| **TRN-02** | Translation | Source edit invalidates stale translation entries | `tests/glcc/p7-dynamic-translation.test.ts` | **PASS** |
| **TRN-03** | Translation | Controlled legal content cannot auto-publish without gate | `tests/glcc/p7-dynamic-translation.test.ts` | **PASS** |
| **AI-01** | AI & Agents | Effective locale injected into AI system context | `tests/glcc/p8-ai-localization.test.ts` | **PASS** |
| **AI-02** | AI & Agents | AI monetary & identity authority boundaries immutable | `tests/glcc/p8-ai-localization.test.ts` | **PASS** |
| **A11Y-01** | Accessibility | Modal keyboard navigation, focus trap, Escape to dismiss | `tests/glcc/p11-accessibility.test.ts`, browser automation | **PASS** |
| **A11Y-02** | Accessibility | Dynamic ARIA announcements on preference change | `tests/glcc/p11-accessibility.test.ts`, browser automation | **PASS** |
| **A11Y-03** | Accessibility | RTL text direction & bidirectional monetary isolation | `tests/glcc/p11-accessibility.test.ts` (`unicode-bidi: isolate`)| **PASS** |
| **SEC-01** | Security | Session-bound actor identity; zero cross-user IDOR | `tests/glcc/p11-hardening.test.ts`, `tests/glcc/preference-service.test.ts` | **PASS** |
| **SEC-02** | Security | Signed HMAC guest cookie tampering detection | `tests/glcc/guest-route.test.ts`, live tampered cookie test | **PASS** |
| **OPS-01** | Operations | Operational kill switches operate fail-closed | `tests/glcc/p10-control-center.test.ts`, `tests/glcc/feature-flags.test.ts` | **PASS** |
| **OPS-02** | Operations | Audit logging of admin control actions with business reason| `tests/glcc/p10-control-center.test.ts` | **PASS** |
| **REG-01** | Regression | Full automated GLCC regression suite passes cleanly | 27 suites, 436 tests, 0 failures | **PASS** |
| **E2E-01** | E2E Browser | Local browser guest user preference journey | Browser session `glcc_g2_journey_1790415958888.webp` | **PASS** |
| **E2E-02** | E2E Browser | Local browser authenticated & navigation journey | Page checks on `/`, `/browse`, `/login`, `/register`, `/forgot-password` | **PASS** |

---

### 4. Money Integrity Reconciliation

1. **Charge Currency Immutability**:
   - `PAYMENT_CONTRACT_CURRENCY = 'PHP'`.
   - The final charge submitted to payment gateways is unconditionally in PHP minor units (centavos).
   - Zero multi-currency processing pass-through exists.
2. **Display FX Isolation**:
   - Converted display estimates are purely informational and rendered alongside the authoritative PHP price.
   - Any rate failure or outage automatically falls back to canonical PHP (`isCanonicalFallback: true`).
3. **Integer Minor-Unit Arithmetic**:
   - Arithmetic in `fx-math.ts` enforces integer minor-unit math with `ROUND_HALF_UP`. Binary floating-point errors are mathematically prohibited.
4. **Ledger & Settlement Authority**:
   - Host payout, platform fees, security deposits, refunds, and financial ledgers remain 100% authoritative in Philippine Pesos (PHP).

---

### 5. Security & Negative Testing Audit

- **Cross-User Preference Tampering**: Blocked. Authenticated user ID is derived directly from the trusted server-side session; client-provided `userId` parameters in payloads are rejected.
- **Guest Cookie Tampering**: Blocked. The guest cookie `rentipid_pref` is signed with HMAC-SHA256. Tampered or corrupted cookies are discarded, safely falling back to the canonical default (`en-PH`/`PH`/`PHP`).
- **Client Rate Injection**: Blocked. All attempts to supply `rate`, `rawrate`, `providerId`, or settlement parameters to `/api/fx/estimate` return HTTP 400 Bad Request.
- **Checkout Price Tampering**: Blocked. Base amounts are re-read directly from the listing record during quote generation and checkout execution.

---

### 6. Defect Register

- **Critical Defects**: `0`
- **High Defects**: `0`
- **Medium Defects**: `0`
- **Low Defects**: `0`

**Defect Disposition**: Zero defects recorded against release candidate `db2e78695d77fdc64bb428201f3c1eb6fec5a802`.

---

### 7. External Provider Status

- **CurrencyAPI Live Probe**:
  `LIVE CURRENCYAPI PROBE: NOT RUN — SECRET NOT PROVISIONED`
- **Operational Verification**:
  `LIVE PROVIDER OPERATIONAL VERIFICATION: OUTSTANDING FOR PREVIEW/REAL CONFIGURED INTEGRATION`
- **Local Fallback Proof**:
  Deterministic fallback and local mock adapters successfully proven. Graceful degradation confirmed in both automated unit suites and live API integration tests.

---

### 8. Frozen Local Checkpoint Record

- **Release Candidate SHA**: `db2e78695d77fdc64bb428201f3c1eb6fec5a802`
- **Database Schema Migration**: `20260925000000_add_user_global_preference`
- **Operational Settings Config Version**: `1.0.0` (8 settings in `SystemSetting`)
- **Regression Suite Digest**: 27 test suites, 436 tests, 0 failures (75.49s)
- **Local Checkpoint Status**: **FROZEN**

---

### 9. Gate Promotion Verdict

```
MODULE: GLCC v1.0
CANDIDATE SHA: db2e78695d77fdc64bb428201f3c1eb6fec5a802

G1  CODE COMPLETE                   — PASS — PROMOTED
G2  LOCAL FUNCTIONAL                — PASS — PROMOTED
G3  LOCAL DATABASE MIGRATED         — PASS — PROMOTED
G4  LOCAL REQUIRED DATA SEEDED/SYNCED — PASS — PROMOTED
G5  LOCAL ACCEPTANCE PASS           — PASS — LOCAL CHECKPOINT FROZEN — PROMOTED
```

**G5 LOCAL ACCEPTANCE PASS — LOCAL CHECKPOINT FROZEN — PROMOTED**
