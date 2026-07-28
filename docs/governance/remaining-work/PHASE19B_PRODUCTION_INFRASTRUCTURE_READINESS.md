# PHASE 19B — Production Infrastructure Readiness

## Target Architecture Clarification
* **Approved Target Architecture**: Next.js deployed on Vercel, Serverless Postgres on Neon, Payments via PayMongo.
* **AWS Clarification**: Original historical reports referenced AWS deployment. The architecture has evolved to a modern Vercel/Neon serverless stack. Infrastructure readiness checks are performed against Vercel and Neon, not AWS EC2/ECS.

## Readiness Scope
* **Production Infrastructure Readiness**: Vercel production project must be initialized and linked to the repository.
* **Cloud Deployment Readiness**: GitHub integration with Vercel must be active and protected. Production domain must be verified.
* **Secrets and Identity Configuration**: All production environment variables (e.g., `DATABASE_URL`, `NEXTAUTH_SECRET`, `PAYMONGO_SECRET_KEY`) must be securely injected via the Vercel dashboard. Local `.env` files must remain strictly isolated.
* **Database Connectivity**: Neon PostgreSQL production branch must be configured with a connection pooler (e.g., PgBouncer) to handle serverless connection limits.
* **Monitoring and Alerting**: Vercel Web Analytics and Speed Insights must be enabled. Neon monitoring active.
* **Backups and Disaster Recovery**: Neon Point-in-Time Recovery (PITR) must be confirmed active with at least a 7-day retention window.
* **Application Deployment**: CI/CD pipeline on the `main` branch must trigger production builds successfully.
* **Post-Deployment Smoke Tests**: Automated synthetic requests against the live domain to verify routing, NextAuth, and API health, executed without real-money transactions.
* **Admin and Emergency-Freeze Validation**: Production Admin UI must be successfully accessed by an owner-level account. Emergency Freeze mechanism must be manually verified to toggle application state correctly in the production database.
* **Controlled Payment-Pilot Dependencies**: The infrastructure must be fully stable and signed off before `PHASE 19` live pilot can commence.
