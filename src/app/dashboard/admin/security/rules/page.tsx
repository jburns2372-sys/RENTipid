import React from 'react';
import { PrismaClient } from "@prisma/client";
import { requireSecurityPermission } from "@/lib/security/authorization";
import { SECURITY_PERMISSIONS } from "@/lib/security/permissions";
import RuleListClient from '@/components/security/rules/RuleListClient';
import { SOURCE_COMPATIBILITY_REGISTRY, CompatibilityStatus } from "@/lib/security/rules/source-compatibility.registry";
import { validateRuleConfiguration } from "@/lib/security/rules/rule-validation.service";

const prisma = new PrismaClient();

export default async function SecurityRulesPage() {
  await requireSecurityPermission(SECURITY_PERMISSIONS.RULES_VIEW);

  // Fetch rules. Map to a privacy-safe DTO.
  const rawRules = await prisma.detectionRule.findMany({
    orderBy: { created_at: 'desc' }
  });

  const safeRules = rawRules.map(rule => {
    // Use the actual Gate 3D validator to determine VALID/INVALID
    const validation = validateRuleConfiguration(rule as unknown as Parameters<typeof validateRuleConfiguration>[0], rule.evaluation_dsl);
    const registryEntry = SOURCE_COMPATIBILITY_REGISTRY[rule.rule_id];
    
    return {
      rule_id: rule.rule_id,
      version: rule.version,
      name: rule.name,
      status: rule.status,
      severity: rule.base_severity,
      security_domain: rule.security_domain,
      threshold: rule.threshold_count,
      window_seconds: rule.window_seconds,
      cooldown_seconds: rule.cooldown_seconds,
      correlation_strategy: rule.correlation_subject_type,
      deduplication_strategy: rule.deduplication_strategy,
      validation_result: validation.valid ? "VALID" : "INVALID",
      compatibility_result: registryEntry ? registryEntry.status : CompatibilityStatus.UNVERIFIED,
      activation_eligibility: rule.status === 'DRAFT' ? 'Eligible' : 'Not Eligible'
    };
  });

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SOC Detection Rules</h1>
          <p className="text-gray-600">Manage and monitor Security Operations Center automated detection rules.</p>
        </div>
      </div>
      
      <RuleListClient initialRules={safeRules} />
    </div>
  );
}
