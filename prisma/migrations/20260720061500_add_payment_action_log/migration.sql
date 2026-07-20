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
    "outcome" TEXT NOT NULL,
    "failure_reason" TEXT,
    "source_workflow" TEXT NOT NULL,
    "source_operation_id" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentActionLog_idempotency_key_key" ON "PaymentActionLog"("idempotency_key");

-- AddForeignKey
ALTER TABLE "PaymentActionLog" ADD CONSTRAINT "PaymentActionLog_gateway_transaction_id_fkey" FOREIGN KEY ("gateway_transaction_id") REFERENCES "GatewayTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentActionLog" ADD CONSTRAINT "PaymentActionLog_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentActionLog" ADD CONSTRAINT "PaymentActionLog_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
