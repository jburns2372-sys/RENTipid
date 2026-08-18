# RENTipid Master Owner Acceptance Test Framework

## Framework Purpose
The Master Owner Acceptance Test (OAT) Framework provides a permanent, structured methodology for the RENTipid owner to physically verify that completed modules function correctly in the deployed Preview application. 

It aims to validate workflows without:
- Rebuilding test users manually
- Recreating test listings, bookings, or campaigns
- Manually preparing prerequisite data
- Relying solely on automated test reports
- Contaminating Production data
- Inventing ad-hoc testing approaches for each module

## Environment Safety
OAT execution is restricted to **PREVIEW ONLY**.
The `oat-environment-guard` automatically aborts any execution if:
- `NODE_ENV` indicates Production.
- `VERCEL_ENV` indicates Production.
- The database identity matches the Production database.
- The environment identity is unknown or unsafe.

## Naming Standard
Modules follow a strict universal identifier:
`OAT-<MODULE>-MASTER-001`
*(e.g., OAT-SOCIAL-MASTER-001, OAT-AUTH-MASTER-001)*

Individual test runs are identified deterministically:
`OAT-RUN-<MODULE>-<YYYYMMDD-HHMMSS>`

## Shared OAT Users
To prevent duplicate account creation, the framework defines Canonical Shared Accounts:
- **Owner**: `oat.owner@rentipid.test`
- **Admin**: `oat.admin@rentipid.test`
- **Reviewer**: `oat.reviewer@rentipid.test`
- **Provider**: `oat.provider@rentipid.test`
- **Renter**: `oat.renter@rentipid.test`
- **Restricted**: `oat.restricted@rentipid.test`

## Fixture Architecture
OAT records belong to two classes:
1. **CLASS A — PERMANENT MASTER FIXTURE**: Users, providers, canonical listings. These survive resets.
2. **CLASS B — TRANSIENT RUN DATA**: Test bookings, payments, social posts, applications. These are safely removed or archived during resets.

## Reset Standard
Modules provide a safe reset command:
`npm run oat:<module>:reset`

Reset operations:
- Must verify Preview environment.
- Scope operations strictly to known OAT IDs.
- Preserve Class A permanent fixtures.
- Restore baseline fixture state and clean/archive Class B transient data.
- MUST NOT use global deletions, `TRUNCATE`, or `prisma db push`.

## Readiness Standard
Modules provide a read-only readiness check:
`npm run oat:<module>:check`

This outputs standard readiness dimensions including Database Safety, Fixture Readiness, RBAC validation, and Mock/Sandbox states.

## Manual Test Standard
Every module includes a manual owner checklist designed to complete in 10-15 minutes, validating the user-visible business workflow. The manual test standard covers functional, RBAC, persistence, validation, integration, error state, audit, AI safety, and Mock/Sandbox dimensions.

## Result Format
Test execution results are recorded in a canonical format covering Readiness, Primary Workflow, RBAC, Validation, Error Handling, Integration, Persistence, AI Safety, Mock/Sandbox, Defects, and Final Owner Acceptance.

## Defect Workflow
If an OAT fails, a defect (`OAT-DEFECT-<MODULE>-###`) is recorded. The defect is fixed in isolation, regression tested, deployed to Preview, and re-tested using OAT. The entire module architecture is NOT reopened.

## Module Registry
The central code-authoritative registry is located at `src/lib/oat/oat-module-registry.ts`. All OAT modules must be registered here to participate in the master CLI runner (`scripts/oat/oat-runner.ts`).

## Deployment Governance
Owner Acceptance is an additional evidence gate. The preferred release sequence is:
CODE COMPLETE → LOCAL FUNCTIONAL → LOCAL DB MIGRATED → LOCAL DATA SEEDED → LOCAL ACCEPTANCE PASS → PREVIEW MIGRATED → PREVIEW ACCEPTANCE PASS → **OWNER ACCEPTANCE PASS** → PRODUCTION-READY → CLOSED/FROZEN

## How to Add a Future Module
1. Define the OAT module using the OATModuleDefinition interface.
2. Register it in `src/lib/oat/oat-module-registry.ts`.
3. Ensure its fixture provider acts idempotently (using `upsert`).
4. Implement safe transient data cleanup in its reset handler.
5. Create the manual owner checklist using `TEMPLATE-OWNER-ACCEPTANCE-TEST.md`.
6. Use the `scripts/oat-runner.ts` to test setup, check, and reset.
