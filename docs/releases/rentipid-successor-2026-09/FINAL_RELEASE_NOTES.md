# RENTipid — Final Release Notes

**Release Name:** RENTipid Successor Production Release (September 2026)  
**Version Tag:** `rentipid-successor-2026-09-v1.0.0-frozen`  
**Production Runtime SHA:** `d84854264447b7e2c5f521ebf88da31d22d7c066`  
**Production Deployment ID:** `dpl_6CAZBAdohAhBJKhBvaNs26AHfzgW`  
**Release Date:** September 16, 2026  

---

## 1. Overview & Key Highlights

This successor release establishes a hardened, unified, production-grade baseline for RENTipid. It consolidates major platform capabilities across core rentals, secure authentication, Unified AI & customer support, compliance policy enforcement, SOC security operations, and media storage while retiring decommissioned legacy modules.

### Key Highlights:
1. **Unified AI Customer Service Intelligence:**
   - Active intent discovery and suggestions (`/api/ai/suggestions`).
   - Grounded RAG knowledge citations and policy guidance.
   - Fail-closed security boundaries enforcing strict guest isolation from internal bots.
   - Comprehensive prohibited items enforcement (e.g. strict blockage of firearms inquiries).

2. **Compliance & Prohibited Items Enforcement:**
   - Active enforcement of all 25 prohibited item policies (`PI-001` to `PI-025`).
   - Integrated with listing review, moderation, appeals, and live AI advisory.

3. **Strategic Manual Listing Consolidation:**
   - Focus 100% of listing creation on the native manual listing flow (`/dashboard/provider/listings/new`).
   - ListingBridge retired per Owner decision; import route safely redirects providers. Active platform connectors set to 0.

4. **Security & SOC Hardening:**
   - Full RBAC protection enforced across renter, provider, business, and administrative portals via Next.js proxy middleware.
   - Multi-factor authentication (MFA) and session registry with remote logout.
   - Zero plaintext secrets in version control and client bundles.

5. **Infrastructure & Data Parity:**
   - Clean 63-migration reproducible schema chain.
   - Dual production domain routing (`www.rentipid.com.ph` and `rentipid.com.ph`).
   - Zero pending, failed, or divergent migrations on live databases.

---

## 2. Functional Domains Included

- **Core Marketplace:** Browse, Search, Listing Details, Booking Lifecycle, Reviews.
- **Provider Experience:** Manual Listing Creation, Photo Uploads, Listing Management, Turnovers.
- **Renter Experience:** Booking Requests, Move-in/Return Inspection, Dispute Claims.
- **Identity & Access:** Email/Password, Google OAuth, MFA Challenge/Enroll, Session Registry.
- **Finance & Payouts:** Deposits, Platform Fees, Refund Processing, Payout Statements.
- **Unified AI Support:** Concierge Bot, Contextual Help, Intent Discovery, Proactive Mediation.
- **Security Operations (SOC):** Playbooks, Behavioral Risk Tracking, Security Auditing, UAT Sandbox.
- **Legal & Compliance:** Global Terms, Privacy Policies, 25 Prohibited Policy Articles, Data Subject Requests.

---

## 3. Known Limitations

- **PWA Scope:** PWA Manifest and mobile install surfaces are supported; offline service worker caching is outside the accepted production scope.
- **ListingBridge:** Permanently retired; active connectors = 0.
