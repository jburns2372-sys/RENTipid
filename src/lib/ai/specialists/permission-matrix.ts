import { SpecialistAnswerClass, SpecialistRiskClass } from './contracts';
import {
  revision2SpecialistRegistry,
  Revision2SpecialistDefinition,
  Revision2SpecialistId,
  SpecialistMaturityLevel,
} from './framework-registry';
import { AiSpecialist } from './registry';

export const specialistPermissionMatrix = revision2SpecialistRegistry;

export type SpecialistPermissionReason =
  | 'PASS'
  | 'SPECIALIST_DISABLED'
  | 'RBAC_DENIED'
  | 'ROLE_PROHIBITED'
  | 'ROLE_NOT_ALLOWED'
  | 'KNOWLEDGE_PROHIBITED'
  | 'KNOWLEDGE_NOT_ALLOWED'
  | 'TOOL_PROHIBITED'
  | 'TOOL_NOT_ALLOWED'
  | 'TOOL_GATEWAY_DENIED'
  | 'RISK_CEILING_EXCEEDED'
  | 'MATURITY_CEILING_EXCEEDED'
  | 'T3_ALWAYS_PROHIBITED';

export interface SpecialistPermissionDecision {
  allowed: boolean;
  reason: SpecialistPermissionReason;
  effectiveAllowedTools: readonly string[];
}

export interface SpecialistPermissionInput {
  specialistId: Revision2SpecialistId;
  persistedRole: string;
  supportSubdomain?: AiSpecialist;
  requestedKnowledgeDomains?: readonly string[];
  requestedTools?: readonly string[];
  requestedRiskClass: SpecialistRiskClass;
  answerClass: SpecialistAnswerClass;
  rbacAuthorized?: boolean;
  toolGatewayAllowedTools?: readonly string[];
}

const riskRank: Readonly<Record<SpecialistRiskClass, number>> = {
  T0_INFORMATION: 0,
  T1_PERSONALIZED: 1,
  T2_OPERATIONAL: 2,
  T3_PROHIBITED: 3,
};

const legacyRiskRank = {
  INFORMATION: 0,
  PERSONALIZED: 1,
  ACTION: 2,
} as const;

const maturityRiskRank: Readonly<Record<SpecialistMaturityLevel, number>> = {
  L1_OBSERVE_RECOMMEND: 0,
  L2_DRAFT: 0,
  L3_EXECUTE_LOW_RISK: 1,
  L4_EXECUTE_POLICY_APPROVED_OPERATIONAL: 2,
};

const normalized = (value: string) => value.trim().toLowerCase();
const contains = (values: readonly string[], value: string) => values.some(candidate => normalized(candidate) === normalized(value));
const intersect = (left: readonly string[], right: readonly string[]) => left.filter(value => contains(right, value));

export function maturityAllows(
  maturityLevel: SpecialistMaturityLevel,
  answerClass: SpecialistAnswerClass,
  riskClass: SpecialistRiskClass,
): boolean {
  if (riskClass === 'T3_PROHIBITED') return false;
  if (answerClass === 'DRAFT' && maturityLevel === 'L1_OBSERVE_RECOMMEND') return false;
  if (answerClass === 'ACTION' && maturityLevel === 'L2_DRAFT') return false;
  return riskRank[riskClass] <= maturityRiskRank[maturityLevel];
}

function denied(reason: SpecialistPermissionReason, effectiveAllowedTools: readonly string[]): SpecialistPermissionDecision {
  return Object.freeze({ allowed: false, reason, effectiveAllowedTools });
}

export function evaluateSpecialistPermission(
  input: SpecialistPermissionInput,
  matrix: Readonly<Record<Revision2SpecialistId, Revision2SpecialistDefinition>> = specialistPermissionMatrix,
): SpecialistPermissionDecision {
  const permission = matrix[input.specialistId];
  const subdomainTools = input.supportSubdomain?.allowedTools ?? permission.allowedTools;
  const effectiveAllowedTools = Object.freeze(intersect(permission.allowedTools, subdomainTools));

  if (permission.status !== 'ENABLED') return denied('SPECIALIST_DISABLED', effectiveAllowedTools);
  if (input.rbacAuthorized === false) return denied('RBAC_DENIED', effectiveAllowedTools);
  if (contains(permission.prohibitedRoles, input.persistedRole)) return denied('ROLE_PROHIBITED', effectiveAllowedTools);
  if (!contains(permission.allowedRoles, input.persistedRole)) return denied('ROLE_NOT_ALLOWED', effectiveAllowedTools);

  for (const domain of input.requestedKnowledgeDomains ?? []) {
    if (contains(permission.prohibitedKnowledgeDomains, domain)) return denied('KNOWLEDGE_PROHIBITED', effectiveAllowedTools);
    if (!contains(permission.allowedKnowledgeDomains, domain)) return denied('KNOWLEDGE_NOT_ALLOWED', effectiveAllowedTools);
    if (input.supportSubdomain && !contains(input.supportSubdomain.knowledgeDomains, domain)) {
      return denied('KNOWLEDGE_NOT_ALLOWED', effectiveAllowedTools);
    }
  }

  for (const tool of input.requestedTools ?? []) {
    if (contains(permission.prohibitedTools, tool)) return denied('TOOL_PROHIBITED', effectiveAllowedTools);
    if (!contains(permission.allowedTools, tool) || !contains(effectiveAllowedTools, tool)) {
      return denied('TOOL_NOT_ALLOWED', effectiveAllowedTools);
    }
    if (input.toolGatewayAllowedTools && !contains(input.toolGatewayAllowedTools, tool)) {
      return denied('TOOL_GATEWAY_DENIED', effectiveAllowedTools);
    }
  }

  if (input.requestedRiskClass === 'T3_PROHIBITED') return denied('T3_ALWAYS_PROHIBITED', effectiveAllowedTools);
  if (riskRank[input.requestedRiskClass] > legacyRiskRank[permission.riskCeiling]) {
    return denied('RISK_CEILING_EXCEEDED', effectiveAllowedTools);
  }
  if (input.supportSubdomain && riskRank[input.requestedRiskClass] > legacyRiskRank[input.supportSubdomain.riskCeiling]) {
    return denied('RISK_CEILING_EXCEEDED', effectiveAllowedTools);
  }
  if (!maturityAllows(permission.maturityLevel, input.answerClass, input.requestedRiskClass)) {
    return denied('MATURITY_CEILING_EXCEEDED', effectiveAllowedTools);
  }

  return Object.freeze({ allowed: true, reason: 'PASS', effectiveAllowedTools });
}