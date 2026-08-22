-- Reconcile SemanticLearningCandidate table by adding missing semanticType column
-- This migration addresses the MIGRATION_RECORDED_BUT_SCHEMA_INCOMPLETE scenario
ALTER TABLE "SemanticLearningCandidate" ADD COLUMN "semanticType" TEXT NOT NULL DEFAULT 'UNKNOWN';
