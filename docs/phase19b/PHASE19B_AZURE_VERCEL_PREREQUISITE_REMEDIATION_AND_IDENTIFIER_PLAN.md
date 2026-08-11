# PHASE19B Azure/Vercel Prerequisite Remediation and Identifier Master Plan

## Executive Summary

This master plan is the authoritative, one-time planning document for all 18 remaining PHASE19B prerequisites. It consolidates E1â€“E5 evidence, assigns every prerequisite to exactly one of five execution slices, defines exact file boundaries, validation commands, model routing, and dependency ordering. This plan eliminates redundant repository discovery, duplicate assignments, and unnecessary Owner-decision cycles.

Key discovery findings that update E1â€“E5 evidence:
- **Health route exists**: `apps/api/src/routes/health.ts` provides `/health/live` and `/health/ready` endpoints, mounted at `/health` in `apps/api/src/index.ts`. PR-15 is reclassified from NOT_FOUND to LOCALLY_CONFIRMED.
- **Worker application exists**: `apps/worker/` contains `src/index.ts` and `src/jobs/bookingExpirationSweeper.ts` with a complete job runner. PR-01 is reclassified from NOT_FOUND to LOCALLY_CONFIRMED (application code exists, but Terraform Container App definition is absent).
- **Terraform defaults contain literal identifiers**: `infrastructure/environments/prod/variables.tf` provides default values for resource group, PostgreSQL server, Log Analytics workspace, container registry, and container app environment names. PR-17 is partially satisfiable from repository evidence alone.

## Repository State

- **Repository**: C:\Users\user\Documents\JD SOFTWARE PROJECTS\RENTipid
- **Branch**: feature/soc-phase4-threat-response
- **HEAD**: 5804d4cceafc74e5e51b554be6f84a1b9c80e8be
- **PHASE19**: PHASE19_COMPLETE_NO_GO_FROZEN

## Authoritative Architecture

- **Architecture**: VERCEL_FRONTEND_WITH_AZURE_BACKEND_AND_SERVICES
- **Frontend**: Vercel (Next.js)
- **Backend API**: Azure Container Apps (`apps/api`)
- **Worker**: Azure Container Apps Jobs (`apps/worker`)
- **Database target**: Azure Database for PostgreSQL Flexible Server
- **Storage**: Azure Blob Storage
- **Monitoring**: Azure Application Insights + Azure Monitor + Log Analytics
- **Authentication**: Vercel (NextAuth)
- **AWS workstream**: SUPERSEDED_AND_CANCELLED

## Owner Authorization Boundary

Current production access authorized: NO
Current Azure access authorized: NO
Current Vercel authenticated access authorized: NO
Current database access authorized: NO
Current provisioning authorized: NO
Current deployment authorized: NO
Current migration authorized: NO
Current production checks authorized: NO
Current live-payment activation authorized: NO
Option 3 available: NO

No planned slice may override these fields without a separate Owner decision.

## One-Time Discovery Scope

This gate performed one bounded read-only discovery pass within:
- `infrastructure/` (all `.tf`, `.tfvars` files)
- `apps/api/src/` (all `.ts` files)
- `apps/worker/` (all `.ts`, `.json` files)
- `apps/api/package.json`
- `package.json`
- `.env.production.example`
- `next.config.ts`

Future slices must use the Authoritative Relevant-File Registry below and must not repeat broad discovery.

## Authoritative Relevant-File Registry

### Infrastructure Files
| File | Purpose | Slices |
| --- | --- | --- |
| `infrastructure/main.tf` | Root Terraform: resource group, ACR, Log Analytics, Container App Environment, PostgreSQL, Key Vault | R1, R2, R3 |
| `infrastructure/variables.tf` | Root variables with literal defaults (region: `southeastasia`, RG: `rg-rentipid-prod`, DB: `rentipid-postgres-db`) | R3, R4 |
| `infrastructure/outputs.tf` | Terraform outputs | R1, R3 |
| `infrastructure/environments/prod/main.tf` | Prod composition: database, storage, compute modules | R1, R2, R3 |
| `infrastructure/environments/prod/variables.tf` | Prod defaults: RG `rg-rentipid-prod`, DB `rentipid-postgres-db`, Log Analytics `rg-rentipid-prod-log`, ACR `rentipidacr`, CA Env `rg-rentipid-prod-env` | R4 |
| `infrastructure/modules/compute/main.tf` | API Container App definition (no worker, no probes) | R1 |
| `infrastructure/modules/compute/variables.tf` | Compute module variables | R1 |
| `infrastructure/modules/database/main.tf` | PostgreSQL Flexible Server (30-day backup, no geo-redundancy, no HA, no private DNS) | R3 |
| `infrastructure/modules/database/variables.tf` | Database module variables | R3 |
| `infrastructure/modules/storage/main.tf` | Storage account + kyc-documents and listing-media containers | R3 |
| `infrastructure/modules/storage/variables.tf` | Storage module variables | R3 |

### Application Files
| File | Purpose | Slices |
| --- | --- | --- |
| `apps/api/src/index.ts` | API entrypoint: mounts `/health`, `/bookings`, `/documents` routes, listens on PORT 3000 | R1 |
| `apps/api/src/routes/health.ts` | Health routes: `/live` (liveness) and `/ready` (readiness with TODO for DB check) | R1 |
| `apps/api/src/routes/webhooks.ts` | PayMongo webhook route: `/paymongo` | R5 |
| `apps/api/src/middleware/appInsights.ts` | Application Insights initialization (auto-collection, no redaction) | R2 |
| `apps/api/src/middleware/cors.ts` | CORS: references `NEXT_PUBLIC_VERCEL_URL`, `PRODUCTION_DOMAIN` | R4 |
| `apps/api/src/services/blobService.ts` | Azure Blob Storage client using `AZURE_STORAGE_ACCOUNT_NAME` and `AZURE_STORAGE_ACCOUNT_KEY` | R3 |
| `apps/worker/src/index.ts` | Worker entrypoint: job dispatcher by `JOB_NAME` env var | R1 |
| `apps/worker/src/jobs/bookingExpirationSweeper.ts` | Booking expiration sweeper job using Prisma | R1 |
| `apps/worker/package.json` | Worker package manifest (`rentipid-azure-worker`) | R1 |

### Configuration Files
| File | Purpose | Slices |
| --- | --- | --- |
| `.env.production.example` | Environment template (placeholders, `STORAGE_PROVIDER=local`) | R3, R4 |
| `next.config.ts` | Next.js config (minimal, no rewrites/redirects) | R4 |

## Carried-Forward Prerequisite Registry

| ID | Prerequisite | Current Evidence | Classification | Primary Slice | Dependency | Local Change | External Action | Owner Decision | Trusted Admin Input | Risk | Acceptance Evidence | Recommended Model |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PR-01 | Azure worker Container App not documented | Worker app code exists at `apps/worker/`; Terraform `compute/main.tf` has no worker Container App resource | LOCAL_INFRASTRUCTURE_REMEDIATION | R1 | None | YES | NO | NO | NO | Medium | Worker `azurerm_container_app` or `azurerm_container_app_job` resource in `compute/main.tf` | Claude Sonnet 4.6 |
| PR-02 | Health probe not documented | Health routes exist at `apps/api/src/routes/health.ts` (`/live`, `/ready`); Terraform `compute/main.tf` has no `liveness_probe` or `readiness_probe` blocks | LOCAL_INFRASTRUCTURE_REMEDIATION | R1 | None | YES | NO | NO | NO | Medium | `liveness_probe` and `readiness_probe` blocks in `compute/main.tf` referencing `/health/live` and `/health/ready` | Claude Sonnet 4.6 |
| PR-03 | Readiness probe not documented | Same as PR-02; `/health/ready` route exists but no Terraform probe | LOCAL_INFRASTRUCTURE_REMEDIATION | R1 | PR-02 | YES | NO | NO | NO | Medium | `readiness_probe` block in `compute/main.tf` referencing `/health/ready` | Claude Sonnet 4.6 |
| PR-04 | Azure PostgreSQL not provisioned | `modules/database/main.tf` defines `azurerm_postgresql_flexible_server`; no evidence of actual Azure provisioning | EXTERNAL_AZURE_PROVISIONING | R3 | None | NO | YES | YES | YES | High | Azure Portal or CLI confirmation of running server | Claude Opus 4.6 |
| PR-05 | Production database path not verified | No network path evidence; `public_network_access_enabled = false` in Terraform | PRODUCTION_VERIFICATION_REQUIRED | R3 | PR-04 | NO | YES | YES | YES | High | Verified Container App â†’ PostgreSQL connectivity | Claude Opus 4.6 |
| PR-06 | Database migration requirement not resolved | Prisma schema exists; no decision on new-empty vs. migrate-existing | OWNER_DECISION_REQUIRED | R3 | PR-04 | NO | NO | YES | NO | High | Owner decision recorded: NEW_EMPTY or MIGRATE_EXISTING or RETAIN_CURRENT | Claude Opus 4.6 |
| PR-07 | Azure Blob Storage not provisioned | `modules/storage/main.tf` defines storage account and containers; no provisioning evidence | EXTERNAL_AZURE_PROVISIONING | R3 | None | NO | YES | YES | YES | Medium | Azure Portal or CLI confirmation of storage account | Claude Opus 4.6 |
| PR-08 | Production storage connection not verified | `blobService.ts` uses `AZURE_STORAGE_ACCOUNT_NAME` + `AZURE_STORAGE_ACCOUNT_KEY`; no connection test | PRODUCTION_VERIFICATION_REQUIRED | R3 | PR-07 | NO | YES | YES | YES | Medium | Verified upload/download from Container App to Blob | Claude Opus 4.6 |
| PR-09 | Operational backup not verified | Terraform sets `backup_retention_days = 30`; no Azure backup operation evidence | EXTERNAL_AZURE_PROVISIONING | R3 | PR-04 | NO | YES | YES | YES | High | Azure backup operation log or Portal confirmation | Claude Opus 4.6 |
| PR-10 | Restore testing not verified | No restore test evidence | PRODUCTION_VERIFICATION_REQUIRED | R3 | PR-04, PR-09 | NO | YES | YES | NO | Critical | Documented restore test with measured RPO/RTO | Claude Opus 4.6 |
| PR-11 | Application Insights infrastructure linkage not documented | `appInsights.ts` initializes SDK; no `azurerm_application_insights` resource in any Terraform file | LOCAL_INFRASTRUCTURE_REMEDIATION | R2 | None | YES | NO | NO | NO | Medium | `azurerm_application_insights` resource in Terraform linked to Log Analytics | Claude Opus 4.6 |
| PR-12 | Alert rules not documented | No `azurerm_monitor_metric_alert` or `azurerm_monitor_scheduled_query_rules_alert` in Terraform | LOCAL_INFRASTRUCTURE_REMEDIATION | R2 | PR-11 | YES | NO | NO | NO | Medium | Alert rule definitions in Terraform for critical metrics | Claude Opus 4.6 |
| PR-13 | Production monitoring not verified | App Insights SDK active in code; no live telemetry evidence | PRODUCTION_VERIFICATION_REQUIRED | R5 | PR-11, PR-12 | NO | YES | YES | YES | Medium | Live telemetry flowing in Application Insights | Claude Opus 4.6 |
| PR-14 | Telemetry redaction evidence absent | `appInsights.ts` uses auto-collection with no explicit `TelemetryProcessor` for redaction | LOCAL_APPLICATION_REMEDIATION | R2 | None | YES | NO | NO | NO | High | Telemetry processor filtering PII/payment data from traces | Claude Opus 4.6 |
| PR-15 | Public health route not found | ALREADY_SATISFIED: `apps/api/src/routes/health.ts` provides `/health/live` and `/health/ready`; mounted at `/health` in `index.ts` | ALREADY_SATISFIED_BY_NEW_EVIDENCE | R1 | None | NO | NO | NO | NO | None | Route file and mount confirmed at `/health/live` and `/health/ready` | Claude Sonnet 4.6 |
| PR-16 | Verified production URL not found | `.env.production.example` has `APP_BASE_URL=https://your-production-domain.com` (placeholder); CORS references `PRODUCTION_DOMAIN` env var | TRUSTED_ADMIN_IDENTIFIER_REQUIRED | R4 | None | NO | NO | NO | YES | Low | Literal HTTPS URL provided and confirmed by trusted administrator | Claude Sonnet 4.6 |
| PR-17 | Literal non-secret identifiers incomplete | Terraform prod defaults provide: `rg-rentipid-prod`, `rentipid-postgres-db`, `rg-rentipid-prod-log`, `rentipidacr`, `rg-rentipid-prod-env`; remaining identifiers (subscription, public URL, App Insights name, storage account name) absent | TRUSTED_ADMIN_IDENTIFIER_REQUIRED | R4 | None | NO | NO | NO | YES | Low | All 16+ identifier fields populated or confirmed NOT_APPLICABLE | Claude Sonnet 4.6 |
| PR-18 | Exact production checks unavailable | No literal identifiers for Azure CLI commands; no verified URL for public checks | PRODUCTION_VERIFICATION_REQUIRED | R5 | R1, R2, R3, R4 | NO | YES | YES | YES | Low | Exact read-only commands documented with literal identifiers | Claude Opus 4.6 |

## Exact-Once Assignment Validation

Total prerequisites: 18
Assigned to R1: PR-01, PR-02, PR-03, PR-15 (4)
Assigned to R2: PR-11, PR-12, PR-14 (3)
Assigned to R3: PR-04, PR-05, PR-06, PR-07, PR-08, PR-09, PR-10 (7)
Assigned to R4: PR-16, PR-17 (2)
Assigned to R5: PR-13, PR-18 (2)
Total assigned: 18
Unassigned: 0
Duplicated primary assignments: 0

## Dependency Graph

```
PR-15 (satisfied) â”€â”€â”
PR-01 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
PR-02 â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤â”€â”€ R1
PR-03 â”€â”€â”˜           â”‚
                    â”‚
PR-14 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
PR-11 â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤â”€â”€ R2
PR-12 â”€â”€â”˜           â”‚
                    â”‚
PR-04 â”€â”€â”¬â”€â”€ PR-05   â”‚
        â”œâ”€â”€ PR-09 â”€â”€â”¤
        â”‚   â””â”€ PR-10â”‚â”€â”€ R3
PR-06 â”€â”€â”˜           â”‚
PR-07 â”€â”€ PR-08      â”‚
                    â”‚
PR-16 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤â”€â”€ R4
PR-17 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                    â”‚
PR-13 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤â”€â”€ R5
PR-18 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

R1 and R2 have no external dependencies and may execute in parallel.
R3 planning may execute after R1 (for probe awareness) but provisioning requires separate authorization.
R4 may execute independently (identifier intake).
R5 requires R1, R2, R3, and R4 completion.

## Slice R1 â€” Runtime, Worker, and Health Readiness

- **Slice ID**: R1
- **Title**: Runtime, Worker, and Health Readiness
- **Purpose**: Add the worker Container App (or Container App Job) definition to Terraform; add liveness and readiness probe configurations to the API Container App; confirm the existing health route satisfies PR-15.
- **Primary prerequisite IDs**: PR-01, PR-02, PR-03, PR-15
- **Dependency prerequisite IDs**: None
- **Recommended model**: Claude Sonnet 4.6
- **Reason**: Bounded Terraform additions with deterministic validation. No security or privacy decisions.
- **Exact existing files permitted for modification**:
  - `infrastructure/modules/compute/main.tf`
  - `infrastructure/modules/compute/variables.tf`
- **Exact new files permitted**: None
- **Exact read-only files**:
  - `apps/api/src/index.ts`
  - `apps/api/src/routes/health.ts`
  - `apps/worker/src/index.ts`
  - `apps/worker/package.json`
  - `infrastructure/environments/prod/main.tf`
  - `infrastructure/environments/prod/variables.tf`
- **Prohibited files**: All files not listed above
- **Exact local commands permitted**: `terraform fmt`, `terraform validate` (syntax only, no init/plan/apply)
- **Exact validation commands**:
  - Verify `azurerm_container_app` or `azurerm_container_app_job` resource for worker exists in `compute/main.tf`
  - Verify `liveness_probe` block exists referencing `/health/live` port 3000
  - Verify `readiness_probe` block exists referencing `/health/ready` port 3000
  - `terraform fmt -check infrastructure/modules/compute/main.tf`
- **Tests required**: None (Terraform syntax validation only)
- **Tests explicitly not required**: No application tests, no integration tests, no HTTP tests
- **External access allowed**: NO
- **Credentials allowed**: NO
- **Production writes allowed**: NO
- **Payment actions allowed**: NO
- **Stop conditions**: Terraform provider version incompatibility; Container App Job requiring provider version > 3.x
- **Acceptance criteria**: Worker resource defined; liveness_probe and readiness_probe blocks present; PR-15 documented as satisfied; `terraform fmt -check` passes
- **Expected final status**: PHASE19B_SLICE_R1_COMPLETE
- **Exact next gate**: PHASE19B_SLICE_R2_OBSERVABILITY_AND_TELEMETRY_PRIVACY

## Slice R2 â€” Observability and Telemetry Privacy

- **Slice ID**: R2
- **Title**: Observability and Telemetry Privacy
- **Purpose**: Add `azurerm_application_insights` resource to Terraform; add baseline alert rules; implement telemetry redaction processor to prevent PII and payment data from being sent to Application Insights.
- **Primary prerequisite IDs**: PR-11, PR-12, PR-14
- **Dependency prerequisite IDs**: None (parallel-eligible with R1)
- **Recommended model**: Claude Opus 4.6
- **Reason**: Telemetry privacy and PII redaction require security-sensitive design decisions. Alert threshold selection requires architectural judgment.

### R2 Existing Files Permitted for Modification
- `apps/api/src/middleware/appInsights.ts`
- `infrastructure/environments/prod/main.tf`
- `infrastructure/modules/compute/main.tf`
- `infrastructure/modules/compute/variables.tf`

### R2 New Files Permitted for Creation
- `infrastructure/modules/monitoring/main.tf`
- `infrastructure/modules/monitoring/variables.tf`
- `infrastructure/modules/monitoring/outputs.tf`
- `apps/api/src/middleware/__tests__/appInsights.test.ts`
- `docs/phase19b/PHASE19B_SLICE_R2_COMPLETION_REPORT.md`

### R2 Read-Only Evidence Files
- `infrastructure/main.tf`
- `infrastructure/variables.tf`
- `infrastructure/outputs.tf`
- `infrastructure/environments/prod/variables.tf`
- `apps/api/src/index.ts`
- `apps/api/package.json`

### R2 Prohibited Files
- All files not listed above

- **Focused telemetry test command**: Push-Location apps/api; npx jest src/middleware/__tests__/appInsights.test.ts; $code=$LASTEXITCODE; Pop-Location; exit $code
- **Exact TypeScript command**: Push-Location apps/api; npx tsc --noEmit; $code=$LASTEXITCODE; Pop-Location; exit $code
- **Exact Terraform commands**:
  - Push-Location infrastructure/environments/prod; terraform fmt -check main.tf ../../modules/compute/main.tf ../../modules/compute/variables.tf ../../modules/monitoring/main.tf ../../modules/monitoring/variables.tf ../../modules/monitoring/outputs.tf; $code=$LASTEXITCODE; Pop-Location; exit $code
  - (Repair if needed): Push-Location infrastructure/environments/prod; terraform fmt main.tf ../../modules/compute/main.tf ../../modules/compute/variables.tf ../../modules/monitoring/main.tf ../../modules/monitoring/variables.tf ../../modules/monitoring/outputs.tf; $code=$LASTEXITCODE; Pop-Location; exit $code
  - Push-Location infrastructure/environments/prod; terraform validate -no-color; $code=$LASTEXITCODE; Pop-Location; exit $code
## Slice R3 â€” Database, Storage, Backup, and Recovery Readiness

- **Slice ID**: R3
- **Title**: Database, Storage, Backup, and Recovery Readiness
- **Purpose**: Document the complete database, storage, backup, and recovery prerequisite landscape. Define the future Azure provisioning steps, network path requirements, and Owner decisions required. Do NOT provision, connect, migrate, or test.
- **Primary prerequisite IDs**: PR-04, PR-05, PR-06, PR-07, PR-08, PR-09, PR-10
- **Dependency prerequisite IDs**: PR-01 (worker needs DB connectivity too)
- **Recommended model**: Claude Opus 4.6
- **Reason**: Database migration decisions, backup/restore safety, and data-protection boundaries require high-risk architectural judgment.
- **Exact existing files permitted for modification**: None during R3 planning. Future provisioning requires separate authorization.
- **Exact new files permitted**:
  - `docs/phase19b/PHASE19B_SLICE_R3_DATABASE_STORAGE_READINESS_REPORT.md`
- **Exact read-only files**:
  - `infrastructure/modules/database/main.tf`
  - `infrastructure/modules/database/variables.tf`
  - `infrastructure/modules/storage/main.tf`
  - `infrastructure/modules/storage/variables.tf`
  - `infrastructure/environments/prod/main.tf`
  - `infrastructure/environments/prod/variables.tf`
  - `infrastructure/variables.tf`
  - `apps/api/src/services/blobService.ts`
  - `.env.production.example`
- **Prohibited files**: All files not listed above
- **Exact local commands permitted**: None (documentation only)
- **Exact validation commands**:
  - Verify R3 report contains sections for each of PR-04 through PR-10
  - Verify `DATABASE_MIGRATION_DECISION: PENDING_SEPARATE_OWNER_DECISION` is recorded
  - Verify no provisioning commands were executed
- **Tests required**: None
- **Tests explicitly not required**: No database connection tests, no migration tests, no storage tests
- **External access allowed**: NO
- **Credentials allowed**: NO
- **Production writes allowed**: NO
- **Payment actions allowed**: NO
- **Stop conditions**: Contradictory database evidence; inability to determine current production database provider without external access
- **Acceptance criteria**: All 7 prerequisites documented with exact current state, required future actions, and Owner decisions needed; migration decision remains pending; backup/restore boundary fully described
- **Expected final status**: PHASE19B_SLICE_R3_COMPLETE
- **Exact next gate**: PHASE19B_SLICE_R4_IDENTIFIER_INTAKE

### R3 Infrastructure Blocker Contract

- **Original Blocker**: BLOCKED_INCOMPLETE_AUTHORITATIVE_BOUNDARY
- **Blob-service implementation boundary**: BLOBSERVICE_AND_EXACT_CALLER_REQUIRED
- **API managed identity**: SYSTEM_ASSIGNED_PRESENT
- **API principal-output path**: infrastructure/modules/compute/outputs.tf
- **Blob RBAC path**: infrastructure/environments/prod/main.tf
- **Blob role name**: Storage Blob Data Contributor
- **VNet resource**: NOT_DEFINED
- **Container Apps VNet classification**: OWNER_DECISION_REQUIRED_POTENTIALLY_DESTRUCTIVE
- **Private endpoint path**: OWNER_DECISION_REQUIRED
- **Private DNS path**: OWNER_DECISION_REQUIRED
- **Storage authentication compatibility**: INCOMPATIBLE_SHARED_KEY_DISABLED_BUT_REQUIRED
- **No shared-key re-enablement**: REQUIRED
- **No package modification**: REQUIRED
- **Exact next gate**: PHASE19B_R3_CONTAINER_APPS_VNET_OWNER_DECISION

#### R3 Blocker Existing Files Permitted for Modification
- apps/api/src/services/blobService.ts
- apps/api/src/routes/documents.ts
- infrastructure/environments/prod/main.tf
- .env.production.example
- docs/phase19b/PHASE19B_SLICE_R3_DATABASE_STORAGE_READINESS_REPORT.md

#### R3 Blocker New Files Permitted for Creation
- apps/api/src/services/__tests__/blobService.test.ts
- infrastructure/modules/compute/outputs.tf
- infrastructure/modules/storage/outputs.tf

#### R3 Blocker Read-Only Evidence Files
- infrastructure/modules/compute/main.tf
- infrastructure/modules/compute/variables.tf
- infrastructure/modules/storage/main.tf
- infrastructure/modules/storage/variables.tf
- infrastructure/environments/prod/variables.tf
- infrastructure/environments/prod/outputs.tf
- infrastructure/variables.tf
- infrastructure/main.tf
- apps/api/package.json
- apps/api/package-lock.json

#### R3 Blocker Prohibited Files
- All files not explicitly listed above.

#### Exact Validation Commands
1. **Focused Blob-service Jest test**:
   Push-Location apps/api; npx jest src/services/__tests__/blobService.test.ts; $code=$LASTEXITCODE; Pop-Location; exit $code
2. **API TypeScript validation**:
   Push-Location apps/api; npx tsc --noEmit; $code=$LASTEXITCODE; Pop-Location; exit $code
3. **Broad-any scan**:
   Scan changed files in apps/api/ for \bany\b.
4. **Terraform formatting**:
   terraform fmt -check infrastructure/environments/prod/main.tf infrastructure/modules/compute/outputs.tf infrastructure/modules/storage/outputs.tf
5. **Terraform validation**:
   Push-Location infrastructure/environments/prod; terraform validate -no-color; $code=$LASTEXITCODE; Pop-Location; exit $code (may be classified NOT_RUN_INITIALIZATION_PROHIBITED).
6. **Structural validation**:
   PowerShell regex against Terraform variables, identity settings, and blob RBAC role assignment 'Storage Blob Data Contributor' via infrastructure/environments/prod/main.tf.
7. **Secret scan**:
   Regex search for keys/secrets on changed files.
8. **File-boundary validation**:
   git status --short and git diff --name-only

#### Stop Conditions
- @azure/identity is absent
- exact test file cannot be established
- API principal ID cannot be exposed within authorized files
- narrow Blob RBAC cannot be defined
- private-network implementation requires destructive Container Apps environment replacement
- a new dependency is required
- a package file would change
- a production identifier would need to be invented
- an external secret is required
- Azure access is required
- file permissions conflict


### R3 Container Apps VNet Owner Decision

- **Decision ID**: R3-VNET-OPTION-2
- **Decision**: AUTHORIZE_PARALLEL_VNET_INTEGRATED_CONTAINER_APPS_ENVIRONMENT_DESIGN_ONLY
- **Current environment**: PRESERVE_UNCHANGED
- **In-place VNet modification**: NOT_AUTHORIZED
- **In-place environment replacement**: NOT_AUTHORIZED
- **Parallel environment local design**: AUTHORIZED
- **Azure provisioning**: NOT_AUTHORIZED
- **Terraform plan/apply**: NOT_AUTHORIZED
- **Deployment**: NOT_AUTHORIZED
- **Traffic migration**: NOT_AUTHORIZED
- **DNS cutover**: NOT_AUTHORIZED
- **Database migration**: PENDING_SEPARATE_OWNER_DECISION
- **Production verification**: NOT_AUTHORIZED
- **Payment state**: PHASE19_COMPLETE_NO_GO_FROZEN
- **Future deployment strategy**: BLUE_GREEN_WITH_SEPARATE_CUTOVER_AUTHORIZATION
- **Exact next gate**: PHASE19B_R3_PARALLEL_VNET_CONTRACT_EXPANSION

### R3 Parallel VNet Contract Expansion

#### R3 Parallel VNet Contract Authority
- Owner decision: R3-VNET-OPTION-2
- Existing environment: PRESERVE_UNCHANGED
- Current environment modification: NOT_AUTHORIZED
- Current environment replacement: NOT_AUTHORIZED
- Parallel local definition: AUTHORIZED
- Provisioning: NOT_AUTHORIZED
- Deployment: NOT_AUTHORIZED
- Traffic migration: NOT_AUTHORIZED
- DNS cutover: NOT_AUTHORIZED
- Local definition does not authorize provisioning.

#### Existing Environment Assessment
- resource type: azurerm_container_app_environment
- resource name: env
- module: infrastructure/modules/compute
- VNet integration: NOT_PRESENT
- API: azurerm_container_app.api
- worker: azurerm_container_app_job.worker
- API identity: SYSTEM_ASSIGNED
- worker identity: SYSTEM_ASSIGNED
- preservation path: CAN_REMAIN_UNCHANGED

#### Parallel Environment Strategy
PARALLEL_ENVIRONMENT_MODULE_STRATEGY: DEDICATED_COMPUTE_PARALLEL_MODULE
Reason: A separate infrastructure/modules/compute-parallel module preserves the current compute module and its Terraform resource addresses.
Requirements:
- no current resource rename;
- no current module modification;
- no moved block;
- no implicit replacement;
- no active environment-name reuse;
- no current ingress change;
- no current secret change;
- no production traffic.

#### Network Module Strategy
EXISTING_NETWORK_MODULE: NONE
Future module:
- infrastructure/modules/network/main.tf
- infrastructure/modules/network/variables.tf
- infrastructure/modules/network/outputs.tf
Future network resources:
1. parallel VNet;
2. Container Apps infrastructure subnet;
3. private-endpoint subnet;
4. Blob private DNS zone;
5. Blob private DNS VNet link.

#### Parallel Network Resource Contract
Exact future Terraform addresses:
- module resource: azurerm_virtual_network.parallel
- Container Apps subnet: azurerm_subnet.container_apps_infrastructure
- private endpoint subnet: azurerm_subnet.private_endpoints
- Blob DNS zone: azurerm_private_dns_zone.blob (privatelink.blob.core.windows.net)
- Blob DNS VNet link: azurerm_private_dns_zone_virtual_network_link.blob

#### Parallel Compute Resource Contract
Future module paths:
- infrastructure/modules/compute-parallel/main.tf
- infrastructure/modules/compute-parallel/variables.tf
- infrastructure/modules/compute-parallel/outputs.tf
Exact future Terraform addresses:
- azurerm_container_app_environment.parallel
- azurerm_container_app.api_parallel
- azurerm_container_app_job.worker_parallel
Required outputs:
- environment_id
- api_principal_id
- worker_principal_id, only when worker access is later required
- api_fqdn as a non-production verification output only

#### Blob Private Endpoint Contract
File: infrastructure/modules/storage/main.tf
Future resource address: azurerm_private_endpoint.blob
Subresource: blob
Subnet source: var.private_endpoint_subnet_id
Storage source: azurerm_storage_account.sa.id
DNS-zone source: var.blob_private_dns_zone_id

#### Storage Module Input and Output Contract
Future variable additions:
- private_endpoint_subnet_id
- blob_private_dns_zone_id
- private_endpoint_name or naming prefix
Future output:
- storage_account_id
Files:
- infrastructure/modules/storage/variables.tf
- infrastructure/modules/storage/outputs.tf
Shared-key access must remain disabled.
Public-network access must remain disabled.
Containers must remain private.

#### Managed Identity and RBAC Contract
API principal source: module.compute_parallel.api_principal_id
Storage scope source: module.storage.storage_account_id
Role: Storage Blob Data Contributor
Role-assignment file: infrastructure/environments/prod/main.tf
Required future Terraform resource address: azurerm_role_assignment.parallel_api_blob_data_contributor
Do not authorize: Owner; Contributor; Storage Account Contributor; Storage Blob Data Owner; resource-group scope; subscription scope.

#### Blob-Service Contract
Application files:
- apps/api/src/services/blobService.ts
- apps/api/src/routes/documents.ts
Requirements:
1. remove AZURE_STORAGE_ACCOUNT_KEY;
2. remove StorageSharedKeyCredential;
3. use DefaultAzureCredential;
4. construct the Blob endpoint from AZURE_STORAGE_ACCOUNT_NAME;
5. retain browser-direct upload;
6. request a user-delegation key;
7. generate a user-delegation SAS;
8. bound SAS lifetime;
9. grant only minimum upload permissions;
10. do not log SAS values;
11. do not log credentials;
12. preserve safe asynchronous caller behavior;
13. no broad any;
14. no package changes;
15. no Azure access during tests.

#### Environment Example Contract
File: .env.production.example
Future action: Remove the obsolete AZURE_STORAGE_ACCOUNT_KEY
Preserve: AZURE_STORAGE_ACCOUNT_NAME

#### Exact Blob-Test Contract
Canonical file: apps/api/src/services/__tests__/blobService.test.ts
Exact command:
Push-Location apps/api; npx jest src/services/__tests__/blobService.test.ts; $code=$LASTEXITCODE; Pop-Location; exit $code
Required coverage:
1. DefaultAzureCredential;
2. no account key;
3. account endpoint construction;
4. user-delegation key request;
5. bounded SAS duration;
6. minimum permissions;
7. asynchronous function contract;
8. caller compatibility;
9. no logging of SAS or credentials;
10. no Azure network access;
11. safe errors;
12. no broad any.

#### Required Owner Network Identifiers
The following values remain unresolved and must be supplied or explicitly approved by the Owner:
1. parallel_vnet_name_prefix
2. parallel_vnet_address_space_cidr
3. container_apps_infrastructure_subnet_name
4. container_apps_infrastructure_subnet_cidr
5. private_endpoint_subnet_name
6. private_endpoint_subnet_cidr
7. parallel_container_apps_environment_name_prefix
Required Owner confirmation: confirmed_no_overlap_with_existing_or_planned_networks

#### R3 Parallel VNet Existing Files Permitted for Modification
- apps/api/src/services/blobService.ts
- apps/api/src/routes/documents.ts
- .env.production.example
- infrastructure/main.tf
- infrastructure/variables.tf
- infrastructure/outputs.tf
- infrastructure/environments/prod/main.tf
- infrastructure/environments/prod/variables.tf
- infrastructure/environments/prod/outputs.tf
- infrastructure/modules/storage/main.tf
- infrastructure/modules/storage/variables.tf
- infrastructure/modules/storage/outputs.tf
- docs/phase19b/PHASE19B_SLICE_R3_DATABASE_STORAGE_READINESS_REPORT.md

#### R3 Parallel VNet New Files Permitted for Creation
- apps/api/src/services/__tests__/blobService.test.ts
- infrastructure/modules/network/main.tf
- infrastructure/modules/network/variables.tf
- infrastructure/modules/network/outputs.tf
- infrastructure/modules/compute-parallel/main.tf
- infrastructure/modules/compute-parallel/variables.tf
- infrastructure/modules/compute-parallel/outputs.tf

#### R3 Parallel VNet Read-Only Evidence Files
- infrastructure/modules/compute/main.tf
- infrastructure/modules/compute/variables.tf
- infrastructure/modules/compute/outputs.tf
- apps/api/package.json
- apps/api/package-lock.json
- docs/phase19b/PHASE19B_R3_CONTAINER_APPS_VNET_OWNER_DECISION.md
- docs/phase19b/PHASE19B_R3_INFRASTRUCTURE_BLOCKER_CONTRACT_REPAIR_REPORT.md
- docs/phase19b/PHASE19B_R3_PARALLEL_VNET_CONTRACT_EXPANSION_REPORT.md

#### R3 Parallel VNet Prohibited Files
Every file not explicitly listed in one of the three registries is prohibited from modification or creation during the future implementation gate.

#### Exact Application Validation Commands
Focused Jest:
Push-Location apps/api
npx jest src/services/__tests__/blobService.test.ts
$code = $LASTEXITCODE
Pop-Location
exit $code

TypeScript:
Push-Location apps/api
npx tsc --noEmit
$code = $LASTEXITCODE
Pop-Location
exit $code

Broad-any validation must scan exactly:
- apps/api/src/services/blobService.ts
- apps/api/src/routes/documents.ts
- apps/api/src/services/__tests__/blobService.test.ts

It must reject:
- any
- as any
- Record<string, any>
- WeakSet<any>
- file-wide suppression.

#### Exact Terraform Formatting Command
Push-Location infrastructure

terraform fmt -check `
  main.tf `
  variables.tf `
  outputs.tf `
  environments/prod/main.tf `
  environments/prod/variables.tf `
  environments/prod/outputs.tf `
  modules/storage/main.tf `
  modules/storage/variables.tf `
  modules/storage/outputs.tf `
  modules/network/main.tf `
  modules/network/variables.tf `
  modules/network/outputs.tf `
  modules/compute-parallel/main.tf `
  modules/compute-parallel/variables.tf `
  modules/compute-parallel/outputs.tf

$code = $LASTEXITCODE
Pop-Location
exit $code

#### Terraform Validation Boundary
Push-Location infrastructure/environments/prod
terraform validate -no-color
$code = $LASTEXITCODE
Pop-Location
exit $code

#### Exact Structural Validation Requirements
The future direct validation must verify:
1. exactly one parallel VNet;
2. exactly one Container Apps infrastructure subnet;
3. exactly one private-endpoint subnet;
4. exactly one parallel Container Apps Environment;
5. exactly one parallel API definition;
6. exactly one parallel worker definition;
7. exactly one Blob private endpoint;
8. exactly one Blob private DNS zone;
9. exactly one Blob DNS VNet link;
10. exactly one private DNS-zone group;
11. current compute module unchanged by the future gate;
12. shared-key storage remains disabled;
13. public storage network access remains disabled;
14. both Blob containers remain private;
15. exactly one narrow Blob role assignment;
16. no broad role;
17. no hardcoded production identifier;
18. no credential;
19. no AZURE_STORAGE_ACCOUNT_KEY reference after implementation;
20. no StorageSharedKeyCredential reference after implementation.

#### Exact Secret Scan Boundary
Scan only future changed or created files.
Report only: file; line; category.
Required result: NO_SECRET_FOUND

#### Blue-Green Safety Contract
- active environment unchanged;
- active API unchanged;
- active worker unchanged;
- no current custom-domain change;
- no current ingress change;
- no production traffic;
- no DNS cutover;
- no database migration;
- no payment activation;
- no production secret copying;
- no existing-resource destruction;
- future cutover requires separate Owner authorization.
LOCAL_DEFINITION_DOES_NOT_AUTHORIZE_PROVISIONING

#### Stop Conditions
Stop future implementation when:
1. required network identifiers have not been approved;
2. subnet non-overlap is not confirmed;
3. existing compute module would change;
4. current environment resource address would change;
5. current environment could be replaced;
6. a package change is required;
7. canonical test path changes;
8. narrow RBAC cannot be represented;
9. private DNS ownership is ambiguous;
10. a real credential is required;
11. Azure access is required;
12. a production URL or DNS change is required;
13. Terraform initialization would modify repository files;
14. a file falls outside the exact registry.

#### Approved Owner Network Identifiers
- parallel_vnet_name_prefix: rentipid-prod-parallel-vnet
- parallel_vnet_address_space_cidr: 10.219.0.0/20
- container_apps_infrastructure_subnet_name: rentipid-prod-aca-infrastructure-snet
- container_apps_infrastructure_subnet_cidr: 10.219.0.0/23
- private_endpoint_subnet_name: rentipid-prod-private-endpoints-snet
- private_endpoint_subnet_cidr: 10.219.2.0/24
- parallel_container_apps_environment_name_prefix: rentipid-prod-parallel-aca
- confirmed_no_overlap_with_existing_or_planned_networks: YES
- Owner response status: COMPLETE
- CIDR validation: PASS
- Existing environment modification: NOT_AUTHORIZED
- Existing environment replacement: NOT_AUTHORIZED
- Local implementation: AUTHORIZED_BY_CONTRACT
- Azure provisioning: NOT_AUTHORIZED
- Terraform plan/apply: NOT_AUTHORIZED
- Deployment: NOT_AUTHORIZED
- Traffic migration: NOT_AUTHORIZED
- DNS cutover: NOT_AUTHORIZED
- Local definition does not authorize provisioning.

#### Contract Expansion Status
R3_PARALLEL_CONTRACT_STATUS: LOCAL_IMPLEMENTATION_CLOSED
R3_STATUS: PHASE19B_SLICE_R3_COMPLETE_LOCAL_DEFINITION_ONLY
R3_CLOSURE_STATUS: PHASE19B_R3_CLOSURE_REVIEW_COMPLETE
R3_READ_ONLY_VERIFICATION_STATUS: PHASE19B_R3_READ_ONLY_CLOSURE_VERIFICATION_COMPLETE
R3_CLOSURE_ELIGIBILITY: ELIGIBLE_FOR_GOVERNANCE_RECORDING

#### Exact Next Gate
PHASE19B_SLICE_R4_IDENTIFIER_INTAKE

## Slice R4 â€” Non-Secret Identifier Intake and Endpoint Registry

- **Slice ID**: R4
- **Title**: Non-Secret Identifier Intake and Endpoint Registry
- **Purpose**: Collect literal non-secret Azure/Vercel identifiers from the trusted administrator using the prepared template; reconcile against Terraform defaults; create the immutable identifier registry.
- **Primary prerequisite IDs**: PR-16, PR-17
- **Dependency prerequisite IDs**: None (may execute independently, but ideally after R1 for health-route confirmation)
- **Recommended model**: Claude Sonnet 4.6
- **Reason**: Deterministic intake and reconciliation. No security decisions.

### Required Non-Secret Identifier Fields

Field: AZURE_SUBSCRIPTION_LABEL_OR_ID
Classification: OWNER_CONFIRMATION_REQUIRED
Authoritative source: docs/phase19b/PHASE19B_NON_SECRET_IDENTIFIER_REQUEST_TEMPLATE.md
Required format: string
Owner confirmation: YES
Secret: NO
Resource-existence rule: NOT_APPLICABLE

Field: AZURE_REGION
Classification: REPOSITORY_DISCOVERABLE
Authoritative source: infrastructure/variables.tf (location)
Required format: string
Owner confirmation: YES
Secret: NO
Resource-existence rule: NOT_APPLICABLE

Field: AZURE_TENANT_LABEL_OR_ID_IF_NON_SECRET
Classification: OWNER_CONFIRMATION_REQUIRED
Authoritative source: docs/phase19b/PHASE19B_NON_SECRET_IDENTIFIER_REQUEST_TEMPLATE.md
Required format: string
Owner confirmation: YES
Secret: NO
Resource-existence rule: NOT_APPLICABLE

Field: AZURE_RESOURCE_GROUP_NAME
Classification: REPOSITORY_DISCOVERABLE
Authoritative source: infrastructure/environments/prod/variables.tf (existing_resource_group_name)
Required format: string
Owner confirmation: YES
Secret: NO
Resource-existence rule: NOT_YET_PROVISIONED

Field: AZURE_CONTAINER_APPS_ENVIRONMENT_NAME
Classification: REPOSITORY_DISCOVERABLE
Authoritative source: infrastructure/environments/prod/variables.tf (existing_container_app_environment_name)
Required format: string
Owner confirmation: YES
Secret: NO
Resource-existence rule: NOT_YET_PROVISIONED

Field: AZURE_API_CONTAINER_APP_NAME
Classification: OWNER_CONFIRMATION_REQUIRED
Authoritative source: docs/phase19b/PHASE19B_NON_SECRET_IDENTIFIER_REQUEST_TEMPLATE.md
Required format: string
Owner confirmation: YES
Secret: NO
Resource-existence rule: NOT_YET_PROVISIONED

Field: AZURE_WORKER_CONTAINER_APP_NAME
Classification: OWNER_CONFIRMATION_REQUIRED
Authoritative source: docs/phase19b/PHASE19B_NON_SECRET_IDENTIFIER_REQUEST_TEMPLATE.md
Required format: string
Owner confirmation: YES
Secret: NO
Resource-existence rule: NOT_YET_PROVISIONED

Field: POSTGRESQL_FLEXIBLE_SERVER_NAME
Classification: REPOSITORY_DISCOVERABLE
Authoritative source: infrastructure/environments/prod/variables.tf (existing_postgresql_server_name)
Required format: string
Owner confirmation: YES
Secret: NO
Resource-existence rule: NOT_YET_PROVISIONED

Field: POSTGRESQL_DATABASE_NAME
Classification: OWNER_CONFIRMATION_REQUIRED
Authoritative source: docs/phase19b/PHASE19B_NON_SECRET_IDENTIFIER_REQUEST_TEMPLATE.md
Required format: string
Owner confirmation: YES
Secret: NO
Resource-existence rule: NOT_YET_PROVISIONED

Field: POSTGRESQL_RESOURCE_GROUP_NAME
Classification: OWNER_CONFIRMATION_REQUIRED
Authoritative source: docs/phase19b/PHASE19B_NON_SECRET_IDENTIFIER_REQUEST_TEMPLATE.md
Required format: string
Owner confirmation: YES
Secret: NO
Resource-existence rule: NOT_YET_PROVISIONED

Field: POSTGRESQL_REGION
Classification: OWNER_CONFIRMATION_REQUIRED
Authoritative source: docs/phase19b/PHASE19B_NON_SECRET_IDENTIFIER_REQUEST_TEMPLATE.md
Required format: string
Owner confirmation: YES
Secret: NO
Resource-existence rule: NOT_APPLICABLE

Field: AZURE_STORAGE_ACCOUNT_NAME
Classification: OWNER_CONFIRMATION_REQUIRED
Authoritative source: .env.production.example
Required format: string
Owner confirmation: YES
Secret: NO
Resource-existence rule: NOT_YET_PROVISIONED

Field: AZURE_STORAGE_CONTAINER_NAME
Classification: OWNER_CONFIRMATION_REQUIRED
Authoritative source: docs/phase19b/PHASE19B_NON_SECRET_IDENTIFIER_REQUEST_TEMPLATE.md
Required format: string
Owner confirmation: YES
Secret: NO
Resource-existence rule: NOT_YET_PROVISIONED

Field: AZURE_STORAGE_RESOURCE_GROUP_NAME
Classification: OWNER_CONFIRMATION_REQUIRED
Authoritative source: docs/phase19b/PHASE19B_NON_SECRET_IDENTIFIER_REQUEST_TEMPLATE.md
Required format: string
Owner confirmation: YES
Secret: NO
Resource-existence rule: NOT_YET_PROVISIONED

Field: APPLICATION_INSIGHTS_RESOURCE_NAME
Classification: OWNER_CONFIRMATION_REQUIRED
Authoritative source: docs/phase19b/PHASE19B_NON_SECRET_IDENTIFIER_REQUEST_TEMPLATE.md
Required format: string
Owner confirmation: YES
Secret: NO
Resource-existence rule: NOT_YET_PROVISIONED

Field: LOG_ANALYTICS_WORKSPACE_NAME
Classification: REPOSITORY_DISCOVERABLE
Authoritative source: infrastructure/environments/prod/variables.tf (existing_log_analytics_workspace_name)
Required format: string
Owner confirmation: YES
Secret: NO
Resource-existence rule: NOT_YET_PROVISIONED

Field: MONITORING_RESOURCE_GROUP_NAME
Classification: OWNER_CONFIRMATION_REQUIRED
Authoritative source: docs/phase19b/PHASE19B_NON_SECRET_IDENTIFIER_REQUEST_TEMPLATE.md
Required format: string
Owner confirmation: YES
Secret: NO
Resource-existence rule: NOT_YET_PROVISIONED

Field: ALERT_ACTION_GROUP_NAME_IF_EXISTING
Classification: OWNER_CONFIRMATION_REQUIRED
Authoritative source: docs/phase19b/PHASE19B_NON_SECRET_IDENTIFIER_REQUEST_TEMPLATE.md
Required format: string
Owner confirmation: YES
Secret: NO
Resource-existence rule: NOT_YET_PROVISIONED

Field: VERCEL_PROJECT_NAME
Classification: OWNER_CONFIRMATION_REQUIRED
Authoritative source: docs/phase19b/PHASE19B_NON_SECRET_IDENTIFIER_REQUEST_TEMPLATE.md
Required format: string
Owner confirmation: YES
Secret: NO
Resource-existence rule: NOT_APPLICABLE

Field: VERCEL_TEAM_OR_SCOPE_NAME_IF_APPLICABLE
Classification: OWNER_CONFIRMATION_REQUIRED
Authoritative source: docs/phase19b/PHASE19B_NON_SECRET_IDENTIFIER_REQUEST_TEMPLATE.md
Required format: string
Owner confirmation: YES
Secret: NO
Resource-existence rule: NOT_APPLICABLE

### Required Non-Secret Endpoint Fields

Field: VERIFIED_PUBLIC_APPLICATION_URL
Protocol: HTTPS
Required format: url
Authoritative source: apps/api/src/middleware/cors.ts
Owner confirmation: YES
Placeholder rule: must not be localhost
Resource-existence rule: NOT_YET_PROVISIONED
Secret: NO

Field: PUBLIC_HEALTH_ROUTE_PATH
Protocol: HTTPS
Required format: path
Authoritative source: docs/phase19b/PHASE19B_NON_SECRET_IDENTIFIER_REQUEST_TEMPLATE.md
Owner confirmation: YES
Placeholder rule: must not be localhost
Resource-existence rule: NOT_YET_PROVISIONED
Secret: NO

Field: PAYMENT_WEBHOOK_ROUTE_PATH
Protocol: HTTPS
Required format: path
Authoritative source: docs/phase19b/PHASE19B_NON_SECRET_IDENTIFIER_REQUEST_TEMPLATE.md
Owner confirmation: YES
Placeholder rule: must not be localhost
Resource-existence rule: NOT_YET_PROVISIONED
Secret: NO

### Prohibited Secret Fields

Prohibit:
1. passwords;
2. database passwords;
3. client secrets;
4. access tokens;
5. refresh tokens;
6. bearer tokens;
7. storage-account keys;
8. SAS token values;
9. private keys;
10. credential-bearing connection strings;
11. webhook signing secrets;
12. payment secrets;
13. Vercel access tokens;
14. Azure authentication tokens;
15. service-principal secrets.

Secret values permitted in R4 registry:
NO

Secret values permitted in Owner response:
NO

### R4 Authorized Read-Only Files

1. docs/phase19b/PHASE19B_NON_SECRET_IDENTIFIER_REQUEST_TEMPLATE.md
2. infrastructure/environments/prod/variables.tf
3. infrastructure/variables.tf
4. .env.production.example
5. apps/api/src/middleware/cors.ts
6. docs/phase19b/PHASE19B_R4_CONTRACT_COMPLETENESS_REPAIR_REPORT.md

### R4 Authorized Modifiable Files

1. docs/phase19b/PHASE19B_NON_SECRET_IDENTIFIER_REQUEST_TEMPLATE.md
2. docs/phase19b/PHASE19B_SLICE_R4_IDENTIFIER_REGISTRY.md

### R4 Permitted New File

docs/phase19b/PHASE19B_SLICE_R4_IDENTIFIER_REGISTRY.md

### Azure Discovery Boundary

R4 Azure discovery:
NOT_AUTHORIZED_BY_DEFAULT

### Permitted Field Statuses

VERIFIED_FROM_REPOSITORY
DERIVED_FROM_APPROVED_CONTRACT
OWNER_CONFIRMED
OWNER_RESPONSE_REQUIRED
LOCAL_DEFINITION_ONLY
NOT_YET_PROVISIONED
NOT_APPLICABLE
REJECTED_INVALID
PROHIBITED_SECRET

### Completion Criteria

- every required field appears exactly once;
- every field has one permitted status;
- no secret is populated;
- every endpoint has an existence classification;
- local definitions are not described as provisioned;
- unprovisioned endpoints are not described as live;
- Owner-required values are confirmed;
- CORS and public endpoint values are consistent;
- immutable identifier registry is created;
- secret scan and file-boundary checks pass;
- no R5, payment, deployment, or migration authorization is implied.

### Blocked Criteria

- Owner response is missing;
- a secret is supplied;
- a value has invalid format;
- Owner and repository identifiers conflict;
- an endpoint is claimed existing without evidence;
- Azure verification is required but unauthorized;
- the file boundary is violated;
- PHASE19 or payment safeguards would be changed.

### Status Rules

Owner response required:
R4_IDENTIFIER_INTAKE_STATUS:
PHASE19B_R4_OWNER_RESPONSE_REQUIRED
R4_STATUS:
PHASE19B_SLICE_R4_BLOCKED
NEXT_GATE:
PHASE19B_R4_OWNER_IDENTIFIER_RESPONSE

R4 complete:
R4_IDENTIFIER_INTAKE_STATUS:
PHASE19B_R4_IDENTIFIER_INTAKE_COMPLETE
R4_STATUS:
PHASE19B_SLICE_R4_COMPLETE
NEXT_GATE:
PHASE19B_SLICE_R5_PRODUCTION_VERIFICATION_AUTHORIZATION

Contract still incomplete:
R4_IDENTIFIER_INTAKE_STATUS:
PHASE19B_R4_CONTRACT_BLOCKED
R4_STATUS:
PHASE19B_SLICE_R4_BLOCKED
NEXT_GATE:
PHASE19B_R4_CONTRACT_COMPLETENESS_REPAIR

## Slice R5 â€” Bounded Production Verification Authorization

- **Slice ID**: R5
- **Title**: Bounded Production Verification Authorization
- **Purpose**: Using completed R1â€“R4 evidence and literal identifiers, prepare exact read-only verification commands; define Owner authorization for bounded production checks; execute no check until separately approved.
- **Primary prerequisite IDs**: PR-13, PR-18
- **Dependency prerequisite IDs**: All of R1, R2, R3, R4
- **Recommended model**: Claude Opus 4.6
- **Reason**: Production-access authorization requires highest-risk review. Database safety, payment safeguards, and credential-handling boundaries must be verified before any check is approved.
- **Exact existing files permitted for modification**: None
- **Exact new files permitted**:
  - `docs/phase19b/PHASE19B_SLICE_R5_PRODUCTION_VERIFICATION_PLAN.md`
- **Exact read-only files**:
  - `docs/phase19b/PHASE19B_SLICE_R4_IDENTIFIER_REGISTRY.md`
  - `docs/phase19b/PHASE19B_SLICE_R3_DATABASE_STORAGE_READINESS_REPORT.md`
  - `docs/phase19b/PHASE19B_SLICE_E5_COMPLETION_REPORT.md`
  - `docs/phase19b/PHASE19B_AZURE_VERCEL_PRODUCTION_READINESS_OWNER_RESPONSE.md`
- **Prohibited files**: All files not listed above
- **Exact local commands permitted**: None during R5 planning
- **Exact validation commands**:
  - Verify all planned checks are read-only
  - Verify no database login is planned
  - Verify no payment execution is planned
  - Verify literal identifiers are present for every formulated command
  - Verify Owner authorization is required before execution
- **Tests required**: None
- **Tests explicitly not required**: No production tests, no smoke tests
- **External access allowed**: NO (planned for future Owner-authorized gate)
- **Credentials allowed**: NO
- **Production writes allowed**: NO
- **Payment actions allowed**: NO
- **Stop conditions**: R1â€“R4 incomplete; literal identifiers missing; migration decision still pending; payment safeguards cannot be preserved
- **Acceptance criteria**: Exact read-only commands documented; Owner authorization gate defined; all checks require separate approval; no check executed
- **Expected final status**: PHASE19B_SLICE_R5_COMPLETE
- **Exact next gate**: PHASE19B_PRODUCTION_VERIFICATION_OWNER_AUTHORIZATION


### Required Production-Verification Targets

TARGET-01 — Azure subscription and tenant context

System:
AZURE

Verification type:
READ_ONLY_ACCOUNT_METADATA

Purpose:
Confirm the authenticated context matches the Owner-confirmed subscription and tenant.

Production access:
YES

Credentialed session:
YES

Owner authorization required:
YES

Permitted evidence:
Subscription ID, tenant ID, subscription state, and selected account context.

Prohibited evidence:
Access tokens, refresh tokens, credentials, raw authentication records, or service-principal secrets.

TARGET-02 — Azure production resource inventory

System:
AZURE

Verification type:
READ_ONLY_RESOURCE_METADATA

Purpose:
Determine whether the locally defined resource group, Container Apps resources, storage, monitoring, and PostgreSQL resources exist.

Production access:
YES

Credentialed session:
YES

Owner authorization required:
YES

Permitted evidence:
Resource type, name, resource group, region, provisioning state, and existence status.

Prohibited evidence:
Secrets, keys, credentials, connection strings, SAS values, or private configuration values.

TARGET-03 — Vercel project metadata

System:
VERCEL

Verification type:
READ_ONLY_PROJECT_METADATA

Purpose:
Confirm the project name, scope, domains, framework, and Git linkage.

Production access:
YES

Credentialed session:
YES

Owner authorization required:
YES

Permitted evidence:
Project name, project ID, scope, framework, domains, and linked repository identifier.

Prohibited evidence:
Environment-variable values, access tokens, deployment secrets, or authentication details.

TARGET-04 — Public application endpoint

System:
APPLICATION

Verification type:
READ_ONLY_PUBLIC_HEALTH

Purpose:
Verify the public URL responds over HTTPS and represents RENTipid.

Production access:
YES

Credentialed session:
NO

Owner authorization required:
YES

Permitted evidence:
URL, HTTP status, redirect chain without sensitive query values, response headers excluding cookies or authorization data, and sanitized application identity evidence.

Prohibited evidence:
Session cookies, authorization headers, personal data, account data, or authenticated application content.

TARGET-05 — Public health endpoint

System:
APPLICATION

Verification type:
READ_ONLY_PUBLIC_HEALTH

Purpose:
Verify a defined public health route only when the route is available in the completed identifier registry.

Production access:
YES

Credentialed session:
NO

Owner authorization required:
YES

When the route remains NOT_YET_PROVISIONED:
Classify the target as NOT_APPLICABLE_FOR_CURRENT_RUN.

TARGET-06 — DNS metadata

System:
DNS

Verification type:
READ_ONLY_PUBLIC_DNS

Purpose:
Verify the public RENTipid hostname resolves and identify only the public record type and target.

Production access:
YES

Credentialed session:
NO

Owner authorization required:
YES

Permitted evidence:
Hostname, record type, public target, TTL, and resolution status.

Prohibited evidence:
Registrar credentials, DNS-provider tokens, private DNS records, or administrative configuration.

TARGET-07 — Azure monitoring resource metadata

System:
MONITORING

Verification type:
READ_ONLY_RESOURCE_METADATA

Purpose:
Determine whether Application Insights and Log Analytics resources exist.

Production access:
YES

Credentialed session:
YES

Owner authorization required:
YES

Permitted evidence:
Resource name, resource ID, region, and provisioning state.

Prohibited evidence:
Instrumentation keys, connection strings, tokens, raw logs, user data, or telemetry payloads.

TARGET-08 — Production database resource metadata

System:
DATABASE

Verification type:
READ_ONLY_RESOURCE_METADATA

Purpose:
Determine whether the PostgreSQL Flexible Server exists without connecting to the database.

Production access:
YES

Credentialed session:
YES

Owner authorization required:
YES

Permitted evidence:
Server name, resource group, region, state, version, and public/private-network classification.

Prohibited evidence:
Database credentials, connection strings, firewall secrets, database contents, queries, schemas, rows, or personal data.

TARGET-09 — Payment safeguard preservation

System:
PAYMENT

Verification type:
GOVERNANCE_ONLY

Purpose:
Confirm from existing governance state that no payment verification or activation is authorized.

Production access:
NO

Credentialed session:
NO

Owner authorization required:
NO

Permitted evidence:
PHASE19 frozen status and payment authorization status.

Payment-system access:
PROHIBITED

Transaction access:
PROHIBITED

### Owner Authorization Categories

AUTH-01 — Azure account and resource metadata

Covers:
TARGET-01, TARGET-02, TARGET-07, and TARGET-08

Default decision:
NOT_AUTHORIZED

Writes permitted:
NO

Secrets may be displayed:
NO

AUTH-02 — Vercel project metadata

Covers:
TARGET-03

Default decision:
NOT_AUTHORIZED

Writes permitted:
NO

Secrets may be displayed:
NO

AUTH-03 — Public application health checks

Covers:
TARGET-04 and TARGET-05 when applicable

Default decision:
NOT_AUTHORIZED

Writes permitted:
NO

Authentication permitted:
NO

AUTH-04 — Public DNS inspection

Covers:
TARGET-06

Default decision:
NOT_AUTHORIZED

Writes permitted:
NO

Credentialed DNS-provider access:
NO

### Permitted Read-Only Commands After Explicit Owner Authorization

Azure commands permitted only under AUTH-01:

az account show
az group show
az resource list
az resource show
az containerapp env show
az containerapp show
az containerapp job show
az storage account show
az monitor app-insights component show
az monitor log-analytics workspace show
az postgres flexible-server show

Rules:

- use narrow \--query\ selections;
- do not print raw JSON containing unrelated properties;
- do not request tokens;
- do not request keys;
- do not request connection strings;
- do not request secrets.

Vercel commands permitted only under AUTH-02:

npx --yes vercel@latest whoami --no-color
npx --yes vercel@latest teams list --no-color
npx --yes vercel@latest project inspect <project> --scope <scope> --no-color
npx --yes vercel@latest project ls --json --scope <scope> --no-color

Rules:

- do not inspect environment variables;
- do not inspect secrets;
- do not link, pull, deploy, create, update, or delete.

Public endpoint commands permitted only under AUTH-03:

Invoke-WebRequest
curl

Rules:

- GET or HEAD only;
- no authentication;
- no cookies supplied;
- no form submission;
- no state-changing route;
- no query parameters containing sensitive values.

DNS commands permitted only under AUTH-04:

Resolve-DnsName
nslookup

Rules:

- public records only;
- no DNS-provider login;
- no DNS modification.

### Prohibited Operations

1. Azure create, update, delete, set, assign, remove, deploy, start, stop, restart, regenerate, key, secret, credential, or connection-string commands;
2. Terraform init, plan, apply, destroy, import, state, refresh, or output;
3. Vercel deploy, link, pull, env, secrets, domains add/remove, project add/remove, promote, rollback, or configuration changes;
4. authenticated application access;
5. account impersonation;
6. production database connections;
7. SQL queries;
8. schema inspection;
9. database rows or personal data;
10. Application Insights log queries;
11. Log Analytics queries;
12. raw telemetry access;
13. private DNS inspection;
14. DNS-provider administrative access;
15. payment-system inspection;
16. payment transaction access;
17. webhook triggering;
18. refund or reconciliation actions;
19. emergency-freeze removal;
20. PHASE19 reopening;
21. database migration;
22. production deployment;
23. traffic migration;
24. DNS cutover;
25. Git commit or push.

### Secret and Evidence Boundary

Secrets may be displayed:
NO

Secrets may be stored:
NO

Raw authentication responses:
PROHIBITED

Permitted retained evidence:

- identifiers;
- resource names;
- resource IDs;
- regions;
- resource types;
- provisioning states;
- public hostnames;
- public DNS records;
- sanitized HTTP status results;
- non-secret Vercel project metadata;
- existence and non-existence classifications.

Prohibited retained evidence:

- passwords;
- tokens;
- client secrets;
- keys;
- SAS values;
- credential-bearing connection strings;
- authorization headers;
- cookies;
- private keys;
- database contents;
- telemetry payloads;
- personal data;
- payment data.

### R5 Authorized Read-Only Files

1. docs/phase19b/PHASE19B_AZURE_VERCEL_PREREQUISITE_REMEDIATION_AND_IDENTIFIER_PLAN.md
2. docs/phase19b/PHASE19B_SLICE_R4_IDENTIFIER_REGISTRY.md
3. docs/phase19b/PHASE19B_R5_CONTRACT_COMPLETENESS_REPAIR_REPORT.md

### R5 Authorized Modifiable Files

1. docs/phase19b/PHASE19B_SLICE_R5_PRODUCTION_VERIFICATION_REPORT.md
2. docs/phase19b/PHASE19B_R5_PRODUCTION_VERIFICATION_OWNER_DECISION.md

### R5 Permitted New Files

1. docs/phase19b/PHASE19B_SLICE_R5_PRODUCTION_VERIFICATION_REPORT.md
2. docs/phase19b/PHASE19B_R5_PRODUCTION_VERIFICATION_OWNER_DECISION.md

No application, Terraform, workflow, environment, database, payment, PHASE19,
or deployment file may be modified.

### Owner Decision Rules

Each authorization category must be separately:

APPROVED

or:

DENIED

No blank, implied, inherited, or blanket authorization is valid.

The Owner-decision file must contain:

AUTH-01_AZURE_ACCOUNT_AND_RESOURCE_METADATA:
APPROVED or DENIED

AUTH-02_VERCEL_PROJECT_METADATA:
APPROVED or DENIED

AUTH-03_PUBLIC_APPLICATION_HEALTH_CHECKS:
APPROVED or DENIED

AUTH-04_PUBLIC_DNS_INSPECTION:
APPROVED or DENIED

CONFIRM_READ_ONLY_ONLY:
YES

CONFIRM_NO_SECRETS:
YES

CONFIRM_NO_WRITES:
YES

CONFIRM_NO_DATABASE_CONNECTION_OR_QUERY:
YES

CONFIRM_NO_PAYMENT_SYSTEM_ACCESS:
YES

CONFIRM_NO_DEPLOYMENT_OR_MIGRATION:
YES

OWNER_DECISION_STATUS:
COMPLETE

### Completion Criteria

R5 verification completes only when:

1. every required target has one result;
2. every accessed target was explicitly authorized;
3. denied categories were not accessed;
4. required commands stayed within the permitted list;
5. no write occurred;
6. no secret was displayed or retained;
7. no database connection or query occurred;
8. no monitoring-log query occurred;
9. no payment-system access occurred;
10. no Terraform command occurred;
11. no deployment, traffic migration, or DNS change occurred;
12. evidence is limited to approved non-secret metadata;
13. PHASE19 remains frozen;
14. file-boundary validation passes;
15. the verification report records every target and authorization decision.

### Blocked Criteria

R5 must block when:

1. Owner decisions are incomplete;
2. an access category is not explicitly approved;
3. authentication is unavailable for an approved credentialed category;
4. target identity conflicts with the R4 registry;
5. a command would expose a secret;
6. a write would be required;
7. database connection or query would be required;
8. monitoring-log query would be required;
9. payment-system access would be required;
10. Terraform execution would be required;
11. the file boundary would be violated;
12. PHASE19 or payment safeguards would be affected.

### Status Transitions

When the repaired contract is complete:

R5_CONTRACT_REPAIR_STATUS:
PHASE19B_R5_CONTRACT_COMPLETENESS_REPAIRED

R5_STATUS:
PHASE19B_SLICE_R5_READY_FOR_OWNER_AUTHORIZATION

NEXT_GATE:
PHASE19B_R5_PRODUCTION_VERIFICATION_OWNER_DECISION

When the Owner decision is incomplete:

R5_AUTHORIZATION_STATUS:
PHASE19B_R5_OWNER_AUTHORIZATION_REQUIRED

R5_STATUS:
PHASE19B_SLICE_R5_BLOCKED_PENDING_OWNER_DECISION

NEXT_GATE:
PHASE19B_R5_PRODUCTION_VERIFICATION_OWNER_DECISION

When one or more categories are approved:

NEXT_GATE:
PHASE19B_R5_BOUNDED_READ_ONLY_PRODUCTION_VERIFICATION

When all categories are denied:

R5_STATUS:
PHASE19B_SLICE_R5_CLOSED_NO_VERIFICATION_AUTHORIZED

NEXT_GATE:
PHASE19B_R5_NO_AUTHORIZATION_CLOSURE

When the R5 closure review is complete:

R5_CLOSURE_REVIEW_STATUS:
PHASE19B_R5_POST_VERIFICATION_CLOSURE_REVIEW_COMPLETE

R5_STATUS:
PHASE19B_SLICE_R5_COMPLETE

POST_R5_GATE_SOURCE:
FINAL_SLICE_GOVERNANCE_TRANSITION

NEXT_GATE:
PHASE19B_FINAL_GOVERNANCE_CLOSURE_REVIEW

PHASE19:
PHASE19_COMPLETE_NO_GO_FROZEN

Database migration:
PENDING_SEPARATE_OWNER_DECISION

Payment activation:
NOT_AUTHORIZED

Deployment:
NOT_AUTHORIZED

### Phase19B Final Governance Closure Review

Gate:
PHASE19B_FINAL_GOVERNANCE_CLOSURE_REVIEW

Purpose:

- consolidate R1 through R5 completion statuses;
- confirm all authorized governance files are internally consistent;
- identify unresolved future Owner decisions;
- preserve PHASE19 frozen status;
- preserve payment and migration prohibitions;
- determine the final Phase19B closure status.

Authorized access:
GOVERNANCE_FILES_ONLY

Azure access:
PROHIBITED

Vercel access:
PROHIBITED

Production application access:
PROHIBITED

Database access:
PROHIBITED

Monitoring access:
PROHIBITED

DNS inspection:
PROHIBITED

Payment-system access:
PROHIBITED

Terraform execution:
PROHIBITED

Deployment:
PROHIBITED

Migration:
PROHIBITED

Commit and push:
PROHIBITED

Required outputs:

1. R1 through R5 consolidated status;
2. unresolved Owner decisions;
3. frozen safeguards;
4. file-boundary validation;
5. final Phase19B disposition;
6. exact next action after Phase19B closure.


## Model-Routing Plan

| Slice | Primary Model | Reason |
| --- | --- | --- |
| Slice R1 | Claude Sonnet 4.6 | Bounded Terraform additions, deterministic validation, no security decisions |
| Slice R2 | Claude Opus 4.6 | PII/payment telemetry redaction design, security-sensitive alert threshold selection |
| Slice R3 | Claude Opus 4.6 | Database migration safety, backup/restore boundary design, data-protection decisions |
| Slice R4 | Claude Sonnet 4.6 | Deterministic identifier intake and reconciliation |
| Slice R5 | Claude Opus 4.6 | Production-access authorization, highest-risk review, credential-handling boundary |

No slice has two assigned models. Independent review is required only when contradictory evidence is discovered.

## Database Migration Decision Boundary

The following decision options exist but none may be chosen during this planning gate or during R3:

1. NEW_EMPTY_AZURE_DATABASE â€” Provision empty Azure PostgreSQL, run full Prisma migration from scratch
2. MIGRATE_EXISTING_PRODUCTION_DATABASE â€” Export from current production database (Neon or other), import to Azure PostgreSQL
3. RETAIN_CURRENT_DATABASE_TEMPORARILY â€” Keep current database provider, connect Azure Container Apps to it
4. DATABASE_CURRENT_STATE_REQUIRES_VERIFICATION â€” Cannot decide without confirming current production database provider and state

DATABASE_MIGRATION_DECISION: PENDING_SEPARATE_OWNER_DECISION

This decision requires:
- Verified current production database provider identity
- Verified current production database state
- Owner assessment of data migration risk
- Separate Owner authorization

## Backup and Restore Boundary

The following are distinct milestones that must not be combined into one completion claim:

1. Terraform backup-retention configuration â€” LOCALLY_CONFIRMED (30 days in `modules/database/main.tf`)
2. Azure resource provisioning â€” NOT_PROVISIONED
3. Backup operation â€” NOT_VERIFIED
4. Backup retention verification â€” NOT_VERIFIED
5. Point-in-time restore capability â€” NOT_VERIFIED
6. Restore test â€” NOT_VERIFIED
7. Restored-data validation â€” NOT_VERIFIED
8. Measured RPO â€” NOT_MEASURED
9. Measured RTO â€” NOT_MEASURED

## Payment Safeguard Boundary

All PHASE19 payment safeguards remain strictly preserved:
- PHASE19: PHASE19_COMPLETE_NO_GO_FROZEN
- Live payments: DISABLED
- PAYMENT_EMERGENCY_FREEZE: ACTIVE
- Finance approval: REQUIRED
- PHP 100 maximum per transaction: ENFORCED
- Maximum five pilot transactions: ENFORCED
- PHP 500 aggregate exposure maximum: ENFORCED
- Renter/provider eligibility: ENFORCED
- Server-side checkout restrictions: ENFORCED
- Reconciliation controls: ENFORCED
- Automatic freeze on gateway failure: ENFORCED
- Automatic freeze on timeout: ENFORCED
- Automatic freeze on mismatch: ENFORCED
- Manual-refund verification: REQUIRED
- RBAC: ENFORCED
- Audit logging: ACTIVE
- Idempotency: ENFORCED
- Human approval: REQUIRED
- Rollback and stop procedures: DEFINED

No planned slice may reopen PHASE19, activate live payments, retrieve PayMongo live credentials, execute a payment, execute a refund, or send a real production webhook.

## Production Access Boundary

No slice may access Azure, Vercel (authenticated), databases, Blob Storage, Application Insights, or production systems without a separate Owner decision recorded in a new authorization gate.

## Trusted-Administrator Identifier Process

1. The identifier request template has been created at `docs/phase19b/PHASE19B_NON_SECRET_IDENTIFIER_REQUEST_TEMPLATE.md`.
2. During Slice R4, the Owner or trusted administrator fills in the template with literal non-secret identifiers.
3. The agent reconciles provided values against Terraform defaults.
4. Mismatches are flagged and require resolution before R5.
5. No secret values are accepted. Any response containing secrets must be rejected and the template re-issued.
6. The identifier registry is immutable after R4 acceptance.

### Pre-populated from Terraform defaults (require confirmation):
- `AZURE_REGION`: `southeastasia` (from `infrastructure/variables.tf` and `infrastructure/environments/prod/variables.tf`)
- `AZURE_RESOURCE_GROUP_NAME`: `rg-rentipid-prod` (from `infrastructure/environments/prod/variables.tf`)
- `POSTGRESQL_FLEXIBLE_SERVER_NAME`: `rentipid-postgres-db` (from `infrastructure/environments/prod/variables.tf`)
- `LOG_ANALYTICS_WORKSPACE_NAME`: `rg-rentipid-prod-log` (from `infrastructure/environments/prod/variables.tf`)
- `AZURE_CONTAINER_APPS_ENVIRONMENT_NAME`: `rg-rentipid-prod-env` (from `infrastructure/environments/prod/variables.tf`)
- `AZURE_API_CONTAINER_APP_NAME`: `ca-api-rentipid-prod` (derived from `compute/main.tf` naming pattern)

### Require trusted-administrator input:
- `AZURE_SUBSCRIPTION_LABEL_OR_ID`
- `AZURE_TENANT_LABEL_OR_ID_IF_NON_SECRET`
- `VERCEL_PROJECT_NAME`
- `VERIFIED_PUBLIC_APPLICATION_URL`
- `PUBLIC_HEALTH_ROUTE_PATH` (code shows `/health/live` and `/health/ready` â€” confirmation needed)
- `PAYMENT_WEBHOOK_ROUTE_PATH` (code shows `/paymongo` â€” confirmation needed)
- `APPLICATION_INSIGHTS_RESOURCE_NAME`
- `AZURE_STORAGE_ACCOUNT_NAME` (Terraform pattern: `sarentipidprod` â€” confirmation needed)
- `AZURE_STORAGE_CONTAINER_NAME` (Terraform shows `kyc-documents` and `listing-media`)
- `POSTGRESQL_DATABASE_NAME` (root Terraform shows `rentipid_db` â€” confirmation needed)
- `AZURE_WORKER_CONTAINER_APP_NAME` (does not exist yet in Terraform)

## Stop Conditions

- Branch or HEAD differs from expected values
- An authoritative PHASE19B report is missing
- The 18 prerequisites cannot be reconciled
- A prerequisite would require duplicate primary ownership
- More than five slices required without documented hard boundary
- Repository evidence materially contradicts authoritative reports
- A real secret is encountered
- External access is required during planning
- Implementation is required during planning

## Acceptance Criteria

1. All 18 prerequisites listed: YES
2. All 18 have exactly one primary slice: YES
3. Zero unassigned: YES
4. Zero duplicated primary assignments: YES
5. Five primary execution slices used: YES
6. Every slice has exact scope and validation: YES
7. Authoritative relevant-file registry created: YES
8. Future broad rediscovery prohibited: YES
9. Model routing assigned: YES
10. Non-secret identifier template created: YES
11. No secret field requested: YES
12. Database migration remains separate decision: YES
13. Production access remains prohibited: YES
14. Option 3 remains unavailable: YES
15. PHASE19 remains frozen: YES
16. Only two permitted reports created: YES
17. No source/infrastructure/environment/Prisma/test file modified: YES
18. Next gate is R1: YES

## Planned Execution Sequence

1. **PHASE19B_SLICE_R1_RUNTIME_WORKER_HEALTH_READINESS** â€” Claude Sonnet 4.6
   - Worker Container App/Job Terraform definition
   - Liveness and readiness probes for API Container App
   - PR-15 confirmation
   - No external access required

2. **PHASE19B_SLICE_R2_OBSERVABILITY_AND_TELEMETRY_PRIVACY** â€” Claude Opus 4.6
   - Application Insights Terraform resource
   - Alert rules
   - Telemetry redaction processor
   - May execute in parallel with R1

3. **PHASE19B_SLICE_R3_DATABASE_STORAGE_BACKUP_RECOVERY** â€” Claude Opus 4.6
   - Documentation-only readiness report
   - Database migration decision boundary
   - Provisioning prerequisites documented
   - No provisioning executed

4. **PHASE19B_SLICE_R4_IDENTIFIER_INTAKE** â€” Claude Sonnet 4.6
   - Trusted-administrator identifier collection
   - Reconciliation against Terraform defaults
   - Immutable registry creation

5. **PHASE19B_SLICE_R5_PRODUCTION_VERIFICATION_AUTHORIZATION** â€” Claude Opus 4.6
   - Exact read-only commands documented
   - Owner authorization gate defined
   - No check executed

## Exact Next Gate

PHASE19B_SLICE_R1_RUNTIME_WORKER_HEALTH_READINESS

## UTF-8 Temporary Artifact Reconciliation

Temporary UTF-8 validation files created:

- scratch_utf8_bom.md
- scratch_utf8_nobom.md

Purpose:

These files were created only to compare UTF-8 BOM and UTF-8 without BOM handling for the em dash used in Slice R1 section headings.

Their creation was outside the permitted planning-gate file boundary.

Content verification:

Both files contained only the exact UTF-8 test text:

Slice R1 â€” Runtime

Temporary unauthorized files created:
YES

Temporary files safely deleted:
YES

Unauthorized temporary files remaining:
NO

Application code changed:
NO

Infrastructure files changed:
NO

Environment files changed:
NO

Prisma changed:
NO

Test files changed:
NO

PHASE19 files modified:
NO

Master plan status retained:

PHASE19B_PREREQUISITE_REMEDIATION_AND_IDENTIFIER_PLAN_COMPLETE

Next gate retained:

PHASE19B_SLICE_R1_RUNTIME_WORKER_HEALTH_READINESS




