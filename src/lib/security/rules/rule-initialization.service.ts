import { PrismaClient, DetectionRuleStatus, SecuritySeverity, DetectionCorrelationSubject, DetectionDeduplicationStrategy, DetectionConfidenceFormula, DetectionRuleCreatorType, SecurityDomain, SecurityEventClassification } from "@prisma/client";
import { hasPermission } from "@/lib/permissions";

const prisma = new PrismaClient();

export interface RuleDefinition {
  rule_id: string;
  version: number;
  name: string;
  description: string;
  status: DetectionRuleStatus;
  security_domain: SecurityDomain;
  result_classification: SecurityEventClassification;
  base_severity: SecuritySeverity;
  base_confidence_score: number;
  threshold_count: number;
  window_seconds: number;
  cooldown_seconds: number;
  max_evidence_events: number;
  evaluation_timeout_ms: number;
  correlation_subject_type: DetectionCorrelationSubject;
  deduplication_strategy: DetectionDeduplicationStrategy;
  confidence_formula: DetectionConfidenceFormula;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  evaluation_dsl: any;
  created_by_type: DetectionRuleCreatorType;
}

const INITIAL_RULES: RuleDefinition[] = [
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
    created_by_type: DetectionRuleCreatorType.SYSTEM_SEED,
    evaluation_dsl: {
      "and": [
        { "eq": [{ "var": "source_type" }, "PAYMENT_WEBHOOK_LOG"] },
        { "eq": [{ "var": "event_classification" }, "POLICY_VIOLATION"] }
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
    created_by_type: DetectionRuleCreatorType.SYSTEM_SEED,
    evaluation_dsl: {
      "and": [
        { "eq": [{ "var": "source_type" }, "SYSTEM_SETTING"] },
        { "eq": [{ "var": "event_classification" }, "POLICY_VIOLATION"] }
      ]
    }
  }
];

export type InitializationResult = "CREATED" | "ALREADY_INITIALIZED_EQUIVALENT" | "INITIALIZATION_CONFLICT" | "ERROR";

export class RuleInitializationService {
  static async initializeInitialDrafts(actorUserId: string): Promise<{ rule_id: string, result: InitializationResult, message?: string }[]> {
    const results: { rule_id: string, result: InitializationResult, message?: string }[] = [];
    
    // DB-authoritative authorization
    const user = await prisma.user.findUnique({ where: { id: actorUserId } });
    if (!user || user.role !== 'Super Admin' || user.status !== 'Verified') {
      throw new Error("Unauthorized: Only verified Super Admins can initialize rules.");
    }
    
    // Check permission
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!hasPermission(user.role as any, 'security_rules' as any, 'initialize' as any)) {
      throw new Error("Unauthorized: Missing required permission security.rules.initialize.");
    }

    for (const ruleDef of INITIAL_RULES) {
      try {
        await prisma.$transaction(async (tx) => {
          // Check existence
          const existing = await tx.detectionRule.findUnique({
            where: {
              rule_id_version: {
                rule_id: ruleDef.rule_id,
                version: ruleDef.version
              }
            }
          });

          if (existing) {
            // Compare
            const isEquivalent = 
              existing.name === ruleDef.name &&
              existing.status === ruleDef.status &&
              existing.security_domain === ruleDef.security_domain &&
              existing.result_classification === ruleDef.result_classification &&
              existing.base_severity === ruleDef.base_severity &&
              existing.threshold_count === ruleDef.threshold_count &&
              existing.correlation_subject_type === ruleDef.correlation_subject_type &&
              JSON.stringify(existing.evaluation_dsl) === JSON.stringify(ruleDef.evaluation_dsl);
            
            if (isEquivalent) {
              results.push({ rule_id: ruleDef.rule_id, result: "ALREADY_INITIALIZED_EQUIVALENT" });
            } else {
              results.push({ rule_id: ruleDef.rule_id, result: "INITIALIZATION_CONFLICT", message: "Rule exists but definition differs." });
              // Create audit log for conflict
              await tx.auditLog.create({
                data: {
                  actor_user_id: actorUserId,
                  action: "SOC_RULE_INITIALIZATION_CONFLICT",
                  module: "SECURITY_RULES",
                  details: `Initialization conflict for rule ${ruleDef.rule_id} v${ruleDef.version}`
                }
              });
            }
            return;
          }

          // Create Rule
          await tx.detectionRule.create({
            data: {
              ...ruleDef
            }
          });

          // Create AuditLog atomically
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
         results.push({ rule_id: ruleDef.rule_id, result: "ERROR", message: error.message });
      }
    }

    return results;
  }
}
