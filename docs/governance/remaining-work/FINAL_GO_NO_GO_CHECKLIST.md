# Final Go/No-Go Checklist

This checklist confirms readiness before authorizing the only unfinished phases: PHASE 17, PHASE 19, and PHASE 19B.

## Prerequisites (Mandatory)

- [ ] **Frozen security baseline acknowledged**: All PHASE5 phases remain closed and frozen; no reprocessing is authorized.
- [ ] **Testing baseline**: Test-suite evidence passes on an isolated non-production target. No production database is used for tests.
- [ ] **Owner authorization**: All stakeholders from the Authorization Matrix have provided sign-off for the specific production action.

## PHASE 19B — Infrastructure Readiness

- [ ] Existing Vercel production project, canonical domain, protected source integration, and successful runtime evidence confirmed.
- [ ] Azure PostgreSQL server resource `rentipid-postgres-db` and its logical production database/schema confirmed.
- [ ] Azure backend ownership resolved; any deployed Container App, ingress hostname, and healthy revision confirmed with sanitized evidence.
- [ ] Vercel-to-Azure routing configuration confirmed, including the required API-base variable if the Azure client is active.
- [ ] Vercel and `kv-rentipid-prod` configuration responsibilities and secret bindings confirmed without exposing values.
- [ ] Azure PostgreSQL network path, workload identity, connection limits/pooling, backups, and restore capability confirmed.
- [ ] Vercel and Azure monitoring/alert routing confirmed.
- [ ] Non-mutating production smoke test passes for the verified frontend and backend paths under separate authorization.

## PHASE 17 — Pre-Live Database Integrity Check

- [ ] Authoritative Azure PostgreSQL server resource `rentipid-postgres-db` confirmed.
- [ ] Logical production database, schema, and authorized network path confirmed by the DBA.
- [ ] Dedicated, expiring read-only production credential provisioned through an approved secret path.
- [ ] Read-only session enforcement and role grants confirmed from sanitized metadata evidence.
- [ ] Data-integrity scan executed under explicit owner authorization.
- [ ] No orphaned records detected.
- [ ] No financial discrepancies detected.
- [ ] No manual schema overrides detected.
- [ ] Integrity Check Report signed off by Security Lead and DBA.
- [ ] Credential revoked and revocation evidence recorded.

## PHASE 19 — Live Payment Pilot

- [ ] PHASE 19B and PHASE 17 accepted.
- [ ] PayMongo merchant account fully verified for live mode.
- [ ] Live API keys injected through the approved production secret path without exposure.
- [ ] Live webhook URLs registered and verified in the PayMongo dashboard.
- [ ] Pilot users whitelisted in the authoritative production database.
- [ ] Maximum five pilot transactions approved.
- [ ] Total pilot budget of PHP 500 or less approved.
- [ ] First live transaction successfully creates the required audit and gateway records.
- [ ] PayMongo webhook successfully received, signature-verified, and processed.
- [ ] Database state correctly updates the booking to paid.
- [ ] Admin emergency-freeze control verified under separate authorization.
- [ ] Post-pilot refund procedure executed and verified through the PayMongo dashboard.
- [ ] Final Financial Reconciliation Report generated.

## Final Owner Decision

- [ ] Go decision reached.
- [ ] All three remaining phases marked `COMPLETED` only after their acceptance evidence is approved.

