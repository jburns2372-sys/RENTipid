# RENTipid Operations Manual

## Operating Boundary

This manual describes repository-supported procedures but grants no cloud,
database, payment, deployment, traffic, DNS, or production authority. Every
mutation requires the exact server permission, valid state transition,
smallest necessary scope, sanitized audit evidence, and any separately
required Owner approval.

## Administrative Operations

Admin surfaces cover categories, bookings, disputes, support, feedback,
issues, beta/UAT, release/readiness, marketing, AI settings/logs, and system
logs. Admin reports expose aggregates, but CSV export and some AI metrics are
placeholders; super-admin reports inherit that limitation.

## Finance Operations

> **Payment-mode boundary:** Phase 19 is
> `PHASE19_COMPLETE_NO_GO_FROZEN`, and `PAYMENT_ACTIVATION` is
> `NOT_AUTHORIZED`. Mock, sandbox, readiness, dashboard, and training behavior
> must never be represented or used as live money movement.

Finance roles review gateway events, webhook evidence, reconciliation,
deposits, refunds, payouts, batches, ledger, and settlement readiness. Verify
signature outcome, idempotency, amount/currency, business state, role, and
evidence before a permitted action. Preserve mismatches and escalate; never
manufacture a compensating live transaction.

## Compliance and Privacy Operations

Compliance reviews KYC, verification documents, listing requirements, and
controlled decisions. Privacy requests require identity/scope/retention/audit
checks. Minimize copied evidence, restrict document access, and never place raw
KYC data or credentials in general logs.

## SOC Operations

Use authorized dashboard, event, alert, case, playbook, approval, response,
rollback, intelligence, and threat-map surfaces. Gate 4I controlled simulation
and Gate 4J maintenance/recovery are complete/frozen capabilities. The
standalone simulations page is a navigation shell; reports and maintenance
pages are planned shells. They are not execution, export, or recovery consoles.

## Incident and Recovery Procedure

1. classify lifecycle/environment and preserve sanitized identifiers;
2. contain unsafe execution with emergency freeze where authorized;
3. inspect case, approval, execution, and current resource state;
4. use separately authorized rollback only when divergence checks pass;
5. recover ingestion with exclusive leases, bounded replay, idempotency, and
   safe checkpoint advancement;
6. validate in an approved non-production context before any separately
   authorized production operation.

## Deployment and Database Gate

The authoritative direction is
`VERCEL_FRONTEND_WITH_AZURE_BACKEND_AND_SERVICES`; the repository transition
state is `PARTIALLY_SPLIT_IMPLEMENTATION`. Local infrastructure definitions do
not prove deployment.

`DATABASE_MIGRATION: PENDING_SEPARATE_OWNER_DECISION`

Azure provisioning, deployment, traffic migration, and DNS cutover authorized
by this documentation: `NO`.

## Evidence and Escalation

Use correlation IDs, record IDs, stable sanitized outcomes, exact approved
reports, and current service state. Escalate permission failures, mismatched
financial evidence, divergent response state, suspected compromise, unavailable
providers, or any action outside the approved gate. See Parts IX through XIII
and XXI through XXIII of the master manual.
