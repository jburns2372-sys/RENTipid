import type { PrismaClient } from "@prisma/client";

export class InsuranceTelemetry {
  constructor(private readonly prisma: PrismaClient) {}

  async getRecentWebhookFailures(limit = 50) {
    return this.prisma.insuranceWebhookEvent.findMany({
      where: { status: { in: ["FAILED", "REJECTED"] } },
      orderBy: { created_at: "desc" },
      take: limit,
      select: {
        id: true,
        partner_id: true,
        event_type: true,
        status: true,
        created_at: true,
        error_message: true,
        // Omit raw_payload to prevent PII leakage in telemetry
      }
    });
  }

  async getRecentReconciliationExceptions(limit = 50) {
    return this.prisma.insuranceReconciliationLog.findMany({
      where: { status: { not: "MATCHED" } },
      orderBy: { created_at: "desc" },
      take: limit,
      select: {
        id: true,
        batch_id: true,
        partner_id: true,
        policy_id: true,
        status: true,
        discrepancy_details: true,
        created_at: true,
      }
    });
  }

  async getRecentFinanceExceptions(limit = 50) {
    return this.prisma.insuranceFinanceException.findMany({
      where: { resolution_status: "OPEN" },
      orderBy: { created_at: "desc" },
      take: limit,
      select: {
        id: true,
        exception_type: true,
        severity: true,
        description: true,
        resolution_status: true,
        created_at: true,
      }
    });
  }

  async getKillSwitchActivity(limit = 10) {
    return this.prisma.auditLog.findMany({
      where: {
        action: {
          in: ["INSURANCE_KILL_SWITCH_ACTIVATED", "INSURANCE_KILL_SWITCH_DEACTIVATED"]
        }
      },
      orderBy: { created_at: "desc" },
      take: limit,
      select: {
        id: true,
        action: true,
        actor_user_id: true,
        details: true,
        created_at: true,
      }
    });
  }
}
