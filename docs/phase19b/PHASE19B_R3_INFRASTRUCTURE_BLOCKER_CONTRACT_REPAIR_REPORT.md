# PHASE19B R3 Infrastructure Blocker Contract Repair Report

## Executive Summary
This report defines the exact implementation boundary required to resolve the R3 infrastructure blocker. The boundary focuses on replacing the shared-key dependency in lobService.ts with a DefaultAzureCredential managed identity implementation, along with the precise Terraform configuration required to expose the API Container App identity and assign it the Storage Blob Data Contributor role. VNet integration changes were found to be potentially destructive and thus require a separate Owner decision.

## Repository State
Branch: feature/soc-phase4-threat-response
HEAD: 5804d4cceafc74e5e51b554be6f84a1b9c80e8be

## Original Contract Defect
The authoritative R3 contract lacked an exact file modification and creation boundary for implementing Azure Blob managed identity authentication, RBAC, and private networking tests, triggering the BLOCKED_INCOMPLETE_AUTHORITATIVE_BOUNDARY stop condition.

## Targeted Discovery Scope
- pps/api/src/services/blobService.ts (API usage)
- pps/api/package.json (Dependencies)
- infrastructure/modules/compute/main.tf (API identity)
- infrastructure/environments/prod/main.tf (Wiring and RBAC potential)
- pps/api/src/routes/documents.ts (Caller usage)

## Blob Service Functional Contract
- **Exported functions**: generateUploadSasUrl
- **Actions**: Generates SAS for browser-direct Blob upload
- **Browser-direct access required**: YES
- **Server-mediated access alone sufficient**: NO
- **Azure SDK imports**: @azure/storage-blob
- **Environment variables**: AZURE_STORAGE_ACCOUNT_NAME, AZURE_STORAGE_ACCOUNT_KEY
- **Caller modification**: YES (getUserDelegationKey requires async transition)

## Azure Package Availability
- Azure Storage Blob package: PRESENT
- Azure Identity package: PRESENT

## Exact Blob Test Boundary
CREATE_NEW_TEST: apps/api/src/services/__tests__/blobService.test.ts

## API Managed Identity Finding
SYSTEM_ASSIGNED_PRESENT

## API Principal Output Boundary
REQUIRED_CREATE: infrastructure/modules/compute/outputs.tf

## Blob RBAC Boundary
BLOB_RBAC_FILE: infrastructure/environments/prod/main.tf
BLOB_RBAC_PRINCIPAL_SOURCE: module.compute.api_principal_id
BLOB_RBAC_SCOPE_SOURCE: module.storage.storage_account_id

## Existing Network Architecture
- VNet resource: NOT_DEFINED
- Container Apps VNet integration: NOT_DEFINED

## Container Apps VNet Change Classification
OWNER_DECISION_REQUIRED_POTENTIALLY_DESTRUCTIVE

## Blob Private Endpoint Boundary
OWNER_DECISION_REQUIRED

## Blob Private DNS Boundary
OWNER_DECISION_REQUIRED

## Repaired Existing-File Modification Registry
- apps/api/src/services/blobService.ts
- apps/api/src/routes/documents.ts
- infrastructure/environments/prod/main.tf
- .env.production.example
- docs/phase19b/PHASE19B_SLICE_R3_DATABASE_STORAGE_READINESS_REPORT.md

## Repaired New-File Creation Registry
- apps/api/src/services/__tests__/blobService.test.ts
- infrastructure/modules/compute/outputs.tf
- infrastructure/modules/storage/outputs.tf

## Read-Only Evidence Registry
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

## Exact Validation Registry
Defined in Master Plan (Jest tests, TypeScript tsc, broad-any regex, terraform fmt, terraform validate, PowerShell structural regex).

## Security and Secret Boundaries
No real secrets will be included in tests. No live credentials accessed.

## Stop Conditions
Defined in Master Plan (missing packages, absent tests, etc).

## Exact-Once Prerequisite Confirmation
18 existing prerequisites remain assigned. No new prerequisite added.

## Contract Repair Status
BLOCKED_CONTAINER_APPS_VNET_OWNER_DECISION_REQUIRED

## Exact Next Gate
PHASE19B_R3_CONTAINER_APPS_VNET_OWNER_DECISION

Implementation performed: NO
Application code changed: NO
Infrastructure changed: NO
Test files changed: NO
Package files changed: NO
Environment files changed: NO
Azure accessed: NO
Temporary files created: NO

## Contract Placement and Discovery-Scope Reconciliation

Previous blocker-contract placement proven: NO
Previous final write method: Add-Content at document end
Blocker contracts found before reconciliation: 1
Materially different blocker copies: NO
Authoritative blocker contract placed inside R3: YES
Blocker contract count after reconciliation: 1
Blocker contract after R4: NO
R3-to-R4 placement validation exit code: 0
Exact test-file validation exit code: 0
Exact-once prerequisite validation exit code: 0
Prior application discovery exceeded original narrow read boundary: YES

Prior read-scope deviation:
A recursive search across apps/api was used to locate the exact caller of generateUploadSasUrl.

Files modified by that discovery: NO
External access performed: NO
Secrets retrieved: NO
Read-scope deviation classification: READ_ONLY_SCOPE_DEVIATION_RECORDED
Technical caller boundary retained: apps/api/src/routes/documents.ts
Reason retained: The recursive read identified the exact caller required for the asynchronous user-delegation SAS transition. No application file was changed during contract repair.
Owner VNet decision selected: NO

Contract status:
BLOCKED_CONTAINER_APPS_VNET_OWNER_DECISION_REQUIRED

Next gate:
PHASE19B_R3_CONTAINER_APPS_VNET_OWNER_DECISION

## Focused-Test Command-Path Reconciliation

Authoritative Blob-service test file:
apps/api/src/services/__tests__/blobService.test.ts

Incorrect focused command before reconciliation:
Push-Location apps/api; npx jest apps/api/src/services/__tests__/blobService.test.ts; $code=$LASTEXITCODE; Pop-Location; exit $code

Root cause:
The repository-root test path was repeated after changing the working directory to apps/api.

Correct focused command:
Push-Location apps/api; npx jest src/services/__tests__/blobService.test.ts; $code=$LASTEXITCODE; Pop-Location; exit $code

Effective repository path:
apps/api/src/services/__tests__/blobService.test.ts

Command-path validation exit code:
0

Effective-path validation exit code:
0

Normalized test-file validation exit code:
0

Placement validation exit code:
0

Exact-once prerequisite validation exit code:
0

Implementation performed:
NO

Owner VNet decision selected:
NO

Contract status:
BLOCKED_CONTAINER_APPS_VNET_OWNER_DECISION_REQUIRED

Next gate:
PHASE19B_R3_CONTAINER_APPS_VNET_OWNER_DECISION
