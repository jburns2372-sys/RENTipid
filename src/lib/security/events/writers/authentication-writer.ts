import { PrismaClient } from "@prisma/client";
import { processSecurityEvent } from "../event-ingestion";
import { pseudonymizeTelemetryContext, getTelemetryHmacKeyVersion } from "../../telemetry-hmac";

const prisma = new PrismaClient();

export async function logAuthenticationEvent(options: {
  event_code: string;
  outcome: string;
  actor_user_id?: string | null;
  raw_subject?: string;
  raw_ip?: string;
  raw_device?: string;
  raw_session?: string;
  sanitized_metadata?: Record<string, unknown>;
}) {
  try {
    const occurred_at = new Date();
    // 180 days routine retention
    const expires_at = new Date(occurred_at.getTime() + 180 * 24 * 60 * 60 * 1000);

    const record = await prisma.authenticationSecurityLog.create({
      data: {
        event_code: options.event_code,
        outcome: options.outcome,
        actor_user_id: options.actor_user_id || null,
        subject_reference_hash: options.raw_subject ? pseudonymizeTelemetryContext("account", options.raw_subject) : null,
        ip_reference_hash: options.raw_ip ? pseudonymizeTelemetryContext("ip", options.raw_ip) : null,
        device_reference_hash: options.raw_device ? pseudonymizeTelemetryContext("device", options.raw_device) : null,
        session_reference_hash: options.raw_session ? pseudonymizeTelemetryContext("session", options.raw_session) : null,
        hmac_key_version: getTelemetryHmacKeyVersion(),
        environment: process.env.NODE_ENV || "production",
        lifecycle: "production",
        retention_class: "AUTH_ROUTINE_180_DAYS",
        expires_at,
        sanitized_metadata: options.sanitized_metadata ? JSON.stringify(options.sanitized_metadata) : null,
      }
    });

    // Ingestion failure handling must not throw back to the user
    processSecurityEvent(record).catch(err => {
      console.error("Failed to ingest AuthenticationSecurityLog into SecurityEvent:", err);
    });
  } catch (error) {
    // Failsafe: avoid altering login flow due to telemetry DB errors
    console.error("SECURITY_TELEMETRY_WRITE_FAILURE:", error);
  }
}
