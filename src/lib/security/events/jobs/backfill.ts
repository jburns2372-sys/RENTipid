import { PrismaClient } from "@prisma/client";
import { processSecurityEvent } from "../event-ingestion";
import { SecurityLifecycle, SecurityEnvironment } from "../taxonomy";

const prisma = new PrismaClient();

export interface BackfillOptions {
  sourceType: string;
  batchSize: number;
  dryRun: boolean;
  lifecycle: SecurityLifecycle;
  environment: SecurityEnvironment;
  afterId?: string;
  beforeDate?: Date;
  maxRecords?: number;
}

export interface BackfillResult {
  examined: number;
  eligible: number;
  normalized: number;
  duplicates: number;
  failures: number;
  skipped: number;
  firstCursor?: string;
  finalCursor?: string;
  durationMs: number;
}

export async function runBackfill(options: BackfillOptions): Promise<BackfillResult> {
  const startTime = Date.now();
  const result: BackfillResult = {
    examined: 0,
    eligible: 0,
    normalized: 0,
    duplicates: 0,
    failures: 0,
    skipped: 0,
    durationMs: 0
  };

  // Maps source types to Prisma delegate and timestamp column.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sourceConfig: Record<string, { delegate: any; dateColumn: string }> = {
    "AUDIT_LOG": { delegate: prisma.auditLog, dateColumn: "created_at" },
    "SYSTEM_SETTING": { delegate: prisma.systemSetting, dateColumn: "updated_at" },
    // AIBotLog, PaymentWebhookLog, PaymentReconciliationLog, VerificationDocument, DamageClaim, DisputeCase, InspectionReport
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
    throw new Error(`Unsupported source type for backfill: ${options.sourceType}`);
  }

  let cursor = options.afterId;
  let hasMore = true;

  while (hasMore) {
    if (options.maxRecords && result.examined >= options.maxRecords) {
      break;
    }

    const takeCount = Math.min(
      options.batchSize,
      options.maxRecords ? options.maxRecords - result.examined : options.batchSize
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {
      take: takeCount,
      orderBy: [
        { [config.dateColumn]: "asc" },
        { id: "asc" }
      ]
    };

    if (cursor) {
      query.cursor = { id: cursor };
      query.skip = 1; 
    }

    if (options.beforeDate) {
      query.where = { [config.dateColumn]: { lt: options.beforeDate } };
    }

    const records = await config.delegate.findMany(query);
    if (records.length === 0) {
      hasMore = false;
      break;
    }

    if (!result.firstCursor) {
      result.firstCursor = records[0].id;
    }

    for (const record of records) {
      result.examined++;
      result.eligible++;

      if (!options.dryRun) {
        const ingestionResult = await processSecurityEvent(record, options.lifecycle, options.environment);
        if (ingestionResult.success) {
          if (ingestionResult.duplicate) {
            result.duplicates++;
          } else {
            result.normalized++;
          }
        } else {
          result.failures++;
        }
      } else {
        result.skipped++;
      }
      cursor = record.id;
      result.finalCursor = cursor;
    }
  }

  result.durationMs = Date.now() - startTime;
  return result;
}
