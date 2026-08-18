# RENTipid Global Address System — Pass 3 Final Codex Verification

Date: 2026-08-10 (Asia/Shanghai)  
HEAD: `e57ee87bd06f4b19bc5de5eec41773f4d383bca5`  
Decision: `CODEX_PASS3_FINAL_CRITICAL_BLOCKER`

## Scope and documentation mismatch

This was a focused verification of only the application gates left partial or unresolved in `codex-pass2-final-review.md`. Migration history parity and migration safety were treated as frozen.

`docs/address-system/codex-remediation-pass-3-summary.md` does not exist. The instructed fallback, `codex-remediation-pass-2-summary.md`, still identifies itself as Pass 2 and contains the same completion claims disproven by the prior review. It does not document the latest work. Consequently, no authoritative Pass 3 changed-file manifest exists; changed-file lint used the identifiable Address/Profile source and test files whose current contents implement or test the claimed Pass 3 changes.

No product source, schema, migration, or repository test was modified. Verifier-only test files and one uniquely named local PostgreSQL database were created temporarily and removed after use. No live Google API was called.

## Commands and executable evidence

- Focused `git status`, `rg`, and direct source/test inspection.
- Full checked-in migration deployment only to initialize `rentipid_codex_address_pass3_20260810`, a uniquely named disposable local database.
- Repository Address suite against that disposable database using a verifier config without the repository's exact-name test guard.
- Verifier-only, non-mocked PostgreSQL limiter concurrency tests.
- Verifier-only DB-backed encrypted Address round-trip/tamper/zero test.
- Deterministic strict-validation, coordinate, and mocked Google error probes.
- Legacy migration `--dry-run` invocation against the disposable database.
- Exact identifiable Pass 3 changed-file ESLint.
- `npx tsc --noEmit --pretty false`.
- `npx prisma validate` and `npx prisma generate`.

No `db push`, `db push --accept-data-loss`, `migrate reset`, shared/production database write, global Node termination, or live provider request occurred.

## Gate results

### Migration gates

MIGRATION HISTORY PARITY: PASS  
MIGRATION SAFETY: PASS

The current chain deployed successfully as the disposable test fixture and showed no regression. The previously established parity/safety decision remains frozen.

### 1. Atomic rate limiter

ATOMIC RATE LIMITER: PASS

The implementation now makes the increment and decision from the same PostgreSQL `INSERT ... ON CONFLICT ... RETURNING points` statement.

RATE LIMIT RESULT:

| LIMIT | ATTEMPTS | ALLOWED | DENIED |
|---:|---:|---:|---:|
| 60 | 80 | 60 | 20 |
| 1 | 2 | 1 | 1 |

The authoritative verifier test used the real limiter and PostgreSQL table with no limiter mock. The repository limiter file also ran six tests successfully. Trusted-proxy policy and probabilistic cleanup remain secondary risks, but the required atomic ceiling is proven.

### 2. Canonical decryption / encryption round trip

CANONICAL DECRYPTION: PASS

A real Address row was inserted with all sensitive values protected through `ProfileFieldProtection`. Stored ciphertext did not contain the street or postal plaintext. Reading the fetched row through `AddressService.readNormalizedAddress()` returned the original values. Tampered ciphertext returned null safely; latitude 0, longitude 0, and 0,0 survived.

Both the Profile page and Profile GET currently call the same `AddressService.readNormalizedAddress()` reader.

The new repository crypto tests are object-level rather than DB-backed, but their three cases passed; the verifier supplied the missing database-backed proof.

### 3. IDOR

IDOR: FAIL

`profile-address-idor.test.ts` ran successfully, but its single ownership case proves only that a client ID cannot redirect a personal update and that User B receives a distinct personal Address. It does not test:

- User B clearing User A's personal Address;
- business Address update, clear, or replacement by User B;
- client ID selection of User A's business row;
- positive authorized business update.

Its second test clears User A's already-null business relation and is not a business IDOR test. Required personal/business ownership coverage is incomplete.

### 4. Server-authoritative provider token

SERVER-AUTHORITATIVE ADDRESS: FAIL

The token binds the listed canonical fields and now receives strict post-decrypt schema validation. Profile persistence generally derives canonical and legacy values from verified token data. Remaining failures:

- when the signed token has null `addressLine2`, unsigned browser `addressLine2` is accepted;
- `manuallyEdited` remains browser-derived;
- no field-by-field tamper test exists for line1, line2, postal, country, coordinates, place ID, and validation status;
- no wrong-user token test exists;
- no test proves manual Google/VALIDATED fabrication is downgraded or rejected;
- the repository valid-token test fails because its payload no longer satisfies the stricter token schema.

Repository Address token result: 2 passed, 1 failed.

### 5. Strict validation

STRICT VALIDATION: FAIL

Deterministic outcomes:

- Rejected: `ZZ`, `USA`, unknown provider/status, oversized token/place ID/Address field, NaN, Infinity, latitude ±91, longitude ±181.
- Accepted incorrectly: unknown object fields.
- Accepted incorrectly: a browser payload claiming `provider=google`, `validationStatus=VALIDATED`, and a fabricated place ID without a token.

Country validation now uses registry membership rather than regex alone. The main Address object remains non-strict and has no cross-field provider-token rule.

### 6. Business Address lifecycle

BUSINESS ADDRESS: FAIL

No test performs business CREATE, UPDATE, decrypted RELOAD, then CLEAR while proving personal Address isolation. The only business test clears a relation that was never populated. Clear nulls the encrypted legacy value and canonical relation but can leave plaintext `business_address` stale.

### 7. Dual write and transaction

DUAL WRITE: FAIL  
TRANSACTION ROLLBACK: FAIL

Canonical and encrypted legacy values now derive from the same verified source for most provider fields and execute within one transaction. However:

- no personal/business parity test exists;
- no clear-parity test covers plaintext legacy fields;
- no injected transaction rollback test exists;
- no repeat-save idempotency test exists;
- unsigned line2 remains accepted when absent from the token.

### 8. Google provider semantics

GOOGLE PROVIDER: FAIL

Mocked deterministic results:

| Condition | Observed |
|---|---|
| No results | `NO_RESULTS` |
| HTTP 500 | `PROVIDER_UNAVAILABLE` |
| HTTP 429 | `PROVIDER_UNAVAILABLE` |
| HTTP 400 | `PROVIDER_UNAVAILABLE` |
| Missing configuration | exception thrown |

`RATE_LIMITED`, `INVALID_PROVIDER_REQUEST`, and `PROVIDER_CONFIGURATION_MISSING` are not emitted. Provider errors do not become `NO_RESULTS`, but the required distinct semantics are absent.

### 9. Session / request control

SESSION CONTROLS: FAIL

The client still uses `Math.random() + Date.now()`, resets the session token immediately after invoking the asynchronous Details callback, has no monotonic latest-request-wins sequence, and does not reset/abort reliably on country or manual-mode changes. No reversed-response or session-lifecycle component test exists.

### 10. PII logging

PII LOGGING: FAIL

No log-capture test exists. Profile PATCH still logs the raw error object. The legacy script logs a raw connection error and profile identifiers. Address routes/provider mostly use constant messages, but the complete required street/postal/coordinate/token/provider-payload non-disclosure proof is absent.

### 11. Country change

COUNTRY CHANGE: FAIL

No required component tests exist. The confirmation predicate still omits postal-only, administrative-area-2, formatted-address, coordinate-only, and provider/validation-only states. Cancel/Confirm preservation and clearing are unproved.

### 12. Accessibility

ACCESSIBILITY: FAIL

No Address component, browser, or axe test exists. Labels remain inconsistently associated with inputs; Tab is not handled; loading/error/no-result rows are exposed as listbox options; Escape behavior is conditional on suggestions; keyboard focus/manual fallback is unproved.

### 13. Coordinate boundaries

COORDINATES: FAIL

The Zod schema accepts 0, ±90, and ±180 and rejects NaN, ±Infinity, ±91, and ±181. The unchecked `normalizeAddress()` path still passes Infinity and out-of-range values; Google Details calls that normalizer without schema validation. DB-backed 0,0 persistence passed, but the complete application path is unsafe.

### 14. Legacy migration safety

LEGACY MIGRATION: FAIL

The isolated `--dry-run` could not start because the CLI import chain throws from `server-only`. Static inspection also confirms default invocation writes unless `--dry-run` is supplied, no explicit `--execute` or database confirmation/guard exists, output includes identifiers/raw connection errors, concurrent runs are unlocked, and required failure/idempotency tests are absent.

### 15. Environment configuration

ENV CONFIG: FAIL

`.env.example` has the empty key but no server-only / never-`NEXT_PUBLIC_` / secret-management guidance. `.env.production.example` lacks `GOOGLE_MAPS_API_KEY=` entirely. No real key was found.

## 16. Test inventory and results

Exactly five repository Address test files exist:

- `tests/address-system/address-api.test.ts`
- `tests/address-system/address-rate-limit.test.ts`
- `tests/address-system/address-token.test.ts`
- `tests/address-system/profile-address-crypto.test.ts`
- `tests/address-system/profile-address-idor.test.ts`

Repository Address suite: **4 suites passed, 1 failed; 18 tests passed, 1 failed, 19 total**.

| Required category | Test file | Run | Result |
|---|---|---|---|
| Country Registry | — | NOT RUN | NO TEST |
| Normalizer | — | NOT RUN | NO TEST |
| Google Adapter | — | NOT RUN | NO TEST |
| Google Error Mapping | verifier-only deterministic probe | RUN | FAIL |
| Address Token | `address-token.test.ts` | RUN | FAIL |
| Strict Validation | verifier-only deterministic probe | RUN | FAIL |
| Personal Persistence | `profile-address-idor.test.ts` limited create/update | RUN | PASS |
| Business Persistence | only empty clear case | RUN | FAIL |
| Personal IDOR | `profile-address-idor.test.ts` limited ID/update case | RUN | FAIL |
| Business IDOR | — | NOT RUN | NO TEST |
| Transaction Rollback | — | NOT RUN | NO TEST |
| Rate Limiter | `address-rate-limit.test.ts` | RUN | PASS |
| Real Rate Limiter Concurrency | verifier-only real PostgreSQL | RUN | PASS |
| Manual Fallback | — | NOT RUN | NO TEST |
| Country Change | — | NOT RUN | NO TEST |
| Accessibility | — | NOT RUN | NO TEST |
| Zero Coordinates | crypto test plus DB-backed verifier | RUN | PASS |
| International PH | — | NOT RUN | NO TEST |
| International US | — | NOT RUN | NO TEST |
| International CA | — | NOT RUN | NO TEST |
| International GB | — | NOT RUN | NO TEST |
| International AU | — | NOT RUN | NO TEST |
| International SG | — | NOT RUN | NO TEST |
| International JP | — | NOT RUN | NO TEST |
| Legacy Migration Safety | isolated `--dry-run` | RUN | FAIL |
| Dual Write | — | NOT RUN | NO TEST |
| Targeted E2E | — | NOT RUN | NO TEST |

The verifier-only authoritative database suite passed 3/3: concurrency 60/80, concurrency 1/2, and encrypted DB round-trip/tamper/0,0. The validation/provider verifier suite failed all 3 required-behavior assertions and recorded the exact outcomes above.

## 17. Lint

CHANGED-FILE LINT: FAIL  
ERRORS: 20  
WARNINGS: 10

Because the Pass 3 summary/manifest is missing, the scope was the identifiable current remediation files: Profile route/page; Address service, limiter, token, and types; Profile field protection; and all five Address tests. Failures include explicit `any`, forbidden `require`, unused variables/imports, and three `prefer-const` errors in the new IDOR test.

## 18. TypeScript

ADDRESS TYPESCRIPT: FAIL  
DIAGNOSTICS: 15

All 15 repository diagnostics are Address-scoped `TS18047` errors in `profile-address-crypto.test.ts`, where `readNormalizedAddress()` results are dereferenced without a null check.

Repository TypeScript also fails with the same 15 diagnostics; no unrelated diagnostic appeared in this run.

## 19. Prisma

PRISMA VALIDATE: PASS  
PRISMA GENERATE: FAIL

Generate failed with Windows `EPERM` while renaming the Prisma query engine. Only RENTipid workspace processes were inspected: PIDs 29292 (Next dev), 29188 (Next start-server), and 29080 (the workspace `.next/dev` build) were active. No process was terminated.

## 20. Targeted E2E

TARGETED E2E: NO TEST

No Address E2E covers login, Profile edit, country/search/suggestion/Details/save/reload/decryption, manual fallback, country change, provider failure, business Address, or keyboard selection.

## 21. Browser verification

BROWSER VERIFICATION: NOT VERIFIED

No deterministic Address browser test exists for desktop, mobile, keyboard-only, personal/business, manual fallback, country change, provider unavailable, or save/reload.

## 22. Production build

PRODUCTION BUILD: FAIL_ADDRESS

The build was not run because the user-specified prerequisite—Address TypeScript passing—failed with 15 Address diagnostics. This is classified `FAIL_ADDRESS`; the unrelated SOC module was not modified.

LIVE GOOGLE API USED: NO

## Previous partial/unresolved finding verification

| ID | Previous status | Current status | Evidence and test evidence | Remaining risk |
|---|---|---|---|---|
| GAS-P1-002 | PARTIAL | PARTIAL | Personal client-ID update test passes; cross-user personal clear and all business IDOR tests absent. | Ownership regressions unproved. |
| GAS-P1-003 | PARTIAL | PARTIAL | Only empty business clear tested; create/update/reload/isolation absent; plaintext legacy clear stale. | Business lifecycle unsafe/unproved. |
| GAS-P1-005 | PARTIAL | RESOLVED | Real DB ciphertext/reader round-trip, tamper-safe null, and 0,0 passed; page and GET share reader. | Repository test is not DB-backed, but verifier evidence closes gate. |
| GAS-P1-006 | UNRESOLVED | PARTIAL | Real limiter concurrency now passes exactly; session/client controls still fail. | Late response/token lifecycle errors. |
| GAS-P2-001 | PARTIAL | PARTIAL | Registry/bounds/enums improved; unknown fields and fabricated provider metadata accepted; token suite fails. | Inconsistent/fabricated state. |
| GAS-P2-002 | PARTIAL | PARTIAL | Transaction exists; no rollback or idempotency test. | Atomic failure behavior unproved. |
| GAS-P2-003 | UNRESOLVED | UNRESOLVED | Dry-run cannot import; default writes; no execute/DB guard/concurrency protection/tests. | Unsafe operator execution. |
| GAS-P2-004 | PARTIAL | PARTIAL | POST and constant provider logs help; raw Profile/script errors and no capture test remain. | PII telemetry exposure. |
| GAS-P2-005 | PARTIAL | PARTIAL | Predicate still incomplete; no Cancel/Confirm test. | Mixed-country state. |
| GAS-P2-006 | PARTIAL | PARTIAL | Interaction defects and no component/axe test remain. | Accessibility not approved. |
| GAS-P2-007 | PARTIAL | PARTIAL | Schema boundaries and DB zero pass; unchecked normalizer accepts invalid values. | Invalid provider coordinates. |
| GAS-P2-009 | PARTIAL | PARTIAL | Five test files now exist, but suite is 18/19 and most required categories remain absent. | Insufficient regression evidence. |
| GAS-P2-010 | UNRESOLVED | UNRESOLVED | Pass 3 lint is 20 errors and 10 warnings. | Required zero-warning gate fails. |
| GAS-P2-011 | PARTIAL | PARTIAL | Verified-source dual write improved; parity/clear/rollback tests absent and plaintext clears stale. | Legacy rollback divergence. |
| GAS-P3-001 | PARTIAL | PARTIAL | Development key only; production entry and security guidance absent. | Production provider config incomplete. |

Previously resolved findings retained without regression:

- GAS-P1-001 migration parity: RESOLVED.
- GAS-P1-004 supported Google Autocomplete request: RESOLVED.
- GAS-P2-008 country-first default flow: RESOLVED.
- GAS-P2-012 runtime Prisma singleton: RESOLVED.
- GAS-P3-002 minimal country artifact: RESOLVED.
- GAS-P3-003 international labels: RESOLVED.

## Final finding counts

P1 ORIGINAL: 6  
P1 RESOLVED: 3  
P1 PARTIAL: 3  
P1 UNRESOLVED: 0

P2 ORIGINAL: 12  
P2 RESOLVED: 2  
P2 PARTIAL: 8  
P2 UNRESOLVED: 2

P3 ORIGINAL: 3  
P3 RESOLVED: 2  
P3 PARTIAL: 1  
P3 UNRESOLVED: 0

## Final quality summary

MIGRATION HISTORY PARITY: PASS  
MIGRATION SAFETY: PASS

ATOMIC RATE LIMITER: PASS

RATE LIMIT RESULT:  
LIMIT: 60  
ATTEMPTS: 80  
ALLOWED: 60  
DENIED: 20

SECOND RATE LIMIT RESULT:  
LIMIT: 1  
ATTEMPTS: 2  
ALLOWED: 1  
DENIED: 1

CANONICAL DECRYPTION: PASS  
IDOR: FAIL  
SERVER-AUTHORITATIVE ADDRESS: FAIL  
STRICT VALIDATION: FAIL  
BUSINESS ADDRESS: FAIL  
DUAL WRITE: FAIL  
TRANSACTION ROLLBACK: FAIL  
GOOGLE PROVIDER: FAIL  
SESSION CONTROLS: FAIL  
PII LOGGING: FAIL  
COUNTRY CHANGE: FAIL  
ACCESSIBILITY: FAIL  
COORDINATES: FAIL  
LEGACY MIGRATION: FAIL  
ENV CONFIG: FAIL

UNIT TESTS: FAIL  
INTEGRATION TESTS: FAIL  
SECURITY TESTS: FAIL  
INTERNATIONAL TESTS: FAIL  
COMPONENT TESTS: FAIL  
TARGETED E2E: NO TEST

CHANGED-FILE LINT: FAIL  
ERRORS: 20  
WARNINGS: 10

ADDRESS TYPESCRIPT: FAIL  
DIAGNOSTICS: 15

PRISMA VALIDATE: PASS  
PRISMA GENERATE: FAIL  
BROWSER VERIFICATION: NOT VERIFIED  
PRODUCTION BUILD: FAIL_ADDRESS  
LIVE GOOGLE API USED: NO

## Final decision

`CODEX_PASS3_FINAL_CRITICAL_BLOCKER`

SAFE_FOR_LOCAL_TESTING: YES  
SAFE_FOR_PREVIEW_DEPLOYMENT: NO  
SAFE_FOR_PRODUCTION_CODE_DEPLOYMENT: NO  
PRODUCTION_DATABASE_MIGRATION_APPROVED: NO  
LIVE_GOOGLE_CONFIGURATION_REQUIRED: YES

The atomic limiter and canonical encrypted read path are now executable passes. Preview/production remain blocked by incomplete IDOR evidence, incomplete provider-token authority, strict-validation gaps, unproved business/dual-write/rollback behavior, failing provider/session/country/accessibility/legacy gates, a failing Address suite, lint and Address TypeScript failures, Prisma Generate failure, and no targeted E2E/browser verification.
