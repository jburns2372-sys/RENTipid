import {
  SecurityLifecycle,
  SecurityEnvironment,
  SecurityEventIngestionResult
} from "./taxonomy";
import { getAdapterForRecord } from "./adapters/registry";
import { PrismaClient, Prisma } from "@prisma/client";
import crypto from "crypto";
import { validateSummaryBounds } from "../serializers";

const prisma = new PrismaClient();

export async function processSecurityEvent(
  record: unknown,
  lifecycle: SecurityLifecycle = "LIVE",
  environment: SecurityEnvironment = "PRODUCTION"
): Promise<SecurityEventIngestionResult> {
  const adapter = getAdapterForRecord(record);

  if (!adapter) {
    return {
      success: false,
      errorCode: "UNSUPPORTED_SOURCE",
      errorMessage: "No adapter configured for this source record type."
    };
  }

  try {
    const normalized = adapter.normalize(record, lifecycle, environment);

    if (!validateSummaryBounds(normalized.source_summary)) {
      throw new Error("SUMMARY_TOO_LARGE");
    }

    const adapterVersion = (adapter as unknown as { version?: string }).version || "1.0";
    const canonicalMaterial = Object.values([
      normalized.source_type,
      normalized.source_record_id,
      normalized.event_code,
      adapterVersion,
      normalized.lifecycle_type,
      normalized.environment,
      normalized.occurred_at.toISOString(),
      normalized.action_discriminator || ""
    ]).join("|");
    const idempotencyKey = crypto.createHash("sha256").update(canonicalMaterial, "utf8").digest("hex");
    console.log("IDEMP_KEY:", idempotencyKey, "MATERIAL:", canonicalMaterial);
    
    try {
      const result = await prisma.securityEvent.create({
        data: {
          event_code: normalized.event_code,
          source_type: normalized.source_type,
          source_record_id: normalized.source_record_id,
          adapter_version: adapterVersion,
          security_domain: normalized.security_domain,
          event_category: normalized.event_category,
          event_classification: normalized.event_classification,
          severity: normalized.severity,
          confidence_score: normalized.confidence_score,
          environment: normalized.environment,
          lifecycle_type: normalized.lifecycle_type,
          actor_user_id: normalized.actor_user_id,
          target_user_id: normalized.target_user_id,
          target_resource_id: normalized.target_resource_id,
          target_module: normalized.target_module,
          action_attempted: normalized.action_attempted,
          action_result: normalized.action_result,
          source_summary: (normalized.source_summary === undefined ? Prisma.DbNull : normalized.source_summary) as Prisma.InputJsonValue,
          classification_reason: normalized.classification_reason,
          correlation_key: normalized.correlation_key,
          idempotency_key: idempotencyKey,
          processing_status: normalized.processing_status,
          occurred_at: normalized.occurred_at,
          source_received_at: normalized.source_received_at
        }
      });

      const sourceIdStr = String(normalized.source_record_id);

      // Attempt to resolve failures on success
      try {
        await prisma.securityEventIngestionFailure.updateMany({
          where: {
            source_type: normalized.source_type,
            source_record_id: sourceIdStr,
            adapter_version: adapterVersion,
            lifecycle: normalized.lifecycle_type,
            environment: normalized.environment,
            resolved_time: null
          },
          data: {
            resolved_time: new Date(),
            resolved_event_id: result.id
          }
        });
      } catch {
        // Safe to swallow, event was created
      }

      return {
        success: true,
        eventId: result.id
      };
    } catch (createError) {
      if (createError instanceof Prisma.PrismaClientKnownRequestError && createError.code === "P2002") {
        const existing = await prisma.securityEvent.findUnique({
          where: { idempotency_key: idempotencyKey },
          select: { id: true }
        });
        if (existing) {
          const sourceIdStr = String(normalized.source_record_id);
          try {
            await prisma.securityEventIngestionFailure.updateMany({
              where: {
                source_type: normalized.source_type,
                source_record_id: sourceIdStr,
                adapter_version: adapterVersion,
                lifecycle: normalized.lifecycle_type,
                environment: normalized.environment,
                resolved_time: null
              },
              data: {
                resolved_time: new Date(),
                resolved_event_id: existing.id
              }
            });
          } catch { }

          return { success: true, duplicate: true, eventId: existing.id };
        }
      }
      throw createError; // Proceed to fallback failure logging
    }
  } catch (error) {
    const safeErrorCode = error instanceof Error ? error.name : "UNKNOWN_ERROR";
    const sourceId = typeof record === "object" && record !== null && "id" in record ? String(record.id) : "UNKNOWN";

    try {
      const adapterVersion = (adapter as unknown as { version?: string }).version || "1.0";
      await prisma.securityEventIngestionFailure.upsert({
        where: {
          unique_failure_identity: {
            source_type: adapter.sourceType,
            source_record_id: sourceId,
            adapter_version: adapterVersion,
            lifecycle,
            environment,
            privacy_safe_error_code: safeErrorCode
          }
        },
        update: {
          attempt_count: { increment: 1 },
          last_failed_at: new Date(),
        },
        create: {
          source_type: adapter.sourceType,
          source_record_id: sourceId,
          adapter_version: adapterVersion,
          privacy_safe_error_code: safeErrorCode,
          lifecycle,
          environment
        }
      });
    } catch {
      // Total persistence failure. Swallow safely to avoid breaking critical business logic.
    }

    return {
      success: false,
      errorCode: safeErrorCode,
      errorMessage: "Normalization or persistence failed. Pre-persistence failure recorded."
    };
  }
}
