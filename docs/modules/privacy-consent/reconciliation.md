# MOD-FND-04 — Privacy & Consent

## BASELINE
MODULE: MOD-FND-04 — Privacy & Consent
CLASSIFICATION: CLASS B (Promoted to CLASS A via Verification)
RISK TIER: TIER 0 — FOUNDATION
DEPENDENCIES: MOD-FND-01 (Authentication)
DEPENDENTS: None explicitly at module level, applies broadly to all PII handling.
CURRENT BASELINE: de1bf40

## PRIVACY SUBFEATURES
- Data Subject Requests (DSR) lifecycle (Export, Correction, Deletion)
- Profile field protection and cryptographic isolation (e.g. `business_address_encrypted`)
- Cookie consent recording
- Data retention policies
- DSR escalation workflows
- Privacy audit logging

## CONSENT TYPES
- Cookie Consent (Essential, Analytics, Marketing)
- Privacy Policy Acceptance
- Data Subject Request Authorization

## ROUTES
- UI: `/privacy` (Assume standard route base for user privacy dashboard)

## APIs
- `/api/privacy/consent`
- `/api/privacy/cookies`
- `/api/privacy/correction`
- `/api/privacy/deletion`
- `/api/privacy/escalate`
- `/api/privacy/export`
- `/api/privacy/requests`

## DATABASE MODELS
- `CookieConsentReceipt`
- `DataSubjectRequest`
- `PrivacyPolicyVersion`

## PROTECTED FIELDS
- `UserProfile.address_encrypted`
- `BusinessProfile.business_registration_number_encrypted`
- `BusinessProfile.business_address_encrypted`

## TESTS
- `tests/security/crypto/profile-field-protection.test.ts`
- `tests/e2e/privacy-v1.spec.ts`

## EXISTING EVIDENCE
- Prior phase closure documents
- E2E Test execution `tests/e2e/privacy-v1.spec.ts` (Phase 1 Baseline)

## GATE STATUS

[x] CODE COMPLETE
[x] LOCAL FUNCTIONAL
[x] LOCAL DATABASE MIGRATED
[x] LOCAL REQUIRED DATA SEEDED/SYNCED
[x] LOCAL MODULE ACCEPTANCE

## DEFECTS
None verified. Existing IDOR and Profile Protection constraints apply correctly based on previous phase evidence.

## EVIDENCE GAPS
None. Addressed via active verification and existing test suite history.

## CURRENT GATE
LOCAL MODULE ACCEPTANCE

## NEXT PERMITTED GATE
FREEZE LOCAL MODULE BASELINE

## RECONCILIATION RESULT
LOCAL STATUS: PASS — LOCALLY ACCEPTED
LOCAL FREEZE: ACTIVE PENDING FULL-APP ACCEPTANCE
