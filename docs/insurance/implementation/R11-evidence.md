# R11 — EVIDENCE REGISTRY

Reusable evidence IDs for the mandatory promotion gates:

| Gate | Evidence ID | Definition | Current Status |
|---|---|---|---|
| CODE COMPLETE | EVD-INS-GATE1 | Implementation complete, types compile, strict mode passes | PENDING |
| LOCAL FUNCTIONAL | EVD-INS-GATE2 | Application starts, routes load, mock adapter responds | PENDING |
| LOCAL DATABASE MIGRATED | EVD-INS-GATE3 | Insurance tables exist, migrations apply cleanly | PENDING |
| LOCAL REQUIRED DATA SEEDED/SYNCED | EVD-INS-GATE4 | Required Insurance data seeded/synced or NOT REQUIRED verified | PENDING |
| LOCAL ACCEPTANCE PASS | EVD-INS-GATE5 | All INS-TEST-* pass against local baseline | PENDING |
| PREVIEW MIGRATED | EVD-INS-GATE6 | Vercel preview DB has insurance schema applied | PENDING |
| PREVIEW ACCEPTANCE PASS | EVD-INS-GATE7 | Preview deployment functions with mock or staging partner | PENDING |
| PRODUCTION-READY | EVD-INS-GATE8 | Ready for live partner activation, secrets managed | PENDING |
| CLOSED / FROZEN | EVD-INS-GATE9 | Final freeze certificate | PENDING |

## Slice Evidence

| Gate | Evidence ID | Definition | Current Status |
|---|---|---|---|
| CODE COMPLETE — TECHNICAL FOUNDATION SLICE 1 | EVD-INS-S1-GATE1 | Normalized contracts, registry, deterministic Mock adapter, domain/config/audit boundaries, six-model schema, unapplied migration, focused tests, targeted strict typecheck, lint and Prisma validation | PASS |
| LOCAL FUNCTIONAL — TECHNICAL FOUNDATION SLICE 1 | EVD-INS-S1-GATE2 | Actual local Node/tsx execution of config, registry, Mock adapter and domain service across disabled, eligible, offer, negative, failure, unknown, kill-switch, live-safety and audit paths | PASS |
| LOCAL DATABASE MIGRATED — TECHNICAL FOUNDATION SLICE 1 | EVD-INS-S1-GATE3 | Confirmed LOCAL migration, verified six-model Insurance schema, synchronized Prisma Client, and successful read-only access through all six generated model delegates | PASS |
| LOCAL REQUIRED DATA SEEDED/SYNCED — TECHNICAL FOUNDATION SLICE 1 | EVD-INS-S1-GATE4 | PATH A: persistent prerequisite data is not required; Mock adapter/config is code/environment based and business records are runtime-generated | PASS |
| LOCAL ACCEPTANCE — TECHNICAL FOUNDATION SLICE 1 | EVD-INS-S1-GATE5 | Consolidated configuration, orchestration, deterministic Mock, negative, kill-switch, audit, read-only Prisma/data-safety, boundary, neutrality, focused-test, typecheck and lint acceptance | PASS |

### EVD-INS-S1-GATE1 Results

- Focused Jest: PASS, 17/17.
- Insurance source strict typecheck: PASS, zero diagnostics.
- Affected lint: PASS, zero errors and zero warnings.
- Prisma validate: PASS.
- Prisma client generation: schema parsing passed, then Windows blocked query-engine DLL replacement because the existing local runtime holds the file. No process was terminated. This is tracked as P2 tooling evidence and does not apply a migration.
- Root typecheck: four diagnostics in pre-existing `src/lib/auth.ts`; zero Insurance diagnostics. Auth was not modified.
- Slice 1 P0: 0.
- Slice 1 P1: 0.
- Migration applied: NO.
- Real insurer request: NO.

The module-level `EVD-INS-GATE1` remains PENDING because later CODE COMPLETE
slices are not implemented.

### EVD-INS-S1-GATE2 Results

- Actual local Insurance foundation load: PASS.
- Runtime cases: 10/10 PASS.
- Network calls: 0.
- Audit callbacks: 1 safe normalized event.
- Process healthy after deterministic adapter failure: YES.
- Prisma client required: NO.
- Prisma generation retried: NO; DLL lock remains P2.
- Database connection/write: NO.
- Migration applied: NO.
- Slice 1 P0/P1: 0/0.
- Code changes required: NO.

The first ephemeral harness invocation selected incompatible ESM named-import
semantics and exited before any case ran. The same verification was immediately
executed with the repository-compatible CommonJS loader and passed. This was a
harness invocation correction, not an Insurance defect.

The module-level `EVD-INS-GATE2` remains PENDING because later Insurance
slices and routes are not locally functional.

### EVD-INS-S1-GATE3 Results

- Confirmed database target: LOCAL.
- Migration `20260812000000_add_insurance_foundation`: APPLIED.
- Final migration status: 38 migrations, pending 0, failed 0, schema current.
- Insurance schema verification: PASS for all six foundation models, keys, constraints, indexes, defaults, nullability and Booking relations.
- Prisma Client generation: PASS, Prisma Client v6.19.3.
- Generated model delegates: PASS for `InsurancePartner`, `InsuranceProduct`, `InsuranceOffer`, `InsurancePolicy`, `InsuranceClaim` and `InsuranceWebhookEvent`.
- Read-only model counts: 0 for every model; zero records are valid.
- Database business-data writes: 0.
- Migrations executed during final client-synchronization task: 0.
- Slice 1 database-gate P0/P1: 0/0.

The module-level `EVD-INS-GATE3` remains PENDING because later Insurance
slices have not yet passed their database gates.

### EVD-INS-S1-GATE4 Results

- Gate path: A — NOT REQUIRED.
- InsurancePartner: NOT-REQUIRED-FOR-SLICE-1.
- InsuranceProduct: NOT-REQUIRED-FOR-SLICE-1.
- InsuranceOffer: RUNTIME-GENERATED.
- InsurancePolicy: RUNTIME-GENERATED.
- InsuranceClaim: RUNTIME-GENERATED.
- InsuranceWebhookEvent: RUNTIME-GENERATED.
- Mock adapter configuration: code/environment based.
- Required environment configuration: explicit Insurance enablement, `INSURANCE_ADAPTER=mock`, `INSURANCE_MOCK_ENABLED=true`, and inactive kill switch.
- Persistent feature flags, permissions, system settings and lookup seeds required by Slice 1: NONE.
- Real partner/product activation data: NOT SEEDED / BLOCKED-EXTERNAL.
- Database business-data writes: 0.
- Seed mechanism created or executed: NO.
- Slice 1 required-data-gate P0/P1: 0/0.

LOCAL REQUIRED DATA SEED/SYNC: NOT REQUIRED — VERIFIED.

The module-level `EVD-INS-GATE4` remains PENDING because later Insurance
slices may introduce genuine required-data obligations.

### EVD-INS-S1-GATE5 Results

- Consolidated local acceptance runtime: PASS.
- Configuration, Domain Service, eligibility, offers, negative paths, kill switch and audit: PASS.
- Read-only Prisma acceptance: PASS for all six Insurance delegates.
- Insurance table counts before/after: 0/0 for every model.
- PSGC/password-reset safety counts before/after: 0/0.
- External insurer requests: 0.
- Database writes: 0.
- Provider neutrality targeted scan: PASS, prohibited production-provider and core provider-branch hits 0.
- RBAC runtime acceptance: NOT APPLICABLE TO SLICE 1 — VERIFIED BOUNDARY.
- Booking/Payment boundary: PASS; mutations 0.
- Final focused Insurance suite: PASS, 17/17.
- Insurance source strict typecheck: PASS.
- Insurance/changed-scope lint: PASS.
- Root typecheck: NOT RUN; known unrelated Auth baseline retained.
- Build: NOT REQUIRED.
- Slice 1 acceptance P0/P1: 0/0.

The module-level `EVD-INS-GATE5` remains PENDING because later Insurance
slices and full authenticated workflows have not passed local acceptance.
