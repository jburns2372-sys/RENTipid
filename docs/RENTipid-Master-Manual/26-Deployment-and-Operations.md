# Chapter 26 — Deployment, Operations, and Maintenance

## 26.1 Deployment Architecture

RENTipid is designed to be deployed across a hybrid cloud infrastructure:
- **Frontend / API Layer:** Deployed to edge-optimized platforms (e.g., Vercel) for rapid auto-scaling and low-latency delivery.
- **Database Layer:** Hosted on managed PostgreSQL instances (e.g., AWS RDS or Neon).
- **Blob Storage:** AWS S3 for scalable document and photo storage.

## 26.2 Deployment Pipelines

Deployments are managed via GitOps principles:
1. **Pull Requests:** Trigger automated Playwright and Jest test suites.
2. **Merging to `main`:** Triggers a production build.
3. **Database Migrations:** Executed as part of the build step (`prisma migrate deploy`). *Note: Strict database guards prevent destructive migrations from running in the production environment without manual override.*

## 26.3 Operations and Maintenance

### 26.3.1 Routine Maintenance
- **Database Backups:** Automated daily snapshots of the PostgreSQL instance.
- **Log Rotation:** Application logs and SOC telemetry are archived to cold storage after 90 days.

### 26.3.2 Emergency Rollbacks
If a critical defect reaches production, operators deploy a hotfix or roll back to the previous stable commit. If the defect involves financial escrow logic, the Super Admin must immediately execute the `EMERGENCY_FREEZE` playbook via the SOC dashboard before initiating the rollback.

## 26.4 Live Payment Readiness

**CRITICAL LIMITATION:** The platform is currently configured strictly for `MOCK_OR_SIMULATION_ONLY` financial operations. Transitioning to `PRODUCTION_ACTIVE` requires:
1. Passing Gate 10 (Final Acceptance Package).
2. Updating `PAYMONGO_SECRET_KEY` in the production environment.
3. Disabling the `ENABLE_MOCK_ESCROW` feature flag.

## Evidence References

| Evidence ID | Repository Path | Symbol, Model, Route, Test, or Report | Relevance | Verification Status |
| ----------- | --------------- | ------------------------------------- | --------- | ------------------- |
| REPO-001 | `.env.example` | Env Vars | Deployment Config | Verified |
| REPO-007 | `docs/` | Deployment Readiness Reports | Launch protocols | Verified |

## Related Chapters
- Chapter 20: Technical Architecture
- Chapter 24: Configuration and Environment
