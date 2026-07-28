# Chapter 25 — Testing and Quality Assurance

## 25.1 Testing Strategy

RENTipid employs a multi-tiered testing strategy to ensure platform stability, particularly around financial and security operations.

### 25.1.1 End-to-End (E2E) Testing
- **Framework:** Playwright (`@playwright/test`)
- **Execution:** `npm run test:e2e`
- **Purpose:** Simulates real user flows across the browser. Core test slices focus on the "Happy Path" (Renter books an item -> Provider approves -> Payment captured).

### 25.1.2 Integration and Security Testing
- **Framework:** Jest
- **Execution:** `npm run test:soc:integration`
- **Purpose:** Verifies that internal state machines and security event telemetry trigger correctly. Specifically tests the SOC module's ability to ingest events and generate alerts without UI dependencies.

### 25.1.3 Database Testing Guardrails
To prevent accidental data corruption during testing, the `npm run test:db:guard` script enforces that database migrations and truncations are only executed against the dedicated test database (`rentipid_test_soc`).

## 25.2 User Acceptance Testing (UAT)

UAT is tracked via the `UATFlow` database model. During beta testing, specific cohorts of users are assigned UAT scenarios. Their completion rates and feedback are recorded to validate production readiness.

## Evidence References

| Evidence ID | Repository Path | Symbol, Model, Route, Test, or Report | Relevance | Verification Status |
| ----------- | --------------- | ------------------------------------- | --------- | ------------------- |
| REPO-003 | `package.json` | Test scripts (`test:e2e`, `test:soc`) | Test execution | Verified |
| REPO-008 | `tests/` | Playwright and Jest configurations | Test definitions | Verified |

## Related Chapters
- Chapter 26: Deployment, Operations, and Maintenance
