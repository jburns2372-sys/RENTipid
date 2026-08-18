import type { PrismaClient } from "@prisma/client";

export class InsuranceTelemetry {
  constructor(private readonly prisma: PrismaClient) {}

  async getRecentWebhookFailures(limit = 50) {
    return this.prisma.insuranceWebhookEvent.findMany({
      where: { processing_status: { in: ["FAILED", "REJECTED"] } },
      orderBy: { received_at: "desc" },
      take: limit,
      select: {
        id: true,
        partner_id: true,
        event_type: true,
        processing_status: true,
        received_at: true,
        failure_code: true,
        // Omit raw_payload to prevent PII leakage in telemetry
      }
    });
  }

  async getRecentReconciliationExceptions(limit = 50) {
    return this.prisma.insuranceReconciliationLog.findMany({
      where: { classification: { not: "MATCHED" } },
      orderBy: { created_at: "desc" },
      take: limit,
      select: {
        id: true,
        batch_reference: true,
        partner_id: true,
        policy_id: true,
        classification: true,
        status: true,
        created_at: true,
      }
    });
  }

  async getRecentFinanceExceptions(limit = 50) {
    return this.prisma.insuranceFinanceException.findMany({
      where: { status: "OPEN" },
      orderBy: { created_at: "desc" },
      take: limit,
      select: {
        id: true,
        exception_type: true,
        description: true,
        status: true,
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
