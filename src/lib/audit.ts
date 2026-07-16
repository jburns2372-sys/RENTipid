import { PrismaClient } from "@prisma/client";
import { processSecurityEvent } from "./security/events/event-ingestion";

const prisma = new PrismaClient();

interface AuditLogPayload {
  actor_user_id?: string;
  action: string;
  module: string;
  target_id?: string;
  details?: string;
  ip_address?: string;
}

export async function createAuditLog(payload: AuditLogPayload) {
  try {
    const log = await prisma.auditLog.create({
      data: payload
    });
    
    // ASYNCHRONOUS delivery classification. We don't await this so business transactions are not blocked.
    // Errors are handled inside processSecurityEvent.
    processSecurityEvent(log).catch(err => {
      // Best-effort console logging, do not fail the request or cause recursion
      console.error("SOC Event processing failed for AuditLog:", err);
    });

  } catch (error) {
    console.error("Failed to create audit log", error);
  }
}
