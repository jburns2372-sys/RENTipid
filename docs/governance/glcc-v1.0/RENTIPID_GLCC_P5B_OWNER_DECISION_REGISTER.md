# RENTipid GLCC v1.0 — Work Package Decision Register
## GLCC-P5B: Pre-Implementation Policy Decision Gate & Register

**Authoritative Executor:** Antigravity  
**Execution Date:** 2026-09-26  
**Work Package Status:** BLOCKED — OWNER FX POLICY DECISIONS REQUIRED  
**Parent Phase:** GLCC-P5 (FX Presentation & Quote Service)  
**Parent Phase Status:** P5 INCOMPLETE — OWNER FX POLICY DECISIONS REQUIRED  

---

### 1. Worktree & Baseline Identity

- **Repository Root:** `c:\Users\user\Documents\JD SOFTWARE PROJECTS\RENTipid`
- **Git Branch:** `successor/rc-candidate`
- **HEAD Commit SHA:** `8016ea0f03fad92aad048cd922aaed88927e0387`
- **Runtime Environment:** Node `v22.22.2`, npm `10.9.7`, win32 x64
- **P5A Manifest Identity:** `AE5C76A05FDD19C2C72CD956C633ADA0574CAEAC93D1A47EFB67A472FB77FF4E` (`docs/governance/glcc-v1.0/evidence/p5a/p5a-manifest.json`)
- **Git Working Tree Policy:** Pristine; zero reset, clean, stash, branch switch, discard, stage, commit, push, merge, or tag.

---

### 2. Decision Gate Objective & Rule of Precedence

In accordance with Owner Authorization directive **GLCC-P5B (Section 1 & Section 5)**, live provider integration and production browse presentation are strictly decision-gated.

The Executor must **not** invent or independently select an FX vendor, arbitrary TTLs, outlier thresholds, or commercial fee/spread percentages. If an approved authority does not exist for the required production policy decisions, live implementation must halt, the unresolved decision set must be formally registered, and the work package marked blocked.

---

### 3. Mandatory Decision Classification Register

Targeted discovery across repository configuration (`.env*`, `prisma/schema.prisma`), governance records (`RENTIPID_GLCC_ARCHITECTURE_LOCK.md`, `RENTIPID_GLCC_PREIMPLEMENTATION_VALIDATION.md`), payment authorities (`src/lib/payments/`), and P5A contracts evaluated the 6 required production decisions:

| # | Production Policy Decision | Classification | Approved Value | Authority / Source Inspected | Evidence Path |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **1** | **Approved Live FX Provider** | **OWNER APPROVED — 2026-09-26** | **CurrencyAPI** (Medium Plan) | Owner Directive: GLCC-P5B (2026-09-26) | `docs/governance/glcc-v1.0/RENTIPID_GLCC_P5B_OWNER_DECISION_REGISTER.md` |
| **2** | **Browse-Rate Freshness TTL** | **OWNER APPROVED — 2026-09-26** | **300000 ms** (5 minutes) | Owner Directive: GLCC-P5B (2026-09-26) | `docs/governance/glcc-v1.0/RENTIPID_GLCC_P5B_OWNER_DECISION_REGISTER.md` |
| **3** | **Checkout-Quote Freshness TTL** | **OWNER APPROVED — 2026-09-26** | **120000 ms** (120 seconds) | Owner Directive: GLCC-P5B (2026-09-26) | `docs/governance/glcc-v1.0/RENTIPID_GLCC_P5B_OWNER_DECISION_REGISTER.md` |
| **4** | **Outlier Deviation Threshold** | **OWNER APPROVED — 2026-09-26** | **5.00%** (`0.05`) | Owner Directive: GLCC-P5B (2026-09-26) | `docs/governance/glcc-v1.0/RENTIPID_GLCC_P5B_OWNER_DECISION_REGISTER.md` |
| **5** | **Commercial Rounding Policy** | **OWNER APPROVED — 2026-09-26** | **ROUND_HALF_UP** | Owner Directive: GLCC-P5B (2026-09-26) | `docs/governance/glcc-v1.0/RENTIPID_GLCC_P5B_OWNER_DECISION_REGISTER.md` |
| **6** | **Conversion Fee / Spread Policy** | **OWNER APPROVED — 2026-09-26** | **Fee: NONE / Spread: NONE** (0 bps markup) | Owner Directive: GLCC-P5B (2026-09-26) | `docs/governance/glcc-v1.0/RENTIPID_GLCC_P5B_OWNER_DECISION_REGISTER.md` |

---

### 4. Detailed Specification of Unresolved Decisions

#### Decision 1: Approved Live FX Provider
- **Status:** `NOT APPROVED / NOT FOUND`
- **Repository Observation:** No external FX provider SDK, client credentials, or API endpoints exist in the workspace. Payment processing is hardcoded to PHP (`src/lib/payments/payment-currency-policy.ts`).
- **Owner Options:**
  - *Option A:* Select commercial provider (e.g. OpenExchangeRates, Fixer.io, CurrencyAPI, XE).
  - *Option B:* Select institutional / central bank feed (e.g. European Central Bank, Bangko Sentral ng Pilipinas).
  - *Option C:* Maintain non-live operation using deterministic in-memory provider until Phase P6 checkout design is finalized.
- **Enforced Safe Behavior:** Only `DeterministicFakeFxProvider` is registered. Live network calls are blocked.

#### Decision 2: Browse-Rate Freshness TTL (`browseFreshnessMs`)
- **Status:** `NOT APPROVED / NOT FOUND`
- **Repository Observation:** `ARCHITECTURE_LOCK.md` records: *"Owners, thresholds, and costs are undecided."* P5A test suite used a synthetic 300,000 ms (5 minutes) value explicitly labeled `TEST ONLY — NOT PRODUCTION POLICY`.
- **Owner Options:**
  - *Option A:* 5 minutes (300,000 ms) — standard web marketplace estimate freshness.
  - *Option B:* 15 minutes (900,000 ms) — conservative quota consumption.
  - *Option C:* 60 minutes (3,600,000 ms) — daily/hourly batch update policy.
- **Enforced Safe Behavior:** Browse rates failing freshness fall back to canonical currency (`PHP`) without fabricating rates.

#### Decision 3: Checkout-Quote Freshness TTL (`checkoutFreshnessMs`)
- **Status:** `NOT APPROVED / NOT FOUND`
- **Repository Observation:** Must be strictly tighter than browse TTL. P5A test suite used a synthetic 60,000 ms (1 minute) value labeled `TEST ONLY`.
- **Owner Options:**
  - *Option A:* 60 seconds (60,000 ms) — high market volatility protection.
  - *Option B:* 180 seconds (3 minutes) — user checkout completion grace period.
  - *Option C:* 600 seconds (10 minutes) — extended booking reservation lock.
- **Enforced Safe Behavior:** Expired checkout quotes deterministically return `isSuccess: false` and are blocked from financial use.

#### Decision 4: Outlier Deviation Threshold (`maxDeviationPercentage`)
- **Status:** `NOT APPROVED / NOT FOUND`
- **Repository Observation:** No business risk policy recorded. P5A tests used a synthetic 10% (0.10) threshold labeled `OUTLIER THRESHOLD: OWNER / FINANCE / RISK APPROVAL REQUIRED`.
- **Owner Options:**
  - *Option A:* 3% (0.03) — tight corridor for major currency pairs (USD/PHP, EUR/PHP).
  - *Option B:* 5% (0.05) — balanced operational threshold.
  - *Option C:* 10% (0.10) — loose threshold absorbing daily market fluctuations.
- **Enforced Safe Behavior:** Rates deviating beyond tolerance are blocked (`OUTLIER_BLOCKED`) and trigger telemetry alerts.

#### Decision 5: Commercial Rounding Policy (`roundingPolicyRef`)
- **Status:** `NOT APPROVED / NOT FOUND`
- **Repository Observation:** `src/lib/security/financial.ts` uses `ROUND_HALF_UP` for security comparisons. P5A math engine supports `ROUND_HALF_UP`, `ROUND_HALF_EVEN`, `ROUND_FLOOR`, and `ROUND_CEIL`.
- **Owner Options:**
  - *Option A:* `ROUND_HALF_UP` (Standard commercial rounding).
  - *Option B:* `ROUND_HALF_EVEN` (Banker's rounding, minimizing statistical bias over large volumes).
- **Enforced Safe Behavior:** Code defaults to `ROUND_HALF_UP` as a mechanism, but requires formal commercial confirmation.

#### Decision 6: Conversion Fee & Spread Policy (`feePolicyRef`, `spreadPolicyRef`)
- **Status:** `NOT APPROVED / NOT FOUND`
- **Repository Observation:** P5A quote engine enforces `feePolicyRef: 'NONE'` and `spreadPolicyRef: 'NONE'` with zero hidden markup.
- **Owner Options:**
  - *Option A:* Zero markup (`NONE` / 0 basis points) — pure interbank/mid-market presentation.
  - *Option B:* Commercial spread (e.g. 50–150 basis points) to buffer FX exposure upon conversion.
- **Enforced Safe Behavior:** Quotes display zero markup. Commercial spread cannot be applied without explicit owner authorization.

---

### 5. Architectural Invariants Preserved Under Halt

Because the stop rule was triggered:
1. **Zero External Network Connections:** No live HTTP requests are made to unapproved external FX services.
2. **Zero Inferred/Invented Production Policies:** No test fixtures were promoted to production configuration.
3. **Canonical Presentation Integrity:** Marketplace browse cards and listing pages continue displaying authoritative listing prices (`PHP`).
4. **Strict Financial Authority Boundary:**
   - `chargeCurrency` remains strictly immutable `PHP`.
   - Payment gateway integration remains locked to `PHP`.
   - Zero database mutations, zero schema changes, zero database writes.

---

### 6. Lifecycle Gate Status

In accordance with strict RENTipid universal promotion standards, all promotion lifecycle gates remain individually unpromoted:

```
G1  CODE COMPLETE                      — NOT PROMOTED
G2  LOCAL FUNCTIONAL                   — NOT PROMOTED
G3  LOCAL DATABASE MIGRATED            — NOT PROMOTED
G4  LOCAL REQUIRED DATA SEEDED/SYNCED  — NOT PROMOTED
G5  LOCAL ACCEPTANCE PASS              — NOT PROMOTED
G6  PREVIEW MIGRATED                   — NOT PROMOTED
G7  PREVIEW ACCEPTANCE PASS            — NOT PROMOTED
G8  PRODUCTION-READY                   — NOT PROMOTED
G9  PRODUCTION DEPLOYMENT/VERIFICATION — NOT PROMOTED
G10 COMPLETED                          — NOT PROMOTED
G11 ACCEPTED                           — NOT PROMOTED
G12 CLOSED                             — NOT PROMOTED
G13 VERSION FROZEN                     — NOT PROMOTED
```

---

### 7. Historical Decision-Gate Verdict (Preserved)

**HISTORICAL P5B GATE VERDICT (2026-09-26T14:25:00+08:00):**  
`P5B BLOCKED — APPROVED LIVE FX PROVIDER REQUIRED`

**HISTORICAL P5 STATUS:**  
`P5 INCOMPLETE — OWNER FX POLICY DECISIONS REQUIRED`

The decision gate correctly stopped execution and prevented unapproved vendor selection, fixture promotion, or arbitrary network calls.

---

### 8. Subsequent Owner Policy Decisions & Implementation Authorization (2026-09-26)

On 2026-09-26, the Owner formally issued authoritative policy decisions resolving all six unresolved items:

1. **Provider:** CurrencyAPI (Plan: Medium; REST API `GET /v3/latest` with explicit `base_currency` and `currencies`). RENTipid obtains normalized rate and performs exact arithmetic via P5A decimal engine.
2. **Browse TTL:** `300000 ms` (5 minutes). Stale browse estimates fall back to canonical currency without fabricating rates.
3. **Checkout TTL:** `120000 ms` (120 seconds). Domain policy configured and tested; payment foreign charging remains excluded (P6).
4. **Outlier Threshold:** `5.00%` (`0.05`). Rates exceeding 5% deviation from baseline are `OUTLIER_BLOCKED`.
5. **Rounding:** `ROUND_HALF_UP`. Authoritative exponent derived from `CurrencyRegistry`.
6. **Fee / Spread:** `feePolicyRef = 'NONE'`, `spreadPolicyRef = 'NONE'`. Commercial markup: `0` basis points.

**SUBSEQUENT P5B STATUS:**  
`P5B IMPLEMENTATION AUTHORIZED — IN PROGRESS`

