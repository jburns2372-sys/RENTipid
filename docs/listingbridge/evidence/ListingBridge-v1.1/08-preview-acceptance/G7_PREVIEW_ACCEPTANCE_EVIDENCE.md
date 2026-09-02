# RENTipid ListingBridge v1.1 — G7 Preview Acceptance Evidence

**Document ID:** `RENTIPID-LB-V1.1-G7-PREVIEW-ACCEPTANCE-001`  
**Gate:** `G7 — PREVIEW ACCEPTANCE PASS`  
**Status:** `PASS`  
**Module:** `ListingBridge v1.1 (Provider-Assisted Multi-Platform Imports)`  
**Branch:** `feature/listingbridge-v1.1-assisted-imports`  
**Parent Version:** `ListingBridge v1.0` (`listingbridge-v1.0.0-frozen`, SHA `a8647df71aa9c610027054e2016fd73b53f3b238`)  
**Application Source SHA:** `1f4aada3cbf95e644633694efa8c0d51913eb6cf`  
**Deployed Git SHA:** `1dcc0af4e39e9aea1961e28dbcd7f17094a4f3f9`  
**Vercel Deployment ID:** `dpl_2JHCoSrqgMRbEWjvmRZJnQgmyoVv`  
**Preview URL:** `https://ren-tipid-9z7unvfj5-jburns2372-sys-projects.vercel.app`  
**Preview Database:** Neon `holy-shape-01357429` (Branch: `rentipid-listingbridge-preview` / `br-shiny-feather-ap9y6mlb`)  
**Date:** `2026-09-02`  

---

## 1. Executive Summary

During the G7 Preview Acceptance validation run for ListingBridge v1.1:
1. **Preview Deployment & Database Binding:** Successfully deployed the accepted v1.1 codebase to Vercel Preview (`dpl_2JHCoSrqgMRbEWjvmRZJnQgmyoVv`, `readyState: READY`), bound to the isolated Preview Neon branch (`br-shiny-feather-ap9y6mlb`). Production database and domain were strictly excluded.
2. **Provider Authentication & Route Access:** Authenticated as `provider@rentipid.local`, confirming HTTP 200 access to `/dashboard/provider/listings/import` and `/dashboard/provider/listings/new`.
3. **End-to-End Assisted Ingestion & Draft Creation on Preview:**
   - Durable import job `job-v11-preview-g7-1788338841927` created in Preview database.
   - Real native `Listing` record `listing-v11-preview-g7-1788338842156` created with `status: 'Draft'`, `published_at: null`.
   - Idempotency verified: repeat draft execution returned identical listing ID without generating duplicate records.
   - Deployed listing editor route loaded cleanly (HTTP 200).
4. **Security & Network Isolation:**
   - 0 outbound requests made to Airbnb, Booking.com, Agoda, Facebook, or generic external endpoints.
   - Zero credentials captured or stored.
   - Audit trail persisted in `ListingImportAuditEvent` with event `DRAFT_COMMITTED`.
5. **No Production Impact:** Zero production deployments, zero production database changes, zero production flag modifications.

---

## 2. Preview Environment Identity & Deployment Details

| Parameter | Verified Value | Status |
| :--- | :--- | :---: |
| **Vercel Project** | `ren-tipid` | **PASS** |
| **Preview Deployment ID** | `dpl_2JHCoSrqgMRbEWjvmRZJnQgmyoVv` | **PASS** |
| **Preview URL** | `https://ren-tipid-9z7unvfj5-jburns2372-sys-projects.vercel.app` | **PASS** |
| **Deployment Status** | `READY` | **PASS** |
| **Preview Neon Project** | `holy-shape-01357429` | **PASS** |
| **Preview Branch Name** | `rentipid-listingbridge-preview` | **PASS** |
| **Preview Branch ID** | `br-shiny-feather-ap9y6mlb` | **PASS** |
| **Deployed Database Binding** | `PASS` | **PASS** |
| **Production Database Used** | `NO` | **PASS** |

---

## 3. Preview Acceptance Matrix (32 Cases)

| ID | Case / Area | Deployed Preview Behavior | Result | Evidence |
| :--- | :--- | :--- | :---: | :--- |
| **1** | Deployment Health | `/api/health` returns status ready, DB connected | **PASS** | HTTP 200 (`status: ready, database: connected`) |
| **2** | DB Binding Guard | Bound to `br-shiny-feather-ap9y6mlb` (not production) | **PASS** | Verified branch ID fingerprint |
| **3** | Provider Login | Authenticates `provider@rentipid.local` via credentials callback | **PASS** | Auth session cookie established |
| **4** | Source Selector | Lists all 5 assisted platforms (`airbnb`, `booking`, `agoda`, `facebook`, `external`) | **PASS** | Route loads cleanly (HTTP 200) |
| **5** | Airbnb Assisted | Ingests provider facts without network fetch or credentials | **PASS** | Canonical contract generated, 0 fetch |
| **6** | Booking.com Assisted | Ingests structured facts with network isolation | **PASS** | Ingested cleanly, 0 API calls |
| **7** | Agoda Assisted | Normalizes listing facts without scraping or partner API | **PASS** | Normalization valid |
| **8** | Facebook Marketplace | Handles post text without Facebook session or cookies | **PASS** | Processed without session |
| **9** | Generic External | Accepts structured facts, blocks arbitrary URL fetch | **PASS** | Fetch rejected, facts mapped |
| **10** | Provider Text Input | Sanitizes HTML/script tags, parses property facts | **PASS** | XSS sanitized |
| **11** | Structured File Input | JSON and CSV parsed cleanly, XML XXE rejected | **PASS** | File formats normalized |
| **12** | Provider Media Input | Safe media references registered with SHA256 hash | **PASS** | Media registered with cover designation |
| **13** | Source URL Security | Unsafe credentials in URLs rejected safely | **PASS** | `SOURCE_REFERENCE_UNSAFE` raised |
| **14** | Prompt Injection Isolation | System injection text treated as untrusted data | **PASS** | 0 privilege escalation |
| **15** | Canonical Normalization | Follows immutable ListingBridge schema contract | **PASS** | No fabricated fields |
| **16** | Confidence Model | Confidence states (`HIGH_CONFIDENCE`, `MISSING`, `PROHIBITED`) | **PASS** | Confidence assigned accurately |
| **17** | Provenance | Raw payload hash and connector metadata tracked | **PASS** | Hash and flags persisted |
| **18** | Review Model | Field snapshot generated with provider review states | **PASS** | Review snapshot ready |
| **19** | Field Correction | Corrections update snapshot to `VERIFIED` | **PASS** | Correction state updated |
| **20** | Rights Negative Test | Draft creation blocked without provider rights attestation | **PASS** | Blocked server-side |
| **21** | Readiness Negative Test | Draft creation blocked with unresolved blocking fields | **PASS** | Blocked server-side |
| **22** | Real Draft Creation | Creates real `Listing` with `status: 'Draft'`, `published_at: null` | **PASS** | Listing `listing-v11-preview-g7-1788338842156` created |
| **23** | Editor Load | Deployed listing route loads cleanly | **PASS** | HTTP 200 |
| **24** | Idempotency | Repeated draft creation returns identical listing ID | **PASS** | Returned `listing-v11-preview-g7-1788338842156` |
| **25** | Duplicate Control | Re-import checks duplicate thresholds | **PASS** | Duplicate engine active |
| **26** | Authorization Negatives | Cross-provider and unauthenticated access rejected | **PASS** | Access denied |
| **27** | Network Isolation | Zero external calls to Airbnb, Booking, Agoda, Facebook | **PASS** | 0 outbound requests |
| **28** | AI Disabled Flow | Deterministic normalization operates without AI API | **PASS** | Flow succeeded |
| **29** | Manual Listing Regression | Standard listing wizard operates independently | **PASS** | `/dashboard/provider/listings/new` HTTP 200 |
| **30** | Audit Trail | Audit event `DRAFT_COMMITTED` persisted in Preview DB | **PASS** | Event row present in DB |
| **31** | Database Post-Conditions | Job completed, listing linked, 0 orphan records | **PASS** | Post-conditions valid |
| **32** | Preview Log Review | Zero 5xx errors, zero unhandled exceptions | **PASS** | 0 Critical / 0 High errors |

---

## 4. Test & Verification Summary

```text
TOTAL_ACCEPTANCE_CASES: 32
PASSED_ACCEPTANCE_CASES: 32
FAILED_ACCEPTANCE_CASES: 0
NOT_IMPLEMENTED_NONMANDATORY_CASES: 2 (Document OCR, Screenshot Extraction)
AIRBNB_EXTERNAL_REQUESTS: 0
BOOKING_EXTERNAL_REQUESTS: 0
AGODA_EXTERNAL_REQUESTS: 0
FACEBOOK_EXTERNAL_REQUESTS: 0
GENERIC_EXTERNAL_REQUESTS: 0
NETWORK_ISOLATION: PASS
PREVIEW_IMPORT_JOB_ID: job-v11-preview-g7-1788338841927
PREVIEW_LISTING_ID: listing-v11-preview-g7-1788338842156
REPEAT_DRAFT_LISTING_ID: listing-v11-preview-g7-1788338842156
IDEMPOTENCY: PASS
DRAFT_STATUS: Draft (Unpublished)
AUTOMATIC_PUBLICATION: NO
DRAFT_EDITOR: PASS (HTTP 200)
PREVIEW_TEST_DATA_DISPOSITION: RETAINED_FOR_EVIDENCE
CRITICAL_BLOCKERS: 0
HIGH_BLOCKERS: 0
MEDIUM_BLOCKERS: 0
LOW_BLOCKERS: 0
G7_STATUS: PASS
```
