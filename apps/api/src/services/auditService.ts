import { PrismaClient } from '@prisma/client';
import * as appInsights from 'applicationinsights';

const prisma = new PrismaClient();

/**
 * Creates an immutable Audit Log record for high-risk system actions.
 * @param actorId - The user or system account performing the action
 * @param action - Structured action string (e.g., 'BOOKING_CREATED', 'PAYMENT_REFUNDED')
 * @param targetResource - The ID of the affected resource (e.g., bookingId)
 * @param details - JSON blob of old/new values or contextual context
 * @param correlationId - Propagated trace ID to link backend DB to frontend click
 */
export const logAuditAction = async (
  actorId: string,
  action: string,
  targetResource: string,
  details: any,
  correlationId?: string
) => {
  try {
    // Phase 15: We assume there's an AuditLog table mapped in Prisma.
    // If it doesn't exist yet, it must be added to schema.prisma.
    // await prisma.auditLog.create({
    //   data: { actorId, action, targetResource, details, correlationId }
    // });
    
    // For now, we strictly emit this to AppInsights so it's queryable immediately.
    const client = appInsights.defaultClient;
    if (client) {
      client.trackEvent({
        name: `Audit_${action}`,
        properties: {
          actorId,
          targetResource,
          correlationId,
          ...details
        }
      });
    }
    console.log(`[AUDIT] ${action} executed by ${actorId} on ${targetResource}`);
  } catch (error) {
    // Never fail the primary transaction because the audit logger failed,
    // but flag it heavily in standard error logs.
    console.error('CRITICAL: Failed to write audit log', error);
  }
};