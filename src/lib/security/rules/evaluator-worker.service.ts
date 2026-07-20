import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

import { 
  SecurityEnvironment, 
  SecurityLifecycle, 
  DetectionRuleStatus,
  RuleEvaluationOutcome,
} from "@prisma/client";
import { evaluateRuleDsl } from "./dsl/evaluator";
import * as crypto from "crypto";

const MAX_EVENTS_PER_BATCH = 500;
export const MAX_RULES_PER_CYCLE = 100;
const LEASE_DURATION_MS = 60 * 1000; // 60 seconds
const CYCLE_DEADLINE_MS = 45 * 1000; // 45 seconds
const SAFETY_MARGIN_MS = 15 * 1000; // 15 seconds
const INITIAL_LOOKBACK_DAYS = 7;
const MAX_BATCHES_PER_RULE = 10;

export interface DetectionRuleCursor {
  created_at: Date;
  id: string;
}

export interface RunCycleOptions {
  ruleCursor?: DetectionRuleCursor;
  workerToken?: string;
  environments?: SecurityEnvironment[];
  lifecycles?: SecurityLifecycle[];
}

export type CycleResult = {
  success: boolean;
  rulesProcessed: number;
  eventsEvaluated: number;
  errors: string[];
  reason?: string;
  nextRuleCursor?: { created_at: Date; id: string };
};

export async function runDetectionEvaluationCycle(
  options: RunCycleOptions = {}
): Promise<CycleResult> {
  const dbTimeRaw = await prisma.$queryRaw<[{ now: Date }]>`SELECT NOW() as now`;
  const dbNow = dbTimeRaw[0].now;
  const workerToken = options.workerToken || crypto.randomUUID();
  const deadlineTime = dbNow.getTime() + CYCLE_DEADLINE_MS;
  const cycleCutoff = new Date(dbNow.getTime() - SAFETY_MARGIN_MS);

  const result: CycleResult = {
    success: true,
    rulesProcessed: 0,
    eventsEvaluated: 0,
    errors: [],
  };

  try {
    // 1. Bound active-rule selection
    const activeRules = await prisma.detectionRule.findMany({
      where: {
        status: DetectionRuleStatus.ACTIVE,
        ...(options.ruleCursor ? {
          OR: [
            { created_at: { gt: options.ruleCursor.created_at } },
            {
              created_at: options.ruleCursor.created_at,
              id: { gt: options.ruleCursor.id }
            }
          ]
        } : {})
      },
      orderBy: [
        { created_at: "asc" },
        { id: "asc" },
      ],
      take: MAX_RULES_PER_CYCLE, // bounded active-rule selection
    });
    
    if (activeRules.length === MAX_RULES_PER_CYCLE) {
      const lastRule = activeRules[activeRules.length - 1];
      result.nextRuleCursor = { created_at: lastRule.created_at, id: lastRule.id };
    }

    const environments = options.environments || Object.values(SecurityEnvironment);
    const lifecycles = options.lifecycles || Object.values(SecurityLifecycle);

    for (const rule of activeRules) {
      if (Date.now() >= deadlineTime) {
        result.errors.push("DEADLINE_REACHED");
        break;
      }

      try {
        if (rule.status !== DetectionRuleStatus.ACTIVE) continue;

        let ruleEventsEvaluated = 0;
        
        // Checkpoints are maintained per environment and lifecycle
        for (const env of environments) {
          for (const lc of lifecycles) {
            if (Date.now() >= deadlineTime) break;
            const res = await processRuleCheckpoint(rule, env, lc, workerToken, dbNow, deadlineTime, cycleCutoff);
            ruleEventsEvaluated += res.eventsEvaluated;
          }
        }
        
        result.eventsEvaluated += ruleEventsEvaluated;
        result.rulesProcessed++;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        result.errors.push(`Rule ${rule.rule_id} failed: ${msg}`);
        console.error(`Error processing rule ${rule.rule_id}:`, e);
      }
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    result.success = false;
    result.errors.push(`DATABASE_ERROR: ${msg}`);
  }

  return result;
}

async function processRuleCheckpoint(
  rule: import("@prisma/client").DetectionRule,
  env: SecurityEnvironment,
  lc: SecurityLifecycle,
  workerToken: string,
  now: Date,
  deadlineMs: number,
  cycleCutoff: Date
): Promise<{ eventsEvaluated: number }> {
  const checkpointIdentity = {
    rule_id: rule.rule_id,
    rule_version: rule.version,
    environment: env,
    lifecycle_type: lc,
  };

  // Ensure checkpoint exists
  let checkpointId: string;
  const existing = await prisma.detectionEvaluationCheckpoint.findUnique({
    where: {
      rule_id_rule_version_environment_lifecycle_type: {
        rule_id: rule.rule_id,
        rule_version: rule.version,
        environment: env,
        lifecycle_type: lc,
      }
    },
    select: { id: true, cursor_timestamp: true }
  });

  if (existing) {
    checkpointId = existing.id;
  } else {
    try {
      const initialTimestamp = new Date(now.getTime() - INITIAL_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
      const created = await prisma.detectionEvaluationCheckpoint.create({
        data: {
          ...checkpointIdentity,
          cursor_timestamp: initialTimestamp,
        },
      });
      checkpointId = created.id;
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'code' in e && e.code === "P2002") {
        const retry = await prisma.detectionEvaluationCheckpoint.findUnique({
          where: { rule_id_rule_version_environment_lifecycle_type: checkpointIdentity },
          select: { id: true }
        });
        if (!retry) throw new Error("CHECKPOINT_CREATION_FAILED_RETRY");
        checkpointId = retry.id;
      } else {
        throw e;
      }
    }
  }

  const leaseExpiresAt = new Date(Date.now() + LEASE_DURATION_MS);

  // Atomic lease acquisition using PostgreSQL-authoritative time
  const acquireResult = await prisma.detectionEvaluationCheckpoint.updateMany({
    where: {
      id: checkpointId,
      OR: [
        { lease_owner: null },
        { lease_expires_at: { lt: now } }
      ]
    },
    data: {
      lease_owner: workerToken,
      lease_expires_at: leaseExpiresAt,
      last_run_started_at: now,
    }
  });

  if (acquireResult.count === 0) {
    throw new Error("LEASE_NOT_ACQUIRED");
  }

  const hasLease = true;
  let eventsEvaluated = 0;

  try {
    // Process batches
    let batchCount = 0;
    while (Date.now() < deadlineMs && hasLease) {
      const currentCheckpoint = await prisma.detectionEvaluationCheckpoint.findUnique({
        where: { id: checkpointId },
      });

      if (!currentCheckpoint || currentCheckpoint.lease_owner !== workerToken) {
        throw new Error("LEASE_LOST");
      }

      let cursorTimestamp = currentCheckpoint.cursor_timestamp;
      const cursorEventId = currentCheckpoint.cursor_event_id;

      if (!cursorTimestamp) {
        const lookbackDate = new Date(now);
        lookbackDate.setDate(lookbackDate.getDate() - INITIAL_LOOKBACK_DAYS);
        cursorTimestamp = lookbackDate;
      }

      const events = await fetchEventsBatch(
        rule,
        env,
        lc,
        cursorTimestamp,
        cursorEventId,
        cycleCutoff
      );

      if (events.length === 0) {
        break; // No more events
      }

      const txDbTimeRaw = await prisma.$queryRaw<[{ now: Date }]>`SELECT NOW() as now`;
      const txDbNow = txDbTimeRaw[0].now;

      await processBatchTransaction(
        events,
        rule,
        checkpointId,
        workerToken,
        txDbNow,
        cursorTimestamp,
        cursorEventId
      );

      eventsEvaluated += events.length;
      batchCount++;

      if (events.length < MAX_EVENTS_PER_BATCH || batchCount >= MAX_BATCHES_PER_RULE) {
        break; // End of available data or max batches reached
      }
    }
  } finally {
    if (hasLease) {
      await prisma.detectionEvaluationCheckpoint.updateMany({
        where: {
          id: checkpointId,
          lease_owner: workerToken,
        },
        data: {
          lease_owner: null,
          lease_expires_at: null,
          last_run_completed_at: new Date(),
        }
      });
    }
  }

  return { eventsEvaluated };
}

async function fetchEventsBatch(
  rule: import("@prisma/client").DetectionRule,
  environment: SecurityEnvironment,
  lifecycle: SecurityLifecycle,
  cursorTimestamp: Date,
  cursorEventId: string | null,
  cutoffTime: Date
) {
  const whereClause: import("@prisma/client").Prisma.SecurityEventWhereInput = {
    environment,
    lifecycle_type: lifecycle,
    security_domain: rule.security_domain,
    occurred_at: {
      lte: cutoffTime,
    }
  };

  if (cursorEventId) {
    whereClause.OR = [
      { occurred_at: { gt: cursorTimestamp, lte: cutoffTime } },
      { 
        occurred_at: cursorTimestamp,
        id: { gt: cursorEventId }
      }
    ];
  } else {
    whereClause.occurred_at = {
      lte: cutoffTime,
      gt: cursorTimestamp
    };
  }

  const results = await prisma.securityEvent.findMany({
    where: whereClause,
    orderBy: [
      { occurred_at: "asc" },
      { id: "asc" },
    ],
    take: MAX_EVENTS_PER_BATCH,
    select: {
      id: true,
      event_code: true,
      occurred_at: true,
      environment: true,
      lifecycle_type: true,
      security_domain: true,
      source_type: true,
      event_category: true,
      event_classification: true,
      correlation_key: true,
      action_attempted: true,
      action_result: true,
      severity: true,
      actor_user_id: true,
      target_user_id: true,
      target_resource_id: true,
      target_module: true,
    }
  });

  return results;
}

async function processBatchTransaction(
  events: Array<Record<string, unknown> & { id: string, occurred_at: Date, lifecycle_type: SecurityLifecycle, environment: SecurityEnvironment }>,
  rule: import("@prisma/client").DetectionRule,
  checkpointId: string,
  workerToken: string,
  now: Date,
  previousCursorTimestamp: Date,
  previousCursorEventId: string | null
) {
  const dslPayload = rule.evaluation_dsl as Record<string, unknown>;
  const logsToCreate: Array<import("@prisma/client").Prisma.RuleEvaluationLogCreateManyInput> = [];
  
  let maxTimestamp = events[0].occurred_at;
  let maxId = events[0].id;

  for (const event of events) {
    let outcome: RuleEvaluationOutcome = RuleEvaluationOutcome.NO_MATCH;
    let errorCode: string | undefined;

    try {
      const isMatch = evaluateRuleDsl(dslPayload, event);
      outcome = isMatch ? RuleEvaluationOutcome.MATCH : RuleEvaluationOutcome.NO_MATCH;
    } catch {
      outcome = RuleEvaluationOutcome.ERROR;
      errorCode = "RULE_VALIDATION_FAILED";
    }

    const canonical = `RULE:${rule.id}:V:${rule.version}:EVT:${event.id}`;
    const identityKey = crypto.createHash("sha256").update(canonical).digest("hex");

    logsToCreate.push({
      evaluation_identity_key: identityKey,
      attempt_number: 1,
      rule_id: rule.rule_id,
      rule_version: rule.version,
      candidate_event_id: event.id,
      outcome,
      matched_event_count: 1,
      execution_duration_ms: 1,
      privacy_safe_error_code: errorCode,
      lifecycle_type: event.lifecycle_type,
      environment: event.environment,
      evaluation_timestamp: now,
    });

    if (
      event.occurred_at > maxTimestamp || 
      (event.occurred_at.getTime() === maxTimestamp.getTime() && event.id > maxId)
    ) {
      maxTimestamp = event.occurred_at;
      maxId = event.id;
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Reconfirm rule remains ACTIVE
      const currentRule = await tx.detectionRule.findUnique({
        where: { id: rule.id }
      });

      if (!currentRule || currentRule.status !== DetectionRuleStatus.ACTIVE) {
        throw new Error("RULE_NOT_ACTIVE");
      }

      // 2. Prevent duplicate/idempotent log overwriting
      for (const log of logsToCreate) {
        const existingLog = await tx.ruleEvaluationLog.findUnique({
          where: { evaluation_identity_key_attempt_number: { evaluation_identity_key: log.evaluation_identity_key as string, attempt_number: 1 } }
        });
        
        if (existingLog) {
          if (
            existingLog.rule_id !== log.rule_id ||
            existingLog.rule_version !== log.rule_version ||
            existingLog.candidate_event_id !== log.candidate_event_id ||
            existingLog.outcome !== log.outcome
          ) {
            throw new Error(`IDEMPOTENCY_CONFLICT: Log mismatch for ${log.evaluation_identity_key}`);
          }
        } else {
          await tx.ruleEvaluationLog.create({
            data: log
          });
        }
      }

      // 3. Advance checkpoint cursor (True Compare-and-Set)
      const updateCount = await tx.detectionEvaluationCheckpoint.updateMany({
        where: {
          id: checkpointId,
          lease_owner: workerToken,
          lease_expires_at: { gt: now },
          cursor_timestamp: previousCursorTimestamp,
          cursor_event_id: previousCursorEventId
        },
        data: {
          cursor_timestamp: maxTimestamp,
          cursor_event_id: maxId,
          last_successful_run_at: now,
        }
      });

      if (updateCount.count === 0) {
        throw new Error("CURSOR_CONFLICT");
      }
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg === "CURSOR_CONFLICT" || msg === "RULE_NOT_ACTIVE" || msg.startsWith("IDEMPOTENCY_CONFLICT")) {
      throw e;
    }
    throw new Error(`BATCH_TRANSACTION_FAILED: ${msg}`);
  }
}
