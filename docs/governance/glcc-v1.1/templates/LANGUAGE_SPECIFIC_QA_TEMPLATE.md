# RENTipid GLCC v1.1 — Language-Specific QA Governance Template

**Controlling Master:** `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0`  
**Workstream:** `P12 / v1.1 GLOBAL EXPANSION FACTORY`  
**Document:** `LANGUAGE-SPECIFIC QA TEMPLATE`  
**Target Locale:** `[LOCALE_TAG]`  
**Candidate Pack Checksum:** `[PACK_CHECKSUM]`  
**QA Execution Environment:** `[LOCAL_HEADLESS / PREVIEW_STAGING]`  
**Overall QA Status:** `[NOT_RUN / RUNNING / PASS / FAIL / BLOCKED]`  

---

## 1. Candidate Input Verification

Before QA execution begins, verify the candidate input:
- [ ] Source Artifact: Compiled `LocalePack` from Work Package P12-D.
- [ ] Release Candidate State: Strictly `CANDIDATE_FOR_QA`.
- [ ] Sealed Pack Checksum: Matches active candidate pack.
- [ ] Canonical Key Parity: 100% (`2,208 / 2,208` keys).
- [ ] Class C Legal Approval: Approved references attached for all statutory strings.

---

## 2. 24-Domain QA Evaluation Matrix

Every candidate language must be evaluated against the comprehensive 24-domain matrix:

| Domain ID | Domain Name | Description / Scope | Required | Status |
| :--- | :--- | :--- | :---: | :---: |
| **QA-01** | Translation Integrity | Canonical key completeness, placeholder matching | Yes | `[PASS/FAIL]` |
| **QA-02** | Selector Eligibility | Deployment mode gating, fail-closed enforcement | Yes | `[PASS/FAIL]` |
| **QA-03** | Client Immediate Rerender | Dynamic DOM update upon Apply without page reload | Yes | `[PASS/FAIL]` |
| **QA-04** | SSR Locale Resolution | Server components parse headers/cookies correctly | Yes | `[PASS/FAIL]` |
| **QA-05** | CSR Locale Persistence | React Context and client-side cookie persistence | Yes | `[PASS/FAIL]` |
| **QA-06** | Route Persistence | Selected locale survives internal Next.js navigation | Yes | `[PASS/FAIL]` |
| **QA-07** | Hard Refresh Persistence | Browser hard reload (`Ctrl+F5`) preserves active locale | Yes | `[PASS/FAIL]` |
| **QA-08** | Guest Experience | Anonymous visitors experience full localized UI | Yes | `[PASS/FAIL]` |
| **QA-09** | Authenticated Experience | Profile preferences synchronize across user sessions | Yes | `[PASS/FAIL]` |
| **QA-10** | HTML `lang` / `dir` | Root `<html>` element exhibits correct attributes | Yes | `[PASS/FAIL]` |
| **QA-11** | Hydration / Visible Flash | Zero React hydration warnings; zero visible FOUC | Yes | `[PASS/FAIL]` |
| **QA-12** | Raw Key / Fallback Leakage | Zero raw keys rendered; zero unapproved fallbacks | Yes | `[PASS/FAIL]` |
| **QA-13** | Locale Injection Security | Sanitization against header/query/cookie injection | Yes | `[PASS/FAIL]` |
| **QA-14** | Country Independence | Property and tenant country invariant to locale | Yes | `[PASS/FAIL]` |
| **QA-15** | Display Currency Independence | Display currency remains decoupled from language | Yes | `[PASS/FAIL]` |
| **QA-16** | Charge Currency & Payment | Checkout charge currency and gateways invariant | Yes | `[PASS/FAIL]` |
| **QA-17** | RBAC Independence | Role capabilities and permissions invariant | Yes | `[PASS/FAIL]` |
| **QA-18** | KYC Independence | Verification thresholds and rules invariant | Yes | `[PASS/FAIL]` |
| **QA-19** | Jurisdiction Independence | Governing legal jurisdiction remains invariant | Yes | `[PASS/FAIL]` |
| **QA-20** | Legal / Compliance Authority | Class C disclosures cite formal legal versioning | Yes | `[PASS/FAIL]` |
| **QA-21** | UGC & AI Boundary | Class D user content and Class E disclaimers isolated | Yes | `[PASS/FAIL]` |
| **QA-22** | Layout Expansion & Wrapping | Resilience against label expansion and button wrapping | Yes | `[PASS/FAIL]` |
| **QA-23** | RTL Directionality | Right-to-left layout and alignment *(RTL locales only)* | If RTL | `[PASS/FAIL/SKIP]` |
| **QA-24** | Non-Regression (en-PH/fil-PH) | Zero behavioral regression on production locales | Yes | `[PASS/FAIL]` |

---

## 3. Zero-Tolerance Pass/Fail Metrics

To achieve overall `PASS`, the candidate language must report exactly zero violations across all critical metrics:

- **Raw Translation Keys Rendered:** `0`
- **Unapproved Required Fallbacks:** `0`
- **React Hydration Warnings:** `0`
- **Visible Source Language Flash (FOUC):** `0`
- **Placeholder Mismatches:** `0`
- **Security Boundary Failures:** `0`
- **Financial & Payment Boundary Failures:** `0`
- **Authority / RBAC / KYC Boundary Failures:** `0`

---

## 4. Key Architectural Contracts

### 4.1. Rendered Localization Contract
The candidate must prove actual DOM changes across all visible text (headings, buttons, forms, tooltips, validation messages). Cookie storage alone without rendered visual change is treated as an immediate failure.

### 4.2. Guest & Authenticated Session Contract
- **Guest Flow:** Guest users can apply the language from the modal; preferences persist across routes and tabs.
- **Authenticated Flow:** Logged-in users can apply the language; preference persists in database profile, across hard refreshes, and gracefully survives logout without session corruption.

### 4.3. SSR / CSR Hydration Contract
Initial server HTML payload contains the localized text and matching `<html lang="...">`. Client hydration completes with zero mismatch warnings.

### 4.4. Selector Eligibility Contract
- **Production Mode:** Candidate is **HIDDEN** and non-selectable until `PRODUCTION_READY`.
- **QA / Staging Mode:** Candidate is selectable only if promoted to `QA_REQUIRED`.
- Direct cookie or header tampering cannot force unapproved locales into Production mode.

### 4.5. Layout Expansion & RTL Contract
- Buttons, tables, dropdowns, and form labels must not truncate awkwardly or break mobile viewports.
- If text direction is `rtl`, layout mirrors correctly (alignment, breadcrumbs, icons).

### 4.6. Non-Regression Contract
Existing production baselines (`en-PH`, `fil-PH`) must be smoke-tested to confirm zero unintended side effects or dictionary corruption.

---

## 5. Downstream Handoff to Work Package P12-F

Upon achieving `validateLanguageQaResult()` validation pass with `status: 'PASS'`, the test results are recorded as:
```text
docs/governance/glcc-v1.1/evidence/p12/[locale]-qa-results.json
```
and handed off to **Work Package P12-F (Legal / Compliance Translation Control)** for statutory legal audit and formal release clearance.
