# MOD-MKT-01 — Listings Management

## BASELINE
MODULE: MOD-MKT-01 — Listings Management
CLASSIFICATION: CLASS A (Promoted from CLASS C via restored local backend defect fix)
RISK TIER: TIER 1 — CORE MARKETPLACE
DEPENDENCIES: MOD-FND-01 (Auth), MOD-FND-02 (RBAC), MOD-FND-03 (Address)
DEPENDENTS: MOD-MKT-02 (Search/Discovery), MOD-FIN-01 (Pricing/Payments)
CURRENT BASELINE: de1bf40

## LISTING SUBFEATURES
- Listing Creation Wizard (UI state management across multiple steps)
- Pricing Config (Hourly, Daily, Weekly, Monthly + Deposit/Replacement Value)
- Location binding (City, Province, Country)
- Draft/Publish status transitions
- Provider restriction (Only verified Individual/Business Providers can create)

## ROUTES
- UI: `/dashboard/provider/listings`
- UI: `/dashboard/provider/listings/new`
- UI: `/listing/[id]` (Public view)

## APIs
- `POST /api/listings` (Restored Vercel fallback for local execution)
- `GET /api/listings`

## DATABASE MODELS
- `Listing`
- `ListingPhoto`
- `ListingDocument`
- `Category`

## LISTING STATUS VALUES
- `Draft`
- `Published`
- `Pending` (implied by future moderation hooks)
- `Archived` (implied by transitions)

## TESTS
- Reused evidence from End-to-End phase tests.
- Re-verified via `scratch/test-marketplace-flow.js` runtime script.

## EXISTING EVIDENCE
- Prior phase closure documents
- E2E Test execution (Phase 1 Baseline)

## GATE STATUS

[x] CODE COMPLETE
[x] LOCAL FUNCTIONAL
[x] LOCAL DATABASE MIGRATED
[x] LOCAL REQUIRED DATA SEEDED/SYNCED
[x] LOCAL MODULE ACCEPTANCE

## DEFECTS
1. **Defect**: The local `POST /api/listings` was stubbed with a 410 Deprecated response in favor of Azure Backend. However, `api-client.ts` was designed to fall back to the Vercel API locally if `NEXT_PUBLIC_USE_AZURE_BACKEND` was disabled. The deletion of the Vercel API blocked local functional acceptance.
   **Fix**: Restored the original Vercel Next.js route logic in `src/app/api/listings/route.ts` to allow local execution without hitting a production Azure backend.

## EVIDENCE GAPS
None. Addressed via active verification and test script execution proving the local flow now works as intended.

## CURRENT GATE
LOCAL MODULE ACCEPTANCE

## NEXT PERMITTED GATE
FREEZE LOCAL MODULE BASELINE

## RECONCILIATION RESULT
LOCAL STATUS: PASS — LOCALLY ACCEPTED
LOCAL FREEZE: ACTIVE PENDING FULL-APP ACCEPTANCE
