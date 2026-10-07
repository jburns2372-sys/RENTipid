# RENTipid GLCC-JX / v1.2 — CNTH-5R2 Corrected Preview Acceptance Matrix

**Workstream:** GLCC-JX / v1.2 Mainland China + Thailand Jurisdiction Expansion  
**Action:** CNTH-5R2 Corrected Preview Activation + Targeted Preview Acceptance  
**Status:** **PASS**  
**Old Preview Acceptance:** SUPERSEDED FOR THAI PRODUCTION-ELIGIBILITY PATH ONLY  
**Corrected Preview Application:** `9c69fd0128b0f9ef6a2e933d8a6636403a300bf6`  
**Preview Deployment ID:** `dpl_HHUtSYdtQia9SxA6119bLdx8tmqV`  
**Preview URL:** `https://ren-tipid-92gy63idn-jburns2372-sys-projects.vercel.app`

---

## Acceptance Matrix

| ID | Category | Test Description | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-9-10** | Deployment Verification | Corrected Application Deployed | Exact candidate `9c69fd0128b0f9ef6a2e933d8a6636403a300bf6` deployed | Verified via Vercel deployment API: commit SHA matches `9c69fd0` | **PASS** |
| **SEC-11** | Preview Health | Health & Core Routes | 200 OK on health, landing, login, register; RBAC redirect 307 | All 200 OK, database connected, 0 fatal server errors, RBAC redirect 307 | **PASS** |
| **SEC-12.1** | Critical Remediation | Zero QA Override Enforcement | Zero `glcc_qa=true` sent during test execution | Zero QA override verified; no QA cookie or query parameter used | **PASS** |
| **SEC-12.2** | Critical Remediation | Thai Visible UI Without QA Override | `lang='th-TH'`, visible Thai UI rendered on SSR pages | `<html lang="th-TH">` rendered with Thai characters across home page | **PASS** |
| **SEC-12.3** | Critical Remediation | Thai Persistence & Reload | Preference persisted across reload without QA override | Persisted via `rentipid_pref`, GET confirms `effectivePreference: th-TH` | **PASS** |
| **SEC-13** | Surface Acceptance | 14 Representative Surfaces | 14 surfaces tested without fatal errors | 14/14 surfaces executed safely (200 OK / 307 redirect) | **PASS** |
| **SEC-14** | String Quality | Thai Raw Key / Unicode Sweep | 0 raw keys, 0 undefined/null, 0 Unicode corruption, 0 placeholder leaks | 0 raw keys, 0 undefined/null, 0 Unicode corruption, 0 placeholder leaks detected | **PASS** |
| **SEC-15** | Dimensional Independence | Thai Cross-Dimension Matrix | TH+th-TH+THB, TH+en-US+THB, TH+th-TH+USD, PH+th-TH+PHP | All 4 combinations verified with 200 OK and matching preferences | **PASS** |
| **SEC-16** | China Non-Regression | Essential China Non-Regression | CN+zh-Hans+CNY selector, visible UI, persistence, CNY display ¥ | `<html lang="zh-Hans">` rendered with Chinese text, symbol ¥, 0 raw keys | **PASS** |
| **SEC-17** | Inventory Invariants | Complete Dimensional Count | 46 countries, 47 languages, 25 currencies; th-TH `PRODUCTION_READY` | All 46/47/25 verified; th-TH registered and `PRODUCTION_READY` | **PASS** |
| **SEC-18** | Payment & Database | Financial & Schema Non-Regression | `chargeCurrency` PHP, 0 DB migrations, 0 DB schema mutations | `chargeCurrency` locked to PHP, 0 migrations, 0 schema mutations | **PASS** |
