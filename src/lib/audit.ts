import { PrismaClient } from "@prisma/client";

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
    await prisma.auditLog.create({
      data: payload
    });
  } catch (error) {
    console.error("Failed to create audit log", error);
  }
}
