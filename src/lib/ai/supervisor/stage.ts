import { SpecialistMaturityLevel } from '../specialists/framework-registry';
import { maturityAllows, SpecialistPermissionDecision } from '../specialists/permission-matrix';
import { SpecialistAnswerClass, SpecialistRiskClass } from '../specialists/contracts';
import { AiSpecialist } from '../specialists/registry';

export type SupervisorOutcome = 'PASS' | 'SAFE_HOLD' | 'SYSTEM_BLOCKED' | 'REQUEST_MISSING_INFORMATION';

export interface SupervisorValidationResult {
  outcome: SupervisorOutcome;
  reason?: string;
}

export interface SupervisorContext {
  specialist: AiSpecialist;
  resolvedIntent?: string;
  requestedTool?: string;
  isConsequentialAction?: boolean;
  ownershipValid?: boolean;
  specialistEnabled?: boolean;
  permissionDecision?: SpecialistPermissionDecision;
  maturityLevel?: SpecialistMaturityLevel;
  requestedRiskClass?: SpecialistRiskClass;
  answerClass?: SpecialistAnswerClass;
}

/**
 * Validates a request against the specialist's constraints and global safety rules.
 */
export function validateWithSupervisor(context: SupervisorContext): SupervisorValidationResult {
  const {
    specialist,
    resolvedIntent,
    requestedTool,
    isConsequentialAction,
    ownershipValid,
    specialistEnabled,
    permissionDecision,
    maturityLevel,
    requestedRiskClass,
    answerClass,
  } = context;

  if (ownershipValid === false) {
    return { outcome: 'SYSTEM_BLOCKED', reason: 'Selected specialist does not own the resolved intent.' };
  }
  if (specialistEnabled === false) {
    return { outcome: 'SAFE_HOLD', reason: 'Selected specialist is disabled and no approved fallback is available.' };
  }
  if (permissionDecision && !permissionDecision.allowed) {
    const safeHoldReasons = ['MATURITY_CEILING_EXCEEDED', 'RISK_CEILING_EXCEEDED'];
    return {
      outcome: safeHoldReasons.includes(permissionDecision.reason) ? 'SAFE_HOLD' : 'SYSTEM_BLOCKED',
      reason: `Specialist permission denied: ${permissionDecision.reason}.`,
    };
  }
  if (requestedRiskClass === 'T3_PROHIBITED') {
    return { outcome: 'SYSTEM_BLOCKED', reason: 'T3 financial, security, or legal execution is prohibited.' };
  }
  if (maturityLevel && requestedRiskClass && answerClass && !maturityAllows(maturityLevel, answerClass, requestedRiskClass)) {
    return { outcome: 'SAFE_HOLD', reason: `Specialist maturity '${maturityLevel}' cannot perform '${requestedRiskClass}'.` };
  }

  // Accepted P4 tool allowlist remains binding after the Revision 2 restrictions.
  if (requestedTool && !specialist.allowedTools.includes(requestedTool)) {
    return {
      outcome: 'SYSTEM_BLOCKED',
      reason: `Tool '${requestedTool}' is not allowed for specialist '${specialist.name}'.`,
    };
  }

  // Accepted P4 risk ceiling remains binding after the Revision 2 maturity ceiling.
  if (isConsequentialAction && specialist.riskCeiling === 'INFORMATION') {
    return {
      outcome: 'SAFE_HOLD',
      reason: `Specialist '${specialist.name}' is limited to INFORMATION and cannot perform consequential actions.`,
    };
  }

  if (resolvedIntent && !specialist.allowedIntents.includes(resolvedIntent)) {
    return {
      outcome: 'SAFE_HOLD',
      reason: `Intent '${resolvedIntent}' is not supported by specialist '${specialist.name}'.`,
    };
  }

  return { outcome: 'PASS' };
}