ALTER TYPE "DetectionRuleStatus" ADD VALUE IF NOT EXISTS 'QUARANTINED';

ALTER TABLE "DetectionRule" DROP CONSTRAINT "chk_activation";

ALTER TABLE "DetectionRule" ADD CONSTRAINT "chk_activation" 
CHECK (
  ((status::text = 'DRAFT') AND (activated_at IS NULL) AND (archived_at IS NULL)) 
  OR ((status::text = 'ACTIVE') AND (activated_at IS NOT NULL) AND (archived_at IS NULL)) 
  OR ((status::text = 'ARCHIVED') AND (archived_at IS NOT NULL))
  OR (status::text = 'QUARANTINED')
);
