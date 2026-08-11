# RENTipid Authoritative Local Functional Inventory

Status: `COMPLETED  VALIDATED  ACCEPTED  CLOSED  FROZEN`

Frozen on: 2026-08-05 (Asia/Shanghai)

## Discovery baseline

The inventory is code-derived from the dirty authoritative working tree, not merely from historical reports.

| Artifact | Count |
| --- | ---: |
| App Router pages | 170 |
| Next.js Route Handlers | 65 |
| Files containing Server Actions | 30 |
| Prisma models | 84 |
| Prisma enums | 29 |
| Prisma migration directories | 29 |
| Automated test files | 147 |
| `src` files | 424 |
| Separate Azure API source files | 29 |
| Worker source files | 2 |

No App Router route-group directories were found. Dynamic segments are used extensively for listing, booking, claim, dispute, payment, security-case, playbook, response, reconciliation, payout, feedback, support, and UAT detail routes.

## Functional inventory

Status vocabulary here describes local implementation only: `IMPLEMENTED`, `PARTIAL`, `SCAFFOLD_ONLY`, or `ABSENT`.

| Module / process | Route or code location | Required role | Local status | Required database objects | Environment variables | External service | Test coverage | Production validation possible |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Public shell, pages, layouts, navigation | `src/app/layout.tsx`, `/`, `/browse`, `/listing/[id]`, `src/components/layout/*` | Guest | IMPLEMENTED | Listing, Category | none mandatory for static shell | Vercel/Node | Browser coverage is sparse | Yes, public |
| Route groups | `src/app` | n/a | ABSENT (not required) | none | none | none | Structure inspection | Not applicable |
| Authentication and session | `/login`, `/api/auth/[...nextauth]`, `src/lib/auth.ts`, `src/proxy.ts` | All authenticated roles | IMPLEMENTED with security finding: production fallback secret exists in code | User, AuthenticationSecurityLog, UserMfa | NEXTAUTH_URL, NEXTAUTH_SECRET, DATABASE_URL | NextAuth | Auth/security tests present | Yes with designated accounts |
| Registration | `/register`, `/register/individual`, `/register/business`, `/api/auth/register` | Guest | IMPLEMENTED | User, UserProfile, BusinessProfile | DATABASE_URL | none | Security tests; no focused registration E2E identified | Yes with isolated user |
| Core RBAC | `src/lib/permissions.ts`, `src/proxy.ts` | Guest, Renter, Individual Provider, Business Provider, Admin, Finance Admin, Compliance Admin, Super Admin | IMPLEMENTED, with dual RBAC systems | User | NEXTAUTH_SECRET, DATABASE_URL | none | Authorization tests present | Yes with role accounts |
| SOC RBAC and step-up | `src/lib/security/permissions.ts`, `authorization.ts` | SOC_ANALYST, SOC_SUPERVISOR, Super Admin; Compliance for prohibited items | IMPLEMENTED | User, UserMfa, AuditLog | MFA_ENCRYPTION_KEY, NEXTAUTH_SECRET, DATABASE_URL | none | Extensive security tests | Yes with MFA-enabled accounts |
| Renter dashboard/workflows | `/dashboard/renter/**` | Renter, Super Admin | IMPLEMENTED | User, Booking, Payment, RentalAgreement, InspectionReport, DamageClaim, RefundRequest | DATABASE_URL, payment/storage settings | payment/storage adapters | Checkout/security tests; limited E2E | Yes with isolated renter |
| Individual-provider dashboard | `/dashboard/provider/**` | Individual Provider, Super Admin | IMPLEMENTED | User, Listing, Booking, FinanceLedger, ProviderPayout | DATABASE_URL, storage/payment settings | storage/payment adapters | Listing/booking tests | Yes with isolated provider |
| Business-provider dashboard | `/dashboard/business/**` | Business Provider, Super Admin | PARTIAL: dashboard/marketing/social/promotion routes exist; proxy deliberately separates it from individual-provider routes | User, BusinessProfile, MarketingCampaign, SocialAccount, Listing | DATABASE_URL | social adapters | Security/social tests only | Yes with business account |
| Admin dashboard | `/dashboard/admin/**` | Admin, Super Admin | IMPLEMENTED | broad operational models | DATABASE_URL | optional AI/storage | Security/admin tests | Yes with admin account |
| Finance administration | `/dashboard/finance/**` | Finance Admin, Super Admin | IMPLEMENTED | Payment, GatewayTransaction, RefundRequest, ProviderPayout, PayoutBatch, PaymentActionLog, FinanceLedger | payment and database variables | PayMongo | Payment/security tests | Read-only/sandbox validation yes; live money no without separate gate |
| Compliance administration | `/dashboard/compliance/**` | Compliance Admin, Admin, Super Admin | IMPLEMENTED | VerificationDocument, Listing, prohibited-item models, AuditLog | DATABASE_URL | storage | Compliance/prohibited-item tests | Yes with compliance account |
| Super Admin / Launch Control Center | `/dashboard/super-admin/**` | Super Admin | IMPLEMENTED | SystemSetting(s), AppReleaseVersion, logs, finance objects | broad production configuration | Vercel/Azure/PayMongo | Phase 19 tests and security tests | Yes except live-payment execution |
| Provider onboarding | `/dashboard/provider/onboarding-checklist` | Individual Provider, Super Admin | IMPLEMENTED | SystemSetting, User, UserProfile | DATABASE_URL | none | No focused E2E identified | Yes |
| Renter onboarding | `/dashboard/renter/onboarding-checklist` | Renter, Super Admin | IMPLEMENTED | SystemSetting, User | DATABASE_URL | none | No focused E2E identified | Yes |
| KYC and document verification | `/dashboard/kyc`, `/api/documents/**`, `/api/admin/documents/verify` | Authenticated user; Admin/Compliance approval | IMPLEMENTED | VerificationDocument, UserProfile, BusinessProfile, AuditLog | STORAGE_PROVIDER and provider credentials | local/R2/S3/Supabase/Azure API paths | Upload/security tests | Yes with isolated documents |
| Listing creation and approval | `/dashboard/provider/listings/**`, `/api/listings/**`, `/api/admin/listings/verify`; Azure API `apps/api/src/routes/listings.ts` | Provider; Admin/Compliance | IMPLEMENTED | Listing, ListingPhoto, ListingDocument, Category, policy models | DATABASE_URL, storage variables, optional Azure API flag | storage; optional Azure API | Marketplace/prohibited-item tests | Yes |
| Search and discovery | `/browse`, `/listing/[id]`, `apps/api/src/services/searchService.ts` | Guest | IMPLEMENTED | Listing, Category | optional Azure Search variables | Azure Search when configured | Minimal focused coverage | Yes, public |
| Prohibited-items catalog/enforcement/appeals | `/prohibited-items`, `/dashboard/compliance/prohibited-items/**`, Azure API enforcement routes | Guest read; Compliance/Super Admin mutations | IMPLEMENTED in current untracked/modified tree | ProhibitedItemPolicy, ListingPolicyEvaluation, ListingEnforcementCase, ListingPolicyAppeal, PolicyChangeRecord | DATABASE_URL | separate API optional | Focused compliance/security tests present | Public catalog yes; privileged flows need accounts |
| Booking lifecycle | `/api/bookings/**`, role booking dashboards, `apps/api/src/routes/bookings.ts`, worker sweeper | Renter, Provider, Admin | IMPLEMENTED | Booking, BookingStatusHistory, Notification | DATABASE_URL | worker runtime | Booking/security tests | Yes with isolated booking |
| Booking expiration/background job | `apps/worker/src/jobs/bookingExpirationSweeper.ts` | System | IMPLEMENTED code; production scheduling unproven | Booking | DATABASE_URL | Azure worker/container/cron scheduler | No focused worker test identified | Only if deployed/scheduled |
| Agreements | `/api/bookings/[id]/agreement`, provider-agreement, booking detail pages | Renter, Provider | IMPLEMENTED | RentalAgreement, Booking | DATABASE_URL | none | Booking tests | Yes with isolated booking |
| Payments and mock escrow | `/checkout/[bookingId]`, `/api/payments`, `src/lib/payments/**` | Renter; Finance/Super Admin oversight | IMPLEMENTED | Payment, GatewayTransaction, FinanceLedger, PaymentActionLog | PAYMENT_PROVIDER_MODE and database variables | Mock adapter or PayMongo | Checkout/payment/security tests | Mock/sandbox yes |
| PayMongo mode controls | payment adapters, checkout actions, readiness/activation dashboards | Finance Admin, Super Admin | IMPLEMENTED and fail-closed controls present; live pilot historically NO-GO | SystemSetting, Payment*, logs | PAYMENT_LIVE_MODE, PAYMENT_PROVIDER_MODE, PAYMONGO_* | PayMongo | Phase 19 focused tests | Sandbox/readiness yes; live transaction not authorized by historical gate |
| Refunds, payouts, reconciliation | `/dashboard/finance/refunds/**`, `/payouts/**`, `/reconciliation/**`; renter refund request | Renter request; Finance/Super Admin action | IMPLEMENTED | RefundRequest, ProviderPayout, PayoutBatch, PaymentReconciliationLog, DepositAction | DATABASE_URL, payment variables | PayMongo/manual payout | Payment/security tests | Yes using isolated/sandbox records |
| Damage claims | booking claim APIs and renter/provider claim pages | Renter, Provider, Admin | IMPLEMENTED | DamageClaim, DamageClaimPhoto, Booking | DATABASE_URL, storage variables | storage | Booking/security coverage | Yes with isolated booking |
| Disputes | `/dashboard/admin/disputes/**`, `/api/admin/disputes/[id]/resolve` | Admin, Compliance, Super Admin | IMPLEMENTED | DisputeCase, DamageClaim, AuditLog | DATABASE_URL | none | No dedicated dispute E2E identified | Yes |
| Inspection and turnover | booking inspection/turnover APIs and renter/provider pages | Renter, Provider | IMPLEMENTED | InspectionReport, InspectionPhoto, TurnoverRecord, Booking | DATABASE_URL, storage variables | storage | Booking tests | Yes |
| Ratings and reviews | data model and listing/dashboard reads | Renter/provider context | PARTIAL: Review model exists, but no dedicated review mutation route/page was found | Review, Booking, User | DATABASE_URL | none | No focused tests found | Limited |
| Notifications | Notification model and booking relations | Authenticated roles | PARTIAL: persistence exists; no dedicated notification UI/API found | Notification | DATABASE_URL | none | No focused tests found | Limited |
| Social marketing | admin/business/provider/super-admin marketing and social routes; `src/lib/social/**` | Provider, Business Provider, Admin, Super Admin | IMPLEMENTED with mock adapter default | SocialAccount, MarketingCampaign, MarketingPost, approvals/analytics | provider-specific credentials not inventoried in template | mock/external social provider | Security tests exist | Mock yes; real provider depends on configuration |
| Direct user messaging | no dedicated message/conversation model or route found | Renter/Provider | ABSENT | none | none | none | none | No |
| AI assistant | `/api/ai/chat`, assistant components, admin AI settings/logs, `src/lib/ai/**` | Authenticated user; Admin/Super Admin settings | IMPLEMENTED with mock and Azure paths | AIBotLog, SystemSetting | AZURE_OPENAI_*, AZURE_SEARCH_* | Azure OpenAI/Search | AI/security tests | Mock yes; Azure requires env |
| SOC events, rules, alerts, cases | `/dashboard/admin/security/**`, `/api/soc/**`, `/api/admin/security/**`, `src/lib/security/**` | SOC_ANALYST, SOC_SUPERVISOR, Super Admin | IMPLEMENTED | SecurityEvent family, DetectionRule, SecurityAlert, IncidentCase family | SECURITY_TELEMETRY_HMAC_KEY, SOC_CORRELATION_HMAC_KEY, geo variables | MaxMind/App Insights optional | 139 security test files overall | Yes with SOC accounts/config |
| Security playbooks/responses/approvals | security playbook/response/approval routes and services | SOC roles, Super Admin | IMPLEMENTED | SecurityResponsePlaybook/Step/Approval*/Execution/Action | DATABASE_URL, HMAC/MFA keys | none | Extensive focused tests | Yes with isolated case |
| Emergency Freeze | payment pilot actions/settings; SOC response execution service/header | Super Admin; authorized SOC flows | IMPLEMENTED as separate PAYMENT and SOC freezes | SystemSetting, AuditLog, PaymentActionLog | payment/security env | PayMongo/SOC integrations | Freeze/reconciliation/response tests | Yes without live charge |
| Audit logging | `src/lib/audit.ts`, security event writers/adapters | System; admins read | IMPLEMENTED | AuditLog, ApiSecurityLog, AuthenticationSecurityLog, PaymentActionLog, SystemErrorLog | HMAC and DATABASE_URL | App Insights optional | Extensive security tests | Yes |
| Analytics and release readiness | admin/super-admin analytics, mobile analytics, reports, launch monitor/readiness routes | Admin, Super Admin | IMPLEMENTED | CampaignAnalytics, MobileAnalytics, AppReleaseVersion, SystemSetting | DATABASE_URL, telemetry | App Insights optional | Limited E2E | Yes |
| Privacy and account deletion | `/account/delete`, `/api/privacy/{consent,correction,deletion,export}` | Authenticated user; Admin processing | IMPLEMENTED | AccountDeletionRequest, AuditLog, user/profile data | DATABASE_URL, storage | storage for exports if used | Privacy/security tests | Yes with isolated user |
| Support and feedback | `/support`, `/feedback`, admin detail/list routes | Authenticated user; Admin | SCAFFOLD_ONLY for submission: forms have no action/method handler in inspected pages | SupportTicket, BetaFeedback | DATABASE_URL | none | No focused submission tests found | Page only |
| Webhooks | `/api/webhooks/paymongo`, health; Azure API webhooks | PayMongo/system | IMPLEMENTED | PaymentWebhookLog, Payment*, security logs | PAYMONGO_WEBHOOK_SECRET*, payment mode | PayMongo | Webhook/security tests | Public health/signature test possible |
| PWA | `public/manifest.json`, icons, root metadata | Guest | PARTIAL: manifest/icons present; no service worker found | none | none | browser | E2E can inspect manifest | Manifest yes; offline install behavior no |
| Capacitor/mobile | `capacitor.config.ts`, mobile readiness/analytics pages | build/admin | PARTIAL: configuration and analytics exist; native platform directories were not found | MobileAnalytics | CAPACITOR_SERVER_URL | Capacitor | No native test suite found | Web-responsive only |
| Feature flags and system settings | `SystemSetting`, `SystemSettings`, beta controls, payment/launch/readiness dashboards | Super Admin and module-specific admins | IMPLEMENTED but initialization state is database-dependent | SystemSetting, SystemSettings | feature-specific env | none | Settings/security tests | Requires production DB access |
| Configuration/build behavior | `package.json`, `vercel.json`, `next.config.ts`, Prisma config | Release system | IMPLEMENTED but release health not yet passed | Prisma schema | all required production names | npm/Vercel | Phase 4 not run due Phase 2 auth stop | Local gates possible later |
| Azure API backend | `apps/api/src/**`, Dockerfile; client feature flag | API/service roles | IMPLEMENTED in dirty tree; production compute app absent in current Azure inventory | shared PostgreSQL schema | NEXT_PUBLIC_API_URL, NEXT_PUBLIC_USE_AZURE_BACKEND, Azure services | Azure Container Apps | API unit/integration tests | No current Container App found |

## Environment dependency catalog

Production/runtime references discovered in code: `APP_BASE_URL`, `APPLICATIONINSIGHTS_CONNECTION_STRING`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_CHAT_DEPLOYMENT`, `AZURE_OPENAI_EMBEDDING_DEPLOYMENT`, `AZURE_OPENAI_ENDPOINT`, `AZURE_SEARCH_API_KEY`, `AZURE_SEARCH_ENDPOINT`, `AZURE_SEARCH_INDEX`, `AZURE_STORAGE_ACCOUNT_KEY`, `AZURE_STORAGE_ACCOUNT_NAME`, `BLIND_INDEX_KEY`, `BLIND_INDEX_KEY_ID`, `CAPACITOR_SERVER_URL`, `DATABASE_URL`, `DIRECT_URL`, `ENABLE_LIVE_PAYMENTS`, `KEY_VAULT_NAME`, `MFA_ENCRYPTION_KEY`, `MFA_ENCRYPTION_KEY_ID`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_AZURE_API_URL`, `NEXT_PUBLIC_USE_AZURE_BACKEND`, `NEXTAUTH_SECRET`, `PAYMENT_LIVE_MODE`, `PAYMENT_MODE`, `PAYMENT_PROVIDER_MODE`, `PAYMONGO_LIVE_ENABLED`, `PAYMONGO_PUBLIC_KEY_LIVE`, `PAYMONGO_SANDBOX`, `PAYMONGO_SECRET_KEY`, `PAYMONGO_SECRET_KEY_LIVE`, `PAYMONGO_WEBHOOK_SECRET`, `PAYMONGO_WEBHOOK_SECRET_LIVE`, `PORT`, `PRODUCTION_DOMAIN`, `PROFILE_FIELD_PROTECTION_MODE`, `RETIRED_FIELD_ENCRYPTION_KEYS`, `SECURITY_TELEMETRY_HMAC_KEY`, `SECURITY_TELEMETRY_HMAC_KEY_VERSION`, `SOC_CORRELATION_HMAC_KEY`, `SOC_GEOIP_DATABASE_PATH`, `SOC_GEOLOCATION_HMAC_SECRET`, `SOC_GEOLOCATION_PROVIDER`, and `STORAGE_PROVIDER`.

Test/maintenance-only references include `ALLOW_MARKETPLACE_SAMPLE_SEED`, `ALLOW_POLICY_FIXTURE_INTEGRATION_FINDINGS`, `ALLOW_TEST_DATABASE_MUTATION`, `EXPLICIT_RESTORE_TARGET_REQUIRED`, `RESTORE_DATABASE_URL`, `SEED_TEST_PASSWORD`, `SOURCE_DATABASE_URL`, and `SYNTHETIC_ACKNOWLEDGEMENT`. These must not be copied to production without a separately reviewed operational need.

The production environment template is incomplete relative to code: it omits multiple security/HMAC/encryption/telemetry/Azure-search variables and uses `SMTP_PASSWORD`, while the checklist refers to `SMTP_PASS`.

## Local inventory findings that require later remediation review

1. `NEXTAUTH_SECRET` falls back to a known development string in both auth configuration and request proxy. Production must fail closed when the secret is missing.
2. Support and feedback submission forms are visual scaffolds without a wired mutation.
3. Reviews and notifications are represented in the schema but lack complete dedicated workflows.
4. PWA manifest/icons exist, but no service worker exists; offline/PWA parity cannot be claimed.
5. Capacitor configuration exists, but native platform projects were not found.
6. The Azure API implementation exists locally, while Azure production metadata currently shows no Container App instance.
7. The payment live-pilot code exists, but historical approved status is NO-GO; no live payment may be enabled as part of parity deployment.
8. Current reports and uncommitted implementation conflict; current release gates remain mandatory.

`PHASE_1_LOCAL_INVENTORY_FROZEN`
