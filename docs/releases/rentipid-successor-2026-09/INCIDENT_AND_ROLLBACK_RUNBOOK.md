# RENTipid — Incident Response & Rollback Runbook

**Release Baseline:** `rentipid-successor-2026-09-v1.0.0-frozen`  
**Current Active Production Deployment:** `dpl_6CAZBAdohAhBJKhBvaNs26AHfzgW` (SHA `d84854264447b7e2c5f521ebf88da31d22d7c066`)  
**Verified Historical Rollback Target:** `dpl_A2gAH3ZHDtW6Gbo2479ToqbLhQsu` (SHA `d19f0cb63391a652f9a9a4fb22d9688ffac753b0`)  

---

## 1. Severity Classification

- **SEV-1 (Critical Outage):** Production health endpoint failing, complete inability to load pages or execute bookings, core database unreachable.
- **SEV-2 (Degraded Capability):** AI endpoints intermittently timing out, media upload degradation, email verification delays.
- **SEV-3 (Minor / Informational):** Cosmetic UI defects, non-critical logging anomalies.

---

## 2. Immediate Rollback Procedure (< 2 Minutes)

If an unrecoverable runtime regression or catastrophic failure occurs under deployment `dpl_6CAZBAdohAhBJKhBvaNs26AHfzgW`:

### Step 1: Execute Instant Vercel Alias Rollback
Promote the previous verified stable deployment:
```bash
# Via Vercel CLI (or via Vercel Dashboard -> Deployments -> Instant Rollback):
npx vercel rollback dpl_A2gAH3ZHDtW6Gbo2479ToqbLhQsu --yes
```
Alternatively, assign the production alias directly:
```bash
npx vercel alias set dpl_A2gAH3ZHDtW6Gbo2479ToqbLhQsu www.rentipid.com.ph
npx vercel alias set dpl_A2gAH3ZHDtW6Gbo2479ToqbLhQsu rentipid.com.ph
```

### Step 2: Verify Rollback Health
Confirm that the rollback deployment is actively serving requests:
```bash
curl -I https://www.rentipid.com.ph/api/health
```
Verify `x-vercel-id` and HTTP 200 `{"status":"ready","database":"connected"}`.

### Step 3: Schema & Database Backward Compatibility Check
Because the 63 schema migrations in this successor baseline are strictly additive and backward-compatible (all columns, tables, and enums were designed non-destructively), the previous application runtime (`d19f0cb...`) operates safely against the current database schema without requiring schema rollback.

---

## 3. Incident Escalation & Post-Mortem

1. **Incident Commander:** Appointed on-call engineer.
2. **Communications Lead:** Updates Owner and status channel within 15 minutes of SEV-1.
3. **Root Cause Analysis (RCA):** Must be drafted within 24 hours of incident closure before any new deployment gate is reopened.
