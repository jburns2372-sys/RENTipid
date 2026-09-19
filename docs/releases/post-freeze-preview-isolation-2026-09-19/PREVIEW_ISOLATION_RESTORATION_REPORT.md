# RENTipid Preview Isolation Restoration Report
**Date:** 2026-09-19  
**Type:** Post-Freeze Infrastructure Correction  
**Status:** RESTORED — PASS  

---

## 1. Executive Summary

This report documents the post-freeze infrastructure correction restoring complete deployment and database isolation for the Preview environment (`preview.rentipid.com.ph`). The production release (`rentipid-unified-auth-v1.1.0-frozen`) remains untouched, unchanged, and fully operational.

---

## 2. Defect Description & Remediation

- **Defect Identified:** The custom domain alias `preview.rentipid.com.ph` was assigned to Production deployment `dpl_G2mNn7DAEJh4FMerSBcVhfnauZse`, breaking isolation between Preview and Production environments.
- **Remediation Executed:**
  - Evaluated and verified candidate Preview deployment `dpl_CFAvXzWon8wXjBi6sE4SPwYLjea5`.
  - Reassigned `preview.rentipid.com.ph` to `dpl_CFAvXzWon8wXjBi6sE4SPwYLjea5`.
  - Production domains (`www.rentipid.com.ph`, `rentipid.com.ph`, `ren-tipid.vercel.app`) remain exclusively mapped to `dpl_G2mNn7DAEJh4FMerSBcVhfnauZse`.

---

## 3. Environment Specifications & Evidence

| Parameter | Production Environment | Preview Environment | Isolation Status |
|---|---|---|---|
| **Deployment ID** | `dpl_G2mNn7DAEJh4FMerSBcVhfnauZse` | `dpl_CFAvXzWon8wXjBi6sE4SPwYLjea5` | SEPARATE & INDEPENDENT |
| **Target Type** | `production` | `preview` (non-production) | ISOLATED |
| **Runtime Source SHA** | `c0254631ea55030fd8e6c21ee73bc7a4563173ff` | `c0254631ea55030fd8e6c21ee73bc7a4563173ff` | IDENTICAL CODEBASE |
| **Domain** | `www.rentipid.com.ph` | `preview.rentipid.com.ph` | SEPARATE DOMAINS |
| **Database Branch** | `rentipid-production` | `rentipid-listingbridge-preview` | ISOLATED NEON BRANCHES |
| **Health Status** | HTTP 200 `{"status":"ready","database":"connected"}` | HTTP 200 `{"status":"ready","database":"connected"}` | PASS |
| **Provider Registry** | `credentials`, `phone-otp`, `google`, `facebook`, `apple` | `credentials`, `phone-otp`, `google`, `facebook`, `apple` | PASS |

---

## 4. Preview Callback URLs

All five authentication providers on `preview.rentipid.com.ph` resolve strictly to the preview domain origin:
- `credentials` -> `https://preview.rentipid.com.ph/api/auth/callback/credentials`
- `phone-otp` -> `https://preview.rentipid.com.ph/api/auth/callback/phone-otp`
- `google` -> `https://preview.rentipid.com.ph/api/auth/callback/google`
- `facebook` -> `https://preview.rentipid.com.ph/api/auth/callback/facebook`
- `apple` -> `https://preview.rentipid.com.ph/api/auth/callback/apple`

---

## 5. Frozen Release & Production Non-Regression

- **Frozen Release Tag:** `rentipid-unified-auth-v1.1.0-frozen` verified unchanged pointing to commit `eaa63c78f4c1cc11760bb3084d0ee9b84bac6e47`.
- **Production Runtime Mutation:** None (`PRODUCTION MUTATED = NO`).
- **Production Health:** HTTP 200 `{"status":"ready","database":"connected"}`.
- **Rollback Reference:** `dpl_6CAZBAdohAhBJKhBvaNs26AHfzgW` retained.
