import { PrismaClient } from '@prisma/client';
import { processSecurityEvent } from '@/lib/security/events/event-ingestion';

export async function createPrivacyAuditLog(
  tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"> | PrismaClient,
  payload: {
    actor_user_id: string;
    action: string;
    target_id?: string;
    details: string;
  }
) {
  // Uses the provided transaction client to ensure atomic failure
  const log = await tx.auditLog.create({
    data: {
      actor_user_id: payload.actor_user_id,
      action: payload.action,
      module: 'PRIVACY_OPERATIONS',
      target_id: payload.target_id,
      details: payload.details,
    }
  });

  processSecurityEvent(log).catch(err => {
    console.error("SOC Event processing failed for Privacy AuditLog:", err);
  });

  return log;
}
