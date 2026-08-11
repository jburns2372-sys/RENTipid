# RENTipid Technical Reference

## Repository and Runtime

The documented snapshot is branch `feature/soc-phase4-threat-response` at
`5804d4cceafc74e5e51b554be6f84a1b9c80e8be`, with preserved pre-existing
uncommitted work. `src/app` contains 163 page routes and 65 root API route
files; `src/lib` contains domain services; Prisma defines 79 models and 29
enums; `apps/api` and `apps/worker` are extracted Azure targets; Terraform is
desired-state code, not deployment evidence.

## Architecture Language

`AUTHORITATIVE_ARCHITECTURE_DIRECTION: VERCEL_FRONTEND_WITH_AZURE_BACKEND_AND_SERVICES`

`CURRENT_REPOSITORY_RUNTIME_TRANSITION_STATE: PARTIALLY_SPLIT_IMPLEMENTATION`

The root Next.js runtime still provides frontend, authentication, dashboards,
and remaining/root compatibility APIs while extracted API/worker targets
coexist. AWS/PM2 material is `SUPERSEDED_ARCHITECTURE_HISTORY`.

## Data Domains

The schema groups identity/profile, catalog, booking/rental/trust, KYC,
payments/finance, audit/platform, marketing/social, release/support, SOC
telemetry/detection, incident cases, response controls, behavioral risk, and
geolocation. Model presence does not confer mutation authority or prove
production rows; service authorization and transition guards are authoritative.

## API and Service Families

Root routes cover admin, AI, auth, bookings, documents, finance upload,
listings, payments, privacy, SOC cases, approvals, playbooks, responses,
dashboard/intelligence, and webhooks. Transitional marketplace wrappers must
be classified before change as root authority, compatibility proxy, or target
handler. No dedicated SOC reporting/export API was found.

## Configuration Contract

Only configuration names are documentation-safe. The inventory records 52
code-referenced names and 19 production-template names. Actual passwords,
tokens, keys, HMAC material, URLs containing credentials, database connection
strings, SAS values, provider secrets, and environment values are excluded.
Test/database mutation guards are safety controls, not deployment switches.

## Security and Reliability Contracts

Server authorization, Zod/domain validation, upload checks, audit
sanitization, privacy-safe telemetry, idempotency, checkpoint/lease handling,
separation of duties, reversible response, rollback/divergence checks,
signature/reconciliation controls, and environment/lifecycle separation are
part of the technical contract.

## Test and Evidence Scope

The inventory contains 142 test/spec files, including 135 security files.
Accepted reports prove their checkpoint; test-file presence and historical
passes do not validate unrelated dirty edits. Database-backed tests require
the local test guard and must never target production.

## Technical Change Checklist

Identify the exact requirement, authoritative handler, roles, models, states,
integration mode, audit/privacy behavior, failure/recovery contract, tests,
rollback, status impact, evidence IDs, and documentation updates. Preserve
separately governed database, payment, deployment, traffic, and DNS decisions.
