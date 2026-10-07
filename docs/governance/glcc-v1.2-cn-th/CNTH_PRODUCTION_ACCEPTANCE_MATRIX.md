# RENTipid GLCC-JX / v1.2 — Production Acceptance Matrix

**Workstream:** GLCC-JX / v1.2 Mainland China + Thailand Jurisdiction Expansion  
**Action:** CNTH-5 Controlled Production Activation + Acceptance  
**Production Application Candidate:** `0734f9930d3b16566f09637b35ca61406b25888a`  
**Target Domain:** `https://www.rentipid.com.ph`  
**Deployment ID:** `dpl_6FrhmpiGAG1uHSqg4ZP5BdL2TLRt`  
**Overall Result:** `FAIL-ROLLED-BACK`  
**Rollback Deployment:** `dpl_754t6JhqcPjLVzdh5wNBCm6QCBA3` (`d3846e327905fe3762c73bc7b26697a19d708fbb`)

---

## Detailed Test Results Matrix

| ID | Category | Test Description | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-9-10** | Deployment Verification | Exact Candidate Deployed | `0734f9930d3b16566f09637b35ca61406b25888a` deployed to production | Deployed and verified via Vercel deployment API | **PASS** |
| **SEC-11** | Production Health | Endpoints & Core Routes | 200 OK on health, landing, login, register; RBAC redirect 307 | All 200 OK, database connected, 0 fatal server errors, RBAC redirect 307 | **PASS** |
| **SEC-12** | Production Inventory | Dimensional Completeness | 46 countries, 47 languages, 25 currencies; CN/TH/zh-Hans/th-TH/CNY/THB | All 46/47/25 verified on `/api/preferences`; additions present | **PASS** |
| **SEC-13.1** | China Acceptance | CN / zh-Hans / CNY Selectors | Present in options and selectable | Verified present and selectable | **PASS** |
| **SEC-13.2** | China Acceptance | Chinese Visible UI & Persistence | `lang='zh-Hans'`, visible Simplified Chinese text, persisted | `lang='zh-Hans'`, Simplified Chinese rendered, cookie persisted | **PASS** |
| **SEC-14** | China Acceptance | Cross-Dimension Matrix | Orthogonal independence across 4 combinations | All 4 combinations verified with 200 OK and matching preferences | **PASS** |
| **SEC-15.1** | Thailand Acceptance | TH / th-TH / THB Selectors | Present in options and selectable | Verified present and selectable | **PASS** |
| **SEC-15.2** | Thailand Acceptance | Thai Visible UI & Persistence | `lang='th-TH'`, visible Thai UI rendered, persisted | Preferences persisted, but SSR returned `lang='en-PH'` without Thai text due to candidate `th-TH` `releaseStatus='QA_REQUIRED'` | **FAIL** |
| **SEC-16** | Thailand Acceptance | Cross-Dimension Matrix | Orthogonal independence across 6 combinations | All 6 combinations verified with 200 OK and matching preferences | **PASS** |
| **SEC-17** | Surface Acceptance | Thai Representative Surfaces | 14 surfaces tested without fatal errors | 14/14 surfaces executed safely (200 OK / 307 redirect) | **PASS** |
| **SEC-18** | Surface Acceptance | Chinese Representative Surfaces | 14 surfaces tested without fatal errors | 14/14 surfaces executed safely (200 OK / 307 redirect) | **PASS** |
| **SEC-19** | String Quality | Thai Raw Key / Unicode Sweep | 0 raw keys, 0 Unicode corruption, 0 placeholder leaks | 0 raw keys, 0 Unicode corruption, 0 placeholder leaks detected | **PASS** |
| **SEC-20** | String Quality | Chinese Raw Key / Sweep | 0 raw keys, 0 undefined/null, 0 placeholder leaks | 0 raw keys, 0 undefined/null, 0 placeholder leaks detected | **PASS** |
| **SEC-21** | Currency Display | CNY Display Acceptance | CNY registered, minor units 2, non-transactional display | Minor units 2, symbol ¥, display-only, transaction/settlement not claimed | **PASS** |
| **SEC-22** | Currency Display | THB Display Acceptance | THB registered, minor units 2, non-transactional display | Minor units 2, symbol ฿, display-only, transaction/settlement not claimed | **PASS** |
| **SEC-23** | Payment Separation | Financial Separation Authority | `chargeCurrency` strictly PHP, injection prohibited (400) | `chargeCurrency` locked to PHP, injection returned 400 Bad Request | **PASS** |
| **SEC-24** | Marketplace Compat | Listing / Search Verification | Read-only check on browse and listing pages | `/browse` and `/listing/...` returned 200 OK | **PASS** |
| **SEC-25** | Marketplace Compat | Booking Surface Verification | Safe checkout check without creating transactions | `/checkout/...` returned 200 OK without payment creation | **PASS** |
| **SEC-26** | Metadata | Timezone & Address Capability | Asia/Shanghai, Asia/Bangkok; free-form address | Timezones resolved; documented non-blocking postal limitation | **PASS** |
| **SEC-27** | Global Regression | Frozen v1.1 Baseline Non-Regression | ja-JP localization, ar-AE RTL, prior 44 markets intact | ja-JP text rendered; ar-AE RTL dir rendered; 44 markets intact | **PASS** |
| **SEC-30** | Database Protection | Zero Production DB Mutations | 0 migrations, 0 schema mutations, 0 data modifications | 0 database operations executed | **PASS** |
| **SEC-31** | Rollback Execution | Deterministic Production Rollback | Restore prior known good deployment on blocking defect | Executed `vercel rollback dpl_754t6JhqcPjLVzdh5wNBCm6QCBA3 --yes`; verified live | **PASS** |

---

## Blocking Defect & Root Cause Summary

1. **Defect:** Under Production runtime (`VERCEL_ENV=production`), selecting `th-TH` does not render visible Thai text on SSR pages; the resolver falls back to `en-PH`.
2. **Root Cause:** In the approved application candidate `0734f9930d3b16566f09637b35ca61406b25888a`, `th-TH` was registered with `releaseStatus: 'QA_REQUIRED'` (which allowed resolution in Preview with `glcc_qa=true`). In Production mode, `src/lib/glcc/locale-resolver.ts` strictly enforces that only `releaseStatus: 'PRODUCTION_READY'` locales may resolve, causing `th-TH` to fail closed to platform default `en-PH`.
3. **Disposition:** Per Section 31 Rollback Rule, Production was immediately rolled back to `dpl_754t6JhqcPjLVzdh5wNBCm6QCBA3` (`d3846e327905fe3762c73bc7b26697a19d708fbb`). Remediation must follow the strict `LOCAL -> corrected PREVIEW -> corrected PRODUCTION` pipeline.
