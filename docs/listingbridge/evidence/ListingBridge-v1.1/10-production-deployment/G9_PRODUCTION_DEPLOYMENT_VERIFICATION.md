# RENTipid ListingBridge v1.1 — G9 Production Deployment Verification Evidence

**Document ID:** `RENTIPID-LB-V1.1-G9-PROD-VERIFICATION-001`  
**Gate:** `G9 — PRODUCTION DEPLOYMENT / VERIFICATION`  
**Status:** `PASS`  
**Module:** `ListingBridge v1.1 (Provider-Assisted Multi-Platform Imports)`  
**Release Candidate:** `ListingBridge v1.1 RC1`  
**Branch:** `feature/listingbridge-v1.1-assisted-imports`  
**Authoritative Application Source SHA:** `1f4aada3cbf95e644633694efa8c0d51913eb6cf`  
**RC Repository Head SHA:** `b2d2fc433c6218f2ceae4c538466a93540eb406e`  
**Production Deployment ID:** `dpl_N8RqV5KqbENayY1rkb55WUtHLDCd`  
**Production URL:** `https://www.rentipid.com.ph`  
**Production Database:** Neon `holy-shape-01357429` / branch `rentipid-production` (`br-proud-sunset-ap0ofil2`)  
**Date:** `2026-09-02`  

---

## 1. Executive Summary & Production Release Decision

During Gate 9 (Production Deployment & Verification) for ListingBridge v1.1 RC1:
1. **Production Deployment Execution:** Deployed the exact accepted RC (`1f4aada3cbf95e644633694efa8c0d51913eb6cf` / `b2d2fc433c6218f2ceae4c538466a93540eb406e`) to Vercel Production under deployment ID `dpl_N8RqV5KqbENayY1rkb55WUtHLDCd` (`readyState: READY`), aliased to `https://www.rentipid.com.ph`.
2. **Database Binding & Schema Verification:** Verified that the deployment is bound to the isolated Production database branch `br-proud-sunset-ap0ofil2`. Confirmed 145 public tables, 6/6 ListingBridge tables, and canonical migration `20260831000000_add_listingbridge_import_job_foundation` applied. Zero migrations or seed operations were required or run against Production.
3. **Smoke & Route Verification:** Verified `https://www.rentipid.com.ph/api/health` returned HTTP 200 (`database: 'connected'`, `status: 'ready'`). Verified core routes `/` (HTTP 200), `/login` (HTTP 200), `/dashboard/provider/listings/import` (HTTP 307 redirect to login), and `/dashboard/provider/listings/new` (HTTP 307 redirect to login).
4. **Security & Network Isolation:** Confirmed zero external network requests to Airbnb, Booking.com, Agoda, Facebook, or generic external endpoints. Zero credentials captured. Direct OTA APIs remained fail-closed (`LISTINGBRIDGE_API_CONNECTORS=false`).
5. **No Rollback Required:** All verification gates passed cleanly with zero critical or high blockers.

---

## 2. Production Deployment & Database Identity

| Parameter | Verified Value | Status |
| :--- | :--- | :---: |
| **Vercel Project** | `ren-tipid` | **PASS** |
| **Production Deployment ID** | `dpl_N8RqV5KqbENayY1rkb55WUtHLDCd` | **PASS** |
| **Production Canonical URL** | `https://www.rentipid.com.ph` | **PASS** |
| **Deployment Status** | `READY` | **PASS** |
| **Production Neon Project** | `holy-shape-01357429` | **PASS** |
| **Production Branch Name** | `rentipid-production` | **PASS** |
| **Production Branch ID** | `br-proud-sunset-ap0ofil2` | **PASS** |
| **Deployed DB Binding** | `PASS` | **PASS** |
| **Preview DB Used** | `NO` | **PASS** |

---

## 3. Production Verification Matrix

| Area / Check | Expected Behavior | Deployed Production Result | Status |
| :--- | :--- | :--- | :---: |
| **Health Check** | HTTP 200 (`status: ready, database: connected`) | HTTP 200 (`ready`, `connected`) | **PASS** |
| **Home Route** | HTTP 200 | HTTP 200 | **PASS** |
| **Login Route** | HTTP 200 | HTTP 200 | **PASS** |
| **Import Route** | Protected with redirect (HTTP 307) | HTTP 307 (Location: `/login?...`) | **PASS** |
| **Manual Listing Route** | Protected with redirect (HTTP 307) | HTTP 307 (Location: `/login?...`) | **PASS** |
| **Production DB Tables** | 6/6 ListingBridge tables present | 6/6 tables present | **PASS** |
| **Canonical Migration** | `20260831000000_add_listingbridge_import_job_foundation` applied | Applied at `2026-09-02T03:33:49.701Z` | **PASS** |
| **Production Migrations** | 0 required | 0 applied | **PASS** |
| **Production Seed** | 0 required | 0 executed | **PASS** |
| **Feature Control Flags** | Safe fail-closed posture for direct OTA APIs | `API_CONNECTORS=false, URL_IMPORT=false` | **PASS** |
| **Network Isolation** | 0 outbound calls to OTAs | 0 requests (AirBnB, Booking, Agoda, FB) | **PASS** |
| **Draft-Only Posture** | Import creates Draft only (`published_at: null`) | Draft only, 0 automatic publication | **PASS** |
| **Log Review** | 0 critical / 0 high errors | 0 new critical/high errors | **PASS** |

---

## 4. Final Quality Metrics

```text
G9_STATUS: PASS
RC_DESIGNATION: ListingBridge v1.1 RC1
APPLICATION_SOURCE_SHA: 1f4aada3cbf95e644633694efa8c0d51913eb6cf
RC_REPOSITORY_SHA: b2d2fc433c6218f2ceae4c538466a93540eb406e
PRODUCTION_DEPLOYMENT_ID: dpl_N8RqV5KqbENayY1rkb55WUtHLDCd
PRODUCTION_URL: https://www.rentipid.com.ph
PRODUCTION_DATABASE: holy-shape-01357429 / rentipid-production (br-proud-sunset-ap0ofil2)
ROLLBACK_REQUIRED: NO
ROLLBACK_EXECUTED: NO
CRITICAL_BLOCKERS: 0
HIGH_BLOCKERS: 0
MEDIUM_BLOCKERS: 0
LOW_BLOCKERS: 0
LIFECYCLE_PROGRESS: G1 PASS, G2 PASS, G3 PASS, G4 PASS, G5 PASS, G6 PASS, G7 PASS, G8 PASS, G9 PASS
```
