> [!WARNING]
> **PHASE19B ARCHITECTURE CORRECTION NOTICE (2026-07-30)**
> - The previous architecture target "FULL AWS DEPLOYMENT" is SUPERSEDED and CANCELLED.
> - AWS documents are historical/non-authoritative. No AWS infrastructure exists or is required for RENTipid.
> - AWS identifier collection, production authorization, and provisioning authorization are CANCELLED.
> - The approved target is **VERCEL_FRONTEND_WITH_AZURE_BACKEND_AND_SERVICES**.
> - No production access is authorized. No Azure service selection is assumed beyond the Owner-approved direction. A new bounded Azure/Vercel evidence review is required.
> 
> **REQUIREMENT RECLASSIFICATIONS:**
> - **P19B-001**: OWNER_ARCHITECTURE_DECISION_RESOLVED (VERCEL_FRONTEND_WITH_AZURE_BACKEND_AND_SERVICES). This is a documentation correction; it does not reopen application implementation, supersedes the prior OUT_OF_SCOPE/AWS interpretation, and does not authorize deployment.
> - **P19B-002**: REQUIRES_AZURE_VERCEL_DATABASE_PATH_CONFIRMATION
> - **P19B-003**: REQUIRES_AZURE_VERCEL_RESCOPING
> - **P19B-004**: REQUIRES_AZURE_VERCEL_RESCOPING
> - **P19B-005**: REQUIRES_AZURE_VERCEL_RESCOPING
> - **P19B-006**: REQUIRES_AZURE_VERCEL_RESCOPING
> - **P19B-007**: REQUIRES_AZURE_VERCEL_RESCOPING
> - **P19B-008**: REQUIRES_AZURE_VERCEL_RESCOPING
> - **P19B-009**: REQUIRES_AUTHORIZED_AZURE_VERCEL_PRODUCTION_TARGET_AND_SMOKE_CHECK_PLAN
> 
> *(Any previous claims in this document regarding AWS readiness or AWS-based requirement completion are hereby invalidated.)*

# PHASE19B ARCHITECTURE AUTHORIZATION BRIEF

## 1. Executive Summary
This brief evaluates repository-supported production architecture options for RENTipid. The Azure documentation was found to be stale, leaving no active production architecture formally authorized by the owner. This brief details the AWS monolithic architecture (Option A/B) which is the only option fully backed by current repository readiness artifacts. The owner must authorize an option to unblock the remaining PHASE19B requirements.

## 2. Current Architecture Assessment
1. **Frontend framework**: Next.js (Monolithic)
2. **API/backend**: Next.js API routes (Monolithic)
3. **Database assumptions**: Prisma with PostgreSQL
4. **Storage assumptions**: Currently local file system (`private-uploads`), deferred S3 migration
5. **Background-job**: Next.js API / No dedicated worker
6. **Authentication**: NextAuth.js
7. **Monitoring and logging**: Custom Next.js dashboard UI
8. **Deployment files present**: `ecosystem.config.js`, `docs/nginx-rentipid.conf`
9. **Provider-specific files present**: `docs/aws-*.md`
10. **Environment-variable names**: Standard Next.js / PM2 `NODE_ENV=production`
11. **Monolithic or split**: Monolithic Next.js application
12. **Source-code changes for migration**: Minimal (Nginx/PM2 handles deployment, NextAuth `NEXTAUTH_URL` must be updated)
13. **Data migration required**: Yes, if moving from test/local DB to RDS
14. **Other migrations**: DNS points to AWS; PayMongo webhook URLs must point to AWS

## 3. Repository-Evidence Registry
- `docs/aws-deployment-readiness-report.md`
- `docs/aws-rds-postgresql-readiness.md`
- `docs/aws-backup-and-restore-plan.md`
- `docs/aws-security-hardening-checklist.md`
- `ecosystem.config.js`

## 4. Stale-Document Registry
- `docs/governance/remaining-work/PHASE19B_PRODUCTION_INFRASTRUCTURE_READINESS.md` (Contains stale "Phase 17 blocked" claims)

## 5. Supported Architecture Options
### Option 1: Full AWS Deployment
Backed by `docs/aws-deployment-readiness-report.md` and `ecosystem.config.js`. Next.js runs monolithically on an EC2 instance behind Nginx.

## 6. Unsupported Architecture Options
- **Vercel frontend with AWS backend**: No repository evidence of a split frontend/backend architecture.
- **Vercel frontend with Azure backend**: The Azure readiness document is stale and closed as out of scope.
- **Current Vercel-hosted Next.js application with Neon/PostgreSQL**: No deployment artifacts support Vercel/Neon production readiness.
- **Full Azure deployment**: Azure documentation is stale.
- **Provider-neutral readiness only**: Existing PM2 and Nginx configs are heavily tied to VM/IaaS deployments (like EC2).

## 7. Detailed Option Comparison
### Option 1: Full AWS Deployment
- **Architecture diagram**: `Internet -> Nginx (EC2) -> PM2 Next.js (EC2) -> PostgreSQL (EC2 -> RDS)`
- **Components retained**: Next.js monolithic app, Prisma
- **Components migrated**: Hosting moves entirely to AWS EC2
- **Files already supporting**: `ecosystem.config.js`, `docs/aws-*`
- **Missing repository files**: AWS CloudFormation/Terraform (if IaC desired), final S3 integration
- **Required application changes**: None
- **Required infrastructure changes**: Provision EC2, configure Nginx and PM2
- **Required database changes**: Provision RDS (Option B) or local PostgreSQL (Option A)
- **Required storage changes**: Provision S3 (Deferred to Phase 20)
- **Required monitoring changes**: None (handled by custom UI)
- **Required security changes**: AWS Security Groups, IAM roles
- **Required backup and rollback changes**: RDS snapshots / EC2 AMIs
- **Required CI/CD changes**: None (manual/scripted deployment initially)
- **Production access eventually required**: AWS Console, SSH to EC2, Database Admin
- **Credentials eventually required**: `DATABASE_URL`, `NEXTAUTH_SECRET`, PayMongo keys
- **Estimated complexity**: MEDIUM
- **Migration/downtime risk**: LOW (Greenfield deployment)
- **Vendor-lock-in impact**: LOW (Standard Linux VM + standard PostgreSQL)
- **Operational-maintenance impact**: HIGH (Requires OS patching, Nginx maintenance)
- **Compatibility with Vercel**: Not applicable (replaces Vercel)
- **Compatibility with Prisma/PostgreSQL**: Full compatibility
- **Compatibility with PHASE19 no-go boundary**: Preserved
- **Requirements affected**: P19B-003 to P19B-008
- **Requirements completable locally**: P19B-006 (Documented)
- **Requirements blocked**: P19B-003, 004, 005, 007, 008

## 8. Requirement-Impact Matrix
- **Option 1 (AWS)** unblocks P19B-003, 004, 005, 007, 008 by establishing AWS as the authoritative target for firewall, backup, secret, and monitoring validation.

## 9. Security-Impact Matrix
- Option 1 preserves all application-level safeguards (PAYMENT_EMERGENCY_FREEZE, pilot limits, reconciliation safeguards). Network security shifts to AWS Security Groups and Nginx.

## 10. Migration-Impact Matrix
- Green-field deployment. DNS cutover is the only user-facing impact.

## 11. Production-Access Matrix
- Requires AWS administrator access to provision EC2, Security Groups, and RDS.

## 12. Safest Option
Option 1 (Full AWS Deployment) - Avoids distributed systems complexity by keeping the monolith intact.

## 13. Lowest-Change Option
Option 1 (Full AWS Deployment) - The repository is already configured with PM2 and Nginx for this exact target.

## 14. Best Long-Term Option
Option 1 (Full AWS Deployment - Option B with RDS and S3) - Offers scalability and managed database backups.

## 15. Recommended Option
Option 1 (Full AWS Deployment).

## 16. Exact Owner Decision Question
OWNER_DECISION_P19B_ARCHITECTURE
Which production architecture is authorized as the authoritative target for RENTipid PHASE19B?

## 17. Exact Owner Response Format
OWNER_DECISION_P19B_ARCHITECTURE:
[1] — Full AWS Deployment

Owner conditions:
- Production access authorized: NO
- Production deployment authorized: NO
- Production database change authorized: NO
- Credential access authorized: NO
- Live payment activation authorized: NO

## 18. Post-Decision Execution Boundary
This authorization permits:
- Local static validation of AWS configurations
- Local configuration validation
- Provider-specific readiness documentation
- Preparation of a later production-authorization gate

It prohibits:
- Provisioning cloud resources
- Production access or deployment
- Production database access
- Credential inspection
- Real-money processing

## 19. Stop Conditions
- Owner selects an unsupported option.
- Owner attempts to authorize production access in this gate.

## 20. Exact Next Gate After Owner Response
PHASE19B_ARCHITECTURE_OWNER_RESPONSE

## Owner Architecture Decision
- **Decision**: [1] — Full AWS Deployment
- **Architecture status**: AWS_AUTHORIZED_AS_TARGET
- **Decision date**: 2026-07-30
- **Owner conditions**:
  - **Production access authorized**: NO
  - **Production deployment authorized**: NO
  - **Production database changes authorized**: NO
  - **Credential access authorized**: NO
  - **Live-payment activation authorized**: NO
  - **Real-money execution authorized**: NO

This decision authorizes ONLY:
- AWS-specific local implementation preparation;
- correction or creation of permitted AWS infrastructure-as-code or configuration files;
- local static validation;
- local configuration validation;
- local documentation and runbook preparation;
- preparation of a later production-authorization gate.
