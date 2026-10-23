import {
  PrismaClient,
  SecurityEnvironment,
  SecurityLifecycle,
} from "@prisma/client";
import { processSecurityEvent } from "./security/events/event-ingestion";

const prisma = new PrismaClient();

interface AuditLogPayload {
  actor_user_id?: string;
  action: string;
  module: string;
  target_id?: string;
  details?: string;
  ip_address?: string;
  eventLifecycle?: SecurityLifecycle;
  eventEnvironment?: SecurityEnvironment;
}

export async function createAuditLog(payload: AuditLogPayload): Promise<boolean> {
  try {
    const {
      eventLifecycle = SecurityLifecycle.LIVE,
      eventEnvironment = SecurityEnvironment.PRODUCTION,
      ...auditData
    } = payload;
    const log = await prisma.auditLog.create({
      data: auditData
    });

    // ASYNCHRONOUS delivery classification. We don't await this so business transactions are not blocked.
    // Errors are handled inside processSecurityEvent.
    processSecurityEvent(log, eventLifecycle, eventEnvironment).catch(err => {
      // Best-effort console logging, do not fail the request or cause recursion
      console.error("SOC Event processing failed for AuditLog:", err);
    });

    return true;
  } catch (error) {
    console.error("Failed to create audit log", error);
    return false;
  }
}
