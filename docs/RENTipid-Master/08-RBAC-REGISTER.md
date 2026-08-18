# RENTipid RBAC Register

Two authorization vocabularies exist: core marketplace roles in `src/lib/permissions.ts` and SOC/privacy/compliance permissions in `src/lib/security/permissions.ts`. Route protection begins in `src/proxy.ts`; privileged services also perform database-authoritative checks.

| Role | Intended access | Key permissions | Current status | Gap / risk |
| --- | --- | --- | --- | --- |
| Guest | Public catalogue, legal/privacy and registration | Listing read | IN IMPLEMENTATION | Public/API boundary matrix not fully tested |
| Renter | Profile, booking, payment, claims, refunds, reviews | Booking/payment create/read; dispute create | IN IMPLEMENTATION | Review, messaging and notification workflows incomplete |
| Individual Provider | Provider onboarding, listings, bookings, handover, earnings | Listing CRUD; booking approval/read | IN IMPLEMENTATION | Listing edit and complete provider journey not accepted |
| Business Provider | Business profile/listings/bookings/marketing | Provider-like marketplace rights | IN IMPLEMENTATION | Separate dashboard routing and business workflow incomplete |
| Admin | General operations, users, listings, bookings, disputes, privacy | Operational read/update; KYC/dispute approval | IN IMPLEMENTATION | Full mutation/ownership/negative matrix missing |
| Finance Admin | Payments, refunds, payouts, reconciliation | Finance read/update/approve/execute | IN IMPLEMENTATION | Real-money execution remains disabled/manual |
| Compliance Admin | KYC, listings, prohibited items, privacy | Review/takedown/policy/appeal and privacy management | IN IMPLEMENTATION | Placeholder enforcement action and incomplete end-to-end proof |
| SOC_ANALYST | SOC investigation and response requests | Case investigate/note/evidence; playbook drafting; response request | LOCAL ACCEPTANCE PASS | New-standard Preview gates not recorded |
| SOC_SUPERVISOR | SOC case leadership, approvals/responses | Assign/resolve/close; playbook review; response approve/execute | LOCAL ACCEPTANCE PASS | New-standard Preview gates not recorded |
| Super Admin | All administrative domains and emergency controls | Full core matrix plus SOC/compliance/privacy controls | IN IMPLEMENTATION | Whole-app least-privilege and separation-of-duties acceptance missing |

## Enforcement locations

| Boundary | Mechanism | Finding |
| --- | --- | --- |
| Dashboard navigation | `src/proxy.ts` JWT role checks | Protects `/dashboard/**`; does not itself reject Pending/Suspended accounts and uses a known secret fallback |
| SOC pages/actions | `requireSecurityPermission` | Database-authoritative role/status and MFA step-up; fail-closed intent with audit logging |
| Core APIs | Per-route `getServerSession` plus role/ownership checks | Coverage varies by route and needs authoritative endpoint matrix |
| Address/profile | Session-derived ownership and encrypted persistence | Accepted IDOR evidence; CLOSED / FROZEN |
| Finance | Role checks plus database settings/guardrails | Live actions remain separately gated |

## Reconciliation requirements

1. Remove known-secret fallback and fail closed outside explicit local-development configuration.
2. Define one canonical role vocabulary including SOC roles and constrain all role writes.
3. Require database-authoritative account status for sensitive actions; a stale JWT must not preserve revoked access.
4. Map every page, Route Handler, Server Action and Express route to authentication, role, ownership and audit expectations.
5. Preserve accepted SOC and Address controls while filling only uncovered boundaries.
