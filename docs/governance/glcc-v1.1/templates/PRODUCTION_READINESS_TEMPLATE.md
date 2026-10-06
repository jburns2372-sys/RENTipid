# RENTipid GLCC v1.1 — Production Readiness Governance Template

**Controlling Master:** `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0`  
**Workstream:** `P12 / v1.1 GLOBAL EXPANSION FACTORY`  
**Document:** `PRODUCTION READINESS TEMPLATE`  
**Target Locale:** `[LOCALE_TAG]`  
**Current Release State:** `QA_REQUIRED`  
**Proposed Release State:** `PRODUCTION_READY` (Requires separate governed activation in P12-I)  
**Readiness Evaluation State:** `[NOT_EVALUATED / EVALUATING / READY / NOT_READY / BLOCKED]`  
**Target Production Domain:** `rentipid.com`  

---

## 1. Production Readiness Entry Criteria

A candidate language may enter Production-Readiness evaluation only when all pre-production gates have achieved certified `PASS`:

- [ ] **P12-C Work Package:** Sealed with `workflowState: "APPROVED_FOR_QA"`.
- [ ] **P12-D Locale Pack:** Valid structural compilation, zero formatting/Unicode defects.
- [ ] **P12-E Language QA:** 24-domain language QA passed with zero blockers.
- [ ] **P12-F Legal & Compliance:** Class C controlled content approved and verified.
- [ ] **P12-G Preview Acceptance:** All 30 Preview scenarios passed on isolated Preview infrastructure.
- [ ] **Baseline Preservation:** Canonical coverage: `100% (2,208 / 2,208)`, fallbacks: `0`, raw keys: `0`, critical blockers: `0`, high blockers: `0`.
- [ ] **Non-Regression:** Non-regression verified for `en-PH` and `fil-PH`.

---

## 2. Readiness Evaluation State Model

Readiness evaluation utilizes an explicit 5-state model:

```
[NOT_EVALUATED] ──▶ [EVALUATING] ──┬──▶ [READY] ──▶ (Eligible for P12-I Activation)
                                    ├──▶ [NOT_READY]
                                    └──▶ [BLOCKED]
```

*Note: Achieving `READY` does not promote the locale to `PRODUCTION_READY` or deploy to Production. A separate, authorized activation action (P12-I) is mandatory.*

---

## 3. Production Change-Set & Minimal-Change Contract

Every Production release must declare the exact, minimal set of changes required:

| Change Category | Status | Target Path / Scope | Justification |
| :--- | :---: | :--- | :--- |
| **Runtime Source** | `[NOT_REQUIRED/REQUIRED]` | `src/...` | Specific bug fix if applicable |
| **Translation Bundle** | `[REQUIRED]` | `src/lib/glcc/i18n/locales/[tag].ts` | Install compiled locale dictionary |
| **Locale Registry** | `[REQUIRED]` | `src/lib/glcc/default-registries.ts` | Register locale / promote status |
| **Release Metadata** | `[REQUIRED]` | Release status: `PRODUCTION_READY` | Make locale selectable in Production |
| **Environment Config** | `[NOT_REQUIRED]` | Environment variables | Zero mutations permitted |
| **Database Migration** | `[NOT_REQUIRED]` | Prisma schema / migrations | Zero mutations permitted |
| **Database Seed/Sync** | `[NOT_REQUIRED]` | Database records | Zero mutations permitted |
| **Deployment Config** | `[NOT_REQUIRED]` | Vercel settings / build scripts | Zero mutations permitted |

*Rule: Unrelated runtime changes, unexpected database alterations, or dependency changes strictly block readiness.*

---

## 4. Production Environment Safety & Database Isolation

1. **Environment Identity:** Must strictly target Vercel `Production` (`rentipid.com`).
2. **Database Integrity:** Must confirm that no schema alterations or destructive seed commands are executed.
3. **Secret Protection:** Secrets, API keys, and private tokens must never be logged, printed, or committed in evidence files.
4. **Credential Boundaries:** Preview test credentials must never be reused with elevated Production authority.
5. **Fail-Closed QA Mode:** Production environment must enforce `productionQaModeEnabled: false`.

---

## 5. Production Selector & Trust Boundary Contract

Production language selector behavior is strictly fail-closed:

```
Production Environment (rentipid.com):
├── PRODUCTION_READY: Selectable
├── QA_REQUIRED: Blocked (Hidden)
├── TRANSLATION_IN_PROGRESS: Blocked (Hidden)
└── REGISTERED: Blocked (Hidden)

Client-Side Signals:
└── Headers, Cookies, Query Params, LocalStorage cannot elevate unreleased locales.
```

---

## 6. Deployment Provenance Specification

Every production deployment candidate must be attested cryptographically:

```json
{
  "candidateGitSha": "[40_CHAR_APPROVED_SHA]",
  "deployedGitSha": "[40_CHAR_DEPLOYED_SHA]",
  "deploymentId": "dpl_prod_release_xyz",
  "deploymentUrl": "https://rentipid.com",
  "productionAlias": "rentipid.com",
  "localeTag": "[LOCALE_TAG]",
  "localePackChecksum": "[SHA256_PACK_CHECKSUM]",
  "translationPackageChecksum": "[SHA256_PACKAGE_CHECKSUM]",
  "previewAcceptanceEvidence": "p12-g-preview-activation-factory.json",
  "productionReadinessEvidence": "p12-h-production-readiness-factory.json",
  "legalComplianceApprovalEvidence": "p12-f-legal-compliance-translation-control.json"
}
```

---

## 7. Authentication Smoke Verification Contract

Production acceptance must be conducted using a pre-approved, non-customer test identity:
- **Least-Privilege Principle:** Identity granted minimum permissions necessary for smoke testing.
- **Credential Safety:** Credentials must never appear in repository artifacts or governance JSON.
- **Required Smoke Scenarios:**
  1. `login`: Test account login on production endpoint.
  2. `session`: Session token established without privilege leakage.
  3. `preferences`: Language selection updated via Global Preferences modal.
  4. `rendering`: Target language rendered across authenticated dashboards.
  5. `route`: Navigation across authenticated routes preserves selected language.
  6. `hard_refresh`: Browser reload retains target language.
  7. `logout`: Clean logout without session corruption.

---

## 8. System Authority & Boundary Preservation

Language releases must remain strictly decoupled from core business systems:
- **Financial Authority:** Charge currency (PHP), exchange rate conversion, payment gateways, payment routing, and settlement invariant.
- **RBAC / KYC Authority:** User roles, permission matrices, KYC verification rules, and administrator tiers invariant.
- **Jurisdiction Authority:** Statutory jurisdiction invariant to user language selection.
- **Legal Authority:** Class C terms and compliance documents must preserve accredited legal versioning and formal review references.

---

## 9. Governed Production Rollback Readiness

A validated rollback plan must exist prior to production deployment:

```json
{
  "targetLocaleTag": "[LOCALE_TAG]",
  "currentProductionDeploymentId": "[STABLE_PREVIOUS_PROD_DEPLOYMENT_ID]",
  "currentProductionSourceSha": "[STABLE_PREVIOUS_PROD_SOURCE_SHA]",
  "currentLocaleReleaseState": "QA_REQUIRED",
  "currentAliasTarget": "rentipid.com",
  "databaseRollbackProcedure": "No-op (zero schema/data mutations)",
  "environmentRollbackProcedure": "Re-point production domain alias to currentProductionDeploymentId",
  "triggerConditions": [
    "HEALTH_ENDPOINT_5XX",
    "UNEXPECTED_SELECTOR_EXPOSURE",
    "RENDER_ERROR_SURGE",
    "FINANCIAL_CALCULATION_DRIFT",
    "RBAC_BOUNDARY_FAILURE"
  ],
  "postRollbackVerificationSteps": [
    "Verify HTTP 200 on production homepage",
    "Verify target language is not visible in selector",
    "Confirm zero residual session anomalies"
  ]
}
```

---

## 10. 34-Scenario Production Verification Plan

Every production candidate must be evaluated against the complete 34-scenario matrix:

| Scenario ID | Name | Category | Scope / Evaluation | Status |
| :--- | :--- | :--- | :--- | :---: |
| **PR-01** | Deployment Health | Infrastructure | HTTP 200 on production root and health check | `[PASS/FAIL]` |
| **PR-02** | Exact Source Provenance | Infrastructure | Deployed commit SHA matches approved candidate SHA | `[PASS/FAIL]` |
| **PR-03** | Production DB Identity | Infrastructure | Verified connected to approved Production primary DB | `[PASS/FAIL]` |
| **PR-04** | Production Environment Identity | Infrastructure | Server reports NODE_ENV=production | `[PASS/FAIL]` |
| **PR-05** | Target Selector Visibility | Selector | Target language selectable once promoted to PRODUCTION_READY | `[PASS/FAIL]` |
| **PR-06** | Non-Ready Languages Blocked | Selector | QA_REQUIRED, TRANSLATION_IN_PROGRESS, and REGISTERED hidden | `[PASS/FAIL]` |
| **PR-07** | Actual Rendered Localization | Localization | DOM nodes reflect accurate production translation strings | `[PASS/FAIL]` |
| **PR-08** | Immediate Rerender | Localization | UI language updates instantly upon selection | `[PASS/FAIL]` |
| **PR-09** | Route Persistence | Persistence | Selected locale persists across internal Next.js navigation | `[PASS/FAIL]` |
| **PR-10** | Hard Refresh Persistence | Persistence | Locale selection survives browser hard reload (Ctrl+F5) | `[PASS/FAIL]` |
| **PR-11** | Correct HTML Lang | Localization | Root `<html>` lang attribute matches active locale tag | `[PASS/FAIL]` |
| **PR-12** | Correct Direction | Localization | Root `<html>` dir attribute renders ltr or rtl correctly | `[PASS/FAIL]` |
| **PR-13** | Raw Keys = 0 | Localization | Zero unformatted translation keys rendered in UI | `[PASS/FAIL]` |
| **PR-14** | Required Fallback = 0 | Localization | Zero required fallbacks to English for canonical keys | `[PASS/FAIL]` |
| **PR-15** | Source-Language Flash = 0 | Localization | Zero visible flash of unlocalized content during render | `[PASS/FAIL]` |
| **PR-16** | Hydration Warnings = 0 | Localization | Zero React SSR/CSR hydration mismatch warnings | `[PASS/FAIL]` |
| **PR-17** | Guest Behavior | Auth | Anonymous guest users experience full localized UI | `[PASS/FAIL]` |
| **PR-18** | Authenticated Login | Auth | Test account authenticates successfully with non-customer credentials | `[PASS/FAIL]` |
| **PR-19** | Authenticated Rendering | Auth | Authenticated dashboard renders in target language | `[PASS/FAIL]` |
| **PR-20** | Authenticated Route Persistence | Persistence | Locale selection persists across authenticated routes | `[PASS/FAIL]` |
| **PR-21** | Authenticated Hard Refresh | Persistence | Hard refresh preserves authenticated user locale preference | `[PASS/FAIL]` |
| **PR-22** | Logout | Auth | Logout preserves valid default language without session corruption | `[PASS/FAIL]` |
| **PR-23** | Locale Injection Blocked | Security | Header, query parameter, and cookie injection attempts blocked | `[PASS/FAIL]` |
| **PR-24** | Production QA Mode Disabled | Security | QA testing mode and candidate overrides disabled / fail-closed | `[PASS/FAIL]` |
| **PR-25** | Country Independence | Invariants | Host property and user countries invariant to language | `[PASS/FAIL]` |
| **PR-26** | Display-Currency Independence | Invariants | Display currency decoupled from language selection | `[PASS/FAIL]` |
| **PR-27** | Charge-Currency / Payment Authority | Invariants | Checkout charge currency and gateways invariant | `[PASS/FAIL]` |
| **PR-28** | Financial Authority Integrity | Invariants | Fees, ledger, settlements, and refund rules invariant | `[PASS/FAIL]` |
| **PR-29** | RBAC Independence | Invariants | Role permissions and access controls invariant to language | `[PASS/FAIL]` |
| **PR-30** | KYC Independence | Invariants | Identity verification requirements and authority invariant | `[PASS/FAIL]` |
| **PR-31** | Jurisdiction Independence | Invariants | Statutory governing jurisdiction invariant to language | `[PASS/FAIL]` |
| **PR-32** | Legal / Compliance Authority | Invariants | Class C disclosures cite accredited legal versioning | `[PASS/FAIL]` |
| **PR-33** | en-PH Non-Regression | Non-Regression | Zero regression on baseline English (Philippines) locale | `[PASS/FAIL]` |
| **PR-34** | fil-PH Non-Regression | Non-Regression | Zero regression on baseline Wikang Filipino locale | `[PASS/FAIL]` |

---

## 11. Handoff to Action P12-I: Controlled Production Activation

Upon attaining certified `READY` status:
1. Compile complete evidence set:
   - `production-readiness-request.json`
   - `production-change-set.json`
   - `production-environment-readiness.json`
   - `production-database-plan.json`
   - `production-auth-readiness.json`
   - `production-security-readiness.json`
   - `production-financial-readiness.json`
   - `production-legal-readiness.json`
   - `production-rollback-plan.json`
   - `production-verification-plan.json`
2. Formally handoff candidate to **Action P12-I: Controlled Production Activation Factory**.
