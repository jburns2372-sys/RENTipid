# RENTipid GLCC v1.1 — Governed Preview Activation Template

**Controlling Master:** `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0`  
**Workstream:** `P12 / v1.1 GLOBAL EXPANSION FACTORY`  
**Document:** `PREVIEW ACTIVATION TEMPLATE`  
**Target Locale:** `[LOCALE_TAG]`  
**Activation Candidate State:** `CANDIDATE_FOR_QA`  
**Target Release State:** `QA_REQUIRED`  
**Preview Deployment ID:** `[PREVIEW_DEPLOYMENT_ID]`  
**Preview Deployment URL:** `[PREVIEW_DEPLOYMENT_URL]`  
**Governed Git Commit SHA:** `[GIT_COMMIT_SHA]`  
**Overall Acceptance Status:** `[NOT_RUN / RUNNING / PASS / FAIL / BLOCKED]`  

---

## 1. Candidate Eligibility Verification

Before initiating any Preview deployment, verify that all prerequisites from prior factories are met:

- [ ] **P12-C Work Package:** Translation package sealed with `workflowState: "APPROVED_FOR_QA"`.
- [ ] **P12-D Locale Pack:** Pack validated with zero missing keys, zero extra keys, valid format.
- [ ] **P12-E Language QA:** 24-domain QA completed with status `PASS`.
- [ ] **P12-F Legal & Compliance:** Class C controlled content approved and verified with status `PASS`.
- [ ] **Zero-Tolerance Quality Invariants:**
  - Canonical coverage: `100% (2,208 / 2,208 keys)`
  - Missing required keys: `0`
  - Required fallbacks: `0`
  - Raw unformatted keys: `0`
  - Placeholder errors: `0`
  - Format / Unicode errors: `0`
  - Critical / high blockers: `0`

---

## 2. Trusted Server-Side Preview Trust Model

Preview QA activation operates under a strict server-trusted security model:

```
[Server Runtime Environment]
         │
         ├──▶ Mode: PREVIEW (Trusted Server Signal)
         │        ├── PRODUCTION_READY: Selectable
         │        ├── QA_REQUIRED: Selectable
         │        ├── TRANSLATION_IN_PROGRESS: Blocked
         │        └── REGISTERED: Blocked
         │
         └──▶ Mode: PRODUCTION (Strict Enforcement)
                  ├── PRODUCTION_READY: Selectable
                  └── All other states: Blocked (Fail-Closed)

[Untrusted Client Signals]
         └──▶ Query Params / Cookies / LocalStorage / Request Headers
                  └── Programmatically blocked from elevating privileges
```

---

## 3. Environment & Database Isolation Contract

Preview activation requires absolute isolation from Production infrastructure:

1. **Environment Identity:** Deployment target must strictly be Vercel `Preview`. Production deployments are prohibited.
2. **Database Isolation:** Preview database identity must be completely separate from Production database pools. No cross-connection or shared tables.
3. **Write Isolation:** Preview transactions, user registrations, and sessions must never mutate Production database records.
4. **Credential Boundaries:** Production secrets and service keys must never be injected into or accessible by Preview environments.
5. **Test Accounts Only:** All acceptance testing must be executed using designated synthetic test accounts.

---

## 4. Deployment Provenance Specification

Every candidate deployment must be cryptographically attested:

```json
{
  "candidateGitSha": "[40_CHAR_APPROVED_SHA]",
  "deployedGitSha": "[40_CHAR_DEPLOYED_SHA]",
  "branch": "feat/glcc-v1.1-global-expansion-factory",
  "deploymentId": "dpl_preview_candidate_xyz",
  "deploymentUrl": "https://rentipid-preview-[locale].vercel.app",
  "previewAlias": "rentipid-preview-[locale].vercel.app",
  "buildRuntimeVersion": "v1.1.0-preview",
  "localeTag": "[LOCALE_TAG]",
  "localePackChecksum": "[SHA256_PACK_CHECKSUM]",
  "translationPackageChecksum": "[SHA256_PACKAGE_CHECKSUM]",
  "qaEvidenceReference": "p12-e-[locale]-qa.json",
  "legalEvidenceReference": "p12-f-[locale]-legal.json"
}
```

*Rule: `deployedGitSha` must match `candidateGitSha` with zero tolerance.*

---

## 5. 30-Scenario Preview Acceptance Matrix

Every activated candidate must pass all 30 acceptance scenarios:

| Scenario ID | Name | Category | Scope / Evaluation | Status |
| :--- | :--- | :--- | :--- | :---: |
| **PV-01** | Deployment Health | Infrastructure | HTTP 200 on deployment root and health endpoint | `[PASS/FAIL]` |
| **PV-02** | Exact Deployment Provenance | Infrastructure | Deployed git SHA matches approved candidate SHA | `[PASS/FAIL]` |
| **PV-03** | Preview DB Isolation | Infrastructure | Preview DB verified distinct from Production DB | `[PASS/FAIL]` |
| **PV-04** | Candidate Selector Visibility | Selector | Candidate locale visible in language selector | `[PASS/FAIL]` |
| **PV-05** | Non-Eligible Locale Blocking | Selector | REGISTERED and TRANSLATION_IN_PROGRESS hidden | `[PASS/FAIL]` |
| **PV-06** | Actual Rendered Localization | Localization | DOM elements render candidate translation strings | `[PASS/FAIL]` |
| **PV-07** | Immediate Client Rerender | Localization | Instant UI update upon language switch | `[PASS/FAIL]` |
| **PV-08** | SSR Locale Resolution | Localization | Server components parse Accept-Language and cookie | `[PASS/FAIL]` |
| **PV-09** | CSR Persistence | Persistence | React context maintains state across user actions | `[PASS/FAIL]` |
| **PV-10** | Route Persistence | Persistence | Language persists across Next.js client navigation | `[PASS/FAIL]` |
| **PV-11** | Hard-Refresh Persistence | Persistence | Browser hard reload (Ctrl+F5) preserves locale | `[PASS/FAIL]` |
| **PV-12** | Correct HTML Lang | Localization | `<html lang="[tag]">` matches active locale | `[PASS/FAIL]` |
| **PV-13** | Correct Direction | Localization | `<html dir="ltr|rtl">` matches text direction | `[PASS/FAIL]` |
| **PV-14** | Raw Keys = 0 | Localization | Zero unformatted translation keys rendered in UI | `[PASS/FAIL]` |
| **PV-15** | Required Fallback = 0 | Localization | Zero required fallbacks to English | `[PASS/FAIL]` |
| **PV-16** | Source-Language Flash = 0 | Localization | Zero visible flash of unlocalized content | `[PASS/FAIL]` |
| **PV-17** | Hydration Warnings = 0 | Localization | Zero React SSR/CSR hydration mismatch warnings | `[PASS/FAIL]` |
| **PV-18** | Guest Flow | Localization | Unauthenticated guest users experience full UI | `[PASS/FAIL]` |
| **PV-19** | Authenticated Flow | Localization | User profile preference syncs with candidate locale | `[PASS/FAIL]` |
| **PV-20** | Logout / Session Integrity | Security | Session termination preserves appropriate fallback | `[PASS/FAIL]` |
| **PV-21** | Locale Injection Blocked | Security | Header, query, and cookie injection attempts blocked | `[PASS/FAIL]` |
| **PV-22** | Country Independence | Invariants | Country properties invariant to language | `[PASS/FAIL]` |
| **PV-23** | Display-Currency Independence | Invariants | Display currency decoupled from language | `[PASS/FAIL]` |
| **PV-24** | Charge-Currency / Payment Authority | Invariants | Checkout currency and payment gateways invariant | `[PASS/FAIL]` |
| **PV-25** | RBAC Independence | Invariants | Role permissions invariant to language | `[PASS/FAIL]` |
| **PV-26** | KYC Independence | Invariants | Verification authority invariant to language | `[PASS/FAIL]` |
| **PV-27** | Jurisdiction Independence | Invariants | Legal jurisdiction invariant to language | `[PASS/FAIL]` |
| **PV-28** | Legal / Compliance Authority | Invariants | Class C disclosures cite accredited legal version | `[PASS/FAIL]` |
| **PV-29** | en-PH Non-Regression | Non-Regression | Zero regression on baseline English (Philippines) | `[PASS/FAIL]` |
| **PV-30** | fil-PH Non-Regression | Non-Regression | Zero regression on baseline Wikang Filipino | `[PASS/FAIL]` |

---

## 6. Governed Rollback Contract

Before deployment, a complete rollback plan must be defined and validated:

```json
{
  "targetLocaleTag": "[LOCALE_TAG]",
  "previousPreviewDeploymentId": "[STABLE_PREVIEW_DEPLOYMENT_ID]",
  "previousApprovedSourceSha": "[PREVIOUS_SOURCE_SHA]",
  "previousLocaleState": "TRANSLATION_IN_PROGRESS",
  "previousAliasTarget": "rentipid-preview-stable.vercel.app",
  "triggerConditions": [
    "HEALTH_CHECK_FAILURE",
    "PROVENANCE_SHA_MISMATCH",
    "RENDER_ERROR_EXCEEDING_THRESHOLD",
    "SECURITY_INJECTION_DETECTED",
    "DATABASE_ISOLATION_BREACH"
  ],
  "rollbackVerificationSteps": [
    "Re-route preview domain alias to previousPreviewDeploymentId",
    "Verify HTTP 200 on baseline health check",
    "Confirm candidate locale is not selectable",
    "Audit database logs for cross-boundary writes"
  ]
}
```

---

## 7. Evidence Set & Handoff to Action P12-H

Upon successful completion of all 30 acceptance scenarios:
1. Compile evidence files:
   - `preview-activation-request.json`
   - `preview-deployment-provenance.json`
   - `preview-environment-isolation.json`
   - `preview-acceptance-results.json`
   - `preview-rollback-plan.json`
2. Generate governance acceptance markdown report.
3. Handoff certified Preview candidate to **Action P12-H: Production Readiness Factory**.
