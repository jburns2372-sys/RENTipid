# RENTipid Deployment, Operations, and Recovery

## Operating Principle

This manual describes controls and target procedures; it does not authorize an
operation. Production, cloud, database, payment, DNS, or deployment work
requires a separate approved gate with exact scope, identity, rollback, and
evidence requirements.

## Pre-Operation Gate

Before an authorized change, record:

1. the controlling approval and exact environment;
2. repository branch, commit, and intended artifact;
3. current dirty-worktree disposition without discarding user work;
4. application, database, storage, network, identity, monitoring, and provider
   dependencies;
5. secret-provider references without printing values;
6. health, migration, backup/checkpoint, rollback, and abort criteria;
7. payment mode and the Phase 19 authorization boundary;
8. operator, reviewer, and evidence locations.

## Deployment Sequence

A future authorized sequence should validate rather than assume:

- configuration-name completeness and secret-provider availability;
- build/test results for the exact artifact;
- database compatibility and guarded migration status;
- API and worker identity/RBAC connectivity;
- storage private access and signed-operation behavior;
- monitoring and sanitized health telemetry;
- frontend/backend routing behavior during the split transition;
- rollback and traffic-restoration procedures before cutover.

Terraform planning/apply, Vercel deployment, Azure changes, database migration,
traffic migration, and DNS cutover are explicitly outside this documentation
run.

## Application Recovery

Contain the failing change, preserve sanitized logs and correlation IDs, and
restore only through an approved artifact/configuration rollback. Do not copy
secret-bearing configuration into incident notes. Validate session, core route,
API health, worker behavior, database connectivity, storage access, and
telemetry after recovery.

## Database Recovery

Database recovery requires an exact non-production or production target,
backup/checkpoint authority, compatibility review, and explicit mutation
authorization. The repository's test-database and restore-target guards must
remain enabled. Production data was not inspected or changed for this manual.

## SOC Recovery

SOC recovery uses the accepted Phase 4 runbook:

- freeze unsafe response execution while preserving authorized rollback;
- inspect execution and approval state for divergence;
- recover event ingestion under an exclusive lease;
- use bounded replay and idempotent normalization;
- advance checkpoints only after valid processing;
- release safely on failure or lease loss;
- validate using accepted non-production procedures.

The maintenance placeholder page is not a recovery console. The accepted
runbook and services are authoritative.

## Payment Incident Boundary

Live payment activation remains `COMPLETE_NO_GO_FROZEN`. For mismatches or
webhook failures, preserve signature/reconciliation evidence, stop duplicate
actions, and escalate through finance controls. Do not generate compensating
live transactions without exact authorization.

## External-State Verification

Local Terraform, route code, domain strings, and dashboards cannot prove
current Vercel, Azure, PostgreSQL, storage, provider, monitoring, or DNS state.
External verification must be read-only unless the approved operation
explicitly grants mutation authority.
