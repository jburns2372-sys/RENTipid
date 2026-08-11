# RENTipid Technical Architecture and Configuration

## Architecture Classification

`AUTHORITATIVE_ARCHITECTURE_DIRECTION: VERCEL_FRONTEND_WITH_AZURE_BACKEND_AND_SERVICES`

`CURRENT_REPOSITORY_RUNTIME_TRANSITION_STATE: PARTIALLY_SPLIT_IMPLEMENTATION`

`AZURE_PROVISIONING_OR_DEPLOYMENT_AUTHORIZED_BY_DOCUMENTATION: NO`

The root Next.js application supplies frontend/server rendering,
authentication, dashboards, and remaining root APIs. `apps/api` is the
extracted backend target, and `apps/worker` is the background-job target.
Terraform defines Azure network, compute, database, storage, registry,
monitoring, identity, and secret-provider relationships. Coexistence of root
and extracted APIs means the cutover is transitional.

## Runtime Targets

| Concern | Target classification |
| --- | --- |
| Frontend and authentication | Vercel project `ren-tipid`; Owner-verified identity |
| Extracted API | Azure Container Apps target; deployment not inferred |
| Background jobs | Azure Container Apps Job target; deployment not inferred |
| Database | Azure PostgreSQL Flexible Server target |
| Object storage | Azure Blob Storage private/managed-identity target |
| Secrets | Azure Key Vault boundary |
| Monitoring | Log Analytics and Application Insights definitions |
| Registry | Azure Container Registry definition/input |
| Network | Parallel VNet `10.219.0.0/20`, ACA `/23`, private endpoint `/24`; design only |

Owner-verified public Vercel identities are `www.rentipid.com.ph` and
`ren-tipid.vercel.app`. They were not live-checked during this documentation
work, and no DNS or deployment change was authorized.

## Request and Data Flow

The browser reaches the Next.js runtime and authenticated dashboards.
Depending on route/configuration, a root API either handles the operation or
uses the extracted backend path. Services validate session, role, ownership,
input, and state before reading or writing PostgreSQL or object storage.
Background jobs handle bounded scheduled/recovery work. Telemetry is designed
for sanitized application/security evidence.

## Configuration Contract

The repository references configuration names for runtime routing,
authentication/data, Azure services, payment providers, security/crypto/SOC,
CI/jobs, email, and SMTP. Only names are documented. Actual values, tokens,
passwords, database URLs, connection strings, SAS values, private keys, HMAC
material, and provider secrets are excluded.

The source inventory found 52 referenced names versus 19 names in the
production example template. That is a configuration-review requirement, not
permission to invent or retrieve values. Templates establish a contract only;
they do not prove external configuration.

## Environment Separation

Local development, guarded test databases, staging/readiness, and production
must remain isolated. Database mutation guards and explicit restore-target
checks are safety controls. They are not deployment switches and must never be
weakened for convenience.

## Infrastructure Status

Terraform and local client code demonstrate intended architecture and current
implementation work. They do not establish that a resource exists, is healthy,
is connected, or is serving traffic. Phase 19B does not authorize provisioning,
deployment, traffic migration, DNS cutover, or database migration.

`PHASE19B_FINAL_STATUS: PHASE19B_COMPLETE_WITH_SEPARATE_OWNER_DECISIONS_RESERVED`

`DATABASE_MIGRATION: PENDING_SEPARATE_OWNER_DECISION`

AWS- and PM2-oriented materials and AWS-named readiness routes are
`SUPERSEDED_ARCHITECTURE_HISTORY`, not the current architecture authority.
