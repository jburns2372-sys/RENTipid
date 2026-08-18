# RENTipid Master Module Register

Authority: single source of truth for module promotion status under the RENTipid Universal Implementation, Promotion & Closure Standard.

Baseline date: 2026-08-11 (Asia/Shanghai)  
Branch: `feature/soc-phase4-threat-response`  
Baseline HEAD: `6f55296cdf1ff2bda3c550448fc307f264f1f397`  
Working tree: dirty before this register was created; existing changes are preserved.  
Discovery: completed once for this baseline. Later work must use targeted inspection only.

## Gate interpretation

- `Current gate` is the highest gate supported for the whole stated module scope.
- A legacy freeze remains protected, but does not imply Preview or Production evidence under the new standard.
- `IN IMPLEMENTATION` means required behavior or evidence is still missing.
- The Address module is the only module with an accepted complete Local-to-Preview-to-Production-readiness chain at this baseline.

## Module status

| ID | Wave | Module | Actual implementation state | Current gate | Next permitted gate | Primary open evidence or defect |
| --- | ---: | --- | --- | --- | --- | --- |
| FND-01 | 1 | Architecture, configuration, PostgreSQL and Prisma | App Router, Prisma, Express API and worker exist; truthful Next/Express health probes are locally accepted | IN IMPLEMENTATION | CODE COMPLETE | Configuration remains split, the production template is incomplete and the environment contract is fragmented |
| FND-02 | 1 | Migrations | 36 applied baseline migrations exist through PSGC; migrations 37 (password recovery) and 38 (Insurance Slice 1) validate but are unapplied | IN IMPLEMENTATION | LOCAL DATABASE MIGRATED | Fresh-database proof exists for Address, not yet for the whole application baseline; both additive migrations await their later local database gates |
| FND-03 | 1 | Seeds and required data | Core, marketplace, prohibited-item, E2E, UAT and PSGC seed/sync paths exist | IN IMPLEMENTATION | CODE COMPLETE | Required settings/roles/workflow data are not yet unified under one deterministic manifest |
| FND-04 | 1 | Health, errors and logging | Next and Express readiness handlers query PostgreSQL and fail closed; both passed real localhost runtime checks | LOCAL ACCEPTANCE PASS | PREVIEW MIGRATED | Held at the global Preview barrier until all required modules pass local acceptance |
| IDN-01 | 1 | Registration, login, logout and sessions | Registration/login/logout exist; secret fallback and optimistic account-state defects are corrected under CR-2026-001 | IN IMPLEMENTATION | CODE COMPLETE | Password recovery schema is valid but unapplied; SMTP delivery and credential-reset handlers require explicit approval |
| IDN-02 | 1 | MFA and session step-up | Implemented and historically accepted within frozen security Phase 5C | LOCAL ACCEPTANCE PASS | PREVIEW MIGRATED | New-standard Preview migration/acceptance evidence is not recorded for this isolated scope |
| IDN-03 | 1 | Profile and account settings | Personal/business profiles, photo and password change exist | IN IMPLEMENTATION | CODE COMPLETE | Full account settings/status and complete journey evidence are not consolidated |
| IDN-04 | 1 | Global Address and PSGC | Complete global/PH address workflow with encrypted persistence | CLOSED / FROZEN | CLOSED / FROZEN | None; frozen at `6f55296cdf1ff2bda3c550448fc307f264f1f397` |
| IDN-05 | 1 | RBAC and permissions | Core and SOC permission systems exist | IN IMPLEMENTATION | CODE COMPLETE | Dual role systems and string-backed database roles require one authoritative matrix and full route/API coverage proof |
| FND-05 | 1 | Audit trail | Audit, auth, API, payment and SOC event writers exist | LOCAL ACCEPTANCE PASS | PREVIEW MIGRATED | Accepted security-scope evidence exists; whole-app mutation coverage is not yet proven |
| PRV-01 | 2 | Individual provider onboarding | Checklist, profile, KYC and listing surfaces exist | IN IMPLEMENTATION | CODE COMPLETE | Focused end-to-end onboarding acceptance is missing |
| PRV-02 | 2 | Business provider onboarding and KYB | Business registration/profile/marketing surfaces exist | IN IMPLEMENTATION | CODE COMPLETE | Business path is incomplete and real social integrations are absent |
| PRV-03 | 2 | KYC/KYB document verification | UI, upload/verification models and admin/compliance surfaces exist | IN IMPLEMENTATION | CODE COMPLETE | Vercel routes return 410 and depend on an Azure backend whose deployed runtime is unproven |
| MKT-01 | 2 | Categories and marketplace required data | 15-category/45-listing seed has accepted local evidence | LOCAL REQUIRED DATA SEEDED/SYNCED | LOCAL ACCEPTANCE PASS | Full marketplace workflow acceptance is not established |
| MKT-02 | 2 | Listing create/edit/lifecycle/publication | Create, submit, review and display paths exist | IN IMPLEMENTATION | CODE COMPLETE | Provider detail advertises editing as disabled; lifecycle parity across Next/Azure paths is unproven |
| MKT-03 | 2 | Listing media and storage | Local/Azure paths exist; document/photo APIs exist | IN IMPLEMENTATION | CODE COMPLETE | S3, R2 and Supabase adapters throw not-implemented errors; Azure runtime availability is unproven |
| MKT-04 | 2 | Prohibited/restricted listing compliance | Models, seed, service, admin UI and tests exist | IN IMPLEMENTATION | CODE COMPLETE | Historical freeze claims conflict with later failed closeout evidence; enforcement UI contains an implementation placeholder |
| MKT-05 | 2 | Search, filters and discovery | Browse/detail/category filtering and Azure search service exist | IN IMPLEMENTATION | CODE COMPLETE | Focused search acceptance, authorization boundaries and fallback behavior are not proven |
| MKT-06 | 2 | Availability and locking | Availability checks and booking conflict logic exist | IN IMPLEMENTATION | CODE COMPLETE | Concurrency/locking proof for the complete booking lifecycle is not accepted |
| TXN-01 | 3 | Booking and pricing | Booking creation, price units, history and dashboards exist | IN IMPLEMENTATION | CODE COMPLETE | Complete renter/provider acceptance and authoritative pricing/fee contract are missing |
| TXN-02 | 3 | Rental agreement and acceptance | Agreement APIs/pages/model exist | IN IMPLEMENTATION | CODE COMPLETE | Agreement version and legal-policy version recording are incomplete |
| TXN-03 | 3 | Handover, active rental and return | Inspection, turnover, renter confirmation, claims and return pages exist | IN IMPLEMENTATION | CODE COMPLETE | Full state-machine, recovery and end-to-end acceptance evidence is missing |
| TXN-04 | 3 | Cancellation and expiration | Status flows and worker sweeper exist | IN IMPLEMENTATION | CODE COMPLETE | Worker scheduling/deployment and focused expiration tests are unproven |
| PAY-01 | 4 | Payment checkout and gateway transactions | Mock and PayMongo adapters, checkout and transaction records exist | IN IMPLEMENTATION | CODE COMPLETE | Sandbox/live boundaries need final reconciliation; live activation remains prohibited |
| PAY-02 | 4 | Webhooks and financial idempotency | Signature, event log, reconciliation and checkout idempotency controls exist | IN IMPLEMENTATION | CODE COMPLETE | Required callback matrix has not been accepted as one finance journey |
| PAY-03 | 4 | Escrow/holding and ledger | Payment, gateway, ledger and deposit records exist | IN IMPLEMENTATION | CODE COMPLETE | Legal escrow semantics and invariant proof are incomplete |
| PAY-04 | 4 | Refunds | Request/admin surfaces exist | IN IMPLEMENTATION | CODE COMPLETE | PayMongo refund method is explicitly a success-returning placeholder; live refunds are manual |
| PAY-05 | 4 | Provider payouts | Payout and batch records/admin surfaces exist | IN IMPLEMENTATION | CODE COMPLETE | Real payout execution is manual placeholder only |
| PAY-06 | 4 | Financial reconciliation | Reconciliation screens/logs exist | IN IMPLEMENTATION | CODE COMPLETE | End-to-end equality and discrepancy handling across all financial paths are not proven |
| TRU-01 | 5 | Insurance | Technical Foundation Slice 1 implements normalized contracts, adapter registry, deterministic Mock adapter, domain/config/audit boundaries and six-model schema | CLOSED / FROZEN (SLICE 1); IN IMPLEMENTATION (MODULE) | CODE COMPLETE (NEXT TRANSACTION SLICE) | Slice 1 passed all gates through PRODUCTION-READY and is frozen at 2ff068991950de64e3bf0931ed76a5650217dbe2; Booking/Auth integration, routes, lifecycle, finance and real partner activation remain open |
| TRU-02 | 5 | Damage claims and evidence | Claims, photos, response and admin resolution records exist | IN IMPLEMENTATION | CODE COMPLETE | Complete determination-to-ledger acceptance is missing |
| TRU-03 | 5 | Disputes | Dispute model and admin resolution surfaces exist | IN IMPLEMENTATION | CODE COMPLETE | Renter/provider case workflow and dedicated tests are incomplete |
| TRU-04 | 5 | Reviews and reputation | Review model and reads exist | IN IMPLEMENTATION | CODE COMPLETE | No dedicated review mutation workflow or focused tests |
| COM-01 | 6 | Direct messaging | No conversation/message model, API or UI found | NOT STARTED | CODE COMPLETE | Entire required renter-provider messaging workflow is absent |
| COM-02 | 6 | Notifications | Notification persistence is used by booking creation | IN IMPLEMENTATION | CODE COMPLETE | No notification inbox/API/read-state workflow or focused tests |
| COM-03 | 6 | AI Help Center | UI, logs, prompt controls and mock command layer exist | IN IMPLEMENTATION | CODE COMPLETE | Vercel endpoint returns 410; Azure tool dispatch is not implemented; answers/tools are mock-only |
| COM-04 | 6 | Support and transactional communications | Ticket/feedback models and admin reads exist | IN IMPLEMENTATION | CODE COMPLETE | User support/feedback forms are not wired to mutations; email delivery path not accepted |
| ADM-01 | 7 | Admin operations | Broad dashboard and operational reads/actions exist | IN IMPLEMENTATION | CODE COMPLETE | Full role journey, ownership, audit and negative acceptance is missing |
| ADM-02 | 7 | Finance Admin | Finance dashboards and manual controls exist | IN IMPLEMENTATION | CODE COMPLETE | Automated real-money operations are unavailable and complete reconciliation acceptance is missing |
| ADM-03 | 7 | Compliance Admin | KYC/listing/privacy/prohibited-item surfaces exist | IN IMPLEMENTATION | CODE COMPLETE | Placeholder enforcement action and conflicting prohibited-item evidence remain |
| ADM-04 | 7 | Super Admin/system controls | Settings, launch, payment and emergency controls exist | IN IMPLEMENTATION | CODE COMPLETE | Initialization is database-dependent and whole-scope authorization acceptance is missing |
| SEC-01 | 8 | Security/SOC | Extensive event, rule, alert, case, playbook, response and recovery implementation | LOCAL ACCEPTANCE PASS | PREVIEW MIGRATED | Historical accepted/frozen slices are preserved; new-standard Preview chain is not recorded |
| SEC-02 | 8 | Privacy and consent v1 | DSR, cookies, policy and encryption controls have accepted local closure evidence | LOCAL ACCEPTANCE PASS | PREVIEW MIGRATED | Closure certificate records no deployment; DPO registration and approved deferrals remain documented limitations |
| ANA-01 | 9 | Analytics and KPIs | Multiple dashboards and data models exist | IN IMPLEMENTATION | CODE COMPLETE | Mobile/events include mock data and marketplace/finance KPI definitions lack accepted reconciliation |
| MOB-01 | 9 | PWA | Manifest and referenced brand icons exist | IN IMPLEMENTATION | CODE COMPLETE | No service worker/offline behavior; placeholder 68-byte icons also exist |
| MOB-02 | 9 | Capacitor/mobile | Capacitor config and web-responsive shell exist | IN IMPLEMENTATION | CODE COMPLETE | No native platform projects/tests; cleartext/mixed-content settings require release hardening |
| LEG-01 | 9 | Legal and policy | Terms, privacy and cancellation pages/readiness UI exist | IN IMPLEMENTATION | CODE COMPLETE | Registration acceptance is not version-recorded; insurance/payment/rental policy consents are incomplete |
| DOC-01 | 9 | Manuals and interface documentation | Large historical documentation set exists | IN IMPLEMENTATION | CODE COMPLETE | Required user/ops/admin/finance/technical/developer/deployment manuals are not reconciled to current runtime |
| REL-01 | 10-13 | Global acceptance, LOCAL-RC1, closure and deployment preparation | Address release is independently ready; app-wide release is not | IN IMPLEMENTATION | CODE COMPLETE | Multiple modules remain below CODE COMPLETE; no global local acceptance or LOCAL-RC1 exists |

## First executable module

`FND-04 Health, errors and logging` has completed all local gates. The false-readiness defect and missing Next health handler are corrected; four focused tests, touched-file lint, root TypeScript and both live localhost endpoints pass. No migration or seed is required. Preview promotion is deferred by the global barrier.

The first open implementation slice is Identity password recovery. Its schema and additive migration validate but remain unapplied. Implementing SMTP delivery of a sensitive, single-use reset link and the token-authorized credential mutation is paused pending explicit owner authorization. The fail-closed authentication/account-state delta in `CR-2026-001` remains CODE COMPLETE and awaits real local acceptance.

## FND-04 authoritative status block

MODULE: Health, errors and logging

- [x] CODE COMPLETE
- [x] LOCAL FUNCTIONAL
- [x] LOCAL DATABASE MIGRATED — NOT REQUIRED / VERIFIED
- [x] LOCAL REQUIRED DATA SEEDED/SYNCED — NOT REQUIRED / VERIFIED
- [x] LOCAL ACCEPTANCE PASS
- [ ] PREVIEW MIGRATED
- [ ] PREVIEW ACCEPTANCE PASS
- [ ] PRODUCTION-READY
- [ ] CLOSED / FROZEN

CURRENT GATE: LOCAL ACCEPTANCE PASS  
NEXT PERMITTED GATE: PREVIEW MIGRATED — held by the global Preview barrier  
BLOCKERS: All remaining required modules must complete local acceptance before Preview promotion.
