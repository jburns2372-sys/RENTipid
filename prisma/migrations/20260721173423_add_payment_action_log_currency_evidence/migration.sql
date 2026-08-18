-- AlterTable
ALTER TABLE "PaymentActionLog" ADD COLUMN     "expected_currency" TEXT,
ADD COLUMN     "received_currency" TEXT;

ALTER TABLE "PaymentActionLog" ADD CONSTRAINT "PaymentActionLog_currency_evidence_check" CHECK (
  ("expected_currency" IS NULL AND "received_currency" IS NULL) OR
  ("expected_currency" IS NOT NULL AND "received_currency" IS NOT NULL)
);
