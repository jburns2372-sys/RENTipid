# Final Go/No-Go Checklist

This checklist confirms the readiness of the application before authorizing the execution of the final production phases (PHASE 17, PHASE 19, PHASE 19B).

## Pre-Requisites (Mandatory)
- [ ] **PHASE5 Validation Complete**: All Phase 5 security and cryptographic phases are strictly `CLOSED_AND_FROZEN` with no defects.
- [ ] **Testing Baseline**: Test suite passes successfully on localhost. Database guards verify local isolation.
- [ ] **Owner Authorization**: All stakeholders from the Authorization Matrix have provided sign-off.

## PHASE 19B — Infrastructure Deployment
- [ ] Vercel production project initialized.
- [ ] Neon Serverless PostgreSQL instance provisioned and connection pool active.
- [ ] Environment variables injected into Vercel securely (no exposure in code).
- [ ] CI/CD pipeline triggered and Next.js build succeeds on Vercel.
- [ ] Vercel Analytics and Neon PITR (Point-in-Time Recovery) enabled.
- [ ] Production Smoke Test passes (API health, routing, NextAuth functioning).

## PHASE 17 — Pre-Live Database Integrity Check
- [ ] Read-only production database credentials provisioned.
- [ ] Prisma connected via read-only constraints.
- [ ] Data integrity scan executed.
- [ ] No orphaned records detected.
- [ ] No financial discrepancies detected.
- [ ] No manual schema overrides detected.
- [ ] Integrity Check Report signed off by Security Lead and DBA.

## PHASE 19 — Live Payment Pilot
- [ ] PayMongo merchant account fully verified (Live Mode active).
- [ ] Live API keys generated and injected into Vercel.
- [ ] Live webhook URLs registered and verified in PayMongo dashboard.
- [ ] Pilot users whitelisted in production database.
- [ ] Maximum 5 pilot transactions approved.
- [ ] Total budget max 500 PHP approved.
- [ ] First live transaction successfully creates PaymentActionLog and GatewayTransaction.
- [ ] PayMongo webhook successfully received, verified by signature, and processed.
- [ ] Database state correctly updates booking to Paid.
- [ ] Admin UI Emergency Freeze verified.
- [ ] Post-pilot manual refund procedure executed and verified via PayMongo dashboard.
- [ ] Final Financial Reconciliation Report generated.

## Final Owner Decision
- [ ] Go Decision Reached.
- [ ] All remaining true phases marked as `COMPLETED`.
