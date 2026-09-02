# RENTipid ListingBridge v1.1 — G5 Local Acceptance Evidence

**Document ID:** `RENTIPID-LB-V1.1-G5-LOCAL-ACCEPTANCE-001`  
**Gate:** `G5 — LOCAL ACCEPTANCE PASS`  
**Status:** `PASS`  
**Module:** `ListingBridge v1.1 (Provider-Assisted Multi-Platform Imports)`  
**Branch:** `feature/listingbridge-v1.1-assisted-imports`  
**Parent Version:** `ListingBridge v1.0` (`listingbridge-v1.0.0-frozen`, SHA `a8647df71aa9c610027054e2016fd73b53f3b238`)  
**Application Source SHA:** `1f4aada3cbf95e644633694efa8c0d51913eb6cf`  
**Date:** `2026-09-02`  

---

## 1. Executive Summary

During the G5 Local Acceptance validation run for ListingBridge v1.1:
1. **Full Acceptance Matrix:** All 25 acceptance areas (A through Y) were evaluated with 25 passing mandatory acceptance cases, 0 failures, and 2 explicitly non-mandatory deferred modalities (`DOCUMENT_INPUT` and `SCREENSHOT_INPUT`) whose false UI controls remain completely absent.
2. **Provider Workflow & Assisted Ingestion:** Successfully validated the end-to-end provider workflow for all 5 assisted platforms (`airbnb.assisted.v1`, `booking.com.assisted.v1`, `agoda.assisted.v1`, `facebook.marketplace.assisted.v1`, `external.listing.assisted.v1`), processing provider pasted text, structured JSON/CSV files, and provider media uploads into the canonical ListingBridge contract.
3. **Security Invariants & Isolation:**
   - **Zero Network Fetch:** 0 outbound requests made to Airbnb, Booking.com, Agoda, Facebook, or generic external endpoints.
   - **Zero Credential Capture:** No passwords, partner API keys, session cookies, or OAuth secrets required or ingested.
   - **Injection Protection:** Prompt injection attempts and `<script>` XSS tags treated strictly as untrusted text without system instruction execution. XML XXE entity resolution strictly rejected.
4. **Server-Side Rights & Readiness Enforcement:** Draft creation is blocked server-side whenever provider rights confirmation is omitted, incomplete, or when blocking unresolved field conflicts exist.
5. **Real Draft Creation & Idempotency:** End-to-end execution created a real `Listing` with `status: 'Draft'`, `published_at: null`, and durable linkage to `ListingImportJob.created_listing_id`. Repeated draft requests return the exact same `Listing.id` without generating duplicate records.
6. **Regression Invariance:** Manual listing creation (`/dashboard/provider/listings/new`) and AI-disabled deterministic normalization continue to operate independently with zero regressions across the 35 ListingBridge test suites (253/253 tests passing).

---

## 2. Acceptance Matrix (25 Areas)

| ID | Acceptance Area | Test Case | Expected Behavior | Actual Behavior | Result |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **A.1** | Source Selection | Available assisted platform options | 5 assisted connectors exposed with `ASSISTED` mode & disclosure | 5 connectors listed, no false API claims | **PASS** |
| **B.1** | Airbnb Assisted | Provider text ingestion & normalization | Ingests facts, builds canonical contract, 0 network fetch | Ingested cleanly, SHA256 hashed | **PASS** |
| **C.1** | Booking.com Assisted | Provider text & pricing ingestion | Normalized into canonical contract without credentials | Normalized cleanly, 0 network fetch | **PASS** |
| **D.1** | Agoda Assisted | Structured fact mapping | Normalized into canonical contract without credentials | Normalized cleanly, 0 credentials | **PASS** |
| **E.1** | Facebook Marketplace | Post text extraction | Normalized without Facebook cookies or session token | Normalized cleanly, 0 FB session | **PASS** |
| **F.1** | Generic External | External platform ingestion | Accepts valid facts, rejects arbitrary URL fetching | Facts mapped, fetch rejected | **PASS** |
| **G.1** | Provider Text | Script tag & prompt injection safety | Strips XSS tags, treats prompt injection as untrusted text | Sanitized, 0 privilege escalation | **PASS** |
| **H.1** | Structured File | JSON, CSV & XML parsing | Parses JSON/CSV, rejects XML XXE injection | JSON/CSV parsed, XXE blocked | **PASS** |
| **I.1** | Provider Media | Media asset registration | Safe media registration with cover designation & SHA256 | Registered with hash & cover flag | **PASS** |
| **J.1** | Normalization | Canonical schema adherence | Adheres to contract, no fabricated facts | Canonical mapping valid | **PASS** |
| **K.1** | Confidence Model | Confidence state assignment | Assigns `HIGH_CONFIDENCE`, `MISSING`, `PROHIBITED` | Confidence assigned accurately | **PASS** |
| **L.1** | Provenance | Metadata & audit lineage | Tracks raw payload hash, source connector, and flags | Lineage recorded | **PASS** |
| **M.1** | Review & Correction | Provider field modification | Corrected value updates snapshot with `VERIFIED` state | Updated to `VERIFIED` | **PASS** |
| **N.1** | Rights Enforcement | Missing rights attestation | Server blocks draft creation when rights unconfirmed | Blocked (`RIGHTS_NOT_CONFIRMED`) | **PASS** |
| **O.1** | Duplicate Control | Duplicate detection invocation | Re-import checks duplicate thresholds | Duplicate check enforced | **PASS** |
| **P.1** | Idempotency | Repeated draft creation | Returns existing `Listing.id` without creating duplicates | Identical `Listing.id` returned | **PASS** |
| **Q.1** | Real Draft Creation | Native Draft persistence | Creates real `Listing` with `status: 'Draft'`, `published_at: null` | Real `Listing` created in DB | **PASS** |
| **R.1** | Authorization | Cross-provider draft attempt | Rejects access with `OWNERSHIP_MISMATCH` | Blocked with `OWNERSHIP_MISMATCH` | **PASS** |
| **S.1** | Network Isolation | Third-party endpoint isolation | 0 outbound HTTP requests across all 5 connectors | 0 outbound HTTP requests | **PASS** |
| **T.1** | Failure Handling | Malformed URLs & credentials in input | Safe failure without leaking secret tokens | Failed safely, 0 secret leak | **PASS** |
| **U.1** | AI Disabled | Deterministic fallback flow | Ingestion and normalization succeed without AI service | Deterministic flow succeeds | **PASS** |
| **V.1** | Manual Listing Regression | Standard manual listing flow | Manual wizard creates listing independently | Manual creation succeeds | **PASS** |
| **W.1** | Audit Logging | Audit trail persistence | Persists `ListingImportAuditEvent` without token exposure | Audit records created safely | **PASS** |
| **X.1** | UI/UX Disclosure | Document & Screenshot capability boundary | `DOCUMENT` & `SCREENSHOT` false options absent from UI | Not exposed in UI controls | **PASS** |
| **Y.1** | Database Post-Conditions | Relational integrity & draft count | Durable job linkage valid, exact 1 draft per job, 0 orphans | DB post-conditions verified | **PASS** |

---

## 3. Network Isolation & Security Proof

```text
AIRBNB_EXTERNAL_REQUESTS: 0
BOOKING_EXTERNAL_REQUESTS: 0
AGODA_EXTERNAL_REQUESTS: 0
FACEBOOK_EXTERNAL_REQUESTS: 0
GENERIC_EXTERNAL_REQUESTS: 0
NETWORK_ISOLATION_STATUS: PASS
```

---

## 4. Test & Verification Suite Summary

```text
LISTINGBRIDGE_TEST_SUITES: 35 passed, 35 total
LISTINGBRIDGE_TOTAL_TESTS: 253 passed, 253 total
TYPECHECK: PASS (0 errors)
TARGETED_LINT: PASS (0 errors, 0 warnings)
PRISMA_VALIDATE: PASS
DIFF_CHECK: PASS
```

---

## 5. Gate Metrics & Decision

```text
TOTAL_ACCEPTANCE_CASES: 25
PASSED_ACCEPTANCE_CASES: 25
FAILED_ACCEPTANCE_CASES: 0
NOT_IMPLEMENTED_NONMANDATORY_CASES: 2
CRITICAL_BLOCKERS: 0
HIGH_BLOCKERS: 0
MEDIUM_BLOCKERS: 0
LOW_BLOCKERS: 0
G5_DATA_DISPOSITION: CLEANED
G5_STATUS: PASS
```
