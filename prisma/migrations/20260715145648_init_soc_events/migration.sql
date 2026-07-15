-- CreateEnum
CREATE TYPE "SecurityEventSource" AS ENUM ('AUDIT_LOG', 'SYSTEM_ERROR_LOG', 'AI_BOT_LOG', 'PAYMENT_WEBHOOK_LOG', 'PAYMENT_RECONCILIATION_LOG', 'VERIFICATION_DOCUMENT', 'DAMAGE_CLAIM', 'DISPUTE_CASE', 'INSPECTION_REPORT', 'SYSTEM_SETTING');

-- CreateEnum
CREATE TYPE "SecurityDomain" AS ENUM ('IDENTITY_AND_ACCESS', 'ADMINISTRATIVE_SECURITY', 'CYBERSECURITY', 'APPLICATION_RELIABILITY', 'AI_GUARDRAILS', 'KYC_AND_COMPLIANCE', 'MARKETPLACE_INTEGRITY', 'TRUST_AND_SAFETY', 'FINANCIAL_INTEGRITY', 'PAYMENT_SECURITY', 'DATA_PROTECTION', 'FILE_SECURITY', 'INFRASTRUCTURE', 'SIMULATION');

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
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "province" TEXT,
    "country" TEXT,
    "profile_photo" TEXT,
    "verification_status" TEXT NOT NULL,
    "trust_score" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessProfile" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "business_registration_number" TEXT,
    "business_address" TEXT,
    "authorized_representative" TEXT,
    "verification_status" TEXT NOT NULL,

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
CREATE TABLE "FinanceLedger" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "booking_id" TEXT,
    "transaction_type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "balance_type" TEXT NOT NULL,
    "description" TEXT,
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
CREATE TABLE "MarketingPost" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "provider_id" TEXT,
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
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error_message" TEXT,
    "scheduled_at" TIMESTAMP(3),
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialPostQueue_pkey" PRIMARY KEY ("id")
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
    "last_attempted_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_time" TIMESTAMP(3),
    "lifecycle" "SecurityLifecycle" NOT NULL,
    "environment" "SecurityEnvironment" NOT NULL,

    CONSTRAINT "SecurityEventIngestionFailure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_user_id_key" ON "UserProfile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessProfile_user_id_key" ON "BusinessProfile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryRequirement_category_id_key" ON "CategoryRequirement"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_booking_id_key" ON "Payment"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transaction_id_key" ON "Payment"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_gateway_transaction_id_key" ON "Payment"("gateway_transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "GatewayTransaction_gateway_reference_key" ON "GatewayTransaction"("gateway_reference");

-- CreateIndex
CREATE UNIQUE INDEX "RentalAgreement_booking_id_key" ON "RentalAgreement"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSettings_key_key" ON "SystemSettings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "DamageClaim_claim_number_key" ON "DamageClaim"("claim_number");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_setting_key_key" ON "SystemSetting"("setting_key");

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
CREATE INDEX "SecurityEvent_correlation_key_occurred_at_idx" ON "SecurityEvent"("correlation_key", "occurred_at");

-- CreateIndex
CREATE INDEX "SecurityEventIngestionFailure_source_type_source_record_id_idx" ON "SecurityEventIngestionFailure"("source_type", "source_record_id");

-- CreateIndex
CREATE INDEX "SecurityEventIngestionFailure_last_attempted_time_idx" ON "SecurityEventIngestionFailure"("last_attempted_time");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessProfile" ADD CONSTRAINT "BusinessProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "FinanceLedger" ADD CONSTRAINT "FinanceLedger_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceLedger" ADD CONSTRAINT "FinanceLedger_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "AIBotLog" ADD CONSTRAINT "AIBotLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingCampaign" ADD CONSTRAINT "MarketingCampaign_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingPost" ADD CONSTRAINT "MarketingPost_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "MarketingCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingPost" ADD CONSTRAINT "MarketingPost_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "AccountDeletionRequest" ADD CONSTRAINT "AccountDeletionRequest_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundRequest" ADD CONSTRAINT "RefundRequest_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderPayout" ADD CONSTRAINT "ProviderPayout_payout_batch_id_fkey" FOREIGN KEY ("payout_batch_id") REFERENCES "PayoutBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderPayout" ADD CONSTRAINT "ProviderPayout_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
