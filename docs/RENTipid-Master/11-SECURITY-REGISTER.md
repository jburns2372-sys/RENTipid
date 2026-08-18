# RENTipid Security Register

| Control | Evidence / implementation | Current status | Required action |
| --- | --- | --- | --- |
| Credentials authentication | bcrypt credentials provider and auth event logging; fail-closed secret and generic credential errors implemented under `CR-2026-001` | IN IMPLEMENTATION | Complete real local credential/account-state acceptance and the separately authorized password-reset lifecycle |
| Session security | JWT session, max age, SOC step-up invalidation and shared account-access policy | IN IMPLEMENTATION | Prove account suspension/revocation across all sensitive boundaries |
| MFA | Enrolment/challenge, encrypted secret, DB-authoritative recent verification | LOCAL ACCEPTANCE PASS | Promote through Preview under new standard |
| Core RBAC | Proxy and per-route role checks | IN IMPLEMENTATION | Consolidate role vocabulary and route/API matrix |
| SOC authorization | DB-authoritative role/status, explicit permissions, fail-closed service guard | LOCAL ACCEPTANCE PASS | Preserve frozen scope; Preview promotion remains |
| Resource ownership / IDOR | Strong accepted Address/profile evidence; mixed per-route checks elsewhere | IN IMPLEMENTATION application-wide | Targeted negative/positive tests for listing, booking, claim, document and finance resources |
| Input validation | Zod/security schemas in identity and selected routes | IN IMPLEMENTATION | Inventory and close unvalidated mutations |
| Secret handling | Environment variables used; auth/proxy development-secret fallbacks removed under `CR-2026-001`; no secret value persisted in this registry | IN IMPLEMENTATION | Complete templates and validate name/presence at startup without printing values |
| Operational readiness | Next and Express handlers perform real DB probes, fail closed with 503, suppress caught details and passed live localhost checks | LOCAL ACCEPTANCE PASS | Preview gates held by global barrier |
| Profile encryption | Field protection, backfill, rotation and tamper evidence | LOCAL ACCEPTANCE PASS | Preserve historical frozen baseline; environment-specific key contract |
| MFA encryption | Key ID/key environment contract and historical security evidence | LOCAL ACCEPTANCE PASS | Rotation/recovery runbook reconciliation |
| Audit logging | Audit/Auth/API/Payment/SOC event models and writers | LOCAL ACCEPTANCE PASS for security scope | Prove every critical business mutation emits required audit record |
| API protection | NextAuth/per-route guards and SOC APIs | IN IMPLEMENTATION | Whole endpoint auth/role/ownership matrix; reconcile Express API identity propagation |
| Rate limiting | Accepted Address atomic limiter; selected security controls | IN IMPLEMENTATION application-wide | Registration/login/upload/AI/support/payment rate-limit coverage |
| Upload security | Historical validation controls and adapters | IN IMPLEMENTATION | End-to-end configured storage acceptance and malware/content policy where required |
| Payment authenticity | PayMongo signature logic and mode separation | IN IMPLEMENTATION | Complete official signature contract/callback matrix; no mock acceptance in live mode |
| Payment idempotency | Checkout idempotency migration and action logs | IN IMPLEMENTATION | Prove duplicate/delayed/retry/refund/payout invariants |
| Insurance adapter boundary | Provider-neutral contracts/registry, explicit Mock enablement, live issuance default-off, kill-switch, safe errors and audit sink | CODE COMPLETE for Slice 1 | Integrate database-backed control, RBAC and durable audit only in later authorized slices |
| SOC event ingestion | Taxonomy, adapters, recovery, rules, alerts and cases | LOCAL ACCEPTANCE PASS | Preview gates; preserve accepted scopes |
| Response workflows | Case/playbook/approval/reversible response with separation of duties | LOCAL ACCEPTANCE PASS | Preview gates; production operator authorization remains separate |
| Emergency controls | Payment and SOC freezes exist as separate controls | IN IMPLEMENTATION application-wide | Global semantics, permissions, recovery and audit acceptance |
| Privacy/DSR | Accepted v1 local controls and closure certificate | LOCAL ACCEPTANCE PASS | Preview gates and documented deferred controls |
| Supply-chain/release | Historical Phase 5I records and dependency controls | LOCAL ACCEPTANCE PASS for frozen scope | Reconcile with current dependency baseline at LOCAL-RC1 |

## Confirmed security blockers

1. The fail-closed auth/account-state delta is CODE COMPLETE, but real local credential/account-state acceptance is still required.
2. User roles/statuses are unconstrained database strings and two permission systems can drift.
3. Registration returns the raw caught error message in a 500 response.
4. Password-recovery schema/migration groundwork exists, but SMTP reset-token delivery and credential mutation require explicit authorization before implementation; direct-message and support submission contracts are also absent/incomplete.
5. The separate Express API package has two remaining TypeScript diagnostics, both caused by FinanceLedger/schema drift in `ledgerService.ts`; this is deferred to the finance work package.

No secret values were read, printed or stored during this baseline.
