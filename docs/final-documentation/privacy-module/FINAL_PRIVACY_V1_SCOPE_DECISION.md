# FINAL PRIVACY V1 SCOPE DECISION

MODULE: RENTipid Privacy Module
VERSION: 1.0.0
CONTROLLER: ONESYSTEMS INTEGRATION PHILIPPINES INC.
POLICY OWNER: FEDERICO P. DIAGONO JR.
DPO: MAVERIC SIDNEY DE MESA
DPO EMAIL: dpo@onesystemsphilippines.com
LEGAL REVIEWER: ATTY. JOSELYN BONNIE V. VALEROS
PUBLICATION APPROVER: ATTY. JOSELYN BONNIE V. VALEROS
EFFECTIVE DATE: 2026-08-05
PUBLICATION DATE: 2026-08-05
DPO REGISTRATION STATUS: REGISTRATION_PENDING

## V1 MANDATORY SCOPE
1. Public Privacy Policy
2. Privacy rights information
3. Privacy contact and DPO contact
4. Data-subject request submission
5. Secure request tracking
6. Request ownership enforcement
7. Privacy administration RBAC
8. Account-deletion request workflow
9. Legal-hold protection
10. Cookie disclosure
11. Cookie preferences and withdrawal
12. Active processor disclosure
13. Cross-border disclosure
14. AI-use disclosure and restrictions
15. Manual governed retention procedure
16. Privacy audit logging
17. Focused Privacy technical validation
18. Focused Privacy browser validation
19. Production build
20. Closure certificate
21. Version-freeze manifest
22. SHA-256 evidence verification

## APPROVED DEFERRED CONTROLS
RETENTION_CONTROL_MODE: MANUAL_GOVERNED_PROCESS
AUTOMATED_RETENTION_ENGINE: DEFERRED_TO_FUTURE_CONTROLLED_PHASE
PRODUCTION_AUTOMATED_DELETION: DISABLED
DEFERRED_CONTROL_REOPENING_REQUIRED: YES

Deferred Controls outside V1 scope:
- automated disposal engine for all 15 categories;
- live external KYC;
- live external AI;
- live analytics;
- live marketing tracking;
- application-wide accessibility testing unrelated to Privacy;
- application-wide browser testing unrelated to Privacy;
- DPA review for inactive providers;
- processor-region verification for inactive providers;
- unrelated application requirements.

## REQUIREMENT CLASSIFICATION RULE
The 66 requirements must later be classified as:
- V1_MANDATORY
- V1_DEFERRED_APPROVED
- OUTSIDE_CURRENT_MODULE_SCOPE

V1_MANDATORY_REQUIREMENTS_FAILED: 0
V1_MANDATORY_REQUIREMENTS_BLOCKED: 0

Every deferred requirement must have:
- DEFERRED_REASON
- OWNER_APPROVAL
- LEGAL_REVIEW
- REOPENING_TRIGGER
- FUTURE_PHASE

## CONTROLLED CHANGE RULE
CONTROLLED_CHANGE_REQUIRED: YES
REOPENING_AUTHORITY: FEDERICO P. DIAGONO JR. OR FORMALLY AUTHORIZED SUCCESSOR

Reopening triggers must include:
- Privacy Policy change;
- controller change;
- DPO change;
- active processor change;
- processing-region change;
- DPA or contract change;
- retention-policy change;
- automated retention activation;
- new cookie or tracker;
- analytics activation;
- marketing activation;
- KYC activation;
- AI activation;
- payment live-mode activation;
- escrow live-mode activation;
- material DSR workflow change;
- security-control change;
- legal or regulatory change;
- privacy incident;
- mandatory-test failure;
- frozen-file hash failure.
