import { PrismaClient, Prisma, DetectionRuleStatus, SecuritySeverity, DetectionCorrelationSubject, DetectionDeduplicationStrategy, DetectionConfidenceFormula, DetectionRuleCreatorType } from "@prisma/client";
import { SOURCE_COMPATIBILITY_REGISTRY, CompatibilityStatus } from "./source-compatibility.registry";
import { validateRuleConfiguration, RuleTypedConfiguration } from "./rule-validation.service";

const prisma = new PrismaClient();

function canonicalize(obj: unknown): unknown {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(canonicalize);
  if (typeof obj === 'object') {
    const keys = Object.keys(obj).sort();
    const result: Record<string, unknown> = {};
    for (const key of keys) {
      const val = (obj as Record<string, unknown>)[key];
      if (val !== undefined) {
        result[key] = canonicalize(val);
      }
    }
    return result;
  }
  return obj;
}

export interface RuleDefinition extends RuleTypedConfiguration {
  rule_id: string;
  version: number;
  status: DetectionRuleStatus;
  created_by_type: DetectionRuleCreatorType;
  evaluation_dsl: Prisma.InputJsonValue;
}

const INITIAL_RULES: readonly RuleDefinition[] = [
  {
    rule_id: "PAY-WEBHOOK-FAIL-01",
    version: 1,
    name: "Payment Webhook Failure Spike",
    description: "Detects multiple failed payment webhooks which may indicate tampering or replay attacks.",
    status: DetectionRuleStatus.DRAFT,
    security_domain: "PAYMENT_SECURITY",
    result_classification: "POLICY_VIOLATION",
    base_severity: SecuritySeverity.HIGH,
    base_confidence_score: 75,
    threshold_count: 5,
    window_seconds: 300,
    cooldown_seconds: 3600,
    max_evidence_events: 10,
    evaluation_timeout_ms: 1000,
    correlation_subject_type: DetectionCorrelationSubject.GLOBAL,
    deduplication_strategy: DetectionDeduplicationStrategy.WINDOW_BUCKET,
    confidence_formula: DetectionConfidenceFormula.STATIC_BASE,
    confidence_increment_per_evidence: null,
    severity_promotion_threshold: null,
    promoted_severity: null,
    created_by_type: DetectionRuleCreatorType.SYSTEM_SEED,
    evaluation_dsl: {
      AND: [
        { field: "event_code", operator: "CONTAINS", value: "WEBHOOK_" },
        { field: "event_classification", operator: "EQUALS", value: "POLICY_VIOLATION" }
      ]
    }
  },
  {
    rule_id: "SECURITY-SETTING-CHANGE-01",
    version: 1,
    name: "Critical Security Setting Modification",
    description: "Detects modification of critical security or payment settings.",
    status: DetectionRuleStatus.DRAFT,
    security_domain: "ADMINISTRATIVE_SECURITY",
    result_classification: "POLICY_VIOLATION",
    base_severity: SecuritySeverity.HIGH,
    base_confidence_score: 90,
    threshold_count: 1,
    window_seconds: 60,
    cooldown_seconds: 0,
    max_evidence_events: 1,
    evaluation_timeout_ms: 1000,
    correlation_subject_type: DetectionCorrelationSubject.ACTOR_USER_ID,
    deduplication_strategy: DetectionDeduplicationStrategy.EXACT_MATCH,
    confidence_formula: DetectionConfidenceFormula.STATIC_BASE,
    confidence_increment_per_evidence: null,
    severity_promotion_threshold: null,
    promoted_severity: null,
    created_by_type: DetectionRuleCreatorType.SYSTEM_SEED,
    evaluation_dsl: {
      AND: [
        { field: "event_code", operator: "CONTAINS", value: "SETTING_" },
        { field: "event_classification", operator: "EQUALS", value: "POLICY_VIOLATION" }
      ]
    }
  },
  {
    rule_id: "API-RATE-ABUSE-01",
    version: 1,
    name: "API Rate Abuse",
    description: "Detects repeated material rate-limit violations correlated by source, policy, and route.",
    status: DetectionRuleStatus.DRAFT,
    security_domain: "APPLICATION_RELIABILITY",
    result_classification: "SUSPICIOUS_ACTIVITY",
    base_severity: SecuritySeverity.MEDIUM,
    base_confidence_score: 80,
    threshold_count: 5,
    window_seconds: 900,
    cooldown_seconds: 3600,
    max_evidence_events: 10,
    evaluation_timeout_ms: 1000,
    correlation_subject_type: DetectionCorrelationSubject.CORRELATION_KEY,
    deduplication_strategy: DetectionDeduplicationStrategy.WINDOW_BUCKET,
    confidence_formula: DetectionConfidenceFormula.STATIC_BASE,
    confidence_increment_per_evidence: null,
    severity_promotion_threshold: null,
    promoted_severity: null,
    created_by_type: DetectionRuleCreatorType.SYSTEM_SEED,
    evaluation_dsl: {
      AND: [
        { field: "event_code", operator: "EQUALS", value: "API_RATE_LIMIT_EXCEEDED" }
      ]
    }
  },
  {
    rule_id: "API-AUTHORIZATION-PROBE-01",
    version: 1,
    name: "API Authorization Probing",
    description: "Detects repeated protected API denials.",
    status: DetectionRuleStatus.DRAFT,
    security_domain: "IDENTITY_AND_ACCESS",
    result_classification: "POLICY_VIOLATION",
    base_severity: SecuritySeverity.MEDIUM,
    base_confidence_score: 85,
    threshold_count: 10,
    window_seconds: 300,
    cooldown_seconds: 3600,
    max_evidence_events: 10,
    evaluation_timeout_ms: 1000,
    correlation_subject_type: DetectionCorrelationSubject.CORRELATION_KEY,
    deduplication_strategy: DetectionDeduplicationStrategy.WINDOW_BUCKET,
    confidence_formula: DetectionConfidenceFormula.STATIC_BASE,
    confidence_increment_per_evidence: null,
    severity_promotion_threshold: null,
    promoted_severity: null,
    created_by_type: DetectionRuleCreatorType.SYSTEM_SEED,
    evaluation_dsl: {
      AND: [
        { field: "event_code", operator: "EQUALS", value: "API_AUTHORIZATION_DENIED" }
      ]
    }
  },
  {
    rule_id: "API-RESOURCE-ENUMERATION-01",
    version: 1,
    name: "API Resource Enumeration",
    description: "UNVERIFIED rule for API resource enumeration.",
    status: DetectionRuleStatus.DRAFT,
    security_domain: "APPLICATION_RELIABILITY",
    result_classification: "SUSPICIOUS_ACTIVITY",
    base_severity: SecuritySeverity.MEDIUM,
    base_confidence_score: 50,
    threshold_count: 20,
    window_seconds: 60,
    cooldown_seconds: 900,
    max_evidence_events: 20,
    evaluation_timeout_ms: 1000,
    correlation_subject_type: DetectionCorrelationSubject.GLOBAL,
    deduplication_strategy: DetectionDeduplicationStrategy.WINDOW_BUCKET,
    confidence_formula: DetectionConfidenceFormula.STATIC_BASE,
    confidence_increment_per_evidence: null,
    severity_promotion_threshold: null,
    promoted_severity: null,
    created_by_type: DetectionRuleCreatorType.SYSTEM_SEED,
    evaluation_dsl: {
      AND: [
        { field: "event_code", operator: "EQUALS", value: "API_RESOURCE_ENUMERATION_SIGNAL" }
      ]
    }
  },
  {
    rule_id: "WEB-CSRF-FAILURE-01",
    version: 1,
    name: "Web CSRF Failure",
    description: "UNVERIFIED rule for CSRF failures.",
    status: DetectionRuleStatus.DRAFT,
    security_domain: "APPLICATION_RELIABILITY",
    result_classification: "SUSPICIOUS_ACTIVITY",
    base_severity: SecuritySeverity.HIGH,
    base_confidence_score: 90,
    threshold_count: 5,
    window_seconds: 300,
    cooldown_seconds: 900,
    max_evidence_events: 10,
    evaluation_timeout_ms: 1000,
    correlation_subject_type: DetectionCorrelationSubject.GLOBAL,
    deduplication_strategy: DetectionDeduplicationStrategy.WINDOW_BUCKET,
    confidence_formula: DetectionConfidenceFormula.STATIC_BASE,
    confidence_increment_per_evidence: null,
    severity_promotion_threshold: null,
    promoted_severity: null,
    created_by_type: DetectionRuleCreatorType.SYSTEM_SEED,
    evaluation_dsl: {
      AND: [
        { field: "event_code", operator: "EQUALS", value: "WEB_CSRF_VALIDATION_FAILED" }
      ]
    }
  },
  {
    rule_id: "BOT-SCRAPING-01",
    version: 1,
    name: "Bot Scraping",
    description: "UNVERIFIED rule for bot scraping.",
    status: DetectionRuleStatus.DRAFT,
    security_domain: "APPLICATION_RELIABILITY",
    result_classification: "SUSPICIOUS_ACTIVITY",
    base_severity: SecuritySeverity.MEDIUM,
    base_confidence_score: 50,
    threshold_count: 50,
    window_seconds: 300,
    cooldown_seconds: 3600,
    max_evidence_events: 20,
    evaluation_timeout_ms: 1000,
    correlation_subject_type: DetectionCorrelationSubject.GLOBAL,
    deduplication_strategy: DetectionDeduplicationStrategy.WINDOW_BUCKET,
    confidence_formula: DetectionConfidenceFormula.STATIC_BASE,
    confidence_increment_per_evidence: null,
    severity_promotion_threshold: null,
    promoted_severity: null,
    created_by_type: DetectionRuleCreatorType.SYSTEM_SEED,
    evaluation_dsl: {
      AND: [
        { field: "event_code", operator: "EQUALS", value: "BOT_SCRAPING_SIGNAL" }
      ]
    }
  },
  {
    rule_id: "BOT-BOOKING-ABUSE-01",
    version: 1,
    name: "Bot Booking Abuse",
    description: "UNVERIFIED and DEFERRED rule for bot booking abuse.",
    status: DetectionRuleStatus.DRAFT,
    security_domain: "APPLICATION_RELIABILITY",
    result_classification: "SUSPICIOUS_ACTIVITY",
    base_severity: SecuritySeverity.HIGH,
    base_confidence_score: 95,
    threshold_count: 5,
    window_seconds: 60,
    cooldown_seconds: 3600,
    max_evidence_events: 10,
    evaluation_timeout_ms: 1000,
    correlation_subject_type: DetectionCorrelationSubject.GLOBAL,
    deduplication_strategy: DetectionDeduplicationStrategy.WINDOW_BUCKET,
    confidence_formula: DetectionConfidenceFormula.STATIC_BASE,
    confidence_increment_per_evidence: null,
    severity_promotion_threshold: null,
    promoted_severity: null,
    created_by_type: DetectionRuleCreatorType.SYSTEM_SEED,
    evaluation_dsl: {
      AND: [
        { field: "event_code", operator: "EQUALS", value: "BOT_BOOKING_AUTOMATION_SIGNAL" }
      ]
    }
  }
];

export type InitializationResult = "CREATED" | "ALREADY_INITIALIZED_EQUIVALENT" | "INITIALIZATION_CONFLICT" | "ERROR";

export function internalValidateRuleCompatibilityAndDsl(
  ruleDef: RuleDefinition,
  registry: Record<string, { status: CompatibilityStatus; writerLocations?: string[]; sourceType?: string; correlationFields?: string[] }>
): void {
  const registryEntry = registry[ruleDef.rule_id];
  if (!registryEntry || registryEntry.status !== CompatibilityStatus.COMPATIBLE) {
    throw new Error("UNSUPPORTED_SOURCE");
  }
  if (!registryEntry.writerLocations || registryEntry.writerLocations.length === 0) {
    throw new Error("SOURCE_WRITER_UNVERIFIED");
  }
  if (!registryEntry.sourceType) {
    throw new Error("REQUIRED_SOURCE_FIELD_MISSING");
  }
  if (!registryEntry.correlationFields || registryEntry.correlationFields.length === 0) {
    throw new Error("CORRELATION_FIELD_MISSING");
  }

  const dslValidation = validateRuleConfiguration(ruleDef, ruleDef.evaluation_dsl);
  if (!dslValidation.valid) {
    throw new Error("INVALID_DSL");
  }
}

export function validateRuleCompatibilityAndDsl(ruleDef: RuleDefinition): void {
  internalValidateRuleCompatibilityAndDsl(ruleDef, SOURCE_COMPATIBILITY_REGISTRY);
}

export class RuleInitializationService {
  static async initializeInitialDrafts(actorUserId: string): Promise<{ rule_id: string, result: InitializationResult, message?: string }[]> {
    const results: { rule_id: string, result: InitializationResult, message?: string }[] = [];

    for (const ruleDef of INITIAL_RULES) {
      try {
        validateRuleCompatibilityAndDsl(ruleDef);

        await prisma.$transaction(async (tx) => {
          const existing = await tx.detectionRule.findUnique({
            where: {
              rule_id_version: {
                rule_id: ruleDef.rule_id,
                version: ruleDef.version
              }
            }
          });

          if (existing) {
            const isEquivalent = 
              existing.name === ruleDef.name &&
              existing.status === ruleDef.status &&
              existing.security_domain === ruleDef.security_domain &&
              existing.result_classification === ruleDef.result_classification &&
              existing.base_severity === ruleDef.base_severity &&
              existing.threshold_count === ruleDef.threshold_count &&
              existing.correlation_subject_type === ruleDef.correlation_subject_type &&
              JSON.stringify(canonicalize(existing.evaluation_dsl)) === JSON.stringify(canonicalize(ruleDef.evaluation_dsl));
            
            if (isEquivalent) {
              results.push({ rule_id: ruleDef.rule_id, result: "ALREADY_INITIALIZED_EQUIVALENT" });
            } else {
              results.push({ rule_id: ruleDef.rule_id, result: "INITIALIZATION_CONFLICT", message: "Rule exists but definition differs." });

              await tx.auditLog.create({
                data: {
                  actor_user_id: actorUserId,
                  action: "SOC_RULE_INITIALIZED",
                  module: "SECURITY_RULES",
                  target_id: ruleDef.rule_id,
                  details: JSON.stringify({
                    outcome: "INITIALIZATION_CONFLICT",
                    logicalRuleId: ruleDef.rule_id,
                    version: ruleDef.version,
                    resultingStatus: "DRAFT",
                    ruleCreated: false,
                    existingVersionModified: false
                  })
                }
              });
            }
            return;
          }

          await tx.detectionRule.create({
            data: {
              ...ruleDef,
              evaluation_dsl: ruleDef.evaluation_dsl ?? Prisma.JsonNull
            }
          });

          await tx.auditLog.create({
            data: {
              actor_user_id: actorUserId,
              action: "SOC_RULE_INITIALIZED",
              module: "SECURITY_RULES",
              target_id: ruleDef.rule_id,
              details: `Initialized rule ${ruleDef.rule_id} v${ruleDef.version}`
            }
          });

          results.push({ rule_id: ruleDef.rule_id, result: "CREATED" });
        });
      } catch (error: unknown) {
         results.push({ rule_id: ruleDef.rule_id, result: "ERROR", message: error instanceof Error ? error.message : "Unknown error" });
      }
    }

    return results;
  }
}
