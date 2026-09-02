# RENTipid ListingBridge v1.1 — G2 Local Functional Evidence

**Document ID:** `RENTIPID-LB-V1.1-G2-LOCAL-FUNCTIONAL-001`  
**Gate:** `G2 — LOCAL FUNCTIONAL`  
**Status:** `PASS`  
**Module:** `ListingBridge v1.1 (Provider-Assisted Multi-Platform Imports)`  
**Branch:** `feature/listingbridge-v1.1-assisted-imports`  
**Parent Version:** `ListingBridge v1.0` (`listingbridge-v1.0.0-frozen`, SHA `a8647df71aa9c610027054e2016fd73b53f3b238`)  
**Application Release SHA:** `1f4aada3cbf95e644633694efa8c0d51913eb6cf`  
**Date:** `2026-09-02`  

---

## 1. Executive Summary

During the G2 Local Functional validation run for ListingBridge v1.1:
1. **Local Runtime Execution:** Next.js local development server (`http://localhost:3000`) compiled and served routes cleanly with HTTP 200 for `/` and `/login`, with unauthenticated requests to `/dashboard/provider/listings/import` and `/dashboard/provider/listings/new` returning proper HTTP 307 redirects to login.
2. **Assisted Source Connectors:** All 5 provider-assisted connectors (`airbnb.assisted.v1`, `booking.com.assisted.v1`, `agoda.assisted.v1`, `facebook.marketplace.assisted.v1`, `external.listing.assisted.v1`) were verified locally in isolation.
3. **Input Modality Support:** Provider pasted text, structured JSON/CSV files, and provider media reference inputs execute correctly. Unimplemented modalities (document OCR, screenshot extraction) remain absent/disabled from user interfaces.
4. **Network Isolation:** 0 external requests made to Airbnb, Booking.com, Agoda, Facebook, or generic external endpoints during ingestion.
5. **Durable Draft Creation & Idempotency:** End-to-end execution demonstrated that reviewed canonical import payloads successfully persist real `Listing` records with `status: 'Draft'`, and repeated execution on the same import job returns the identical `Listing.id` without generating duplicate database records.
6. **Server Rights Enforcement:** Draft creation is strictly blocked by the server readiness engine when provider rights confirmation is omitted or incomplete.
7. **Regression Invariance:** Manual listing creation via `/dashboard/provider/listings/new` and AI-disabled deterministic normalization paths continue to operate completely independently without regressions.

---

## 2. Local Environment & Test Matrix

| Environment Parameter | Verified Value |
| :--- | :--- |
| **Local URL** | `http://localhost:3000` |
| **Local Database** | PostgreSQL (`localhost:5432/rentipid_test_soc`) |
| **Database Guard Target** | `LOCALHOST / rentipid_test_soc` (`LOCAL_ISOLATED_TEST_TARGET_ACCEPTED`) |
| **Prisma Tables Count** | 137 tables (6 ListingBridge foundation tables present) |
| **ListingBridge Test Suite** | 34 test suites, 233 tests PASS (`tests/listingbridge`) |

---

## 3. Detailed Verification Results

| Capability / Workflow | Target / Connector | Result | Evidence / Details |
| :--- | :--- | :---: | :--- |
| **Source Selector** | UI Connector Options | **PASS** | 5 assisted connectors exposed with `retrievalMode: ASSISTED` |
| **Airbnb Assisted** | `airbnb.assisted.v1` | **PASS** | Canonical mapping, provenance hash, 0 network fetch |
| **Booking.com Assisted** | `booking.com.assisted.v1` | **PASS** | Structured facts mapped, network fetch rejected |
| **Agoda Assisted** | `agoda.assisted.v1` | **PASS** | Structured facts normalized, 0 credentials captured |
| **Facebook Marketplace** | `facebook.marketplace.assisted.v1` | **PASS** | Marketplace text processed without Facebook session/scraping |
| **Generic Other Platform** | `external.listing.assisted.v1` | **PASS** | Arbitrary URL fetch blocked, custom facts mapped |
| **Provider Text Input** | `PASTED_TEXT` | **PASS** | Text parsed into structured canonical fields |
| **Structured File Input** | `STRUCTURED_FILE` | **PASS** | JSON and CSV payloads normalized into canonical contract |
| **Provider Media Input** | `MEDIA` | **PASS** | Media assets mapped with primary cover designation |
| **Document Input** | `DOCUMENT` | `NOT_IMPLEMENTED` | Cleanly omitted from UI controls |
| **Screenshot Input** | `SCREENSHOT` | `NOT_IMPLEMENTED` | Cleanly omitted from UI controls |
| **Network Isolation** | Runtime Boundary | **PASS** | 0 external requests to OTA domains |
| **Server Rights Enforcement** | Draft Readiness Engine | **PASS** | Blocked draft creation when rights unconfirmed |
| **Real Draft Creation** | `createDraftFromImport` | **PASS** | Real `Listing` created in database with `status: 'Draft'` |
| **Idempotency** | Duplicate Draft Request | **PASS** | Returned same `Listing.id` (`isReusedIdempotently: true`) |
| **Manual Listing Flow** | `/dashboard/provider/listings/new` | **PASS** | Standard wizard creates manual listing independently |
| **AI Disabled Core Flow** | Deterministic Normalization | **PASS** | Operates cleanly without external AI API dependencies |
| **Authorization / Tenant Isolation** | Role & Ownership Guards | **PASS** | Unauthenticated requests redirected/blocked (HTTP 307) |

---

## 4. Network Isolation Proof

```text
AIRBNB_EXTERNAL_REQUESTS: 0
BOOKING_EXTERNAL_REQUESTS: 0
AGODA_EXTERNAL_REQUESTS: 0
FACEBOOK_EXTERNAL_REQUESTS: 0
GENERIC_EXTERNAL_FETCH: 0
NETWORK_ISOLATION_STATUS: PASS
```

---

## 5. Errors and Blockers

- **New Critical Errors:** 0
- **New High Errors:** 0
- **Medium Blockers:** 0
- **Low Blockers:** 0
- **G2 Status:** `PASS`
