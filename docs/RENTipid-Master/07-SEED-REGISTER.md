# RENTipid Seed and Required-Data Register

| Seed / sync | Purpose | Safety contract | Evidence | Current status |
| --- | --- | --- | --- | --- |
| `prisma/seed.ts` | Core categories and marketplace data orchestration | Must be deterministic, idempotent and non-destructive | Marketplace V1 acceptance records stable counts and zero duplicates | LOCAL REQUIRED DATA SEEDED/SYNCED |
| `seed-data/rentipid_marketplace_sample_seed_catalog.json` | 15 categories, 45 listings, test identities and booking scenarios | Test data must fail closed outside authorized seed mode | Accepted local evidence at historical SHA | LOCAL REQUIRED DATA SEEDED/SYNCED |
| `scripts/seed-prohibited-items.ts` | Policy catalogue and definitions | Versioned, idempotent and non-duplicating | Historical evidence conflicts with later closeout | IN IMPLEMENTATION |
| `scripts/address-local-bootstrap.ts` | Local Address prerequisite/bootstrap | Explicit target, no production mutation | Address closure evidence | CLOSED / FROZEN |
| `scripts/psgc-sync.ts` | PSGC canonical subdivision sync | Upsert/idempotency, protected targets | Address closure evidence | CLOSED / FROZEN |
| `scripts/psgc-production-bootstrap.ts` | Controlled PSGC environment bootstrap | Explicit environment and safety guards | Address Production readiness evidence; no Production write performed in final closure | PRODUCTION-READY |
| `scripts/seed-e2e-users.ts` | Isolated browser-test accounts | Disposable test database only; secret supplied at runtime | Address E2E evidence | LOCAL ACCEPTANCE PASS |
| `scripts/seed-uat.js` | UAT users/settings/workflows | Must not target shared/production data without explicit authority | No current authoritative acceptance | IN IMPLEMENTATION |

## Required-data gaps

- No single manifest maps every module to required `SystemSetting`/`SystemSettings`, permission, rule, template or workflow record.
- Roles are represented as user strings rather than a seeded canonical role table.
- Detection/security seeds have historical evidence but need dependency mapping, not re-seeding.
- Finance, legal policy versions, notification preferences, support SLAs and insurance defaults lack accepted required-data contracts.
- Fresh-database acceptance must prove migrations plus all mandatory seeds once at the LOCAL-RC1 gate.
