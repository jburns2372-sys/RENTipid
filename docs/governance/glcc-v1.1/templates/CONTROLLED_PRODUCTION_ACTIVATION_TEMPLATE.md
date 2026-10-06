# RENTipid GLCC v1.1 — Controlled Production Activation Governance Template

**Controlling Master:** `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0`  
**Workstream:** `P12 / v1.1 GLOBAL EXPANSION FACTORY`  
**Document:** `CONTROLLED PRODUCTION ACTIVATION TEMPLATE`  
**Target Locale:** `[LOCALE_TAG]`  
**Activation Authorization ID:** `[AUTHORIZATION_ID]`  
**Approved Production Source SHA:** `[APPROVED_GIT_SHA]`  
**Target Release State:** `PRODUCTION_READY`  
**Target Production Domain:** `rentipid.com`  
**Final Activation Status:** `[ACTIVATION_PLANNED / ACTIVATION_AUTHORIZED / DEPLOYING / VERIFYING / PROMOTED / ROLLED_BACK / FAILED]`  

---

## 1. Activation Authorization Contract

Production activation is strictly prohibited without formal authorization recorded prior to deployment:

```json
{
  "authorizationId": "AUTH-GLCC-PROD-[LOCALE]-2026-001",
  "localeTag": "[LOCALE_TAG]",
  "candidateGitSha": "[40_CHAR_APPROVED_SHA]",
  "localePackChecksum": "[SHA256_PACK_CHECKSUM]",
  "translationPackageChecksum": "[SHA256_PACKAGE_CHECKSUM]",
  "productionReadinessEvidenceReference": "p12-h-[locale]-readiness.json",
  "authorizedProductionChangeSet": [
    "src/lib/glcc/i18n/locales/[locale].ts",
    "src/lib/glcc/default-registries.ts"
  ],
  "authorizedReleaseStateTransition": {
    "from": "QA_REQUIRED",
    "to": "PRODUCTION_READY"
  },
  "authorizerIdentity": "RENTipid Governance Board",
  "authorizedTimestamp": "2026-10-06T00:00:00Z"
}
```

---

## 2. Activation Preconditions Verification

Before deployment begins, verify the following strict entry preconditions:

- [ ] **Authorization:** Formal authorization artifact present and signed.
- [ ] **Readiness State:** P12-H evaluation resulted in `READY`.
- [ ] **Candidate State:** Candidate locale release state is strictly `QA_REQUIRED`.
- [ ] **Preview Acceptance:** P12-G Preview acceptance completed with status `PASS`.
- [ ] **Canonical Coverage:** 100% (`2,208 / 2,208` keys).
- [ ] **Defect Gates:** Zero missing keys, zero fallbacks, zero raw keys, zero critical/high blockers.
- [ ] **Legal / Compliance:** Class C content verified with status `PASS`.
- [ ] **Auth Verification:** Non-customer test identity available and accredited.
- [ ] **Rollback Plan:** Emergency rollback plan validated.
- [ ] **Change-Set Lock:** No files modified beyond declared and locked change set.

---

## 3. Governed 12-Step Activation Sequence

Production activation must follow this mandatory sequence:

```
[STEP 1] Verify Authorization
    │
[STEP 2] Verify Clean Approved Candidate Git SHA
    │
[STEP 3] Verify Exact Declared Production Change Set (Change-Set Lock)
    │
[STEP 4] Verify Production Environment Identity (rentipid.com / Vercel Production)
    │
[STEP 5] Verify Production Database Plan (Zero Undeclared Migrations/Seeds)
    │
[STEP 6] Verify Emergency Rollback Target & Reversion Procedure
    │
[STEP 7] Apply Authorized Release-State Change (QA_REQUIRED -> PRODUCTION_READY)
    │
[STEP 8] Deploy Exact Approved Candidate to Production
    │
[STEP 9] Verify Deployment Provenance (Deployed SHA === Approved SHA)
    │
[STEP 10] Execute 34-Scenario Production Verification Plan (PR-01 to PR-34)
    │
    ├──▶ If ALL 34 PASS ────────────▶ [STEP 11] Status: PROMOTED (Final Closure)
    │
    └──▶ If ANY SCENARIO FAILS ─────▶ [STEP 12] Execute Emergency Rollback -> ROLLED_BACK
```

---

## 4. Release-State Transition Control

The only permitted final production transition is:

$$\text{QA\_REQUIRED} \longrightarrow \text{PRODUCTION\_READY}$$

### Prohibited / Blocked Transitions:
- $\text{REGISTERED} \longrightarrow \text{PRODUCTION\_READY}$ (BLOCKED)
- $\text{TRANSLATION\_IN\_PROGRESS} \longrightarrow \text{PRODUCTION\_READY}$ (BLOCKED)
- $\text{REGISTERED} \longrightarrow \text{QA\_REQUIRED}$ without full P12-C..P12-F pipeline (BLOCKED)

---

## 5. Exact-SHA Deployment Contract & Change-Set Lock

1. **SHA Equivalence:** `deployedGitSha === authorizedCandidateGitSha`. Mismatch aborts activation immediately.
2. **Change-Set Lock:** Once authorization is issued, the file diff is frozen. Any subsequent code, dependency, or schema mutation invalidates authorization and requires re-evaluation under P12-H.
3. **Database Control:** If `migrationRequired: false` and `seedSyncRequired: false`, any database interaction is strictly blocked.

---

## 6. Post-Deployment Verification (PR-01 through PR-34)

Execute all 34 verification scenarios against the live Production environment:

- **PR-01..PR-04:** Infrastructure (Deployment health, exact SHA provenance, Production DB identity, Production environment).
- **PR-05..PR-06:** Selector (Target language visible in selector, non-ready languages blocked).
- **PR-07..PR-16:** Localization (Rendered strings, immediate rerender, route persistence, hard refresh, html lang/dir, 0 raw keys, 0 fallbacks, 0 flash, 0 hydration warnings).
- **PR-17..PR-22:** Authentication (Guest flow, authenticated login, authenticated dashboard rendering, route persistence, hard refresh, logout session integrity).
- **PR-23..PR-24:** Security (Locale injection blocked, production QA mode disabled).
- **PR-25..PR-32:** System Boundaries (Country, display currency, charge currency/payment authority, financial authority, RBAC, KYC, jurisdiction, legal authority).
- **PR-33..PR-34:** Non-Regression (`en-PH` and `fil-PH` baselines preserved).

---

## 7. Promotion vs. Rollback Decision Rule

### Promotion Rule:
- Condition: All 34 verification scenarios report `PASS`.
- Action: Finalize state as `PROMOTED`.
- Locale Status: Fully active and selectable on `rentipid.com`.

### Automatic Rollback Rule:
- Condition: Any scenario reports `FAIL`, `BLOCKED`, or `NOT_RUN`.
- Action: Execute immediate automated rollback.
- Reversion Target: Previous stable deployment ID and Git SHA.
- Restored Locale State: Revert candidate to `QA_REQUIRED`.
- Failure Record: Generate immutable `production-rollback-execution.json`.

---

## 8. Rollback Execution Specification

```json
{
  "targetDeploymentId": "[STABLE_PREVIOUS_PROD_DEPLOYMENT_ID]",
  "targetSourceSha": "[STABLE_PREVIOUS_PROD_SOURCE_SHA]",
  "targetAlias": "rentipid.com",
  "restoredLocaleState": "QA_REQUIRED",
  "rollbackTriggerReason": "[EXACT_FAILURE_DESCRIPTION]",
  "rollbackExecutionStatus": "SUCCESS",
  "verificationStatus": "PASS",
  "executedAt": "2026-10-06T00:00:00Z"
}
```

---

## 9. Evidence Retention & Handoff to Action P12-J

Upon activation completion (either `PROMOTED` or `ROLLED_BACK`):
1. Assemble complete governance evidence package:
   - `production-activation-authorization.json`
   - `production-activation-precheck.json`
   - `production-release-state-transition.json`
   - `production-deployment-provenance.json`
   - `production-verification-results.json`
   - `production-promotion-decision.json`
   - *(If rolled back)* `production-rollback-execution.json`
2. Formally handoff evidence to **Action P12-J: Acceptance, Closure & Factory Freeze**.
