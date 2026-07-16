/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import { PrismaClient, Prisma, DetectionRuleStatus, SecurityDomain, SecurityEventClassification, SecuritySeverity, DetectionRuleCreatorType, DetectionCorrelationSubject, DetectionDeduplicationStrategy, DetectionConfidenceFormula, DetectionRule } from "@prisma/client";
import { validateRuleConfiguration, RuleTypedConfiguration } from "./rule-validation.service";
import { requireSecurityPermission, getCurrentDatabaseUser } from "../authorization";
import { SECURITY_PERMISSIONS } from "../permissions";
import { serializePrivacySafeIp } from "../serializers";

const prisma = new PrismaClient();

const MAX_VERSION_RETRIES = 3;

export async function createDraftRule(
  ruleId: string,
  config: RuleTypedConfiguration,
  dslInput: unknown,
  createdByUserId: string
): Promise<{ success: true; rule: DetectionRule } | { success: false; error: string }> {
  const authContext = await requireSecurityPermission(SECURITY_PERMISSIONS.RULES_CREATE);
  
  const validation = validateRuleConfiguration(config, dslInput);
  if (!validation.valid) {
    return { success: false, error: validation.error || "VALIDATION_FAILED" };
  }

  let attempt = 0;
  while (attempt < MAX_VERSION_RETRIES) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const maxVersionRule = await tx.detectionRule.findFirst({
          where: { rule_id: ruleId },
          orderBy: { version: 'desc' },
        });
        const nextVersion = maxVersionRule ? maxVersionRule.version + 1 : 1;

        const rule = await tx.detectionRule.create({
          data: {
            rule_id: ruleId,
            version: nextVersion,
            status: DetectionRuleStatus.DRAFT,
            name: config.name,
            description: config.description,
            base_severity: config.base_severity,
            threshold_count: config.threshold_count,
            window_seconds: config.window_seconds,
            cooldown_seconds: config.cooldown_seconds,
            max_evidence_events: config.max_evidence_events,
            correlation_subject_type: config.correlation_subject_type,
            deduplication_strategy: config.deduplication_strategy,
            confidence_formula: config.confidence_formula,
            confidence_increment_per_evidence: config.confidence_increment_per_evidence,
            severity_promotion_threshold: config.severity_promotion_threshold,
            promoted_severity: config.promoted_severity,
            security_domain: config.security_domain,
            result_classification: config.result_classification,
            base_confidence_score: config.base_confidence_score,
            evaluation_timeout_ms: config.evaluation_timeout_ms,
            evaluation_dsl: validation.parsedDsl as unknown as Prisma.InputJsonValue,
            created_by_type: DetectionRuleCreatorType.USER,
            created_by_user_id: createdByUserId,
          }
        });

        await tx.auditLog.create({
          data: {
            actor_user_id: createdByUserId,
            action: "SOC_RULE_CREATED",
            module: "SecurityOperationsCenter",
            details: JSON.stringify({ rule_id: rule.id, logical_id: ruleId, version: nextVersion }),
            ip_address: serializePrivacySafeIp("request_ip_context_unavailable_in_rsc")
          }
        });

        return rule;
      });
      return { success: true, rule: result };
    } catch (e: any) {
      // Prisma unique constraint violation code is P2002
      if (e.code === 'P2002') {
        attempt++;
        if (attempt >= MAX_VERSION_RETRIES) {
          return { success: false, error: "DUPLICATE_VERSION_CONFLICT" };
        }
        continue;
      }
      console.error("Original DB error inside createDraftRule:", e);
      return { success: false, error: "DATABASE_ERROR" };
    }
  }
  return { success: false, error: "MAX_RETRIES_EXCEEDED" };
}

export async function updateDraftRule(
  ruleIdPk: string,
  config: RuleTypedConfiguration,
  dslInput: unknown,
  updatedAtCursor: Date,
  updatedByUserId: string
): Promise<{ success: true; rule: DetectionRule } | { success: false; error: string }> {
  const authContext = await requireSecurityPermission(SECURITY_PERMISSIONS.RULES_UPDATE);
  
  const validation = validateRuleConfiguration(config, dslInput);
  if (!validation.valid) {
    return { success: false, error: validation.error || "VALIDATION_FAILED" };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const { count } = await tx.detectionRule.updateMany({
        where: {
          id: ruleIdPk,
          status: DetectionRuleStatus.DRAFT,
          updated_at: updatedAtCursor
        },
        data: {
          name: config.name,
          description: config.description,
          base_severity: config.base_severity,
          threshold_count: config.threshold_count,
          window_seconds: config.window_seconds,
          cooldown_seconds: config.cooldown_seconds,
          max_evidence_events: config.max_evidence_events,
          correlation_subject_type: config.correlation_subject_type,
          deduplication_strategy: config.deduplication_strategy,
          confidence_formula: config.confidence_formula,
          confidence_increment_per_evidence: config.confidence_increment_per_evidence,
          severity_promotion_threshold: config.severity_promotion_threshold,
          promoted_severity: config.promoted_severity,
          security_domain: config.security_domain,
          result_classification: config.result_classification,
          base_confidence_score: config.base_confidence_score,
          evaluation_timeout_ms: config.evaluation_timeout_ms,
          evaluation_dsl: validation.parsedDsl as unknown as Prisma.InputJsonValue,
        }
      });

      if (count === 0) {
        // Find if rule exists at all to return correct error
        const existing = await tx.detectionRule.findUnique({ where: { id: ruleIdPk } });
        if (!existing) return { success: false, error: "RULE_NOT_FOUND" };
        if (existing.status !== DetectionRuleStatus.DRAFT) return { success: false, error: "INVALID_RULE_STATUS" };
        return { success: false, error: "STALE_UPDATE_CONFLICT" };
      }

      // Fetch the updated rule to return and use in audit log
      const rule = await tx.detectionRule.findUnique({ where: { id: ruleIdPk } });
      if (!rule) return { success: false, error: "DATABASE_ERROR" };

      await tx.auditLog.create({
        data: {
          actor_user_id: updatedByUserId,
          action: "SOC_RULE_UPDATED",
          module: "SecurityOperationsCenter",
          details: JSON.stringify({ rule_id: rule.id }),
          ip_address: serializePrivacySafeIp("request_ip_context_unavailable_in_rsc")
        }
      });

      return { success: true, rule };
    });
  } catch (e: any) {
    return { success: false, error: "DATABASE_ERROR" };
  }
}

export async function activateRule(
  ruleIdPk: string,
  activatedByUserId: string
) {
  const authContext = await requireSecurityPermission(SECURITY_PERMISSIONS.RULES_ACTIVATE);

  // Require fresh read from DB to revalidate rule before activation
  const existing = await prisma.detectionRule.findUnique({
    where: { id: ruleIdPk }
  });
  
  if (!existing) return { success: false, error: "RULE_NOT_FOUND" };
  if (existing.status !== DetectionRuleStatus.DRAFT) return { success: false, error: "ONLY_DRAFT_CAN_BE_ACTIVATED" };

  // Revalidate the complete merged rule before updating (the existing fields)
  const validation = validateRuleConfiguration({
    name: existing.name,
    description: existing.description,
    base_severity: existing.base_severity,
    threshold_count: existing.threshold_count,
    window_seconds: existing.window_seconds,
    cooldown_seconds: existing.cooldown_seconds,
    max_evidence_events: existing.max_evidence_events,
    correlation_subject_type: existing.correlation_subject_type,
    deduplication_strategy: existing.deduplication_strategy,
    confidence_formula: existing.confidence_formula,
    confidence_increment_per_evidence: existing.confidence_increment_per_evidence,
    severity_promotion_threshold: existing.severity_promotion_threshold,
    promoted_severity: existing.promoted_severity,
    security_domain: existing.security_domain,
    result_classification: existing.result_classification,
    base_confidence_score: existing.base_confidence_score,
    evaluation_timeout_ms: existing.evaluation_timeout_ms,
  }, existing.evaluation_dsl);

  if (!validation.valid) {
    return { success: false, error: "REVALIDATION_FAILED: " + validation.error };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // We must handle the partial unique index conflict for ACTIVE status.
      // If another rule with the same rule_id is already ACTIVE, the update will throw P2002.
      const rule = await tx.detectionRule.update({
        where: { id: ruleIdPk },
        data: {
          status: DetectionRuleStatus.ACTIVE,
          activated_at: new Date(),
          activated_by_id: activatedByUserId
        }
      });

      await tx.auditLog.create({
        data: {
          actor_user_id: activatedByUserId,
          action: "SOC_RULE_ACTIVATED",
          module: "SecurityOperationsCenter",
          details: JSON.stringify({ rule_id: rule.id }),
          ip_address: serializePrivacySafeIp("request_ip_context_unavailable_in_rsc")
        }
      });

      return { success: true, rule };
    });
  } catch (e: any) {
    if (e.code === 'P2002') {
      return { success: false, error: "ACTIVE_VERSION_CONFLICT" };
    }
    return { success: false, error: "DATABASE_ERROR" };
  }
}

export async function archiveRule(
  ruleIdPk: string,
  archivedByUserId: string
) {
  const authContext = await requireSecurityPermission(SECURITY_PERMISSIONS.RULES_ARCHIVE);

  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.detectionRule.findUnique({
        where: { id: ruleIdPk }
      });
      
      if (!existing) return { success: false, error: "RULE_NOT_FOUND" };
      if (existing.status === DetectionRuleStatus.ARCHIVED) return { success: false, error: "ALREADY_ARCHIVED" };

      const rule = await tx.detectionRule.update({
        where: { id: ruleIdPk },
        data: {
          status: DetectionRuleStatus.ARCHIVED,
          archived_at: new Date(),
          archived_by_id: archivedByUserId
        }
      });

      await tx.auditLog.create({
        data: {
          actor_user_id: archivedByUserId,
          action: "SOC_RULE_ARCHIVED",
          module: "SecurityOperationsCenter",
          details: JSON.stringify({ rule_id: rule.id }),
          ip_address: serializePrivacySafeIp("request_ip_context_unavailable_in_rsc")
        }
      });

      return { success: true, rule };
    });
  } catch (e: any) {
    return { success: false, error: "DATABASE_ERROR" };
  }
}

export async function queryRules(cursorId?: string, cursorCreatedAt?: Date, limit: number = 20) {
  const authContext = await requireSecurityPermission(SECURITY_PERMISSIONS.RULES_VIEW);

  try {
    const rules = await prisma.detectionRule.findMany({
      take: limit + 1,
      skip: cursorId ? 1 : 0,
      cursor: cursorId ? { id: cursorId } : undefined,
      orderBy: [
        { created_at: 'desc' },
        { id: 'desc' }
      ]
    });

    const hasMore = rules.length > limit;
    if (hasMore) rules.pop();

    return { success: true, rules, hasMore };
  } catch (e: any) {
    return { success: false, error: "DATABASE_ERROR" };
  }
}
