# PHASE 4 CHANGE IMPACT LEDGER

## Classifications
- LOCAL_IMPLEMENTATION
- SHARED_AUTHORIZATION
- SHARED_DSL
- SHARED_EVENT_INGESTION
- SHARED_EVALUATOR
- SHARED_ALERT_GENERATION
- DATABASE_SCHEMA
- DATABASE_MIGRATION
- UI_ONLY
- TEST_ONLY
- DOCUMENTATION_ONLY
- EXTERNAL_CONFIGURATION

## Gate 4A Impact
All changes in Gate 4A are classified as:
**DOCUMENTATION_ONLY**

Therefore:
- No TypeScript test is required solely for the documents.
- No Prisma validation is required.
- No application build is required.
- No Gate 3 regression is required.
- Manual structural review and Git checks are sufficient.

## Gate 4B-1 Impact
Changes in Gate 4B-1 are classified as:
- **DATABASE_SCHEMA**: Added `AuthenticationSecurityLog`
- **DATABASE_MIGRATION**: `add_auth_security_log`
- **SHARED_EVENT_INGESTION**: `AuthenticationSecurityLogAdapter`, `authentication-writer.ts`, HMAC pseudonymization
- **LOCAL_IMPLEMENTATION**: Instrumented `auth.ts`

Therefore:
- Prisma migration executed on test database.
- TypeScript compilation and ESLint required.
- Production build verified.

## Gate 4B-1R1 Impact
Changes in Gate 4B-1R1 are classified as:
- **DATABASE_MIGRATION**: Added `fix_authentication_security_log_source_enum` to safely register the enum missing from previous migration.
- **TEST_ONLY**: Corrected and finalized test execution for regression and idempotency.

Therefore:
- Prisma migration re-verified on a clean database (`rentipid_test_soc_gate4b1_replay`).
- TypeScript test verification required and passed.
- Known Phase 3 degradation recorded.

### Gate 4D-A Change Impact
*   **Adapter Impact**: api-security-adapter.ts now safely manages ACTOR: and SOURCE: subject domains to prevent collisions in correlation.
*   **Schema Impact**: DetectionCorrelationSubject safely expanded to support CORRELATION_KEY.
