# Deployment Validation Checklist (Phase 10 Beta)

This document is to be executed by the DevOps/Super Admin team immediately prior to allowing any external traffic.

## Core Application
- [ ] `npm run build` completed successfully without warnings.
- [ ] Next.js server starts in production mode without panics.
- [ ] Session storage and JWT secrets are injected correctly.

## Infrastructure & Environment
- [ ] Database is connected and migrations applied (`npx prisma migrate deploy` in PG).
- [ ] Storage service is configured (S3/R2/Supabase) and public read buckets are accessible.
- [ ] Domain SSL is active.

## Safety Lock Configuration (Crucial)
- [ ] **Real Payments:** DISABLED. (Mock Gateway Active)
- [ ] **Real Social Posting:** DISABLED. (Mock Adapters Active)
- [ ] **AI Guardrails:** ACTIVE (Max Level 3). 
- [ ] **Registration:** INVITE ONLY mode enabled in Beta Controls.

## Role-Based Access
- [ ] Admin / Super Admin routes return 403/401 for unauthorized users.
- [ ] Super Admin has verified their password.
- [ ] Seed test accounts are tagged with `is_test_data = true`.

*Signed off by: ________________________*
