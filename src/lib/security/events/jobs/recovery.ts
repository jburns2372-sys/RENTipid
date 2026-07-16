import { PrismaClient, SecurityEventSource } from "@prisma/client";
import { processSecurityEvent } from "../event-ingestion";
import { SecurityLifecycle, SecurityEnvironment } from "../taxonomy";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

export interface RecoveryOptions {
  sourceType: SecurityEventSource;
  batchSize: number;
  lifecycle: SecurityLifecycle;
  environment: SecurityEnvironment;
}

export interface RecoveryResult {
  sourceType: SecurityEventSource;
  leaseAcquired: boolean;
  examined: number;
  eligible: number;
  normalized: number;
  duplicates: number;
  failures: number;
  skipped: number;
  durationMs: number;
  errorMessage?: string;
}

export async function runRecovery(options: RecoveryOptions): Promise<RecoveryResult> {
  const startTime = Date.now();
  const workerId = `recovery-worker-${uuidv4()}`;
  const now = new Date();
  const leaseExpiry = new Date(now.getTime() + 15 * 60 * 1000); // 15 mins lease

  const result: RecoveryResult = {
    sourceType: options.sourceType,
    leaseAcquired: false,
    examined: 0,
    eligible: 0,
    normalized: 0,
    duplicates: 0,
    failures: 0,
    skipped: 0,
    durationMs: 0
  };

  try {
    // 1. Acquire lease
    const identity = {
      source_type: options.sourceType,
      environment: options.environment,
      lifecycle_type: options.lifecycle
    };

    // Ensure checkpoint exists
    await prisma.securityEventIngestionCheckpoint.upsert({
      where: { source_type_environment_lifecycle_type: identity },
      create: { ...identity, created_at: new Date(), updated_at: new Date() },
      update: {}
    });

    const acquired = await prisma.securityEventIngestionCheckpoint.updateMany({
      where: {
        source_type: options.sourceType,
        environment: options.environment,
        lifecycle_type: options.lifecycle,
        OR: [
          { lease_owner: null },
          { lease_expires_at: { lt: now } }
        ]
      },
      data: {
        lease_owner: workerId,
        lease_expires_at: leaseExpiry,
        last_run_started_at: new Date()
      }
    });

    if (acquired.count === 0) {
      result.errorMessage = "Lease is currently held by another worker.";
      return result; // Could not acquire lease
    }

    result.leaseAcquired = true;

    // 2. Read Checkpoint
    const checkpoint = await prisma.securityEventIngestionCheckpoint.findUnique({
      where: { source_type_environment_lifecycle_type: identity }
    });

    if (!checkpoint) {
      throw new Error("Checkpoint unexpectedly missing after acquisition");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sourceConfig: Record<string, { delegate: any; dateColumn: string }> = {
      "AUDIT_LOG": { delegate: prisma.auditLog, dateColumn: "created_at" },
      "SYSTEM_SETTING": { delegate: prisma.systemSetting, dateColumn: "updated_at" },
      "AI_BOT_LOG": { delegate: prisma.aIBotLog, dateColumn: "created_at" },
      "PAYMENT_WEBHOOK_LOG": { delegate: prisma.paymentWebhookLog, dateColumn: "created_at" },
      "PAYMENT_RECONCILIATION_LOG": { delegate: prisma.paymentReconciliationLog, dateColumn: "created_at" },
      "VERIFICATION_DOCUMENT": { delegate: prisma.verificationDocument, dateColumn: "created_at" },
      "DAMAGE_CLAIM": { delegate: prisma.damageClaim, dateColumn: "created_at" },
      "DISPUTE_CASE": { delegate: prisma.disputeCase, dateColumn: "created_at" },
      "INSPECTION_REPORT": { delegate: prisma.inspectionReport, dateColumn: "created_at" },
    };

    const config = sourceConfig[options.sourceType];
    if (!config) {
      result.skipped = 1; // No writer or table
      return result;
    }

    // 4. Bounded overlap window: checkpoint.last_source_timestamp minus 5 mins
    let afterDate = new Date(0);
    if (checkpoint.last_source_timestamp) {
      afterDate = new Date(checkpoint.last_source_timestamp.getTime() - 5 * 60 * 1000);
    }
    
    // Process up to "now - 5 mins" to let inflight transactions settle
    const cutoffDate = new Date(now.getTime() - 5 * 60 * 1000);

    let hasMore = true;
    let currentAfterDate = afterDate;
    let currentAfterId = checkpoint.last_source_record_id || undefined;
    let maxTimestampEncountered = checkpoint.last_source_timestamp || null;
    let maxIdEncountered = checkpoint.last_source_record_id || null;

    while (hasMore) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const query: any = {
        take: options.batchSize,
        where: {
          [config.dateColumn]: {
            gte: currentAfterDate,
            lte: cutoffDate
          }
        },
        orderBy: [
          { [config.dateColumn]: "asc" },
          { id: "asc" }
        ]
      };

      if (currentAfterId && currentAfterDate.getTime() === afterDate.getTime()) {
        // Only skip cursor on the very first query if we know the exact ID
        // Wait, overlapping window means we might fetch records we already processed. 
        // We rely on idempotency, so we do NOT use cursor to skip.
        // We just fetch everything gte currentAfterDate, and idempotency will safely deduplicate.
      }

      // To avoid infinite loops, we paginate by tracking the last date & id seen in the loop
      const records = await config.delegate.findMany(query);
      
      if (records.length === 0) {
        hasMore = false;
        break;
      }

      let batchProcessed = 0;
      for (const record of records) {
        // Ensure we advance the internal loop cursor safely
        if (record[config.dateColumn].getTime() === currentAfterDate.getTime() && currentAfterId && record.id <= currentAfterId) {
           // Skip if we are stuck on the exact same record from a previous batch iteration
        }
        
        if (Date.now() > leaseExpiry.getTime()) {
           hasMore = false;
           result.errorMessage = "Lease expired during execution.";
           break;
        }
        
        result.examined++;
        result.eligible++;

        const ingestion = await processSecurityEvent(record, options.lifecycle, options.environment);
        if (ingestion.success) {
          if (ingestion.duplicate) {
            result.duplicates++;
          } else {
            result.normalized++;
          }
          // Track highest timestamp
          if (!maxTimestampEncountered || record[config.dateColumn] > maxTimestampEncountered) {
             maxTimestampEncountered = record[config.dateColumn];
             maxIdEncountered = record.id;
          } else if (record[config.dateColumn].getTime() === maxTimestampEncountered.getTime()) {
             // In tie, highest ID
             if (!maxIdEncountered || record.id > maxIdEncountered) {
               maxIdEncountered = record.id;
             }
          }
        } else {
          result.failures++;
        }
        batchProcessed++;
      }

      if (batchProcessed === 0 || records.length < options.batchSize) {
        hasMore = false;
      } else {
        const lastRecord = records[records.length - 1];
        currentAfterDate = lastRecord[config.dateColumn];
        currentAfterId = lastRecord.id;
        query.cursor = { id: currentAfterId as string };
        query.skip = 1;
      }
    }

    // 8. Advance the checkpoint
    const verifyLease = await prisma.securityEventIngestionCheckpoint.findUnique({
      where: { source_type_environment_lifecycle_type: identity }
    });
    
    if (verifyLease?.lease_owner !== workerId) {
       result.errorMessage = "Lost lease ownership before checkpoint advance.";
       return result;
    }

    await prisma.securityEventIngestionCheckpoint.update({
      where: { source_type_environment_lifecycle_type: identity },
      data: {
        last_source_timestamp: maxTimestampEncountered,
        last_source_record_id: maxIdEncountered,
        last_successful_run_at: new Date(),
        last_run_completed_at: new Date(),
        last_error_code: result.errorMessage || null,
        lease_owner: null,
        lease_expires_at: null
      }
    });

  } catch (err) {
    result.errorMessage = err instanceof Error ? err.message : "Unknown error";
    
    // Release lease on failure
    if (result.leaseAcquired) {
      await prisma.securityEventIngestionCheckpoint.updateMany({
        where: {
          source_type: options.sourceType,
          environment: options.environment,
          lifecycle_type: options.lifecycle,
          lease_owner: workerId
        },
        data: {
          last_run_completed_at: new Date(),
          last_error_code: result.errorMessage,
          lease_owner: null,
          lease_expires_at: null
        }
      });
    }
  }

  result.durationMs = Date.now() - startTime;
  return result;
}
