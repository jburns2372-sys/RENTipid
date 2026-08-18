-- AlterTable
ALTER TABLE "PaymentActionLog" ADD COLUMN     "expected_amount" DECIMAL(20,4),
ADD COLUMN     "received_amount" DECIMAL(20,4);

-- AddConstraint
ALTER TABLE "PaymentActionLog" ADD CONSTRAINT "PaymentActionLog_amount_evidence_check" CHECK (
  (expected_amount IS NULL AND received_amount IS NULL) OR
  (expected_amount IS NOT NULL AND received_amount IS NOT NULL)
);
