-- Unified Multi-Login Authentication v1.1
-- Gate 1: migration file is versioned but must not be applied in this run.

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

CREATE TABLE "AuthRateLimit" (
    "key" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "reset_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthRateLimit_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "AuthConsentReceipt" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "terms_version" TEXT NOT NULL,
    "privacy_version" TEXT NOT NULL,
    "accepted_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthConsentReceipt_pkey" PRIMARY KEY ("id")
);

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

CREATE UNIQUE INDEX "EmailCredential_user_id_key" ON "EmailCredential"("user_id");
CREATE UNIQUE INDEX "EmailCredential_normalized_email_key" ON "EmailCredential"("normalized_email");
CREATE INDEX "EmailCredential_normalized_email_idx" ON "EmailCredential"("normalized_email");

CREATE UNIQUE INDEX "AuthProviderIdentity_provider_provider_subject_key" ON "AuthProviderIdentity"("provider", "provider_subject");
CREATE INDEX "AuthProviderIdentity_user_id_provider_idx" ON "AuthProviderIdentity"("user_id", "provider");
CREATE INDEX "AuthProviderIdentity_provider_updated_at_idx" ON "AuthProviderIdentity"("provider", "updated_at");

CREATE UNIQUE INDEX "PhoneIdentity_phone_e164_key" ON "PhoneIdentity"("phone_e164");
CREATE INDEX "PhoneIdentity_user_id_idx" ON "PhoneIdentity"("user_id");

CREATE INDEX "PhoneVerificationChallenge_phone_e164_channel_status_created_at_idx" ON "PhoneVerificationChallenge"("phone_e164", "channel", "status", "created_at");
CREATE INDEX "PhoneVerificationChallenge_expires_at_idx" ON "PhoneVerificationChallenge"("expires_at");
CREATE INDEX "PhoneVerificationChallenge_ip_reference_hash_created_at_idx" ON "PhoneVerificationChallenge"("ip_reference_hash", "created_at");
CREATE INDEX "PhoneVerificationChallenge_session_reference_hash_created_at_idx" ON "PhoneVerificationChallenge"("session_reference_hash", "created_at");

CREATE INDEX "AuthRateLimit_reset_at_idx" ON "AuthRateLimit"("reset_at");

CREATE INDEX "AuthConsentReceipt_user_id_accepted_at_idx" ON "AuthConsentReceipt"("user_id", "accepted_at");

CREATE INDEX "AuthIdentityEvent_user_id_created_at_idx" ON "AuthIdentityEvent"("user_id", "created_at");
CREATE INDEX "AuthIdentityEvent_identity_type_action_outcome_idx" ON "AuthIdentityEvent"("identity_type", "action", "outcome");

ALTER TABLE "EmailCredential"
  ADD CONSTRAINT "EmailCredential_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuthProviderIdentity"
  ADD CONSTRAINT "AuthProviderIdentity_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PhoneIdentity"
  ADD CONSTRAINT "PhoneIdentity_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuthConsentReceipt"
  ADD CONSTRAINT "AuthConsentReceipt_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuthIdentityEvent"
  ADD CONSTRAINT "AuthIdentityEvent_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
