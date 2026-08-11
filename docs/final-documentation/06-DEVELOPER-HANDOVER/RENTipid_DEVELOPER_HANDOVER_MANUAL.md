# RENTipid Developer Handover Manual

## Baseline and Worktree

Use branch `feature/soc-phase4-threat-response` and inspected HEAD
`5804d4cceafc74e5e51b554be6f84a1b9c80e8be` as the documentation baseline.
The snapshot includes extensive pre-existing dirty work. Establish ownership
before editing and never normalize it with destructive Git commands.

## Orientation

- `src/app`: 163 pages and 65 root API route files;
- `src/lib`: marketplace, privacy, AI, payment, and security services;
- `src/components`: public, dashboard, and SOC UI;
- `prisma/schema.prisma`: 79 models and 29 enums;
- `apps/api`, `apps/worker`: extracted service targets;
- `infrastructure`: Azure desired-state definitions;
- `tests`: 142 test/spec files;
- `docs/security`, `docs/soc`, `docs/governance`: accepted evidence authorities.

## Authority and Architecture

Current implementation and final accepted governance outrank older manuals and
plans. The architecture direction is
`VERCEL_FRONTEND_WITH_AZURE_BACKEND_AND_SERVICES`; the repository transition
state is `PARTIALLY_SPLIT_IMPLEMENTATION`. Classify a handler as authoritative,
compatibility/proxy, or target before changing it. AWS/PM2 is
`SUPERSEDED_ARCHITECTURE_HISTORY`.

## Placeholder Handover

| Route | Route status | Capability status |
| --- | --- | --- |
| `/dashboard/admin/security/simulations` | `NAVIGATION_SHELL_ONLY` | Gate 4I controlled simulation `COMPLETE_AND_FROZEN` elsewhere |
| `/dashboard/admin/security/reports` | `PLANNED_NOT_IMPLEMENTED` | Dedicated SOC reporting `NOT_APPLICABLE` to Phase 4 baseline |
| `/dashboard/admin/security/maintenance` | `PLANNED_NOT_IMPLEMENTED` | Gate 4J maintenance/recovery `COMPLETE_AND_FROZEN` elsewhere |

Future standalone pages require a newly approved user story, permissions,
service/API contract, safety behavior, tests, evidence, and documentation.
They must not weaken or silently reopen Gates 4I/4J.

## Change and Test Procedure

Map the requirement to routes, services, models, states, permissions, jobs,
integrations, audit/privacy controls, recovery, and selected tests. Historical
test evidence applies only to its checkpoint. Database tests require the local
guard; production is never a test target. Record exact commands/results and
update evidence IDs when behavior changes.

## Reserved Decisions

- `DATABASE_MIGRATION: PENDING_SEPARATE_OWNER_DECISION`;
- `PAYMENT_ACTIVATION: NOT_AUTHORIZED`;
- Azure provisioning/deployment: not authorized by documentation;
- traffic migration and DNS cutover: not authorized by documentation.

## Before Payment Change Checklist

- [ ] Confirm the exact approved requirement and responsible finance reviewer.
- [ ] Confirm `PHASE19: PHASE19_COMPLETE_NO_GO_FROZEN` remains unchanged unless
      a separately authorized gate explicitly replaces it.
- [ ] Confirm `PAYMENT_ACTIVATION: NOT_AUTHORIZED` remains enforced.
- [ ] Identify affected checkout, provider, webhook, reconciliation, ledger,
      refund, payout, and audit paths.
- [ ] Preserve signature, idempotency, exact amount/currency, role, and
      environment-mode controls.
- [ ] Select non-production tests protected by the repository database guard.
- [ ] Define safe failure, retry, reconciliation, rollback, and evidence steps.
- [ ] Update affected evidence IDs and documentation without exposing secrets.

## Handover Checklist

Preserve dirty work; use server authorization; avoid secret values; disclose
planned/disabled behavior; distinguish definition from deployment; retain
payment and migration boundaries; update registries/manuals/hashes/renders;
and define rollback plus the smallest corrective gate.
