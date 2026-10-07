# RENTipid GLOBAL-MKT / v2.0 — Financial Provider Capability Snapshot
## GM-6A: Financial Provider Evidence Baseline

**Date:** 2026-10-07  
**Branch:** `feat/global-mkt-v2.0`  
**Application Baseline Commit:** `65c767b05a67f6ea5481252f35ee672c2f29a110`  
**Controlling Standard:** `.agents/AGENTS.md`  

---

### Provider Capability Matrix

| Provider ID | Provider Name | Type | Verification Status | Collection | Payout | Currencies | Methods | Webhook / Recon | Known Limitations |
|---|---|---|---|---|---|---|---|---|---|
| `paymongo` | PayMongo Philippines | GATEWAY | PARTIAL | SUPPORTED | UNSUPPORTED | PHP | CARD, GCASH, MAYA, GRABPAY | Verified HMAC / API Lookup | PH jurisdiction only; PHP only; no disbursement rails. |
| `mock_gateway` | Mock Gateway (TEST ONLY) | MOCK | NOT_CONFIGURED | TEST_MOCK_ONLY | UNSUPPORTED | PHP, USD, EUR | CARD, ONLINE | Simulated HMAC / Mock Recon | Test only; never confers commercial readiness. |
| `mock_payout_rail` | Mock Payout Rail (TEST ONLY) | MOCK | NOT_CONFIGURED | UNSUPPORTED | TEST_MOCK_ONLY | PHP, USD | BANK_TRANSFER | N/A / Mock Recon | Test only; does not disburse fiat currency. |
| `manual_ph_bank` | Manual PH Bank Disbursement | DIRECT_BANK | PARTIAL | UNSUPPORTED | MANUAL_INSTRUCTION | PHP | BANK_TRANSFER | Manual Audit | Manual batch approval only; not automated real-time. |
| `mannypay` | MannyPay (Separate Workstream) | AGGREGATOR | NOT_CONFIGURED | PENDING | PENDING | NONE | NONE | UNKNOWN | Separate workstream pending; unmodified; unmerged. |

---

### Non-Inflation Invariants
1. **PayMongo Scope Preservation:** PayMongo is wrapped strictly behind `PaymentProviderAdapter`. Its jurisdiction is strictly bounded to the Philippines (PHP). No cross-border or foreign currency claims are made.
2. **MannyPay Isolation:** MannyPay is maintained as `SEPARATE_WORKSTREAM_PENDING`. It is neither merged nor configured, preserving workstream separation.
3. **Mock Adapter Firewalls:** Mock adapters (`mock_gateway`, `mock_payout_rail`) are strictly isolated for local integration and state-machine testing. They do not activate any jurisdiction.
4. **Commercially Active Countries Count:** Remains exactly **0**.
