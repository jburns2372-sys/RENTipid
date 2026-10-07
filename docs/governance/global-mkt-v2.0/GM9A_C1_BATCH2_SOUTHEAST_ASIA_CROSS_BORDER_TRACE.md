# RENTipid GLOBAL-MKT / v2.0 — Batch 2 Southeast Asia Cross-Border Trace

**Date:** 2026-10-07  
**Scope:** Batch 2 — Southeast Asia (TH, SG, MY, VN, ID)  
**Status:** PASS  

---

## Validated Scenarios

1. **CB-001: PH Renter discovering TH Listing (Bangkok)**
   - Renter Country: PH (Asia/Manila, PHP)
   - Listing Country: TH (Asia/Bangkok, THB)
   - Discovery: Succeeded
   - Messaging: Succeeded with sensitive token redaction
   - State Consistency: Maintained across jurisdiction boundary

2. **CB-002: SG Renter discovering MY Listing (Kuala Lumpur)**
   - Renter Country: SG (Asia/Singapore, SGD)
   - Listing Country: MY (Asia/Kuala_Lumpur, MYR)
   - Discovery: Succeeded
   - Price Authority: Locked to MYR minor units
   - FX Drift: Strictly suppressed

3. **CB-003: MY Renter discovering SG Listing (Singapore)**
   - Renter Country: MY (Asia/Kuala_Lumpur, MYR)
   - Listing Country: SG (Asia/Singapore, SGD)
   - Discovery: Succeeded
   - Currency Authority: Locked to SGD minor units

4. **CB-004: VN Renter discovering TH Listing (Bangkok)**
   - Renter Country: VN (Asia/Ho_Chi_Minh, VND)
   - Listing Country: TH (Asia/Bangkok, THB)
   - Discovery: Succeeded

5. **CB-005: ID Renter discovering SG Listing (Singapore)**
   - Renter Country: ID (Asia/Jakarta, IDR)
   - Listing Country: SG (Asia/Singapore, SGD)
   - Discovery: Succeeded
   - Availability Concurrency: Overlap detected and rejected cleanly
