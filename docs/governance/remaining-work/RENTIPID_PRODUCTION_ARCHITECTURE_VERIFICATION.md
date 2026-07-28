# RENTipid Production Architecture Verification

**Effective date:** 2026-07-28  
**Scope:** One-pass production architecture verification and PHASE 17 retargeting  
**Method:** Owner-supplied production inventory, one repository discovery pass, one sanitized Vercel metadata check, and one sanitized Azure metadata check

This document records resource names and configuration-variable names only. It contains no secret values, connection strings, credentials, or live query results.

## Architecture Decision

**Classification: `HYBRID_OR_UNRESOLVED`**

The Vercel frontend is confirmed. Azure PostgreSQL server `rentipid-postgres-db` is the owner-designated authoritative PHASE 17 target and is corroborated by production Terraform. The production backend host is unresolved because runtime metadata could not be authenticated, the known Azure inventory does not include a Container App, and the repository does not record a production Azure API hostname or required API-base configuration.

Neon is **NOT_ACTIVE** for current governance decisions: it appears only in legacy documentation and repository safety references, not in owner-supplied production inventory or active infrastructure configuration.

## Authoritative Production Topology

| Layer | Authoritative determination | Verification boundary |
|---|---|---|
| Public frontend | RENTipid Next.js application on Vercel | Confirmed by owner-supplied production facts and repository architecture documents. |
| Vercel application configuration | Vercel holds the named authentication, application-base, payment, and Azure-routing variables supplied by the owner | Presence does not establish any variable's value or prove successful runtime routing. |
| Backend routing | Azure backend migration artifacts exist, but the production API route is not verified end to end | The repository contains an Express API, Azure Container Apps Terraform, and a deployment workflow. The supplied Azure inventory does not identify a deployed Container App or public API hostname. |
| Production database server | Azure Database for PostgreSQL resource `rentipid-postgres-db` | This is the authoritative PHASE 17 server target. The logical database name, schema selection, endpoint, and network path require DBA confirmation. |
| Secret store | Azure Key Vault resource `kv-rentipid-prod` exists | The repository intends Azure workloads to use managed identity and Key Vault. Actual secret bindings and access policies were not inspected. |
| Container registry | Azure Container Registry resource `rentipidacr` exists | Registry existence does not prove a production API revision is deployed. |
| Container Apps environment | Azure resource `rg-rentipid-prod-env` exists | Environment existence does not prove a Container App, ingress hostname, or healthy revision exists. |
| Logging | Azure resource `rg-rentipid-prod-log` exists | Workspace existence does not prove application diagnostics are connected. |
| Payments | PayMongo live-related variable names exist in Vercel | No live-payment execution or readiness conclusion is authorized by variable presence. PHASE 19 remains unfinished. |

## Evidence Index

| Evidence location | Finding | Architecture implication | Confidence |
|---|---|---|---|
| Owner production facts | Public application is deployed on Vercel | Frontend host is Vercel | CONFIRMED |
| `src/lib/api-client.ts` | Azure client checks `NEXT_PUBLIC_USE_AZURE_BACKEND` and requires `NEXT_PUBLIC_API_URL` for a non-local base URL | Flag presence alone does not prove Azure routing | CONFIRMED |
| Owner Vercel variable-name inventory | `NEXT_PUBLIC_USE_AZURE_BACKEND` exists; no backend/API URL variable was supplied | Azure backend URL is unresolved | CONFIRMED |
| Representative `src/app/api/**/route.ts` migration stubs | Migrated routes return HTTP 410 and refer callers to `azureFetch` | Vercel route fallback is not an active backend for those routes | CONFIRMED |
| Repository call-site inventory | `azureFetch` has no implemented application callers | Client cutover is not demonstrated | CONFIRMED |
| `next.config.ts` and Vercel-file inventory | No rewrite and no `vercel.json` were found | No repository-defined Vercel-to-Azure proxy route | CONFIRMED |
| `.github/workflows/azure-deploy.yml` | Declares an Azure Container Apps deployment workflow | Azure backend deployment is intended | STRONGLY_INDICATED |
| `infrastructure/environments/prod/**` and `infrastructure/modules/**` | Import or declare Azure PostgreSQL, Container Apps environment, ACR, and Container App resources | Azure is the intended backend/database platform | STRONGLY_INDICATED |
| Owner Azure resource inventory | Confirms `rentipid-postgres-db`, `kv-rentipid-prod`, `rentipidacr`, `rg-rentipid-prod-env`, and `rg-rentipid-prod-log`; no Container App was identified | Azure supporting resources exist; active backend host remains unresolved | CONFIRMED |
| `prisma/schema.prisma` and `prisma.config.ts` | Prisma uses PostgreSQL through `DATABASE_URL`; no datasource `DIRECT_URL` is declared | Provider is PostgreSQL, but variable names do not identify a cloud vendor | CONFIRMED |
| Governance Neon references | Neon claims are unsupported by owner inventory and active infrastructure files | Treat Neon as legacy/not active | NOT_ACTIVE |
| Vercel CLI metadata check | CLI is not installed | Runtime project, scopes, and integrations could not be independently verified | UNRESOLVED |
| Azure CLI metadata check | CLI is installed but authentication is unavailable (`CLI_AUTHENTICATION_BLOCKED`) | Container App, revision, secret-reference, and backup metadata remain unresolved | UNRESOLVED |

## Sanitized Metadata Check Result

- Vercel metadata checks performed: 1. Result: CLI not installed.
- Azure metadata checks performed: 1. Result: `CLI_AUTHENTICATION_BLOCKED`; no login retry was attempted.
- No environment-variable values, secrets, credentials, URLs, or database records were retrieved.

## Routing Findings

- `NEXT_PUBLIC_USE_AZURE_BACKEND` is referenced by `src/lib/api-client.ts`, but its value was not inspected.
- The client requires `NEXT_PUBLIC_API_URL` to select a non-local API base URL. That name is not in the owner-supplied Vercel production-variable inventory.
- No production Azure Container Apps hostname is recorded in the repository.
- No `vercel.json` or `next.config.ts` rewrite routes Vercel requests to Azure.
- `azureFetch` has no implemented application call sites; the references found outside its definition are migration comments.
- Representative Vercel API routes are migration stubs that return HTTP 410.

Therefore, the public frontend host is verified, but a production Vercel-to-Azure API path is **not verified**. Terraform, workflow, and migration documents are implementation intent, not sufficient evidence of deployed runtime state.

## Database Findings

- Prisma declares PostgreSQL and reads `DATABASE_URL`.
- `DATABASE_URL` is a connection-variable name, not evidence of Neon or any other provider.
- `DIRECT_URL` is not part of the Prisma datasource configuration; repository usage is limited to safety tooling and tests.
- `DATABASE_URL` and `DIRECT_URL` are not in the owner-supplied Vercel production-variable inventory.
- The repository contains an intended logical name (`rentipid_db`) in one Terraform path and an unsupported PHASE 17 name (`rentipid_production`) in prior governance records. Neither is accepted as the deployed logical database name without DBA confirmation.
- No repository evidence supports Neon as a current RENTipid production service.

## PHASE 17 Authoritative Target

PHASE 17 is retargeted as follows:

- **Provider:** Microsoft Azure
- **Service:** Azure Database for PostgreSQL
- **Server resource:** `rentipid-postgres-db`
- **Logical database:** DBA-confirmed production database on the authoritative server
- **Schema:** DBA-confirmed target schema; `public` is expected by current governance records but must not be assumed
- **Access:** Dedicated, expiring, read-only credential delivered only to an authorized audit execution environment
- **Secret handling:** Prefer an approved secret-delivery path associated with `kv-rentipid-prod`; do not reuse, reveal, or overwrite the application's production `DATABASE_URL`
- **Mutations:** Prohibited, including migrations, seeds, backfills, role changes by the auditor, and live-payment activity

PHASE 17 remains **BLOCKED** until the owner, DBA, and Security Administrator confirm:

1. the Azure subscription/resource-group coordinates for `rentipid-postgres-db`;
2. the logical database and schema identifiers;
3. an authorized network path and audit execution environment;
4. a dedicated read-only role and expiring credential;
5. current Azure backup/restore evidence;
6. credential delivery and revocation procedures; and
7. explicit owner authorization for the read-only production connection.

No database connection or query is authorized by this document.

## Governance Scope

The only unfinished phases are PHASE 17, PHASE 19, and PHASE 19B. All PHASE5 phases are closed and frozen and must not be reopened or reprocessed. Historical or generated audit artifacts that list other work do not override this owner-authoritative remaining-work scope.
