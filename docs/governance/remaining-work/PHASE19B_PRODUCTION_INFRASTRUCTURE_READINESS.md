# PHASE 19B — Production Infrastructure Readiness

## Target Architecture Clarification

* **Verified Public Frontend**: RENTipid Next.js is deployed on Vercel.
* **Authoritative Database Server**: Azure Database for PostgreSQL resource `rentipid-postgres-db`.
* **Verified Azure Supporting Resources**: Key Vault `kv-rentipid-prod`, Container Registry `rentipidacr`, Container Apps environment `rg-rentipid-prod-env`, and logging resource `rg-rentipid-prod-log`.
* **Unsupported Provider Assumption Removed**: Neon is not part of the authoritative production inventory and must not be used for readiness or PHASE 17 decisions.
* **Unverified Backend Route**: Repository artifacts describe Azure Container Apps, but the supplied inventory and repository do not establish a deployed Container App, public API hostname, or successful Vercel-to-Azure route.

The governing evidence and verification boundaries are recorded in `RENTIPID_PRODUCTION_ARCHITECTURE_VERIFICATION.md`.

## Readiness Scope

* **Vercel Production Readiness**: Confirm the existing production project, canonical domain, protected source integration, and successful build/runtime evidence. This task does not deploy or change Vercel configuration.
* **Backend Ownership and Routing**: Identify which production operations remain in Vercel and which are served by Azure. If Azure is active, confirm the deployed Container App name, ingress hostname, healthy revision, and the Vercel API-base configuration without exposing values.
* **Routing Gap**: `NEXT_PUBLIC_USE_AZURE_BACKEND` presence alone is insufficient. The repository client also depends on `NEXT_PUBLIC_API_URL`, which is not in the owner-supplied Vercel production-variable inventory, and no production rewrite is defined.
* **Azure PostgreSQL Connectivity**: Confirm the logical database, schema, network restrictions, workload identity, pooling approach if required, and the authorized application's connection path to `rentipid-postgres-db`.
* **Secrets and Identity Configuration**: Confirm the division of responsibility between Vercel production configuration and `kv-rentipid-prod`. Verify managed-identity and secret bindings through sanitized evidence; do not copy secret values into governance records.
* **Container Registry and Runtime**: Confirm whether an API image in `rentipidacr` is attached to a deployed, healthy Container App. Registry and Container Apps environment existence alone are not deployment evidence.
* **Monitoring and Alerting**: Confirm Vercel runtime monitoring plus Azure application/database diagnostics and alert routing. Existence of `rg-rentipid-prod-log` alone is not sufficient.
* **Backups and Disaster Recovery**: Confirm Azure PostgreSQL backup retention, restore capability, and a current sanitized restore-point record.
* **Post-Deployment Smoke Tests**: After separate authorization, use non-mutating synthetic checks against the verified live domain and API health endpoints. No live-money transaction is part of PHASE 19B readiness verification.
* **Admin and Emergency-Freeze Validation**: Production state changes require separate explicit authorization and must not be inferred from this documentation correction.
* **Controlled Payment-Pilot Dependencies**: PHASE 19B and PHASE 17 must be accepted before PHASE 19 can proceed.

## Current Status

**UNFINISHED — `HYBRID_OR_UNRESOLVED`.** The resource inventory is corrected, but backend routing, logical database identity, network connectivity, secret bindings, monitoring, and restore evidence remain to be verified by authorized owners.
