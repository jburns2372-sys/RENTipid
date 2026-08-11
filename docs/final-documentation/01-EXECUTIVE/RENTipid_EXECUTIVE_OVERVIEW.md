# RENTipid Executive Overview

## Purpose

RENTipid is a role-based rental marketplace for renters, individual and
business providers, platform administrators, finance and compliance
operators, and security-operations personnel. Its current repository combines
a Next.js marketplace application, an extracted API and worker target, a
Prisma/PostgreSQL data model, security operations capabilities, payment and
provider integrations, and infrastructure definitions.

This documentation describes the repository snapshot on branch
`feature/soc-phase4-threat-response` at
`5804d4cceafc74e5e51b554be6f84a1b9c80e8be`. The working tree contained
pre-existing uncommitted work, so accepted historical evidence and current
uncommitted implementation are distinguished throughout.

## Product Scope

The implemented product surface covers:

- account registration, authentication, profiles, KYC, privacy, and account
  lifecycle controls;
- listing discovery, provider catalog management, bookings, agreements,
  turnover, inspections, claims, and disputes;
- guarded checkout, payment reconciliation, finance operations, refunds,
  payouts, and settlement-readiness workflows;
- administration, compliance, support, beta/UAT, marketing, mobile/PWA, and
  release-readiness surfaces;
- a frozen SOC baseline spanning telemetry, detection, incident cases,
  playbooks, approvals, reversible responses, controlled simulation,
  maintenance/recovery, behavioral intelligence, and threat mapping;
- a partially split Vercel frontend/authentication and Azure
  backend/services target architecture.

## Completion Interpretation

`EVERY_APPROVED_MODULE_AND_PHASE` is documented using its accepted status.
Completion does not mean that every route, readiness screen, external
integration, future convenience UI, or infrastructure definition is active.
The status vocabulary is intentionally strict:

- accepted/frozen capabilities remain accepted/frozen;
- placeholders and planned features remain disclosed as such;
- Phase 19 live payment activation remains `COMPLETE_NO_GO_FROZEN`;
- Phase 19B status and reserved actions are consolidated in the callout below;
- production, provider, database, and cloud state require separate external
  verification and authorization.

> **Phase 19B status:**
> `PHASE19B_COMPLETE_WITH_SEPARATE_OWNER_DECISIONS_RESERVED`.
> The authoritative direction is
> `VERCEL_FRONTEND_WITH_AZURE_BACKEND_AND_SERVICES`; the repository remains a
> `PARTIALLY_SPLIT_IMPLEMENTATION`. Azure provisioning/deployment, traffic
> migration, and DNS cutover are not authorized by documentation.
> `DATABASE_MIGRATION: PENDING_SEPARATE_OWNER_DECISION`.

`PAYMENT_ACTIVATION: NOT_AUTHORIZED`

## SOC Scope Decision

The standalone simulations, reports, and maintenance routes are not exact
accepted Phase 4 deliverables. Controlled simulation is complete and frozen
through the response service and Gate 4I evidence. Maintenance and recovery
are complete and frozen through services, tests, technical UAT, and the
accepted runbook. A dedicated SOC report generator/export module was not
found and was not part of the accepted baseline.

Accordingly, the three route shells are limitations, not approved-scope
completion blockers. The detailed decision is in
`../11-EVIDENCE-AND-VALIDATION/RENTipid_SOC_PLACEHOLDER_SCOPE_RECONCILIATION.md`.

## Operational Boundaries

- No documentation statement authorizes deployment, provisioning, traffic
  migration, DNS cutover, database migration, or live payment activation.
- Server-side authorization and service state-transition guards are
  authoritative; UI visibility alone is not a control.
- Secrets, credentials, connection strings, private keys, tokens, and
  environment values are excluded.
- Terraform and application clients prove local definitions, not external
  resource state.
- Historical test reports prove their recorded checkpoint, not every current
  dirty-worktree edit.

## Documentation Map

The final documentation index links the executive, system, user, operator,
SOC, data/API, architecture, operations, developer, governance, and validation
manuals. The 18 frozen working registries are the evidence layer from which
those manuals derive their classifications.

Documentation status:
`COMPLETE_WITH_DISCLOSED_STATUS_CLASSIFICATIONS`
