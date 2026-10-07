# RENTipid GLOBAL-MKT / v2.0 — Batch 2 Southeast Asia Defect Register

**Date:** 2026-10-07  
**Scope:** Batch 2 — Southeast Asia (TH, SG, MY, VN, ID)  
**Total Defects Identified:** 3  
**Total Defects Resolved:** 3  
**Total Defects Deferred:** 0  

---

### Defect Log

#### DEF-B2-001: Missing Explicit Address Validation Profiles for MY, VN, ID
- **Severity:** HIGH
- **Status:** CLOSED / RESOLVED
- **Root Cause:** Address registry lacked explicit postal regex and administrative area labels for MY, VN, ID.
- **Resolution:** Added explicit `AddressProfile` configurations for Pos Malaysia (5 digits), Vietnam national postal code (5 digits), and Pos Indonesia (5 digits).
- **Evidence:** Verified in `scripts/run-global-mkt-batch2-sea-tests.ts`.

#### DEF-B2-002: Mock Financial Adapters Lacked Southeast Asian Currency Coverage
- **Severity:** MEDIUM
- **Status:** CLOSED / RESOLVED
- **Root Cause:** Test adapters restricted currencies to PHP, USD, EUR, causing test failures during local-currency test execution for Batch 2.
- **Resolution:** Added `THB`, `SGD`, `MYR`, `VND`, `IDR` to test-only adapter capabilities.
- **Evidence:** Verified in `scripts/run-global-mkt-batch2-sea-tests.ts`.

#### DEF-B2-003: Tax Registry Missing Specific Statutory References for Southeast Asia
- **Severity:** MEDIUM
- **Status:** CLOSED / RESOLVED
- **Root Cause:** Generic international placeholder returned for TH, SG, MY, VN, ID without legal statutory authorities.
- **Resolution:** Implemented explicit statutory tax profiles for TH (Revenue Dept 7% VAT), SG (IRAS 9% GST), MY (Customs 8% SST), VN (GDT Circular 80), and ID (DJP PMK 60/2022).
- **Evidence:** Verified in `scripts/run-gm8a-tests.ts` and `scripts/run-global-mkt-batch2-sea-tests.ts`.
