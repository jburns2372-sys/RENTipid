# ============================================================
# RENTipid UNIVERSAL IMPLEMENTATION, PROMOTION & CLOSURE STANDARD
# MANDATORY FOR ALL MODULES
# ============================================================

STATUS:
PERMANENT PROJECT-WIDE ENGINEERING POLICY

APPLIES TO:

1. Existing implemented modules
2. Existing modules requiring correction
3. Existing modules requiring enhancement
4. Partially implemented modules
5. New modules
6. Future modules
7. Third-party integrations
8. Database-dependent features
9. Security modules
10. Finance/payment modules
11. AI/automation modules
12. Mobile/PWA features
13. Administrative modules
14. Background workers/jobs
15. APIs and supporting infrastructure

NO RENTipid MODULE IS EXEMPT UNLESS AN EXPLICIT TECHNICAL
JUSTIFICATION IS DOCUMENTED.

============================================================
MANDATORY PROMOTION PIPELINE
============================================================

EVERY MODULE MUST FOLLOW:

CODE COMPLETE
      ↓
LOCAL FUNCTIONAL
      ↓
LOCAL DATABASE MIGRATED
      ↓
LOCAL REQUIRED DATA SEEDED/SYNCED
      ↓
LOCAL ACCEPTANCE PASS
      ↓
PREVIEW MIGRATED
      ↓
PREVIEW ACCEPTANCE PASS
      ↓
PRODUCTION-READY
      ↓
CLOSED / FROZEN

THIS SEQUENCE IS A HARD-GATE PIPELINE.

NO GATE MAY BE SKIPPED.

============================================================
GOLDEN RULE
============================================================

A module is NOT complete merely because:

- code has been written
- TypeScript passes
- lint passes
- tests pass
- build succeeds
- localhost loads
- database migration file exists
- Preview deployment succeeds
- Vercel reports READY
- UI appears correct
- another AI reviewed it
- documentation says COMPLETE

A RENTipid module becomes CLOSED / FROZEN only after every
applicable promotion gate has PASS evidence.

============================================================
GATE DEFINITIONS
============================================================

1. CODE COMPLETE

The required implementation is finished at source-code level.

Must include applicable:

- frontend
- backend
- APIs
- validation
- authorization
- database schema
- business logic
- audit logging
- error handling
- security controls
- tests
- documentation changes

No unresolved implementation placeholders may remain in required scope.

Required result:

CODE COMPLETE — PASS


2. LOCAL FUNCTIONAL

The implementation must actually run locally.

Verify:

- application starts
- feature loads
- workflows execute
- APIs respond
- authorization works
- UI and server communicate correctly
- no blocking runtime errors
- dependent services execute correctly

Required result:

LOCAL FUNCTIONAL — PASS


3. LOCAL DATABASE MIGRATED

The local database must match the implementation.

Verify:

- schema valid
- migration applied
- generated database client synchronized
- tables/columns/indexes correct
- existing data preserved
- no destructive reset unless explicitly justified
- application works against migrated schema

If migration genuinely is not required:

LOCAL DATABASE MIGRATION:
NOT REQUIRED — VERIFIED

This satisfies the gate.

Required result:

LOCAL DATABASE MIGRATED — PASS


4. LOCAL REQUIRED DATA SEEDED/SYNCED

All application data required for proper operation must exist.

Examples:

- permissions
- roles
- configuration
- system records
- lookup values
- workflow definitions
- default rules
- templates
- system accounts
- operational metadata

Seed/sync must be:

- deterministic
- idempotent
- safe
- non-duplicating

If not required:

LOCAL REQUIRED DATA SEED/SYNC:
NOT REQUIRED — VERIFIED

Required result:

LOCAL REQUIRED DATA SEEDED/SYNCED — PASS


5. LOCAL ACCEPTANCE PASS

Perform actual local functional acceptance.

This must prove the complete workflow, not merely individual code units.

Validate applicable:

- happy path
- validation failures
- permissions
- RBAC
- security
- database persistence
- audit trail
- error handling
- idempotency
- recovery
- edge cases
- integrations
- UI
- APIs
- background processing
- regression impact

Run appropriate final local quality gates ONCE after implementation stabilizes.

Required result:

LOCAL ACCEPTANCE — PASS


============================================================
ABSOLUTE PREVIEW BARRIER
============================================================

PREVIEW PROMOTION IS PROHIBITED UNTIL:

[x] CODE COMPLETE
[x] LOCAL FUNCTIONAL
[x] LOCAL DATABASE MIGRATED
[x] LOCAL REQUIRED DATA SEEDED/SYNCED
[x] LOCAL ACCEPTANCE PASS

Only then:

PREVIEW MIGRATION MAY BEGIN.


6. PREVIEW MIGRATED

The Preview environment and Preview database must be brought to
the validated implementation baseline.

Verify:

- correct Preview environment
- correct Preview database
- migration applied safely
- required data sync completed
- environment variables available
- required external services configured
- application connects correctly
- no production database accidentally changed

Never use development/reset database commands against Preview.

Required result:

PREVIEW MIGRATED — PASS


7. PREVIEW ACCEPTANCE PASS

Test the actual deployed Preview environment.

Do NOT assume local PASS automatically means Preview PASS.

Verify actual deployed behavior including applicable:

- authentication
- RBAC
- APIs
- database
- UI
- workflow
- integrations
- background processing
- environment-specific configuration
- security
- audit logging
- recovery
- mobile/PWA behavior
- serverless execution behavior
- external service connectivity

Preview acceptance must prove that the feature works without relying
on a developer's localhost session.

Required result:

PREVIEW ACCEPTANCE — PASS


8. PRODUCTION-READY

Perform one final readiness review.

Required evidence:

CODE
[x] complete

LOCAL
[x] functional
[x] migrated
[x] seeded/synced
[x] accepted

PREVIEW
[x] migrated
[x] accepted

SECURITY
[x] verified

DATABASE
[x] migration safe

DEPLOYMENT
[x] production procedure known

CONFIGURATION
[x] production requirements documented

ROLLBACK/RECOVERY
[x] considered

DOCUMENTATION
[x] updated

KNOWN LIMITATIONS
[x] documented

Required result:

PRODUCTION-READY — PASS


9. CLOSED / FROZEN

Only after all preceding gates PASS may the module be declared:

COMPLETED
CLOSED
FROZEN

The closure record must contain:

- module name
- scope
- original requirement/problem
- implementation summary
- files changed
- database changes
- migration ID
- seed/sync requirements
- test evidence
- local acceptance evidence
- Preview acceptance evidence
- security result
- production readiness result
- known limitations
- branch
- commit SHA
- closure date
- frozen baseline

Required final status:

PASS — COMPLETED / CLOSED / FROZEN

============================================================
RULE FOR EXISTING RENTipid MODULES
============================================================

Existing modules that were previously marked:

COMPLETED
CLOSED
FROZEN
ACCEPTED
PRODUCTION-GRADE
or equivalent

must NOT automatically be assumed to satisfy this new standard.

Perform a ONE-TIME RETROSPECTIVE GATE RECONCILIATION.

For each existing module determine whether evidence exists for:

[ ] CODE COMPLETE
[ ] LOCAL FUNCTIONAL
[ ] LOCAL DATABASE MIGRATED
[ ] LOCAL REQUIRED DATA SEEDED/SYNCED
[ ] LOCAL ACCEPTANCE PASS
[ ] PREVIEW MIGRATED
[ ] PREVIEW ACCEPTANCE PASS
[ ] PRODUCTION-READY
[ ] CLOSED / FROZEN

IMPORTANT:

Do NOT rebuild already working modules simply because historical evidence
is missing.

Instead:

1. inspect existing implementation once
2. reuse existing evidence
3. execute only missing verification gates
4. correct actual defects
5. fill genuine evidence gaps
6. perform closure reconciliation
7. freeze again under the new standard

Avoid unnecessary reimplementation.

============================================================
RULE FOR MODULES BEING REVISED
============================================================

When a frozen module requires modification:

DO NOT reopen the entire historical implementation.

Record:

FROZEN BASELINE:
[commit]

REOPEN REASON:
[specific defect/change/requirement]

CHANGE SCOPE:
[exact affected functionality]

Then apply the mandatory pipeline to the changed scope:

CODE COMPLETE
→ LOCAL FUNCTIONAL
→ LOCAL DATABASE MIGRATED
→ LOCAL DATA SEEDED/SYNCED
→ LOCAL ACCEPTANCE
→ PREVIEW MIGRATED
→ PREVIEW ACCEPTANCE
→ PRODUCTION-READY
→ CLOSED/FROZEN

Previously frozen unaffected functionality remains frozen.

Regression testing should verify affected interfaces without causing
unnecessary redesign.

============================================================
RULE FOR NEW MODULES
============================================================

Every future module begins with this pipeline already attached.

No developer or AI agent may define an alternative completion sequence.

New module:

IMPLEMENT
→ CODE COMPLETE
→ LOCAL FUNCTIONAL
→ LOCAL DB
→ LOCAL DATA
→ LOCAL ACCEPTANCE
→ PREVIEW DB
→ PREVIEW ACCEPTANCE
→ PRODUCTION-READY
→ CLOSED/FROZEN

============================================================
NO REPETITIVE WORK POLICY
============================================================

This mandatory pipeline must NOT create repetitive execution.

Follow:

DISCOVER ONCE
      ↓
IMPLEMENT ONCE
      ↓
TARGETED VERIFY
      ↓
PROMOTE THROUGH GATES
      ↓
FINAL EVIDENCE ONCE
      ↓
CLOSE ONCE
      ↓
FREEZE

Avoid:

- repeated repository discovery
- repeated architecture review
- repeated AI review
- repeated infrastructure setup
- duplicate migrations
- duplicate seed mechanisms
- duplicate tests
- duplicate evidence
- duplicate closure documents
- repeated reopening of passed gates

A passed gate remains passed unless a later change can reasonably invalidate it.

============================================================
DATABASE SAFETY RULE
============================================================

LOCAL, PREVIEW, and PRODUCTION must always be treated as separate
database environments.

Never assume:

LOCAL DB = PREVIEW DB

or

PREVIEW DB = PRODUCTION DB

Never accidentally migrate the wrong environment.

Never perform destructive reset operations against Preview or Production
unless explicitly authorized and technically justified.

============================================================
TRUTHFUL ACCEPTANCE RULE
============================================================

Do not manipulate application state merely to achieve PASS.

PASS must reflect actual correct behavior.

Examples of prohibited behavior:

- hardcoding HEALTHY status
- suppressing exceptions
- deleting failing records
- bypassing security controls
- bypassing validation
- generating fake successful timestamps
- disabling tests
- weakening assertions
- disabling detection rules
- changing production behavior merely to satisfy a test

Fix the root cause.

============================================================
STOP CONDITION
============================================================

An AI/developer should stop only for a genuine blocker such as:

- unavailable credentials
- inaccessible infrastructure
- destructive operation requiring authorization
- unavailable third-party dependency
- production-impacting decision requiring owner approval
- genuine architectural conflict

Routine implementation decisions do NOT require repeated owner approval.

============================================================
STANDARD RENTipid STATUS BLOCK
============================================================

Every module implementation must maintain:

MODULE:
[MODULE NAME]

[x/ ] CODE COMPLETE
[x/ ] LOCAL FUNCTIONAL
[x/ ] LOCAL DATABASE MIGRATED
[x/ ] LOCAL REQUIRED DATA SEEDED/SYNCED
[x/ ] LOCAL ACCEPTANCE PASS
[x/ ] PREVIEW MIGRATED
[x/ ] PREVIEW ACCEPTANCE PASS
[x/ ] PRODUCTION-READY
[x/ ] CLOSED / FROZEN

CURRENT GATE:
[...]

NEXT PERMITTED GATE:
[...]

BLOCKERS:
[...]

This is the authoritative module completion status.

============================================================
PROJECT-WIDE DEFINITION OF DONE
============================================================

For RENTipid:

"IMPLEMENTED"
does not equal
"COMPLETE."

"CODE COMPLETE"
does not equal
"ACCEPTED."

"LOCAL PASS"
does not equal
"DEPLOYED."

"PREVIEW DEPLOYED"
does not equal
"PREVIEW ACCEPTED."

"PREVIEW ACCEPTED"
does not equal
"PRODUCTION-READY."

"PRODUCTION-READY"
does not equal
"CLOSED."

The only complete lifecycle is:

CODE COMPLETE
      ↓
LOCAL FUNCTIONAL
      ↓
LOCAL DATABASE MIGRATED
      ↓
LOCAL REQUIRED DATA SEEDED/SYNCED
      ↓
LOCAL ACCEPTANCE PASS
      ↓
PREVIEW MIGRATED
      ↓
PREVIEW ACCEPTANCE PASS
      ↓
PRODUCTION-READY
      ↓
CLOSED / FROZEN

END OF MANDATORY RENTipid STANDARD
