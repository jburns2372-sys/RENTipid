# Gate 4G Slice A4/A5-R2 Grant Consumption Boundary Remediation Evidence

## Overview
- **Starting Baseline:** 4d25cd16312cf96c663bcfba6f438c319a67705c
- **Boundary Violation:** Executable approval-grant consumption capability (`consumeApprovalGrant`) was identified during final Gate 4G closeout verification.
- **Offending File:** `src/lib/security/approvals/security-response-approval.service.ts`
- **Original Introduction Commit:** `5f0ee3e0a86b9c8e0c668372d8657c5275d4ed98`

## Caller and Exposure Audit
- **Service Export:** Function was exported via `src/lib/security/approvals/security-response-approval-api.ts`.
- **API Exposure:** No API route or handler invoked the function.
- **UI Exposure:** No UI control invoked or exposed the function.
- **Test Exposure:** Exclusively invoked by `tests/security/cases/gate4g-slice-a4-a5-approval-vertical.integration.test.ts`.

## Remediation Authority
Product-owner authorized the narrow removal of `consumeApprovalGrant` from the service, API wrappers, and tests.

## Changes Made
- Removed `consumeApprovalGrant` function from `src/lib/security/approvals/security-response-approval.service.ts`.
- Removed `consumeApprovalGrant` export from `src/lib/security/approvals/security-response-approval-api.ts`.
- Removed the `Single-use grant behavior (consume)` test from `tests/security/cases/gate4g-slice-a4-a5-approval-vertical.integration.test.ts`.
- Created `tests/security/cases/gate4g-slice-a4-a5-r2-grant-consumption-boundary.integration.test.ts` to explicitly assert the absence of executable consumption paths.

## Retained Behavior
The production Gate 4G approval service retains all authorized capabilities:
- Approval request submission
- Pending request cancellation
- Approval and Rejection decisions
- Grant issuance, expiration, and eligible unused-grant revocation
- Self-approval prevention and immutable linkage
- The `CONSUMED` database schema status scaffold was retained for future Gate 4H implementation.

## Focused Validation Results
- **Original A4/A5 Suite Result:** PASS (7 passed, 7 total)
- **R2 Boundary Suite Result:** PASS (3 passed, 3 total)
- **Combined A4/A5 + R2 Totals:** 10 passed, 10 total
- **A6 Regression Result:** PASS (7 passed, 7 total)
- **A7 Regression Result:** PASS (9 passed, 9 total)
- **Database-Guard Result:** PASS (12 passed, 12 total)
- **ESLint Changed-File Validation:** 0 errors, 3 warnings
- **TypeScript:** pre-existing 7 errors, new 0 errors (ACCEPTED_PRE_EXISTING_TYPESCRIPT_BASELINE)
- **`git diff --check`:** Passed cleanly.

## Post-Remediation Gate 4H Boundary
- No callable path transitions a grant to `CONSUMED`.
- No API route, UI control, or test implements executable playbook execution or response dispatch.
- Boundary check passes cleanly.

## Scope Confirmation
- Published tags and history remain completely untouched.
- No push or external-system action occurred.
- No database schema mutation occurred.
