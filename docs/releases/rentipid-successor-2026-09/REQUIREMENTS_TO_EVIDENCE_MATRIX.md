# RENTipid — Requirements to Evidence Traceability Matrix

**Release:** `rentipid-successor-2026-09-v1.0.0-frozen`  
**Production Runtime SHA:** `d84854264447b7e2c5f521ebf88da31d22d7c066`  
**Deployment:** `dpl_6CAZBAdohAhBJKhBvaNs26AHfzgW`  

---

## Traceability Matrix

| Requirement / Capability | Source / Specification Contract | Implementation / Interface | Verification Gate & Test Evidence | Status |
|---|---|---|---|---|
| **Health Check & DB Parity** | System Architecture | `/api/health` | G2, G5, G6, G7, G9 (`verify-production-deployment.ts`) | **VERIFIED PASS** |
| **Public Marketplace UI** | UX Core Specification | `/`, `/browse`, `/listing/[id]` | G2, G5, G7, G9 (HTTP 200, dynamic RSC rendering) | **VERIFIED PASS** |
| **Authentication & Sessions** | Security Policy | NextAuth credentials, `/api/auth/*` | G2, G5, G7 (CSRF, providers, session protection) | **VERIFIED PASS** |
| **RBAC Route Guard** | Security Standard | `src/proxy.ts` | G5, G7 (Unauthenticated /dashboard redirect to /login) | **VERIFIED PASS** |
| **25 Prohibited Policies** | Compliance Framework | `/prohibited-items`, Prisma policy model | G4, G5, G6, G7, G9 (PI-001 through PI-025 active) | **VERIFIED PASS** |
| **Unified AI Discovery** | Unified AI Spec | `/api/ai/suggestions` | G5, G6, G7, G9 (8+ canonical topics returned) | **VERIFIED PASS** |
| **AI Policy Enforcement** | Compliance & AI Integration | `/api/ai/chat` | G5, G7 (Condominiums allowed; firearms blocked) | **VERIFIED PASS** |
| **AI Fail-Closed Security** | AI Security Standard | `/api/ai/chat` (Guest -> support-agent) | G5, G7 (HTTP 200 with `isBlocked: true` / 403) | **VERIFIED PASS** |
| **Manual Listing Consolidation** | Product Owner Directive | `/dashboard/provider/listings/new` | G5, G7 (Complete provider workflow operational) | **VERIFIED PASS** |
| **ListingBridge Retirement** | ListingBridge Retirement Doc | `/dashboard/provider/listings/import` | G5, G6, G7 (HTTP 307 redirect; connector count = 0) | **VERIFIED PASS** |
| **PWA Mobile Surfaces** | PWA Baseline | `/manifest.json`, icon metadata | G5, G7 (Manifest JSON valid; install surface active) | **VERIFIED PASS** |
| **Production Domain Routing** | DevOps Architecture | Vercel Custom Domain Config | G9 (`probe-prod-domain.ts` -> www & apex 200 OK) | **VERIFIED PASS** |
| **Database Migration Integrity** | Prisma Migration Standard | 63 migrations, Neon PostgreSQL | G3, G6, G9 (0 pending, 0 divergent, 0 failed) | **VERIFIED PASS** |
| **Zero Plaintext Secrets** | SOC / SEC-01 Policy | Environment Variables, Git Auditing | G1-G10 (Strict secret masking, no secrets in repo) | **VERIFIED PASS** |
| **Owner Acceptance Decision** | Governance Promotion Pipeline | Owner Response: `ACCEPT PRODUCTION` | G11 (`G11_OWNER_ACCEPTANCE_RECORD.md`) | **VERIFIED PASS** |
