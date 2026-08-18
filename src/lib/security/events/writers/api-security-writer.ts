import { PrismaClient } from "@prisma/client";
import { processSecurityEvent } from "../event-ingestion";
import { pseudonymizeTelemetryContext } from "../../telemetry-hmac";

const prisma = new PrismaClient();

export async function logApiSecurityEvent(options: {
  event_code: string;
  outcome: string;
  actor_user_id?: string | null;
  raw_subject?: string;
  raw_ip?: string;
  raw_device?: string;
  raw_target?: string;
  safe_route_family: string;
  http_method: string;
  policy_family?: string;
  threshold_category?: string;
  distinct_target_count?: number;
  correlation_id?: string;
  sanitized_metadata?: Record<string, unknown>;
}) {
  try {
    const occurred_at = new Date();

    const record = await prisma.apiSecurityLog.create({
      data: {
        event_code: options.event_code,
        outcome: options.outcome,
        actor_user_id: options.actor_user_id || null,
        subject_reference_hash: options.raw_subject ? pseudonymizeTelemetryContext("account", options.raw_subject) : null,
        ip_reference_hash: options.raw_ip ? pseudonymizeTelemetryContext("ip", options.raw_ip) : null,
        device_reference_hash: options.raw_device ? pseudonymizeTelemetryContext("device", options.raw_device) : null,
        target_reference_hash: options.raw_target ? pseudonymizeTelemetryContext("target", options.raw_target) : null,
        safe_route_family: options.safe_route_family,
        http_method: options.http_method,
        policy_family: options.policy_family || null,
        threshold_category: options.threshold_category || null,
        distinct_target_count: options.distinct_target_count || null,
        correlation_id: options.correlation_id || null,
        environment: process.env.NODE_ENV || "production",
        lifecycle: "production",
        sanitized_metadata: options.sanitized_metadata ? JSON.stringify(options.sanitized_metadata) : null,
        occurred_at,
      }
    });

    processSecurityEvent(record).catch(err => {
      console.error("Failed to ingest ApiSecurityLog into SecurityEvent:", err);
    });
  } catch (error) {
    console.error("API_SECURITY_TELEMETRY_WRITE_FAILURE:", error);
  }
}
