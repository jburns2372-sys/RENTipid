-- AlterTable
ALTER TABLE "GatewayTransaction" ADD COLUMN "idempotency_key" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "GatewayTransaction_idempotency_key_key" ON "GatewayTransaction"("idempotency_key");
