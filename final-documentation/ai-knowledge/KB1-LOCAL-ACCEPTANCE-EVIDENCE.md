# KB-1 Local Acceptance Evidence

Baseline: `7427fa8f98aa3996cb07168e2960d28a1cd92ac7`  
Branch: `feature/soc-phase4-threat-response`  
Registry: `KB1-INITIAL-146`  
Registry SHA-256: `97A3E7ADC75FBB35DC5D4947A51D517C8E8BF11FB49566E97FBB75B65E8A293D`

## Frozen registry and coverage

- Original candidates: 146
- Accounted: 146
- Unclassified: 0
- Unaccounted: 0
- Synchronizable approved canonical sources: 107
- Active canonical sources: 107
- Active chunks: 705
- Accounted-only excluded, superseded, conditional, or SYSTEM_ONLY sources: 39
- Coverage: 100%
- Missing / invalid / duplicate / stale: 0 / 0 / 0 / 0

Disposition counts:

- ACTIVE_CANONICAL: 9
- ROLE_RESTRICTED: 30
- SUPER_ADMIN_ONLY: 68
- SYSTEM_ONLY: 34
- SUPERSEDED: 3
- CONDITIONAL_APPROVED: 2

## Local migration

Migration: `20260814010000_add_knowledge_engine`  
Type: additive  
Data reset: no

The local test database had a pre-existing migration-history duplicate: both the
earlier `20260813000000_phase6_target_account_context` migration and the later
`20260813035959_phase6_target_account_context` migration described the same
already-present columns and foreign keys. Read-only schema inspection confirmed
the columns and exact foreign keys before the later migration was reconciled as
applied in local test history. No application row was reset or removed. After
that reconciliation, `prisma migrate deploy` applied KB-1 and a final rerun
reported no pending migrations.

`prisma validate`: PASS  
`prisma generate`: PASS  
Local migration deploy/idempotency: PASS

## Bootstrap and synchronization

The guarded local/test bootstrap was run ten times:

- Iteration 1: 107 created, 705 chunks, 0 failures
- Iterations 2-10: 107 NO_OP each, 0 new versions/chunks, 0 failures

Subsequent controlled syncs verified immutable supersession for registry
visibility changes and a structured-provider content change. The final diff is
107 NO_OP and the final active state remains 107 sources / 705 chunks.

## Functional and security acceptance

Focused Knowledge Engine suites: 65/65 PASS

- Registry/freeze validation
- deterministic normalization, stable JSON, and SHA-256 hashing
- semantic heading-first chunking
- visibility narrowing and effective-role resolution
- SUPER_ADMIN authorized breadth and SYSTEM_ONLY denial
- lower-role isolation and prompt-injection resistance
- secret/credential query and persistence validation
- version collision/supersession behavior
- environment mutation guard
- duplicate prevention and coverage calculation
- 40-question, 20-family retrieval matrix
- safe uncertainty/material-claim qualification
- static knowledge/live-data boundary

Direct Unified AI knowledge/dependency suites: 32/32 PASS  
Complete OAT suite: 41/41 PASS  
`oat:ai:check`: READY, blockers none  
Production build: PASS

The OAT onboarding cleanup was narrowed to OAT-owned sources so it no longer
deletes canonical knowledge. Existing Concierge authorization and tool-gateway
controls remain intact.

## Environment boundary

- Mutation target: guarded local PostgreSQL test database only
- Preview mutation: not performed
- Production mutation: not performed
- Preview deployment: not performed
- Secrets printed: no

