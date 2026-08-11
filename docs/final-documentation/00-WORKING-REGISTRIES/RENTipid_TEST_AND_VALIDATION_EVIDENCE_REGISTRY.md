# RENTipid Test and Validation Evidence Registry

Status: `FROZEN_WORKING_REGISTRY`

Current inventory: `142` test/spec files.

| Test domain | Files | Evidence scope |
| --- | ---: | --- |
| Security | 135 | SOC telemetry, rules, cases, playbooks, approvals, responses, UI, crypto, Level 5, database guards |
| Checkout/payment pilot | 3 | checkout behavior and Phase 19 pilot limits/restrictions |
| End-to-end | 3 | Playwright/deferred baseline flows |
| Privacy | 1 | privacy service/flow evidence |

Key accepted suites:

| Capability | Canonical evidence |
| --- | --- |
| Controlled simulation | `tests/security/responses/gate4i-controlled-response-simulation.integration.test.ts` — nine accepted scenarios |
| Gate 4J UAT | `tests/security/ui/gate4j-soc-technical-uat.test.tsx` — operator workflow and server page authorization |
| Response execution | Gate 4H execution, controls, API and operations UI suites |
| Playbooks/approvals | Gate 4G lifecycle, RBAC, concurrency, approval vertical and UI suites |
| Incident cases | Gate 4F schema/service/RBAC/API/UI suites |
| Recovery | `tests/security/soc-recovery.test.ts`, backfill/idempotency suites |
| SOC dashboard | `tests/security/ui/rentipid-soc-command-center-dashboard.test.tsx` |
| Least privilege | SOC analyst dashboard/proxy authorization suites |
| Payment security | PayMongo signature and reconciliation suites |
| Crypto/profile protection | security crypto unit/integration bundles |

Evidence rules:

- accepted reports record historical commands/results at their checkpoints;
- documentation-only reconciliation does not rerun database or code tests;
- test-file presence does not equal a current pass;
- current dirty-worktree changes are not covered by historical frozen test
  results unless an accepted report explicitly says so;
- database-backed tests require the local test-database guard;
- production databases are never a test target;
- the three SOC placeholder routes have no exact-path test references.

Validation performed for this documentation is structural/read-only: file
inventory, source tracing, authority comparison, internal link/status checks,
and file-boundary checks.

Canonical manual cross-reference: `../06-DEVELOPER-HANDOVER/RENTipid_DEVELOPER_HANDOVER_MANUAL.md`
and Master Chapters 235–237.
