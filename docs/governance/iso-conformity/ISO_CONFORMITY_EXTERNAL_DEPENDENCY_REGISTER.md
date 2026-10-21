# RENTipid ISO Conformity External Dependency Register

**Document ID:** `RENTIPID-ISO-CONFORMITY-001-EDR`  
**Program:** RENTipid ISO Compliance & Conformity Program  
**Project ID:** `RENTIPID-ISO-CONFORMITY-001`  
**Version:** `v1.0`  
**Status:** `ACTIVE REGISTER`  

---

## 1. Purpose & Control Rule

This register tracks all third-party external dependencies, cloud vendors, and payment/identity partners upon which the RENTipid Information Security and Privacy Management System relies.

> **Controlling Rule:** External dependencies requiring third-party approval, contractual agreement, or supplier certification must be tracked separately from internal source code or architecture defects. An external dependency delay must not be converted into an internal technical failure unless the integration architecture itself is flawed.

---

## 2. External Dependency Inventory

| Dependency ID | Partner / Vendor | Service Scope | Required Evidence Artifact | Current State | Critical Blocker? | Impact on ISO Conformity Program | Contingency / Fallback Plan |
|---|---|---|---|---|---|---|---|
| **DEP-01** | Xendit | Sandbox payments/payouts | Account approval, scoped genuine sandbox lifecycle evidence | PENDING; real sandbox verification NO | YES for Batch 2 lifecycle | EVD-22: callback-token fixtures only, no HMAC claim or Production readiness | Preserve fixture baseline; wait for separately authorized external validation |
| **DEP-02** | Sumsub | Scoped synthetic Individual API/callback | Contractual/attestation evidence and unverified lifecycle checks | Scoped sandbox smoke VERIFIED; full KYC/country lifecycle NOT VERIFIED | Full lifecycle still incomplete | EVD-21 Observed real Sandbox evidence / limits | Retain limits; no Production activation inferred |
| **DEP-03** | AWS | Historical deployment/backup design | Evidence of actual service activation and applicable attestations if used | DESIGN / READINESS ONLY | No C0 blocker | EVD-14/15 do not establish operational AWS hosting or compliance | Reconcile dated inventory in a later authorized package |
| **DEP-04** | Vercel | Historical hosting and isolated deployments | Account-specific contractual/assurance evidence | Historical processor registry PRO; executed Sept 19 release/isolation evidence | No C0 blocker | EVD-20, EVD-07/08; Enterprise plan and certification coverage not inferred | Retain dated evidence; do not claim fresh live verification |
| **DEP-05** | PayMongo | Domestic payment integration | Actual live payment/provider acceptance evidence | Historical privacy registry SANDBOX; live completion not established here | Outside C0 execution | EVD-20 and EVD-14 retain pending live-pilot limitation | No available live fallback asserted |
| **DEP-06** | MannyPay | Separate local integration workstream | Separately accepted operating/provider evidence | Operating approval NOT ESTABLISHED by C0 inventory | Outside C0 execution | EVD-21 provider review excludes SEA MannyPay/PayMongo fallback | No operating payment rail or fallback asserted |
| **DEP-07** | CAB | Future independent certification | Engagement, Stage 1/2 audits and certification decision | Not evidenced / planned | Later certification prerequisite | Master ledger certification notice | No certification claim |
| **DEP-08** | Azure / Neon | Historical database hosting records | Dated authoritative inventory, contractual/assurance and recovery evidence | EVD-20 records Azure; later EVD-08 isolation report records Neon branches | Reconciliation evidence required | Historical records differ by date; no fresh provider validation or current topology assertion | Preserve both dated sources for later authorized reconciliation |

---

## 3. Current Critical Blocker Disposition

* **Current Active Blocker:** `DEP-01` — **Xendit Account Approval**
* **Root Cause:** Awaiting Xendit compliance team review and sandbox activation for live payout testing.
* **Scope Isolation:**
  * **GLOBAL-MKT v2.0:** Batch 2 remains in `OPEN — NOT YET FULL LOCAL-LIFECYCLE ACCEPTED` state awaiting approval.
  * **ISO Conformity Program:** C0 does not authorize starting `ISO-C1` (Integrated Risk, SoA, Asset, and Supplier Baseline) or `ISO-C2` (Technical and SDLC Verification); both remain planned.
  * **Cross-Stream Rule:** When Xendit approval is received, the Project Owner may authorize priority execution of the real sandbox payment/payout suite under GLOBAL-MKT v2.0 without invalidating ISO-C0 or ISO-C1.
