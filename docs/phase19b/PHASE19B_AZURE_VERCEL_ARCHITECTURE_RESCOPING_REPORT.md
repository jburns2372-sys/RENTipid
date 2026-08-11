# PHASE19B AZURE/VERCEL ARCHITECTURE RESCOPING REPORT

## 1. Executive Summary
This report formalizes the transition of the RENTipid backend architecture from the previously cancelled "FULL AWS DEPLOYMENT" to the Owner-approved "VERCEL_FRONTEND_WITH_AZURE_BACKEND_AND_SERVICES". It outlines the current state of the repository, confirming a PARTIALLY_SPLIT application model where the backend APIs and worker processes are being migrated to Azure Container Apps, Azure Database for PostgreSQL, and Azure Blob Storage, while the frontend, NextAuth, and API routes remain on Vercel during transition. It details remaining execution slices required to complete PHASE19B safely.

## 2. Repository, Branch, and HEAD
- **Repository**: C:\Users\user\Documents\JD SOFTWARE PROJECTS\RENTipid
- **Branch**: feature/soc-phase4-threat-response
- **HEAD**: 5804d4cceafc74e5e51b554be6f84a1b9c80e8be

## 3. Owner-Approved Architecture Direction
- **Frontend**: VERCEL
- **Backend, APIs, services, and infrastructure**: AZURE
- **Architecture label**: VERCEL_FRONTEND_WITH_AZURE_BACKEND_AND_SERVICES

## 4. AWS Cancellation Boundary
All AWS identifier requests, provisioning execution plans, and document-based evidence claims are SUPERSEDED_AND_CANCELLED. No AWS resources will be created. No AWS access is authorized.

## 5. Current Application Architecture
- **Current application model**: PARTIALLY_SPLIT. A monolithic Next.js app exists in the root, while `apps/api` (rentipid-azure-api) and `apps/worker` (rentipid-azure-worker) indicate an ongoing backend extraction to Azure.
- **Frontend execution target**: VERCEL
- **Backend/API execution target**: AZURE (Azure Container Apps, via `infrastructure/modules/compute/main.tf`)
- **Authentication execution target**: VERCEL (NextAuth in Next.js `src/app/api/auth`)
- **Payment webhook execution target**: AZURE (`apps/api/src/routes/webhooks.ts`)
- **Background-job execution target**: AZURE (`apps/worker`)

## 6. Vercel Responsibility Matrix
| Responsibility | Status | Details |
| --- | --- | --- |
| Frontend rendering / Static assets | CURRENTLY_ON_VERCEL | Handled by Next.js |
| Server components / Server actions | SHARED | Next.js server actions remain on Vercel. Some logic shifted to Azure API. |
| API routes | SHARED | Moving towards `apps/api` on Azure Container Apps. |
| Authentication callbacks | REMAINS_ON_VERCEL | NextAuth handles authentication. |
| Public webhooks | MOVES_TO_AZURE | Handled by `apps/api`. |
| Scheduled functions | MOVES_TO_AZURE | Handled by `apps/worker`. |

## 7. Azure Responsibility Matrix
- **Azure Container Apps**: Runs the separated `apps/api` and `apps/worker`.
- **Azure Database for PostgreSQL**: Production database via `azurerm_postgresql_flexible_server`.
- **Azure Blob Storage**: Stores KYC and listing media via `azurerm_storage_account`.
- **Azure Application Insights**: API telemetry via `applicationinsights` dependency.

## 8. Database Option Analysis
- **Current provider**: NOT_CONFIRMED (Environment variables show placeholder. Previously Neon, now Azure).
- **Recommended direction**: AZURE_DATABASE_FOR_POSTGRESQL (CONFIRMED via `infrastructure/modules/database/main.tf`).
- **Prisma compatibility**: Fully compatible.
- **Migration required**: Yes.
- **Owner decision required**: NO (Repository evidence confirms Azure PostgreSQL).

## 9. Storage Analysis
- **Current provider**: NOT_CONFIRMED.
- **Recommended direction**: AZURE_BLOB_STORAGE (CONFIRMED via `infrastructure/modules/storage/main.tf` for containers `kyc-documents` and `listing-media`).
- **Migration requirement**: Object storage implementation needs review.

## 10. Monitoring Analysis
- **Current implementation**: Application Insights (`apps/api/src/middleware/appInsights.ts`).
- **Owner decision required**: NO.

## 11. Background-Job and Webhook Analysis
- **Background jobs**: `apps/worker` will handle scheduled tasks on Azure Container Apps.
- **Webhooks**: `apps/api/src/routes/webhooks.ts` intercepts PayMongo callbacks.

## 12. Authentication and Security Boundary
- Authentication remains on Vercel via NextAuth.
- Backend APIs on Azure validate requests via NextAuth-issued tokens or shared secrets (`apps/api/src/utils/secrets.ts`).

## 13. Deployment and Rollback Analysis
- **Deployment**: Handled by GitHub Actions or Azure DevOps (based on Terraform `AcrPull` setup).
- **Rollback**: Managed via Azure Container Apps revisions.

## 14. Azure/Vercel Evidence Registry
- `infrastructure/modules/compute/main.tf` (Azure Container Apps, ACR)
- `infrastructure/modules/database/main.tf` (Azure PostgreSQL Flexible Server)
- `infrastructure/modules/storage/main.tf` (Azure Blob Storage)
- `apps/api/package.json` (rentipid-azure-api with Application Insights, Blob Storage SDKs)
- `apps/worker/package.json` (rentipid-azure-worker)

## 15. Stale-Document Registry
- `docs/aws-deployment-readiness-report.md`
- `docs/aws-deployment-rollback-plan.md`
- `docs/aws-rds-postgresql-readiness.md`
- `docs/aws-backup-and-restore-plan.md`
- `docs/aws-security-hardening-checklist.md`

## 16. Requirement Reclassification Table

| Requirement | Original Definition | Corrected Classification |
| --- | --- | --- |
| **P19B-001** | Architecture Authorization | OWNER_ARCHITECTURE_DECISION_RESOLVED |
| **P19B-002** | RDS Read-Only Endpoint Auth | DOCUMENTED_PROVIDER_NEUTRALLY |
| **P19B-003** | PM2 Process Manager Auth | DOCUMENTED_PROVIDER_NEUTRALLY |
| **P19B-004** | Nginx Reverse Proxy Auth | DOCUMENTED_PROVIDER_NEUTRALLY |
| **P19B-005** | Env File Consistency | PARTIALLY_IMPLEMENTED |
| **P19B-006** | File Upload Directory | PARTIALLY_IMPLEMENTED |
| **P19B-007** | Backup & Recovery Auth | DOCUMENTED_PROVIDER_NEUTRALLY |
| **P19B-008** | CloudWatch Monitoring | DOCUMENTED_PROVIDER_NEUTRALLY |
| **P19B-009** | Production Smoke Check | EXTERNALLY_BLOCKED |## 17. Duplicate-Work Analysis
The current SOC PHASE19 safeguards and payment restrictions (PHP 100 limit) are decoupled from the infrastructure provider and remain in force.

## 18. Owner-Decision Registry

**Decision ID**: PHASE19B_DB_TARGET_01
- **Exact question**: What is the authoritative production database target?
- **Supported options**:
  - OPTION 1 — RETAIN CURRENT CONFIRMED POSTGRESQL PROVIDER (Cannot execute until current provider is identified)
  - OPTION 2 — USE AZURE DATABASE FOR POSTGRESQL FLEXIBLE SERVER (Requires separate migration planning and authorization when existing production data exists)
  - OPTION 3 — DEFER DATABASE TARGET DECISION
- **Lowest-change option**: OPTION 3
- **Safest option**: OPTION 3
- **Recommended option**: OPTION 2 only when Azure Database for PostgreSQL is already the Owner-approved target; otherwise OWNER_DECISION_REQUIRED.
- **Requirements affected**: P19B-002
- **Immediate work authorized**: None until decided.
- **Still-prohibited work**: Connecting to any database, database migration, production deployment.
- **Exact Owner response format**:
  `OWNER_DECISION_PHASE19B_DATABASE_TARGET: [OPTION_NUMBER] — [EXACT OPTION NAME]`

## 19. External-Prerequisite Registry
- None.

## 20. Exact Execution-Slice Plan

**SLICE E1**
- **Slice ID**: PHASE19B_SLICE_E1_AZURE_CONTAINER_APPS_READINESS
- **Title**: Azure Container Apps & Backend Readiness Review
- **Type**: DOCUMENTATION_AND_READINESS
- **Requirement IDs**: P19B-003, P19B-004
- **Objective**: Verify that Azure Container Apps configuration covers backend process management and reverse proxying.
- **Dependencies**: None.
- **Exact File Boundaries**:
  - **A. PERMITTED EXISTING FILES TO MODIFY**: NONE
  - **B. PERMITTED NEW FILES TO CREATE**: docs/phase19b/PHASE19B_SLICE_E1_COMPLETION_REPORT.md
  - **C. READ-ONLY SUPPORTING FILES**: infrastructure/modules/compute/main.tf, package.json, apps/api/package.json, apps/worker/package.json
  - **D. PERMITTED TEST FILES**: NONE
  - **E. PROHIBITED FILES AND SUBSYSTEMS**: .env.production.example
- **Exact Symbols/Configuration Blocks**: zurerm_container_app block in compute/main.tf.
- **Exact Validations**: 
ode -e "const fs=require('fs'); const t=fs.readFileSync('infrastructure/modules/compute/main.tf', 'utf8'); if(!t.includes('azurerm_container_app') || !t.includes('ingress') || !t.includes('target_port')) process.exit(1); process.exit(0);"
- **Acceptance Criteria**: Container Apps ingress and runtime image are fully documented as replacing the previous approach.
- **Stop Conditions**: Attempting to access Azure or modify infrastructure code.
- **Access Boundaries**: Production/Azure/Database/Credentials NO.
- **Owner-Decision Dependency**: NO
- **Completion Report**: docs/phase19b/PHASE19B_SLICE_E1_COMPLETION_REPORT.md
- **Exact Next Gate**: PHASE19B_SLICE_E2_AZURE_DATABASE_PATH_CONFIRMATION

**SLICE E2**
- **Slice ID**: PHASE19B_SLICE_E2_AZURE_DATABASE_PATH_CONFIRMATION
- **Title**: Azure PostgreSQL Database Path Confirmation
- **Type**: OWNER_DECISION_GATE
- **Requirement IDs**: P19B-002
- **Objective**: Determine the production database target.
- **Dependencies**: Slice E1
- **Exact File Boundaries**:
  - **A. PERMITTED EXISTING FILES TO MODIFY**: NONE
  - **B. PERMITTED NEW FILES TO CREATE**: docs/phase19b/PHASE19B_SLICE_E2_COMPLETION_REPORT.md
  - **C. READ-ONLY SUPPORTING FILES**: infrastructure/modules/database/main.tf, prisma/schema.prisma
  - **D. PERMITTED TEST FILES**: NONE
  - **E. PROHIBITED FILES AND SUBSYSTEMS**: .env.production.example
- **Exact Symbols/Configuration Blocks**: zurerm_postgresql_flexible_server in database/main.tf, datasource db in schema.prisma.
- **Exact Validations**: 
ode -e "const fs=require('fs'); if(!fs.existsSync('infrastructure/modules/database/main.tf')) process.exit(1);"
- **Acceptance Criteria**: Owner responds with the exact database target decision.
- **Stop Conditions**: Attempting to access Neon, Azure, or modify schema.
- **Access Boundaries**: Production/Azure/Database/Credentials NO.
- **Owner-Decision Dependency**: YES (Database current provider: NOT_CONFIRMED)
- **Completion Report**: docs/phase19b/PHASE19B_SLICE_E2_COMPLETION_REPORT.md
- **Exact Next Gate**: PHASE19B_SLICE_E3_AZURE_STORAGE_ENVIRONMENT

**SLICE E3**
- **Slice ID**: PHASE19B_SLICE_E3_AZURE_STORAGE_ENVIRONMENT
- **Title**: Azure Blob Storage & Environment Consistency
- **Type**: LOCAL_IMPLEMENTATION
- **Requirement IDs**: P19B-005, P19B-006
- **Objective**: Validate .env.production.example consistency against Azure Blob Storage requirements.
- **Dependencies**: Slice E2
- **Exact File Boundaries**:
  - **A. PERMITTED EXISTING FILES TO MODIFY**: .env.production.example
  - **B. PERMITTED NEW FILES TO CREATE**: docs/phase19b/PHASE19B_SLICE_E3_COMPLETION_REPORT.md
  - **C. READ-ONLY SUPPORTING FILES**: infrastructure/modules/storage/main.tf, apps/api/package.json, apps/api/src/services/blobService.ts
  - **D. PERMITTED TEST FILES**: NONE
  - **E. PROHIBITED FILES AND SUBSYSTEMS**: .env.production
- **Exact Symbols/Configuration Blocks**: zurerm_storage_account, zurerm_storage_container in storage/main.tf.
- **Exact Validations**: 
ode -e "const fs=require('fs'); const env=fs.readFileSync('.env.production.example', 'utf8'); if(!env.includes('AZURE_STORAGE_ACCOUNT')) process.exit(1);"
- **Acceptance Criteria**: .env.production.example clearly lists Azure Storage variables. APPLICATION_STORAGE_ADAPTER: apps/api/src/services/blobService.ts
- **Stop Conditions**: Modifying real credentials.
- **Access Boundaries**: Production/Azure/Database/Credentials NO.
- **Owner-Decision Dependency**: NO
- **Completion Report**: docs/phase19b/PHASE19B_SLICE_E3_COMPLETION_REPORT.md
- **Exact Next Gate**: PHASE19B_SLICE_E4_AZURE_MONITORING_REVIEW

**SLICE E4**
- **Slice ID**: PHASE19B_SLICE_E4_AZURE_MONITORING_REVIEW
- **Title**: Azure Backup, Recovery, & AppInsights Monitoring Review
- **Type**: DOCUMENTATION_AND_READINESS
- **Requirement IDs**: P19B-007, P19B-008
- **Objective**: Confirm that Application Insights and Azure PostgreSQL backup configurations are properly mapped.
- **Dependencies**: Slice E3
- **Exact File Boundaries**:
  - **A. PERMITTED EXISTING FILES TO MODIFY**: NONE
  - **B. PERMITTED NEW FILES TO CREATE**: docs/phase19b/PHASE19B_SLICE_E4_COMPLETION_REPORT.md
  - **C. READ-ONLY SUPPORTING FILES**: infrastructure/modules/compute/main.tf, infrastructure/modules/database/main.tf, apps/api/src/middleware/appInsights.ts
  - **D. PERMITTED TEST FILES**: NONE
  - **E. PROHIBITED FILES AND SUBSYSTEMS**: .env.production.example
- **Exact Symbols/Configuration Blocks**: log_analytics_workspace_id in compute/main.tf, ackup_retention_days in database/main.tf.
- **Exact Validations**: 
ode -e "const fs=require('fs'); const t1=fs.readFileSync('apps/api/src/middleware/appInsights.ts','utf8'); const t2=fs.readFileSync('infrastructure/modules/compute/main.tf','utf8'); const t3=fs.readFileSync('infrastructure/modules/database/main.tf','utf8'); if(!t2.includes('log_analytics_workspace_id') || !t3.includes('backup_retention_days')) process.exit(1); process.exit(0);"
- **Acceptance Criteria**: Monitoring boundaries mapped to Azure correctly.
- **Stop Conditions**: Attempting to provision AppInsights.
- **Access Boundaries**: Production/Azure/Database/Credentials NO.
- **Owner-Decision Dependency**: NO
- **Completion Report**: docs/phase19b/PHASE19B_SLICE_E4_COMPLETION_REPORT.md
- **Exact Next Gate**: PHASE19B_SLICE_E5_PRODUCTION_AUTHORIZATION_PLAN

**SLICE E5**
- **Slice ID**: PHASE19B_SLICE_E5_PRODUCTION_AUTHORIZATION_PLAN
- **Title**: Azure Smoke Check Plan & Production Authorization
- **Type**: PRODUCTION_AUTHORIZATION_GATE
- **Requirement IDs**: P19B-009
- **Objective**: Define exact read-only commands for production verification and request Owner authorization.
- **Dependencies**: Slice E4
- **Exact File Boundaries**:
  - **A. PERMITTED EXISTING FILES TO MODIFY**: NONE
  - **B. PERMITTED NEW FILES TO CREATE**: docs/phase19b/PHASE19B_SLICE_E5_COMPLETION_REPORT.md
  - **C. READ-ONLY SUPPORTING FILES**: infrastructure/modules/compute/main.tf, apps/api/src/routes/webhooks.ts
  - **D. PERMITTED TEST FILES**: NONE
  - **E. PROHIBITED FILES AND SUBSYSTEMS**: .env.production.example
- **Exact Symbols/Configuration Blocks**: N/A
- **Exact Validations**: 
ode -e "const fs=require('fs');const p='docs/phase19b/PHASE19B_SLICE_E5_COMPLETION_REPORT.md';if(!fs.existsSync(p))process.exit(1);const t=fs.readFileSync(p,'utf8');const required=['Non-Secret Identifier Registry','Permitted Read-Only Checks','Prohibited Checks','Owner Decision Options','Stop Conditions'];for(const s of required){if(!t.includes(s))process.exit(1);}"
- **Acceptance Criteria**: Owner authorization brief prepared for production read-only smoke checks including Non-Secret Identifier Registry.
- **Stop Conditions**: Execution of production commands.
- **Access Boundaries**: Production/Azure/Database/Credentials NO (This slice is planning only).
- **Owner-Decision Dependency**: YES (For production access).
- **Completion Report**: docs/phase19b/PHASE19B_SLICE_E5_COMPLETION_REPORT.md
- **Exact Next Gate**: PHASE19B_AZURE_PRODUCTION_SMOKE_CHECK_EXECUTION## 21. Validation Matrix
All validation requires static analysis of configuration and Terraform files.

## 22. Evidence Matrix
Output completion reports for Slices E1 through E5 into `docs/phase19b/`.

## 23. Production-Authorization Matrix
Production access is prohibited until the execution of a designated authorization gate (Slice E5).

## 24. Stop-Condition Matrix
- Any attempt to access AWS.
- Any attempt to access production resources prior to Slice E5 authorization.

## 25. Final PHASE19B Closure Criteria
Completion of Slices E1 through E5, yielding verified Azure configurations and an Owner-approved smoke check plan.

## 26. Exact Next Gate
`PHASE19B_SLICE_E1_AZURE_CONTAINER_APPS_READINESS`
