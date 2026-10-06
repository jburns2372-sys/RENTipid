# RENTipid GLCC v1.1 — Global Production Rollback Plan

**Document Identifier:** `GLOBAL-W1-PROD-ROLLBACK-001`  
**Controlling Master:** `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0`  
**Governing Factory:** `P12 / v1.1 GLOBAL EXPANSION FACTORY`  
**Status:** `STANDBY_READY`  
**Date:** October 6, 2026  

---

## 1. Rollback Baseline Identification

| Target | Value |
| :--- | :--- |
| **Active Production Deployment ID** | `dpl_7CtWAHhhBu2zWNcDPPNkDX7zBw6X` |
| **Active Production Source Git SHA** | `7ed8388f36e970f7da7d04ca44afccb883d4ea9d` |
| **Active Production URL / Domain** | `https://www.rentipid.com.ph` |
| **Target Production Project** | `jburns2372-sys-projects/ren-tipid` |

---

## 2. Trigger Conditions (Immediate Rollback Required)

1. Root route (`/`) or `/api/health` returns HTTP 5xx or fails runtime liveness probe.
2. NextAuth session verification or role-based access control (`/dashboard/admin`) fails to protect restricted routes.
3. Transaction or settlement authority mutates away from statutory PHP currency during checkout.
4. Language selector causes hydration mismatch or blocking browser crashes across candidate locales.
5. Unformatted canonical keys or broken placeholder interpolations are visible on critical public surfaces.
6. Static assets or locale packages fail to resolve on production edge networks.

---

## 3. Execution Procedure

In the event of an activation incident during stage GLOBAL-W1-J:

```bash
# 1. Instantly remap production domain to prior known-good deployment
npx vercel alias set dpl_7CtWAHhhBu2zWNcDPPNkDX7zBw6X www.rentipid.com.ph

# 2. Verify restored production endpoint
curl -s -o /dev/null -w "%{http_code}" https://www.rentipid.com.ph/api/health
```

---

## 4. Post-Rollback Health & Verification Checklist

- [ ] HTTP 200 returned on `https://www.rentipid.com.ph/api/health`.
- [ ] Login (`/login`) and Registration (`/register`) functional without session degradation.
- [ ] Admin route (`/dashboard/admin`) redirects unauthenticated requests (HTTP 307).
- [ ] Language selector offers baseline `en-PH` and `fil-PH` while candidate locales remain blocked.
- [ ] Zero database changes require reversal.
