# RENTipid Test Register

Baseline inventory: 192 files under `tests/` plus 6 test files under `apps/api`. Existing pass reports are retained; no tests were rerun during Wave 0.

| Scope | Inventory | Evidence quality | Current gate use | Missing coverage |
| --- | ---: | --- | --- | --- |
| Address | 20 files: 18 Jest, 2 Playwright | Final closure records 112/112 Jest and 12/12 Playwright, axe 0 violations | Supports CLOSED / FROZEN | None unless a change record affects scope |
| Security/SOC | 150 files | Extensive unit/rules/integration evidence and formal frozen phase records | Supports accepted historical LOCAL ACCEPTANCE PASS scopes | New-standard Preview acceptance |
| Privacy | 10 files | Closure records 47 privacy, 9 security and 15 Playwright passing | Supports LOCAL ACCEPTANCE PASS | Preview promotion |
| E2E | 7 files | Address/privacy and selected flows; not a full app journey suite | Targeted only | Renter/provider/admin/finance global journeys |
| Marketplace | 1 focused seed test file | Seven accepted marketplace-seed tests | Supports seed gate only | Listing lifecycle/search/availability acceptance |
| Checkout | 1 top-level focused file plus security payment suites | Payment security controls exist | Targeted development evidence | Required full finance scenario matrix |
| Compliance | 1 top-level focused file plus security suites | Prohibited-item controls exist | Conflicting closure evidence | Current targeted reconciliation |
| Express API | 6 files | API-focused tests exist | Targeted | Health readiness DB failure/success and deployed parity |
| Health readiness delta | 2 new files, 4 tests | Express 2/2 and Next 2/2 pass; live Next and Express endpoints both returned 200 after real localhost DB probes | Supports LOCAL ACCEPTANCE PASS | Preview gates held by global barrier |
| Registration/auth | Security tests, no focused registration E2E identified | Incomplete journey evidence | IN IMPLEMENTATION | Registration, status denial, reset, session revocation |
| Auth fail-closed delta | 2 focused policy/proxy files | 23 passed, 0 failed; root TypeScript and active-delta ESLint pass | Supports CODE COMPLETE for CR-2026-001 | Real credential/account-state acceptance; password recovery |
| Insurance Technical Foundation Slice 1 | `tests/insurance/foundation.spec.ts` plus consolidated local runtime/database acceptance | 17 passed, 0 failed; runtime, read-only Prisma/data safety, provider neutrality, strict Insurance source typecheck and affected lint pass | EVD-INS-S1-GATE5 — LOCAL ACCEPTANCE PASS | PREVIEW MIGRATED and later promotion gates |
| Provider onboarding/KYC | Upload/security fragments | Incomplete | IN IMPLEMENTATION | Individual and business end-to-end paths |
| Booking lifecycle | Booking/security tests | Fragmented | IN IMPLEMENTATION | Concurrency, expiry worker and complete state journey |
| Claims/disputes/reviews | Some booking/security coverage | Incomplete | IN IMPLEMENTATION | Financial adjustment, dispute parties, review eligibility |
| Messaging/notifications | No focused suite | Missing | NOT STARTED / IN IMPLEMENTATION | Entire product workflows |
| AI Help Center | AI/security tests around controls | Mock-only product behavior | IN IMPLEMENTATION | Real contextual accuracy, tool authorization, escalation |
| PWA/mobile | No native/service-worker suite | Missing | IN IMPLEMENTATION | Installability, offline, responsive critical journeys, native builds |

## Test execution policy

- During implementation: changed unit tests, owning-module tests and direct dependency tests only.
- After a failure: fix root cause, rerun the failed test, then only directly affected regression tests.
- At module stabilization: run final module local acceptance once and record exact commands/results.
- At Wave 10: run the full renter/provider/damage/finance/security/admin acceptance once against an isolated migrated local database.
- No known-passing frozen Address, SOC or Privacy suite is rerun unless an affected dependency changes.
- Tests may not be disabled, weakened or reseeded against shared data merely to produce a pass.

## 2026-08-11 health evidence

- `apps/api`: `npm test -- --runInBand src/routes/__tests__/health.test.ts` — 2 passed, 0 failed.
- Root: isolated safe-name configuration with mocked DB, `jest tests/foundation/health-route.test.ts --runInBand` — 2 passed, 0 failed; no database connection occurred.
- Touched-file ESLint — 0 errors, 0 warnings.
- Root `npx tsc --noEmit --pretty false` — PASS.
- Live Next `/api/health` — HTTP 200, `ready`, database `connected` against confirmed localhost target.
- Live Express `/health/ready` through `npm run dev` — HTTP 200, `ready`, database `connected`; process stopped afterward.
- Migration — NOT REQUIRED / VERIFIED; read-only `SELECT 1` only.
- Seed/sync — NOT REQUIRED / VERIFIED.
- `apps/api` package TypeScript — 11 existing diagnostics remain across App Insights exports, correlation typing, missing authorization exports, webhook import, Azure OpenAI overload and ledger/schema drift; health files emitted no diagnostic.
