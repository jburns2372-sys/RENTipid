# RENTipid Version Frozen Release Manifest
**Release Tag:** `rentipid-unified-auth-v1.1.0-frozen`  
**Date:** 2026-09-19  
**Status:** FROZEN — PASS  

---

## 1. Frozen Artifact Specifications

| Item | Value |
|---|---|
| **Module** | Unified Multi-Login / Authentication v1.1 |
| **Release Version** | v1.1.0 |
| **Production Runtime SHA** | `c0254631ea55030fd8e6c21ee73bc7a4563173ff` |
| **Production Deployment ID** | `dpl_G2mNn7DAEJh4FMerSBcVhfnauZse` |
| **Production Canonical URL** | `https://www.rentipid.com.ph` |
| **Frozen Tag** | `rentipid-unified-auth-v1.1.0-frozen` |
| **Rollback Reference Deployment** | `dpl_6CAZBAdohAhBJKhBvaNs26AHfzgW` |

---

## 2. Configuration & Runtime Baseline

| Feature / Setting | Value |
|---|---|
| **Production Providers** | `credentials`, `phone-otp`, `google`, `facebook`, `apple` |
| **Connected OAuth Methods** | `Google`, `Apple`, `Facebook` |
| **Canonical User Model** | Single internal RENTipid User (`cmth***2bqn`) |
| **Same-Email Auto-Link** | `DISABLED` (`ACCOUNT_LINK_REQUIRED` enforced) |
| **allowDangerousEmailAccountLinking** | `NOT ENABLED` |
| **Provider Collision Protection** | `ENABLED` |
| **Database Migration** | `20260827090000_unified_multi_login_auth_v1_1` (Already applied) |
| **Production Reconciliation** | `COMPLETED` (Facebook identity transferred atomically) |
| **Secret Leakage** | `NONE DETECTED` |

---

## 3. Immutability Policy

Following the application of the `rentipid-unified-auth-v1.1.0-frozen` release tag, this release baseline is permanently frozen. Any future modifications, migrations, or feature enhancements must begin a new successor candidate lifecycle under standard RENTipid promotion gates.
