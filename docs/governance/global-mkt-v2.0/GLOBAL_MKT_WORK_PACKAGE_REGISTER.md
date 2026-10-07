# RENTipid GLOBAL-MKT / v2.0 — Work Package Register

## 1. Master Phased Program Overview

This register defines the 20 structured work packages comprising the **RENTipid GLOBAL-MKT / v2.0** master implementation program. Each package is bound to the Universal Promotion Pipeline and establishes explicit entry criteria, exit criteria, database implications, and Project Owner approval gates.

---

## 2. Phased Work Package Specifications

### GM-0: Architecture Baseline, Global Marketplace Gap Audit & Master Plan Kickoff
- **Objective:** Establish the governance, architectural blueprint, 46-country gap audit, and phased master implementation plan.
- **Entry Criteria:** Frozen GLCC-JX v1.2 release verified intact at commit \`9c69fd0128b0f9ef6a2e933d8a6636403a300bf6\`.
- **Implementation Scope:** Governance, gap analysis, and planning documentation only. Zero runtime source or database changes.
- **Test Scope:** Read-only inspection of live production deployment \`dpl_BLvC4y4i21giKNGBoLJszoRNxEQ6\`, schema inspection, coupling scans.
- **Exit Criteria:** All 12 GM-0 governance deliverables approved and committed.
- **Project Owner Gate:** Formal Project Owner review and approval of Master Plan.
- **App Source Changes:** **NO** | **DB Changes:** **NO** | **External Provider Approval:** **NO**

---

### GM-1: Global Jurisdiction & Capability Framework
- **Objective:** Implement the central \`JurisdictionPolicyEngine\`, \`JurisdictionProfile\` data structures, and the authoritative \`MarketCapabilityRegistry\`.
- **Entry Criteria:** GM-0 approved by Project Owner.
- **Implementation Scope:** \`src/lib/global-mkt/jurisdiction/\`, \`src/lib/global-mkt/policy/\`, \`src/lib/global-mkt/capabilities/\`.
- **Test Scope:** Unit tests verifying declarative policy resolution for all 46 countries without scattered \`if (country === 'PH')\` conditionals.
- **Exit Criteria:** Capability registry operational and reporting status across all 46 markets.
- **Project Owner Gate:** Engineering Lead verification.
- **App Source Changes:** **YES** | **DB Changes:** **NO** | **External Provider Approval:** **NO**

---

### GM-2: Global Account & Renter/Provider Onboarding
- **Objective:** Enable unified global accounts supporting renters and providers across multiple jurisdictions with international phone/identity normalization.
- **Entry Criteria:** GM-1 PASS.
- **Implementation Scope:** E.164 phone parser integration, user operational jurisdiction profile binding, multi-country provider eligibility checks.
- **Test Scope:** Cross-country account creation, role switching, and session management.
- **Exit Criteria:** International accounts successfully onboarded under local jurisdiction profiles.
- **Project Owner Gate:** Engineering Lead verification.
- **App Source Changes:** **YES** | **DB Changes:** **MINIMAL (Additive profile fields)** | **External Provider Approval:** **NO**

---

### GM-3: Global KYC Abstraction Engine
- **Objective:** Implement the provider-neutral \`GlobalKycProvider\` interface, jurisdiction-specific document profiles, and automated verification adapters.
- **Entry Criteria:** GM-2 PASS.
- **Implementation Scope:** Pluggable KYC adapter contracts, document profile schemas, and mock/sandbox verification adapters (Persona/Veriff model).
- **Test Scope:** Automated and manual review workflows for diverse international identity documents.
- **Exit Criteria:** Verification pipeline decoupled from Philippine-only ID types.
- **Project Owner Gate:** Legal/Compliance Officer approval.
- **App Source Changes:** **YES** | **DB Changes:** **YES (Additive verification fields)** | **External Provider Approval:** **YES (KYC Sandbox)**

---

### GM-4: Global Address, Location & Listing Architecture
- **Objective:** Decouple address models from Philippine PSGC and implement multi-currency rate storage and localized geographic hierarchies on listings.
- **Entry Criteria:** GM-1 & GM-3 PASS.
- **Implementation Scope:** \`Listing\` model migration adding explicit \`currency\` and integer minor units; \`JurisdictionAddressProfile\` with global geocoding adapters.
- **Test Scope:** Listing creation, publication, and address validation across diverse national formats (US, TH, JP, GB, EU).
- **Exit Criteria:** Providers in any registered country can publish listings in authorized local currencies.
- **Project Owner Gate:** Engineering Lead & Database Safety verification.
- **App Source Changes:** **YES** | **DB Changes:** **YES (Additive, Non-destructive)** | **External Provider Approval:** **NO**

---

### GM-5: Global Search & Discovery Engine
- **Objective:** Upgrade marketplace discovery to support location-aware radius searches, cross-border filtering, and multi-currency price presentation.
- **Entry Criteria:** GM-4 PASS.
- **Implementation Scope:** Search query refactoring, coordinate normalization, and localized currency presentation overlays.
- **Test Scope:** Geographic radius discovery, keyword search, and category filtering across domestic and international listings.
- **Exit Criteria:** Search returns accurate local listings with proper localized price quoting.
- **Project Owner Gate:** Product Lead verification.
- **App Source Changes:** **YES** | **DB Changes:** **NO** | **External Provider Approval:** **NO**

---

### GM-6: Global Booking & Rental Lifecycle Engine
- **Objective:** Implement multi-currency booking records, jurisdiction duration rules, turnover inspection, and localized rental agreements.
- **Entry Criteria:** GM-4 & GM-5 PASS.
- **Implementation Scope:** Add explicit \`currency\` to \`Booking\` table; implement jurisdiction-aware rental duration, agreement templates, and safety checklists.
- **Test Scope:** Full booking reservation, approval, turnover inspection, and return lifecycle.
- **Exit Criteria:** End-to-end rental lifecycle executes cleanly under local jurisdiction rules.
- **Project Owner Gate:** Operations Lead verification.
- **App Source Changes:** **YES** | **DB Changes:** **YES (Additive, Non-destructive)** | **External Provider Approval:** **NO**

---

### GM-7: Global Communications Core
- **Objective:** Decouple transactional messaging, email, SMS, and WhatsApp alerts from Philippine carrier conventions.
- **Entry Criteria:** GM-2 & GM-6 PASS.
- **Implementation Scope:** Provider-neutral notification engine, international Twilio route optimization, and localized message templates.
- **Test Scope:** Real-time in-app chat and delivery of transactional notices to international numbers.
- **Exit Criteria:** 100% of transactional notices localized and delivered without carrier rejections.
- **Project Owner Gate:** Engineering Lead verification.
- **App Source Changes:** **YES** | **DB Changes:** **NO** | **External Provider Approval:** **YES (Twilio Messaging)**

---

### GM-8: Global Payment Orchestration
- **Objective:** Build the provider-neutral \`GlobalPaymentOrchestrator\`, multi-gateway routing, multi-currency collection, and webhook normalization.
- **Entry Criteria:** GM-6 PASS.
- **Implementation Scope:** \`PaymentProvider\` interface; refactor PayMongo as one concrete adapter; add multi-gateway sandbox adapters (Stripe, PromptPay, Alipay).
- **Test Scope:** Multi-currency checkout, webhook idempotency, and automated payment reconciliation.
- **Exit Criteria:** Renters can pay in approved domestic currencies via local payment methods.
- **Project Owner Gate:** Finance Lead & Legal Officer approval.
- **App Source Changes:** **YES** | **DB Changes:** **YES (Additive)** | **External Provider Approval:** **YES (PSP Sandbox)**

---

### GM-9: Global Payout & Settlement Orchestration
- **Objective:** Implement automated provider payout orchestration supporting domestic and cross-border settlement rails.
- **Entry Criteria:** GM-8 PASS.
- **Implementation Scope:** \`PayoutProvider\` interface, beneficiary account profiles, settlement currency policies, and automated payout execution rails.
- **Test Scope:** Provider payout calculation, commission deduction, batch generation, and webhook settlement confirmation.
- **Exit Criteria:** Automated provider payout pipeline operational and reconciled.
- **Project Owner Gate:** Finance Lead approval.
- **App Source Changes:** **YES** | **DB Changes:** **YES (Additive)** | **External Provider Approval:** **YES (Payout Rail Sandbox)**

---

### GM-10: Global Deposits, Cancellations, Refunds, Claims, Disputes & Reviews
- **Objective:** Unify security deposit escrow holding, automated refund execution, damage claim arbitration, and review moderation.
- **Entry Criteria:** GM-8 & GM-9 PASS.
- **Implementation Scope:** Pre-authorized deposit holds, automated gateway refunds, dispute evidence submission, and content moderation overlays.
- **Test Scope:** Cancellation refund workflows, security deposit forfeiture, and dispute resolution.
- **Exit Criteria:** Complete post-booking financial protection and dispute lifecycle verified.
- **Project Owner Gate:** Trust & Safety Lead approval.
- **App Source Changes:** **YES** | **DB Changes:** **NO** | **External Provider Approval:** **NO**

---

### GM-11: Global Tax, Invoicing & Restricted-Category Compliance Engine
- **Objective:** Deploy provider-neutral tax calculation, jurisdiction invoicing (VAT/GST/Sales Tax), and restricted category enforcement.
- **Entry Criteria:** GM-8 & GM-10 PASS.
- **Implementation Scope:** \`JurisdictionTaxProfile\`, localized tax invoice generator, and category permission flags (\`ALLOWED\`, \`PROHIBITED\`, \`PERMIT_REQUIRED\`).
- **Test Scope:** Tax calculation accuracy, invoice generation, and listing block enforcement on restricted items.
- **Exit Criteria:** Jurisdictional tax and category rules enforced automatically across all markets.
- **Project Owner Gate:** Legal/Compliance Officer approval.
- **App Source Changes:** **YES** | **DB Changes:** **NO** | **External Provider Approval:** **NO**

---

### GM-12: 46-Country Configuration & Provider Mapping Baseline
- **Objective:** Map all 46 registered countries to their active provider profiles, tax policies, and regulatory boundaries.
- **Entry Criteria:** GM-1 through GM-11 PASS.
- **Implementation Scope:** Configuration catalog mapping all 46 countries in the capability registry.
- **Test Scope:** Automated verification that all 46 countries load valid configuration profiles without runtime exceptions.
- **Exit Criteria:** 100% of registered jurisdictions configured under the unified framework.
- **Project Owner Gate:** Architecture Review Board.
- **App Source Changes:** **YES (Configuration/Data)** | **DB Changes:** **NO** | **External Provider Approval:** **NO**

---

### GM-13: Local Integrated Global Marketplace Acceptance
- **Objective:** Execute full local end-to-end multi-market functional test suite across the 13 core lifecycle capabilities.
- **Entry Criteria:** GM-12 PASS.
- **Implementation Scope:** Comprehensive local test automation suite verifying happy paths and edge cases across representative market batches.
- **Test Scope:** Complete renter-to-provider rental cycles in multi-currency local environments.
- **Exit Criteria:** 100% test pass rate with zero regressions.
- **Project Owner Gate:** Project Owner Local Acceptance.
- **App Source Changes:** **NO** | **DB Changes:** **NO** | **External Provider Approval:** **NO**

---

### GM-14: Controlled Preview Activation by Approved Market Batch
- **Objective:** Deploy candidate to Vercel Preview and activate the first approved batch of international jurisdictions.
- **Entry Criteria:** GM-13 PASS.
- **Implementation Scope:** Vercel Preview deployment, preview database synchronization, and environment variable configuration.
- **Test Scope:** Preview deployment verification, health checks, and initial batch smoke tests.
- **Exit Criteria:** Preview environment healthy and running the validated global marketplace build.
- **Project Owner Gate:** Deployment Authorization.
- **App Source Changes:** **NO** | **DB Changes:** **YES (Preview DB Migration)** | **External Provider Approval:** **NO**

---

### GM-15: Preview Market Functional Acceptance
- **Objective:** Perform end-to-end acceptance testing on deployed Vercel Preview across active market batches.
- **Entry Criteria:** GM-14 PASS.
- **Implementation Scope:** Testing actual deployed preview URLs without local developer session dependencies.
- **Test Scope:** All 13 capabilities verified in preview across active regional markets.
- **Exit Criteria:** Zero blocking defects in Preview; full audit evidence recorded.
- **Project Owner Gate:** Preview Promotion Sign-Off.
- **App Source Changes:** **NO** | **DB Changes:** **NO** | **External Provider Approval:** **NO**

---

### GM-16: Production Readiness & Safety Audit
- **Objective:** Execute final source-delta audit, database migration safety review, and rollback contingency verification.
- **Entry Criteria:** GM-15 PASS.
- **Implementation Scope:** Production readiness manifest, rollback script validation, and zero-drift verification.
- **Test Scope:** Static analysis, dependency audits, security scans, and database safety checks.
- **Exit Criteria:** Production readiness manifest approved and signed off.
- **Project Owner Gate:** Formal Production Authorization.
- **App Source Changes:** **NO** | **DB Changes:** **NO** | **External Provider Approval:** **NO**

---

### GM-17: Controlled Production Market Activation
- **Objective:** Deploy candidate to Production (\`https://www.rentipid.com.ph\`) and activate initial approved commercial market batch.
- **Entry Criteria:** GM-16 PASS.
- **Implementation Scope:** Controlled Vercel production deployment, non-destructive schema migration, and alias verification.
- **Test Scope:** Production health checks, auth/RBAC validation, and live payment/payout smoke validation.
- **Exit Criteria:** Production live and verified with active market batch.
- **Project Owner Gate:** Production Activation Sign-Off.
- **App Source Changes:** **NO** | **DB Changes:** **YES (Production DB Migration)** | **External Provider Approval:** **YES (Live PSP/Payout Rails)**

---

### GM-18: Per-Jurisdiction Owner Final Acceptance
- **Objective:** Present formal per-country operational evidence to the Project Owner for commercial activation approval.
- **Entry Criteria:** GM-17 PASS.
- **Implementation Scope:** Governance acceptance artifacts detailing all 13 verified capabilities per jurisdiction.
- **Test Scope:** Live verification of real renter and provider journeys in approved markets.
- **Exit Criteria:** Explicit Project Owner written acceptance per commercial market.
- **Project Owner Gate:** **PROJECT OWNER FINAL COMMERCIAL ACCEPTANCE**.
- **App Source Changes:** **NO** | **DB Changes:** **NO** | **External Provider Approval:** **NO**

---

### GM-19: Global Marketplace v2.0 Release Closure & Baseline Freeze
- **Objective:** Formally close the GLOBAL-MKT / v2.0 workstream, publish the release closure manifest, and create immutable freeze tags.
- **Entry Criteria:** GM-18 PASS.
- **Implementation Scope:** Release closure report, manifest, and immutable git freeze tags.
- **Test Scope:** Tag dereference verification and remote git push confirmation.
- **Exit Criteria:** Status declared **ACCEPTED — CLOSED — FROZEN**.
- **Project Owner Gate:** Final Workstream Closure Approval.
- **App Source Changes:** **NO** | **DB Changes:** **NO** | **External Provider Approval:** **NO**

---

### GM-MOBILE: Mobile Client & App Store Readiness Workstream
- **Objective:** Optimize PWA, Capacitor, and native mobile shells to consume the unified Global Marketplace APIs for future Google Play and Apple App Store submission.
- **Entry Criteria:** GM-8 & GM-13 in progress.
- **Implementation Scope:** Mobile viewport hardening, biometric auth, camera KYC document capture, push notification adapters.
- **Test Scope:** iOS and Android device testing across multiple regional profiles.
- **Exit Criteria:** Mobile apps validated against unified backend without per-country app forks.
- **Project Owner Gate:** Mobile Release Authorization.
- **App Source Changes:** **YES (Mobile components)** | **DB Changes:** **NO** | **External Provider Approval:** **YES (Apple/Google Developer Accounts)**
