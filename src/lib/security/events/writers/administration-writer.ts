import { createAuditLog } from "../../../audit";
import { SecurityEnvironment, SecurityLifecycle } from "../taxonomy";

export type AdminActionOutcome = "COMPLETED" | "DENIED" | "FAILED";

export interface AdministrationEventPayload {
  action: string;
  outcome: AdminActionOutcome;
  actorUserId: string;
  targetType: string;
  targetId?: string;
  correlationId?: string;
  occurredAt?: Date;
  environment?: SecurityEnvironment;
  lifecycle?: SecurityLifecycle;
  metadata?: Record<string, unknown>;
}

export async function logAdministrationEvent(payload: AdministrationEventPayload) {
  const safeMetadata: Record<string, unknown> = {};

  // Sanitize and copy metadata
  if (payload.metadata) {
    for (const [k, v] of Object.entries(payload.metadata)) {
      if (v === undefined || v === null) continue;

      const keyLower = k.toLowerCase();
      // Block raw secrets and PII from arbitrary metadata
      if (
        keyLower.includes("password") ||
        keyLower.includes("secret") ||
        keyLower.includes("token") ||
        keyLower.includes("email") ||
        keyLower.includes("phone")
      ) {
        continue; // Drop completely to avoid accidental exposure
      }

      safeMetadata[k] = v;
    }
  }

  if (payload.correlationId) {
    safeMetadata.correlationId = payload.correlationId;
  }

  if (payload.environment) {
    safeMetadata.environment = payload.environment;
  }

  if (payload.lifecycle) {
    safeMetadata.lifecycle = payload.lifecycle;
  }

  // Use the canonical AuditLog helper. It automatically triggers SecurityEvent normalization and ingestion.
  await createAuditLog({
    action: payload.action,
    module: payload.targetType,
    target_id: payload.targetId,
    actor_user_id: payload.actorUserId,
    details: Object.keys(safeMetadata).length > 0 ? JSON.stringify(safeMetadata) : undefined
  });
}
