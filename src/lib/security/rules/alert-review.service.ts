import { PrismaClient, SecurityAlertReviewStatus, SecurityAlert, SecuritySeverity, SecurityEventClassification, Prisma, SecurityEnvironment } from "@prisma/client";
import { getCurrentDatabaseUser, assertAccountAllowedForSocAccess, canAccessSecurityPermission } from "../authorization";
import { SECURITY_PERMISSIONS, SecurityPermission } from "../permissions";

const prisma = new PrismaClient();
export interface AlertReviewCursor {
  created_at: Date;
  id: string;
}

export interface AlertReviewFilter {
  review_status?: SecurityAlertReviewStatus;
  rule_id?: string;
  environment?: string;
  min_severity?: SecuritySeverity;
  severity?: string[];
}

export interface AlertDetailDTO {
  id: string;
  alert_reference: string;
  rule_id: string;
  rule_version: number;
  result_classification: SecurityEventClassification;
  final_severity: SecuritySeverity;
  final_confidence: number;
  review_status: SecurityAlertReviewStatus;
  review_version: number;
  environment: string;
  lifecycle_type: string;
  correlation_subject_hash: string;
  created_at: Date;
  first_event_timestamp: Date;
  last_event_timestamp: Date;
  evidence: {
    event_id: string;
    evidence_role: string;
    occurred_at: Date;
  }[];
}

export class AlertReviewService {
  private static async checkPermission(userId: string, permission: SecurityPermission) {
    const user = await getCurrentDatabaseUser(userId);
    if (!user) throw new Error("Missing database user");

    const policy = await assertAccountAllowedForSocAccess(user);
    if (!policy.allowed) {
      throw new Error(`Authorization failed: ${policy.reason}`);
    }

    if (!canAccessSecurityPermission(policy.permissions!, permission)) {
      throw new Error(`Missing required permission: ${permission}`);
    }
    
    return user;
  }

  public static async getAlerts(
    userId: string,
    limit: number,
    filter?: AlertReviewFilter,
    cursor?: AlertReviewCursor
  ) {
    await this.checkPermission(userId, SECURITY_PERMISSIONS.ALERTS_VIEW);

    const where: Prisma.SecurityAlertWhereInput = {};
    if (filter?.review_status) where.review_status = filter.review_status;
    if (filter?.rule_id) where.rule_id = filter.rule_id;
    if (filter?.environment) where.environment = filter.environment as SecurityEnvironment;
    
    if (filter?.severity && filter.severity.length > 0) where.final_severity = { in: filter.severity as SecuritySeverity[] };

    const alerts = await prisma.securityAlert.findMany({
      where,
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor.id } : undefined,
      orderBy: [
        { created_at: 'desc' },
        { id: 'desc' }
      ]
    });

    const hasMore = alerts.length > limit;
    if (hasMore) alerts.pop();

    const nextCursor = hasMore ? {
      created_at: alerts[alerts.length - 1].created_at,
      id: alerts[alerts.length - 1].id
    } : undefined;

    return {
      alerts: alerts.map(a => this.mapToSafeDTO(a, [])),
      nextCursor,
      hasMore
    };
  }

  public static async getAlertDetail(userId: string, alertId: string): Promise<AlertDetailDTO | null> {
    await this.checkPermission(userId, SECURITY_PERMISSIONS.ALERTS_VIEW);

    const alert = await prisma.securityAlert.findUnique({
      where: { id: alertId },
      include: {
        evidence: {
          include: {
            event: {
              select: { occurred_at: true, id: true }
            }
          },
          orderBy: {
            event_id: 'asc'
          }
        }
      }
    });

    if (!alert) return null;
    return this.mapToSafeDTO(alert, alert.evidence);
  }

  public static async updateAlertReviewStatus(
    userId: string,
    alertId: string,
    newStatus: SecurityAlertReviewStatus,
    reviewNotes: string,
    expectedReviewVersion: number
  ) {
    const user = await this.checkPermission(userId, SECURITY_PERMISSIONS.ALERTS_REVIEW);

    return await prisma.$transaction(async (tx) => {
      const alert = await tx.securityAlert.findUnique({ where: { id: alertId } });
      if (!alert) throw new Error("Alert not found");

      if (alert.review_version !== expectedReviewVersion) {
        throw new Error("OPTIMISTIC_CONCURRENCY_FAILURE");
      }

      // Valid transitions
      const validTransitions: Record<string, string[]> = {
        "UNREVIEWED": ["UNDER_REVIEW"],
        "UNDER_REVIEW": ["CONFIRMED", "FALSE_POSITIVE"],
        "CONFIRMED": [],
        "FALSE_POSITIVE": []
      };

      if (!validTransitions[alert.review_status]?.includes(newStatus)) {
        throw new Error(`INVALID_TRANSITION from ${alert.review_status} to ${newStatus}`);
      }

      const updateResult = await tx.securityAlert.updateMany({
        where: { 
          id: alertId,
          review_version: expectedReviewVersion,
          review_status: alert.review_status
        },
        data: {
          review_status: newStatus,
          review_notes: reviewNotes,
          reviewer_id: user.id,
          reviewed_at: new Date(),
          review_version: { increment: 1 }
        }
      });

      if (updateResult.count === 0) {
        throw new Error("OPTIMISTIC_CONCURRENCY_FAILURE");
      }

      // Fetch the updated alert for the DTO
      const updatedAlert = await tx.securityAlert.findUniqueOrThrow({ where: { id: alertId } });

      await tx.auditLog.create({
        data: {
          action: "SECURITY_ALERT_REVIEWED",
          module: "SOC_DETECTION_ANALYTICS",
          actor_user_id: user.id,
          target_id: alertId,
          details: JSON.stringify({
            old_status: alert.review_status,
            new_status: newStatus,
            review_version: updatedAlert.review_version
          })
        }
      });

      return updatedAlert;
    });
  }

  private static mapToSafeDTO(alert: SecurityAlert, evidence: { event_id: string, evidence_role: string, event: { occurred_at: Date } }[]): AlertDetailDTO {
    return {
      id: alert.id,
      alert_reference: alert.alert_reference,
      rule_id: alert.rule_id,
      rule_version: alert.rule_version,
      result_classification: alert.result_classification,
      final_severity: alert.final_severity,
      final_confidence: alert.final_confidence,
      review_status: alert.review_status,
      review_version: alert.review_version,
      environment: alert.environment,
      lifecycle_type: alert.lifecycle_type,
      correlation_subject_hash: alert.correlation_subject_hash,
      created_at: alert.created_at,
      first_event_timestamp: alert.first_event_timestamp,
      last_event_timestamp: alert.last_event_timestamp,
      evidence: evidence.map(e => ({
        event_id: e.event_id,
        evidence_role: e.evidence_role,
        occurred_at: e.event.occurred_at
      }))
    };
  }
}
