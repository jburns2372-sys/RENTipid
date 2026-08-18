# RENTipid Global Address System — Pass 4 Final Codex Review

Date: 2026-08-10 (Asia/Shanghai)  
HEAD: `e57ee87bd06f4b19bc5de5eec41773f4d383bca5`  
Decision: `CODEX_PASS4_FINAL_CRITICAL_BLOCKER`

## Scope and method

This review inspected and executed only the Pass 4 Address-controlled gates and lightweight regressions of the frozen migration, limiter, canonical reader, and Prisma singleton controls. No product code, migration, or repository test was remediated.

A uniquely named disposable local PostgreSQL database, `rentipid_codex_address_pass4_20260810`, was created for Jest/database proofs, populated only through checked-in migrations, and removed afterward. Verifier-only files were also removed. No production, preview, shared development, or shared SOC database was mutated. No live Google API was used.

## 1. Pass 4 summary integrity

SUMMARY_EVIDENCE: FAIL

`codex-remediation-pass-4-summary.md` lists PASS outcomes but supplies no test filenames, test names, commands, timestamps, or command output. Independent inspection found:

- only six repository Address Jest files and 21 tests;
- no lifecycle, rollback, dual-write, component, accessibility, session, country-change, international, PII logging, or legacy migration test;
- a targeted E2E that can return successfully without exercising any Address UI;
- lint errors/warnings despite the claimed zero/zero;
- failing strict-validation and provider-semantic probes;
- unsafe/shared E2E database behavior.

The claimed `GLOBAL_ADDRESS_PASS4_COMPLETE` is unsupported.

## 2. Coordinate validation

COORDINATE_VALIDATION: PASS

`normalizeAddress()` preserves 0,0 and exact ±90/±180 boundaries and throws for ±91, ±181, NaN, Infinity, and -Infinity. It does not clamp or silently convert invalid values. The two repository normalizer tests passed. The Details service catches normalization/provider failure and returns a controlled null/error response rather than allowing invalid coordinates to persist.

## 3. E2E database isolation

DB_ISOLATION: FAIL

Sanitized environment inspection found both `DATABASE_URL` and `DIRECT_URL` in `.env.test.local` target local database `rentipid_test_soc`, with mutation enabled. The global test guard requires that exact database name, and unrelated Jest/Playwright suites use the same configuration; it is therefore persistent shared SOC test state, not a uniquely controlled Address E2E database.

The Address E2E:

- executes `prisma db push --accept-data-loss`;
- upserts fixed user `e2e_user_1`;
- has no afterAll cleanup;
- uses the same shared database as unrelated test suites;
- has no transaction/namespace isolation.

The exact Playwright command was not executed because doing so would violate the review's shared-database safety rule.

## 4. Authentication boundary

AUTH_BOUNDARY: FAIL

The E2E inserts a random 32-byte hex string as `next-auth.session-token`; it is not produced by RENTipid/NextAuth signing or encryption. It also intercepts the internal `/api/auth/session` route. The real server-side Profile route still calls normal `getServerSession(authOptions)`, which will not authenticate that arbitrary cookie. Existing repository E2E helpers perform real credentials login, but the Address E2E does not use them.

## 5. Real RENTipid E2E stack

REAL_RENTIPID_ROUTES: FAIL  
EXTERNAL_GOOGLE_ONLY_MOCKED: NO

The test does not mock `/api/profile`, autocomplete, or Details directly, but it does not prove they execute:

- it navigates to non-existent `/profile` instead of the real dashboard Profile route;
- selectors `global_address_input`, `address_line_1`, and `address_line_2` do not exist in the real components;
- if the first selector is absent, the test logs and returns without assertions;
- it mocks the internal NextAuth session route;
- Google interception patterns target legacy `maps/api/place/.../json` URLs, while the adapter uses Places API (New) `places.googleapis.com/v1/places:autocomplete` and `/v1/places/{id}`.

Thus the reported one-test pass can be a no-op false positive and does not prove Profile UI, internal routes, token creation/verification, transaction, persistence, or decrypted reload. The configured mock is not a reliable mock of the actual external Google boundary.

## 6. Server-authoritative token

SERVER-AUTHORITATIVE_ADDRESS: FAIL

Static implementation improved: the encrypted token contains the complete listed canonical payload, authenticated user ID, and expiry; verify performs strict post-decrypt token schema validation; valid provider persistence replaces browser canonical fields with verified token values and sets `manuallyEdited=false`.

Executable closure is absent:

- token tests cover only valid round-trip, expiry, and reversed-token tamper;
- no request-level field mismatch tests exist for line1, line2, postal, country, coordinates, place ID, and validation status;
- no wrong-user persistence test exists;
- no manual Google/VALIDATED fabrication persistence test exists;
- invalid/wrong-user tokens are downgraded and persisted as manual rather than rejected;
- the E2E declares an unused mock token and never performs the claimed malicious PATCH.

## 7. IDOR

PERSONAL_IDOR: FAIL  
BUSINESS_IDOR: FAIL  
IDOR: FAIL

The two database-backed Profile tests passed, but coverage remains unchanged: one personal client-ID/update case and one clear of an already-empty business relation. There is no cross-user personal clear test, no business update/replace/clear ownership test, no business identifier-injection test, and no positive authorized business mutation test.

## 8. Business lifecycle

BUSINESS_LIFECYCLE: FAIL

No test performs CREATE, UPDATE, decrypted RELOAD, CLEAR, reload-after-clear, legacy parity, and personal isolation. Code still clears `business_address_encrypted` but can leave plaintext `business_address` stale.

## 9. Dual write / transaction

DUAL_WRITE: FAIL  
TRANSACTION_ROLLBACK: FAIL

Provider legacy data is now constructed from the verified source and writes share one Prisma transaction. No personal/business parity, clear parity, repeat-save, injected personal/business rollback, successful retry, or stale plaintext legacy test exists.

## 10. Atomic limiter regression

ATOMIC_RATE_LIMITER: PASS

Real PostgreSQL, no limiter mock:

| LIMIT | ATTEMPTS | ALLOWED | DENIED |
|---:|---:|---:|---:|
| 60 | 80 | 60 | 20 |
| 1 | 2 | 1 | 1 |

The repository limiter suite also passed its six tests.

## 11. Strict validation

STRICT_VALIDATION: FAIL

Independent deterministic probe results:

- correctly rejected: ZZ, USA, unknown provider/status, oversized token/place ID/field, NaN, ±Infinity, latitude ±91, longitude ±181;
- incorrectly accepted: unknown object fields;
- incorrectly accepted: fabricated `google` + `VALIDATED` + place ID metadata without a selection token.

Country validation uses registry membership, but the main Address schema is not strict and has no provider-token cross-field rule.

## 12. Google provider semantics

GOOGLE_PROVIDER: FAIL

Mocked outcomes:

| Condition | Observed |
|---|---|
| no matches | `NO_RESULTS` |
| HTTP 500 | `PROVIDER_UNAVAILABLE` |
| HTTP 429 | `PROVIDER_UNAVAILABLE` |
| HTTP 400 | `PROVIDER_UNAVAILABLE` |
| missing key | exception |

`RATE_LIMITED`, `INVALID_PROVIDER_REQUEST`, and `PROVIDER_CONFIGURATION_MISSING` remain absent. Provider failures do not silently become `NO_RESULTS`, but required distinctions fail.

## 13. Client session controls

SESSION_CONTROLS: FAIL

The client still uses `Math.random() + Date.now()`, immediately resets after invoking asynchronous Details, lacks a monotonic latest-request-wins guard, and does not reset/abort reliably on country or manual-mode changes. No reversed-response, duplicate/session-token lifecycle, country-reset, or manual-reset test exists.

## 14. Country change

COUNTRY_CHANGE: FAIL

No component test covers the required manual/provider Cancel/Confirm states. The confirmation predicate still omits postal-only, administrative-area-2-only, coordinate-only (including zero), formatted-address-only, and provider/validation-only state. Cancel preservation and Confirm clearing remain unproved.

## 15. Accessibility

ACCESSIBILITY: INCOMPLETE

There is no Address component interaction or axe test. Static gaps remain:

- labels are not consistently connected with `htmlFor` and input IDs;
- no `aria-autocomplete`;
- Tab behavior is untested/unhandled;
- Escape handling returns early unless the list has suggestions;
- loading, errors, and no-results are represented as selectable options;
- visible keyboard focus and manual fallback keyboard flow are untested.

The single Playwright file has no accessibility assertions and is not an acceptable baseline.

## 16. International behavior

INTERNATIONAL_TESTS: FAIL

No deterministic PH, US, CA, GB, AU, SG, or JP behavior test exists. Static registry data remains valid, but there is no normalization/validation proof that state/province and postal code are not universally required.

## 17. PII logging

PII_LOGGING: FAIL

No log-capture test exists. Profile GET/PATCH still log raw error objects; the legacy script logs raw connection errors and profile identifiers. No executable proof excludes synthetic street, formatted address, postal code, coordinates, token, and provider payload from failure logs.

## 18. Legacy migration safety

LEGACY_MIGRATION: FAIL

The isolated `--dry-run` fails before execution because the CLI import chain reaches `server-only`. Static defects remain:

- default invocation writes; no explicit `--execute`;
- no database confirmation/allowlist;
- no wrong-database test;
- raw/profile-identifying output;
- crypto fallback can treat ciphertext as plaintext;
- no per-record crypto construction isolation;
- no concurrent-run protection;
- no dry-run/default/idempotency/failure/concurrency test.

## 19. Test inventory

Repository Address Jest result: **6 suites passed, 21 tests passed, 0 failed, 0 skipped**. This is a real green result for the tests that exist, not evidence for missing categories.

| Category | File | Test count | Run? | Pass | Fail | Skip |
|---|---|---:|---|---:|---:|---:|
| Country Registry | — | 0 | NO | 0 | 0 | 0 |
| Normalizer | `address-normalizer.test.ts` | 2 | YES | 2 | 0 | 0 |
| Coordinates | `address-normalizer.test.ts` | 2 | YES | 2 | 0 | 0 |
| Google Adapter | — | 0 | NO | 0 | 0 | 0 |
| Provider Error Mapping | verifier-only probe | 1 | YES | 0 | 1 | 0 |
| Token | `address-token.test.ts` | 3 | YES | 3 | 0 | 0 |
| Strict Validation | verifier-only probe | 1 | YES | 0 | 1 | 0 |
| Personal Persistence | `profile-address-idor.test.ts` limited case | 1 | YES | 1 | 0 | 0 |
| Business Persistence | empty clear only | 1 | YES | 1 | 0 | 0 |
| Personal IDOR | limited update/client-ID case | 1 | YES | 1 | 0 | 0 |
| Business IDOR | — | 0 | NO | 0 | 0 | 0 |
| Rollback | — | 0 | NO | 0 | 0 | 0 |
| Dual Write | — | 0 | NO | 0 | 0 | 0 |
| Rate Limiter | `address-rate-limit.test.ts` | 6 | YES | 6 | 0 | 0 |
| Rate Concurrency | limiter tests + verifier | 3 | YES | 3 | 0 | 0 |
| Manual Fallback | — | 0 | NO | 0 | 0 | 0 |
| Country Change | — | 0 | NO | 0 | 0 | 0 |
| Accessibility | — | 0 | NO | 0 | 0 | 0 |
| Session Controls | — | 0 | NO | 0 | 0 | 0 |
| PII Logging | — | 0 | NO | 0 | 0 | 0 |
| PH | — | 0 | NO | 0 | 0 | 0 |
| US | — | 0 | NO | 0 | 0 | 0 |
| CA | — | 0 | NO | 0 | 0 | 0 |
| GB | — | 0 | NO | 0 | 0 | 0 |
| AU | — | 0 | NO | 0 | 0 | 0 |
| SG | — | 0 | NO | 0 | 0 | 0 |
| JP | — | 0 | NO | 0 | 0 | 0 |
| Legacy Migration | isolated dry-run | 1 | YES | 0 | 1 | 0 |
| Targeted Playwright E2E | `targeted-address-e2e.spec.ts` | 1 discovered | NO — unsafe | 0 | 0 | 0 |

The other repository Jest files contain five mocked API-route tests and three crypto-reader tests, all passing; they do not add the missing categories above.

## 20. Lint

CHANGED_FILE_LINT: FAIL  
ERRORS: 4  
WARNINGS: 3

The Pass 4 summary does not provide a changed-file manifest. ESLint covered the identifiable changed implementation/tests: Playwright config/E2E, normalizer/test, token/types/test, AddressService, Profile API, crypto test, and IDOR test.

Failures:

- two `no-explicit-any` errors and two unused-disable warnings in Profile API;
- two `prefer-const` errors in normalizer;
- one unused variable warning in targeted E2E.

## 21. TypeScript

ADDRESS TYPESCRIPT: PASS  
ADDRESS DIAGNOSTICS: 0  
REPOSITORY DIAGNOSTICS: 5

The normal repository command fails only in generated `.next/dev/types/routes.d.ts` with five parser diagnostics. A scoped configuration excluding generated `.next` artifacts reports zero Address diagnostics.

## 22. Prisma

PRISMA_VALIDATE: PASS  
PRISMA_GENERATE: PASS

Both commands completed successfully.

## 23. Playwright E2E

TARGETED_E2E: FAIL

TESTS DISCOVERED: 1  
TESTS EXECUTED: 0  
PASSED: 0  
FAILED: 0  
SKIPPED: 0  
SAFETY-BLOCKED: 1

The exact command was not executed because its beforeAll would run `db push --accept-data-loss` against shared `rentipid_test_soc`. Static proof also shows the test can return early on non-existent route/selectors and uses invalid authentication/provider mocks, so the prior reported one pass is not authoritative.

## 24. Browser coverage

BROWSER_VERIFICATION: NOT VERIFIED

Only Desktop Chrome is configured. There is no safe executed browser evidence for mobile, keyboard-only, personal/business lifecycle, manual fallback, country change, provider unavailable, or save/reload.

## 25. Production build

PRODUCTION_BUILD: FAIL_PRE_EXISTING_UNRELATED

`npm run build` generated Prisma Client successfully and reached Next production compilation. It failed at the previously documented unrelated `src/app/dashboard/admin/security/simulations/actions.ts:23` non-async Server Action. No Address build error preceded it. The unrelated SOC module was not modified.

## 26. Migration regression

MIGRATION_HISTORY_PARITY: PASS_FROZEN  
MIGRATION_SAFETY: PASS_FROZEN

Lightweight inspection found no destructive DROP/TRUNCATE/DELETE/type conversion in the reconciliation or Address migrations. The chain also deployed successfully as the disposable test fixture. No Pass 4 migration change was claimed or found requiring historical reconstruction.

LIVE GOOGLE API USED: NO

## Previously partial/unresolved finding verification

| ID | Previous status | Current status | Evidence | Test evidence | Remaining risk |
|---|---|---|---|---|---|
| GAS-P1-002 | PARTIAL | PARTIAL | Session-owned relation lookup remains; E2E auth is invalid. | Limited personal update/client-ID test passes; personal clear and business IDOR absent. | Cross-user clear/business regression unproved. |
| GAS-P1-003 | PARTIAL | PARTIAL | Business routing exists; plaintext legacy clear can remain stale. | Only already-empty business clear tested. | Full lifecycle and personal isolation unproved. |
| GAS-P1-006 | PARTIAL | PARTIAL | Atomic limiter remains fixed; client session controls remain defective. | Real 60/80 and 1/2 pass; no client ordering/token tests. | Late-result and token lifecycle errors. |
| GAS-P2-001 | PARTIAL | PARTIAL | Registry/bounds/enums improved; root object/cross-field trust rules incomplete. | Verifier proves unknown fields and fabricated trusted metadata pass. | Fabricated/inconsistent state. |
| GAS-P2-002 | PARTIAL | PARTIAL | Transaction remains in code. | No rollback, retry, or idempotency tests. | Atomic failure behavior unproved. |
| GAS-P2-003 | UNRESOLVED | UNRESOLVED | Default-live, no execute/DB guard, logging/concurrency defects; CLI import still fails. | Isolated dry-run FAIL at `server-only`. | Unsafe/unusable migration operation. |
| GAS-P2-004 | PARTIAL | PARTIAL | POST/constant route logs remain; raw Profile/script errors remain. | No PII log-capture test. | Sensitive telemetry exposure. |
| GAS-P2-005 | PARTIAL | PARTIAL | Country predicate still omits meaningful states. | No Cancel/Confirm component test. | Mixed-country state. |
| GAS-P2-006 | PARTIAL | PARTIAL | Static interaction/association defects remain. | No Address component/axe/browser accessibility test. | Keyboard/screen-reader flow unapproved. |
| GAS-P2-007 | PARTIAL | RESOLVED | Normalizer now rejects all invalid/non-finite boundaries and preserves valid zero/extremes. | 2/2 normalizer tests PASS. | None material in reviewed coordinate gate. |
| GAS-P2-009 | PARTIAL | PARTIAL | Six Jest files exist and pass 21/21; most mandatory categories and safe E2E remain absent. | Inventory documents NO TEST/unsafe categories. | Release-critical regression gaps. |
| GAS-P2-010 | UNRESOLVED | UNRESOLVED | Identifiable Pass 4 lint is 4 errors, 3 warnings. | ESLint FAIL. | Required zero/zero gate fails. |
| GAS-P2-011 | PARTIAL | PARTIAL | Verified-source dual write improved; stale plaintext clear risk remains. | No parity/rollback/retry tests. | Legacy rollback divergence. |
| GAS-P3-001 | PARTIAL | PARTIAL | Development example has an empty key; production example/guidance remain absent. | No configuration test. | Production provider configuration incomplete. |

## Final finding counts

P1 ORIGINAL: 6  
P1 RESOLVED: 3  
P1 PARTIAL: 3  
P1 UNRESOLVED: 0

P2 ORIGINAL: 12  
P2 RESOLVED: 3  
P2 PARTIAL: 7  
P2 UNRESOLVED: 2

P3 ORIGINAL: 3  
P3 RESOLVED: 2  
P3 PARTIAL: 1  
P3 UNRESOLVED: 0

## Final quality summary

MIGRATION HISTORY PARITY: PASS  
MIGRATION SAFETY: PASS

ATOMIC RATE LIMITER: PASS  
COORDINATE VALIDATION: PASS  
DB ISOLATION: FAIL  
AUTH BOUNDARY: FAIL  
REAL RENTIPID ROUTES: FAIL  
SERVER-AUTHORITATIVE ADDRESS: FAIL  
IDOR: FAIL  
BUSINESS LIFECYCLE: FAIL  
DUAL WRITE: FAIL  
TRANSACTION ROLLBACK: FAIL  
STRICT VALIDATION: FAIL  
GOOGLE PROVIDER: FAIL  
SESSION CONTROLS: FAIL  
COUNTRY CHANGE: FAIL  
ACCESSIBILITY: INCOMPLETE  
INTERNATIONAL: FAIL  
PII LOGGING: FAIL  
LEGACY MIGRATION: FAIL

UNIT TESTS: PASS  
INTEGRATION TESTS: FAIL  
SECURITY TESTS: FAIL  
COMPONENT TESTS: FAIL  
E2E: FAIL

LINT: FAIL  
ERRORS: 4  
WARNINGS: 3

ADDRESS TYPESCRIPT: PASS  
DIAGNOSTICS: 0

PRISMA VALIDATE: PASS  
PRISMA GENERATE: PASS  
BROWSER VERIFICATION: NOT VERIFIED  
PRODUCTION BUILD: FAIL_PRE_EXISTING_UNRELATED  
LIVE GOOGLE API USED: NO

## Final decision

`CODEX_PASS4_FINAL_CRITICAL_BLOCKER`

SAFE_FOR_LOCAL_TESTING: YES  
SAFE_FOR_PREVIEW_DEPLOYMENT: NO  
SAFE_FOR_PRODUCTION_CODE_DEPLOYMENT: NO  
PRODUCTION_DATABASE_MIGRATION_APPROVED: NO  
LIVE_GOOGLE_CONFIGURATION_REQUIRED: YES

Pass 4 closes coordinate validation and the prior Address TypeScript/Prisma failures while preserving atomic limiting, canonical encrypted reads, migration safety, and runtime singleton behavior. Preview and production remain blocked by unsafe/non-authoritative E2E isolation/authentication, missing security/lifecycle/rollback/component evidence, strict-validation and provider-semantic failures, client/country/accessibility/logging/legacy defects, and non-zero changed-file lint.
