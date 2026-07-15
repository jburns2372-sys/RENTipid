-- Phase 2 SOC Rollback Script
-- Drops Phase 2 specific models and enums safely.

BEGIN;

-- Drop foreign keys explicitly if any exist on the Failure table linking to SecurityEvent
-- Prisma set it to SET NULL, so we can drop the tables.

DROP TABLE IF EXISTS "SecurityEventIngestionCheckpoint" CASCADE;
DROP TABLE IF EXISTS "SecurityEventIngestionFailure" CASCADE;
DROP TABLE IF EXISTS "SecurityEvent" CASCADE;

-- Drop Enums
DROP TYPE IF EXISTS "SecurityEventSource" CASCADE;
DROP TYPE IF EXISTS "SecurityDomain" CASCADE;
DROP TYPE IF EXISTS "SecurityEventClassification" CASCADE;
DROP TYPE IF EXISTS "SecuritySeverity" CASCADE;
DROP TYPE IF EXISTS "SecurityLifecycle" CASCADE;
DROP TYPE IF EXISTS "SecurityProcessingStatus" CASCADE;
DROP TYPE IF EXISTS "SecurityEnvironment" CASCADE;

COMMIT;
