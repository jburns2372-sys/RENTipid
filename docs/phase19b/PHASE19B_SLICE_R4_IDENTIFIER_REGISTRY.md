# PHASE19B R4 Non-Secret Identifier and Endpoint Registry

## Executive Registry Status
R4_IDENTIFIER_INTAKE_STATUS: PHASE19B_R4_IDENTIFIER_INTAKE_COMPLETE

## Repository State
Branch: feature/soc-phase4-threat-response
HEAD: 5804d4cceafc74e5e51b554be6f84a1b9c80e8be

## R3 Closure Dependency
R3_CLOSURE_STATUS: PHASE19B_R3_CLOSURE_REVIEW_COMPLETE

## R4 Contract Dependency
R4_STATUS: PHASE19B_SLICE_R4_COMPLETE

## Identifier Fields

Field: AZURE_SUBSCRIPTION_LABEL_OR_ID
Value or status: 0c991f43-1a5e-4228-9157-af106a276f58
Subscription state: Enabled
Field type: IDENTIFIER
Classification: OWNER_CONFIRMED
Authoritative source: docs/phase19b/PHASE19B_NON_SECRET_IDENTIFIER_REQUEST_TEMPLATE.md
Validation: PASS
Owner confirmation: YES
Resource existence: NOT_APPLICABLE
Secret classification: NON_SECRET

Field: AZURE_REGION
Value or status: southeastasia
Field type: IDENTIFIER
Classification: VERIFIED_FROM_REPOSITORY
Authoritative source: infrastructure/variables.tf
Validation: PASS
Owner confirmation: YES
Resource existence: NOT_APPLICABLE
Secret classification: NON_SECRET

Field: AZURE_TENANT_LABEL_OR_ID_IF_NON_SECRET
Value or status: a35e68fb-a048-4ab0-9d84-de53e6b44441
Field type: IDENTIFIER
Classification: OWNER_CONFIRMED
Authoritative source: docs/phase19b/PHASE19B_NON_SECRET_IDENTIFIER_REQUEST_TEMPLATE.md
Validation: PASS
Owner confirmation: YES
Resource existence: NOT_APPLICABLE
Secret classification: NON_SECRET

Field: AZURE_RESOURCE_GROUP_NAME
Value or status: rg-rentipid-prod
Field type: IDENTIFIER
Classification: LOCAL_DEFINITION_ONLY
Authoritative source: infrastructure/environments/prod/variables.tf
Validation: PASS
Owner confirmation: YES
Resource existence: NOT_YET_PROVISIONED
Secret classification: NON_SECRET

Field: AZURE_CONTAINER_APPS_ENVIRONMENT_NAME
Value or status: rg-rentipid-prod-env
Field type: IDENTIFIER
Classification: LOCAL_DEFINITION_ONLY
Authoritative source: infrastructure/environments/prod/variables.tf
Validation: PASS
Owner confirmation: YES
Resource existence: NOT_YET_PROVISIONED
Secret classification: NON_SECRET

Field: AZURE_API_CONTAINER_APP_NAME
Value or status: LOCAL_DEFINITION_ONLY
Field type: IDENTIFIER
Classification: LOCAL_DEFINITION_ONLY
Authoritative source: docs/phase19b/PHASE19B_NON_SECRET_IDENTIFIER_REQUEST_TEMPLATE.md
Validation: PASS
Owner confirmation: YES
Resource existence: NOT_YET_PROVISIONED
Secret classification: NON_SECRET

Field: AZURE_WORKER_CONTAINER_APP_NAME
Value or status: LOCAL_DEFINITION_ONLY
Field type: IDENTIFIER
Classification: LOCAL_DEFINITION_ONLY
Authoritative source: docs/phase19b/PHASE19B_NON_SECRET_IDENTIFIER_REQUEST_TEMPLATE.md
Validation: PASS
Owner confirmation: YES
Resource existence: NOT_YET_PROVISIONED
Secret classification: NON_SECRET

Field: POSTGRESQL_FLEXIBLE_SERVER_NAME
Value or status: rentipid-postgres-db
Field type: IDENTIFIER
Classification: LOCAL_DEFINITION_ONLY
Authoritative source: infrastructure/environments/prod/variables.tf
Validation: PASS
Owner confirmation: YES
Resource existence: NOT_YET_PROVISIONED
Secret classification: NON_SECRET

Field: POSTGRESQL_DATABASE_NAME
Value or status: LOCAL_DEFINITION_ONLY
Field type: IDENTIFIER
Classification: LOCAL_DEFINITION_ONLY
Authoritative source: docs/phase19b/PHASE19B_NON_SECRET_IDENTIFIER_REQUEST_TEMPLATE.md
Validation: PASS
Owner confirmation: YES
Resource existence: NOT_YET_PROVISIONED
Secret classification: NON_SECRET

Field: POSTGRESQL_RESOURCE_GROUP_NAME
Value or status: rg-rentipid-prod
Field type: IDENTIFIER
Classification: LOCAL_DEFINITION_ONLY
Authoritative source: infrastructure/environments/prod/variables.tf
Validation: PASS
Owner confirmation: YES
Resource existence: NOT_YET_PROVISIONED
Secret classification: NON_SECRET

Field: POSTGRESQL_REGION
Value or status: southeastasia
Field type: IDENTIFIER
Classification: LOCAL_DEFINITION_ONLY
Authoritative source: infrastructure/variables.tf
Validation: PASS
Owner confirmation: YES
Resource existence: NOT_APPLICABLE
Secret classification: NON_SECRET

Field: AZURE_STORAGE_ACCOUNT_NAME
Value or status: NOT_YET_PROVISIONED
Field type: IDENTIFIER
Classification: NOT_YET_PROVISIONED
Authoritative source: .env.production.example
Validation: PASS
Owner confirmation: YES
Resource existence: NOT_YET_PROVISIONED
Secret classification: NON_SECRET

Field: AZURE_STORAGE_CONTAINER_NAME
Value or status: LOCAL_DEFINITION_ONLY
Field type: IDENTIFIER
Classification: LOCAL_DEFINITION_ONLY
Authoritative source: docs/phase19b/PHASE19B_NON_SECRET_IDENTIFIER_REQUEST_TEMPLATE.md
Validation: PASS
Owner confirmation: YES
Resource existence: NOT_YET_PROVISIONED
Secret classification: NON_SECRET

Field: AZURE_STORAGE_RESOURCE_GROUP_NAME
Value or status: rg-rentipid-prod
Field type: IDENTIFIER
Classification: LOCAL_DEFINITION_ONLY
Authoritative source: infrastructure/environments/prod/variables.tf
Validation: PASS
Owner confirmation: YES
Resource existence: NOT_YET_PROVISIONED
Secret classification: NON_SECRET

Field: APPLICATION_INSIGHTS_RESOURCE_NAME
Value or status: LOCAL_DEFINITION_ONLY
Field type: IDENTIFIER
Classification: LOCAL_DEFINITION_ONLY
Authoritative source: docs/phase19b/PHASE19B_NON_SECRET_IDENTIFIER_REQUEST_TEMPLATE.md
Validation: PASS
Owner confirmation: YES
Resource existence: NOT_YET_PROVISIONED
Secret classification: NON_SECRET

Field: LOG_ANALYTICS_WORKSPACE_NAME
Value or status: rg-rentipid-prod-log
Field type: IDENTIFIER
Classification: LOCAL_DEFINITION_ONLY
Authoritative source: infrastructure/environments/prod/variables.tf
Validation: PASS
Owner confirmation: YES
Resource existence: NOT_YET_PROVISIONED
Secret classification: NON_SECRET

Field: MONITORING_RESOURCE_GROUP_NAME
Value or status: rg-rentipid-prod
Field type: IDENTIFIER
Classification: LOCAL_DEFINITION_ONLY
Authoritative source: infrastructure/environments/prod/variables.tf
Validation: PASS
Owner confirmation: YES
Resource existence: NOT_YET_PROVISIONED
Secret classification: NON_SECRET

Field: ALERT_ACTION_GROUP_NAME_IF_EXISTING
Value or status: NOT_YET_PROVISIONED
Field type: IDENTIFIER
Classification: NOT_YET_PROVISIONED
Authoritative source: docs/phase19b/PHASE19B_NON_SECRET_IDENTIFIER_REQUEST_TEMPLATE.md
Validation: PASS
Owner confirmation: YES
Resource existence: NOT_YET_PROVISIONED
Secret classification: NON_SECRET

Field: VERCEL_PROJECT_NAME
Value or status: ren-tipid
Field type: IDENTIFIER
Classification: OWNER_CONFIRMED
Authoritative source: docs/phase19b/PHASE19B_NON_SECRET_IDENTIFIER_REQUEST_TEMPLATE.md
Validation: PASS
Owner confirmation: YES
Resource existence: VERIFIED_EXISTING_OWNER_EVIDENCE
Secret classification: NON_SECRET

Field: VERCEL_TEAM_OR_SCOPE_NAME_IF_APPLICABLE
Value or status: jburns2372-sys-projects
Field type: IDENTIFIER
Classification: OWNER_CONFIRMED
Authoritative source: docs/phase19b/PHASE19B_NON_SECRET_IDENTIFIER_REQUEST_TEMPLATE.md
Validation: PASS
Owner confirmation: YES
Resource existence: VERIFIED_EXISTING_OWNER_EVIDENCE
Secret classification: NON_SECRET

## Endpoint Fields

Field: VERIFIED_PUBLIC_APPLICATION_URL
Value or status: https://www.rentipid.com.ph
Field type: ENDPOINT
Classification: OWNER_CONFIRMED
Authoritative source: OWNER_VERIFIED_VERCEL_DASHBOARD
Validation: PASS
Owner confirmation status: YES
Resource existence classification: VERIFIED_EXISTING_OWNER_EVIDENCE
Secret classification: NON_SECRET

Default Vercel project URL:
https://ren-tipid.vercel.app

Field: PUBLIC_HEALTH_ROUTE_PATH
Value or status: NOT_YET_PROVISIONED
Field type: ENDPOINT
Classification: NOT_YET_PROVISIONED
Authoritative source: docs/phase19b/PHASE19B_NON_SECRET_IDENTIFIER_REQUEST_TEMPLATE.md
Validation: PASS
Owner confirmation: YES
Resource existence: NOT_YET_PROVISIONED
Secret classification: NON_SECRET

Field: PAYMENT_WEBHOOK_ROUTE_PATH
Value or status: NOT_YET_PROVISIONED
Field type: ENDPOINT
Classification: NOT_YET_PROVISIONED
Authoritative source: docs/phase19b/PHASE19B_NON_SECRET_IDENTIFIER_REQUEST_TEMPLATE.md
Validation: PASS
Owner confirmation: YES
Resource existence: NOT_YET_PROVISIONED
Secret classification: NON_SECRET

## Repository-Verified Values
Total: 1

## Derived Contract Values
Total: 0

## Owner-Confirmed Values
Total: 5

## Owner Response Required
Total: 0

## Local-Definition-Only Resources
Total: 12

## Not-Yet-Provisioned Resources
Total: 5

## Not-Applicable Fields
Total: 0

## Rejected Values
Total: 0

## Prohibited Secret Fields
Zero secrets present.

## CORS and Endpoint Consistency
PASS

## Resource-Existence Classification
All required existence rules applied.

## Azure Discovery Boundary
NOT_AUTHORIZED_BY_DEFAULT

## Provisioning Boundary
NO provisioning performed.

## Deployment Boundary
NO deployment performed.

## Database Migration Boundary
NO database migration performed.

## Payment Safeguard Preservation
PHASE19_COMPLETE_NO_GO_FROZEN

## Secret Scan
NO_SECRET_FOUND

## File-Boundary Validation
PASS

## R4 Status
PHASE19B_SLICE_R4_COMPLETE

## Exact Next Gate
PHASE19B_SLICE_R5_PRODUCTION_VERIFICATION_AUTHORIZATION
