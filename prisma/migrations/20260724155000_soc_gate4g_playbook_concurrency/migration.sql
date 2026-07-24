-- AlterTable
ALTER TABLE "SecurityResponsePlaybook" ADD COLUMN "lock_version" INTEGER NOT NULL DEFAULT 0;

-- AddConstraint
ALTER TABLE "SecurityResponsePlaybook" ADD CONSTRAINT "chk_security_response_playbook_lock_version_nonnegative" CHECK ("lock_version" >= 0);
