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

    CONSTRAINT "InsuranceSelection_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "InsuranceSelection_consent_accepted_check" CHECK ("consent_accepted" = true),
    CONSTRAINT "InsuranceSelection_premium_minor_check" CHECK ("premium_minor" >= 0),
    CONSTRAINT "InsuranceSelection_status_check" CHECK ("status" IN ('SELECTED', 'CANCELLED'))
);

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

    CONSTRAINT "InsuranceOrder_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "InsuranceOrder_status_check" CHECK ("status" IN (
        'SELECTED',
        'PENDING_PAYMENT_DEPENDENCY',
        'READY_FOR_ISSUANCE',
        'ISSUANCE_PENDING',
        'ISSUED',
        'FAILED',
        'CANCELLED'
    )),
    CONSTRAINT "InsuranceOrder_payment_dependency_status_check" CHECK (
        "payment_dependency_status" IN ('PENDING', 'AUTHORIZED', 'SETTLED', 'FAILED')
    )
);

ALTER TABLE "InsurancePolicy" ADD COLUMN "insurance_order_id" TEXT;

CREATE UNIQUE INDEX "InsuranceSelection_booking_id_key" ON "InsuranceSelection"("booking_id");
CREATE UNIQUE INDEX "InsuranceSelection_idempotency_key_key" ON "InsuranceSelection"("idempotency_key");
CREATE INDEX "InsuranceSelection_user_id_created_at_idx" ON "InsuranceSelection"("user_id", "created_at");
CREATE INDEX "InsuranceSelection_status_offer_expires_at_idx" ON "InsuranceSelection"("status", "offer_expires_at");

CREATE UNIQUE INDEX "InsuranceOrder_selection_id_key" ON "InsuranceOrder"("selection_id");
CREATE UNIQUE INDEX "InsuranceOrder_booking_id_key" ON "InsuranceOrder"("booking_id");
CREATE UNIQUE INDEX "InsuranceOrder_idempotency_key_key" ON "InsuranceOrder"("idempotency_key");
CREATE UNIQUE INDEX "InsuranceOrder_issuance_idempotency_key_key" ON "InsuranceOrder"("issuance_idempotency_key");
CREATE INDEX "InsuranceOrder_user_id_status_idx" ON "InsuranceOrder"("user_id", "status");
CREATE INDEX "InsuranceOrder_status_updated_at_idx" ON "InsuranceOrder"("status", "updated_at");

CREATE UNIQUE INDEX "InsurancePolicy_insurance_order_id_key" ON "InsurancePolicy"("insurance_order_id");

ALTER TABLE "InsuranceSelection" ADD CONSTRAINT "InsuranceSelection_booking_id_fkey"
    FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceSelection" ADD CONSTRAINT "InsuranceSelection_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceOrder" ADD CONSTRAINT "InsuranceOrder_selection_id_fkey"
    FOREIGN KEY ("selection_id") REFERENCES "InsuranceSelection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceOrder" ADD CONSTRAINT "InsuranceOrder_booking_id_fkey"
    FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsuranceOrder" ADD CONSTRAINT "InsuranceOrder_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InsurancePolicy" ADD CONSTRAINT "InsurancePolicy_insurance_order_id_fkey"
    FOREIGN KEY ("insurance_order_id") REFERENCES "InsuranceOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
