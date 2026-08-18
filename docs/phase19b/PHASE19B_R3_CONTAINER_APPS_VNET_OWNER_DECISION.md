# PHASE19B R3 Container Apps VNet Owner Decision

## Executive Decision
The Owner authorizes preparation of a parallel, VNet-integrated Azure Container Apps Environment as a future blue-green infrastructure target. The existing Container Apps Environment must remain unchanged.

## Repository State
Branch: feature/soc-phase4-threat-response
HEAD: 5804d4cceafc74e5e51b554be6f84a1b9c80e8be

## Decision Context
The R3 blocker contract is reconciled and requires an explicit Owner decision regarding potentially destructive Container Apps VNet integration, because enabling VNet integration requires re-creating the environment which may cause downtime if done in-place.

## Options Considered
1. In-place VNet modification or environment replacement:
   REJECTED_DUE_TO_DESTRUCTIVE_CHANGE_RISK

2. Parallel VNet-integrated environment design:
   SELECTED

3. Authentication and RBAC only while indefinitely deferring networking:
   NOT_SELECTED_BECAUSE_STORAGE_NETWORK_PATH_WOULD_REMAIN_BLOCKED

4. Re-enable shared-key access or public storage access:
   PROHIBITED_SECURITY_REGRESSION

## Selected Option
OWNER_DECISION: R3-VNET-OPTION-2

## Owner Authorization
AUTHORIZE_PARALLEL_VNET_INTEGRATED_CONTAINER_APPS_ENVIRONMENT_DESIGN_ONLY

## Existing Environment Preservation
PRESERVE_UNCHANGED

## Parallel Environment Design Boundary
AUTHORIZED (local architecture definition, Terraform contract expansion, non-secret variables, parallel networking design)

## Managed Identity and Blob RBAC Boundary
AUTHORIZED (planning for API principal output and Storage Blob Data Contributor assignment)

## Private Endpoint and DNS Boundary
AUTHORIZED (planning for Blob private endpoint, Blob private DNS zone, private DNS VNet link, private endpoint DNS-zone group)

## Blue-Green Deployment Requirement
REQUIRED_FOR_ANY_FUTURE_PROVISIONING

## Cutover Authorization Boundary
REQUIRES_SEPARATE_OWNER_AUTHORIZATION

## Production and Credential Restrictions
- No production identifier may be invented.
- No credential may enter source control.

## Database Migration Boundary
PENDING_SEPARATE_OWNER_DECISION

## Payment Safeguard Preservation
PHASE19_COMPLETE_NO_GO_FROZEN

## Risks Avoided
Avoids downtime and destructive replacement of the active Container Apps Environment.

## Future Contract-Expansion Requirements
The next contract-expansion gate may define exact boundaries for:
1. parallel VNet;
2. Container Apps infrastructure subnet;
3. private endpoint subnet;
4. parallel Container Apps Environment;
5. Blob private endpoint;
6. Blob private DNS zone;
7. private DNS VNet link;
8. private endpoint DNS-zone group;
9. API principal output;
10. Storage Blob Data Contributor role assignment;
11. managed-identity Blob adapter;
12. user-delegation SAS where required;
13. focused Blob-service test;
14. validation and rollback evidence.

## Actions Not Authorized
- Azure provisioning
- Terraform plan or apply
- replacement of the current Container Apps Environment
- in-place VNet integration
- production deployment
- traffic migration
- DNS cutover
- database migration
- production verification
- credential retrieval
- payment activation

## Decision Status
PHASE19B_R3_PARALLEL_VNET_DESIGN_AUTHORIZED

## Exact Next Gate
PHASE19B_R3_PARALLEL_VNET_CONTRACT_EXPANSION