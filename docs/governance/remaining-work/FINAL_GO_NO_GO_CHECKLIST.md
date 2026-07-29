# Final Go/No-Go Checklist

Only PHASE 17, PHASE 19, and PHASE 19B remain unfinished. All PHASE5 entries are completed, closed, frozen, and excluded.

## Architecture Resolution

- [x] Public frontend confirmed on Vercel.
- [x] Azure PostgreSQL server `rentipid-postgres-db` confirmed Ready on PostgreSQL 15.
- [x] Logical database `rentipid_db` confirmed.
- [x] Azure Container App deployment confirmed absent.
- [x] Repository direct Prisma execution path documented.
- [x] Neon classified as not active in the confirmed production inventory.
- [ ] Vercel production-scope `DATABASE_URL` presence confirmed through sanitized metadata.
- [ ] Production `DATABASE_URL` confirmed to select `rentipid-postgres-db` / `rentipid_db` without revealing its value.
- [ ] Vercel System Environment Variables setting confirmed.

Architecture status: `HYBRID_OR_UNRESOLVED`
PHASE 17 status: `BLOCKED_ARCHITECTURE_RESOLUTION`

## PHASE 19B — Infrastructure Readiness

- [ ] Treat Vercel Next.js as the only confirmed backend execution host; do not represent a separate Azure backend as deployed.
- [ ] Review PostgreSQL public network access and firewall rules.
- [ ] Confirm connection limits and pooling for Vercel server execution.
- [ ] Accept or remediate 7-day backup retention and disabled geo-redundant backup.
- [ ] Confirm a usable restore point and restoration procedure.
- [ ] Confirm Key Vault purge protection and review access-policy authorization.
- [ ] Review test and migration-shadow databases under `REVIEW_REQUIRED_DO_NOT_DELETE`.
- [ ] Confirm Vercel and Azure monitoring and alert routing.

## PHASE 17 — Read-Only Integrity Audit

- [ ] Architecture resolution gate completed.
- [ ] Owner, DBA, and Security Administrator authorization recorded.
- [ ] Approved network path and firewall rules confirmed.
- [ ] Dedicated, expiring read-only role provisioned for `rentipid_db`.
- [ ] Credential delivered through `kv-rentipid-prod` or approved secure local injection as `PHASE17_READONLY_DATABASE_URL`.
- [ ] Effective `CONNECT`, schema `USAGE`, and required `SELECT` grants verified.
- [ ] Mutation, ownership, role-administration, replication, and DDL permissions denied.
- [ ] Integrity checks completed with zero unauthorized mutations.
- [ ] Credential revoked and sanitized revocation evidence retained.

## PHASE 19 — Live Payment Pilot

- [ ] PHASE 19B and PHASE 17 accepted.
- [ ] PayMongo merchant account approved for live mode.
- [ ] Live credentials and webhook configuration approved without value exposure.
- [ ] Pilot user, transaction-count, and budget controls authorized.
- [ ] Payment, webhook, reconciliation, emergency-freeze, and refund evidence accepted.

## Decision

- [ ] GO decision recorded only after all applicable gates are accepted.
- [ ] No frozen PHASE5 work reopened or processed.
