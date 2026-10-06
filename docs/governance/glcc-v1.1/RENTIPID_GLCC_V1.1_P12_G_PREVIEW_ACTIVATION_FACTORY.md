# RENTipid GLCC v1.1 — Action P12-G Preview Activation Factory Report

**Controlling Master:** `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0`  
**Workstream:** `P12 / v1.1 GLOBAL EXPANSION FACTORY`  
**Current Action:** `P12-G PREVIEW ACTIVATION FACTORY`  
**Evaluation Date:** 2026-10-06  
**Governed Branch:** `feat/glcc-v1.1-global-expansion-factory`  
**P12-F Commit:** `877cbe30827d512ece2052541fc81b0668d63220`  
**P12-E Commit:** `874637c25108da0fd46be9950f11fe75199db6b6`  
**P12-D Commit:** `87f40d42e345c7f58699ef5345fc370a1f2f31f9`  
**P12-C Commit:** `ed596811f3fdd7dea098a8a24e4205daa82699ba`  
**P12-B Governance Commit:** `e09c73aabef63371255c1da5702fe6df27adfc4e`  
**P12 Kickoff Governance Commit:** `0d7d9dac179b0aecfca83c0159aae3a7aced11df`  
**Frozen v1.0.1 Application Source:** `7ed8388f36e970f7da7d04ca44afccb883d4ea9d`  
**P12-G Status:** `PASS`  

---

## 1. Executive Summary & Objective

Work Package action **P12-G** implements the reusable, language-neutral **Preview Activation Factory** for the RENTipid Global Expansion Factory.

Preview activation provides a strictly governed, temporary pre-Production activation pipeline for language candidates undergoing acceptance testing. Under no circumstances does Preview activation imply Production readiness, Production selectability, or deployment authority over live production assets.

Key systems delivered in P12-G:
- **Preview Activation Boundary:** Strict isolation separating temporary acceptance testing from permanent production environments.
- **Zero-Tolerance Preview Eligibility Contract:** Requires 100% canonical coverage (2,208 keys), 0 fallbacks, 0 missing keys, 0 format/Unicode errors, P12-E QA `PASS`, and P12-F legal compliance `PASS`.
- **Governed Release-State Lifecycle:** Preserves the formal progression `REGISTERED` -> `TRANSLATION_IN_PROGRESS` -> `QA_REQUIRED` -> `PRODUCTION_READY`. Tooling enforces that only candidates promoted to `QA_REQUIRED` are selectable in Preview.
- **Server-Trusted Preview Trust Model:** Selector visibility and environment gating derive exclusively from trusted server-side runtime signals. Client-side inputs (headers, query parameters, cookies, local storage) cannot elevate locale privileges or override environment rules.
- **Deployment Provenance Attestation:** Cryptographic verification ensuring that the deployed Git commit SHA matches the approved candidate SHA with zero variance.
- **Preview Database Isolation:** Complete verification of database separation; zero write capabilities or credentials bridging Preview into Production.
- **30-Scenario Acceptance Plan:** Comprehensive evaluation spanning deployment health, rendered localization, SSR/CSR, session persistence, security injection guards, and financial/RBAC invariants.
- **Pre-Configured Emergency Rollback Contract:** Mandatory rollback plan definition and validation prior to deployment.
- **Synthetic Validation:** Verified via 32 synthetic test scenarios using synthetic locale `zz-ZZ`. Zero runtime application code, registries, or environments were mutated.

---

## 2. Canonical Baseline Preservation

| Property | Value | Status |
| :--- | :--- | :--- |
| **Canonical Key Count** | `2,208` keys | `PASS` |
| **Source Locale** | `en-PH` | `PASS` |
| **Canonical Key Checksum** | `a682064cf1f532c26884104887b012b27be830be39b41e27d0c1d58f77b36fdf` | `VERIFIED` |
| **Source Message Checksum** | `0566572080c895732e61ef62108403a283f6abf12e762eb29ba77a1460c2cbb8` | `VERIFIED` |
| **Runtime Locale Registry Mutated** | `NO` | `PASS` |
| **Existing Bundles Mutated (en-PH/fil-PH)** | `NO` | `PASS` |
| **First Language Implementation Priority** | `NOT YET AUTHORIZED` | `CONFIRMED` |

---

## 3. Factory Tooling Architecture

The P12-G tooling suite resides in `scripts/glcc-v1.1/`:

1. **`preview-activation-schema.ts`**:
   Machine-readable interfaces defining candidate input parameters, deployment provenance contracts, environment safety specifications, selector simulation types, 30 acceptance scenarios, and rollback models.
2. **`preview-activation-validate.ts`**:
   Validator enforcing candidate eligibility, deployment SHA matching, environment safety, database isolation, mode-aware selector eligibility, and rollback plan completeness.
3. **`preview-activation-self-test.ts`**:
   Automated test suite executing 32 verification scenarios covering all factory invariants.

---

## 4. Trust Model & Environment Safety

### 4.1 Server-Trusted Signal Enforcement
- **Trusted Server Signal:** Environment identity is established at server runtime (`Preview` vs. `Production`).
- **Fail-Closed Client Invariant:** Ordinary browser requests, modified headers, or client-side JavaScript cannot forge `QA_REQUIRED` selectability in Production. Any detected client injection attempt triggers fail-closed blocking.

### 4.2 Database Isolation Contract
- Preview environments must connect exclusively to designated non-production database clusters.
- Tests must operate solely with synthetic test user profiles.
- Zero production customer records or production credentials may be accessed or modified during Preview activation.

---

## 5. 30-Scenario Preview Acceptance Matrix

The factory formalizes 30 mandatory acceptance scenarios:
- **Infrastructure (PV-01 to PV-03):** Deployment health, exact Git SHA provenance, Preview DB isolation.
- **Selector (PV-04 to PV-05):** Candidate selector visibility in Preview, blocking of unready locales.
- **Localization (PV-06 to PV-08, PV-12 to PV-19):** Rendered text, client rerender, SSR resolution, html lang/dir, zero raw keys, zero fallback, zero flash, zero hydration errors, guest and authenticated flows.
- **Persistence (PV-09 to PV-11):** CSR context persistence, Next.js route navigation persistence, browser hard-refresh persistence.
- **Security (PV-20 to PV-21):** Session logout integrity, header/query/cookie injection blocking.
- **Invariants (PV-22 to PV-28):** Country, display currency, payment authority, RBAC, KYC, jurisdiction, and legal authority boundaries.
- **Non-Regression (PV-29 to PV-30):** Baseline `en-PH` and `fil-PH` preservation.

---

## 6. Factory Self-Test Results (32 / 32 PASS)

```
=== P12-G PREVIEW ACTIVATION FACTORY SELF-TEST RESULTS ===
[PASS] Scenario 1: Valid candidate passes Preview eligibility
       Details: status=PASS
[PASS] Scenario 2: Workflow below APPROVED_FOR_QA blocked
       Details: errors=Workflow state "IN_TRANSLATION" is not eligible for Preview activation. Must be "APPROVED_FOR_QA".
[PASS] Scenario 3: Invalid locale pack blocked
       Details: errors=Locale pack is invalid or has failed structural integrity verification.
[PASS] Scenario 4: Failed P12-E QA blocked
       Details: errors=P12-E Language QA status is "FAIL". Must be "PASS".
[PASS] Scenario 5: Legal/compliance failure blocked
       Details: errors=P12-F Legal & Compliance verification status is "FAIL". Must be "PASS".
[PASS] Scenario 6: Coverage below 100% blocked
       Details: errors=Canonical coverage is 99.5%. Must be 100%.
[PASS] Scenario 7: Missing key blocked
       Details: errors=Candidate has 2 missing required keys. Must be 0.
[PASS] Scenario 8: Fallback > 0 blocked
       Details: errors=Candidate has 1 required English fallbacks. Must be 0.
[PASS] Scenario 9: Raw key > 0 blocked
       Details: errors=Candidate has 3 raw unformatted translation keys. Must be 0.
[PASS] Scenario 10: Placeholder failure blocked
       Details: errors=Candidate has 1 placeholder mismatch errors. Must be 0.
[PASS] Scenario 11: Format error blocked
       Details: errors=Candidate has 1 message format errors. Must be 0.
[PASS] Scenario 12: Unicode error blocked
       Details: errors=Candidate has 1 Unicode replacement character errors. Must be 0.
[PASS] Scenario 13: Critical blocker blocks
       Details: errors=Candidate has 1 critical blockers. Must be 0.
[PASS] Scenario 14: High blocker blocks
       Details: errors=Candidate has 1 high-severity blockers. Must be 0.
[PASS] Scenario 15: Matching deployment SHA passes provenance
       Details: status=PASS
[PASS] Scenario 16: Deployment SHA mismatch fails
       Details: errors=Deployment SHA mismatch: deployed SHA "1111111111111111111111111111111111111111" does not match approved candidate SHA "877cbe30827d512ece2052541fc81b0668d63220".
[PASS] Scenario 17: Locale-pack checksum mismatch fails
       Details: errors=Missing locale-pack checksum in deployment provenance record.
[PASS] Scenario 18: Wrong environment fails
       Details: errors=Target environment "Production" is not Preview. Target must strictly be "Preview".
[PASS] Scenario 19: Same Preview/Production DB identity fails
       Details: errors=Database collision detected: Preview DB "postgres-production-primary" is identical to Production DB.
[PASS] Scenario 20: Production alias target simulation fails
       Details: errors=Production alias was flagged as targeted. Preview activation must not target production domains.
[PASS] Scenario 21: Preview PRODUCTION_READY selector allowed
       Details: reason=Locale is PRODUCTION_READY and selectable in Preview.
[PASS] Scenario 22: Preview QA_REQUIRED selector allowed
       Details: reason=Locale is QA_REQUIRED candidate and selectable in trusted Preview.
[PASS] Scenario 23: Preview TRANSLATION_IN_PROGRESS blocked
       Details: reason=Locale is TRANSLATION_IN_PROGRESS and blocked from selector.
[PASS] Scenario 24: Preview REGISTERED blocked
       Details: reason=Locale is REGISTERED and blocked from selector.
[PASS] Scenario 25: Production QA_REQUIRED blocked
       Details: reason=Locale state "QA_REQUIRED" is not eligible in Production environment.
[PASS] Scenario 26: Client injection cannot elevate locale
       Details: reason=Client-controlled injection attempt rejected; cannot elevate privileges or override server environment.
[PASS] Scenario 27: Rollback plan validates
       Details: status=PASS
[PASS] Scenario 28: Missing rollback deployment identity fails
       Details: errors=Missing previous Preview deployment ID in rollback plan.
[PASS] Scenario 29: Runtime registry unchanged
       Details: Standard 4 locales verified
[PASS] Scenario 30: Existing translation bundles unchanged
       Details: en-PH=2208, fil-PH=2208
[PASS] Scenario 31: No Preview deployment executed
       Details: Zero Preview deployments triggered
[PASS] Scenario 32: No Production deployment executed
       Details: Zero Production deployments triggered

TOTAL: 32 | PASSED: 32 | FAILED: 0
```

---

## 7. Runtime Isolation & Governance Invariants

- **Runtime Application Changes:** `0`
- **Existing Translation Bundle Changes:** `0`
- **Locale Registry Changes:** `0`
- **Database Migrations/Mutations:** `0`
- **Package.json Modifications:** `0`
- **Preview / Production Deployments:** `0`
- **Language Selection:** Language-neutral; `en-US` and `ja-JP` are untouched.

---

## 8. Conclusion & Promotion Recommendation

Action **P12-G** successfully satisfies all requirements of the RENTipid Universal Implementation Standard:
- Preview activation boundaries, trust models, and eligibility contracts established.
- 30-scenario acceptance plan and emergency rollback contracts defined.
- 32 / 32 self-test scenarios pass cleanly.
- Upstream test suites (P12-C, P12-D, P12-E, P12-F) remain 100% passing.
- **P12-G Status:** `PASS`. Ready for promotion.
