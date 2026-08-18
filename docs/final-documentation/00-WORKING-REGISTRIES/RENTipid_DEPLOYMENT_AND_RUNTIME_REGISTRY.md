# RENTipid Deployment and Runtime Registry

Status: `FROZEN_WORKING_REGISTRY`

## Current architecture language

`AUTHORITATIVE_ARCHITECTURE_DIRECTION: VERCEL_FRONTEND_WITH_AZURE_BACKEND_AND_SERVICES`

`CURRENT_REPOSITORY_RUNTIME_TRANSITION_STATE: PARTIALLY_SPLIT_IMPLEMENTATION`

The first status is the accepted Phase 19B direction. The second describes
the current repository, where root Next.js APIs and extracted service targets
coexist. Neither status proves Azure provisioning or deployment.

| Runtime concern | Target/evidence | Documentation status |
| --- | --- | --- |
| Frontend/server rendering | Vercel Next.js project `ren-tipid` | Owner-verified identity; deployment not performed by this work |
| Public domains | `www.rentipid.com.ph`, `ren-tipid.vercel.app` | Owner-verified; no DNS/live check performed here |
| Authentication | NextAuth in root Next.js app | Remains on Vercel target |
| Backend API | `apps/api` on Azure Container Apps | Transitional target/definition; production activation not inferred |
| Background worker | `apps/worker` as Azure Container Apps Job | Transitional target/definition |
| Database | Azure Database for PostgreSQL Flexible Server target | Terraform/readiness evidence; production data path separately controlled |
| Object storage | Azure Blob Storage with private endpoint/managed identity target | Current local definitions; provisioning not authorized |
| Registry | Azure Container Registry | Terraform definition/existing-resource input |
| Monitoring | Log Analytics/Application Insights | Terraform/middleware definition |
| Network | parallel VNet `10.219.0.0/20`; ACA `/23`; private endpoint `/24` | Owner-approved non-overlap identifiers; no provisioning authority |
| Infrastructure as code | root and environment/module Terraform | Code only; no plan/apply run during documentation |

## Environment tiers

- local development;
- isolated test database and test lifecycle;
- staging/readiness definitions;
- production target requiring explicit authorization.

## Deployment controls

- no Terraform plan/apply from documentation;
- no Azure/Vercel mutation;
- no production/database/payment access;
- Phase 19 live payment status remains `COMPLETE_NO_GO_FROZEN`;
- Phase 19B local definition does not authorize provisioning, deployment,
  traffic migration, DNS cutover, or database migration;
- current compute/network/storage changes are uncommitted worktree evidence and
  are not described as deployed;
- `PHASE19B_FINAL_STATUS` remains
  `PHASE19B_COMPLETE_WITH_SEPARATE_OWNER_DECISIONS_RESERVED`;
- `DATABASE_MIGRATION` remains `PENDING_SEPARATE_OWNER_DECISION`;
- Azure provisioning or deployment authorized by documentation: `NO`;
- AWS/PM2 materials are `SUPERSEDED_ARCHITECTURE_HISTORY`.

Canonical manual cross-reference: `../03-OPERATIONS-MANUALS/RENTipid_OPERATIONS_MANUAL.md`,
`../04-TECHNICAL-MANUALS/RENTipid_TECHNICAL_REFERENCE.md`, and Master Part XXII.
