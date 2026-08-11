# R12 — ISSUE/RISK REGISTER

Dependency Classification for Insurance Engineering V1:

| Dependency | Classification | Justification |
|---|---|---|
| Real Insurer Credentials | EXTERNAL-ACTIVATION-BLOCKER | Must not block engineering; mockable |
| Booking Module | HARD-BLOCKER | Insurance cannot exist without a booking object to attach to |
| Payment/Escrow Module | INTERFACE-DEPENDENCY | Can be mocked/stubbed for insurance tests |
| Authentication/Identity | HARD-BLOCKER | Required for RBAC and renter attribution |
| Claim/Damage Module | SOFT-DEPENDENCY | Can be built parallel; insurance claims can be stubbed |
| Privacy Module (Consent) | INTERFACE-DEPENDENCY | Contract needed to record consent |
| Real Partner Webhooks | MOCKABLE | Adapter handles incoming webhooks, can be tested locally |

*Rule: Do NOT treat every incomplete RENTipid module as an Insurance blocker. Use MockInsuranceAdapter where safe.*

## Slice 1 Issue Classification (2026-08-12)

| ID | Severity | Finding | Scope decision |
|---|---|---|---|
| INS-S1-ISS-001 | RESOLVED P2 | Prisma client generation was initially blocked because the local Next.js runtime held the Windows query-engine DLL open | Owner stopped the confirmed runtime; Prisma Client v6.19.3 generation and read-only access passed during EVD-INS-S1-GATE3 |
| INS-S1-ISS-002 | P2 / UNRELATED | Root TypeScript reports four existing `src/lib/auth.ts` diagnostics | Identity hard blocker; Insurance source-only strict typecheck passes |
| INS-S1-ISS-003 | P2 / DEPENDENCY | Booking and Authentication are not ready for Insurance integration | Preserve normalized IDs/interfaces; no route or booking mutation in Slice 1 |
| INS-S1-ISS-004 | P2 / DEPENDENCY | Database-backed Super Admin kill-switch integration awaits settings/RBAC reconciliation | Injectable fail-closed configuration boundary implemented |
| INS-S1-ISS-005 | BLOCKED-EXTERNAL | Real insurer adapters, credentials, wording and product approval are unavailable | Live issuance defaults off; Mock must be explicitly configured |

OPEN SLICE 1 P0: 0.
OPEN SLICE 1 P1: 0.
No unrelated defect was repaired.

## Local Functional Gate Result (2026-08-12)

- EVD-INS-S1-GATE2: PASS.
- Slice 1 runtime P0: 0.
- Slice 1 runtime P1: 0.
- New Slice 1 product defects: 0.
- Existing P2 items remain open without blocking the isolated runtime.
- Root Auth diagnostics were not rerun or modified.
- Booking, Payment and real partner integrations were not invoked.

## Local Database Migrated Gate Result (2026-08-12)

- EVD-INS-S1-GATE3: PASS.
- LOCAL migration status: 38 migrations, pending 0, failed 0, schema current.
- Insurance schema and generated-client access: PASS.
- Insurance model record counts: 0 across all six foundation models.
- Database business-data writes during final synchronization: 0.
- INS-S1-ISS-001 DLL lock: RESOLVED.
- Slice 1 database-gate P0: 0.
- Slice 1 database-gate P1: 0.

## Local Required Data Seed/Sync Gate Result (2026-08-12)

- EVD-INS-S1-GATE4: PASS.
- Gate path: A — NOT REQUIRED.
- Mock adapter configuration is code/environment based and does not require `InsurancePartner` or `InsuranceProduct` rows.
- Offer, policy, claim and webhook records remain runtime-generated and were not fabricated.
- Real partner/product records remain BLOCKED-EXTERNAL and were not activated.
- PSGC data is unrelated to Insurance Technical Foundation Slice 1 and was not seeded.
- Database business-data writes: 0.
- New Gate 4 P0/P1/P2/P3 findings: 0/0/0/0.

## Local Acceptance Gate Result (2026-08-12)

- EVD-INS-S1-GATE5: PASS.
- Consolidated runtime/database acceptance: PASS.
- Final focused Insurance tests: 17/17 PASS.
- Insurance source strict typecheck and changed-scope lint: PASS.
- Provider neutrality and fail-closed security boundaries: PASS.
- Database writes, external insurer calls, Booking mutations and Payment mutations: 0.
- Initial Jest invocation was rejected before tests by the unchanged disposable-target guard; the corrected non-routable LOCAL target passed. This was a harness invocation correction, not an Insurance defect.
- Database-backed Super Admin kill-switch, authenticated routes, Booking and Payment integrations remain deferred dependencies.
- New Gate 5 P0/P1/P2/P3 findings: 0/0/0/0.
