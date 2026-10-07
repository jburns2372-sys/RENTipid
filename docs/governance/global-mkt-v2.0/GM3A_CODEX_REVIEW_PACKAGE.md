# RENTipid GLOBAL-MKT / v2.0 — GM-3A Independent Technical Review Package

**Audience:** Codex GPT-5.6 Sol / Independent Technical Audit  
**Workstream:** RENTipid GLOBAL-MKT / v2.0 — Global Marketplace Activation  
**Module:** GM-3A — Global Trust, Identity, KYC + Provider Verification Framework  
**Application Commit:** `b1a7a6c8f1edb476a4edd8411a4903f385dc7be8`  
**Working Worktree Policy:** READ-ONLY for Codex (No edits, no commits to `feat/global-mkt-v2.0`)  
**Status:** IMPLEMENTED & LOCALLY ACCEPTED  

---

## 1. Scope & Objective

GM-3A establishes the shared global trust and verification architecture for RENTipid, connecting to GM-1 (Jurisdiction Capability Framework) and GM-2 (Global Account & Onboarding Model). It resolves the identity, KYC, and document verification policy for all 46 authoritative jurisdictions without regional forks.

---

## 2. Key Architecture & Design Decisions

### 2.1 Domain Separation
Identity is decoupled into 8 distinct verification domains:
- `AUTHENTICATION`: Session & credential validity
- `CONTACT_VERIFICATION`: E.164 phone & email confirmation
- `IDENTITY_VERIFICATION`: Natural person legal identity
- `KYC_DUE_DILIGENCE`: Anti-money laundering & regulatory due diligence
- `BUSINESS_VERIFICATION`: Corporate entity registration & authorized representative checks
- `PROVIDER_ELIGIBILITY`: Marketplace provider capability clearance
- `MARKETPLACE_ROLE`: Operational assignment (`RENTER`, `PROVIDER`, or dual)
- `MARKET_CAPABILITY`: Jurisdiction-level activation status

### 2.2 Controlled State Machine (14 States)
`NOT_REQUIRED`, `NOT_STARTED`, `REQUIRED`, `IN_PROGRESS`, `DOCUMENTS_REQUIRED`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `EXPIRED`, `SUSPENDED`, `BLOCKED`, `PROVIDER_NOT_CONFIGURED`, `VALIDATION_REQUIRED`.
- State transitions are strictly guarded by `canTransitionVerificationState()`.
- Client self-approval is blocked at the domain boundary: transitions to privileged states (`APPROVED`, `SUSPENDED`, `BLOCKED`) mandate authorized reviewer credentials (`ADMIN`, `COMPLIANCE_ADMIN`, `SUPER_ADMIN`).

### 2.3 Provider Abstraction & Classification
- `ManualInternalKycAdapter`: Implements `IKycProviderAdapter` for RENTipid's existing administrative review workflow.
- External Vendors (`STRIPE_IDENTITY`, `VERIFF`, `PERSONA`, `SUMSUB`): Stubs are strictly classified as `NOT_CONFIGURED` (0 active external providers).

### 2.4 Server-Authoritative Publication Trust Gate
`canPublishAsProviderWithTrust(userContext, jurisdiction, businessVerificationState)`:
1. Rejects unauthenticated or suspended accounts.
2. Validates target jurisdiction against GM-1 (fails closed on unknown or invalid countries).
3. Verifies account possesses `PROVIDER` marketplace role.
4. Requires `providerOnboardingState === 'APPROVED'`.
5. Requires `kycState === 'KYC_APPROVED'` where mandatory in the jurisdiction.
6. For business providers, requires `businessVerificationState === 'APPROVED'`.

---

## 3. Files Implemented & Modified

### Runtime & Domain Source:
- `src/lib/global-market/trust/contracts/verification-domain.ts`: 8 distinct verification domains.
- `src/lib/global-market/trust/contracts/verification-state.ts`: 14 verification states and transition rules.
- `src/lib/global-market/trust/contracts/document-requirement.ts`: 9 document requirement categories.
- `src/lib/global-market/trust/contracts/trust-profile.ts`: `GlobalTrustProfile`, `SubjectType` (`INDIVIDUAL`, `BUSINESS`).
- `src/lib/global-market/trust/contracts/jurisdiction-kyc-profile.ts`: `JurisdictionKycProfile`.
- `src/lib/global-market/trust/contracts/index.ts`: Contracts barrel export.
- `src/lib/global-market/trust/adapters/kyc-provider-adapter.interface.ts`: Universal provider-neutral interface.
- `src/lib/global-market/trust/adapters/manual-internal-adapter.ts`: Concrete manual review adapter.
- `src/lib/global-market/trust/adapters/external-provider-stubs.ts`: Unconfigured external provider stubs.
- `src/lib/global-market/trust/adapters/index.ts`: Adapters barrel export.
- `src/lib/global-market/trust/registry/jurisdiction-kyc-registry.ts`: Authoritative 46-country conservative KYC registry.
- `src/lib/global-market/trust/services/trust-service.ts`: Domain service with trust gates and review functions.
- `src/lib/global-market/trust/index.ts`: Trust domain barrel export.
- `src/lib/global-market/index.ts`: Root re-export.

### Tests & Verification Runners:
- `tests/unit/global-market/trust-kyc-verification.test.ts`: 26 Jest unit tests.
- `scripts/run-gm3a-tests.ts`: 12 targeted automated verification checks.

---

## 4. Verification Evidence

- **TypeScript Typecheck (`npm run typecheck`)**: PASS (0 errors)
- **Production Build (`next build --webpack`)**: PASS (0 errors, 76 routes compiled)
- **Unit Tests (`tests/unit/global-market/`)**: 76/76 PASS across GM-1, GM-2, and GM-3A
- **GM-3A Targeted Runner (`scripts/run-gm3a-tests.ts`)**: 12/12 PASS
- **GM-1 & GM-2 Regressions**: 100% PASS

---

## 5. Security & Safety Checklist

- [x] Client cannot self-approve KYC or provider authorization.
- [x] Client cannot assign `reviewAuthority` or forge `verifiedAt`.
- [x] Unknown countries fail closed (`allowed: false`).
- [x] Zero markets commercially activated (`commerciallyActive: 0`).
- [x] 2 China deferred blockers preserved.
- [x] Database schema changed: NO.
- [x] Production database modified: NO.
