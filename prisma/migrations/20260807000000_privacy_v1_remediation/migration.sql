ALTER TABLE "DataSubjectRequest" ADD COLUMN "dpo_escalation_status" TEXT;
ALTER TABLE "DataSubjectRequest" ADD COLUMN "dpo_escalated_at" TIMESTAMP(3);
ALTER TABLE "DataSubjectRequest" ADD COLUMN "dpo_escalated_by_user_id" TEXT;
ALTER TABLE "DataSubjectRequest" ADD COLUMN "dpo_escalation_reason" TEXT;
