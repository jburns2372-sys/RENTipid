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

CREATE TABLE "InsurancePolicy" (
    "id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
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

CREATE TABLE "InsuranceClaim" (
    "id" TEXT NOT NULL,
    "policy_id" TEXT NOT NULL,
    "external_claim_id" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "incident_type" TEXT NOT NULL,
    "incident_at" TIMESTAMP(3) NOT NULL,
    "incident_summary" TEXT,
    "normalized_snapshot" JSONB,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsuranceClaim_pkey" PRIMARY KEY ("id")
);

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

CREATE UNIQUE INDEX "InsurancePartner_adapter_key_key" ON "InsurancePartner"("adapter_key");
CREATE INDEX "InsurancePartner_status_is_enabled_idx" ON "InsurancePartner"("status", "is_enabled");
CREATE UNIQUE INDEX "InsuranceProduct_partner_id_product_code_key" ON "InsuranceProduct"("partner_id", "product_code");
CREATE INDEX "InsuranceProduct_status_idx" ON "InsuranceProduct"("status");
CREATE UNIQUE INDEX "InsuranceOffer_partner_id_external_offer_id_key" ON "InsuranceOffer"("partner_id", "external_offer_id");
CREATE INDEX "InsuranceOffer_booking_id_status_idx" ON "InsuranceOffer"("booking_id", "status");
CREATE INDEX "InsuranceOffer_expires_at_idx" ON "InsuranceOffer"("expires_at");
CREATE UNIQUE INDEX "InsurancePolicy_booking_id_key" ON "InsurancePolicy"("booking_id");
CREATE UNIQUE INDEX "InsurancePolicy_idempotency_key_key" ON "InsurancePolicy"("idempotency_key");
CREATE UNIQUE INDEX "InsurancePolicy_partner_id_external_policy_id_key" ON "InsurancePolicy"("partner_id", "external_policy_id");
CREATE INDEX "InsurancePolicy_status_coverage_end_idx" ON "InsurancePolicy"("status", "coverage_end");
CREATE UNIQUE INDEX "InsuranceClaim_idempotency_key_key" ON "InsuranceClaim"("idempotency_key");
CREATE UNIQUE INDEX "InsuranceClaim_policy_id_external_claim_id_key" ON "InsuranceClaim"("policy_id", "external_claim_id");
CREATE INDEX "InsuranceClaim_status_submitted_at_idx" ON "InsuranceClaim"("status", "submitted_at");
CREATE UNIQUE INDEX "InsuranceWebhookEvent_partner_id_external_event_id_key" ON "InsuranceWebhookEvent"("partner_id", "external_event_id");
CREATE INDEX "InsuranceWebhookEvent_processing_status_received_at_idx" ON "InsuranceWebhookEvent"("processing_status", "received_at");

ALTER TABLE "InsuranceProduct" ADD CONSTRAINT "InsuranceProduct_partner_id_fkey"
    FOREIGN KEY ("partner_id") REFERENCES "InsurancePartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceOffer" ADD CONSTRAINT "InsuranceOffer_partner_id_fkey"
    FOREIGN KEY ("partner_id") REFERENCES "InsurancePartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceOffer" ADD CONSTRAINT "InsuranceOffer_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "InsuranceProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceOffer" ADD CONSTRAINT "InsuranceOffer_booking_id_fkey"
    FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsurancePolicy" ADD CONSTRAINT "InsurancePolicy_partner_id_fkey"
    FOREIGN KEY ("partner_id") REFERENCES "InsurancePartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsurancePolicy" ADD CONSTRAINT "InsurancePolicy_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "InsuranceProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsurancePolicy" ADD CONSTRAINT "InsurancePolicy_booking_id_fkey"
    FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceClaim" ADD CONSTRAINT "InsuranceClaim_policy_id_fkey"
    FOREIGN KEY ("policy_id") REFERENCES "InsurancePolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceWebhookEvent" ADD CONSTRAINT "InsuranceWebhookEvent_partner_id_fkey"
    FOREIGN KEY ("partner_id") REFERENCES "InsurancePartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
