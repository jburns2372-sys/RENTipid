# Gate 4H-R2: Approved-Scope Binding and Final Acceptance Evidence

## 1. Traceability
- **Gate**: Gate 4H-R2
- **Objective**: Bind response execution to approved response_type, target_type, and target_id. Reject legacy approvals with missing scope. Show emergency freeze status in operations UI.
- **Commit Subject**: feat(soc): add reversible response execution (R2 scope binding)

## 2. Implementation Summary

### 2.1 Backend Binding (Execution Service)
- **File**: `src/lib/security/responses/execution.service.ts`
- **Mechanism**: The execution service now explicitly reads `response_type`, `target_type`, and `target_id` from the `grant.request` relation.
- **Legacy Rejection**: If any of these fields are missing on the approved request, the service throws a `SecurityExecutionError` with `APPROVAL_SCOPE_MISSING`.

### 2.2 User Interface
- **File**: `src/components/security/responses/ResponseDetailClient.tsx`
- **File**: `src/app/dashboard/admin/security/responses/[executionId]/page.tsx`
- **Mechanism**: The UI aggressively checks for the `SOC_RESPONSE_EMERGENCY_FREEZE` boolean via the `SystemSetting` table. The boolean is passed down to `ResponseDetailClient` as `isEmergencyFreeze`, rendering a critical visual alert banner and disabling execution workflows when true.

### 2.3 Integration Tests
- **File**: `tests/security/cases/gate4h-r2-scope-binding.integration.test.ts`
- **Validates**:
  - Rejection of legacy approvals without scope (`APPROVAL_SCOPE_MISSING`).
  - Strict binding of response parameters from DB source of truth.
  - Proper error propagation and grant state immutability on rejection.

## 3. Validation Results
- Re-ran `npm run test:soc:integration`.
- All legacy missing-scope requirements tested in test suites have been verified.
- Emergency freeze UI prop passed properly without breaking the React tree.

## 4. Final Acceptance
- Gate 4H is functionally complete.
- Post-submission scope tampering is structurally impossible.
- Reversible execution correctly links to approvals.
