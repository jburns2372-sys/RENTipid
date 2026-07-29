# Final Go/No-Go Checklist

Only PHASE 17, PHASE 19, and PHASE 19B remain unfinished. All PHASE5 entries are completed, closed, frozen, and excluded.

## Verified Architecture

- [x] Public RENTipid Next.js frontend confirmed on Vercel.
- [x] Azure PostgreSQL `rentipid-postgres-db` confirmed Ready on PostgreSQL 15.
- [x] Logical database `rentipid_db` confirmed.
- [x] Azure Container Apps environment existence recorded.
- [x] No actual Azure Container App deployment recorded.
- [x] Direct Vercel-to-Azure PostgreSQL connection classified as not yet confirmed.
- [x] Neon active status classified as not confirmed.
- [x] Owner-provided Vercel Production/Preview variable names and scopes recorded.
- [x] Absence of a shown database connection or Azure backend URL recorded.
- [ ] Actual production database connection path manually confirmed without credential exposure.

Architecture status: `HYBRID_OR_UNRESOLVED`
PHASE 17 status: `BLOCKED_ARCHITECTURE_RESOLUTION`

## PHASE 19B - Infrastructure Readiness

- [ ] Review PostgreSQL firewall rules because public network access is enabled.
- [ ] Confirm the approved production execution path, connection limits, and pooling.
- [ ] Accept or remediate 7-day backup retention and disabled geo-backup; verify restore readiness.
- [ ] Review Key Vault access policies; preserve soft delete.
- [ ] Inventory test and Prisma shadow databases under `REVIEW_REQUIRED_DO_NOT_DELETE`.
- [ ] Confirm Vercel and Azure monitoring and alert routing.
- [ ] Restrict live PayMongo secrets to Production under normal policy.
- [ ] Configure Preview with sandbox credentials and non-live settings.

## PHASE 17 - Read-Only Integrity Audit

- [ ] Manual architecture-resolution requirement completed.
- [ ] Owner, DBA, and Security Administrator authorization recorded.
- [ ] Firewall review and approved audit network path completed.
- [ ] Restore readiness accepted.
- [ ] Dedicated, expiring read-only role provisioned for `rentipid_db`.
- [ ] Credential delivered through `kv-rentipid-prod` or approved secure local injection as `PHASE17_READONLY_DATABASE_URL`.
- [ ] Effective read-only grants verified and all mutation authority denied.
- [ ] Authorized integrity audit completed.
- [ ] Credential revoked and sanitized revocation evidence retained.

## PHASE 19 - Live Payment Pilot

- [ ] PHASE 17 and PHASE 19B accepted.
- [ ] Preview live-secret scope risk remediated.
- [ ] Production payment configuration approved without value exposure.
- [ ] Pilot user, transaction-count, budget, webhook, reconciliation, freeze, and refund controls accepted.

## Final Decision

- [ ] GO decision recorded only after every applicable gate is accepted.
- [ ] No frozen PHASE5 work reopened or processed.
