# RENTipid Known Gap Register

This register contains actionable gaps only. External-only blockers are also listed in `09-INTEGRATION-REGISTER.md` and are not used to hide engineering work.

| Gap ID | Wave | Module | Gap | Type | Release impact | First corrective gate |
| --- | ---: | --- | --- | --- | --- | --- |
| GAP-003 | 1 | Auth | Fail-closed `NEXTAUTH_SECRET` delta implemented; real local runtime acceptance remains | Verification | Global blocker until accepted | LOCAL FUNCTIONAL |
| GAP-004 | 1 | Auth | Password-recovery schema is valid and migration is unapplied; delivery and credential-reset handlers require explicit authorization | Missing functionality / approval | Identity blocker | CODE COMPLETE |
| GAP-005 | 1 | Auth/RBAC | Shared Pending/Suspended/Blacklisted access policy implemented; real credential and protected-route acceptance remains | Verification | Global blocker until accepted | LOCAL FUNCTIONAL |
| GAP-006 | 1 | RBAC | Core/SOC role vocabularies are separate; DB role/status are strings | Architecture/security | Global blocker | CODE COMPLETE |
| GAP-007 | 1 | Required data | No authoritative module-to-setting/rule/template seed manifest | Evidence/implementation | LOCAL-RC1 blocker | CODE COMPLETE |
| GAP-008 | 1 | Environment | `.env.production.example` is incomplete relative to runtime names | Configuration | Deployment blocker | CODE COMPLETE |
| GAP-009 | 2 | KYC/media | Vercel document and finance upload endpoints return 410 | Runtime gap | Provider/finance blocker | CODE COMPLETE |
| GAP-010 | 2 | Azure API | Separate backend exists but deployed compute/runtime is unproven | Integration | Preview blocker | LOCAL FUNCTIONAL |
| GAP-011 | 2 | Storage | S3/R2/Supabase adapters throw not-implemented errors | Placeholder | Module blocker if selectable | CODE COMPLETE |
| GAP-012 | 2 | Listings | Required provider edit behavior is disabled in demo UI | Missing functionality | Marketplace blocker | CODE COMPLETE |
| GAP-013 | 2 | Prohibited items | Freeze claims conflict with a later failed closeout and placeholder enforcement action | Defect/evidence | Compliance blocker | CODE COMPLETE |
| GAP-014 | 2 | Search | Local/Azure search parity, fallback and acceptance are incomplete | Evidence/implementation | Marketplace blocker | CODE COMPLETE |
| GAP-015 | 2 | Availability | Concurrency/lock proof for overlapping bookings is not accepted | Financial/transaction risk | Booking blocker | CODE COMPLETE |
| GAP-016 | 3 | Pricing | No consolidated authoritative pricing/fee/deposit calculation contract | Architecture/finance | Transaction blocker | CODE COMPLETE |
| GAP-017 | 3 | Agreement | Rental/legal policy versions are not completely recorded at acceptance | Legal/data gap | Transaction blocker | CODE COMPLETE |
| GAP-018 | 3 | Expiration worker | Production scheduling and focused worker tests are unproven | Runtime/evidence | Transaction blocker | CODE COMPLETE |
| GAP-019 | 4 | Refunds | PayMongo refund function logs a placeholder and returns success | Financial defect | Production blocker | CODE COMPLETE |
| GAP-020 | 4 | Payouts | Real payout execution is a manual placeholder | Missing functionality | Production blocker | CODE COMPLETE |
| GAP-021 | 4 | Finance | Payment=gateway=ledger=escrow/refund/payout invariants lack full matrix proof | Evidence/financial | Production blocker | CODE COMPLETE |
| GAP-022 | 5 | Insurance | Technical Foundation Slice 1 is CODE COMPLETE; authenticated routes, selection/issuance lifecycle, finance, claims/evidence and real partner activation remain | Implementation/dependency | Required journey blocker | CODE COMPLETE |
| GAP-023 | 5 | Claims/disputes | Complete determination-to-financial-adjustment and party workflow unaccepted | Implementation/evidence | Trust blocker | CODE COMPLETE |
| GAP-024 | 5 | Reviews | No dedicated eligible review mutation/moderation workflow | Missing functionality | Required journey blocker | CODE COMPLETE |
| GAP-025 | 6 | Messaging | No conversation/message data, API or UI | Missing module | Required journey blocker | CODE COMPLETE |
| GAP-026 | 6 | Notifications | No inbox/read-state/preferences/delivery workflow | Missing functionality | Communication blocker | CODE COMPLETE |
| GAP-027 | 6 | AI Help | Tool dispatch is explicitly not implemented; all tools/responses are mock | Placeholder | AI module blocker | CODE COMPLETE |
| GAP-028 | 6 | Support/feedback | User forms are not wired to persistence | Missing functionality | Support blocker | CODE COMPLETE |
| GAP-029 | 6 | Email | Transactional delivery/bounce/template provider contract is unaccepted | Integration/implementation | Identity/support blocker | CODE COMPLETE |
| GAP-030 | 7 | Administration | Complete role-specific positive/negative/audit journeys are missing | Evidence | Admin blocker | LOCAL ACCEPTANCE PASS |
| GAP-031 | 9 | Analytics | Mock events/analytics and unreconciled KPI formulas remain | Placeholder | Analytics blocker | CODE COMPLETE |
| GAP-032 | 9 | PWA | No service worker/offline behavior; tiny placeholder image assets exist | Missing functionality | PWA blocker | CODE COMPLETE |
| GAP-033 | 9 | Mobile | No native platform projects/tests; cleartext/mixed content enabled | Missing/security | Mobile blocker | CODE COMPLETE |
| GAP-034 | 9 | Legal | Required versioned terms/payment/insurance/rental consents incomplete | Legal/data gap | Production blocker | CODE COMPLETE |
| GAP-035 | 9 | Documentation | Manuals are not reconciled to current runtime | Documentation | Production readiness blocker | CODE COMPLETE |
| GAP-036 | 10 | Global acceptance | No accepted full renter/provider/damage/finance/security/admin run | Evidence | LOCAL-RC1 blocker | LOCAL ACCEPTANCE PASS |
| GAP-037 | 11 | Release | No current RENTipid LOCAL-RC1 artifact/checksum bundle | Release evidence | Preview barrier | COMPLETED |
| GAP-038 | 4 | Express API / Finance | Package TypeScript baseline has 2 remaining diagnostics, both stale `FinanceLedger` field references in `ledgerService.ts` | Defect/schema drift | Finance and global release blocker | CODE COMPLETE |
| GAP-039 | 1 | Toolchain/dependencies | Installed Node 20.18.0 is below some package engine minima (20.18.1/20.19); npm audit reports 29 moderate and 13 high findings requiring scoped reconciliation | Toolchain/security debt | LOCAL-RC1 blocker | CODE COMPLETE |

## External-only blockers

- PayMongo live commercial activation and explicit owner authorization.
- Real social platform OAuth/app approvals.
- Selected cloud storage/search/OpenAI credentials and deployed runtime.
- Native store signing/accounts.
- DPO registration noted as pending in the Privacy v1 closure certificate.

These external blockers do not prevent local engineering against mocks/sandboxes where the scoped behavior is truthful, but they prevent claims of live third-party activation.
