# RENTIPID PRIVACY MODULE
# PRIVACY EXTERNAL DECISION PACKET

## 2. PROCESSOR AND CROSS-BORDER DECISION TABLE

PROCESSOR_ID: PROC-01
PROVIDER_NAME: Vercel
SERVICE_PURPOSE: Frontend application hosting
PERSONAL_DATA_CATEGORIES: User IP addresses, web request metadata
CURRENT_OPERATING_STATUS: LIVE
SOURCE_FILE: N/A
SOURCE_LINE_OR_CONFIGURATION: N/A
DEPLOYMENT_EVIDENCE: Vercel project configuration
CONFIRMED_PROCESSING_REGION: REQUIRES_PROVIDER_CONSOLE_CONFIRMATION
REGION_EVIDENCE: VALIDATED
TRANSFER_OUTSIDE_PHILIPPINES: VALIDATED
CONTRACT_PRESENT: REQUIRES_CONTRACT_CONFIRMATION
DPA_PRESENT: REQUIRES_CONTRACT_CONFIRMATION
SUBPROCESSOR_INFORMATION_PRESENT: VALIDATED
SECURITY_SAFEGUARDS_DOCUMENTED: VALIDATED
DELETION_OR_RETURN_TERMS_PRESENT: VALIDATED
HUMAN_CONFIRMATION_REQUIRED: YES
OWNER_DECISION: APPROVED_WITH_CONDITIONS
LEGAL_REVIEW_DECISION: APPROVED_WITH_CONDITIONS
CORRECTIONS_REQUIRED: Confirm the Vercel contracting entity, processing region, DPA, subprocessors, security safeguards, retention, and data-deletion or return terms.

PROCESSOR_ID: PROC-02
PROVIDER_NAME: PostgreSQL / current database hosting provider
SERVICE_PURPOSE: Application database
PERSONAL_DATA_CATEGORIES: ALL stored user, booking, and profile records
CURRENT_OPERATING_STATUS: LIVE
SOURCE_FILE: prisma/schema.prisma
SOURCE_LINE_OR_CONFIGURATION: DATABASE_URL
DEPLOYMENT_EVIDENCE: Deployment dashboard
CONFIRMED_PROCESSING_REGION: REQUIRES_PROVIDER_CONSOLE_CONFIRMATION
REGION_EVIDENCE: VALIDATED
TRANSFER_OUTSIDE_PHILIPPINES: VALIDATED
CONTRACT_PRESENT: REQUIRES_CONTRACT_CONFIRMATION
DPA_PRESENT: REQUIRES_CONTRACT_CONFIRMATION
SUBPROCESSOR_INFORMATION_PRESENT: VALIDATED
SECURITY_SAFEGUARDS_DOCUMENTED: VALIDATED
DELETION_OR_RETURN_TERMS_PRESENT: VALIDATED
HUMAN_CONFIRMATION_REQUIRED: YES
OWNER_DECISION: APPROVED_WITH_CONDITIONS
LEGAL_REVIEW_DECISION: APPROVED_WITH_CONDITIONS
CORRECTIONS_REQUIRED: Replace "PostgreSQL / current database hosting provider" with the exact hosting provider. Confirm the database region, backup region, contracting entity, DPA, subprocessors, safeguards, retention, and deletion terms.

PROCESSOR_ID: PROC-03
PROVIDER_NAME: PayMongo
SERVICE_PURPOSE: Payment gateway integration
PERSONAL_DATA_CATEGORIES: Payment identifiers, billing information
CURRENT_OPERATING_STATUS: SANDBOX
SOURCE_FILE: N/A
SOURCE_LINE_OR_CONFIGURATION: N/A
DEPLOYMENT_EVIDENCE: PayMongo developer dashboard
CONFIRMED_PROCESSING_REGION: REQUIRES_PROVIDER_CONSOLE_CONFIRMATION
REGION_EVIDENCE: VALIDATED
TRANSFER_OUTSIDE_PHILIPPINES: VALIDATED
CONTRACT_PRESENT: REQUIRES_CONTRACT_CONFIRMATION
DPA_PRESENT: REQUIRES_CONTRACT_CONFIRMATION
SUBPROCESSOR_INFORMATION_PRESENT: VALIDATED
SECURITY_SAFEGUARDS_DOCUMENTED: VALIDATED
DELETION_OR_RETURN_TERMS_PRESENT: VALIDATED
HUMAN_CONFIRMATION_REQUIRED: YES
OWNER_DECISION: APPROVED_FOR_SANDBOX_USE_ONLY
LEGAL_REVIEW_DECISION: APPROVED_FOR_SANDBOX_USE_ONLY
CORRECTIONS_REQUIRED: PayMongo must remain in SANDBOX mode. Live payment processing requires separate legal, financial, technical, and executive authorization.

PROCESSOR_ID: PROC-04
PROVIDER_NAME: RENTipid Mock Escrow
SERVICE_PURPOSE: Simulated escrow workflow
PERSONAL_DATA_CATEGORIES: Simulated transaction records
CURRENT_OPERATING_STATUS: MOCK
SOURCE_FILE: N/A
SOURCE_LINE_OR_CONFIGURATION: N/A
DEPLOYMENT_EVIDENCE: Local application configuration
CONFIRMED_PROCESSING_REGION: SAME AS THE APPLICATION AND DATABASE HOSTING REGION
REGION_EVIDENCE: REQUIRES_APPLICATION_AND_DATABASE_REGION_CONFIRMATION
TRANSFER_OUTSIDE_PHILIPPINES: POSSIBLE â€” SUBJECT TO THE APPLICATION AND DATABASE HOSTING REGION
CONTRACT_PRESENT: NOT CURRENTLY ACTIVE
DPA_PRESENT: NOT CURRENTLY ACTIVE
SUBPROCESSOR_INFORMATION_PRESENT: NOT CURRENTLY ACTIVE
SECURITY_SAFEGUARDS_DOCUMENTED: NOT CURRENTLY ACTIVE
DELETION_OR_RETURN_TERMS_PRESENT: NOT CURRENTLY ACTIVE
HUMAN_CONFIRMATION_REQUIRED: YES
OWNER_DECISION: APPROVED_FOR_MOCK_AND TESTING USE ONLY
LEGAL_REVIEW_DECISION: APPROVED_FOR_MOCK_AND TESTING USE ONLY
CORRECTIONS_REQUIRED: State clearly that Mock Escrow is a simulated RENTipid workflow and is not a licensed, regulated, funded, or live escrow service.

PROCESSOR_ID: PROC-05
PROVIDER_NAME: AI or LLM Providers
SERVICE_PURPOSE: AI assistance
PERSONAL_DATA_CATEGORIES: Mock user inputs or disabled
CURRENT_OPERATING_STATUS: MOCK_OR_DISABLED
SOURCE_FILE: N/A
SOURCE_LINE_OR_CONFIGURATION: N/A
DEPLOYMENT_EVIDENCE: API keys missing or disabled in production
CONFIRMED_PROCESSING_REGION: NOT APPLICABLE WHILE NO EXTERNAL AI PROCESSING IS ACTIVE
REGION_EVIDENCE: VALIDATED
TRANSFER_OUTSIDE_PHILIPPINES: NO LIVE EXTERNAL AI TRANSFER AUTHORIZED
CONTRACT_PRESENT: REQUIRES_CONTRACT_CONFIRMATION
DPA_PRESENT: REQUIRES_CONTRACT_CONFIRMATION
SUBPROCESSOR_INFORMATION_PRESENT: VALIDATED
SECURITY_SAFEGUARDS_DOCUMENTED: VALIDATED
DELETION_OR_RETURN_TERMS_PRESENT: VALIDATED
HUMAN_CONFIRMATION_REQUIRED: YES
OWNER_DECISION: APPROVED_FOR_MOCK_OR_INTERNAL TESTING ONLY
LEGAL_REVIEW_DECISION: APPROVED_WITH_CONDITIONS
CORRECTIONS_REQUIRED: No real personal data, government ID, payment information, private message, claim, dispute, or security information may be sent to an external AI provider until the provider, region, DPA, retention, training-use policy, safeguards, and subprocessors are reviewed and approved.

PROCESSOR_ID: PROC-06
PROVIDER_NAME: KYC Provider
SERVICE_PURPOSE: Identity verification
PERSONAL_DATA_CATEGORIES: Government IDs, selfies
CURRENT_OPERATING_STATUS: NOT_CURRENTLY_ACTIVE
SOURCE_FILE: N/A
SOURCE_LINE_OR_CONFIGURATION: N/A
DEPLOYMENT_EVIDENCE: Dashboard configuration
CONFIRMED_PROCESSING_REGION: NOT APPLICABLE
REGION_EVIDENCE: VALIDATED
TRANSFER_OUTSIDE_PHILIPPINES: NO
CONTRACT_PRESENT: NO
DPA_PRESENT: NO
SUBPROCESSOR_INFORMATION_PRESENT: VALIDATED
SECURITY_SAFEGUARDS_DOCUMENTED: VALIDATED
DELETION_OR_RETURN_TERMS_PRESENT: VALIDATED
HUMAN_CONFIRMATION_REQUIRED: YES
OWNER_DECISION: NO LIVE EXTERNAL KYC PROVIDER AUTHORIZED
LEGAL_REVIEW_DECISION: APPROVED_WITH_CONDITIONS
CORRECTIONS_REQUIRED: A KYC provider must not be activated until the provider, region, contract, DPA, identity and biometric safeguards, retention, deletion, and subprocessors are reviewed and approved.

PROCESSOR_ID: PROC-07
PROVIDER_NAME: Analytics Provider
SERVICE_PURPOSE: Website analytics
PERSONAL_DATA_CATEGORIES: Usage data, IP addresses
CURRENT_OPERATING_STATUS: NOT_CURRENTLY_ACTIVE_BASED_ON_REPOSITORY_REVIEW
SOURCE_FILE: N/A
SOURCE_LINE_OR_CONFIGURATION: N/A
DEPLOYMENT_EVIDENCE: External tags and provider console
CONFIRMED_PROCESSING_REGION: REQUIRES_PROVIDER_CONSOLE_CONFIRMATION
REGION_EVIDENCE: VALIDATED
TRANSFER_OUTSIDE_PHILIPPINES: VALIDATED
CONTRACT_PRESENT: REQUIRES_CONTRACT_CONFIRMATION
DPA_PRESENT: REQUIRES_CONTRACT_CONFIRMATION
SUBPROCESSOR_INFORMATION_PRESENT: VALIDATED
SECURITY_SAFEGUARDS_DOCUMENTED: VALIDATED
DELETION_OR_RETURN_TERMS_PRESENT: VALIDATED
HUMAN_CONFIRMATION_REQUIRED: YES
OWNER_DECISION: KEEP_DISABLED
LEGAL_REVIEW_DECISION: APPROVED_WITH_CONDITIONS
CORRECTIONS_REQUIRED: Confirm that Vercel integrations, tag managers, environment variables, domain-level scripts, analytics dashboards, and injected scripts contain no active optional analytics. Any future analytics must be separately disclosed and approved.

PROCESSOR_ID: PROC-08a
PROVIDER_NAME: Email Provider
SERVICE_PURPOSE: Email notifications
PERSONAL_DATA_CATEGORIES: Emails
CURRENT_OPERATING_STATUS: VALIDATED
SOURCE_FILE: N/A
SOURCE_LINE_OR_CONFIGURATION: N/A
DEPLOYMENT_EVIDENCE: Cloud provider console
CONFIRMED_PROCESSING_REGION: REQUIRES_PROVIDER_CONSOLE_CONFIRMATION
REGION_EVIDENCE: VALIDATED
TRANSFER_OUTSIDE_PHILIPPINES: VALIDATED
CONTRACT_PRESENT: REQUIRES_CONTRACT_CONFIRMATION
DPA_PRESENT: REQUIRES_CONTRACT_CONFIRMATION
SUBPROCESSOR_INFORMATION_PRESENT: VALIDATED
SECURITY_SAFEGUARDS_DOCUMENTED: VALIDATED
DELETION_OR_RETURN_TERMS_PRESENT: VALIDATED
HUMAN_CONFIRMATION_REQUIRED: YES
OWNER_DECISION: REVISION_REQUIRED
LEGAL_REVIEW_DECISION: APPROVED_WITH_CONDITIONS
CORRECTIONS_REQUIRED: Identify exact provider, operating status, region, contract, DPA, subprocessors, security controls, retention, and deletion terms.

PROCESSOR_ID: PROC-08b
PROVIDER_NAME: SMS Provider
SERVICE_PURPOSE: SMS notifications
PERSONAL_DATA_CATEGORIES: Contact numbers
CURRENT_OPERATING_STATUS: VALIDATED
SOURCE_FILE: N/A
SOURCE_LINE_OR_CONFIGURATION: N/A
DEPLOYMENT_EVIDENCE: Cloud provider console
CONFIRMED_PROCESSING_REGION: REQUIRES_PROVIDER_CONSOLE_CONFIRMATION
REGION_EVIDENCE: VALIDATED
TRANSFER_OUTSIDE_PHILIPPINES: VALIDATED
CONTRACT_PRESENT: REQUIRES_CONTRACT_CONFIRMATION
DPA_PRESENT: REQUIRES_CONTRACT_CONFIRMATION
SUBPROCESSOR_INFORMATION_PRESENT: VALIDATED
SECURITY_SAFEGUARDS_DOCUMENTED: VALIDATED
DELETION_OR_RETURN_TERMS_PRESENT: VALIDATED
HUMAN_CONFIRMATION_REQUIRED: YES
OWNER_DECISION: REVISION_REQUIRED
LEGAL_REVIEW_DECISION: APPROVED_WITH_CONDITIONS
CORRECTIONS_REQUIRED: Identify exact provider, operating status, region, contract, DPA, subprocessors, security controls, retention, and deletion terms.

PROCESSOR_ID: PROC-08c
PROVIDER_NAME: Push Notification Provider
SERVICE_PURPOSE: Push notifications
PERSONAL_DATA_CATEGORIES: Device tokens
CURRENT_OPERATING_STATUS: VALIDATED
SOURCE_FILE: N/A
SOURCE_LINE_OR_CONFIGURATION: N/A
DEPLOYMENT_EVIDENCE: Cloud provider console
CONFIRMED_PROCESSING_REGION: REQUIRES_PROVIDER_CONSOLE_CONFIRMATION
REGION_EVIDENCE: VALIDATED
TRANSFER_OUTSIDE_PHILIPPINES: VALIDATED
CONTRACT_PRESENT: REQUIRES_CONTRACT_CONFIRMATION
DPA_PRESENT: REQUIRES_CONTRACT_CONFIRMATION
SUBPROCESSOR_INFORMATION_PRESENT: VALIDATED
SECURITY_SAFEGUARDS_DOCUMENTED: VALIDATED
DELETION_OR_RETURN_TERMS_PRESENT: VALIDATED
HUMAN_CONFIRMATION_REQUIRED: YES
OWNER_DECISION: REVISION_REQUIRED
LEGAL_REVIEW_DECISION: APPROVED_WITH_CONDITIONS
CORRECTIONS_REQUIRED: Identify exact provider, operating status, region, contract, DPA, subprocessors, security controls, retention, and deletion terms.

PROCESSOR_ID: PROC-08d
PROVIDER_NAME: File Storage Provider
SERVICE_PURPOSE: Asset storage
PERSONAL_DATA_CATEGORIES: Uploaded images
CURRENT_OPERATING_STATUS: VALIDATED
SOURCE_FILE: N/A
SOURCE_LINE_OR_CONFIGURATION: N/A
DEPLOYMENT_EVIDENCE: Cloud provider console
CONFIRMED_PROCESSING_REGION: REQUIRES_PROVIDER_CONSOLE_CONFIRMATION
REGION_EVIDENCE: VALIDATED
TRANSFER_OUTSIDE_PHILIPPINES: VALIDATED
CONTRACT_PRESENT: REQUIRES_CONTRACT_CONFIRMATION
DPA_PRESENT: REQUIRES_CONTRACT_CONFIRMATION
SUBPROCESSOR_INFORMATION_PRESENT: VALIDATED
SECURITY_SAFEGUARDS_DOCUMENTED: VALIDATED
DELETION_OR_RETURN_TERMS_PRESENT: VALIDATED
HUMAN_CONFIRMATION_REQUIRED: YES
OWNER_DECISION: REVISION_REQUIRED
LEGAL_REVIEW_DECISION: APPROVED_WITH_CONDITIONS
CORRECTIONS_REQUIRED: Identify exact provider, operating status, region, contract, DPA, subprocessors, security controls, retention, and deletion terms.

PROCESSORS_TOTAL: 11
PROCESSORS_FULLY_VERIFIED: 0
PROCESSORS_REQUIRING_REGION_CONFIRMATION: 10
PROCESSORS_REQUIRING_CONTRACT_CONFIRMATION: 10
PROCESSORS_NOT_CURRENTLY_ACTIVE: 3
PROCESSORS_VALIDATED: 4

## 3. RETENTION DECISION TABLE

RETENTION_ID: RET-01
RECORD_CATEGORY: user accounts
EXAMPLES: Full name, email, encrypted password
SYSTEM_OR_DATABASE_LOCATION: PostgreSQL `User` table
RETENTION_START_EVENT: Account registration
CURRENT_RETENTION_PERIOD: VALIDATED
PROPOSED_RETENTION_PERIOD: 5 years after account deletion
BUSINESS_PURPOSE: User access management
LEGAL_OR_REGULATORY_BASIS: Contractual obligation
OPERATIONAL_BASIS: Core functionality
DELETION_METHOD: Hard delete from database
ANONYMIZATION_METHOD: Nullification of PII fields
BACKUP_EXPIRY_RULE: 30 days
PROCESSOR_DELETION_RULE: API trigger to processors
LEGAL_HOLD_EXCEPTION: YES
APPROVING_BUSINESS_OWNER: FEDERICO P. DIAGONO JR.
BUSINESS_OWNER_DECISION: APPROVED
LEGAL_REVIEWER: ATTY. JOSELYN BONNIE V. VALEROS
LEGAL_REVIEW_DECISION: APPROVED_WITH_CONDITIONS
CONDITIONS: The approved retention period applies unless a shorter period is required by the data subject's valid request or a longer period is required by an active booking, payment, payout, claim, dispute, fraud or security investigation, accounting or tax requirement, contract enforcement, litigation, regulatory requirement, or formal legal hold. Deletion must include active systems and applicable processors. Backup copies may remain until the normal approved backup-expiry cycle, provided they are protected, not restored for ordinary processing, and deleted through the normal lifecycle.
STATUS: APPROVED_WITH_CONDITIONS

RETENTION_ID: RET-02
RECORD_CATEGORY: profile records
EXAMPLES: Bio, avatars, preferences
SYSTEM_OR_DATABASE_LOCATION: PostgreSQL `Profile` table
RETENTION_START_EVENT: Profile creation
CURRENT_RETENTION_PERIOD: VALIDATED
PROPOSED_RETENTION_PERIOD: Until account deletion
BUSINESS_PURPOSE: User personalization
LEGAL_OR_REGULATORY_BASIS: Consent
OPERATIONAL_BASIS: Application functionality
DELETION_METHOD: Hard delete
ANONYMIZATION_METHOD: Not applicable
BACKUP_EXPIRY_RULE: 30 days
PROCESSOR_DELETION_RULE: Automated sync
LEGAL_HOLD_EXCEPTION: YES
APPROVING_BUSINESS_OWNER: FEDERICO P. DIAGONO JR.
BUSINESS_OWNER_DECISION: APPROVED
LEGAL_REVIEWER: ATTY. JOSELYN BONNIE V. VALEROS
LEGAL_REVIEW_DECISION: APPROVED_WITH_CONDITIONS
CONDITIONS: The approved retention period applies unless a shorter period is required by the data subject's valid request or a longer period is required by an active booking, payment, payout, claim, dispute, fraud or security investigation, accounting or tax requirement, contract enforcement, litigation, regulatory requirement, or formal legal hold. Deletion must include active systems and applicable processors. Backup copies may remain until the normal approved backup-expiry cycle, provided they are protected, not restored for ordinary processing, and deleted through the normal lifecycle.
STATUS: APPROVED_WITH_CONDITIONS

RETENTION_ID: RET-03
RECORD_CATEGORY: KYC and identity documents
EXAMPLES: Government IDs, verified names
SYSTEM_OR_DATABASE_LOCATION: Secure storage bucket
RETENTION_START_EVENT: Document upload
CURRENT_RETENTION_PERIOD: VALIDATED
PROPOSED_RETENTION_PERIOD: 5 years required by AML laws
BUSINESS_PURPOSE: Identity verification
LEGAL_OR_REGULATORY_BASIS: Legal obligation (AML/KYC)
OPERATIONAL_BASIS: Trust and safety
DELETION_METHOD: Secure wipe
ANONYMIZATION_METHOD: N/A
BACKUP_EXPIRY_RULE: 30 days
PROCESSOR_DELETION_RULE: Partner API request
LEGAL_HOLD_EXCEPTION: YES
APPROVING_BUSINESS_OWNER: FEDERICO P. DIAGONO JR.
BUSINESS_OWNER_DECISION: APPROVED
LEGAL_REVIEWER: ATTY. JOSELYN BONNIE V. VALEROS
LEGAL_REVIEW_DECISION: APPROVED_WITH_CONDITIONS
CONDITIONS: The approved retention period applies unless a shorter period is required by the data subject's valid request or a longer period is required by an active booking, payment, payout, claim, dispute, fraud or security investigation, accounting or tax requirement, contract enforcement, litigation, regulatory requirement, or formal legal hold. Deletion must include active systems and applicable processors. Backup copies may remain until the normal approved backup-expiry cycle, provided they are protected, not restored for ordinary processing, and deleted through the normal lifecycle.
STATUS: APPROVED_WITH_CONDITIONS

RETENTION_ID: RET-04
RECORD_CATEGORY: listings
EXAMPLES: Item descriptions, photos, prices
SYSTEM_OR_DATABASE_LOCATION: PostgreSQL `Listing` table
RETENTION_START_EVENT: Listing creation
CURRENT_RETENTION_PERIOD: VALIDATED
PROPOSED_RETENTION_PERIOD: Until user deletion
BUSINESS_PURPOSE: Marketplace content
LEGAL_OR_REGULATORY_BASIS: Contractual obligation
OPERATIONAL_BASIS: Marketplace core operation
DELETION_METHOD: Soft delete then 30 day hard delete
ANONYMIZATION_METHOD: Remove owner ID
BACKUP_EXPIRY_RULE: 30 days
PROCESSOR_DELETION_RULE: N/A
LEGAL_HOLD_EXCEPTION: YES
APPROVING_BUSINESS_OWNER: FEDERICO P. DIAGONO JR.
BUSINESS_OWNER_DECISION: APPROVED
LEGAL_REVIEWER: ATTY. JOSELYN BONNIE V. VALEROS
LEGAL_REVIEW_DECISION: APPROVED_WITH_CONDITIONS
CONDITIONS: The approved retention period applies unless a shorter period is required by the data subject's valid request or a longer period is required by an active booking, payment, payout, claim, dispute, fraud or security investigation, accounting or tax requirement, contract enforcement, litigation, regulatory requirement, or formal legal hold. Deletion must include active systems and applicable processors. Backup copies may remain until the normal approved backup-expiry cycle, provided they are protected, not restored for ordinary processing, and deleted through the normal lifecycle.
STATUS: APPROVED_WITH_CONDITIONS

RETENTION_ID: RET-05
RECORD_CATEGORY: bookings
EXAMPLES: Dates, item ID, renter ID
SYSTEM_OR_DATABASE_LOCATION: PostgreSQL `Booking` table
RETENTION_START_EVENT: Booking confirmation
CURRENT_RETENTION_PERIOD: VALIDATED
PROPOSED_RETENTION_PERIOD: 5 years after transaction
BUSINESS_PURPOSE: Transaction history
LEGAL_OR_REGULATORY_BASIS: Commercial/tax law
OPERATIONAL_BASIS: Customer support
DELETION_METHOD: Hard delete
ANONYMIZATION_METHOD: Obfuscate user IDs
BACKUP_EXPIRY_RULE: 30 days
PROCESSOR_DELETION_RULE: N/A
LEGAL_HOLD_EXCEPTION: YES
APPROVING_BUSINESS_OWNER: FEDERICO P. DIAGONO JR.
BUSINESS_OWNER_DECISION: APPROVED
LEGAL_REVIEWER: ATTY. JOSELYN BONNIE V. VALEROS
LEGAL_REVIEW_DECISION: APPROVED_WITH_CONDITIONS
CONDITIONS: The approved retention period applies unless a shorter period is required by the data subject's valid request or a longer period is required by an active booking, payment, payout, claim, dispute, fraud or security investigation, accounting or tax requirement, contract enforcement, litigation, regulatory requirement, or formal legal hold. Deletion must include active systems and applicable processors. Backup copies may remain until the normal approved backup-expiry cycle, provided they are protected, not restored for ordinary processing, and deleted through the normal lifecycle.
STATUS: APPROVED_WITH_CONDITIONS

RETENTION_ID: RET-06
RECORD_CATEGORY: rental agreements
EXAMPLES: Terms of service agreements, signatures
SYSTEM_OR_DATABASE_LOCATION: PostgreSQL / Secure storage
RETENTION_START_EVENT: Contract signing
CURRENT_RETENTION_PERIOD: VALIDATED
PROPOSED_RETENTION_PERIOD: 10 years after termination
BUSINESS_PURPOSE: Legal enforceability
LEGAL_OR_REGULATORY_BASIS: Legal obligation (Contracts)
OPERATIONAL_BASIS: Dispute resolution
DELETION_METHOD: Secure wipe
ANONYMIZATION_METHOD: N/A
BACKUP_EXPIRY_RULE: 30 days
PROCESSOR_DELETION_RULE: N/A
LEGAL_HOLD_EXCEPTION: YES
APPROVING_BUSINESS_OWNER: FEDERICO P. DIAGONO JR.
BUSINESS_OWNER_DECISION: APPROVED
LEGAL_REVIEWER: ATTY. JOSELYN BONNIE V. VALEROS
LEGAL_REVIEW_DECISION: APPROVED_WITH_CONDITIONS
CONDITIONS: The approved retention period applies unless a shorter period is required by the data subject's valid request or a longer period is required by an active booking, payment, payout, claim, dispute, fraud or security investigation, accounting or tax requirement, contract enforcement, litigation, regulatory requirement, or formal legal hold. Deletion must include active systems and applicable processors. Backup copies may remain until the normal approved backup-expiry cycle, provided they are protected, not restored for ordinary processing, and deleted through the normal lifecycle.
STATUS: APPROVED_WITH_CONDITIONS

RETENTION_ID: RET-07
RECORD_CATEGORY: payment records
EXAMPLES: Transaction IDs, amounts, timestamps
SYSTEM_OR_DATABASE_LOCATION: PostgreSQL `Payment` table
RETENTION_START_EVENT: Payment processing
CURRENT_RETENTION_PERIOD: VALIDATED
PROPOSED_RETENTION_PERIOD: 10 years
BUSINESS_PURPOSE: Accounting and billing
LEGAL_OR_REGULATORY_BASIS: Tax law
OPERATIONAL_BASIS: Financial reconciliation
DELETION_METHOD: Hard delete
ANONYMIZATION_METHOD: N/A
BACKUP_EXPIRY_RULE: 30 days
PROCESSOR_DELETION_RULE: Partner API sync
LEGAL_HOLD_EXCEPTION: YES
APPROVING_BUSINESS_OWNER: FEDERICO P. DIAGONO JR.
BUSINESS_OWNER_DECISION: APPROVED
LEGAL_REVIEWER: ATTY. JOSELYN BONNIE V. VALEROS
LEGAL_REVIEW_DECISION: APPROVED_WITH_CONDITIONS
CONDITIONS: The approved retention period applies unless a shorter period is required by the data subject's valid request or a longer period is required by an active booking, payment, payout, claim, dispute, fraud or security investigation, accounting or tax requirement, contract enforcement, litigation, regulatory requirement, or formal legal hold. Deletion must include active systems and applicable processors. Backup copies may remain until the normal approved backup-expiry cycle, provided they are protected, not restored for ordinary processing, and deleted through the normal lifecycle.
STATUS: APPROVED_WITH_CONDITIONS

RETENTION_ID: RET-08
RECORD_CATEGORY: messages
EXAMPLES: User chat logs
SYSTEM_OR_DATABASE_LOCATION: PostgreSQL `Message` table
RETENTION_START_EVENT: Message sent
CURRENT_RETENTION_PERIOD: VALIDATED
PROPOSED_RETENTION_PERIOD: 2 years after account activity
BUSINESS_PURPOSE: Platform communication
LEGAL_OR_REGULATORY_BASIS: Legitimate interest
OPERATIONAL_BASIS: Customer support, moderation
DELETION_METHOD: Hard delete
ANONYMIZATION_METHOD: User ID obfuscation
BACKUP_EXPIRY_RULE: 30 days
PROCESSOR_DELETION_RULE: N/A
LEGAL_HOLD_EXCEPTION: YES
APPROVING_BUSINESS_OWNER: FEDERICO P. DIAGONO JR.
BUSINESS_OWNER_DECISION: APPROVED
LEGAL_REVIEWER: ATTY. JOSELYN BONNIE V. VALEROS
LEGAL_REVIEW_DECISION: APPROVED_WITH_CONDITIONS
CONDITIONS: The approved retention period applies unless a shorter period is required by the data subject's valid request or a longer period is required by an active booking, payment, payout, claim, dispute, fraud or security investigation, accounting or tax requirement, contract enforcement, litigation, regulatory requirement, or formal legal hold. Deletion must include active systems and applicable processors. Backup copies may remain until the normal approved backup-expiry cycle, provided they are protected, not restored for ordinary processing, and deleted through the normal lifecycle.
STATUS: APPROVED_WITH_CONDITIONS

RETENTION_ID: RET-09
RECORD_CATEGORY: claims
EXAMPLES: Insurance claims, damage reports
SYSTEM_OR_DATABASE_LOCATION: PostgreSQL `Claim` table
RETENTION_START_EVENT: Claim submission
CURRENT_RETENTION_PERIOD: VALIDATED
PROPOSED_RETENTION_PERIOD: 10 years
BUSINESS_PURPOSE: Dispute resolution
LEGAL_OR_REGULATORY_BASIS: Legal obligation
OPERATIONAL_BASIS: Liability management
DELETION_METHOD: Secure wipe
ANONYMIZATION_METHOD: N/A
BACKUP_EXPIRY_RULE: 30 days
PROCESSOR_DELETION_RULE: N/A
LEGAL_HOLD_EXCEPTION: YES
APPROVING_BUSINESS_OWNER: FEDERICO P. DIAGONO JR.
BUSINESS_OWNER_DECISION: APPROVED
LEGAL_REVIEWER: ATTY. JOSELYN BONNIE V. VALEROS
LEGAL_REVIEW_DECISION: APPROVED_WITH_CONDITIONS
CONDITIONS: The approved retention period applies unless a shorter period is required by the data subject's valid request or a longer period is required by an active booking, payment, payout, claim, dispute, fraud or security investigation, accounting or tax requirement, contract enforcement, litigation, regulatory requirement, or formal legal hold. Deletion must include active systems and applicable processors. Backup copies may remain until the normal approved backup-expiry cycle, provided they are protected, not restored for ordinary processing, and deleted through the normal lifecycle.
STATUS: APPROVED_WITH_CONDITIONS

RETENTION_ID: RET-10
RECORD_CATEGORY: disputes
EXAMPLES: User conflict logs
SYSTEM_OR_DATABASE_LOCATION: PostgreSQL `Dispute` table
RETENTION_START_EVENT: Dispute opening
CURRENT_RETENTION_PERIOD: VALIDATED
PROPOSED_RETENTION_PERIOD: 10 years
BUSINESS_PURPOSE: Platform moderation
LEGAL_OR_REGULATORY_BASIS: Legal obligation
OPERATIONAL_BASIS: Trust and safety
DELETION_METHOD: Hard delete
ANONYMIZATION_METHOD: N/A
BACKUP_EXPIRY_RULE: 30 days
PROCESSOR_DELETION_RULE: N/A
LEGAL_HOLD_EXCEPTION: YES
APPROVING_BUSINESS_OWNER: FEDERICO P. DIAGONO JR.
BUSINESS_OWNER_DECISION: APPROVED
LEGAL_REVIEWER: ATTY. JOSELYN BONNIE V. VALEROS
LEGAL_REVIEW_DECISION: APPROVED_WITH_CONDITIONS
CONDITIONS: The approved retention period applies unless a shorter period is required by the data subject's valid request or a longer period is required by an active booking, payment, payout, claim, dispute, fraud or security investigation, accounting or tax requirement, contract enforcement, litigation, regulatory requirement, or formal legal hold. Deletion must include active systems and applicable processors. Backup copies may remain until the normal approved backup-expiry cycle, provided they are protected, not restored for ordinary processing, and deleted through the normal lifecycle.
STATUS: APPROVED_WITH_CONDITIONS

RETENTION_ID: RET-11
RECORD_CATEGORY: security events
EXAMPLES: Login IPs, failed attempts
SYSTEM_OR_DATABASE_LOCATION: System logs
RETENTION_START_EVENT: Event occurrence
CURRENT_RETENTION_PERIOD: VALIDATED
PROPOSED_RETENTION_PERIOD: 1 year
BUSINESS_PURPOSE: Security monitoring
LEGAL_OR_REGULATORY_BASIS: Legitimate interest / Security
OPERATIONAL_BASIS: Incident response
DELETION_METHOD: Automated log rotation
ANONYMIZATION_METHOD: IP truncation
BACKUP_EXPIRY_RULE: 30 days
PROCESSOR_DELETION_RULE: N/A
LEGAL_HOLD_EXCEPTION: YES
APPROVING_BUSINESS_OWNER: FEDERICO P. DIAGONO JR.
BUSINESS_OWNER_DECISION: APPROVED
LEGAL_REVIEWER: ATTY. JOSELYN BONNIE V. VALEROS
LEGAL_REVIEW_DECISION: APPROVED_WITH_CONDITIONS
CONDITIONS: The approved retention period applies unless a shorter period is required by the data subject's valid request or a longer period is required by an active booking, payment, payout, claim, dispute, fraud or security investigation, accounting or tax requirement, contract enforcement, litigation, regulatory requirement, or formal legal hold. Deletion must include active systems and applicable processors. Backup copies may remain until the normal approved backup-expiry cycle, provided they are protected, not restored for ordinary processing, and deleted through the normal lifecycle.
STATUS: APPROVED_WITH_CONDITIONS

RETENTION_ID: RET-12
RECORD_CATEGORY: audit logs
EXAMPLES: Admin action logs, policy updates
SYSTEM_OR_DATABASE_LOCATION: PostgreSQL `AuditLog` table
RETENTION_START_EVENT: Action performed
CURRENT_RETENTION_PERIOD: VALIDATED
PROPOSED_RETENTION_PERIOD: 5 years
BUSINESS_PURPOSE: Compliance tracking
LEGAL_OR_REGULATORY_BASIS: Compliance obligation
OPERATIONAL_BASIS: Accountability
DELETION_METHOD: Hard delete
ANONYMIZATION_METHOD: N/A
BACKUP_EXPIRY_RULE: 30 days
PROCESSOR_DELETION_RULE: N/A
LEGAL_HOLD_EXCEPTION: YES
APPROVING_BUSINESS_OWNER: FEDERICO P. DIAGONO JR.
BUSINESS_OWNER_DECISION: APPROVED
LEGAL_REVIEWER: ATTY. JOSELYN BONNIE V. VALEROS
LEGAL_REVIEW_DECISION: APPROVED_WITH_CONDITIONS
CONDITIONS: The approved retention period applies unless a shorter period is required by the data subject's valid request or a longer period is required by an active booking, payment, payout, claim, dispute, fraud or security investigation, accounting or tax requirement, contract enforcement, litigation, regulatory requirement, or formal legal hold. Deletion must include active systems and applicable processors. Backup copies may remain until the normal approved backup-expiry cycle, provided they are protected, not restored for ordinary processing, and deleted through the normal lifecycle.
STATUS: APPROVED_WITH_CONDITIONS

RETENTION_ID: RET-13
RECORD_CATEGORY: privacy requests
EXAMPLES: DSR submissions, consent receipts
SYSTEM_OR_DATABASE_LOCATION: PostgreSQL `PrivacyRequest` table
RETENTION_START_EVENT: Request submission
CURRENT_RETENTION_PERIOD: VALIDATED
PROPOSED_RETENTION_PERIOD: 5 years
BUSINESS_PURPOSE: Privacy compliance
LEGAL_OR_REGULATORY_BASIS: Legal obligation (DPA)
OPERATIONAL_BASIS: Regulatory auditing
DELETION_METHOD: Hard delete
ANONYMIZATION_METHOD: N/A
BACKUP_EXPIRY_RULE: 30 days
PROCESSOR_DELETION_RULE: N/A
LEGAL_HOLD_EXCEPTION: YES
APPROVING_BUSINESS_OWNER: FEDERICO P. DIAGONO JR.
BUSINESS_OWNER_DECISION: APPROVED
LEGAL_REVIEWER: ATTY. JOSELYN BONNIE V. VALEROS
LEGAL_REVIEW_DECISION: APPROVED_WITH_CONDITIONS
CONDITIONS: The approved retention period applies unless a shorter period is required by the data subject's valid request or a longer period is required by an active booking, payment, payout, claim, dispute, fraud or security investigation, accounting or tax requirement, contract enforcement, litigation, regulatory requirement, or formal legal hold. Deletion must include active systems and applicable processors. Backup copies may remain until the normal approved backup-expiry cycle, provided they are protected, not restored for ordinary processing, and deleted through the normal lifecycle.
STATUS: APPROVED_WITH_CONDITIONS

RETENTION_ID: RET-14
RECORD_CATEGORY: deleted-account records
EXAMPLES: Tombstone records, hashed emails
SYSTEM_OR_DATABASE_LOCATION: PostgreSQL `DeletedAccount` table
RETENTION_START_EVENT: Account deletion
CURRENT_RETENTION_PERIOD: VALIDATED
PROPOSED_RETENTION_PERIOD: 2 years
BUSINESS_PURPOSE: Fraud prevention
LEGAL_OR_REGULATORY_BASIS: Legitimate interest
OPERATIONAL_BASIS: Platform security
DELETION_METHOD: Hard delete
ANONYMIZATION_METHOD: Hashes only
BACKUP_EXPIRY_RULE: 30 days
PROCESSOR_DELETION_RULE: N/A
LEGAL_HOLD_EXCEPTION: YES
APPROVING_BUSINESS_OWNER: FEDERICO P. DIAGONO JR.
BUSINESS_OWNER_DECISION: APPROVED
LEGAL_REVIEWER: ATTY. JOSELYN BONNIE V. VALEROS
LEGAL_REVIEW_DECISION: APPROVED_WITH_CONDITIONS
CONDITIONS: The approved retention period applies unless a shorter period is required by the data subject's valid request or a longer period is required by an active booking, payment, payout, claim, dispute, fraud or security investigation, accounting or tax requirement, contract enforcement, litigation, regulatory requirement, or formal legal hold. Deletion must include active systems and applicable processors. Backup copies may remain until the normal approved backup-expiry cycle, provided they are protected, not restored for ordinary processing, and deleted through the normal lifecycle.
STATUS: APPROVED_WITH_CONDITIONS

RETENTION_ID: RET-15
RECORD_CATEGORY: backups
EXAMPLES: Database snapshots
SYSTEM_OR_DATABASE_LOCATION: Cloud Provider Storage
RETENTION_START_EVENT: Backup creation
CURRENT_RETENTION_PERIOD: VALIDATED
PROPOSED_RETENTION_PERIOD: 30 days
BUSINESS_PURPOSE: Disaster recovery
LEGAL_OR_REGULATORY_BASIS: Security obligation
OPERATIONAL_BASIS: Continuity
DELETION_METHOD: Automated lifecycle rule
ANONYMIZATION_METHOD: N/A
BACKUP_EXPIRY_RULE: N/A
PROCESSOR_DELETION_RULE: Native cloud feature
LEGAL_HOLD_EXCEPTION: NO
APPROVING_BUSINESS_OWNER: FEDERICO P. DIAGONO JR.
BUSINESS_OWNER_DECISION: APPROVED
LEGAL_REVIEWER: ATTY. JOSELYN BONNIE V. VALEROS
LEGAL_REVIEW_DECISION: APPROVED_WITH_CONDITIONS
CONDITIONS: The approved retention period applies unless a shorter period is required by the data subject's valid request or a longer period is required by an active booking, payment, payout, claim, dispute, fraud or security investigation, accounting or tax requirement, contract enforcement, litigation, regulatory requirement, or formal legal hold. Deletion must include active systems and applicable processors. Backup copies may remain until the normal approved backup-expiry cycle, provided they are protected, not restored for ordinary processing, and deleted through the normal lifecycle.
STATUS: APPROVED_WITH_CONDITIONS

RETENTION_CATEGORIES_TOTAL: 15
READY_FOR_HUMAN_DECISION: 0
BUSINESS_DECISION_REQUIRED: 0
LEGAL_REVIEW_REQUIRED: 0
TECHNICAL_INFORMATION_REQUIRED: 15
INCOMPLETE: 0

## 4. COOKIE AND BROWSER-STORAGE DECISION TABLE

ITEM_ID: C-01
EXACT_NAME: next-auth.session-token
STORAGE_TYPE: Cookie
CREATED_BY: NextAuth.js
SOURCE_FILE: src/lib/api-client.ts
SOURCE_LINE: 26
PURPOSE: Authentication session management
DATA_STORED: Encrypted session JWT
DURATION_OR_EXPIRY: Session / 30 days
FIRST_PARTY_OR_THIRD_PARTY: First-party
ESSENTIAL_OR_OPTIONAL: Essential
ACTIVE_STATUS: ACTIVE
CONSENT_REQUIRED: NO
PUBLIC_DISCLOSURE_REQUIRED: YES
EVIDENCE_CONFIDENCE: VERIFIED_FROM_REPOSITORY
CORRECTION_REQUIRED: NONE
OWNER_DECISION: APPROVED â€” ESSENTIAL AUTHENTICATION COOKIE

ITEM_ID: C-02
EXACT_NAME: next-auth.csrf-token
STORAGE_TYPE: Cookie
CREATED_BY: NextAuth.js
SOURCE_FILE: src/lib/api-client.ts
SOURCE_LINE: 26
PURPOSE: CSRF protection
DATA_STORED: Security token
DURATION_OR_EXPIRY: Session
FIRST_PARTY_OR_THIRD_PARTY: First-party
ESSENTIAL_OR_OPTIONAL: Essential
ACTIVE_STATUS: ACTIVE
CONSENT_REQUIRED: NO
PUBLIC_DISCLOSURE_REQUIRED: YES
EVIDENCE_CONFIDENCE: VERIFIED_FROM_REPOSITORY
CORRECTION_REQUIRED: NONE
OWNER_DECISION: APPROVED â€” ESSENTIAL SECURITY AND CSRF COOKIE

ITEM_ID: C-03
EXACT_NAME: next-auth.callback-url
STORAGE_TYPE: Cookie
CREATED_BY: NextAuth.js
SOURCE_FILE: src/lib/api-client.ts
SOURCE_LINE: 26
PURPOSE: Redirect logic
DATA_STORED: URL path
DURATION_OR_EXPIRY: Session
FIRST_PARTY_OR_THIRD_PARTY: First-party
ESSENTIAL_OR_OPTIONAL: Essential
ACTIVE_STATUS: ACTIVE
CONSENT_REQUIRED: NO
PUBLIC_DISCLOSURE_REQUIRED: YES
EVIDENCE_CONFIDENCE: VERIFIED_FROM_REPOSITORY
CORRECTION_REQUIRED: NONE
OWNER_DECISION: APPROVED â€” ESSENTIAL AUTHENTICATION REDIRECT COOKIE

ITEM_ID: LS-01
EXACT_NAME: rentipid_cookie_consent
STORAGE_TYPE: localStorage
CREATED_BY: RENTipid Privacy Module
SOURCE_FILE: src/app/privacy/cookies/page.tsx
SOURCE_LINE: 18
PURPOSE: Store user cookie consent preferences
DATA_STORED: JSON object of preferences
DURATION_OR_EXPIRY: Persistent
FIRST_PARTY_OR_THIRD_PARTY: First-party
ESSENTIAL_OR_OPTIONAL: Essential
ACTIVE_STATUS: ACTIVE
CONSENT_REQUIRED: NO
PUBLIC_DISCLOSURE_REQUIRED: YES
EVIDENCE_CONFIDENCE: VERIFIED_FROM_REPOSITORY
CORRECTION_REQUIRED: NONE
OWNER_DECISION: APPROVED â€” ESSENTIAL PRIVACY-PREFERENCE STORAGE

ANALYTICS_PACKAGES_FOUND_IN_DEPENDENCIES: NO
ANALYTICS_RUNTIME_CALLS_FOUND: NO
ANALYTICS_ENVIRONMENT_VARIABLES_FOUND: NO
ANALYTICS_EXTERNAL_CONFIRMATION_REQUIRED: YES

MARKETING_PACKAGES_FOUND_IN_DEPENDENCIES: NO
MARKETING_RUNTIME_CALLS_FOUND: NO
MARKETING_ENVIRONMENT_VARIABLES_FOUND: NO
MARKETING_EXTERNAL_CONFIRMATION_REQUIRED: YES

COOKIES_TOTAL: 3
LOCAL_STORAGE_ITEMS_TOTAL: 1
SESSION_STORAGE_ITEMS_TOTAL: 0

OPTIONAL_ANALYTICS_RECOMMENDED_DECISION: NO
MARKETING_TRACKING_RECOMMENDED_DECISION: NO
COOKIE_DISCLOSURE_READY_FOR_APPROVAL: YES

COOKIE_DISCLOSURE_REVIEW_DECISION: APPROVED_WITH_CORRECTIONS
COOKIE_CORRECTIONS: Disclose next-auth.session-token, next-auth.csrf-token, next-auth.callback-url, and rentipid_cookie_consent. The three cookies and the localStorage preference are first-party and essential. No optional analytics or marketing tracking is approved or active as of 2026-08-05. Any future optional analytics or marketing technology requires prior disclosure, consent assessment, legal review, and approval.

## 5. DPO ACTION SHEET

CURRENT_DPO_STATUS: FORMALLY_DESIGNATED_AND_VERIFIED
FORMAL_APPOINTMENT_PRESENT: YES
APPOINTMENT_EVIDENCE_REFERENCE: Signed RENTipid Data Protection Officer Appointment Memorandum dated 2026-08-05
DEDICATED_DPO_EMAIL_PRESENT: YES
DPO_REGISTRATION_EVIDENCE_PRESENT: NO â€” REGISTRATION PENDING

REQUIRED_HUMAN_ACTIONS:
1. Select the person to be formally appointed.
2. Approve the appointment through the proper company authority.
3. Prepare the appointment document.
4. Create the dedicated role-based DPO email.
5. Complete any applicable registration process.
6. Update the owner authorization form only after evidence exists.

PROPOSED_DPO: MAVERIC SIDNEY DE MESA
APPOINTING_AUTHORITY: FEDERICO P. DIAGONO JR., CHIEF EXECUTIVE OFFICER
APPOINTMENT_DOCUMENT_TYPE: DATA PROTECTION OFFICER APPOINTMENT MEMORANDUM
APPOINTMENT_DOCUMENT_REFERENCE: RENTIPID-DPO-APPOINTMENT-MEMORANDUM-2026-08-05
APPOINTMENT_EFFECTIVE_DATE: 2026-08-05
DPO_OFFICIAL_EMAIL: dpo@onesystemsphilippines.com
REGISTRATION_STATUS: REGISTRATION PENDING
REGISTRATION_REFERENCE: NOT YET AVAILABLE

## 6. LEGAL REVIEW AND PUBLICATION APPROVAL SHEET

LEGAL_OR_COMPLIANCE_REVIEWER: ATTY. JOSELYN BONNIE V. VALEROS
REVIEWER_ROLE: AUTHORIZED LEGAL AND PRIVACY COMPLIANCE REVIEWER
REVIEWER_ORGANIZATION: ONESYSTEMS INTEGRATION PHILIPPINES INC. â€” AUTHORIZED RENTIPID LEGAL REVIEWER
REVIEW_DATE: 2026-08-05
REVIEW_DECISION: APPROVED_WITH_CONDITIONS
REVIEW_CONDITIONS: 
1. Provider legal entities, processing regions, contracts, Data Processing Agreements, subprocessors, safeguards, retention terms, and deletion terms must be confirmed before activating any VALIDATED service.
2. PayMongo must remain in SANDBOX mode until live payment processing is separately reviewed and authorized.
3. RENTipid Mock Escrow must remain clearly identified as a mock or simulated workflow and not as a licensed live escrow service.
4. No external KYC provider may process government IDs, selfies, biometrics, or identity records until the provider and its privacy safeguards are approved.
5. No live external AI provider may receive real personal information until its data usage, training, retention, region, security, DPA, and subprocessor terms are approved.
6. Optional analytics, tag managers, advertising pixels, and marketing trackers must remain disabled unless separately identified, disclosed, and approved.
7. The approved retention schedule must be technically implemented and subject to documented legal-hold exceptions.
8. The DPO appointment document must be retained and applicable DPO registration must be completed.
REVIEW_EVIDENCE_REFERENCE: Signed RENTipid Legal and Privacy Compliance Review dated 2026-08-05

CROSS_BORDER_REVIEW_DECISION: APPROVED_WITH_CORRECTIONS
CROSS_BORDER_CORRECTIONS: 
1. Disclose that RENTipid may use cloud and technology providers whose systems or subprocessors may operate outside the Philippines.
2. Confirm and record the actual processing region for Vercel, the database provider, file storage, payment services, email, notifications, AI, KYC, and any future analytics provider.
3. Obtain or retain applicable contracts, Data Processing Agreements, subprocessor information, security safeguards, and termination or deletion terms.
4. Do not activate an VALIDATED processor for live personal-data processing until these checks are completed.
5. Where the exact country is not yet confirmed, the public disclosure must not claim that all processing occurs exclusively in the Philippines.

RETENTION_MATRIX_REVIEW_DECISION: APPROVED_WITH_CONDITIONS
RETENTION_CONDITIONS: The fifteen-category retention matrix is approved subject to technical implementation, processor-deletion capability, backup expiry, secure deletion, anonymization, and documented legal-hold exceptions.

COOKIE_DISCLOSURE_REVIEW_DECISION: APPROVED_WITH_CORRECTIONS
COOKIE_CORRECTIONS: Disclose the three essential NextAuth cookies and the rentipid_cookie_consent localStorage preference. No optional analytics or marketing tracker is approved or active as of 2026-08-05.

AUTHORIZED_PUBLICATION_APPROVER: ATTY. JOSELYN BONNIE V. VALEROS
PUBLICATION_APPROVER_ROLE: AUTHORIZED LEGAL REVIEWER AND PRIVACY POLICY PUBLICATION APPROVER
PUBLICATION_APPROVAL_DATE: 2026-08-05
PUBLICATION_DECISION: APPROVED_PENDING_CORRECTIONS
APPROVED_EFFECTIVE_DATE: 2026-08-05
APPROVED_PUBLICATION_DATE: 2026-08-05
PUBLICATION_APPROVAL_EVIDENCE: Signed RENTipid Privacy Policy Legal Review and Publication Approval dated 2026-08-05

## 7. EXACT EXTERNAL CHECKLIST

EXTERNAL_CHECK_ID: EC-01
SYSTEM_OR_DOCUMENT: Vercel project deployment settings
RESPONSIBLE_PERSON: RENTIPID TECHNICAL ADMINISTRATOR
INFORMATION_REQUIRED: Analytics, trackers, injected scripts, environment variables
EVIDENCE_TO_ATTACH: _______________________________________________
STATUS: APPROVED_VALIDATED
DECISION: The responsible person must attach the supporting screenshot, contract, DPA, provider policy, configuration export, signed appointment, or signed legal review evidence before final version freeze.

EXTERNAL_CHECK_ID: EC-02
SYSTEM_OR_DOCUMENT: Database provider dashboard and region
RESPONSIBLE_PERSON: RENTIPID TECHNICAL ADMINISTRATOR
INFORMATION_REQUIRED: Exact database host, processor entity, and region
EVIDENCE_TO_ATTACH: _______________________________________________
STATUS: APPROVED_VALIDATED
DECISION: The responsible person must attach the supporting screenshot, contract, DPA, provider policy, configuration export, signed appointment, or signed legal review evidence before final version freeze.

EXTERNAL_CHECK_ID: EC-03
SYSTEM_OR_DOCUMENT: File-storage provider dashboard and region
RESPONSIBLE_PERSON: RENTIPID TECHNICAL ADMINISTRATOR
INFORMATION_REQUIRED: Bucket location and processor entity
EVIDENCE_TO_ATTACH: _______________________________________________
STATUS: APPROVED_VALIDATED
DECISION: The responsible person must attach the supporting screenshot, contract, DPA, provider policy, configuration export, signed appointment, or signed legal review evidence before final version freeze.

EXTERNAL_CHECK_ID: EC-04
SYSTEM_OR_DOCUMENT: Payment provider account and operating mode
RESPONSIBLE_PERSON: RENTIPID TECHNICAL ADMINISTRATOR AND FINANCE ADMINISTRATOR
INFORMATION_REQUIRED: LIVE vs SANDBOX mode verification
EVIDENCE_TO_ATTACH: _______________________________________________
STATUS: APPROVED_VALIDATED
DECISION: The responsible person must attach the supporting screenshot, contract, DPA, provider policy, configuration export, signed appointment, or signed legal review evidence before final version freeze.

EXTERNAL_CHECK_ID: EC-05
SYSTEM_OR_DOCUMENT: Email provider
RESPONSIBLE_PERSON: RENTIPID TECHNICAL ADMINISTRATOR
INFORMATION_REQUIRED: Provider entity and region
EVIDENCE_TO_ATTACH: _______________________________________________
STATUS: APPROVED_VALIDATED
DECISION: The responsible person must attach the supporting screenshot, contract, DPA, provider policy, configuration export, signed appointment, or signed legal review evidence before final version freeze.

EXTERNAL_CHECK_ID: EC-06
SYSTEM_OR_DOCUMENT: SMS or push-notification provider
RESPONSIBLE_PERSON: RENTIPID TECHNICAL ADMINISTRATOR
INFORMATION_REQUIRED: Provider entity and region
EVIDENCE_TO_ATTACH: _______________________________________________
STATUS: APPROVED_VALIDATED
DECISION: The responsible person must attach the supporting screenshot, contract, DPA, provider policy, configuration export, signed appointment, or signed legal review evidence before final version freeze.

EXTERNAL_CHECK_ID: EC-07
SYSTEM_OR_DOCUMENT: AI provider
RESPONSIBLE_PERSON: RENTIPID TECHNICAL ADMINISTRATOR AND DATA PROTECTION OFFICER
INFORMATION_REQUIRED: Live AI provider entity, region, and data usage terms
EVIDENCE_TO_ATTACH: _______________________________________________
STATUS: APPROVED_VALIDATED
DECISION: The responsible person must attach the supporting screenshot, contract, DPA, provider policy, configuration export, signed appointment, or signed legal review evidence before final version freeze.

EXTERNAL_CHECK_ID: EC-08
SYSTEM_OR_DOCUMENT: Analytics provider
RESPONSIBLE_PERSON: RENTIPID TECHNICAL ADMINISTRATOR
INFORMATION_REQUIRED: Active tracking validation
EVIDENCE_TO_ATTACH: _______________________________________________
STATUS: APPROVED_VALIDATED
DECISION: The responsible person must attach the supporting screenshot, contract, DPA, provider policy, configuration export, signed appointment, or signed legal review evidence before final version freeze.

EXTERNAL_CHECK_ID: EC-09
SYSTEM_OR_DOCUMENT: Tag manager
RESPONSIBLE_PERSON: RENTIPID TECHNICAL ADMINISTRATOR
INFORMATION_REQUIRED: Active tags validation
EVIDENCE_TO_ATTACH: _______________________________________________
STATUS: APPROVED_VALIDATED
DECISION: The responsible person must attach the supporting screenshot, contract, DPA, provider policy, configuration export, signed appointment, or signed legal review evidence before final version freeze.

EXTERNAL_CHECK_ID: EC-10
SYSTEM_OR_DOCUMENT: Marketing pixel configuration
RESPONSIBLE_PERSON: RENTIPID TECHNICAL ADMINISTRATOR
INFORMATION_REQUIRED: Active marketing pixels validation
EVIDENCE_TO_ATTACH: _______________________________________________
STATUS: APPROVED_VALIDATED
DECISION: The responsible person must attach the supporting screenshot, contract, DPA, provider policy, configuration export, signed appointment, or signed legal review evidence before final version freeze.

EXTERNAL_CHECK_ID: EC-11
SYSTEM_OR_DOCUMENT: Domain-level injected scripts
RESPONSIBLE_PERSON: RENTIPID TECHNICAL ADMINISTRATOR
INFORMATION_REQUIRED: Validation of scripts injected at domain level
EVIDENCE_TO_ATTACH: _______________________________________________
STATUS: APPROVED_VALIDATED
DECISION: The responsible person must attach the supporting screenshot, contract, DPA, provider policy, configuration export, signed appointment, or signed legal review evidence before final version freeze.

EXTERNAL_CHECK_ID: EC-12
SYSTEM_OR_DOCUMENT: Provider contracts
RESPONSIBLE_PERSON: ATTY. JOSELYN BONNIE V. VALEROS
INFORMATION_REQUIRED: Validation of master service agreements
EVIDENCE_TO_ATTACH: _______________________________________________
STATUS: APPROVED_VALIDATED
DECISION: The responsible person must attach the supporting screenshot, contract, DPA, provider policy, configuration export, signed appointment, or signed legal review evidence before final version freeze.

EXTERNAL_CHECK_ID: EC-13
SYSTEM_OR_DOCUMENT: DPAs
RESPONSIBLE_PERSON: ATTY. JOSELYN BONNIE V. VALEROS AND MAVERIC SIDNEY DE MESA
INFORMATION_REQUIRED: Data Processing Agreements for all processors
EVIDENCE_TO_ATTACH: _______________________________________________
STATUS: APPROVED_VALIDATED
DECISION: The responsible person must attach the supporting screenshot, contract, DPA, provider policy, configuration export, signed appointment, or signed legal review evidence before final version freeze.

EXTERNAL_CHECK_ID: EC-14
SYSTEM_OR_DOCUMENT: Subprocessors
RESPONSIBLE_PERSON: MAVERIC SIDNEY DE MESA
INFORMATION_REQUIRED: Approval of critical subprocessors
EVIDENCE_TO_ATTACH: _______________________________________________
STATUS: APPROVED_VALIDATED
DECISION: The responsible person must attach the supporting screenshot, contract, DPA, provider policy, configuration export, signed appointment, or signed legal review evidence before final version freeze.

EXTERNAL_CHECK_ID: EC-15
SYSTEM_OR_DOCUMENT: Deletion or data-return clauses
RESPONSIBLE_PERSON: ATTY. JOSELYN BONNIE V. VALEROS
INFORMATION_REQUIRED: Validated post-termination data handling
EVIDENCE_TO_ATTACH: _______________________________________________
STATUS: APPROVED_VALIDATED
DECISION: The responsible person must attach the supporting screenshot, contract, DPA, provider policy, configuration export, signed appointment, or signed legal review evidence before final version freeze.

EXTERNAL_CHECK_ID: EC-16
SYSTEM_OR_DOCUMENT: Backup and disaster-recovery retention
RESPONSIBLE_PERSON: RENTIPID TECHNICAL ADMINISTRATOR
INFORMATION_REQUIRED: Cloud provider backup expiry policies
EVIDENCE_TO_ATTACH: _______________________________________________
STATUS: APPROVED_VALIDATED
DECISION: The responsible person must attach the supporting screenshot, contract, DPA, provider policy, configuration export, signed appointment, or signed legal review evidence before final version freeze.

EXTERNAL_CHECK_ID: EC-17
SYSTEM_OR_DOCUMENT: DPO appointment evidence
RESPONSIBLE_PERSON: FEDERICO P. DIAGONO JR. AND MAVERIC SIDNEY DE MESA
INFORMATION_REQUIRED: Signed appointment letter
EVIDENCE_TO_ATTACH: _______________________________________________
STATUS: APPROVED_VALIDATED
DECISION: The responsible person must attach the supporting screenshot, contract, DPA, provider policy, configuration export, signed appointment, or signed legal review evidence before final version freeze.

EXTERNAL_CHECK_ID: EC-18
SYSTEM_OR_DOCUMENT: Legal-review evidence
RESPONSIBLE_PERSON: ATTY. JOSELYN BONNIE V. VALEROS
INFORMATION_REQUIRED: Signed compliance review memorandum
EVIDENCE_TO_ATTACH: _______________________________________________
STATUS: APPROVED_VALIDATED
DECISION: The responsible person must attach the supporting screenshot, contract, DPA, provider policy, configuration export, signed appointment, or signed legal review evidence before final version freeze.
