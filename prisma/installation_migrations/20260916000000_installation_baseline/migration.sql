CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ListingImportJobStatus" AS ENUM ('CREATED', 'AUTHORIZING', 'FETCHING', 'EXTRACTING', 'NORMALIZING', 'PROCESSING_MEDIA', 'VALIDATING', 'NEEDS_REVIEW', 'READY_FOR_DRAFT', 'CREATING_DRAFT', 'COMPLETED', 'FAILED_RETRYABLE', 'FAILED_FINAL', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ListingImportAssetStatus" AS ENUM ('PENDING', 'FETCHING', 'DOWNLOADED', 'VALIDATED', 'REJECTED', 'FAILED', 'SKIPPED_DUPLICATE');

-- CreateEnum
CREATE TYPE "ListingImportResolutionType" AS ENUM ('PROVIDER_OVERRIDE', 'AI_SUGGESTION_ACCEPTED', 'SYSTEM_DEFAULT', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ListingImportAuditEventType" AS ENUM ('JOB_CREATED', 'STATUS_CHANGED', 'AUTHORIZATION_COMPLETED', 'FETCH_COMPLETED', 'NORMALIZATION_COMPLETED', 'SECURITY_BLOCKED', 'AI_ENRICHED', 'RESOLUTION_SAVED', 'DRAFT_COMMITTED', 'JOB_FAILED');

-- CreateEnum
CREATE TYPE "SecurityEventSource" AS ENUM ('AUDIT_LOG', 'SYSTEM_ERROR_LOG', 'AI_BOT_LOG', 'PAYMENT_WEBHOOK_LOG', 'PAYMENT_RECONCILIATION_LOG', 'PAYMENT_ACTION_LOG', 'VERIFICATION_DOCUMENT', 'DAMAGE_CLAIM', 'DISPUTE_CASE', 'INSPECTION_REPORT', 'SYSTEM_SETTING', 'AUTHENTICATION_SECURITY_LOG', 'API_SECURITY_LOG');

-- CreateEnum
CREATE TYPE "SecurityDomain" AS ENUM ('IDENTITY_AND_ACCESS', 'ADMINISTRATIVE_SECURITY', 'APPLICATION_RELIABILITY', 'AI_GUARDRAILS', 'KYC_AND_COMPLIANCE', 'TRUST_AND_SAFETY', 'FINANCIAL_INTEGRITY', 'PAYMENT_SECURITY', 'DATA_PROTECTION', 'INFRASTRUCTURE');

-- CreateEnum
CREATE TYPE "SecurityEventClassification" AS ENUM ('OBSERVATION', 'SUSPICIOUS_ACTIVITY', 'POLICY_VIOLATION', 'ATTACK_ATTEMPT', 'CONFIRMED_COMPROMISE', 'FRAUD_INDICATOR', 'CONTROL_FAILURE', 'COUNTERMEASURE', 'SYSTEM_HEALTH');

-- CreateEnum
CREATE TYPE "SecuritySeverity" AS ENUM ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SecurityLifecycle" AS ENUM ('LIVE', 'TEST', 'SIMULATION');

-- CreateEnum
CREATE TYPE "SecurityProcessingStatus" AS ENUM ('PENDING', 'NORMALIZED', 'ENRICHMENT_PENDING', 'PROCESSED', 'FAILED', 'QUARANTINED');

-- CreateEnum
CREATE TYPE "SecurityEnvironment" AS ENUM ('DEVELOPMENT', 'TEST', 'UAT', 'STAGING', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "DetectionRuleStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED', 'QUARANTINED');

-- CreateEnum
CREATE TYPE "DetectionRuleCreatorType" AS ENUM ('USER', 'SYSTEM_SEED');

-- CreateEnum
CREATE TYPE "SecurityAlertReviewStatus" AS ENUM ('UNREVIEWED', 'UNDER_REVIEW', 'CONFIRMED', 'FALSE_POSITIVE');

-- CreateEnum
CREATE TYPE "AlertEvidenceRole" AS ENUM ('PRIMARY', 'SUPPORTING');

-- CreateEnum
CREATE TYPE "RuleEvaluationOutcome" AS ENUM ('MATCH', 'NO_MATCH', 'SKIPPED', 'ERROR', 'TIMEOUT', 'QUARANTINED');

-- CreateEnum
CREATE TYPE "DetectionDeduplicationStrategy" AS ENUM ('EXACT_MATCH', 'WINDOW_BUCKET');

-- CreateEnum
CREATE TYPE "DetectionCorrelationSubject" AS ENUM ('ACTOR_USER_ID', 'TARGET_USER_ID', 'TARGET_RESOURCE_ID', 'CORRELATION_KEY', 'GLOBAL');

-- CreateEnum
CREATE TYPE "DetectionConfidenceFormula" AS ENUM ('BASE_PLUS_EVIDENCE_MULTIPLIER', 'STATIC_BASE');

-- CreateEnum
CREATE TYPE "IncidentCaseStatus" AS ENUM ('OPEN', 'TRIAGED', 'INVESTIGATING', 'CONTAINMENT_PENDING', 'RESOLVED', 'CLOSED', 'REOPENED');

-- CreateEnum
CREATE TYPE "IncidentCaseSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "IncidentCaseOrigin" AS ENUM ('MANUAL', 'SECURITY_EVENT', 'SECURITY_ALERT', 'EXTERNAL_PROVIDER', 'ADMIN_ESCALATION');

-- CreateEnum
CREATE TYPE "IncidentCaseHistoryReason" AS ENUM ('CREATED', 'TRIAGED', 'ASSIGNED', 'REASSIGNED', 'INVESTIGATION_STARTED', 'CONTAINMENT_REQUESTED', 'RESOLVED', 'CLOSED', 'REOPENED', 'ESCALATED', 'CORRECTION_RECORDED');

-- CreateEnum
CREATE TYPE "IncidentCaseNoteType" AS ENUM ('TRIAGE', 'INVESTIGATION', 'EVIDENCE_REVIEW', 'ESCALATION', 'RESOLUTION', 'CLOSURE', 'REOPENING', 'INTERNAL');

-- CreateEnum
CREATE TYPE "IncidentCaseEvidenceType" AS ENUM ('SECURITY_EVENT', 'AUDIT_LOG', 'SYSTEM_LOG', 'PROVIDER_EVENT', 'TRANSACTION_REFERENCE', 'DOCUMENT_REFERENCE', 'IMAGE_REFERENCE', 'USER_STATEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "IncidentCaseEvidenceSource" AS ENUM ('INTERNAL_SYSTEM', 'EXTERNAL_PROVIDER', 'USER_SUBMITTED', 'ADMINISTRATIVE');

-- CreateEnum
CREATE TYPE "SecurityPlaybookStatus" AS ENUM ('DRAFT', 'REVIEW_PENDING', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SecurityResponseActionType" AS ENUM ('ACCOUNT_RESTRICTION', 'PAYMENT_FREEZE', 'BOOKING_FREEZE', 'SESSION_REVOCATION', 'CREDENTIAL_ROTATION', 'INFRASTRUCTURE_ENFORCEMENT', 'MANUAL_PROCEDURE', 'NOOP_SIMULATION');

-- CreateEnum
CREATE TYPE "SecurityResponseReversibility" AS ENUM ('REVERSIBLE', 'IRREVERSIBLE', 'MANUAL_INTERVENTION_REQUIRED');

-- CreateEnum
CREATE TYPE "SecurityApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'REVOKED', 'CONSUMED');

-- CreateEnum
CREATE TYPE "SecurityApprovalEventType" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'REVOKED', 'CONSUMED');

-- CreateEnum
CREATE TYPE "SecurityApprovalGrantState" AS ENUM ('AVAILABLE', 'CONSUMED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SecurityExecutionStatus" AS ENUM ('PENDING', 'EXECUTING', 'SUCCEEDED', 'FAILED', 'ROLLBACK_PENDING', 'ROLLED_BACK', 'ROLLBACK_FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SocialMetricClassification" AS ENUM ('ACTUAL', 'DERIVED', 'ESTIMATED');

-- CreateEnum
CREATE TYPE "SocialProviderEventState" AS ENUM ('PENDING', 'PROCESSED', 'FAILED', 'RETRYING', 'IGNORED');

-- CreateEnum
CREATE TYPE "SocialAttributionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'UNCERTAIN');

-- CreateEnum
CREATE TYPE "SocialFeedbackStatus" AS ENUM ('NEW', 'CLASSIFIED', 'NEEDS_REVIEW', 'ESCALATED', 'RESPONDED', 'RESOLVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SocialFeedbackSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SocialFeedbackSentiment" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile_number" TEXT,
    "full_name" TEXT NOT NULL,
    "account_type" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "password_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_test_data" BOOLEAN NOT NULL DEFAULT false,
    "beta_label" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMfa" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "envelope_version" TEXT NOT NULL,
    "envelope_algorithm" TEXT NOT NULL,
    "envelope_key_id" TEXT NOT NULL,
    "envelope_nonce" TEXT NOT NULL,
    "envelope_ciphertext" TEXT NOT NULL,
    "envelope_auth_tag" TEXT NOT NULL,
    "recovery_code_hashes" TEXT[],
    "recovery_codes_consumed" INTEGER NOT NULL DEFAULT 0,
    "security_version" INTEGER NOT NULL DEFAULT 1,
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activated_at" TIMESTAMP(3),
    "last_verified_at" TIMESTAMP(3),
    "reset_at" TIMESTAMP(3),

    CONSTRAINT "UserMfa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MfaSessionAssurance" (
    "id" TEXT NOT NULL,
    "session_key_hash" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "assurance_level" TEXT NOT NULL,
    "verified_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "factor_id" TEXT,

    CONSTRAINT "MfaSessionAssurance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetRequest" (
    "id" TEXT NOT NULL,
    "identity_hash" TEXT NOT NULL,
    "ip_hash" TEXT NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_key_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailCredential" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "normalized_email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "password_changed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthProviderIdentity" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_subject" TEXT NOT NULL,
    "email" TEXT,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_private_email" BOOLEAN NOT NULL DEFAULT false,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_seen_at" TIMESTAMP(3),

    CONSTRAINT "AuthProviderIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhoneIdentity" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "phone_e164" TEXT NOT NULL,
    "verified_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_seen_at" TIMESTAMP(3),

    CONSTRAINT "PhoneIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhoneVerificationChallenge" (
    "id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "phone_e164" TEXT NOT NULL,
    "provider_challenge_id" TEXT,
    "status" TEXT NOT NULL,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "send_count" INTEGER NOT NULL DEFAULT 1,
    "last_sent_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "session_reference_hash" TEXT,
    "ip_reference_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhoneVerificationChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthRateLimit" (
    "key" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "reset_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthRateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "AuthConsentReceipt" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "terms_version" TEXT NOT NULL,
    "privacy_version" TEXT NOT NULL,
    "accepted_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthConsentReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthIdentityEvent" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "identity_type" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "provider" TEXT,
    "provider_subject_reference_hash" TEXT,
    "phone_reference_hash" TEXT,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthIdentityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "addressLine1_encrypted" TEXT,
    "addressLine2_encrypted" TEXT,
    "sublocality_encrypted" TEXT,
    "locality_encrypted" TEXT,
    "administrativeArea2_encrypted" TEXT,
    "administrativeArea1_encrypted" TEXT,
    "postalCode_encrypted" TEXT,
    "countryCode" TEXT,
    "formattedAddress_encrypted" TEXT,
    "latitude_encrypted" TEXT,
    "longitude_encrypted" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'MANUAL',
    "providerPlaceId" TEXT,
    "validationStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "validationLevel" TEXT,
    "manuallyEdited" BOOLEAN NOT NULL DEFAULT false,
    "validatedAt" TIMESTAMP(3),
    "regionPsgcCode" TEXT,
    "provincePsgcCode" TEXT,
    "localityPsgcCode" TEXT,
    "sublocalityPsgcCode" TEXT,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PsgcSubdivision" (
    "id" TEXT NOT NULL,
    "psgcCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "geographicLevel" TEXT NOT NULL,
    "parentPsgcCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT NOT NULL DEFAULT 'PSA_PSGC',
    "sourceVersion" TEXT NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PsgcSubdivision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AddressApiRateLimit" (
    "key" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AddressApiRateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "display_name" TEXT,
    "address" TEXT,
    "address_encrypted" TEXT,
    "city" TEXT,
    "province" TEXT,
    "country" TEXT,
    "profile_photo" TEXT,
    "verification_status" TEXT NOT NULL,
    "trust_score" INTEGER NOT NULL DEFAULT 0,
    "global_address_id" TEXT,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessProfile" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "business_registration_number" TEXT,
    "business_registration_number_encrypted" TEXT,
    "business_address" TEXT,
    "business_address_encrypted" TEXT,
    "authorized_representative" TEXT,
    "verification_status" TEXT NOT NULL,
    "global_business_address_id" TEXT,

    CONSTRAINT "BusinessProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "risk_level" TEXT NOT NULL,
    "requires_admin_approval" BOOLEAN NOT NULL DEFAULT false,
    "requires_deposit" BOOLEAN NOT NULL DEFAULT false,
    "requires_insurance" BOOLEAN NOT NULL DEFAULT false,
    "requires_permit" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationDocument" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "rejection_reason" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "VerificationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryRequirement" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "required_provider_documents" TEXT,
    "required_renter_documents" TEXT,
    "deposit_rule" TEXT,
    "approval_rule" TEXT,
    "prohibited_conditions" TEXT,
    "notes" TEXT,

    CONSTRAINT "CategoryRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "city" TEXT,
    "province" TEXT,
    "country" TEXT,
    "rental_type" TEXT NOT NULL,
    "hourly_rate" DOUBLE PRECISION,
    "daily_rate" DOUBLE PRECISION,
    "weekly_rate" DOUBLE PRECISION,
    "monthly_rate" DOUBLE PRECISION,
    "security_deposit" DOUBLE PRECISION,
    "replacement_value" DOUBLE PRECISION,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "condition" TEXT,
    "pickup_available" BOOLEAN NOT NULL DEFAULT true,
    "delivery_available" BOOLEAN NOT NULL DEFAULT false,
    "delivery_fee" DOUBLE PRECISION,
    "min_duration" INTEGER,
    "max_duration" INTEGER,
    "late_penalty" TEXT,
    "damage_policy" TEXT,
    "rules" TEXT,
    "included_accessories" TEXT,
    "excluded_accessories" TEXT,
    "special_instructions" TEXT,
    "availability_start" TIMESTAMP(3),
    "availability_end" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "rejection_reason" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_test_data" BOOLEAN NOT NULL DEFAULT false,
    "beta_label" TEXT,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingPhoto" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_cover" BOOLEAN NOT NULL DEFAULT false,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingDocument" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "rejection_reason" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "ListingDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingImportJob" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "source_connector" TEXT NOT NULL,
    "source_tier" TEXT NOT NULL,
    "source_reference_hash" TEXT NOT NULL,
    "source_reference_label" TEXT,
    "authorization_method" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "status" "ListingImportJobStatus" NOT NULL DEFAULT 'CREATED',
    "raw_payload_hash" TEXT,
    "canonical_payload" JSONB,
    "field_confidence" JSONB,
    "unresolved_fields" JSONB,
    "created_listing_id" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 3,
    "next_attempt_at" TIMESTAMP(3),
    "locked_at" TIMESTAMP(3),
    "locked_by" TEXT,
    "last_error_code" TEXT,
    "last_error_message" TEXT,
    "ai_assisted" BOOLEAN NOT NULL DEFAULT false,
    "source_retrieved_at" TIMESTAMP(3),
    "normalized_at" TIMESTAMP(3),
    "correlation_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "ListingImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingImportSource" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "source_connector" TEXT NOT NULL,
    "source_tier" TEXT NOT NULL,
    "source_mode" TEXT,
    "connector_version" TEXT,
    "authorization_method" TEXT NOT NULL,
    "source_reference_hash" TEXT NOT NULL,
    "source_reference_label" TEXT,
    "source_identifier" TEXT,
    "raw_payload_hash" TEXT,
    "retrieval_metadata" JSONB,
    "retrieved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingImportSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingImportField" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "source_id" TEXT,
    "field_name" TEXT NOT NULL,
    "source_field_name" TEXT,
    "source_value_hash" TEXT,
    "normalized_value" JSONB,
    "confidence_state" TEXT NOT NULL DEFAULT 'REVIEW_RECOMMENDED',
    "confidence_score" DOUBLE PRECISION,
    "authority" TEXT NOT NULL DEFAULT 'SOURCE',
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "is_blocking" BOOLEAN NOT NULL DEFAULT false,
    "provider_modified" BOOLEAN NOT NULL DEFAULT false,
    "validation_state" TEXT NOT NULL DEFAULT 'PENDING',
    "validation_message" TEXT,
    "prohibited_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingImportField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingImportAsset" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "source_reference_hash" TEXT NOT NULL,
    "source_url_label" TEXT,
    "content_sha256" TEXT,
    "rentipid_asset_path" TEXT,
    "file_size_bytes" INTEGER,
    "mime_type" TEXT,
    "status" "ListingImportAssetStatus" NOT NULL DEFAULT 'PENDING',
    "is_cover" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "error_code" TEXT,
    "error_message" TEXT,
    "retrieved_at" TIMESTAMP(3),
    "validated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingImportAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingImportResolution" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "field_name" TEXT NOT NULL,
    "source_value_hash" TEXT,
    "normalized_value" JSONB,
    "resolved_value" JSONB,
    "resolution_type" "ListingImportResolutionType" NOT NULL,
    "resolved_by_user_id" TEXT NOT NULL,
    "provider_modified" BOOLEAN NOT NULL DEFAULT true,
    "resolved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingImportResolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingImportAuditEvent" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "audit_log_id" TEXT,
    "event_type" "ListingImportAuditEventType" NOT NULL,
    "event_payload" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingImportAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "renter_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "start_time" TEXT,
    "end_time" TEXT,
    "rental_duration" INTEGER NOT NULL,
    "rental_duration_unit" TEXT NOT NULL,
    "selected_rate_type" TEXT NOT NULL,
    "base_rental_amount" DOUBLE PRECISION NOT NULL,
    "deposit_amount" DOUBLE PRECISION NOT NULL,
    "platform_fee" DOUBLE PRECISION,
    "estimated_total_amount" DOUBLE PRECISION NOT NULL,
    "pickup_option" TEXT NOT NULL,
    "delivery_requested" BOOLEAN NOT NULL DEFAULT false,
    "delivery_address" TEXT,
    "delivery_fee" DOUBLE PRECISION,
    "renter_notes" TEXT,
    "provider_notes" TEXT,
    "cancellation_reason" TEXT,
    "rejection_reason" TEXT,
    "status" TEXT NOT NULL,
    "payment_status" TEXT NOT NULL DEFAULT 'Not Required Yet',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "approved_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "is_test_data" BOOLEAN NOT NULL DEFAULT false,
    "beta_label" TEXT,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingStatusHistory" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "old_status" TEXT NOT NULL,
    "new_status" TEXT NOT NULL,
    "changed_by" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "payment_method" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "transaction_id" TEXT,
    "gateway_transaction_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GatewayTransaction" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_mode" TEXT NOT NULL,
    "idempotency_key" TEXT,
    "gateway_reference" TEXT,
    "gateway_checkout_url" TEXT,
    "gateway_status" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PHP',
    "raw_event_summary" TEXT,
    "webhook_event_type" TEXT,
    "webhook_received_at" TIMESTAMP(3),
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_status" TEXT NOT NULL,
    "reconciliation_status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GatewayTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentWebhookLog" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "gateway_reference" TEXT,
    "booking_id" TEXT,
    "payment_transaction_id" TEXT,
    "headers_summary" TEXT,
    "payload_summary" TEXT,
    "verification_status" TEXT NOT NULL,
    "processing_status" TEXT NOT NULL,
    "error_message" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentWebhookLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentReconciliationLog" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "payment_transaction_id" TEXT,
    "gateway_transaction_id" TEXT NOT NULL,
    "expected_amount" DOUBLE PRECISION NOT NULL,
    "received_amount" DOUBLE PRECISION NOT NULL,
    "expected_currency" TEXT NOT NULL DEFAULT 'PHP',
    "received_currency" TEXT NOT NULL DEFAULT 'PHP',
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentReconciliationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentActionLog" (
    "id" TEXT NOT NULL,
    "gateway_transaction_id" TEXT,
    "booking_id" TEXT NOT NULL,
    "action_code" TEXT NOT NULL,
    "actor_type" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "provider" TEXT,
    "provider_reference" TEXT,
    "amount" DECIMAL(20,4),
    "currency" TEXT,
    "expected_amount" DECIMAL(20,4),
    "received_amount" DECIMAL(20,4),
    "expected_currency" TEXT,
    "received_currency" TEXT,
    "outcome" TEXT NOT NULL,
    "failure_reason" TEXT,
    "source_workflow" TEXT NOT NULL,
    "source_operation_id" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceLedger" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "booking_id" TEXT,
    "transaction_type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "balance_type" TEXT NOT NULL,
    "description" TEXT,
    "amount_minor" INTEGER,
    "currency" TEXT,
    "idempotency_key" TEXT,
    "source_reference" TEXT,
    "policy_id" TEXT,
    "audit_reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalAgreement" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "agreement_text" TEXT NOT NULL,
    "accepted_by_renter" BOOLEAN NOT NULL DEFAULT false,
    "accepted_at" TIMESTAMP(3),
    "accepted_by_provider" BOOLEAN NOT NULL DEFAULT false,
    "provider_accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RentalAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionReport" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "renter_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "inspection_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "condition_summary" TEXT NOT NULL,
    "odometer_reading" TEXT,
    "fuel_level" TEXT,
    "meter_reading" TEXT,
    "quantity_checked" INTEGER,
    "accessories_checked" TEXT,
    "provider_notes" TEXT,
    "renter_notes" TEXT,
    "submitted_by" TEXT,
    "confirmed_by" TEXT,
    "submitted_at" TIMESTAMP(3),
    "confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InspectionReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionPhoto" (
    "id" TEXT NOT NULL,
    "inspection_report_id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "caption" TEXT,
    "photo_category" TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InspectionPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TurnoverRecord" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "renter_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "turnover_type" TEXT NOT NULL,
    "turnover_status" TEXT NOT NULL,
    "pickup_or_delivery" TEXT NOT NULL,
    "turnover_location" TEXT,
    "turnover_datetime" TIMESTAMP(3),
    "handed_over_by" TEXT,
    "received_by" TEXT,
    "confirmation_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TurnoverRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DamageClaim" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "renter_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "claim_number" TEXT NOT NULL,
    "claim_type" TEXT NOT NULL,
    "claim_status" TEXT NOT NULL,
    "claim_description" TEXT NOT NULL,
    "claimed_amount" DOUBLE PRECISION NOT NULL,
    "deposit_amount" DOUBLE PRECISION NOT NULL,
    "requested_deduction_amount" DOUBLE PRECISION NOT NULL,
    "provider_evidence_summary" TEXT,
    "renter_response" TEXT,
    "admin_decision" TEXT,
    "approved_deduction_amount" DOUBLE PRECISION,
    "refund_to_renter_amount" DOUBLE PRECISION,
    "decided_by" TEXT,
    "decided_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DamageClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DamageClaimPhoto" (
    "id" TEXT NOT NULL,
    "damage_claim_id" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "caption" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DamageClaimPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisputeCase" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "damage_claim_id" TEXT,
    "opened_by" TEXT NOT NULL,
    "dispute_type" TEXT NOT NULL,
    "dispute_status" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "provider_statement" TEXT,
    "renter_statement" TEXT,
    "admin_notes" TEXT,
    "final_decision" TEXT,
    "decided_by" TEXT,
    "decided_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisputeCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositAction" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "deposit_ledger_id" TEXT,
    "action_type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "performed_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DepositAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "target_id" TEXT,
    "details" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiSecurityLog" (
    "id" TEXT NOT NULL,
    "event_code" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "subject_reference_hash" TEXT,
    "ip_reference_hash" TEXT,
    "device_reference_hash" TEXT,
    "target_reference_hash" TEXT,
    "safe_route_family" TEXT NOT NULL,
    "http_method" TEXT NOT NULL,
    "policy_family" TEXT,
    "threshold_category" TEXT,
    "distinct_target_count" INTEGER,
    "correlation_id" TEXT,
    "environment" TEXT NOT NULL,
    "lifecycle" TEXT NOT NULL,
    "sanitized_metadata" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiSecurityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIBotLog" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "bot_name" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "prompt" TEXT,
    "response_summary" TEXT,
    "action_requested" TEXT,
    "action_status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIBotLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "setting_key" TEXT NOT NULL,
    "setting_value" TEXT NOT NULL,
    "description" TEXT,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthenticationSecurityLog" (
    "id" TEXT NOT NULL,
    "event_code" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "subject_reference_hash" TEXT,
    "ip_reference_hash" TEXT,
    "device_reference_hash" TEXT,
    "session_reference_hash" TEXT,
    "hmac_key_version" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "lifecycle" TEXT NOT NULL,
    "retention_class" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "sanitized_metadata" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthenticationSecurityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemErrorLog" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "module" TEXT NOT NULL,
    "route" TEXT,
    "error_message" TEXT NOT NULL,
    "stack_trace_private" TEXT,
    "severity" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemErrorLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialAccount" (
    "id" TEXT NOT NULL,
    "owner_user_id" TEXT,
    "business_provider_id" TEXT,
    "platform" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "account_handle" TEXT NOT NULL,
    "account_type" TEXT NOT NULL,
    "connection_status" TEXT NOT NULL,
    "health_status" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "capabilities" TEXT,
    "credential_reference" TEXT,
    "last_validation_error" TEXT,
    "last_sync_at" TIMESTAMP(3),
    "access_token_encrypted" TEXT,
    "refresh_token_encrypted" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "scopes" TEXT,
    "last_connected_at" TIMESTAMP(3),
    "disconnected_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingCampaign" (
    "id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "campaign_name" TEXT NOT NULL,
    "campaign_type" TEXT NOT NULL,
    "campaign_goal" TEXT NOT NULL,
    "target_audience" TEXT,
    "target_country" TEXT,
    "target_city" TEXT,
    "target_language" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "budget_placeholder" DOUBLE PRECISION,
    "campaign_status" TEXT NOT NULL,
    "approval_status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_test_data" BOOLEAN NOT NULL DEFAULT false,
    "beta_label" TEXT,

    CONSTRAINT "MarketingCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignListingLink" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignListingLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignTargetAccount" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "target_account_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignTargetAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingPost" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "provider_id" TEXT,
    "target_account_id" TEXT,
    "platform" TEXT NOT NULL,
    "post_type" TEXT NOT NULL,
    "post_title" TEXT,
    "caption" TEXT,
    "hashtags" TEXT,
    "media_type" TEXT,
    "media_file_path" TEXT,
    "media_prompt" TEXT,
    "destination_url" TEXT,
    "tracking_url" TEXT,
    "scheduled_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "post_status" TEXT NOT NULL,
    "approval_status" TEXT NOT NULL,
    "rejection_reason" TEXT,
    "created_by_id" TEXT,
    "approved_by_id" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignApproval" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "post_id" TEXT,
    "requested_by" TEXT NOT NULL,
    "reviewed_by" TEXT,
    "approval_status" TEXT NOT NULL,
    "review_notes" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "CampaignApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionAsset" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "post_id" TEXT,
    "asset_type" TEXT NOT NULL,
    "file_path" TEXT,
    "prompt_used" TEXT,
    "generated_by_ai" BOOLEAN NOT NULL DEFAULT false,
    "uploaded_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromotionAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UTMLink" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "post_id" TEXT,
    "listing_id" TEXT,
    "base_url" TEXT NOT NULL,
    "tracking_url" TEXT NOT NULL,
    "utm_source" TEXT NOT NULL,
    "utm_medium" TEXT NOT NULL,
    "utm_campaign" TEXT NOT NULL,
    "utm_content" TEXT,
    "click_count_placeholder" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UTMLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignAnalytics" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "post_id" TEXT,
    "platform" TEXT NOT NULL,
    "impressions_placeholder" INTEGER NOT NULL DEFAULT 0,
    "clicks_placeholder" INTEGER NOT NULL DEFAULT 0,
    "engagement_placeholder" INTEGER NOT NULL DEFAULT 0,
    "shares_placeholder" INTEGER NOT NULL DEFAULT 0,
    "comments_placeholder" INTEGER NOT NULL DEFAULT 0,
    "likes_placeholder" INTEGER NOT NULL DEFAULT 0,
    "booking_requests_placeholder" INTEGER NOT NULL DEFAULT 0,
    "provider_signups_placeholder" INTEGER NOT NULL DEFAULT 0,
    "renter_signups_placeholder" INTEGER NOT NULL DEFAULT 0,
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderPromotionOptIn" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "allow_platform_promotion" BOOLEAN NOT NULL DEFAULT false,
    "allow_ai_generated_content" BOOLEAN NOT NULL DEFAULT false,
    "allow_paid_ads_placeholder" BOOLEAN NOT NULL DEFAULT false,
    "allow_global_promotion" BOOLEAN NOT NULL DEFAULT false,
    "allowed_platforms" TEXT,
    "approval_required" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderPromotionOptIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPostQueue" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "approved_version_id" TEXT,
    "target_account_id" TEXT,
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error_message" TEXT,
    "scheduled_at" TIMESTAMP(3),
    "timezone" TEXT,
    "idempotency_key" TEXT,
    "processed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancellation_reason" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialPostQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPublicationAttempt" (
    "id" TEXT NOT NULL,
    "queue_id" TEXT NOT NULL,
    "post_version_id" TEXT NOT NULL,
    "social_account_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_post_id" TEXT,
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "publication_key" TEXT NOT NULL,
    "correlation_id" TEXT,
    "status" TEXT NOT NULL,
    "normalized_error" TEXT,
    "is_retryable" BOOLEAN NOT NULL DEFAULT false,
    "next_retry_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialPublicationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountDeletionRequest" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "admin_notes" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "AccountDeletionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppReleaseVersion" (
    "id" TEXT NOT NULL,
    "version_name" TEXT NOT NULL,
    "build_number" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "release_status" TEXT NOT NULL,
    "release_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppReleaseVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MobileAnalytics" (
    "id" TEXT NOT NULL,
    "metric_name" TEXT NOT NULL,
    "platform" TEXT,
    "device_type" TEXT,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MobileAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BetaInvitation" (
    "id" TEXT NOT NULL,
    "invitee_name" TEXT,
    "email" TEXT NOT NULL,
    "mobile_number" TEXT,
    "intended_role" TEXT NOT NULL,
    "invitation_code" TEXT NOT NULL,
    "invitation_status" TEXT NOT NULL,
    "expiry_date" TIMESTAMP(3),
    "invited_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BetaInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BetaFeedback" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "role" TEXT,
    "module" TEXT NOT NULL,
    "feedback_type" TEXT NOT NULL,
    "rating" INTEGER,
    "message" TEXT NOT NULL,
    "file_url" TEXT,
    "status" TEXT NOT NULL,
    "admin_response" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BetaFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueTicket" (
    "id" TEXT NOT NULL,
    "issue_title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "assigned_to" TEXT,
    "related_user_id" TEXT,
    "related_booking_id" TEXT,
    "related_listing_id" TEXT,
    "related_feedback_id" TEXT,
    "steps_to_reproduce" TEXT,
    "expected_result" TEXT,
    "actual_result" TEXT,
    "resolution_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IssueTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "ticket_number" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "assigned_admin" TEXT,
    "related_booking_id" TEXT,
    "related_listing_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UATFlow" (
    "id" TEXT NOT NULL,
    "flow_name" TEXT NOT NULL,
    "assigned_tester" TEXT,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "start_date" TIMESTAMP(3),
    "completion_date" TIMESTAMP(3),
    "issues_found" TEXT,
    "notes" TEXT,
    "pass_fail_result" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UATFlow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefundRequest" (
    "id" TEXT NOT NULL,
    "refund_number" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "payment_transaction_id" TEXT,
    "renter_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "requested_by" TEXT NOT NULL,
    "refund_reason" TEXT NOT NULL,
    "requested_amount" DOUBLE PRECISION NOT NULL,
    "approved_amount" DOUBLE PRECISION,
    "refund_status" TEXT NOT NULL,
    "finance_notes" TEXT,
    "admin_notes" TEXT,
    "rejection_reason" TEXT,
    "bank_reference" TEXT,
    "manual_transfer_reference" TEXT,
    "proof_file_path" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "marked_processed_by" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefundRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderPayout" (
    "id" TEXT NOT NULL,
    "payout_number" TEXT NOT NULL,
    "payout_batch_id" TEXT,
    "booking_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "gross_rental_amount" DOUBLE PRECISION NOT NULL,
    "platform_commission" DOUBLE PRECISION NOT NULL,
    "delivery_fee_pass_through" DOUBLE PRECISION,
    "deductions" DOUBLE PRECISION,
    "net_payout_amount" DOUBLE PRECISION NOT NULL,
    "payout_status" TEXT NOT NULL,
    "payout_method" TEXT,
    "payout_account_reference" TEXT,
    "manual_bank_reference" TEXT,
    "proof_file_path" TEXT,
    "finance_notes" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "marked_processed_by" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutBatch" (
    "id" TEXT NOT NULL,
    "batch_number" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "total_gross_amount" DOUBLE PRECISION NOT NULL,
    "total_commission" DOUBLE PRECISION NOT NULL,
    "total_net_payout" DOUBLE PRECISION NOT NULL,
    "payout_count" INTEGER NOT NULL,
    "batch_status" TEXT NOT NULL,
    "finance_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "processed_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityEvent" (
    "id" TEXT NOT NULL,
    "event_code" TEXT NOT NULL,
    "source_type" "SecurityEventSource" NOT NULL,
    "source_record_id" TEXT NOT NULL,
    "adapter_version" TEXT NOT NULL DEFAULT '1.0',
    "security_domain" "SecurityDomain" NOT NULL,
    "event_category" TEXT NOT NULL,
    "event_classification" "SecurityEventClassification" NOT NULL,
    "severity" "SecuritySeverity" NOT NULL,
    "confidence_score" INTEGER,
    "environment" "SecurityEnvironment" NOT NULL,
    "lifecycle_type" "SecurityLifecycle" NOT NULL,
    "actor_user_id" TEXT,
    "target_user_id" TEXT,
    "target_resource_id" TEXT,
    "target_module" TEXT,
    "action_attempted" TEXT,
    "action_result" TEXT,
    "source_summary" JSONB,
    "classification_reason" TEXT,
    "correlation_key" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "processing_status" "SecurityProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "source_received_at" TIMESTAMP(3) NOT NULL,
    "ingested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityEventIngestionFailure" (
    "id" TEXT NOT NULL,
    "source_type" "SecurityEventSource" NOT NULL,
    "source_record_id" TEXT NOT NULL,
    "adapter_version" TEXT NOT NULL DEFAULT '1.0',
    "privacy_safe_error_code" TEXT NOT NULL,
    "attempt_count" INTEGER NOT NULL DEFAULT 1,
    "first_failed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_failed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_time" TIMESTAMP(3),
    "lifecycle" "SecurityLifecycle" NOT NULL,
    "environment" "SecurityEnvironment" NOT NULL,
    "resolved_event_id" TEXT,

    CONSTRAINT "SecurityEventIngestionFailure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityEventIngestionCheckpoint" (
    "id" TEXT NOT NULL,
    "source_type" "SecurityEventSource" NOT NULL,
    "environment" "SecurityEnvironment" NOT NULL,
    "lifecycle_type" "SecurityLifecycle" NOT NULL,
    "last_source_timestamp" TIMESTAMP(3),
    "last_source_record_id" TEXT,
    "last_run_started_at" TIMESTAMP(3),
    "last_run_completed_at" TIMESTAMP(3),
    "last_successful_run_at" TIMESTAMP(3),
    "last_error_code" TEXT,
    "lease_owner" TEXT,
    "lease_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityEventIngestionCheckpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetectionRule" (
    "id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "DetectionRuleStatus" NOT NULL DEFAULT 'DRAFT',
    "security_domain" "SecurityDomain" NOT NULL,
    "result_classification" "SecurityEventClassification" NOT NULL,
    "base_severity" "SecuritySeverity" NOT NULL,
    "base_confidence_score" INTEGER NOT NULL,
    "logic_schema_version" TEXT NOT NULL DEFAULT '1.0',
    "evaluation_dsl" JSONB NOT NULL,
    "threshold_count" INTEGER NOT NULL,
    "window_seconds" INTEGER NOT NULL,
    "cooldown_seconds" INTEGER NOT NULL,
    "max_evidence_events" INTEGER NOT NULL,
    "evaluation_timeout_ms" INTEGER NOT NULL,
    "correlation_subject_type" "DetectionCorrelationSubject" NOT NULL,
    "deduplication_strategy" "DetectionDeduplicationStrategy" NOT NULL,
    "confidence_formula" "DetectionConfidenceFormula" NOT NULL,
    "severity_promotion_threshold" INTEGER,
    "promoted_severity" "SecuritySeverity",
    "confidence_increment_per_evidence" INTEGER,
    "created_by_type" "DetectionRuleCreatorType" NOT NULL,
    "created_by_user_id" TEXT,
    "activated_at" TIMESTAMP(3),
    "activated_by_id" TEXT,
    "archived_at" TIMESTAMP(3),
    "archived_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DetectionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityAlert" (
    "id" TEXT NOT NULL,
    "alert_reference" TEXT NOT NULL,
    "suppression_key" TEXT NOT NULL,
    "evidence_digest" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "rule_version" INTEGER NOT NULL,
    "primary_event_id" TEXT NOT NULL,
    "result_classification" "SecurityEventClassification" NOT NULL,
    "base_severity" "SecuritySeverity" NOT NULL,
    "final_severity" "SecuritySeverity" NOT NULL,
    "severity_reason" TEXT,
    "base_confidence" INTEGER NOT NULL,
    "final_confidence" INTEGER NOT NULL,
    "confidence_basis" TEXT NOT NULL,
    "classification_reason" TEXT NOT NULL,
    "lifecycle_type" "SecurityLifecycle" NOT NULL,
    "environment" "SecurityEnvironment" NOT NULL,
    "correlation_subject_type" "DetectionCorrelationSubject" NOT NULL,
    "correlation_hash_key_version" TEXT NOT NULL,
    "correlation_subject_hash" TEXT NOT NULL,
    "window_bucket_start" TIMESTAMP(3) NOT NULL,
    "window_start" TIMESTAMP(3) NOT NULL,
    "window_end" TIMESTAMP(3) NOT NULL,
    "first_event_timestamp" TIMESTAMP(3) NOT NULL,
    "last_event_timestamp" TIMESTAMP(3) NOT NULL,
    "event_count" INTEGER NOT NULL,
    "review_status" "SecurityAlertReviewStatus" NOT NULL DEFAULT 'UNREVIEWED',
    "review_version" INTEGER NOT NULL DEFAULT 0,
    "reviewer_id" TEXT,
    "review_notes" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityAlertEvidence" (
    "alert_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "evidence_role" "AlertEvidenceRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityAlertEvidence_pkey" PRIMARY KEY ("alert_id","event_id")
);

-- CreateTable
CREATE TABLE "RuleEvaluationLog" (
    "id" TEXT NOT NULL,
    "evaluation_identity_key" TEXT NOT NULL,
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "rule_id" TEXT NOT NULL,
    "rule_version" INTEGER NOT NULL,
    "candidate_event_id" TEXT NOT NULL,
    "outcome" "RuleEvaluationOutcome" NOT NULL,
    "matched_event_count" INTEGER NOT NULL,
    "execution_duration_ms" INTEGER NOT NULL,
    "privacy_safe_reason" TEXT,
    "privacy_safe_error_code" TEXT,
    "lifecycle_type" "SecurityLifecycle" NOT NULL,
    "environment" "SecurityEnvironment" NOT NULL,
    "evaluation_timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RuleEvaluationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetectionEvaluationCheckpoint" (
    "id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "rule_version" INTEGER NOT NULL,
    "environment" "SecurityEnvironment" NOT NULL,
    "lifecycle_type" "SecurityLifecycle" NOT NULL,
    "cursor_timestamp" TIMESTAMP(3),
    "cursor_event_id" TEXT,
    "lease_owner" TEXT,
    "lease_expires_at" TIMESTAMP(3),
    "last_run_started_at" TIMESTAMP(3),
    "last_run_completed_at" TIMESTAMP(3),
    "last_successful_run_at" TIMESTAMP(3),
    "privacy_safe_error_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DetectionEvaluationCheckpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentCase" (
    "id" TEXT NOT NULL,
    "case_reference" TEXT NOT NULL,
    "status" "IncidentCaseStatus" NOT NULL DEFAULT 'OPEN',
    "severity" "IncidentCaseSeverity" NOT NULL,
    "origin" "IncidentCaseOrigin" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "opened_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "reopened_at" TIMESTAMP(3),
    "assigned_user_id" TEXT,
    "created_by_user_id" TEXT,
    "originating_security_event_id" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "legal_hold" BOOLEAN NOT NULL DEFAULT false,
    "retention_until" TIMESTAMP(3),

    CONSTRAINT "IncidentCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentCaseHistory" (
    "id" TEXT NOT NULL,
    "incident_case_id" TEXT NOT NULL,
    "previous_status" "IncidentCaseStatus",
    "new_status" "IncidentCaseStatus" NOT NULL,
    "reason" "IncidentCaseHistoryReason" NOT NULL,
    "reason_note" TEXT,
    "actor_user_id" TEXT,
    "assigned_to_user_id" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "idempotency_key" TEXT NOT NULL,

    CONSTRAINT "IncidentCaseHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentCaseNote" (
    "id" TEXT NOT NULL,
    "incident_case_id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "note_type" "IncidentCaseNoteType" NOT NULL,
    "content" TEXT NOT NULL,
    "content_hash" TEXT NOT NULL,
    "is_redacted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idempotency_key" TEXT NOT NULL,

    CONSTRAINT "IncidentCaseNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentCaseEvidence" (
    "id" TEXT NOT NULL,
    "incident_case_id" TEXT NOT NULL,
    "evidence_type" "IncidentCaseEvidenceType" NOT NULL,
    "source_classification" "IncidentCaseEvidenceSource" NOT NULL,
    "added_by_user_id" TEXT,
    "collected_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference_key" TEXT NOT NULL,
    "integrity_hash" TEXT NOT NULL,
    "content_type" TEXT,
    "size_bytes" INTEGER,
    "idempotency_key" TEXT NOT NULL,
    "legal_hold" BOOLEAN NOT NULL DEFAULT false,
    "retention_until" TIMESTAMP(3),

    CONSTRAINT "IncidentCaseEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityResponsePlaybook" (
    "id" TEXT NOT NULL,
    "playbook_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "SecurityPlaybookStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by_id" TEXT,
    "approved_by_id" TEXT,
    "lock_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityResponsePlaybook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityResponseStep" (
    "id" TEXT NOT NULL,
    "playbook_id" TEXT NOT NULL,
    "playbook_version" INTEGER NOT NULL,
    "step_order" INTEGER NOT NULL,
    "action_type" "SecurityResponseActionType" NOT NULL,
    "human_instruction" TEXT NOT NULL,
    "expected_evidence" TEXT,
    "reversibility" "SecurityResponseReversibility" NOT NULL,
    "duration_seconds" INTEGER,
    "risk_level" "SecuritySeverity" NOT NULL,
    "approval_required" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SecurityResponseStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentCasePlaybookLink" (
    "id" TEXT NOT NULL,
    "incident_case_id" TEXT NOT NULL,
    "playbook_id" TEXT NOT NULL,
    "playbook_version" INTEGER NOT NULL,
    "linked_by_id" TEXT,
    "linked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentCasePlaybookLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityResponseApprovalRequest" (
    "id" TEXT NOT NULL,
    "requester_id" TEXT NOT NULL,
    "approver_id" TEXT,
    "incident_case_id" TEXT NOT NULL,
    "playbook_id" TEXT NOT NULL,
    "playbook_version" INTEGER NOT NULL,
    "status" "SecurityApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "justification" TEXT NOT NULL,
    "response_type" "SecurityResponseActionType",
    "target_type" TEXT,
    "target_id" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decision_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "idempotency_key" TEXT NOT NULL,

    CONSTRAINT "SecurityResponseApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityResponseApprovalDecision" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "event_type" "SecurityApprovalEventType" NOT NULL,
    "actor_id" TEXT,
    "reason" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idempotency_key" TEXT NOT NULL,

    CONSTRAINT "SecurityResponseApprovalDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityResponseApprovalGrant" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "incident_case_id" TEXT NOT NULL,
    "playbook_id" TEXT NOT NULL,
    "playbook_version" INTEGER NOT NULL,
    "grant_state" "SecurityApprovalGrantState" NOT NULL DEFAULT 'AVAILABLE',
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "revoked_by_id" TEXT,

    CONSTRAINT "SecurityResponseApprovalGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityResponseExecution" (
    "id" TEXT NOT NULL,
    "incident_case_id" TEXT NOT NULL,
    "playbook_id" TEXT NOT NULL,
    "playbook_version" INTEGER NOT NULL,
    "approval_request_id" TEXT NOT NULL,
    "approval_grant_id" TEXT NOT NULL,
    "response_type" "SecurityResponseActionType" NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "status" "SecurityExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "idempotency_key" TEXT NOT NULL,
    "requested_by_id" TEXT NOT NULL,
    "executed_by_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "rolled_back_at" TIMESTAMP(3),
    "failure_code" TEXT,
    "lock_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityResponseExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityResponseAction" (
    "id" TEXT NOT NULL,
    "execution_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "action_type" "SecurityResponseActionType" NOT NULL,
    "target_reference" TEXT NOT NULL,
    "before_state" TEXT,
    "after_state" TEXT,
    "status" "SecurityExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "executed_at" TIMESTAMP(3),
    "rolled_back_at" TIMESTAMP(3),
    "failure_metadata" TEXT,

    CONSTRAINT "SecurityResponseAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BehavioralRiskAssessment" (
    "id" TEXT NOT NULL,
    "subject_reference" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "risk_band" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "policy_version" TEXT NOT NULL,
    "environment" "SecurityEnvironment" NOT NULL,
    "lifecycle" "SecurityLifecycle" NOT NULL,
    "window_start" TIMESTAMP(3) NOT NULL,
    "window_end" TIMESTAMP(3) NOT NULL,
    "generated_time" TIMESTAMP(3) NOT NULL,
    "advisory_only" BOOLEAN NOT NULL DEFAULT true,
    "source_diversity" INTEGER NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BehavioralRiskAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BehavioralRiskSignal" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "signal_code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "raw_weight" INTEGER NOT NULL,
    "effective_weight" INTEGER NOT NULL,
    "confidence" TEXT NOT NULL,
    "first_observed" TIMESTAMP(3) NOT NULL,
    "last_observed" TIMESTAMP(3) NOT NULL,
    "source_count" INTEGER NOT NULL,
    "sort_ordinal" INTEGER NOT NULL,

    CONSTRAINT "BehavioralRiskSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BehavioralRiskEvidenceLink" (
    "signal_id" TEXT NOT NULL,
    "security_event_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BehavioralRiskEvidenceLink_pkey" PRIMARY KEY ("signal_id","security_event_id")
);

-- CreateTable
CREATE TABLE "SecurityEventGeoEnrichment" (
    "id" TEXT NOT NULL,
    "security_event_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_database_version" TEXT,
    "ip_fingerprint" TEXT NOT NULL,
    "country_code" TEXT,
    "country_name" TEXT,
    "region_name" TEXT,
    "city_name" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "accuracy_radius_km" DOUBLE PRECISION,
    "location_precision" TEXT,
    "lookup_attempted_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "failure_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityEventGeoEnrichment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProhibitedItemPolicy" (
    "id" TEXT NOT NULL,
    "policyCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "fullDescription" TEXT NOT NULL,
    "classification" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "enforcementAction" TEXT NOT NULL,
    "examples" TEXT NOT NULL,
    "prohibitedKeywords" TEXT NOT NULL,
    "reviewKeywords" TEXT NOT NULL,
    "exclusions" TEXT NOT NULL,
    "regulator" TEXT,
    "legalReference" TEXT,
    "publicGuidance" TEXT,
    "internalGuidance" TEXT,
    "automaticBlockEnabled" BOOLEAN NOT NULL DEFAULT false,
    "manualReviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "securityEscalationRequired" BOOLEAN NOT NULL DEFAULT false,
    "accountEnforcementEligible" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveUntil" TIMESTAMP(3),
    "policyVersion" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,

    CONSTRAINT "ProhibitedItemPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingPolicyEvaluation" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "evaluationSource" TEXT NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "submittedTitle" TEXT NOT NULL,
    "submittedDescriptionHash" TEXT NOT NULL,
    "matchedPolicyId" TEXT,
    "matchedTerms" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "classification" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "reasonCode" TEXT NOT NULL,
    "userSafeReason" TEXT NOT NULL,
    "internalReason" TEXT NOT NULL,
    "rulesEngineVersion" TEXT NOT NULL,
    "modelName" TEXT,
    "confidence" DOUBLE PRECISION,
    "requiresManualReview" BOOLEAN NOT NULL DEFAULT false,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedByUserId" TEXT,

    CONSTRAINT "ListingPolicyEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingEnforcementCase" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "caseStatus" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "enforcementAction" TEXT NOT NULL,
    "evidenceReference" TEXT,
    "internalNotes" TEXT,
    "userNotice" TEXT,
    "assignedToUserId" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedByUserId" TEXT,
    "resolution" TEXT,
    "appealEligible" BOOLEAN NOT NULL DEFAULT false,
    "appealDeadline" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingEnforcementCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingPolicyAppeal" (
    "id" TEXT NOT NULL,
    "enforcementCaseId" TEXT NOT NULL,
    "appellantUserId" TEXT NOT NULL,
    "appealReason" TEXT NOT NULL,
    "supportingStatement" TEXT NOT NULL,
    "submittedDocumentIds" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reviewerUserId" TEXT,
    "reviewerDecision" TEXT,
    "reviewerNotes" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingPolicyAppeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyChangeRecord" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "previousVersion" TEXT NOT NULL,
    "newVersion" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "changeSummary" TEXT NOT NULL,
    "previousValues" TEXT NOT NULL,
    "newValues" TEXT NOT NULL,
    "changedByUserId" TEXT NOT NULL,
    "approvedByUserId" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyChangeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CookieConsentReceipt" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "anonymous_consent_id" TEXT,
    "policy_version" TEXT NOT NULL,
    "consent_version" INTEGER NOT NULL,
    "necessary_enabled" BOOLEAN NOT NULL,
    "functional_enabled" BOOLEAN NOT NULL,
    "analytics_enabled" BOOLEAN NOT NULL,
    "marketing_enabled" BOOLEAN NOT NULL,
    "consent_action" TEXT NOT NULL,
    "source" TEXT,
    "consented_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawn_at" TIMESTAMP(3),
    "ip_address" TEXT NOT NULL,
    "user_agent" TEXT NOT NULL,

    CONSTRAINT "CookieConsentReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataSubjectRequest" (
    "id" TEXT NOT NULL,
    "reference_number" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "request_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "identity_verification_status" TEXT,
    "due_at" TIMESTAMP(3),
    "requester_email_encrypted" TEXT,
    "requester_message" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "resolution_notes" TEXT,
    "assigned_to_id" TEXT,
    "dpo_escalation_status" TEXT,
    "dpo_escalated_at" TIMESTAMP(3),
    "dpo_escalated_by_user_id" TEXT,
    "dpo_escalation_reason" TEXT,

    CONSTRAINT "DataSubjectRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsurancePartner" (
    "id" TEXT NOT NULL,
    "adapter_key" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DISABLED',
    "is_mock" BOOLEAN NOT NULL DEFAULT false,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "capabilities" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsurancePartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceProduct" (
    "id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "product_code" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "coverage_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "currency" VARCHAR(3) NOT NULL,
    "terms_reference" TEXT,
    "configuration" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsuranceProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceOffer" (
    "id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "external_offer_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "premium_amount" DECIMAL(20,4) NOT NULL,
    "tax_amount" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL,
    "coverage_start" TIMESTAMP(3) NOT NULL,
    "coverage_end" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "normalized_terms" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InsuranceOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceSelection" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "offer_reference" TEXT NOT NULL,
    "partner_key" TEXT NOT NULL,
    "product_code" TEXT NOT NULL,
    "disclosure_version" TEXT NOT NULL,
    "premium_minor" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "coverage_start" TIMESTAMP(3) NOT NULL,
    "coverage_end" TIMESTAMP(3) NOT NULL,
    "offer_expires_at" TIMESTAMP(3) NOT NULL,
    "consent_accepted" BOOLEAN NOT NULL,
    "consented_at" TIMESTAMP(3) NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "request_hash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SELECTED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsuranceSelection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceOrder" (
    "id" TEXT NOT NULL,
    "selection_id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "request_hash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SELECTED',
    "payment_dependency_status" TEXT NOT NULL DEFAULT 'PENDING',
    "payment_reference" TEXT,
    "issuance_idempotency_key" TEXT,
    "issuance_request_hash" TEXT,
    "external_order_id" TEXT,
    "failure_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsuranceOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsurancePolicy" (
    "id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "insurance_order_id" TEXT,
    "external_policy_id" TEXT NOT NULL,
    "order_reference" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "premium_amount" DECIMAL(20,4) NOT NULL,
    "tax_amount" DECIMAL(20,4) NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL,
    "coverage_start" TIMESTAMP(3) NOT NULL,
    "coverage_end" TIMESTAMP(3) NOT NULL,
    "issued_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancellation_reason_code" TEXT,
    "normalized_snapshot" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsurancePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceReconciliationLog" (
    "id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "policy_id" TEXT,
    "order_reference" TEXT,
    "batch_reference" TEXT,
    "internal_amount_minor" INTEGER,
    "partner_amount_minor" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'PHP',
    "settlement_reference" TEXT,
    "classification" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "resolution_reference" TEXT,
    "audit_reference" TEXT,

    CONSTRAINT "InsuranceReconciliationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceFinanceException" (
    "id" TEXT NOT NULL,
    "policy_id" TEXT,
    "order_reference" TEXT,
    "exception_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "context" JSONB,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "resolution_notes" TEXT,
    "resolved_by_user_id" TEXT,

    CONSTRAINT "InsuranceFinanceException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceClaim" (
    "id" TEXT NOT NULL,
    "policy_id" TEXT NOT NULL,
    "external_claim_id" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "incident_type" TEXT NOT NULL,
    "incident_at" TIMESTAMP(3) NOT NULL,
    "incident_summary" TEXT,
    "claimant_user_id" TEXT,
    "claimed_amount" INTEGER,
    "currency" TEXT,
    "normalized_snapshot" JSONB,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsuranceClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceClaimEvidence" (
    "id" TEXT NOT NULL,
    "claim_id" TEXT NOT NULL,
    "evidence_type" TEXT NOT NULL,
    "file_reference" TEXT NOT NULL,
    "mime_type" TEXT,
    "size_bytes" INTEGER,
    "uploaded_by" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "partner_transfer" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InsuranceClaimEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceWebhookEvent" (
    "id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "external_event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "body_hash" TEXT NOT NULL,
    "signature_valid" BOOLEAN NOT NULL,
    "processing_status" TEXT NOT NULL DEFAULT 'PENDING',
    "occurred_at" TIMESTAMP(3),
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "failure_code" TEXT,

    CONSTRAINT "InsuranceWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivacyPolicyVersion" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "effective_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content_url" TEXT,
    "created_by_id" TEXT,
    "approved_by_id" TEXT,

    CONSTRAINT "PrivacyPolicyVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_configs" (
    "id" TEXT NOT NULL,
    "killSwitchEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,
    "updatedByUserId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "insurance_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiServiceSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "nonce" TEXT,
    "channel" TEXT NOT NULL,
    "conversationId" TEXT,
    "sourceRoute" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "voiceEnabled" BOOLEAN NOT NULL DEFAULT false,
    "avatarEnabled" BOOLEAN NOT NULL DEFAULT false,
    "providerSessionId" TEXT,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "AiServiceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "activeCaseId" TEXT,
    "continuityKey" TEXT,
    "summary" TEXT,
    "lastIntent" TEXT,
    "lastChannel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "sessionId" TEXT,
    "role" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "safePayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiSupportCase" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "userId" TEXT,
    "activeIssueKey" TEXT,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "severity" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "summary" TEXT,
    "policyVersion" TEXT,
    "slaDueAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiSupportCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiCaseEntityLink" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiCaseEntityLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiCaseEvidence" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "submittedByUserId" TEXT NOT NULL,
    "evidenceType" TEXT NOT NULL,
    "fileReference" TEXT,
    "description" TEXT,
    "sourceChannel" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiCaseEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiToolExecution" (
    "id" TEXT NOT NULL,
    "caseId" TEXT,
    "sessionId" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "requestFingerprint" TEXT NOT NULL,
    "riskClass" TEXT NOT NULL,
    "authorizationStatus" TEXT NOT NULL,
    "policyStatus" TEXT,
    "confirmationStatus" TEXT,
    "idempotencyKey" TEXT,
    "externalReference" TEXT,
    "executionStatus" TEXT NOT NULL,
    "verificationStatus" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AiToolExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiMediationRequest" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "conversationId" TEXT,
    "bookingId" TEXT NOT NULL,
    "requestingUserId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "requestedChange" JSONB NOT NULL,
    "providerConsentRequired" BOOLEAN NOT NULL,
    "providerDecision" TEXT,
    "providerDecisionAt" TIMESTAMP(3),
    "providerDecisionBy" TEXT,
    "authoritativeConsequence" JSONB,
    "consequenceVersion" TEXT,
    "renterConfirmationRequired" BOOLEAN NOT NULL,
    "renterConfirmedAt" TIMESTAMP(3),
    "renterConfirmedBy" TEXT,
    "status" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "toolExecutionId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiMediationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiPolicyDecision" (
    "id" TEXT NOT NULL,
    "caseId" TEXT,
    "policyType" TEXT NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "resultData" JSONB,
    "reasonCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiPolicyDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiResolution" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "resolutionType" TEXT NOT NULL,
    "resolutionStatus" TEXT NOT NULL,
    "policyDecisionId" TEXT,
    "toolExecutionId" TEXT,
    "userFacingExplanation" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "AiResolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiFollowUp" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "triggerAt" TIMESTAMP(3) NOT NULL,
    "triggerType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "nextAttemptAt" TIMESTAMP(3),
    "eventType" TEXT,
    "sourceEventKey" TEXT,
    "deduplicationKey" TEXT,
    "userId" TEXT,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "eligibleAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "cooldownUntil" TIMESTAMP(3),
    "lastCheckedAt" TIMESTAMP(3),
    "allowedTool" TEXT,
    "auditMetadata" JSONB,
    "notificationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiFollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiInteractionFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "caseId" TEXT,
    "rating" TEXT NOT NULL,
    "reason" TEXT,
    "comment" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiInteractionFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiInteractionEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "conversationId" TEXT,
    "messageId" TEXT,
    "caseId" TEXT,
    "eventType" TEXT NOT NULL,
    "interactionSource" TEXT,
    "suggestionId" TEXT,
    "route" TEXT,
    "intent" TEXT,
    "specialistId" TEXT,
    "knowledgeSourceKey" TEXT,
    "knowledgeChunkKey" TEXT,
    "toolExecutionId" TEXT,
    "responseLatencyMs" INTEGER,
    "knowledgeMatched" BOOLEAN,
    "outcome" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiInteractionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiKnowledgeSource" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "module" TEXT NOT NULL DEFAULT 'Legacy',
    "topic" TEXT NOT NULL DEFAULT 'General',
    "category" TEXT NOT NULL,
    "applicableRoles" TEXT NOT NULL,
    "roles" JSONB,
    "visibility" TEXT NOT NULL DEFAULT 'AUTHENTICATED',
    "status" TEXT NOT NULL,
    "approvalStatus" TEXT NOT NULL DEFAULT 'APPROVED',
    "authority" TEXT NOT NULL DEFAULT 'LEGACY',
    "approvalEvidence" TEXT,
    "version" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveUntil" TIMESTAMP(3),
    "sourceType" TEXT NOT NULL,
    "sourceLocator" TEXT,
    "sourceReference" TEXT,
    "contentHash" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "supersedesId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiKnowledgeSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiKnowledgeChunk" (
    "id" TEXT NOT NULL,
    "knowledgeSourceId" TEXT NOT NULL,
    "chunkKey" TEXT NOT NULL,
    "headingPath" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "normalizedContent" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "keywords" JSONB,
    "ordinal" INTEGER NOT NULL,
    "visibility" TEXT,
    "roles" JSONB,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiKnowledgeChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiProviderSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerSessionRef" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "AiProviderSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialMetric" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "social_account_id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "post_id" TEXT,
    "metric_type" TEXT NOT NULL,
    "metric_value" DOUBLE PRECISION NOT NULL,
    "measurement_timestamp" TIMESTAMP(3) NOT NULL,
    "provider_timestamp" TIMESTAMP(3),
    "source_classification" "SocialMetricClassification" NOT NULL DEFAULT 'ACTUAL',
    "provider_reference" TEXT,
    "deduplication_key" TEXT,
    "ingestion_timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialAttribution" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "post_id" TEXT,
    "listing_id" TEXT,
    "user_id" TEXT,
    "booking_id" TEXT,
    "payment_transaction_id" TEXT,
    "attribution_token" TEXT,
    "source_channel" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "attribution_status" "SocialAttributionStatus" NOT NULL DEFAULT 'PENDING',
    "confidence_score" INTEGER,
    "attribution_method" TEXT,
    "sanitized_metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialAttribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialProviderEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "social_account_id" TEXT,
    "provider_event_id" TEXT,
    "event_type" TEXT NOT NULL,
    "payload_summary" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processing_state" "SocialProviderEventState" NOT NULL DEFAULT 'PENDING',
    "processed_at" TIMESTAMP(3),
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "error_state" TEXT,
    "idempotency_key" TEXT NOT NULL,

    CONSTRAINT "SocialProviderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingPostVersion" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "content_snapshot" TEXT,
    "media_snapshot" TEXT,
    "target_channels" TEXT,
    "target_account_id" TEXT,
    "change_reason" TEXT,
    "editor_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingPostVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingPostReview" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "post_version_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "comment" TEXT,
    "override_reason" TEXT,
    "self_approval_override" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingPostReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialFeedback" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "social_account_id" TEXT,
    "provider_feedback_id" TEXT NOT NULL,
    "provider_event_id" TEXT,
    "campaign_id" TEXT,
    "marketing_post_id" TEXT,
    "listing_id" TEXT,
    "author_provider_id" TEXT,
    "feedback_type" TEXT NOT NULL,
    "normalized_text" TEXT NOT NULL,
    "sentiment" "SocialFeedbackSentiment",
    "topic" TEXT,
    "severity" "SocialFeedbackSeverity" NOT NULL DEFAULT 'LOW',
    "status" "SocialFeedbackStatus" NOT NULL DEFAULT 'NEW',
    "ai_classification_metadata" TEXT,
    "linked_case_type" TEXT,
    "linked_case_id" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SemanticLearningCandidate" (
    "id" TEXT NOT NULL,
    "normalizedPhrase" TEXT NOT NULL,
    "canonicalCandidateId" TEXT NOT NULL,
    "semanticType" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "matchSource" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "observationCount" INTEGER NOT NULL DEFAULT 0,
    "successfulGroundedCount" INTEGER NOT NULL DEFAULT 0,
    "failedGroundedCount" INTEGER NOT NULL DEFAULT 0,
    "explicitUserCorrectionCount" INTEGER NOT NULL DEFAULT 0,
    "ambiguityCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "lexiconVersionObserved" TEXT NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "lastVerifiedAt" TIMESTAMP(3),
    "traceReference" TEXT,
    "createdBy" TEXT NOT NULL DEFAULT 'SYSTEM_LEARNING',
    "lastFailureReason" TEXT,
    "lastPromotionReason" TEXT,
    "deactivatedAt" TIMESTAMP(3),
    "user_id" TEXT,

    CONSTRAINT "SemanticLearningCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanonicalQuestionIntent" (
    "id" TEXT NOT NULL,
    "intentKey" TEXT NOT NULL,
    "canonicalQuestion" TEXT NOT NULL,
    "normalizedQuestion" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "version" TEXT NOT NULL DEFAULT 'v1.2',
    "effectiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CanonicalQuestionIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanonicalQuestionAlias" (
    "id" TEXT NOT NULL,
    "canonicalIntentId" TEXT NOT NULL,
    "aliasText" TEXT NOT NULL,
    "normalizedAliasText" TEXT NOT NULL,
    "aliasType" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CanonicalQuestionAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanonicalIntentAccessScope" (
    "id" TEXT NOT NULL,
    "canonicalIntentId" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "requiredPermission" TEXT,
    "answerClass" TEXT NOT NULL,
    "authorityType" TEXT NOT NULL,
    "authorityReference" TEXT NOT NULL,
    "knowledgeSourceKey" TEXT,
    "knowledgeSectionKey" TEXT,
    "liveServiceKey" TEXT,
    "toolKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CanonicalIntentAccessScope_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserMfa_user_id_key" ON "UserMfa"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "MfaSessionAssurance_session_key_hash_key" ON "MfaSessionAssurance"("session_key_hash");

-- CreateIndex
CREATE INDEX "MfaSessionAssurance_session_key_hash_user_id_assurance_leve_idx" ON "MfaSessionAssurance"("session_key_hash", "user_id", "assurance_level");

-- CreateIndex
CREATE INDEX "MfaSessionAssurance_user_id_expires_at_idx" ON "MfaSessionAssurance"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "MfaSessionAssurance_revoked_at_expires_at_idx" ON "MfaSessionAssurance"("revoked_at", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_hash_key" ON "PasswordResetToken"("token_hash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_user_id_created_at_idx" ON "PasswordResetToken"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expires_at_idx" ON "PasswordResetToken"("expires_at");

-- CreateIndex
CREATE INDEX "PasswordResetRequest_identity_hash_requested_at_idx" ON "PasswordResetRequest"("identity_hash", "requested_at");

-- CreateIndex
CREATE INDEX "PasswordResetRequest_ip_hash_requested_at_idx" ON "PasswordResetRequest"("ip_hash", "requested_at");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_session_key_hash_key" ON "UserSession"("session_key_hash");

-- CreateIndex
CREATE INDEX "UserSession_user_id_revoked_at_expires_at_idx" ON "UserSession"("user_id", "revoked_at", "expires_at");

-- CreateIndex
CREATE INDEX "UserSession_expires_at_idx" ON "UserSession"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "EmailCredential_user_id_key" ON "EmailCredential"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "EmailCredential_normalized_email_key" ON "EmailCredential"("normalized_email");

-- CreateIndex
CREATE INDEX "EmailCredential_normalized_email_idx" ON "EmailCredential"("normalized_email");

-- CreateIndex
CREATE INDEX "AuthProviderIdentity_user_id_provider_idx" ON "AuthProviderIdentity"("user_id", "provider");

-- CreateIndex
CREATE INDEX "AuthProviderIdentity_provider_updated_at_idx" ON "AuthProviderIdentity"("provider", "updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "AuthProviderIdentity_provider_provider_subject_key" ON "AuthProviderIdentity"("provider", "provider_subject");

-- CreateIndex
CREATE UNIQUE INDEX "PhoneIdentity_phone_e164_key" ON "PhoneIdentity"("phone_e164");

-- CreateIndex
CREATE INDEX "PhoneIdentity_user_id_idx" ON "PhoneIdentity"("user_id");

-- CreateIndex
CREATE INDEX "PhoneVerificationChallenge_phone_e164_channel_status_create_idx" ON "PhoneVerificationChallenge"("phone_e164", "channel", "status", "created_at");

-- CreateIndex
CREATE INDEX "PhoneVerificationChallenge_expires_at_idx" ON "PhoneVerificationChallenge"("expires_at");

-- CreateIndex
CREATE INDEX "PhoneVerificationChallenge_ip_reference_hash_created_at_idx" ON "PhoneVerificationChallenge"("ip_reference_hash", "created_at");

-- CreateIndex
CREATE INDEX "PhoneVerificationChallenge_session_reference_hash_created_a_idx" ON "PhoneVerificationChallenge"("session_reference_hash", "created_at");

-- CreateIndex
CREATE INDEX "AuthRateLimit_reset_at_idx" ON "AuthRateLimit"("reset_at");

-- CreateIndex
CREATE INDEX "AuthConsentReceipt_user_id_accepted_at_idx" ON "AuthConsentReceipt"("user_id", "accepted_at");

-- CreateIndex
CREATE INDEX "AuthIdentityEvent_user_id_created_at_idx" ON "AuthIdentityEvent"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "AuthIdentityEvent_identity_type_action_outcome_idx" ON "AuthIdentityEvent"("identity_type", "action", "outcome");

-- CreateIndex
CREATE UNIQUE INDEX "PsgcSubdivision_psgcCode_key" ON "PsgcSubdivision"("psgcCode");

-- CreateIndex
CREATE INDEX "PsgcSubdivision_parentPsgcCode_geographicLevel_idx" ON "PsgcSubdivision"("parentPsgcCode", "geographicLevel");

-- CreateIndex
CREATE INDEX "PsgcSubdivision_geographicLevel_name_idx" ON "PsgcSubdivision"("geographicLevel", "name");

-- CreateIndex
CREATE INDEX "PsgcSubdivision_geographicLevel_isActive_idx" ON "PsgcSubdivision"("geographicLevel", "isActive");

-- CreateIndex
CREATE INDEX "AddressApiRateLimit_resetAt_idx" ON "AddressApiRateLimit"("resetAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_user_id_key" ON "UserProfile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_global_address_id_key" ON "UserProfile"("global_address_id");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessProfile_user_id_key" ON "BusinessProfile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessProfile_global_business_address_id_key" ON "BusinessProfile"("global_business_address_id");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryRequirement_category_id_key" ON "CategoryRequirement"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "ListingImportJob_idempotency_key_key" ON "ListingImportJob"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "ListingImportJob_created_listing_id_key" ON "ListingImportJob"("created_listing_id");

-- CreateIndex
CREATE INDEX "ListingImportJob_provider_id_status_updated_at_idx" ON "ListingImportJob"("provider_id", "status", "updated_at");

-- CreateIndex
CREATE INDEX "ListingImportJob_source_connector_created_at_idx" ON "ListingImportJob"("source_connector", "created_at");

-- CreateIndex
CREATE INDEX "ListingImportJob_source_reference_hash_idx" ON "ListingImportJob"("source_reference_hash");

-- CreateIndex
CREATE INDEX "ListingImportJob_status_next_attempt_at_idx" ON "ListingImportJob"("status", "next_attempt_at");

-- CreateIndex
CREATE INDEX "ListingImportJob_correlation_id_idx" ON "ListingImportJob"("correlation_id");

-- CreateIndex
CREATE INDEX "ListingImportSource_job_id_idx" ON "ListingImportSource"("job_id");

-- CreateIndex
CREATE INDEX "ListingImportSource_source_reference_hash_idx" ON "ListingImportSource"("source_reference_hash");

-- CreateIndex
CREATE INDEX "ListingImportSource_source_identifier_idx" ON "ListingImportSource"("source_identifier");

-- CreateIndex
CREATE INDEX "ListingImportField_job_id_confidence_state_idx" ON "ListingImportField"("job_id", "confidence_state");

-- CreateIndex
CREATE INDEX "ListingImportField_job_id_is_blocking_idx" ON "ListingImportField"("job_id", "is_blocking");

-- CreateIndex
CREATE INDEX "ListingImportField_source_id_idx" ON "ListingImportField"("source_id");

-- CreateIndex
CREATE UNIQUE INDEX "ListingImportField_job_id_field_name_key" ON "ListingImportField"("job_id", "field_name");

-- CreateIndex
CREATE INDEX "ListingImportAsset_content_sha256_idx" ON "ListingImportAsset"("content_sha256");

-- CreateIndex
CREATE INDEX "ListingImportAsset_job_id_status_idx" ON "ListingImportAsset"("job_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ListingImportAsset_job_id_source_reference_hash_key" ON "ListingImportAsset"("job_id", "source_reference_hash");

-- CreateIndex
CREATE UNIQUE INDEX "ListingImportAsset_job_id_content_sha256_key" ON "ListingImportAsset"("job_id", "content_sha256");

-- CreateIndex
CREATE INDEX "ListingImportResolution_resolved_by_user_id_resolved_at_idx" ON "ListingImportResolution"("resolved_by_user_id", "resolved_at");

-- CreateIndex
CREATE UNIQUE INDEX "ListingImportResolution_job_id_field_name_key" ON "ListingImportResolution"("job_id", "field_name");

-- CreateIndex
CREATE INDEX "ListingImportAuditEvent_job_id_created_at_idx" ON "ListingImportAuditEvent"("job_id", "created_at");

-- CreateIndex
CREATE INDEX "ListingImportAuditEvent_actor_user_id_created_at_idx" ON "ListingImportAuditEvent"("actor_user_id", "created_at");

-- CreateIndex
CREATE INDEX "ListingImportAuditEvent_audit_log_id_idx" ON "ListingImportAuditEvent"("audit_log_id");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_booking_id_key" ON "Payment"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transaction_id_key" ON "Payment"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_gateway_transaction_id_key" ON "Payment"("gateway_transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "GatewayTransaction_idempotency_key_key" ON "GatewayTransaction"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "GatewayTransaction_gateway_reference_key" ON "GatewayTransaction"("gateway_reference");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentActionLog_idempotency_key_key" ON "PaymentActionLog"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceLedger_idempotency_key_key" ON "FinanceLedger"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "RentalAgreement_booking_id_key" ON "RentalAgreement"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSettings_key_key" ON "SystemSettings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "DamageClaim_claim_number_key" ON "DamageClaim"("claim_number");

-- CreateIndex
CREATE INDEX "ApiSecurityLog_event_code_occurred_at_idx" ON "ApiSecurityLog"("event_code", "occurred_at");

-- CreateIndex
CREATE INDEX "ApiSecurityLog_ip_reference_hash_occurred_at_idx" ON "ApiSecurityLog"("ip_reference_hash", "occurred_at");

-- CreateIndex
CREATE INDEX "ApiSecurityLog_correlation_id_idx" ON "ApiSecurityLog"("correlation_id");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_setting_key_key" ON "SystemSetting"("setting_key");

-- CreateIndex
CREATE INDEX "AuthenticationSecurityLog_event_code_occurred_at_idx" ON "AuthenticationSecurityLog"("event_code", "occurred_at");

-- CreateIndex
CREATE INDEX "AuthenticationSecurityLog_subject_reference_hash_occurred_a_idx" ON "AuthenticationSecurityLog"("subject_reference_hash", "occurred_at");

-- CreateIndex
CREATE INDEX "AuthenticationSecurityLog_ip_reference_hash_occurred_at_idx" ON "AuthenticationSecurityLog"("ip_reference_hash", "occurred_at");

-- CreateIndex
CREATE INDEX "AuthenticationSecurityLog_device_reference_hash_occurred_at_idx" ON "AuthenticationSecurityLog"("device_reference_hash", "occurred_at");

-- CreateIndex
CREATE INDEX "AuthenticationSecurityLog_expires_at_idx" ON "AuthenticationSecurityLog"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignListingLink_campaign_id_listing_id_key" ON "CampaignListingLink"("campaign_id", "listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignTargetAccount_campaign_id_target_account_id_key" ON "CampaignTargetAccount"("campaign_id", "target_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "SocialPostQueue_idempotency_key_key" ON "SocialPostQueue"("idempotency_key");

-- CreateIndex
CREATE INDEX "SocialPublicationAttempt_queue_id_idx" ON "SocialPublicationAttempt"("queue_id");

-- CreateIndex
CREATE INDEX "SocialPublicationAttempt_status_next_retry_at_idx" ON "SocialPublicationAttempt"("status", "next_retry_at");

-- CreateIndex
CREATE UNIQUE INDEX "SocialPublicationAttempt_queue_id_attempt_number_key" ON "SocialPublicationAttempt"("queue_id", "attempt_number");

-- CreateIndex
CREATE UNIQUE INDEX "BetaInvitation_invitation_code_key" ON "BetaInvitation"("invitation_code");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_ticket_number_key" ON "SupportTicket"("ticket_number");

-- CreateIndex
CREATE UNIQUE INDEX "RefundRequest_refund_number_key" ON "RefundRequest"("refund_number");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderPayout_payout_number_key" ON "ProviderPayout"("payout_number");

-- CreateIndex
CREATE UNIQUE INDEX "PayoutBatch_batch_number_key" ON "PayoutBatch"("batch_number");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityEvent_idempotency_key_key" ON "SecurityEvent"("idempotency_key");

-- CreateIndex
CREATE INDEX "SecurityEvent_lifecycle_type_occurred_at_id_idx" ON "SecurityEvent"("lifecycle_type", "occurred_at", "id");

-- CreateIndex
CREATE INDEX "SecurityEvent_source_type_source_record_id_idx" ON "SecurityEvent"("source_type", "source_record_id");

-- CreateIndex
CREATE INDEX "SecurityEvent_security_domain_occurred_at_idx" ON "SecurityEvent"("security_domain", "occurred_at");

-- CreateIndex
CREATE INDEX "SecurityEvent_severity_occurred_at_idx" ON "SecurityEvent"("severity", "occurred_at");

-- CreateIndex
CREATE INDEX "SecurityEvent_processing_status_occurred_at_idx" ON "SecurityEvent"("processing_status", "occurred_at");

-- CreateIndex
CREATE INDEX "SecurityEvent_actor_user_id_occurred_at_idx" ON "SecurityEvent"("actor_user_id", "occurred_at");

-- CreateIndex
CREATE INDEX "SecurityEvent_target_user_id_occurred_at_idx" ON "SecurityEvent"("target_user_id", "occurred_at");

-- CreateIndex
CREATE INDEX "SecurityEvent_target_resource_id_occurred_at_idx" ON "SecurityEvent"("target_resource_id", "occurred_at");

-- CreateIndex
CREATE INDEX "SecurityEvent_correlation_key_occurred_at_idx" ON "SecurityEvent"("correlation_key", "occurred_at");

-- CreateIndex
CREATE INDEX "SecurityEventIngestionFailure_source_type_source_record_id_idx" ON "SecurityEventIngestionFailure"("source_type", "source_record_id");

-- CreateIndex
CREATE INDEX "SecurityEventIngestionFailure_last_failed_at_idx" ON "SecurityEventIngestionFailure"("last_failed_at");

-- CreateIndex
CREATE INDEX "SecurityEventIngestionFailure_resolved_event_id_idx" ON "SecurityEventIngestionFailure"("resolved_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityEventIngestionFailure_source_type_source_record_id__key" ON "SecurityEventIngestionFailure"("source_type", "source_record_id", "adapter_version", "lifecycle", "environment", "privacy_safe_error_code");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityEventIngestionCheckpoint_source_type_environment_li_key" ON "SecurityEventIngestionCheckpoint"("source_type", "environment", "lifecycle_type");

-- CreateIndex
CREATE INDEX "DetectionRule_status_idx" ON "DetectionRule"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DetectionRule_rule_id_version_key" ON "DetectionRule"("rule_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityAlert_alert_reference_key" ON "SecurityAlert"("alert_reference");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityAlert_suppression_key_key" ON "SecurityAlert"("suppression_key");

-- CreateIndex
CREATE INDEX "SecurityAlert_lifecycle_type_environment_created_at_id_idx" ON "SecurityAlert"("lifecycle_type", "environment", "created_at", "id");

-- CreateIndex
CREATE INDEX "SecurityAlert_review_status_created_at_id_idx" ON "SecurityAlert"("review_status", "created_at", "id");

-- CreateIndex
CREATE INDEX "SecurityAlert_final_severity_created_at_id_idx" ON "SecurityAlert"("final_severity", "created_at", "id");

-- CreateIndex
CREATE INDEX "SecurityAlert_rule_id_rule_version_created_at_id_idx" ON "SecurityAlert"("rule_id", "rule_version", "created_at", "id");

-- CreateIndex
CREATE INDEX "SecurityAlert_result_classification_created_at_id_idx" ON "SecurityAlert"("result_classification", "created_at", "id");

-- CreateIndex
CREATE INDEX "SecurityAlert_correlation_subject_hash_window_bucket_start_idx" ON "SecurityAlert"("correlation_subject_hash", "window_bucket_start");

-- CreateIndex
CREATE INDEX "SecurityAlert_lifecycle_type_final_severity_idx" ON "SecurityAlert"("lifecycle_type", "final_severity");

-- CreateIndex
CREATE INDEX "SecurityAlert_primary_event_id_idx" ON "SecurityAlert"("primary_event_id");

-- CreateIndex
CREATE INDEX "SecurityAlert_created_at_id_idx" ON "SecurityAlert"("created_at", "id");

-- CreateIndex
CREATE INDEX "SecurityAlertEvidence_event_id_idx" ON "SecurityAlertEvidence"("event_id");

-- CreateIndex
CREATE INDEX "RuleEvaluationLog_candidate_event_id_idx" ON "RuleEvaluationLog"("candidate_event_id");

-- CreateIndex
CREATE INDEX "RuleEvaluationLog_rule_id_evaluation_timestamp_idx" ON "RuleEvaluationLog"("rule_id", "evaluation_timestamp");

-- CreateIndex
CREATE INDEX "RuleEvaluationLog_evaluation_timestamp_id_idx" ON "RuleEvaluationLog"("evaluation_timestamp", "id");

-- CreateIndex
CREATE UNIQUE INDEX "RuleEvaluationLog_evaluation_identity_key_attempt_number_key" ON "RuleEvaluationLog"("evaluation_identity_key", "attempt_number");

-- CreateIndex
CREATE UNIQUE INDEX "DetectionEvaluationCheckpoint_rule_id_rule_version_environm_key" ON "DetectionEvaluationCheckpoint"("rule_id", "rule_version", "environment", "lifecycle_type");

-- CreateIndex
CREATE UNIQUE INDEX "IncidentCase_case_reference_key" ON "IncidentCase"("case_reference");

-- CreateIndex
CREATE INDEX "IncidentCaseHistory_incident_case_id_occurred_at_id_idx" ON "IncidentCaseHistory"("incident_case_id", "occurred_at", "id");

-- CreateIndex
CREATE UNIQUE INDEX "IncidentCaseHistory_incident_case_id_idempotency_key_key" ON "IncidentCaseHistory"("incident_case_id", "idempotency_key");

-- CreateIndex
CREATE INDEX "IncidentCaseNote_incident_case_id_created_at_id_idx" ON "IncidentCaseNote"("incident_case_id", "created_at", "id");

-- CreateIndex
CREATE UNIQUE INDEX "IncidentCaseNote_incident_case_id_idempotency_key_key" ON "IncidentCaseNote"("incident_case_id", "idempotency_key");

-- CreateIndex
CREATE INDEX "IncidentCaseEvidence_incident_case_id_collected_at_id_idx" ON "IncidentCaseEvidence"("incident_case_id", "collected_at", "id");

-- CreateIndex
CREATE UNIQUE INDEX "IncidentCaseEvidence_incident_case_id_idempotency_key_key" ON "IncidentCaseEvidence"("incident_case_id", "idempotency_key");

-- CreateIndex
CREATE INDEX "SecurityResponsePlaybook_status_idx" ON "SecurityResponsePlaybook"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityResponsePlaybook_playbook_id_version_key" ON "SecurityResponsePlaybook"("playbook_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityResponseStep_playbook_id_playbook_version_step_orde_key" ON "SecurityResponseStep"("playbook_id", "playbook_version", "step_order");

-- CreateIndex
CREATE UNIQUE INDEX "IncidentCasePlaybookLink_incident_case_id_playbook_id_playb_key" ON "IncidentCasePlaybookLink"("incident_case_id", "playbook_id", "playbook_version");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityResponseApprovalRequest_idempotency_key_key" ON "SecurityResponseApprovalRequest"("idempotency_key");

-- CreateIndex
CREATE INDEX "SecurityResponseApprovalRequest_incident_case_id_idx" ON "SecurityResponseApprovalRequest"("incident_case_id");

-- CreateIndex
CREATE INDEX "SecurityResponseApprovalRequest_status_idx" ON "SecurityResponseApprovalRequest"("status");

-- CreateIndex
CREATE INDEX "SecurityResponseApprovalDecision_request_id_occurred_at_idx" ON "SecurityResponseApprovalDecision"("request_id", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityResponseApprovalDecision_request_id_idempotency_key_key" ON "SecurityResponseApprovalDecision"("request_id", "idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityResponseApprovalGrant_request_id_key" ON "SecurityResponseApprovalGrant"("request_id");

-- CreateIndex
CREATE INDEX "SecurityResponseApprovalGrant_incident_case_id_idx" ON "SecurityResponseApprovalGrant"("incident_case_id");

-- CreateIndex
CREATE INDEX "SecurityResponseApprovalGrant_grant_state_expires_at_idx" ON "SecurityResponseApprovalGrant"("grant_state", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityResponseExecution_approval_grant_id_key" ON "SecurityResponseExecution"("approval_grant_id");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityResponseExecution_idempotency_key_key" ON "SecurityResponseExecution"("idempotency_key");

-- CreateIndex
CREATE INDEX "SecurityResponseExecution_incident_case_id_idx" ON "SecurityResponseExecution"("incident_case_id");

-- CreateIndex
CREATE INDEX "SecurityResponseExecution_status_idx" ON "SecurityResponseExecution"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityResponseAction_execution_id_sequence_key" ON "SecurityResponseAction"("execution_id", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "BehavioralRiskAssessment_fingerprint_key" ON "BehavioralRiskAssessment"("fingerprint");

-- CreateIndex
CREATE INDEX "BehavioralRiskAssessment_subject_reference_environment_life_idx" ON "BehavioralRiskAssessment"("subject_reference", "environment", "lifecycle");

-- CreateIndex
CREATE INDEX "BehavioralRiskAssessment_environment_lifecycle_idx" ON "BehavioralRiskAssessment"("environment", "lifecycle");

-- CreateIndex
CREATE INDEX "BehavioralRiskAssessment_generated_time_idx" ON "BehavioralRiskAssessment"("generated_time");

-- CreateIndex
CREATE INDEX "BehavioralRiskAssessment_policy_version_idx" ON "BehavioralRiskAssessment"("policy_version");

-- CreateIndex
CREATE UNIQUE INDEX "BehavioralRiskSignal_assessment_id_signal_code_key" ON "BehavioralRiskSignal"("assessment_id", "signal_code");

-- CreateIndex
CREATE INDEX "BehavioralRiskEvidenceLink_security_event_id_idx" ON "BehavioralRiskEvidenceLink"("security_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityEventGeoEnrichment_security_event_id_key" ON "SecurityEventGeoEnrichment"("security_event_id");

-- CreateIndex
CREATE INDEX "SecurityEventGeoEnrichment_status_idx" ON "SecurityEventGeoEnrichment"("status");

-- CreateIndex
CREATE INDEX "SecurityEventGeoEnrichment_country_code_idx" ON "SecurityEventGeoEnrichment"("country_code");

-- CreateIndex
CREATE INDEX "SecurityEventGeoEnrichment_ip_fingerprint_idx" ON "SecurityEventGeoEnrichment"("ip_fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "ProhibitedItemPolicy_policyCode_key" ON "ProhibitedItemPolicy"("policyCode");

-- CreateIndex
CREATE UNIQUE INDEX "ProhibitedItemPolicy_slug_key" ON "ProhibitedItemPolicy"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ListingEnforcementCase_caseNumber_key" ON "ListingEnforcementCase"("caseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DataSubjectRequest_reference_number_key" ON "DataSubjectRequest"("reference_number");

-- CreateIndex
CREATE UNIQUE INDEX "InsurancePartner_adapter_key_key" ON "InsurancePartner"("adapter_key");

-- CreateIndex
CREATE INDEX "InsurancePartner_status_is_enabled_idx" ON "InsurancePartner"("status", "is_enabled");

-- CreateIndex
CREATE INDEX "InsuranceProduct_status_idx" ON "InsuranceProduct"("status");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceProduct_partner_id_product_code_key" ON "InsuranceProduct"("partner_id", "product_code");

-- CreateIndex
CREATE INDEX "InsuranceOffer_booking_id_status_idx" ON "InsuranceOffer"("booking_id", "status");

-- CreateIndex
CREATE INDEX "InsuranceOffer_expires_at_idx" ON "InsuranceOffer"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceOffer_partner_id_external_offer_id_key" ON "InsuranceOffer"("partner_id", "external_offer_id");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceSelection_booking_id_key" ON "InsuranceSelection"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceSelection_idempotency_key_key" ON "InsuranceSelection"("idempotency_key");

-- CreateIndex
CREATE INDEX "InsuranceSelection_user_id_created_at_idx" ON "InsuranceSelection"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "InsuranceSelection_status_offer_expires_at_idx" ON "InsuranceSelection"("status", "offer_expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceOrder_selection_id_key" ON "InsuranceOrder"("selection_id");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceOrder_booking_id_key" ON "InsuranceOrder"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceOrder_idempotency_key_key" ON "InsuranceOrder"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceOrder_issuance_idempotency_key_key" ON "InsuranceOrder"("issuance_idempotency_key");

-- CreateIndex
CREATE INDEX "InsuranceOrder_user_id_status_idx" ON "InsuranceOrder"("user_id", "status");

-- CreateIndex
CREATE INDEX "InsuranceOrder_status_updated_at_idx" ON "InsuranceOrder"("status", "updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "InsurancePolicy_booking_id_key" ON "InsurancePolicy"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "InsurancePolicy_insurance_order_id_key" ON "InsurancePolicy"("insurance_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "InsurancePolicy_idempotency_key_key" ON "InsurancePolicy"("idempotency_key");

-- CreateIndex
CREATE INDEX "InsurancePolicy_status_coverage_end_idx" ON "InsurancePolicy"("status", "coverage_end");

-- CreateIndex
CREATE UNIQUE INDEX "InsurancePolicy_partner_id_external_policy_id_key" ON "InsurancePolicy"("partner_id", "external_policy_id");

-- CreateIndex
CREATE INDEX "InsuranceReconciliationLog_partner_id_idx" ON "InsuranceReconciliationLog"("partner_id");

-- CreateIndex
CREATE INDEX "InsuranceReconciliationLog_batch_reference_idx" ON "InsuranceReconciliationLog"("batch_reference");

-- CreateIndex
CREATE INDEX "InsuranceReconciliationLog_classification_idx" ON "InsuranceReconciliationLog"("classification");

-- CreateIndex
CREATE INDEX "InsuranceFinanceException_status_idx" ON "InsuranceFinanceException"("status");

-- CreateIndex
CREATE INDEX "InsuranceFinanceException_exception_type_idx" ON "InsuranceFinanceException"("exception_type");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceClaim_idempotency_key_key" ON "InsuranceClaim"("idempotency_key");

-- CreateIndex
CREATE INDEX "InsuranceClaim_status_submitted_at_idx" ON "InsuranceClaim"("status", "submitted_at");

-- CreateIndex
CREATE INDEX "InsuranceClaim_claimant_user_id_idx" ON "InsuranceClaim"("claimant_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceClaim_policy_id_external_claim_id_key" ON "InsuranceClaim"("policy_id", "external_claim_id");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceClaimEvidence_idempotency_key_key" ON "InsuranceClaimEvidence"("idempotency_key");

-- CreateIndex
CREATE INDEX "InsuranceClaimEvidence_claim_id_idx" ON "InsuranceClaimEvidence"("claim_id");

-- CreateIndex
CREATE INDEX "InsuranceWebhookEvent_processing_status_received_at_idx" ON "InsuranceWebhookEvent"("processing_status", "received_at");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceWebhookEvent_partner_id_external_event_id_key" ON "InsuranceWebhookEvent"("partner_id", "external_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "PrivacyPolicyVersion_version_key" ON "PrivacyPolicyVersion"("version");

-- CreateIndex
CREATE UNIQUE INDEX "AiServiceSession_nonce_key" ON "AiServiceSession"("nonce");

-- CreateIndex
CREATE INDEX "AiServiceSession_userId_status_lastActiveAt_idx" ON "AiServiceSession"("userId", "status", "lastActiveAt");

-- CreateIndex
CREATE INDEX "AiServiceSession_userId_startedAt_idx" ON "AiServiceSession"("userId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AiConversation_continuityKey_key" ON "AiConversation"("continuityKey");

-- CreateIndex
CREATE INDEX "AiConversation_userId_updatedAt_idx" ON "AiConversation"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AiSupportCase_caseNumber_key" ON "AiSupportCase"("caseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AiSupportCase_activeIssueKey_key" ON "AiSupportCase"("activeIssueKey");

-- CreateIndex
CREATE INDEX "AiSupportCase_userId_status_lastActivityAt_idx" ON "AiSupportCase"("userId", "status", "lastActivityAt");

-- CreateIndex
CREATE INDEX "AiCaseEntityLink_caseId_idx" ON "AiCaseEntityLink"("caseId");

-- CreateIndex
CREATE INDEX "AiCaseEntityLink_entityType_entityId_idx" ON "AiCaseEntityLink"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "AiToolExecution_idempotencyKey_key" ON "AiToolExecution"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "AiMediationRequest_idempotencyKey_key" ON "AiMediationRequest"("idempotencyKey");

-- CreateIndex
CREATE INDEX "AiMediationRequest_caseId_idx" ON "AiMediationRequest"("caseId");

-- CreateIndex
CREATE INDEX "AiMediationRequest_bookingId_idx" ON "AiMediationRequest"("bookingId");

-- CreateIndex
CREATE INDEX "AiMediationRequest_providerId_status_idx" ON "AiMediationRequest"("providerId", "status");

-- CreateIndex
CREATE INDEX "AiMediationRequest_requestingUserId_status_idx" ON "AiMediationRequest"("requestingUserId", "status");

-- CreateIndex
CREATE INDEX "AiMediationRequest_expiresAt_idx" ON "AiMediationRequest"("expiresAt");

-- CreateIndex
CREATE INDEX "AiMediationRequest_status_idx" ON "AiMediationRequest"("status");

-- CreateIndex
CREATE INDEX "AiPolicyDecision_policyType_policyVersion_inputHash_idx" ON "AiPolicyDecision"("policyType", "policyVersion", "inputHash");

-- CreateIndex
CREATE UNIQUE INDEX "AiFollowUp_sourceEventKey_key" ON "AiFollowUp"("sourceEventKey");

-- CreateIndex
CREATE UNIQUE INDEX "AiFollowUp_deduplicationKey_key" ON "AiFollowUp"("deduplicationKey");

-- CreateIndex
CREATE UNIQUE INDEX "AiFollowUp_notificationId_key" ON "AiFollowUp"("notificationId");

-- CreateIndex
CREATE INDEX "AiFollowUp_caseId_idx" ON "AiFollowUp"("caseId");

-- CreateIndex
CREATE INDEX "AiFollowUp_status_triggerAt_idx" ON "AiFollowUp"("status", "triggerAt");

-- CreateIndex
CREATE INDEX "AiFollowUp_proactive_cooldown_idx" ON "AiFollowUp"("userId", "eventType", "relatedEntityType", "relatedEntityId", "cooldownUntil");

-- CreateIndex
CREATE INDEX "AiInteractionFeedback_createdAt_rating_idx" ON "AiInteractionFeedback"("createdAt", "rating");

-- CreateIndex
CREATE INDEX "AiInteractionFeedback_conversationId_createdAt_idx" ON "AiInteractionFeedback"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "AiInteractionFeedback_caseId_idx" ON "AiInteractionFeedback"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "AiInteractionFeedback_userId_messageId_key" ON "AiInteractionFeedback"("userId", "messageId");

-- CreateIndex
CREATE UNIQUE INDEX "AiInteractionEvent_idempotencyKey_key" ON "AiInteractionEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "AiInteractionEvent_eventType_createdAt_idx" ON "AiInteractionEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "AiInteractionEvent_interactionSource_createdAt_idx" ON "AiInteractionEvent"("interactionSource", "createdAt");

-- CreateIndex
CREATE INDEX "AiInteractionEvent_suggestionId_createdAt_idx" ON "AiInteractionEvent"("suggestionId", "createdAt");

-- CreateIndex
CREATE INDEX "AiInteractionEvent_caseId_createdAt_idx" ON "AiInteractionEvent"("caseId", "createdAt");

-- CreateIndex
CREATE INDEX "AiInteractionEvent_messageId_idx" ON "AiInteractionEvent"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "AiKnowledgeSource_slug_key" ON "AiKnowledgeSource"("slug");

-- CreateIndex
CREATE INDEX "AiKnowledgeSource_status_approvalStatus_effectiveFrom_effec_idx" ON "AiKnowledgeSource"("status", "approvalStatus", "effectiveFrom", "effectiveUntil");

-- CreateIndex
CREATE INDEX "AiKnowledgeSource_module_topic_idx" ON "AiKnowledgeSource"("module", "topic");

-- CreateIndex
CREATE INDEX "AiKnowledgeSource_visibility_idx" ON "AiKnowledgeSource"("visibility");

-- CreateIndex
CREATE INDEX "AiKnowledgeSource_contentHash_idx" ON "AiKnowledgeSource"("contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "AiKnowledgeSource_sourceKey_version_key" ON "AiKnowledgeSource"("sourceKey", "version");

-- CreateIndex
CREATE INDEX "AiKnowledgeChunk_knowledgeSourceId_ordinal_idx" ON "AiKnowledgeChunk"("knowledgeSourceId", "ordinal");

-- CreateIndex
CREATE INDEX "AiKnowledgeChunk_contentHash_idx" ON "AiKnowledgeChunk"("contentHash");

-- CreateIndex
CREATE INDEX "AiKnowledgeChunk_visibility_idx" ON "AiKnowledgeChunk"("visibility");

-- CreateIndex
CREATE UNIQUE INDEX "AiKnowledgeChunk_knowledgeSourceId_chunkKey_key" ON "AiKnowledgeChunk"("knowledgeSourceId", "chunkKey");

-- CreateIndex
CREATE UNIQUE INDEX "AiProviderSession_providerSessionRef_key" ON "AiProviderSession"("providerSessionRef");

-- CreateIndex
CREATE UNIQUE INDEX "SocialMetric_deduplication_key_key" ON "SocialMetric"("deduplication_key");

-- CreateIndex
CREATE INDEX "SocialMetric_provider_social_account_id_idx" ON "SocialMetric"("provider", "social_account_id");

-- CreateIndex
CREATE INDEX "SocialMetric_metric_type_measurement_timestamp_idx" ON "SocialMetric"("metric_type", "measurement_timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "SocialAttribution_attribution_token_key" ON "SocialAttribution"("attribution_token");

-- CreateIndex
CREATE INDEX "SocialAttribution_source_channel_occurred_at_idx" ON "SocialAttribution"("source_channel", "occurred_at");

-- CreateIndex
CREATE INDEX "SocialAttribution_attribution_token_idx" ON "SocialAttribution"("attribution_token");

-- CreateIndex
CREATE UNIQUE INDEX "SocialProviderEvent_idempotency_key_key" ON "SocialProviderEvent"("idempotency_key");

-- CreateIndex
CREATE INDEX "SocialProviderEvent_provider_processing_state_received_at_idx" ON "SocialProviderEvent"("provider", "processing_state", "received_at");

-- CreateIndex
CREATE INDEX "SocialProviderEvent_idempotency_key_idx" ON "SocialProviderEvent"("idempotency_key");

-- CreateIndex
CREATE INDEX "SocialFeedback_status_severity_idx" ON "SocialFeedback"("status", "severity");

-- CreateIndex
CREATE UNIQUE INDEX "SocialFeedback_provider_social_account_id_provider_feedback_key" ON "SocialFeedback"("provider", "social_account_id", "provider_feedback_id");

-- CreateIndex
CREATE INDEX "SemanticLearningCandidate_status_idx" ON "SemanticLearningCandidate"("status");

-- CreateIndex
CREATE INDEX "SemanticLearningCandidate_canonicalCandidateId_idx" ON "SemanticLearningCandidate"("canonicalCandidateId");

-- CreateIndex
CREATE UNIQUE INDEX "SemanticLearningCandidate_normalizedPhrase_canonicalCandida_key" ON "SemanticLearningCandidate"("normalizedPhrase", "canonicalCandidateId", "domain", "semanticType");

-- CreateIndex
CREATE UNIQUE INDEX "CanonicalQuestionIntent_intentKey_key" ON "CanonicalQuestionIntent"("intentKey");

-- CreateIndex
CREATE UNIQUE INDEX "CanonicalQuestionIntent_normalizedQuestion_key" ON "CanonicalQuestionIntent"("normalizedQuestion");

-- CreateIndex
CREATE INDEX "CanonicalQuestionIntent_domain_feature_idx" ON "CanonicalQuestionIntent"("domain", "feature");

-- CreateIndex
CREATE INDEX "CanonicalQuestionIntent_status_idx" ON "CanonicalQuestionIntent"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CanonicalQuestionAlias_normalizedAliasText_key" ON "CanonicalQuestionAlias"("normalizedAliasText");

-- CreateIndex
CREATE INDEX "CanonicalQuestionAlias_canonicalIntentId_idx" ON "CanonicalQuestionAlias"("canonicalIntentId");

-- CreateIndex
CREATE INDEX "CanonicalQuestionAlias_status_idx" ON "CanonicalQuestionAlias"("status");

-- CreateIndex
CREATE INDEX "CanonicalIntentAccessScope_canonicalIntentId_idx" ON "CanonicalIntentAccessScope"("canonicalIntentId");

-- CreateIndex
CREATE INDEX "CanonicalIntentAccessScope_audience_role_idx" ON "CanonicalIntentAccessScope"("audience", "role");

-- CreateIndex
CREATE INDEX "CanonicalIntentAccessScope_answerClass_idx" ON "CanonicalIntentAccessScope"("answerClass");

-- CreateIndex
CREATE INDEX "CanonicalIntentAccessScope_authorityType_idx" ON "CanonicalIntentAccessScope"("authorityType");

-- CreateIndex
CREATE INDEX "CanonicalIntentAccessScope_status_idx" ON "CanonicalIntentAccessScope"("status");

-- AddForeignKey
ALTER TABLE "UserMfa" ADD CONSTRAINT "UserMfa_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MfaSessionAssurance" ADD CONSTRAINT "MfaSessionAssurance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCredential" ADD CONSTRAINT "EmailCredential_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthProviderIdentity" ADD CONSTRAINT "AuthProviderIdentity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhoneIdentity" ADD CONSTRAINT "PhoneIdentity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthConsentReceipt" ADD CONSTRAINT "AuthConsentReceipt_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthIdentityEvent" ADD CONSTRAINT "AuthIdentityEvent_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PsgcSubdivision" ADD CONSTRAINT "PsgcSubdivision_parentPsgcCode_fkey" FOREIGN KEY ("parentPsgcCode") REFERENCES "PsgcSubdivision"("psgcCode") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_global_address_id_fkey" FOREIGN KEY ("global_address_id") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessProfile" ADD CONSTRAINT "BusinessProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessProfile" ADD CONSTRAINT "BusinessProfile_global_business_address_id_fkey" FOREIGN KEY ("global_business_address_id") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationDocument" ADD CONSTRAINT "VerificationDocument_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryRequirement" ADD CONSTRAINT "CategoryRequirement_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingPhoto" ADD CONSTRAINT "ListingPhoto_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingDocument" ADD CONSTRAINT "ListingDocument_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingImportJob" ADD CONSTRAINT "ListingImportJob_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingImportJob" ADD CONSTRAINT "ListingImportJob_created_listing_id_fkey" FOREIGN KEY ("created_listing_id") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingImportSource" ADD CONSTRAINT "ListingImportSource_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "ListingImportJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingImportField" ADD CONSTRAINT "ListingImportField_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "ListingImportJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingImportField" ADD CONSTRAINT "ListingImportField_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "ListingImportSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingImportAsset" ADD CONSTRAINT "ListingImportAsset_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "ListingImportJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingImportResolution" ADD CONSTRAINT "ListingImportResolution_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "ListingImportJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingImportResolution" ADD CONSTRAINT "ListingImportResolution_resolved_by_user_id_fkey" FOREIGN KEY ("resolved_by_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingImportAuditEvent" ADD CONSTRAINT "ListingImportAuditEvent_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "ListingImportJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingImportAuditEvent" ADD CONSTRAINT "ListingImportAuditEvent_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingImportAuditEvent" ADD CONSTRAINT "ListingImportAuditEvent_audit_log_id_fkey" FOREIGN KEY ("audit_log_id") REFERENCES "AuditLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_renter_id_fkey" FOREIGN KEY ("renter_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingStatusHistory" ADD CONSTRAINT "BookingStatusHistory_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_gateway_transaction_id_fkey" FOREIGN KEY ("gateway_transaction_id") REFERENCES "GatewayTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GatewayTransaction" ADD CONSTRAINT "GatewayTransaction_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReconciliationLog" ADD CONSTRAINT "PaymentReconciliationLog_gateway_transaction_id_fkey" FOREIGN KEY ("gateway_transaction_id") REFERENCES "GatewayTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentActionLog" ADD CONSTRAINT "PaymentActionLog_gateway_transaction_id_fkey" FOREIGN KEY ("gateway_transaction_id") REFERENCES "GatewayTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentActionLog" ADD CONSTRAINT "PaymentActionLog_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentActionLog" ADD CONSTRAINT "PaymentActionLog_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceLedger" ADD CONSTRAINT "FinanceLedger_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceLedger" ADD CONSTRAINT "FinanceLedger_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceLedger" ADD CONSTRAINT "FinanceLedger_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "InsurancePolicy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalAgreement" ADD CONSTRAINT "RentalAgreement_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionReport" ADD CONSTRAINT "InspectionReport_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionReport" ADD CONSTRAINT "InspectionReport_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionPhoto" ADD CONSTRAINT "InspectionPhoto_inspection_report_id_fkey" FOREIGN KEY ("inspection_report_id") REFERENCES "InspectionReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurnoverRecord" ADD CONSTRAINT "TurnoverRecord_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DamageClaim" ADD CONSTRAINT "DamageClaim_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DamageClaimPhoto" ADD CONSTRAINT "DamageClaimPhoto_damage_claim_id_fkey" FOREIGN KEY ("damage_claim_id") REFERENCES "DamageClaim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeCase" ADD CONSTRAINT "DisputeCase_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeCase" ADD CONSTRAINT "DisputeCase_damage_claim_id_fkey" FOREIGN KEY ("damage_claim_id") REFERENCES "DamageClaim"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositAction" ADD CONSTRAINT "DepositAction_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiSecurityLog" ADD CONSTRAINT "ApiSecurityLog_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIBotLog" ADD CONSTRAINT "AIBotLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingCampaign" ADD CONSTRAINT "MarketingCampaign_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignListingLink" ADD CONSTRAINT "CampaignListingLink_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "MarketingCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignListingLink" ADD CONSTRAINT "CampaignListingLink_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignTargetAccount" ADD CONSTRAINT "CampaignTargetAccount_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "MarketingCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignTargetAccount" ADD CONSTRAINT "CampaignTargetAccount_target_account_id_fkey" FOREIGN KEY ("target_account_id") REFERENCES "SocialAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingPost" ADD CONSTRAINT "MarketingPost_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "MarketingCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingPost" ADD CONSTRAINT "MarketingPost_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingPost" ADD CONSTRAINT "MarketingPost_target_account_id_fkey" FOREIGN KEY ("target_account_id") REFERENCES "SocialAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingPost" ADD CONSTRAINT "MarketingPost_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingPost" ADD CONSTRAINT "MarketingPost_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignApproval" ADD CONSTRAINT "CampaignApproval_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "MarketingCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignApproval" ADD CONSTRAINT "CampaignApproval_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "MarketingPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionAsset" ADD CONSTRAINT "PromotionAsset_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "MarketingCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionAsset" ADD CONSTRAINT "PromotionAsset_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "MarketingPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UTMLink" ADD CONSTRAINT "UTMLink_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "MarketingCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UTMLink" ADD CONSTRAINT "UTMLink_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "MarketingPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignAnalytics" ADD CONSTRAINT "CampaignAnalytics_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "MarketingCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignAnalytics" ADD CONSTRAINT "CampaignAnalytics_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "MarketingPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderPromotionOptIn" ADD CONSTRAINT "ProviderPromotionOptIn_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderPromotionOptIn" ADD CONSTRAINT "ProviderPromotionOptIn_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPostQueue" ADD CONSTRAINT "SocialPostQueue_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "MarketingPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPostQueue" ADD CONSTRAINT "SocialPostQueue_approved_version_id_fkey" FOREIGN KEY ("approved_version_id") REFERENCES "MarketingPostVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPostQueue" ADD CONSTRAINT "SocialPostQueue_target_account_id_fkey" FOREIGN KEY ("target_account_id") REFERENCES "SocialAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPostQueue" ADD CONSTRAINT "SocialPostQueue_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPublicationAttempt" ADD CONSTRAINT "SocialPublicationAttempt_queue_id_fkey" FOREIGN KEY ("queue_id") REFERENCES "SocialPostQueue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPublicationAttempt" ADD CONSTRAINT "SocialPublicationAttempt_post_version_id_fkey" FOREIGN KEY ("post_version_id") REFERENCES "MarketingPostVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPublicationAttempt" ADD CONSTRAINT "SocialPublicationAttempt_social_account_id_fkey" FOREIGN KEY ("social_account_id") REFERENCES "SocialAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountDeletionRequest" ADD CONSTRAINT "AccountDeletionRequest_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundRequest" ADD CONSTRAINT "RefundRequest_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderPayout" ADD CONSTRAINT "ProviderPayout_payout_batch_id_fkey" FOREIGN KEY ("payout_batch_id") REFERENCES "PayoutBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderPayout" ADD CONSTRAINT "ProviderPayout_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityEventIngestionFailure" ADD CONSTRAINT "SecurityEventIngestionFailure_resolved_event_id_fkey" FOREIGN KEY ("resolved_event_id") REFERENCES "SecurityEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityAlert" ADD CONSTRAINT "SecurityAlert_rule_id_rule_version_fkey" FOREIGN KEY ("rule_id", "rule_version") REFERENCES "DetectionRule"("rule_id", "version") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityAlert" ADD CONSTRAINT "SecurityAlert_primary_event_id_fkey" FOREIGN KEY ("primary_event_id") REFERENCES "SecurityEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityAlertEvidence" ADD CONSTRAINT "SecurityAlertEvidence_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "SecurityAlert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityAlertEvidence" ADD CONSTRAINT "SecurityAlertEvidence_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "SecurityEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleEvaluationLog" ADD CONSTRAINT "RuleEvaluationLog_rule_id_rule_version_fkey" FOREIGN KEY ("rule_id", "rule_version") REFERENCES "DetectionRule"("rule_id", "version") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleEvaluationLog" ADD CONSTRAINT "RuleEvaluationLog_candidate_event_id_fkey" FOREIGN KEY ("candidate_event_id") REFERENCES "SecurityEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetectionEvaluationCheckpoint" ADD CONSTRAINT "DetectionEvaluationCheckpoint_rule_id_rule_version_fkey" FOREIGN KEY ("rule_id", "rule_version") REFERENCES "DetectionRule"("rule_id", "version") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentCase" ADD CONSTRAINT "IncidentCase_assigned_user_id_fkey" FOREIGN KEY ("assigned_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentCase" ADD CONSTRAINT "IncidentCase_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentCase" ADD CONSTRAINT "IncidentCase_originating_security_event_id_fkey" FOREIGN KEY ("originating_security_event_id") REFERENCES "SecurityEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentCaseHistory" ADD CONSTRAINT "IncidentCaseHistory_incident_case_id_fkey" FOREIGN KEY ("incident_case_id") REFERENCES "IncidentCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentCaseHistory" ADD CONSTRAINT "IncidentCaseHistory_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentCaseHistory" ADD CONSTRAINT "IncidentCaseHistory_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentCaseNote" ADD CONSTRAINT "IncidentCaseNote_incident_case_id_fkey" FOREIGN KEY ("incident_case_id") REFERENCES "IncidentCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentCaseNote" ADD CONSTRAINT "IncidentCaseNote_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentCaseEvidence" ADD CONSTRAINT "IncidentCaseEvidence_incident_case_id_fkey" FOREIGN KEY ("incident_case_id") REFERENCES "IncidentCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentCaseEvidence" ADD CONSTRAINT "IncidentCaseEvidence_added_by_user_id_fkey" FOREIGN KEY ("added_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityResponsePlaybook" ADD CONSTRAINT "SecurityResponsePlaybook_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityResponsePlaybook" ADD CONSTRAINT "SecurityResponsePlaybook_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityResponseStep" ADD CONSTRAINT "SecurityResponseStep_playbook_id_playbook_version_fkey" FOREIGN KEY ("playbook_id", "playbook_version") REFERENCES "SecurityResponsePlaybook"("playbook_id", "version") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentCasePlaybookLink" ADD CONSTRAINT "IncidentCasePlaybookLink_incident_case_id_fkey" FOREIGN KEY ("incident_case_id") REFERENCES "IncidentCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentCasePlaybookLink" ADD CONSTRAINT "IncidentCasePlaybookLink_playbook_id_playbook_version_fkey" FOREIGN KEY ("playbook_id", "playbook_version") REFERENCES "SecurityResponsePlaybook"("playbook_id", "version") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentCasePlaybookLink" ADD CONSTRAINT "IncidentCasePlaybookLink_linked_by_id_fkey" FOREIGN KEY ("linked_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityResponseApprovalRequest" ADD CONSTRAINT "SecurityResponseApprovalRequest_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityResponseApprovalRequest" ADD CONSTRAINT "SecurityResponseApprovalRequest_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityResponseApprovalRequest" ADD CONSTRAINT "SecurityResponseApprovalRequest_incident_case_id_fkey" FOREIGN KEY ("incident_case_id") REFERENCES "IncidentCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityResponseApprovalRequest" ADD CONSTRAINT "SecurityResponseApprovalRequest_playbook_id_playbook_versi_fkey" FOREIGN KEY ("playbook_id", "playbook_version") REFERENCES "SecurityResponsePlaybook"("playbook_id", "version") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityResponseApprovalDecision" ADD CONSTRAINT "SecurityResponseApprovalDecision_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "SecurityResponseApprovalRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityResponseApprovalDecision" ADD CONSTRAINT "SecurityResponseApprovalDecision_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityResponseApprovalGrant" ADD CONSTRAINT "SecurityResponseApprovalGrant_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "SecurityResponseApprovalRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityResponseApprovalGrant" ADD CONSTRAINT "SecurityResponseApprovalGrant_incident_case_id_fkey" FOREIGN KEY ("incident_case_id") REFERENCES "IncidentCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityResponseApprovalGrant" ADD CONSTRAINT "SecurityResponseApprovalGrant_revoked_by_id_fkey" FOREIGN KEY ("revoked_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityResponseExecution" ADD CONSTRAINT "SecurityResponseExecution_incident_case_id_fkey" FOREIGN KEY ("incident_case_id") REFERENCES "IncidentCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityResponseExecution" ADD CONSTRAINT "SecurityResponseExecution_playbook_id_playbook_version_fkey" FOREIGN KEY ("playbook_id", "playbook_version") REFERENCES "SecurityResponsePlaybook"("playbook_id", "version") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityResponseExecution" ADD CONSTRAINT "SecurityResponseExecution_approval_grant_id_fkey" FOREIGN KEY ("approval_grant_id") REFERENCES "SecurityResponseApprovalGrant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityResponseExecution" ADD CONSTRAINT "SecurityResponseExecution_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityResponseExecution" ADD CONSTRAINT "SecurityResponseExecution_executed_by_id_fkey" FOREIGN KEY ("executed_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityResponseAction" ADD CONSTRAINT "SecurityResponseAction_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "SecurityResponseExecution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehavioralRiskSignal" ADD CONSTRAINT "BehavioralRiskSignal_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "BehavioralRiskAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehavioralRiskEvidenceLink" ADD CONSTRAINT "BehavioralRiskEvidenceLink_signal_id_fkey" FOREIGN KEY ("signal_id") REFERENCES "BehavioralRiskSignal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehavioralRiskEvidenceLink" ADD CONSTRAINT "BehavioralRiskEvidenceLink_security_event_id_fkey" FOREIGN KEY ("security_event_id") REFERENCES "SecurityEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityEventGeoEnrichment" ADD CONSTRAINT "SecurityEventGeoEnrichment_security_event_id_fkey" FOREIGN KEY ("security_event_id") REFERENCES "SecurityEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingPolicyEvaluation" ADD CONSTRAINT "ListingPolicyEvaluation_matchedPolicyId_fkey" FOREIGN KEY ("matchedPolicyId") REFERENCES "ProhibitedItemPolicy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingEnforcementCase" ADD CONSTRAINT "ListingEnforcementCase_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "ListingPolicyEvaluation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingEnforcementCase" ADD CONSTRAINT "ListingEnforcementCase_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "ProhibitedItemPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingPolicyAppeal" ADD CONSTRAINT "ListingPolicyAppeal_enforcementCaseId_fkey" FOREIGN KEY ("enforcementCaseId") REFERENCES "ListingEnforcementCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyChangeRecord" ADD CONSTRAINT "PolicyChangeRecord_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "ProhibitedItemPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CookieConsentReceipt" ADD CONSTRAINT "CookieConsentReceipt_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataSubjectRequest" ADD CONSTRAINT "DataSubjectRequest_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataSubjectRequest" ADD CONSTRAINT "DataSubjectRequest_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceProduct" ADD CONSTRAINT "InsuranceProduct_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "InsurancePartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceOffer" ADD CONSTRAINT "InsuranceOffer_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "InsurancePartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceOffer" ADD CONSTRAINT "InsuranceOffer_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "InsuranceProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceOffer" ADD CONSTRAINT "InsuranceOffer_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceSelection" ADD CONSTRAINT "InsuranceSelection_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceSelection" ADD CONSTRAINT "InsuranceSelection_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceOrder" ADD CONSTRAINT "InsuranceOrder_selection_id_fkey" FOREIGN KEY ("selection_id") REFERENCES "InsuranceSelection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceOrder" ADD CONSTRAINT "InsuranceOrder_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceOrder" ADD CONSTRAINT "InsuranceOrder_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsurancePolicy" ADD CONSTRAINT "InsurancePolicy_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "InsurancePartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsurancePolicy" ADD CONSTRAINT "InsurancePolicy_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "InsuranceProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsurancePolicy" ADD CONSTRAINT "InsurancePolicy_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsurancePolicy" ADD CONSTRAINT "InsurancePolicy_insurance_order_id_fkey" FOREIGN KEY ("insurance_order_id") REFERENCES "InsuranceOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceReconciliationLog" ADD CONSTRAINT "InsuranceReconciliationLog_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "InsurancePartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceReconciliationLog" ADD CONSTRAINT "InsuranceReconciliationLog_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "InsurancePolicy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceFinanceException" ADD CONSTRAINT "InsuranceFinanceException_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "InsurancePolicy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceClaim" ADD CONSTRAINT "InsuranceClaim_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "InsurancePolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceClaimEvidence" ADD CONSTRAINT "InsuranceClaimEvidence_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "InsuranceClaim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceWebhookEvent" ADD CONSTRAINT "InsuranceWebhookEvent_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "InsurancePartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivacyPolicyVersion" ADD CONSTRAINT "PrivacyPolicyVersion_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivacyPolicyVersion" ADD CONSTRAINT "PrivacyPolicyVersion_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiServiceSession" ADD CONSTRAINT "AiServiceSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiConversation" ADD CONSTRAINT "AiConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiMessage" ADD CONSTRAINT "AiMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AiConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiSupportCase" ADD CONSTRAINT "AiSupportCase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiMediationRequest" ADD CONSTRAINT "AiMediationRequest_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "AiSupportCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiMediationRequest" ADD CONSTRAINT "AiMediationRequest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiInteractionFeedback" ADD CONSTRAINT "AiInteractionFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiInteractionFeedback" ADD CONSTRAINT "AiInteractionFeedback_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AiConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiInteractionFeedback" ADD CONSTRAINT "AiInteractionFeedback_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "AiMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiInteractionEvent" ADD CONSTRAINT "AiInteractionEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiInteractionEvent" ADD CONSTRAINT "AiInteractionEvent_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AiConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiInteractionEvent" ADD CONSTRAINT "AiInteractionEvent_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "AiMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiKnowledgeSource" ADD CONSTRAINT "AiKnowledgeSource_supersedesId_fkey" FOREIGN KEY ("supersedesId") REFERENCES "AiKnowledgeSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiKnowledgeChunk" ADD CONSTRAINT "AiKnowledgeChunk_knowledgeSourceId_fkey" FOREIGN KEY ("knowledgeSourceId") REFERENCES "AiKnowledgeSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialMetric" ADD CONSTRAINT "SocialMetric_social_account_id_fkey" FOREIGN KEY ("social_account_id") REFERENCES "SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialMetric" ADD CONSTRAINT "SocialMetric_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "MarketingCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialMetric" ADD CONSTRAINT "SocialMetric_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "MarketingPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialAttribution" ADD CONSTRAINT "SocialAttribution_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "MarketingCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialAttribution" ADD CONSTRAINT "SocialAttribution_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "MarketingPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialAttribution" ADD CONSTRAINT "SocialAttribution_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialAttribution" ADD CONSTRAINT "SocialAttribution_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialAttribution" ADD CONSTRAINT "SocialAttribution_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialAttribution" ADD CONSTRAINT "SocialAttribution_payment_transaction_id_fkey" FOREIGN KEY ("payment_transaction_id") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialProviderEvent" ADD CONSTRAINT "SocialProviderEvent_social_account_id_fkey" FOREIGN KEY ("social_account_id") REFERENCES "SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingPostVersion" ADD CONSTRAINT "MarketingPostVersion_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "MarketingPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingPostVersion" ADD CONSTRAINT "MarketingPostVersion_target_account_id_fkey" FOREIGN KEY ("target_account_id") REFERENCES "SocialAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingPostReview" ADD CONSTRAINT "MarketingPostReview_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "MarketingPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingPostReview" ADD CONSTRAINT "MarketingPostReview_post_version_id_fkey" FOREIGN KEY ("post_version_id") REFERENCES "MarketingPostVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingPostReview" ADD CONSTRAINT "MarketingPostReview_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialFeedback" ADD CONSTRAINT "SocialFeedback_social_account_id_fkey" FOREIGN KEY ("social_account_id") REFERENCES "SocialAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialFeedback" ADD CONSTRAINT "SocialFeedback_provider_event_id_fkey" FOREIGN KEY ("provider_event_id") REFERENCES "SocialProviderEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialFeedback" ADD CONSTRAINT "SocialFeedback_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "MarketingCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialFeedback" ADD CONSTRAINT "SocialFeedback_marketing_post_id_fkey" FOREIGN KEY ("marketing_post_id") REFERENCES "MarketingPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialFeedback" ADD CONSTRAINT "SocialFeedback_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialFeedback" ADD CONSTRAINT "SocialFeedback_author_provider_id_fkey" FOREIGN KEY ("author_provider_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SemanticLearningCandidate" ADD CONSTRAINT "SemanticLearningCandidate_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanonicalQuestionAlias" ADD CONSTRAINT "CanonicalQuestionAlias_canonicalIntentId_fkey" FOREIGN KEY ("canonicalIntentId") REFERENCES "CanonicalQuestionIntent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanonicalIntentAccessScope" ADD CONSTRAINT "CanonicalIntentAccessScope_canonicalIntentId_fkey" FOREIGN KEY ("canonicalIntentId") REFERENCES "CanonicalQuestionIntent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- AUDITED MIGRATION-ONLY OBJECTS (PRESERVED FROM MIGRATION CHAIN)
-- ============================================================

-- Add check constraint on IncidentCaseHistory status transitions
ALTER TABLE "IncidentCaseHistory"
  ADD CONSTRAINT "chk_incidentcasehistory_status_change" CHECK (
    (
      "reason" = 'CREATED'
      AND "previous_status" IS NULL
    )
    OR (
      "reason" IN ('ASSIGNED', 'REASSIGNED', 'ESCALATED', 'CORRECTION_RECORDED')
      AND "previous_status" IS NOT NULL
      AND "previous_status" = "new_status"
    )
    OR (
      "reason" IN (
        'TRIAGED',
        'INVESTIGATION_STARTED',
        'CONTAINMENT_REQUESTED',
        'RESOLVED',
        'CLOSED',
        'REOPENED'
      )
      AND "previous_status" IS NOT NULL
      AND "previous_status" <> "new_status"
    )
  );

-- Function: require_incident_case_assignment_target
CREATE OR REPLACE FUNCTION require_incident_case_assignment_target()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reason IN ('ASSIGNED', 'REASSIGNED') AND NEW.assigned_to_user_id IS NULL THEN
        RAISE EXCEPTION 'ASSIGNED and REASSIGNED history entries require an assignment target.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: require assignment target on insert
CREATE TRIGGER trigger_require_incident_case_assignment_target
BEFORE INSERT ON "IncidentCaseHistory"
FOR EACH ROW EXECUTE FUNCTION require_incident_case_assignment_target();

-- Function: prevent_incident_case_mutation (immutability of forensic SOC tables)
CREATE OR REPLACE FUNCTION prevent_incident_case_mutation()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF TG_TABLE_NAME = 'IncidentCaseHistory' THEN
            IF (
                NEW.id = OLD.id
                AND NEW.incident_case_id = OLD.incident_case_id
                AND NEW.previous_status IS NOT DISTINCT FROM OLD.previous_status
                AND NEW.new_status = OLD.new_status
                AND NEW.reason = OLD.reason
                AND NEW.reason_note IS NOT DISTINCT FROM OLD.reason_note
                AND NEW.occurred_at = OLD.occurred_at
                AND NEW.idempotency_key = OLD.idempotency_key
                AND (
                    NEW.actor_user_id IS NOT DISTINCT FROM OLD.actor_user_id
                    OR (NEW.actor_user_id IS NULL AND OLD.actor_user_id IS NOT NULL)
                )
                AND (
                    NEW.assigned_to_user_id IS NOT DISTINCT FROM OLD.assigned_to_user_id
                    OR (NEW.assigned_to_user_id IS NULL AND OLD.assigned_to_user_id IS NOT NULL)
                )
                AND (
                    NEW.actor_user_id IS DISTINCT FROM OLD.actor_user_id
                    OR NEW.assigned_to_user_id IS DISTINCT FROM OLD.assigned_to_user_id
                )
            ) THEN
                RETURN NEW;
            END IF;
        END IF;
        IF (TG_TABLE_NAME = 'IncidentCaseNote' AND NEW.actor_user_id IS NULL AND OLD.actor_user_id IS NOT NULL) THEN
            IF (NEW.id = OLD.id AND NEW.incident_case_id = OLD.incident_case_id AND NEW.note_type = OLD.note_type AND NEW.content = OLD.content AND NEW.content_hash = OLD.content_hash AND NEW.is_redacted = OLD.is_redacted AND NEW.created_at = OLD.created_at AND NEW.idempotency_key = OLD.idempotency_key) THEN
                RETURN NEW;
            END IF;
        END IF;
        IF (TG_TABLE_NAME = 'IncidentCaseEvidence' AND NEW.added_by_user_id IS NULL AND OLD.added_by_user_id IS NOT NULL) THEN
            IF (NEW.id = OLD.id AND NEW.incident_case_id = OLD.incident_case_id AND NEW.evidence_type = OLD.evidence_type AND NEW.source_classification = OLD.source_classification AND NEW.collected_at = OLD.collected_at AND NEW.created_at = OLD.created_at AND NEW.reference_key = OLD.reference_key AND NEW.integrity_hash = OLD.integrity_hash AND NEW.content_type IS NOT DISTINCT FROM OLD.content_type AND NEW.size_bytes IS NOT DISTINCT FROM OLD.size_bytes AND NEW.idempotency_key = OLD.idempotency_key AND NEW.legal_hold = OLD.legal_hold AND NEW.retention_until IS NOT DISTINCT FROM OLD.retention_until) THEN
                RETURN NEW;
            END IF;
        END IF;
    END IF;
    RAISE EXCEPTION 'Updates and deletions are strictly prohibited for forensic SOC tables.';
END;
$$ LANGUAGE plpgsql;

-- Apply immutability triggers
CREATE TRIGGER trigger_prevent_update_delete_history
BEFORE UPDATE OR DELETE ON "IncidentCaseHistory"
FOR EACH ROW EXECUTE FUNCTION prevent_incident_case_mutation();

CREATE TRIGGER trigger_prevent_update_delete_note
BEFORE UPDATE OR DELETE ON "IncidentCaseNote"
FOR EACH ROW EXECUTE FUNCTION prevent_incident_case_mutation();

CREATE TRIGGER trigger_prevent_update_delete_evidence
BEFORE UPDATE OR DELETE ON "IncidentCaseEvidence"
FOR EACH ROW EXECUTE FUNCTION prevent_incident_case_mutation();
