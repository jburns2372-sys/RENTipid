# RENTipid GLCC-JX / v1.2 — Preview Acceptance Matrix
## Mainland China + Thailand Controlled Preview Verification

**Workstream:** GLCC-JX / v1.2 CHINA + THAILAND EXPANSION  
**Action:** CNTH-3 HUMAN APPROVAL RECORDING + CONTROLLED PREVIEW ACTIVATION + FULL PREVIEW ACCEPTANCE  
**Date:** 2026-10-07  
**Execution Model:** GEMINI 3.8 FLASH HIGH  
**Preview Deployment ID:** `dpl_8teCR6cDZkxKVeMMC8dTqYpbw33G`  
**Preview URL:** `https://ren-tipid-rby57rzrq-jburns2372-sys-projects.vercel.app`  
**Deployed SHA:** `0734f9930d3b16566f09637b35ca61406b25888a`  
**Application Commit SHA:** `0734f9930d3b16566f09637b35ca61406b25888a`  
**Deployed SHA Match:** YES  
**Overall Acceptance Result:** **PASS**  

---

## 1. Governance & Legal Review Context

| Scope | Subject | Reviewer Decision | Conditions | Technical Defects | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Scope A** | Thai (`th-TH`) Class C Translations | **APPROVED** | NO SEPARATE CONDITIONS PROVIDED | 0 | **PASS** |
| **Scope B** | Mainland China (`CN`) Compliance Profile | **APPROVED** | NO SEPARATE CONDITIONS PROVIDED | 0 | **PASS** |
| **Scope C** | Thailand (`TH`) Compliance Profile | **APPROVED** | NO SEPARATE CONDITIONS PROVIDED | 0 | **PASS** |

**Legal/Compliance Reviewer:** Jonathan Amoroso — Legal/Compliance Officer  
**Decision Source:** PROJECT OWNER CONFIRMATION OF REVIEWER DECISION  
**Decision Date:** 2026-10-07  

---

## 2. Preview Acceptance Detailed Matrix (Sections 14–34)

| Section | Category | Verification Requirement | Expected Criteria | Observed Preview Behavior | Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **14** | Deployment | Single Preview Deployment | One Vercel deployment; matching commit SHA | `dpl_8teCR6cDZkxKVeMMC8dTqYpbw33G` on `0734f9930d3b...` | **PASS** |
| **15** | Preview Health | Health & Core Routes | `/api/health`, `/`, `/login`, `/register`, `/api/preferences` return 200 OK | All return 200 OK; database connected; 0 fatal 500 errors; RBAC 307 | **PASS** |
| **16.1** | China | CN / zh-Hans / CNY Selectors | Selectors present in options | `CN` (country), `zh-Hans` (locale), `CNY` (currency) present | **PASS** |
| **16.2** | China | Chinese Visible UI & Persistence | UI renders `zh-Hans`, persists across reloads | `lang="zh-Hans"`, Simplified Chinese text rendered, persisted via signed cookie | **PASS** |
| **17** | China | English Independence Case | `CN + en-US + CNY` without override | Country `CN`, Language `en-US`, Currency `CNY`; SSR `lang="en-US"` | **PASS** |
| **18** | China | Cross-Dimension Matrix | Orthogonal independence across 4 combinations | `CN+zh-Hans+CNY`, `CN+en-US+CNY`, `CN+ja-JP+CNY`, `CN+zh-Hans+USD` all pass | **PASS** |
| **19.1** | Thailand | TH / th-TH / THB Selectors | Selectors present in options | `TH` (country), `th-TH` (locale), `THB` (currency) present | **PASS** |
| **19.2** | Thailand | Thai Visible UI & Persistence | UI renders `th-TH`, persists across reloads | `lang="th-TH"`, Thai script rendered, persisted via signed cookie | **PASS** |
| **20** | Thailand | English Independence Case | `TH + en-US + THB` without override | Country `TH`, Language `en-US`, Currency `THB`; SSR `lang="en-US"` | **PASS** |
| **21** | Thailand | Cross-Dimension Matrix | Orthogonal independence across 6 combinations | `TH+th-TH+THB`, `TH+en-US+THB`, `TH+ja-JP+THB`, `TH+th-TH+USD`, `PH+th-TH+PHP`, `TH+zh-Hans+THB` pass | **PASS** |
| **22** | Surfaces | Thai Critical Surfaces (14) | Exercise 14 real surfaces with th-TH | 14/14 real surfaces tested; 0 blocking failures | **PASS** |
| **23** | Surfaces | Chinese Critical Surfaces (14) | Exercise 14 real surfaces with zh-Hans | 14/14 real surfaces tested; 0 blocking failures | **PASS** |
| **24** | Hygiene | Thai Localization Hygiene | 0 raw keys, 0 fallback, 0 Unicode corruption | Raw keys: 0, required fallback: 0, Unicode errors: 0, placeholder errors: 0 | **PASS** |
| **25** | Hygiene | Chinese Localization Hygiene | 0 raw keys, 0 fallback, 0 empty strings | Raw keys: 0, required fallback: 0, empty strings: 0, placeholder errors: 0 | **PASS** |
| **26** | Currency | CNY Display Profile | ISO CNY, symbol ¥, exponent 2 | Minor units: 2, symbol ¥, non-transactional display confirmed | **PASS** |
| **27** | Currency | THB Display Profile | ISO THB, symbol ฿, exponent 2 | Minor units: 2, symbol ฿, non-transactional display confirmed | **PASS** |
| **28** | Financial | Payment Authority Non-Regression | chargeCurrency locked to PHP | chargeCurrency immutably PHP; malicious injection blocked (400) | **PASS** |
| **29** | Marketplace | Listing & Search Acceptance | Browse & listing detail functional | `/browse` 200 OK; `/listing/[id]` 200 OK; localized UI rendered | **PASS** |
| **30** | Marketplace | Booking Acceptance | Booking & checkout routes functional | `/checkout/[bookingId]` 200 OK; 0 real financial transactions | **PASS** |
| **31** | Address | Address Compatibility | China and Thailand address handling | Standard free-form address supported (documented non-blocking limitation) | **PASS / NON_BLOCKING_LIMITATION** |
| **32** | Timezone | Timezone Resolution | China & Thailand standard timezones | China: `Asia/Shanghai`, Thailand: `Asia/Bangkok` | **PASS** |
| **33** | Regression | Frozen Global Wave 1 Non-Regression | 44 countries, 46 languages, 23 currencies, ja-JP, ar-AE | All intact; `ja-JP` Japanese rendered; `ar-AE` RTL rendered | **PASS** |
| **34** | Isolation | Production Environment Firewall | Zero changes to Production | Production modified: NO; Database modified: NO; CN/TH active in prod: NO | **PASS** |

---

## 3. Market Blockers Disposition

1. **`CN-BLK-001` (MIIT ICP/EDI License):**
   - **Classification:** `PREVIEW_NONBLOCKING_PRODUCTION_CONDITION` / `RESOLVED_FOR_PREVIEW`
   - **Preview Impact:** 0 (Internal non-commercial QA testing).
   - **Production Requirement:** Corporate establishment or Sino-foreign JV prior to commercial launch.

2. **`CN-BLK-002` (Cross-Border Data Transfer / GFW / CAC SCC):**
   - **Classification:** `PREVIEW_NONBLOCKING_PRODUCTION_CONDITION` / `RESOLVED_FOR_PREVIEW`
   - **Preview Impact:** 0 (Test fixtures only; zero real Chinese resident data transferred).
   - **Production Requirement:** CAC SCC filing and local data isolation prior to commercial launch.

**Preview Blocking China Items:** 0  
**China Architecture Review:** PASS  
**Mainland China Public Network Operability:** NOT_CLAIMED  
