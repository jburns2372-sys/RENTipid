# RENTipid Database Register

Canonical schema: `prisma/schema.prisma` using PostgreSQL and Prisma 6.19.3. The schema uses string-backed user roles/statuses alongside Prisma enums for many operational domains.

| Domain | Models / records | Module use | Current status | Finding |
| --- | --- | --- | --- | --- |
| Identity | `User`, `UserMfa`, `UserProfile`, `BusinessProfile`, `SocialAccount`, `PasswordResetToken`, `PasswordResetRequest` | Auth, profiles, MFA, provider/business identity and recovery foundation | IN IMPLEMENTATION | Password recovery models validate but migration is unapplied; user role/status remain unconstrained strings |
| Address | `Address`, `PsgcSubdivision`, `AddressApiRateLimit` | Global/PH canonical address, rate limiting | CLOSED / FROZEN | Frozen migration chain through `20260811000001_add_psgc_subdivision` |
| Marketplace | `Category`, `CategoryRequirement`, `Listing`, `ListingPhoto`, `ListingDocument`, `VerificationDocument` | Catalogue, listings, media, KYC | IN IMPLEMENTATION | Required workflows not fully accepted |
| Prohibited items | `ProhibitedItemPolicy`, `ProhibitedItemPolicyVersion`, `ProhibitedItemDefinition`, `ListingPolicyEvaluation`, `ListingEnforcementCase`, `ListingPolicyAppeal`, `PolicyChangeRecord` and related event/evidence records | Classification, enforcement, appeal | IN IMPLEMENTATION | Historical closure conflict requires targeted reconciliation |
| Booking | `Booking`, `BookingStatusHistory`, `RentalAgreement`, `InspectionReport`, `InspectionPhoto`, `TurnoverRecord`, `Notification` | Booking through handover/return | IN IMPLEMENTATION | Whole state-machine and notification delivery incomplete |
| Trust | `DamageClaim`, `DamageClaimPhoto`, `DisputeCase`, `Review`, `InsurancePartner`, `InsuranceProduct`, `InsuranceOffer`, `InsurancePolicy`, `InsuranceClaim`, `InsuranceWebhookEvent` | Claims, disputes, reviews and Insurance foundation | IN IMPLEMENTATION | Insurance Technical Foundation Slice 1 is LOCAL DATABASE MIGRATED; full lifecycle/integration is deferred and review mutations remain incomplete |
| Payments | `Payment`, `GatewayTransaction`, `PaymentWebhookLog`, `PaymentReconciliationLog`, `PaymentActionLog`, `FinanceLedger`, `DepositAction`, `RefundRequest`, `ProviderPayout`, `PayoutBatch` | Checkout, callbacks, ledger, refunds, payouts | IN IMPLEMENTATION | Real refund/payout paths are placeholders/manual |
| Configuration | `SystemSetting`, `SystemSettings`, `AppReleaseVersion` | Feature flags and launch controls | IN IMPLEMENTATION | Two setting models and database-dependent initialization require reconciliation |
| Audit/operations | `AuditLog`, `ApiSecurityLog`, `AuthenticationSecurityLog`, `SystemErrorLog` | Security and operations trace | LOCAL ACCEPTANCE PASS | Whole-app mutation coverage still needs proof |
| AI/support | `AIBotLog`, `SupportTicket`, `BetaFeedback`, `IssueTicket`, `UATFlow`, `BetaInvitation` | AI audit, support, UAT | IN IMPLEMENTATION | User support/feedback write workflows and real AI tools incomplete |
| Privacy | `CookieConsentReceipt`, `DataSubjectRequest`, `PrivacyPolicyVersion`, `AccountDeletionRequest` and privacy governance records | Consent and DSR | LOCAL ACCEPTANCE PASS | Preview promotion remains open under new standard |
| Marketing | `MarketingCampaign`, `MarketingPost`, `CampaignApproval`, `PromotionAsset`, `UTMLink`, `CampaignAnalytics`, `ProviderPromotionOptIn`, `SocialPostQueue` | Social campaigns | IN IMPLEMENTATION | Mock-only social adapters and random placeholder analytics |
| Mobile/analytics | `MobileAnalytics` and campaign/release analytics records | Readiness and KPI dashboards | IN IMPLEMENTATION | Mock event sources and incomplete KPI reconciliation |
| SOC | `SecurityEvent`, `DetectionRule`, `SecurityAlert`, `IncidentCase` family, `SecurityResponsePlaybook` family, approval/execution/action records, behavioral-risk and geo-enrichment records | Detection, cases, response, reporting | LOCAL ACCEPTANCE PASS | Accepted historical local scope; Preview promotion open |

## Schema gaps and controls

- No conversation or direct-message model exists.
- Insurance Technical Foundation Slice 1 adds normalized partner/product/offer/policy/claim/webhook models. Consent persistence, evidence, ledger and settlement reuse decisions remain deferred to integration slices.
- Review and Notification models exist without complete product workflows.
- User role/status strings must be validated at every write until a safe database constraint/migration is designed.
- `SystemSetting` and `SystemSettings` must not be treated as interchangeable without a migration/reconciliation decision.
- Global fresh-database migration and required-data acceptance must use `prisma migrate deploy`; `db push` is not accepted as release evidence.
- No destructive reset is authorized for shared, Preview or Production databases.
