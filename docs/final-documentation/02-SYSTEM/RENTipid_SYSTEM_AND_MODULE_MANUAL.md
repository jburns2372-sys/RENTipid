# RENTipid System and Module Manual

## System Context

RENTipid is organized around a root Next.js application, a Prisma domain
model, an extracted `apps/api` service, an `apps/worker` job target, and local
infrastructure definitions. The root application currently supplies public
pages, dashboards, authentication, and 65 API route files. The route inventory
contains 163 `page.tsx` screens.

The architecture is transitional: some root APIs remain authoritative while
selected marketplace operations have compatibility/proxy behavior toward the
extracted API. This must be treated as a partially split system, not as a
finished cutover.

## Marketplace Modules

### Identity, profiles, and privacy

Registration and session handling use the root authentication services and
NextAuth integration. Public registration cannot grant privileged roles.
Profile, KYC, verification documents, privacy requests, and account deletion
form controlled lifecycle workflows. Profile display is implemented, while
profile editing is explicitly a current limitation.

### Catalog and listings

Providers manage listings, photos, documents, categories, and submission
workflows. Publication and verification remain role-controlled. Public
discovery uses browse and listing-detail routes; route existence does not
override service authorization or listing state.

### Rentals, trust, and disputes

Booking services coordinate agreements, status history, turnover,
inspections, claims, deposits, reviews, and disputes. Exact server-side
transition guards and Prisma state contracts take priority over UI labels.
Claims and disputes remain human-reviewed workflows.

### Payments and finance

Checkout, gateway transactions, webhook handling, reconciliation logs,
refunds, payouts, deposits, ledgers, and settlement-readiness surfaces exist.
Their presence is not live-payment authority. The Phase 19 decision remains
`COMPLETE_NO_GO_FROZEN`, and real-money actions must retain the applicable
manual, role, environment, signature, and reconciliation gates.

### Administration and support

Admin and super-admin dashboards cover users, categories, bookings, disputes,
support, feedback, issues, beta/UAT, release, marketing, AI, system logs, and
readiness. Readiness dashboards describe a gate or checklist; they do not prove
that an external operation occurred.

### Marketing, AI, and mobile

Marketing/social models and services support campaigns, approvals, queues,
assets, and analytics records, with provider-specific external state. Provider
campaign analytics is explicitly incomplete. AI behavior is guarded and
advisory/provider-dependent; it may not make prohibited financial, compliance,
or security decisions. PWA/Capacitor evidence supports packaging/readiness but
does not prove store publication.

## Security Operations Modules

The accepted SOC system includes privacy-safe event ingestion, detection
rules, alerting, incident cases, evidence, playbooks, approvals, reversible
response execution, rollback, controlled simulation, recovery, behavioral
risk intelligence, and threat mapping.

Gate 4I's simulation capability is implemented in response execution and
validated through nine controlled scenarios. Gate 4J's maintenance/recovery
capability is implemented through recovery/backfill jobs, safe response
handling, technical UAT, and the operations runbook. The separate simulations,
reports, and maintenance pages remain disclosed shells; they are not used as
evidence of completed standalone UIs.

## Data and Service Boundaries

The Prisma schema contains 79 models and 29 enums across identity, catalog,
rentals, payments, audit, marketing, support, SOC, intelligence, and
geolocation domains. Model presence establishes a data contract only. Service
authorization establishes mutation authority, and no production records were
inspected while preparing this documentation.

## Module Status Rules

1. Current code and final accepted governance outrank plans and older manuals.
2. Formal freeze/closure evidence outranks conservative historical labels.
3. An optional route shell cannot invalidate a completed underlying
   capability.
4. A dedicated capability is not claimed unless a service/API/test or accepted
   requirement supports it.
5. External integrations and infrastructure remain externally verifiable
   state.

See the module, workflow, API, data, route, phase, and limitation registries in
`../00-WORKING-REGISTRIES/` for the frozen evidence tables.
