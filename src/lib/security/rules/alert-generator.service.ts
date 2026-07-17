import { 
  PrismaClient, DetectionRule, SecurityEvent, RuleEvaluationLog, 
  DetectionDeduplicationStrategy, DetectionCorrelationSubject,
  AlertEvidenceRole, SecuritySeverity
} from "@prisma/client";
import { Prisma } from "@prisma/client";
import { createHmac, createHash } from "crypto";

const prisma = new PrismaClient();

export interface AlertGenerationBoundary {
  startTime: Date;
  endTime: Date;
}

export interface AlertGenerationCursor {
  evaluation_timestamp: Date;
  id: string;
}

export interface AlertGenerationResult {
  alertsCreated: number;
  nextCursor?: AlertGenerationCursor;
  hasMore: boolean;
  errors: string[];
}

export class AlertGeneratorService {
  private static readonly BATCH_SIZE = 500;

  public static async runSecurityAlertGenerationCycle(
    ruleId: string,
    ruleVersion: number,
    boundary: AlertGenerationBoundary,
    cursor?: AlertGenerationCursor
  ): Promise<AlertGenerationResult> {
    const result: AlertGenerationResult = {
      alertsCreated: 0,
      hasMore: false,
      errors: []
    };

    try {
      // 5. Re-read DetectionRule from PostgreSQL.
      const rule = await prisma.detectionRule.findUnique({
        where: { rule_id_version: { rule_id: ruleId, version: ruleVersion } }
      });

      if (!rule || rule.status !== "ACTIVE") {
        result.errors.push(`Rule ${ruleId} v${ruleVersion} is not ACTIVE or missing.`);
        return result;
      }

      // Read logs in bounds
      const logs = await prisma.ruleEvaluationLog.findMany({
        where: {
          rule_id: rule.rule_id,
          rule_version: rule.version,
          outcome: "MATCH",
          evaluation_timestamp: {
            gte: boundary.startTime,
            lte: boundary.endTime
          }
        },
        take: this.BATCH_SIZE,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor.id } : undefined,
        orderBy: [
          { evaluation_timestamp: 'asc' },
          { id: 'asc' }
        ],
        include: {
          candidate_event: true
        }
      });

      if (logs.length === this.BATCH_SIZE) {
        result.hasMore = true;
        const lastLog = logs[logs.length - 1];
        result.nextCursor = {
          evaluation_timestamp: lastLog.evaluation_timestamp,
          id: lastLog.id
        };
      }

      // Group candidate logs by subject hash and time bucket
      const grouped = new Map<string, RuleEvaluationLog[]>();

      for (const log of logs) {
        try {
          const subjectHash = this.getCorrelationSubjectHash(rule.correlation_subject_type, log.candidate_event);
          
          // Determine bucket start
          const bucketStart = this.getBucketStart(
            rule.deduplication_strategy, 
            log.candidate_event.occurred_at, 
            rule.window_seconds
          );
          
          const groupKey = `${subjectHash}::${bucketStart.getTime()}`;
          if (!grouped.has(groupKey)) grouped.set(groupKey, []);
          grouped.get(groupKey)!.push(log);
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          if (msg === "MISSING_CORRELATION_SUBJECT") {
            // Silently ignore as per requirements
          } else {
            result.errors.push(`Log ${log.id} error: ${msg}`);
          }
        }
      }

      for (const [groupKey, groupLogs] of grouped.entries()) {
        try {
          await this.processCandidateGroup(rule, groupKey, groupLogs, boundary.endTime);
          result.alertsCreated++;
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          if (msg === "IDEMPOTENCY_CONFLICT" || msg === "THRESHOLD_NOT_MET" || msg === "COOLDOWN_ACTIVE") {
            // Not an error, just skipped
          } else {
            result.errors.push(`Group ${groupKey} failed: ${msg}`);
          }
        }
      }

      return result;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      result.errors.push(`Critical cycle error: ${msg}`);
      return result;
    }
  }

  private static getCorrelationSubjectHash(subjectType: DetectionCorrelationSubject, event: SecurityEvent): string {
    const hmacKey = process.env.SOC_CORRELATION_HMAC_KEY;
    if (!hmacKey) throw new Error("Missing SOC_CORRELATION_HMAC_KEY");

    if (subjectType === "GLOBAL") {
      return "GLOBAL_CORRELATION_CONSTANT";
    }

    let rawValue: string | null = null;
    switch (subjectType) {
      case "ACTOR_USER_ID":
        rawValue = event.actor_user_id;
        break;
      case "TARGET_USER_ID":
        rawValue = event.target_user_id;
        break;
      case "TARGET_RESOURCE_ID":
        rawValue = event.target_resource_id;
        break;
    }

    if (!rawValue) {
      throw new Error("MISSING_CORRELATION_SUBJECT");
    }

    const canonicalInput = `${subjectType}:${rawValue.length}:${rawValue}`;
    return createHmac("sha256", hmacKey).update(canonicalInput).digest("hex");
  }

  private static getBucketStart(strategy: DetectionDeduplicationStrategy, occurredAt: Date, windowSeconds: number): Date {
    if (strategy === "WINDOW_BUCKET") {
      const bucketMs = windowSeconds * 1000;
      return new Date(Math.floor(occurredAt.getTime() / bucketMs) * bucketMs);
    } else {
      // EXACT_MATCH: Window starts exactly at the event time
      return occurredAt;
    }
  }

  private static async processCandidateGroup(
    rule: DetectionRule, 
    groupKey: string, 
    initialLogs: RuleEvaluationLog[],
    generationCutoff: Date
  ) {
    const [subjectHash, bucketStartMsStr] = groupKey.split("::");
    const bucketStartMs = parseInt(bucketStartMsStr, 10);
    const windowStart = new Date(bucketStartMs);
    const windowEnd = new Date(bucketStartMs + rule.window_seconds * 1000);

    // 15. Revalidate logs inside the transaction
    await prisma.$transaction(async (tx) => {
      // Re-read rule
      const txRule = await tx.detectionRule.findUnique({
        where: { rule_id_version: { rule_id: rule.rule_id, version: rule.version } }
      });

      if (!txRule || txRule.status !== "ACTIVE") {
        throw new Error("THRESHOLD_NOT_MET"); // Skip cleanly
      }

      // To enforce threshold robustly regardless of batch size, we fetch ALL matched candidate events
      // for this specific rule + subject + window from DB directly in transaction.
      // However, we only have logs. We query logs whose candidate_event matches.
      // Since filtering by nested relation is heavy, we'll build a direct query for candidate events
      // that have MATCH logs for this rule.
      
      const allLogsForGroup = await tx.ruleEvaluationLog.findMany({
        where: {
          rule_id: txRule.rule_id,
          rule_version: txRule.version,
          outcome: "MATCH",
          candidate_event: {
            occurred_at: {
              gte: windowStart,
              lte: windowEnd
            }
          }
        },
        include: { candidate_event: true }
      });

      // Filter exactly
      let validEvents = allLogsForGroup
        .map(l => l.candidate_event)
        .filter(ev => {
          // Exclude future-dated events beyond the fixed generation cutoff
          if (ev.occurred_at > generationCutoff) return false;
          // Must match the correlation subject
          try {
            const h = this.getCorrelationSubjectHash(txRule.correlation_subject_type, ev);
            return h === subjectHash;
          } catch {
            return false;
          }
        });

      // Deduplicate distinct event IDs
      const uniqueEventsMap = new Map<string, SecurityEvent>();
      for (const ev of validEvents) {
        if (!uniqueEventsMap.has(ev.id)) uniqueEventsMap.set(ev.id, ev);
      }
      
      validEvents = Array.from(uniqueEventsMap.values());
      validEvents.sort((a, b) => {
        if (a.occurred_at.getTime() !== b.occurred_at.getTime()) {
          return a.occurred_at.getTime() - b.occurred_at.getTime();
        }
        return a.id.localeCompare(b.id);
      });

      if (validEvents.length < txRule.threshold_count) {
        throw new Error("THRESHOLD_NOT_MET");
      }

      // Cap evidence
      const evidenceEvents = validEvents.slice(0, txRule.max_evidence_events);

      // Suppression key canonical tuple
      // Exact DetectionRule database ID, Exact rule version, Environment, Lifecycle, Correlation-subject type, Correlation-subject hash, Approved deduplication window or strategy identity
      const deduplicationIdentity = txRule.deduplication_strategy === "WINDOW_BUCKET" 
        ? windowStart.toISOString() 
        : evidenceEvents[0].id; // For EXACT_MATCH, the first event ID anchors the window
      
      // Use exact environment and lifecycle from the first event (all logs should match)
      const env = evidenceEvents[0].environment;
      const lifecycle = evidenceEvents[0].lifecycle_type;

      const suppressionInput = JSON.stringify([
        txRule.id,
        txRule.version,
        env,
        lifecycle,
        txRule.correlation_subject_type,
        subjectHash,
        deduplicationIdentity
      ]);
      const suppressionKey = createHash("sha256").update(suppressionInput).digest("hex");

      // Evidence digest
      const evidenceIds = evidenceEvents.map(e => e.id);
      const evidenceInput = JSON.stringify(evidenceIds);
      const evidenceDigest = createHash("sha256").update(evidenceInput).digest("hex");

      // Check for existing alert
      const existingAlert = await tx.securityAlert.findUnique({
        where: { suppression_key: suppressionKey }
      });

      if (existingAlert) {
        if (
          existingAlert.rule_id === txRule.rule_id &&
          existingAlert.rule_version === txRule.version &&
          existingAlert.correlation_subject_hash === subjectHash &&
          existingAlert.environment === env &&
          existingAlert.lifecycle_type === lifecycle &&
          existingAlert.evidence_digest === evidenceDigest
        ) {
          // Idempotent success, skip
          throw new Error("THRESHOLD_NOT_MET");
        } else {
          throw new Error("IDEMPOTENCY_CONFLICT");
        }
      }

      // Cooldown enforcement
      // A qualifying group outside cooldown may create a new alert only when allowed by the approved deduplication strategy.
      const lastAlert = await tx.securityAlert.findFirst({
        where: {
          rule_id: txRule.rule_id,
          rule_version: txRule.version,
          correlation_subject_hash: subjectHash,
          environment: env,
          lifecycle_type: lifecycle
        },
        orderBy: { created_at: 'desc' }
      });

      if (lastAlert) {
        const timeSinceLast = Date.now() - lastAlert.created_at.getTime();
        if (timeSinceLast < txRule.cooldown_seconds * 1000) {
          throw new Error("COOLDOWN_ACTIVE");
        }
      }

      // Confidence and Severity
      let finalConfidence = new Prisma.Decimal(txRule.base_confidence_score);
      if (txRule.confidence_formula === "BASE_PLUS_EVIDENCE_MULTIPLIER" && txRule.confidence_increment_per_evidence) {
        const extraEvidence = Math.max(0, evidenceEvents.length - txRule.threshold_count);
        finalConfidence = finalConfidence.add(new Prisma.Decimal(extraEvidence).mul(new Prisma.Decimal(txRule.confidence_increment_per_evidence)));
      }
      // Clamp 0-100
      if (finalConfidence.gt(100)) finalConfidence = new Prisma.Decimal(100);
      if (finalConfidence.lt(0)) finalConfidence = new Prisma.Decimal(0);

      const severities = ["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"];
      let finalSeverityIndex = severities.indexOf(txRule.base_severity);
      
      if (txRule.severity_promotion_threshold && evidenceEvents.length >= txRule.severity_promotion_threshold) {
        if (txRule.promoted_severity) {
          const promoIndex = severities.indexOf(txRule.promoted_severity);
          if (promoIndex > finalSeverityIndex) {
            finalSeverityIndex = promoIndex;
          }
        }
      }
      const finalSeverity = severities[finalSeverityIndex] as SecuritySeverity;
      const alertReference = `ALT-${Date.now().toString(36)}-${createHash("md5").update(suppressionKey).digest("hex").substring(0, 6)}`.toUpperCase();

      // Create alert and evidence in one atomic statement (Prisma nested create)
      const primaryEvent = evidenceEvents[0];
      
      const evidenceCreates = evidenceEvents.map((ev, index) => ({
        event_id: ev.id,
        evidence_role: (index === 0 ? "PRIMARY" : "SUPPORTING") as AlertEvidenceRole
      }));

      const createdAlert = await tx.securityAlert.create({
        data: {
          alert_reference: alertReference,
          suppression_key: suppressionKey,
          evidence_digest: evidenceDigest,
          rule_id: txRule.rule_id,
          rule_version: txRule.version,
          primary_event_id: primaryEvent.id,
          result_classification: txRule.result_classification,
          base_severity: txRule.base_severity,
          final_severity: finalSeverity,
          base_confidence: txRule.base_confidence_score,
          final_confidence: finalConfidence.toNumber(), // Decimal to Int since schema expects Int for confidence
          confidence_basis: txRule.confidence_formula,
          classification_reason: `Threshold of ${txRule.threshold_count} met for ${txRule.result_classification}`,
          lifecycle_type: lifecycle,
          environment: env,
          correlation_subject_type: txRule.correlation_subject_type,
          correlation_hash_key_version: "v1",
          correlation_subject_hash: subjectHash,
          window_bucket_start: windowStart,
          window_start: windowStart,
          window_end: windowEnd,
          first_event_timestamp: primaryEvent.occurred_at,
          last_event_timestamp: evidenceEvents[evidenceEvents.length - 1].occurred_at,
          event_count: evidenceEvents.length,
          evidence: {
            create: evidenceCreates
          }
        }
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          action: "SECURITY_ALERT_CREATED",
          module: "SOC_DETECTION_ANALYTICS",
          target_id: createdAlert.id,
          details: JSON.stringify({
            alert_reference: alertReference,
            rule_id: txRule.rule_id,
            version: txRule.version
          })
        }
      });

    });
  }
}
