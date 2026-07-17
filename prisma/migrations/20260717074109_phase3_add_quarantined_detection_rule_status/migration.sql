-- AlterEnum
ALTER TYPE "DetectionRuleStatus" ADD VALUE IF NOT EXISTS 'QUARANTINED';

-- Drop the old constraint
ALTER TABLE "DetectionRule" DROP CONSTRAINT IF EXISTS "chk_activation";

-- Add the updated constraint including QUARANTINED
ALTER TABLE "DetectionRule" ADD CONSTRAINT "chk_activation"
  CHECK (
    (status::text = 'DRAFT' AND activated_at IS NULL AND activated_by_id IS NULL AND archived_at IS NULL AND archived_by_id IS NULL)
    OR
    (status::text = 'QUARANTINED' AND archived_at IS NULL AND archived_by_id IS NULL AND (
      (activated_at IS NULL AND activated_by_id IS NULL) OR
      (activated_at IS NOT NULL AND activated_by_id IS NOT NULL)
    ))
    OR
    (status::text = 'ACTIVE' AND activated_at IS NOT NULL AND activated_by_id IS NOT NULL AND archived_at IS NULL AND archived_by_id IS NULL)
    OR
    (status::text = 'ARCHIVED' AND archived_at IS NOT NULL AND archived_by_id IS NOT NULL AND (
      (activated_at IS NULL AND activated_by_id IS NULL) OR
      (activated_at IS NOT NULL AND activated_by_id IS NOT NULL)
    ))
  );
