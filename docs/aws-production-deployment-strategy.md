# AWS Production Deployment Strategy

This document outlines the recommended deployment pathways for bringing RENTipid to production on AWS. It defines the phased approach to balance rapid deployment with long-term security, scaling, and data integrity.

## Option A: Initial Controlled Deployment (Recommended for Phase 19B Pilot)

For the initial, highly-controlled live payment pilot, a consolidated Virtual Private Server (VPS) is sufficient and easiest to manage.

**Architecture:**
- **Host:** AWS EC2 (t3.small/medium) or AWS Lightsail.
- **OS:** Ubuntu 22.04 LTS or newer.
- **Runtime:** Node.js processing requests via Next.js server.
- **Process Manager:** PM2 (to keep Node.js alive and handle restarts).
- **Reverse Proxy:** Nginx (handling port 80/443, SSL termination, and static asset caching).
- **Security:** Let's Encrypt / Certbot for HTTPS.
- **Database:** PostgreSQL installed locally on the same instance (or remote RDS if preferred immediately).
- **Storage:** Local disk for `public/uploads` and `private-uploads` (acceptable only because traffic is severely restricted during the pilot).

**Pros:** Fast setup, highly predictable environment, single instance to monitor.
**Cons:** Does not scale horizontally. If the instance fails, local uploads are lost without strict backup procedures.

## Option B: Hardened Production Deployment (Target for Post-Pilot)

Once the live payment pilot succeeds and RENTipid opens to unrestricted traffic, the architecture must transition to a fully decoupled, scalable environment.

**Architecture:**
- **Host:** AWS Elastic Container Service (ECS) or AWS App Runner.
- **Database:** Amazon Relational Database Service (RDS) for PostgreSQL (Multi-AZ for high availability).
- **Storage:** Amazon Simple Storage Service (S3) for all user uploads (public and private).
- **CDN:** Amazon CloudFront routing to S3 and caching API endpoints where applicable.
- **Secrets:** AWS Secrets Manager for injecting `.env` variables securely.
- **Logging:** Amazon CloudWatch for centralized application and webhook telemetry.
- **CI/CD:** Automated deployment pipelines (e.g., GitHub Actions to AWS ECR/ECS).

**Pros:** Horizontally scalable, highly available, secure separation of concerns.
**Cons:** Higher monthly infrastructure costs, complex initial configuration.

## Current Recommendation
**Proceed with Option A** for the Phase 19B Live Payment Pilot. Do not attempt Option B until the fundamental PayMongo webhook architecture is proven with real money. The transition to Option B is planned for Phase 20 (Full Production Launch).
