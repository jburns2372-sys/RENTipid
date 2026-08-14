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
}

/**
 * Validates a request against the specialist's constraints and global safety rules.
 */
export function validateWithSupervisor(context: SupervisorContext): SupervisorValidationResult {
  const { specialist, resolvedIntent, requestedTool, isConsequentialAction } = context;

  // 1. Validate Tool Eligibility vs Allowlist
  if (requestedTool) {
    if (!specialist.allowedTools.includes(requestedTool)) {
      return {
        outcome: 'SYSTEM_BLOCKED',
        reason: `Tool '${requestedTool}' is not allowed for specialist '${specialist.name}'.`
      };
    }
  }

  // 2. Validate Risk Ceiling
  if (isConsequentialAction) {
    if (specialist.riskCeiling === 'INFORMATION') {
      return {
        outcome: 'SAFE_HOLD',
        reason: `Specialist '${specialist.name}' is limited to INFORMATION and cannot perform consequential actions.`
      };
    }
  }

  // 3. Contradictory State / Unknown Intent check
  if (resolvedIntent && !specialist.allowedIntents.includes(resolvedIntent)) {
    // This shouldn't normally happen if routed correctly, but acts as a defensive check
    return {
      outcome: 'SAFE_HOLD',
      reason: `Intent '${resolvedIntent}' is not supported by specialist '${specialist.name}'.`
    };
  }

  // If all checks pass
  return {
    outcome: 'PASS'
  };
}
