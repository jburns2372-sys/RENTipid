# CODEX DAY 1 HANDOFF — INSURANCE TECHNICAL FOUNDATION

## 1. Git Baseline
6f55296cdf1ff2bda3c550448fc307f264f1f397 (Feature: soc-phase4-threat-response)

## 2. Authoritative Registry Paths
- `docs/RENTipid-Master/`
- `docs/insurance/implementation/R1-requirements.md` through `R15-change-control.md`

## 3. Exact First Coding Slice
**INSURANCE TECHNICAL FOUNDATION**
Scope limited to:
- Normalized insurance types/contracts
- PartnerAdapter interface
- PartnerAdapterRegistry
- Deterministic MockInsuranceAdapter
- Insurance domain skeleton
- Schema/data-model implementation for core models
- Focused foundation tests

## 4. Files to Create
- `src/lib/insurance/types.ts`
- `src/lib/insurance/PartnerAdapter.ts`
- `src/lib/insurance/PartnerAdapterRegistry.ts`
- `src/lib/insurance/adapters/MockInsuranceAdapter.ts`
- `tests/insurance/foundation.spec.ts`

## 5. Files to Modify
- `prisma/schema.prisma` (to append new models)

## 6. Files/Directories NOT to Inspect Again
- `src/app/api/auth/*`
- `src/app/api/soc/*`
- `src/lib/security/*`
- Legacy test files or unrelated module foundations.

## 7. Proposed Prisma Models
- `InsurancePartner`
- `InsuranceProduct`
- `InsuranceOffer`
- `InsurancePolicy`
- `InsuranceClaim`
- `InsuranceWebhookEvent`

## 8. Migration Scope
Create a single Prisma migration file containing the structural definitions for the proposed models above. Do not include checkout or UI integrations.

## 9. Normalized TypeScript Contracts
- `InsuranceEligibilityRequest`
- `InsuranceOfferResponse`
- `InsuranceOrderRequest`
- `InsurancePolicyResponse`
- `InsuranceClaimRequest`

## 10. PartnerAdapter Interface
Must implement: `checkEligibility`, `getOffers`, `createOrder`, `getPolicy`, `cancelPolicy`, `createClaim`, `getClaim`, `verifyWebhook`, `reconcile`, `getCapabilities`, `healthCheck`.

## 11. PartnerAdapterRegistry
Registry to register and resolve the correct adapter at runtime (e.g., `Mock`, `Igloo`, `Etiqa`).

## 12. MockInsuranceAdapter
Deterministic implementation returning predictable mock data for all capabilities without external network calls.

## 13. Feature Flag / Kill-Switch Requirements
- `NEXT_PUBLIC_FEATURE_INSURANCE` (boolean)
- Global kill-switch in database/config.

## 14. Initial API Skeleton
- Stub routes that return 501 Not Implemented or correctly interface with the MockAdapter.

## 15. Audit Requirements
- All state changes (Order -> Policy -> Cancelled) must generate an audit/security event trace.

## 16. Focused Tests
- Compile/Type check
- MockAdapter determinism
- Registry resolution
- Prisma model validation

## 17. Validation Commands
- `npx prisma generate`
- `npx tsc --noEmit`
- `npx jest tests/insurance/foundation.spec.ts`

## 18. Stop Conditions
- Stop immediately after completing this foundational slice and passing local tests. Do not proceed to UI, webhooks, or live integration.

## 19. Blockers
- None for this technical foundation slice.

## 20. Next Mandatory Promotion Gate
**CODE COMPLETE (SLICE 1)**
