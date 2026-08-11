# PHASE19B AWS INFRASTRUCTURE PROVISIONING AUTHORIZATION BRIEF

## 1. Executive Summary
This report defines the minimum AWS infrastructure provisioning scope necessary to support the RENTipid "Full AWS Deployment" target architecture. Currently, no AWS infrastructure is provisioned. This document prepares the exact provisioning sequence, resource inventory, Owner input requirements, and safety boundaries for Owner review. No resources are provisioned by this brief; it solely serves as the authorization gate.

## 2. Repository, Branch, and HEAD
- **Repository**: C:\Users\user\Documents\JD SOFTWARE PROJECTS\RENTipid
- **Branch**: feature/soc-phase4-threat-response
- **HEAD**: 5804d4cceafc74e5e51b554be6f84a1b9c80e8be

## 3. Current PHASE19 and PHASE19B Status
- **PHASE19**: PHASE19_COMPLETE_NO_GO_FROZEN
- **P19B-002**: EXTERNALLY_BLOCKED_PENDING_AWS_INFRASTRUCTURE_PROVISIONING
- **P19B-009**: EXTERNALLY_BLOCKED_PENDING_AWS_INFRASTRUCTURE_PROVISIONING
- **AWS Infrastructure Exists**: NO
- **Current Gate**: PHASE19B_AWS_INFRASTRUCTURE_PROVISIONING_AUTHORIZATION_GATE

## 4. AWS Infrastructure Nonexistence Confirmation
- Confirmed by trusted administrator that AWS_REGION, EC2_INSTANCE_ID, RDS_INSTANCE_IDENTIFIER, and PUBLIC_APPLICATION_URL are NOT_YET_ASSIGNED/NOT_PROVISIONED/NOT_YET_DEPLOYED.

## 5. Repository-Evidence Registry
- `docs/aws-deployment-readiness-report.md`
- `docs/aws-deployment-rollback-plan.md`
- `docs/aws-rds-postgresql-readiness.md`
- `docs/aws-backup-and-restore-plan.md`
- `docs/aws-security-hardening-checklist.md`
- `docs/aws-production-env.md`
- `ecosystem.config.js`
- `next.config.ts`
- `docs/nginx-rentipid.conf`
- `.env.production.example`
- `package.json`
- `prisma/schema.prisma`

## 6. Minimum Deployable AWS Architecture
**Architecture Flow**:
Internet → Route 53 (External DNS) → AWS ALB / EC2 Elastic IP → Nginx (Reverse Proxy/TLS) → PM2 / Next.js (Application) → RDS PostgreSQL

- **Application Compute**: AWS EC2 instance.
- **Production PostgreSQL**: AWS RDS PostgreSQL.
- **Inbound HTTPS Path**: Nginx managing TLS.
- **Internal Application Port**: 3000 (managed by PM2/Nginx).
- **Process Manager**: PM2 (`ecosystem.config.js`).
- **Environment-Secret Injection**: Environment file placement or AWS Secrets Manager.
- **Deployment Method**: Direct code checkout or artifact upload to EC2.

## 7. Exact AWS Resource Inventory
| Resource ID | AWS Service | Exact Purpose | Repository Evidence | Required for Initial Deploy | Required for P19B-002 | Required for P19B-009 |
| --- | --- | --- | --- | --- | --- | --- |
| VPC | Amazon VPC | Network isolation | aws-deployment-readiness-report.md | YES | YES | YES |
| Public Subnets | Amazon VPC | ALB/EC2 ingress | aws-deployment-readiness-report.md | YES | NO | YES |
| Private Subnets | Amazon VPC | RDS isolation | aws-deployment-readiness-report.md | YES | YES | YES |
| Internet Gateway | Amazon VPC | Public routing | aws-deployment-readiness-report.md | YES | NO | YES |
| Security Groups | Amazon EC2 | Port 80/443 (EC2), 5432 (RDS) | aws-security-hardening-checklist.md | YES | YES | YES |
| EC2 Instance | Amazon EC2 | Run Next.js/PM2 | aws-deployment-readiness-report.md | YES | NO | YES |
| RDS Instance | Amazon RDS | Database storage | aws-rds-postgresql-readiness.md | YES | YES | YES |

## 8. Required Versus Optional Resource Matrix
- **Required**: VPC, Subnets, Internet Gateway, Security Groups, EC2 Instance, RDS PostgreSQL Instance.
- **Optional**: Application Load Balancer, AWS Secrets Manager, S3 object storage (unless Next.js image optimization requires it).
- **Unsupported (NOT_REQUIRED_BY_REPOSITORY_EVIDENCE)**: AWS Systems Manager, deployment artifact storage (if deploying from Git).

## 9. Owner-Input Registry
| Input Required | Value |
| --- | --- |
| Approved AWS Account | OWNER_INPUT_REQUIRED |
| Approved AWS Region | OWNER_INPUT_REQUIRED |
| Environment Name | production |
| Public Domain | OWNER_INPUT_REQUIRED |
| Infrastructure Budget | OWNER_INPUT_REQUIRED |
| AWS Administrator | OWNER_INPUT_REQUIRED |
| DNS Administrator | OWNER_INPUT_REQUIRED |
| EC2 Capacity | OWNER_INPUT_REQUIRED |
| RDS Capacity | OWNER_INPUT_REQUIRED |
| Availability Target | OWNER_INPUT_REQUIRED |
| Backup Retention | OWNER_INPUT_REQUIRED |
| Recovery Point Objective | OWNER_INPUT_REQUIRED |
| Recovery Time Objective | OWNER_INPUT_REQUIRED |
| Maintenance Window | OWNER_INPUT_REQUIRED |
| Deployment Window | OWNER_INPUT_REQUIRED |
| Permitted Downtime | OWNER_INPUT_REQUIRED |
| Security Approver | OWNER_INPUT_REQUIRED |
| Database Approver | OWNER_INPUT_REQUIRED |
| Final Provisioning Approver | OWNER_INPUT_REQUIRED |

## 10. Trusted-Administrator-Input Registry
- AWS IAM Access Keys or federated access credentials.
- Actual execution of provisioning templates (Terraform/CloudFormation) or manual console execution.

## 11. IAM and Credential-Name Registry
- **IAM eventually required**: `ec2:RunInstances`, `rds:CreateDBInstance`, `vpc:*`, `iam:PassRole`.
- **Credential Names Eventually Required**: `DATABASE_URL`, `NEXTAUTH_SECRET`, `PAYMONGO_SECRET_KEY_LIVE` (MUST BE DISABLED).

## 12. Network and Security Matrix
- **EC2 Security Group**: Inbound TCP 80, 443 from Internet. Outbound all.
- **RDS Security Group**: Inbound TCP 5432 from EC2 Security Group ONLY.

## 13. Database-Impact Matrix
- **1. Infrastructure provisioning**: Yes, creates empty RDS instance.
- **2. Network-path verification**: Separate authorized gate required.
- **3. Metadata verification**: Separate authorized gate required.
- **4. Connection testing**: Prohibited.
- **5. Backup verification**: Prohibited.
- **6. Migration-status inspection**: Separate gate required.
- **7. Migration execution**: Prohibited.
- **8. Data validation**: Prohibited.
- **9. Rollback**: Delete RDS instance.
- **Database Provisioning is separate from Migration Authorization.**

## 14. Backup and Recovery Matrix
- **RDS Backup Retention**: To be defined by Owner.
- **EC2 Backup**: AMI snapshots.

## 15. Monitoring Matrix
- CloudWatch Metrics (CPU, Memory, RDS connections, Disk I/O).

## 16. DNS and TLS Matrix
- Let's Encrypt / Certbot on EC2, or AWS ACM if using ALB.

## 17. Deployment Matrix
- **Method**: Clone repository to EC2 or copy build artifact, run `npm run build`, start with PM2 via `ecosystem.config.js`.

## 18. Cost-Driving Resource Matrix
- EC2 Instance (hourly cost depends on instance type).
- RDS Instance (hourly cost depends on class and storage).
- Data Transfer (Out).
- Elastic IP (if unattached).

## 19. Cost-Verification Status
- **Status**: CURRENT_AWS_COST_NOT_VERIFIED

## 20. Provisioning Phase Sequence
- **PHASE A**: ACCOUNT, REGION, BUDGET, AND IAM APPROVAL (Separate Owner authorization required: YES)
- **PHASE B**: NETWORK AND SECURITY FOUNDATION (Separate Owner authorization required: YES)
- **PHASE C**: DATABASE AND BACKUP FOUNDATION (Separate Owner authorization required: YES)
- **PHASE D**: COMPUTE, PROCESS MANAGER, AND REVERSE PROXY (Separate Owner authorization required: YES)
- **PHASE E**: DNS, TLS, HEALTH CHECKS, AND MONITORING (Separate Owner authorization required: YES)
- **PHASE F**: SECRET-NAME CONFIGURATION AND DEPLOYMENT PREPARATION (Separate Owner authorization required: YES)
- **PHASE G**: DATABASE MIGRATION AUTHORIZATION (Separate Owner authorization required: YES)
- **PHASE H**: APPLICATION DEPLOYMENT AUTHORIZATION (Separate Owner authorization required: YES)
- **PHASE I**: READ-ONLY PRODUCTION VERIFICATION (Separate Owner authorization required: YES)
- **PHASE J**: FINAL PHASE19B ACCEPTANCE AND CLOSURE (Separate Owner authorization required: YES)

## 21. Rollback Matrix
- **Procedure**: Terminate EC2, Delete RDS, Delete VPC.
- **Risk**: Financial cost of uptime before rollback.

## 22. Stop-Condition Matrix
- Exceeding approved budget.
- Missing required Owner inputs.
- Accidental exposure of live payments.

## 23. PHASE19 Payment No-Go Boundary
- Live payments disabled.
- `PAYMENT_EMERGENCY_FREEZE` active.
- Maximum five pilot transactions, PHP 100 max per transaction, PHP 500 aggregate max exposure.
- AWS infrastructure provisioning must NOT configure PayMongo live credentials, activate PayMongo, execute a real payment, or reopen PHASE19.

## 24. Owner Decision Options

**OPTION 1: DO NOT AUTHORIZE AWS PROVISIONING**
- No AWS resources created. Zero cost. P19B-002 and P19B-009 remain blocked.

**OPTION 2: AUTHORIZE DETAILED AWS PROVISIONING PLAN AND COST APPROVAL ONLY**
- Finalize exact AWS resource specifications and obtain unresolved Owner inputs (region, budget, capacity).
- No resource creation. No production deployment.

## 25. Safest Option
**OPTION 1** (DO NOT AUTHORIZE AWS PROVISIONING). Guarantees zero risk and zero cost.

## 26. Recommended Option
**OPTION 2** (AUTHORIZE DETAILED AWS PROVISIONING PLAN AND COST APPROVAL ONLY). Mandatory Owner inputs (budget, region, capacity) are currently missing. Provisioning cannot safely proceed until these are finalized.

## 27. Exact Owner Response Format
To proceed, the Owner must reply with:
`OWNER_DECISION_PHASE19B_AWS_PROVISIONING: [OPTION_NUMBER] — [EXACT OPTION NAME]`

**Required conditions if Option 2 is selected**:
- AWS account: `<OWNER_INPUT_REQUIRED>`
- AWS Region: `<OWNER_INPUT_REQUIRED>`
- Environment: production
- Public domain: `<OWNER_INPUT_REQUIRED>`
- Maximum monthly AWS budget: `<OWNER_INPUT_REQUIRED>`
- Production access authorized: NO
- Provisioning execution authorized: NO
- Database changes authorized: NO
- Credential-value access authorized: NO
- Deployment authorized: NO
- Live-payment activation authorized: NO

## 28. Exact Next Gate
- If Option 1: Gate terminates.
- If Option 2: `PHASE19B_AWS_INFRASTRUCTURE_PROVISIONING_OWNER_RESPONSE`
