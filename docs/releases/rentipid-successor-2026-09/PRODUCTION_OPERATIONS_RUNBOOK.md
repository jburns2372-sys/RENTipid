# RENTipid — Production Operations Runbook

**Release Baseline:** `rentipid-successor-2026-09-v1.0.0-frozen`  
**Production Runtime SHA:** `d84854264447b7e2c5f521ebf88da31d22d7c066`  
**Deployment ID:** `dpl_6CAZBAdohAhBJKhBvaNs26AHfzgW`  
**Hosting Environment:** Vercel (Edge / Serverless) + Neon Serverless PostgreSQL  

---

## 1. System Topology & Operational Endpoints

- **Primary Custom Domain:** `https://www.rentipid.com.ph`
- **Apex Custom Domain:** `https://rentipid.com.ph`
- **Direct Vercel URL:** `https://ren-tipid-fj5tdhpc4-jburns2372-sys-projects.vercel.app`
- **Health Check Probe:** `GET /api/health`
  - Expected Response: `HTTP 200 OK`
  - Expected Body: `{"status":"ready","database":"connected"}`
- **Unified AI Suggestions Probe:** `GET /api/ai/suggestions`
  - Expected Response: `HTTP 200 OK`
  - Returns canonical question catalog and active customer service topics.

---

## 2. Routine Health Monitoring & Daily Checks

Operations personnel should execute the following automated or manual checks daily:

1. **API Health Endpoint:**  
   Query `https://www.rentipid.com.ph/api/health` via synthetic uptime monitor (e.g. Better Uptime, Datadog, or Vercel Monitoring). Alert threshold: Any non-200 response or latency > 2500ms for 2 consecutive probes.
2. **Database Connection Pool:**  
   Monitor connection saturation in the Neon PostgreSQL console. Standard pool size is configured via Prisma serverless connection caching.
3. **Blob Media Storage:**  
   Verify Vercel Blob quota and upload success metrics in Vercel Storage settings.
4. **Vercel Project Control Plane:**  
   Ensure project `prj_DiF8jBz51kFIHK74udSP6zuqBtMr` remains unpaused and within active billing limits.

---

## 3. Maintenance Procedures

- **Zero-Downtime Releases:**  
  All future deployments must be deployed using the immutable Promotion Standard (G1 through G13).
- **Log Inspection:**  
  Real-time runtime logs are accessible via the Vercel Dashboard (`jburns2372-sys-projects/ren-tipid/deployments`) or via `vercel inspect`.
- **Database Backup Schedule:**  
  Neon provides automatic point-in-time recovery (PITR) with continuous write-ahead logging (WAL).
