# RENTipid — Version Freeze Manifest (Gate 13)

**Release Baseline:** RENTipid Successor Production Release (September 2026)  
**Immutable Release Tag:** `rentipid-successor-2026-09-v1.0.0-frozen`  
**Accepted Production Runtime SHA:** `d84854264447b7e2c5f521ebf88da31d22d7c066`  
**Production Deployment ID:** `dpl_6CAZBAdohAhBJKhBvaNs26AHfzgW`  
**Production Canonical URL:** `https://www.rentipid.com.ph`  
**Production Apex URL:** `https://rentipid.com.ph`  
**Frozen Status:** PERMANENTLY FROZEN  
**Date of Freeze:** September 16, 2026  

---

## 1. Release Manifest Specification

- **Application Runtime SHA:** `d84854264447b7e2c5f521ebf88da31d22d7c066`
- **Release Tag Resolution:** Resolves to exact commit `d84854264447b7e2c5f521ebf88da31d22d7c066`
- **Prisma Version:** `6.19.3`
- **Next.js Version:** `16.2.12`
- **React Version:** `19.2.4`
- **Schema Migration Head:** `20260908000000_add_canonical_question_intent`
- **Total Applied Migrations:** 63 migrations (0 pending, 0 failed, 0 divergent)
- **Installation Baseline:** `CURRENT_RENTIPID_FUNCTIONAL_MODULE_CENSUS.json` (330 app routes, 148 Prisma models)
- **Feature Flag Posture:**
  - `LISTINGBRIDGE_GLOBAL`: `false` (Permanently Retired)
  - Active Connectors: `0`
  - Manual Listing Creation: `ACTIVE` (`/dashboard/provider/listings/new`)
- **Compliance & Reference Data Posture:**
  - 25 Prohibited and Restricted Item Policies (`PI-001` through `PI-025`) active
- **Unified AI Posture:**
  - RAG engine, intent discovery (`/api/ai/suggestions`), concierge bot active
  - Guest isolation from internal bots strictly enforced fail-closed
- **Accepted PWA Scope:**
  - Manifest and install surfaces present; offline service-worker caching is outside accepted production scope
- **Media & Storage Posture:**
  - Vercel Blob persistent storage configured and operational
- **Security & SOC Posture:**
  - `src/proxy.ts` fail-closed route authentication, MFA support, incident playbooks active
- **Rollback Reference:**
  - Deployment `dpl_A2gAH3ZHDtW6Gbo2479ToqbLhQsu` (SHA `d19f0cb63391a652f9a9a4fb22d9688ffac753b0`)
- **Owner Acceptance Evidence:**
  - Text: `ACCEPT PRODUCTION` logged at September 16, 2026, 12:49:50+08:00

---

## 2. Reopening Governance Rule

> [!IMPORTANT]
> **THIS RELEASE IS FROZEN.**
> Any future modification to:
> - source code
> - schema definitions
> - database migrations
> - seed or reference data
> - knowledge bases
> - runtime configuration
> - feature flags
> - legal or compliance policies
> - payments or financial logic
> - security controls
> - storage behavior
> - accepted runtime functionality
>
> **REQUIRES A NEW CONTROLLED SUCCESSOR REVISION / CHANGE REQUEST.**
>
> Under no circumstances may this accepted frozen release be amended in place. Any future work must proceed through a new promotion cycle, reopening only from the earliest invalidated gate.
