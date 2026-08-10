# RENTipid Global Address System — Codex Pass 2 Final Review

Date: 2026-08-10 (Asia/Shanghai)  
Reviewer: Codex, independent remediation verifier  
HEAD: `e57ee87bd06f4b19bc5de5eec41773f4d383bca5`  
Decision: `CODEX_PASS2_FINAL_CRITICAL_BLOCKER`

## Scope and method

This was a focused re-review of the remaining blockers in `codex-final-review.md`, using `codex-remediation-pass-2-summary.md` only as a map. Completion claims were not treated as evidence. No source, schema, migration, package, or test was remediated.

Reviewed files:

- The three Address review/drift documents; `prisma/schema.prisma`; reconciliation and all three Address migrations.
- Address autocomplete/details routes; Profile API/page/client; all Address components.
- Address service, token, normalizer, Google provider, rate limiter, types, country data, Prisma singleton.
- Profile field protection/secret envelope; legacy migration script; both environment examples.
- All three files under `tests/address-system/`.

Unrelated modules were excluded except for the exact unrelated file reported by the production build.

## Commands and safety

Executed focused `git`/`rg` inspection, `npx prisma validate`, `npx prisma generate`, `npx jest tests/address-system --runInBand`, exact changed-file ESLint, `npx tsc --noEmit --pretty false`, deterministic validation/normalizer/country probes, a verifier-only PostgreSQL concurrency test, two disposable full-history migration rehearsals with `migrate deploy` and `migrate diff --exit-code`, `npm run build`, and a direct Next build diagnostic.

No `db push`, `db push --accept-data-loss`, `migrate reset`, shared/production write, or live Google request was used. Both uniquely named disposable databases and the transient verifier harness were removed.

## Gate verification

### 1. Migration history parity

**MIGRATION_HISTORY_PARITY: PASS**  
**PRODUCTION_MIGRATION_SQL: APPROVABLE**

The full historical chain deployed through `20260807000000`; reconciliation and all three Address migrations then deployed in order. A second development-like scenario with all six reconciliation columns already present also deployed. Synthetic personal/business legacy rows survived unchanged. Both final databases matched current `schema.prisma` with no relevant diff. The reviewed SQL is additive and contains no `DROP`, `TRUNCATE`, or `DELETE`; required FKs, unique relation indexes, and the rate-limit `resetAt` cleanup index exist.

This approves the SQL itself, not release of the failing application controls.

### 2. IDOR / ownership

**PERSONAL_IDOR_TEST: NO TEST**  
**BUSINESS_IDOR_TEST: NO TEST**  
**IDOR: FAIL**

The Profile route ignores client Address IDs and resolves existing IDs through the authenticated user's Profile relations. No automated test proves User A cannot mutate User B's personal/business Address, nor that authorized same-user personal/business updates work. Full resolution is therefore prohibited.

### 3. Business address lifecycle

**BUSINESS_ADDRESS_LIFECYCLE: FAIL**

Business payload routing and canonical unlink/delete improved. However, no create/update/reload/clear/provider-role/personal-isolation test exists; canonical reload uses the broken decrypt path; clear can leave plaintext `business_address` stale; and legacy dual-write uses browser rather than verified token data.

### 4. Server-authoritative Google Address

**SERVER_AUTHORITATIVE_ADDRESS: FAIL**

The encrypted token carries `userId`, expiry, and canonical fields, with AES-GCM integrity. It still fails the required authority boundary:

- signed `addressLine2` is explicitly overwritten with browser input;
- decrypted JSON is cast without post-decryption Zod validation;
- legacy dual-write uses unverified client fields;
- invalid/wrong-user tokens silently degrade to manual;
- no wrong-user, field/coordinate/country tamper, malformed payload, or replay/lifetime test;
- the browser session ID uses `Math.random() + Date.now()`.

Token tests cover only normal decrypt, expiry, and reversal-style ciphertext tampering.

### 5. Canonical Address encryption

**CANONICAL_ADDRESS_ENCRYPTION: FAIL**

Writes encrypt the intended canonical fields and the Address table has no parallel plaintext PII columns. The shared read path is broken: `AddressService.readNormalizedAddress()` passes names such as `ADDRESS_LINE_1`, while `ProfileFieldProtection.read()` accepts enum values such as `rentipid.profile.address.line1.v1`; values therefore resolve to null. No canonical persistence/read/tamper/zero integration test exists.

### 6. Dual write / rollback

**DUAL_WRITE: FAIL**  
**TRANSACTION_ROLLBACK: FAIL**

Canonical/Profile writes share a Prisma transaction, but legacy values are derived from browser data rather than the verified canonical payload, clear can leave plaintext legacy fields stale, and no parity, injected rollback, or repeat-save test exists.

### 7. Atomic rate limiter

**RATE_LIMITER_ATOMICITY: FAIL**

The upsert increment is atomic but allow/deny is not: an `$executeRaw` update is followed by a separate `$queryRaw` read. The verifier launched 80 simultaneous attempts against a limit of 60; **80 were allowed**. Routes also trust the first `x-forwarded-for` value without a trusted-proxy boundary, allowing key rotation via spoofed IP. Cleanup is probabilistic and logs the raw error. Repository tests use the obsolete one-argument API/outdated 100/50 limits and lack concurrency/reset/proxy/real-route coverage.

### 8. Google provider error semantics

**GOOGLE_PROVIDER_ERROR_MAPPING: FAIL**

`NO_RESULTS` and `PROVIDER_UNAVAILABLE` are distinct, but `RATE_LIMITED`, `INVALID_PROVIDER_REQUEST`, and `PROVIDER_CONFIGURATION_MISSING` are absent. Configuration absence and non-OK HTTP responses collapse to unavailable. No adapter/error-mapping test exists.

### 9. Client request control

**SESSION_CONTROL: FAIL**

Approximately 300 ms debounce and `AbortController` exist. There is no monotonic latest-request sequence; duplicate suppression is not safely country/session-scoped; country change does not reliably abort/reset the mounted instance; the ID is insecure; and selection resets the token before async Details completion. No reversed-response or token-lifecycle test exists.

### 10. Address PII logging

**PII_LOGGING: FAIL**

Autocomplete/Details use POST and scoped route logs omit payloads. The limiter still logs a raw cleanup error; the migration script logs raw connection errors/profile identifiers; no log-capture test proves street, postal, formatted address, latitude, and longitude remain absent. POST reduces URL exposure but TLS supplies transport confidentiality.

### 11. Country change

**COUNTRY_CHANGE: FAIL**

The confirmation predicate expanded but omits meaningful postal-only, administrative-area-2, formatted-address, coordinate, and provider/validation-only states. None of the required manual/Google Cancel/Confirm cases is tested.

### 12. Accessibility

**ACCESSIBILITY: FAIL**

Roles, active descendant, arrow/Enter/Escape handling, and an assertive live region exist. Labels are not consistently associated via `htmlFor`/input `id`; Tab is unimplemented; Escape returns early in empty/error states; loading/errors are exposed as options; Details error display can be immediately hidden by manual mode; no visible-focus, keyboard, component, or axe test exists.

### 13. Zero coordinates

**ZERO_COORDINATES: FAIL**

The normalizer now preserves numeric zero, including `0,0`. Its direct path still accepts `NaN`, `Infinity`, latitude 91, and longitude 181. No required boundary matrix or persistence round-trip test exists.

### 14. Strict validation

**STRICT_VALIDATION: FAIL**

A deterministic probe returned:

```text
ZZ accepted=true; USA accepted=false; unknown provider accepted=true;
huge token accepted=true; unknown field accepted=true;
NaN accepted=false; Infinity accepted=false.
```

Country validation checks only two-uppercase-letter shape, so `ZZ` passes. Provider is an enum unioned with unrestricted `z.string()`; selection token and validation level are unbounded; unknown keys are stripped rather than rejected; token payloads receive no post-decrypt validation/cross-field rules. No negative test exists.

### 15. Legacy migration script

**LEGACY_MIGRATION: FAIL**

The default is execution unless `--dry-run` is supplied; no explicit `--execute` opt-in or environment/database allowlist exists. Raw connection errors/profile IDs can be logged, crypto work can fail outside record isolation, corrupted ciphertext can be treated as plaintext, unknown-country text is placed in line 1, concurrent runs are unlocked, and the import path still reaches `server-only`. No dry-run/idempotency/failure test exists. It was not run because the missing guard makes implicit configuration unsafe.

### 16. Prisma client lifecycle

**PRISMA_SINGLETON: PASS**

Reviewed runtime Profile/Address code uses `@/lib/prisma`; no module-level `new PrismaClient()` remains there. Separately lifecycle-managed CLI/test clients are acceptable.

### 17. Environment configuration

**ENV_CONFIGURATION: FAIL**

`.env.example` has `GOOGLE_MAPS_API_KEY=` but lacks server-only, non-`NEXT_PUBLIC_`, and required-API restriction guidance. `.env.production.example` lacks the key. Neither contains a real secret.

### 18. Test suite inventory

Exactly three Address test files exist:

- `tests/address-system/address-api.test.ts`
- `tests/address-system/address-rate-limit.test.ts`
- `tests/address-system/address-token.test.ts`

Focused result: **2 suites passed, 1 failed; 8 tests passed, 4 failed, 12 total**. Limiter tests failed because the guarded test database lacks `AddressApiRateLimit`; a uniquely named rerun was rejected by the exact database-name guard. The separate verifier concurrency test reached the real disposable table and proved bypass.

| Required area | Test file / name | Run | Result |
|---|---|---|---|
| Country Registry | — | NOT RUN | NO TEST |
| Normalizer | — | NOT RUN | NO TEST |
| Google Adapter | — | NOT RUN | NO TEST |
| Google Error Mapping | — | NOT RUN | NO TEST |
| Address Token | `address-token.test.ts`: valid, expired, reversed/tampered | RUN | PASS |
| Strict Validation | — | NOT RUN | NO TEST |
| Personal Persistence | — | NOT RUN | NO TEST |
| Business Persistence | — | NOT RUN | NO TEST |
| IDOR Personal | — | NOT RUN | NO TEST |
| IDOR Business | — | NOT RUN | NO TEST |
| Transaction Rollback | — | NOT RUN | NO TEST |
| Rate Limiter | limiter sequential cases; API mocked 429 | RUN | FAIL |
| Rate Limiter Concurrency | verifier-only transient: 80 attempts/limit 60 | RUN | FAIL |
| Manual Fallback | — | NOT RUN | NO TEST |
| Country Change | — | NOT RUN | NO TEST |
| Accessibility | — | NOT RUN | NO TEST |
| Zero Coordinates | — | NOT RUN | NO TEST |
| International PH | — | NOT RUN | NO TEST |
| International US | — | NOT RUN | NO TEST |
| International CA | — | NOT RUN | NO TEST |
| International GB | — | NOT RUN | NO TEST |
| International AU | — | NOT RUN | NO TEST |
| International SG | — | NOT RUN | NO TEST |
| International JP | — | NOT RUN | NO TEST |
| Legacy Migration Dry Run | — | NOT RUN | NO TEST |
| Legacy Migration Idempotency | — | NOT RUN | NO TEST |
| Legacy Migration Failure | — | NOT RUN | NO TEST |
| Dual Write | — | NOT RUN | NO TEST |
| Targeted E2E | — | NOT RUN | NO TEST |

The API file's five and token file's three tests passed. API 429 tests mock the limiter and do not prove enforcement.

### 19. International coverage

**INTERNATIONAL_ADDRESS_TESTS: FAIL**

No deterministic PH/US/CA/GB/AU/SG/JP fixture test or country-specific optional-state/postal test exists. A static probe confirmed 250 minimal two-field records, zero duplicate alpha-2 codes, and correct representative records for all seven countries.

### 20. Lint

**CHANGED_FILE_LINT: FAIL — 29 errors, 19 warnings**

The exact Pass 2 scope produced 48 findings, including explicit `any`, forbidden CommonJS `require`, unused imports/variables/catches, and script style errors. Address/Profile issues are not classified as legacy.

### 21. TypeScript

**ADDRESS-SCOPED TYPESCRIPT: FAIL — 10 diagnostics**  
**REPOSITORY TYPESCRIPT: FAIL — 10 diagnostics**

All diagnostics are Address-scoped: `address-rate-limit.test.ts` supplies one argument to two-argument limiter methods. No unrelated TypeScript diagnostic appeared in this run.

### 22. Prisma validate / generate

**PRISMA_VALIDATE: PASS**  
**PRISMA_GENERATE: FAIL**

Generate failed with Windows `EPERM` renaming the Prisma engine. Scoped process inspection found active RENTipid npm/Next development processes holding that workspace engine; no global Node termination was attempted.

### 23. Targeted Address E2E

**TARGETED_ADDRESS_E2E: NO TEST**

No deterministic Address E2E covers login, Profile edit, country/search/suggestion/Details/save/reload, manual fallback, country change, provider failure, and business address.

### 24. Production build

**PRODUCTION_BUILD: FAIL_PRE_EXISTING_UNRELATED**

`npm run build` stopped at the Prisma engine lock. A direct Next diagnostic reached compilation and failed at the known unrelated `src/app/dashboard/admin/security/simulations/actions.ts:23`: an exported non-async function is treated as a Server Action. No Address production-code build diagnostic appeared first. This does not override the separate Address test TypeScript failure.

### 25. Browser verification

**BROWSER_VERIFICATION: NOT VERIFIED**

No deterministic Address browser test exists for desktop, mobile, keyboard-only, personal/business, manual, country-change, or provider-failure flows. No live Google key was used.

## Previous finding verification

| Original ID | Previous | Current | Evidence / test evidence / files | Remaining risk |
|---|---|---|---|---|
| GAS-P1-001 | PARTIALLY RESOLVED | RESOLVED | Clean and pre-present reconciliation scenarios deployed; legacy rows survived; final schema diff clean. Schema and four migrations. | SQL safe; application release remains blocked. |
| GAS-P1-002 | PARTIALLY RESOLVED | PARTIAL | Session-owned relation lookup exists; personal/business cross-user tests absent. Profile route/types. | IDOR regression unproved. |
| GAS-P1-003 | PARTIALLY RESOLVED | PARTIAL | Routing/clear improved; decrypt reload broken; lifecycle/personal-isolation tests absent. Profile route/page/client. | Stale/unreadable business state. |
| GAS-P1-004 | RESOLVED | RESOLVED | Google request still omits unsupported `address` primary type. Google provider. | Provider error mapping remains separate. |
| GAS-P1-005 | PARTIALLY RESOLVED | PARTIAL | Encrypted columns/writes exist; decrypt contexts invalid; no round-trip/tamper test. Schema/Profile/AddressService/crypto. | Authorized reads lose data. |
| GAS-P1-006 | PARTIALLY RESOLVED | UNRESOLVED | 80/80 concurrent attempts allowed against 60; client session lifecycle incomplete. Limiter/routes/autocomplete. | Deployable abuse-control bypass. |
| GAS-P2-001 | PARTIALLY RESOLVED | PARTIAL | `ZZ`, unknown provider, huge token, unknown keys accepted; signed line2 mutable; no negative tests. Types/token/Profile route. | Fabricated/inconsistent state. |
| GAS-P2-002 | PARTIALLY RESOLVED | PARTIAL | Transaction exists; rollback/repeat-save tests absent. Profile route. | Atomicity regression unproved. |
| GAS-P2-003 | PARTIALLY RESOLVED | UNRESOLVED | Default-live, no environment guard, logging/import/isolation defects; no tests. Migration script/crypto. | Unsafe operator execution. |
| GAS-P2-004 | PARTIALLY RESOLVED | PARTIAL | POST and route log improvements; raw limiter/script errors; no log capture. Routes/limiter/script. | PII telemetry risk. |
| GAS-P2-005 | PARTIALLY RESOLVED | PARTIAL | Predicate still omits meaningful state; no cases tested. AddressForm. | Mixed-country state. |
| GAS-P2-006 | PARTIALLY RESOLVED | PARTIAL | ARIA improved; label/Tab/Escape/option/focus/axe gaps. Address components. | Keyboard/screen-reader flow unapproved. |
| GAS-P2-007 | PARTIALLY RESOLVED | PARTIAL | Zero preserved; invalid direct normalization and persistence boundaries untested. Normalizer/types/Profile route. | Invalid coordinates through unchecked paths. |
| GAS-P2-008 | RESOLVED | RESOLVED | New flow remains country-first/search-first. AddressForm. | No component test. |
| GAS-P2-009 | PARTIALLY RESOLVED | PARTIAL | Three files exist; suite 8/12; most required categories NO TEST. Address tests. | Critical regression gaps. |
| GAS-P2-010 | UNRESOLVED | UNRESOLVED | Exact lint: 29 errors, 19 warnings. All Pass 2 files. | Mandatory zero-warning gate fails. |
| GAS-P2-011 | PARTIALLY RESOLVED | PARTIAL | Business encrypted dual-write added; source authority/clear parity defective; no rollback/parity test. Profile route/protection. | Legacy rollback can be stale/tampered. |
| GAS-P2-012 | PARTIALLY RESOLVED | RESOLVED | Runtime Profile/Address code uses singleton. Prisma/Profile/limiter. | Separate CLI lifecycle acceptable. |
| GAS-P3-001 | UNRESOLVED | PARTIAL | Development example has empty key; production example/security guidance absent. Env examples. | Production config undocumented. |
| GAS-P3-002 | RESOLVED | RESOLVED | Minimal two-field registry, 250 codes, no duplicates, seven representatives correct. Country data/registry. | No automated registry test. |
| GAS-P3-003 | RESOLVED | RESOLVED | City/state/postal labels remain non-universally-required. AddressForm. | No international component test. |

No original finding is omitted.

## Final finding counts

P1 ORIGINAL: 6  
P1 RESOLVED: 2  
P1 PARTIAL: 3  
P1 UNRESOLVED: 1

P2 ORIGINAL: 12  
P2 RESOLVED: 2  
P2 PARTIAL: 8  
P2 UNRESOLVED: 2

P3 ORIGINAL: 3  
P3 RESOLVED: 2  
P3 PARTIAL: 1  
P3 UNRESOLVED: 0

## Final quality summary

| Gate | Result | Evidence |
|---|---|---|
| Migration History Parity | PASS | Two disposable scenarios, legacy survival, final no-drift diff. |
| Migration Safety | PASS | Additive SQL; no DROP/TRUNCATE/DELETE. |
| IDOR | FAIL | Required personal/business tests absent. |
| Business Address | FAIL | Reload/clear/legacy parity defects; no lifecycle tests. |
| Server-authoritative Address | FAIL | Mutable signed line2; no post-decrypt validation/wrong-user suite. |
| PII Encryption | FAIL | Write encryption exists; shared decrypt path broken. |
| Dual Write | FAIL | Browser-derived/stale legacy data; no parity test. |
| Transaction Rollback | FAIL | NO TEST. |
| Atomic Rate Limiter | FAIL | 80/80 allowed against limit 60. |
| Google Provider | FAIL | Error states/adapter tests incomplete. |
| Session Controls | FAIL | Insecure ID, premature reset, no latest sequence proof. |
| PII Logging | FAIL | Raw error paths; no capture test. |
| Country Change | FAIL | Meaningful states omitted; NO TEST. |
| Accessibility | FAIL | Interaction gaps; no component/axe test. |
| Zero Coordinates | FAIL | Zero fixed; invalid paths/matrix untested. |
| Strict Validation | FAIL | Prohibited inputs accepted. |
| Legacy Migration | FAIL | Default-live/unguarded/isolation/logging/import defects. |
| Prisma Singleton | PASS | Runtime singleton confirmed. |
| Env Config | FAIL | Production entry and security guidance absent. |
| Unit Tests | FAIL | Focused suite 8 passed, 4 failed; broad gaps. |
| Integration Tests | FAIL | Persistence/IDOR/rollback/lifecycle absent. |
| Security Tests | FAIL | IDOR/token/concurrency coverage incomplete/failing. |
| International Tests | FAIL | Seven fixture tests absent. |
| Component Tests | FAIL | Country/session/accessibility tests absent. |
| Migration Tests | FAIL | Reviewer rehearsal passed; no repository regression test. |
| Targeted E2E | NO TEST | No Address E2E file. |
| Changed-file Lint | FAIL | 29 errors, 19 warnings. |
| Address TypeScript | FAIL | 10 Address limiter-test diagnostics. |
| Repository TypeScript | FAIL | Same 10 Address diagnostics. |
| Prisma Validate | PASS | Completed successfully. |
| Prisma Generate | FAIL | Scoped RENTipid dev-process engine lock/EPERM. |
| Production Build | FAIL_PRE_EXISTING_UNRELATED | Direct build failed unrelated SOC Server Action. |
| Browser Verification | NOT VERIFIED | No deterministic Address harness. |

## Remaining blockers and deployment decision

Blocking issues include the demonstrated limiter bypass, broken canonical decryption, absent IDOR tests, incomplete server-authoritative validation, defective/unproved business/dual-write/rollback behavior, incomplete strict validation/provider/session/country controls, unsafe legacy migration posture, failing tests/lint/Address TypeScript, and no targeted E2E/browser evidence.

`CODEX_PASS2_FINAL_CRITICAL_BLOCKER`

SAFE_FOR_LOCAL_TESTING: YES  
SAFE_FOR_PREVIEW_DEPLOYMENT: NO  
SAFE_FOR_PRODUCTION_CODE_DEPLOYMENT: NO  
PRODUCTION_DATABASE_MIGRATION_APPROVED: NO  
LIVE_GOOGLE_CONFIGURATION_REQUIRED: YES

The migration SQL is individually approvable based on the disposable rehearsal, but production migration is not approved for this release because mandatory software-side security and correctness controls are not proven safe.
