# RENTipid Database and Data Ownership Registry

Status: `FROZEN_WORKING_REGISTRY`

Schema authority: `prisma/schema.prisma`

Inventory: `79` models and `29` enums.

| Data domain | Models | Primary ownership/boundary |
| --- | --- | --- |
| Identity/profile | `User`, `UserMfa`, `UserProfile`, `BusinessProfile`, `AccountDeletionRequest` | Identity owner; protected profile fields and controlled deletion |
| Catalog/listings | `Category`, `CategoryRequirement`, `Listing`, `ListingPhoto`, `ListingDocument` | Provider-created; admin/compliance publication controls |
| Booking/rental/trust | `Booking`, `BookingStatusHistory`, `RentalAgreement`, `InspectionReport`, `InspectionPhoto`, `TurnoverRecord`, `DamageClaim`, `DamageClaimPhoto`, `DisputeCase`, `DepositAction`, `Review`, `Notification` | Transaction participants plus authorized operations roles |
| Verification | `VerificationDocument` | User subject; compliance review; restricted document storage |
| Payments/finance | `Payment`, `GatewayTransaction`, `PaymentWebhookLog`, `PaymentReconciliationLog`, `PaymentActionLog`, `FinanceLedger`, `RefundRequest`, `ProviderPayout`, `PayoutBatch` | Finance/system-controlled; never AI- or SOC-autonomous |
| Platform/audit | `AuditLog`, `ApiSecurityLog`, `AIBotLog`, `SystemSetting`, `SystemSettings`, `AuthenticationSecurityLog`, `SystemErrorLog` | Append/controlled settings; privileged access and redaction required |
| Marketing/social | `SocialAccount`, `MarketingCampaign`, `MarketingPost`, `CampaignApproval`, `PromotionAsset`, `UTMLink`, `CampaignAnalytics`, `ProviderPromotionOptIn`, `SocialPostQueue` | Provider/business/admin scope; external publication separately controlled |
| Release/support | `AppReleaseVersion`, `MobileAnalytics`, `BetaInvitation`, `BetaFeedback`, `IssueTicket`, `SupportTicket`, `UATFlow` | Admin/support/release operations |
| SOC telemetry/detection | `SecurityEvent`, `SecurityEventIngestionFailure`, `SecurityEventIngestionCheckpoint`, `DetectionRule`, `SecurityAlert`, `SecurityAlertEvidence`, `RuleEvaluationLog`, `DetectionEvaluationCheckpoint` | Privacy-safe security operations; lifecycle/environment separated |
| SOC incident cases | `IncidentCase`, `IncidentCaseHistory`, `IncidentCaseNote`, `IncidentCaseEvidence`, `IncidentCasePlaybookLink` | Analyst/supervisor workflow; evidence references constrained |
| SOC response | `SecurityResponsePlaybook`, `SecurityResponseStep`, `SecurityResponseApprovalRequest`, `SecurityResponseApprovalDecision`, `SecurityResponseApprovalGrant`, `SecurityResponseExecution`, `SecurityResponseAction` | Dual-control approved response lifecycle; reversible scope only |
| Behavioral risk | `BehavioralRiskAssessment`, `BehavioralRiskSignal`, `BehavioralRiskEvidenceLink` | Read-only investigation/intelligence scope |
| Geolocation | `SecurityEventGeoEnrichment` | Privacy-safe derived enrichment; raw/private IP restrictions |

State enums:

`SecurityEventSource`, `SecurityDomain`, `SecurityEventClassification`,
`SecuritySeverity`, `SecurityLifecycle`, `SecurityProcessingStatus`,
`SecurityEnvironment`, `DetectionRuleStatus`, `DetectionRuleCreatorType`,
`SecurityAlertReviewStatus`, `AlertEvidenceRole`, `RuleEvaluationOutcome`,
`DetectionDeduplicationStrategy`, `DetectionCorrelationSubject`,
`DetectionConfidenceFormula`, `IncidentCaseStatus`, `IncidentCaseSeverity`,
`IncidentCaseOrigin`, `IncidentCaseHistoryReason`, `IncidentCaseNoteType`,
`IncidentCaseEvidenceType`, `IncidentCaseEvidenceSource`,
`SecurityPlaybookStatus`, `SecurityResponseActionType`,
`SecurityResponseReversibility`, `SecurityApprovalStatus`,
`SecurityApprovalEventType`, `SecurityApprovalGrantState`,
`SecurityExecutionStatus`.

Safety boundaries:

- database content was not accessed for this documentation;
- model presence does not prove production records or deployment;
- migrations and schema were not modified;
- manuals must use current service authorization, not model names, to explain
  who may mutate data;
- secrets, ciphertext, raw credentials, and private documents are never
  documentation evidence.

Canonical manual cross-reference: `../04-TECHNICAL-MANUALS/RENTipid_TECHNICAL_REFERENCE.md`,
`../06-DEVELOPER-HANDOVER/RENTipid_DEVELOPER_HANDOVER_MANUAL.md`, and Master
Part XV.
