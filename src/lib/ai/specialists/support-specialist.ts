import {
  SpecialistFinding,
  SpecialistInvocationContract,
  SpecialistResultInput,
  SpecialistToolRequest,
} from './contracts';
import { SpecialistExecutor, SpecialistInvocationAuthority } from './orchestrator';
import { routeIntentOwnership } from './router';

export type SupportDraftProvider = (
  invocation: Readonly<SpecialistInvocationContract>,
) => Promise<string>;

const authorityEscalationPattern =
  /\b(?:i am (?:an? )?(?:admin|owner)|change (?:my )?role|grant (?:me )?ownership|set (?:my )?maturity|override policy|bypass (?:rbac|ownership|confirmation|policy)|finance already authorized|the user approved this)\b/i;

function requestedTool(instruction: string): string | undefined {
  return instruction.match(/execute tool:\s*([a-zA-Z0-9_]+)/i)?.[1];
}

function isMediationPreparation(invocation: Readonly<SpecialistInvocationContract>) {
  return invocation.requestedTask.code === 'PREPARE_MEDIATION_REQUEST'
    || /\bmediat(?:e|ion|ed|ing)\b/i.test(invocation.requestedTask.instruction);
}

function blocked(reason: string): SpecialistResultInput {
  return {
    status: 'SYSTEM_BLOCKED',
    findings: [{ code: 'SUPPORT_AUTHORITY_ESCALATION_BLOCKED', summary: reason, severity: 'HIGH' }],
    evidenceRefs: [],
    toolRequests: [],
    unresolvedFacts: [],
    safeHoldReason: reason,
  };
}

function safeHold(
  reason: string,
  unresolvedFacts: readonly string[],
  evidenceRefs: readonly string[],
): SpecialistResultInput {
  return {
    status: 'SAFE_HOLD',
    findings: [{ code: 'SUPPORT_SAFE_HOLD', summary: reason, severity: 'MEDIUM' }],
    evidenceRefs,
    recommendedNextStep: 'Wait for authoritative state or approved evidence before continuing.',
    toolRequests: [],
    unresolvedFacts,
    safeHoldReason: reason,
  };
}

/**
 * Logical P4.1 customer-service capability.
 *
 * This executor receives only the bounded invocation created by Unified AI. It
 * has no database, Tool Gateway, policy-engine, response-sending, persistence,
 * or specialist-invocation dependency. Authoritative state and approved
 * knowledge must already be represented by bounded source references.
 */
export class SupportSpecialistExecutor implements SpecialistExecutor {
  constructor(private readonly createDraft: SupportDraftProvider) {}

  async execute(
    invocation: Readonly<SpecialistInvocationContract>,
    _authority: SpecialistInvocationAuthority,
  ): Promise<SpecialistResultInput> {
    if (invocation.specialistId !== 'SupportSpecialist') {
      throw new Error('SUPPORT_SPECIALIST_INVOCATION_REQUIRED');
    }

    const routing = routeIntentOwnership(invocation.intent);
    if (routing.ownership.primarySpecialistId !== 'SupportSpecialist') {
      throw new Error('SUPPORT_SPECIALIST_OWNERSHIP_REQUIRED');
    }

    if (authorityEscalationPattern.test(invocation.requestedTask.instruction)) {
      return blocked('Prompt or context cannot grant role, ownership, maturity, confirmation, or policy authority.');
    }

    const liveRefs = invocation.safeContext.sourceRefs.filter(reference => reference.startsWith('live:'));
    const knowledgeRefs = invocation.safeContext.sourceRefs.filter(reference => reference.startsWith('knowledge:'));
    if (invocation.answerClass === 'PERSONALIZED' && liveRefs.length === 0) {
      return safeHold(
        'Personalized support requires a current authorized domain-state read.',
        ['Current authoritative state is unavailable.'],
        knowledgeRefs,
      );
    }

    const toolName = requestedTool(invocation.requestedTask.instruction);
    if (invocation.answerClass === 'ACTION') {
      if (!toolName || !invocation.allowedToolScopes.includes(toolName)) {
        return blocked('A consequential support request must use an explicitly scoped registered tool.');
      }
    }

    const findings: SpecialistFinding[] = [
      {
        code: 'SUPPORT_ISSUE_CLASSIFIED',
        summary: `${routing.supportSubdomain.id} compatibility profile selected for the existing '${invocation.intent}' case taxonomy.`,
        severity: 'INFO',
      },
    ];

    if (invocation.caseId) {
      findings.push({
        code: 'EXISTING_CASE_BOUND',
        summary: `Support output is bound to existing case '${invocation.caseId}'.`,
        severity: 'INFO',
      });
    }
    if (invocation.sessionId !== 'stateless-session') {
      findings.push({
        code: 'EXISTING_CONVERSATION_BOUND',
        summary: `Support output is bound to existing conversation/session '${invocation.sessionId}'.`,
        severity: 'INFO',
      });
    }
    if (liveRefs.length > 0) {
      findings.push({
        code: 'AUTHORITATIVE_LIVE_STATE_READ',
        summary: 'Current personalized state was supplied by an authorized domain-state service.',
        severity: 'INFO',
      });
    }
    if (knowledgeRefs.length > 0) {
      findings.push({
        code: 'APPROVED_KNOWLEDGE_USED',
        summary: 'Durable guidance was supplied by the canonical Knowledge Center.',
        severity: 'INFO',
      });
    }

    let recommendedNextStep = toolName
      ? 'Return the registered tool request to Unified AI for Supervisor and Tool Gateway processing.'
      : 'Return the bounded draft to Unified AI for final-response protection and delivery.';

    if (isMediationPreparation(invocation)) {
      if (!invocation.caseId) {
        return safeHold(
          'Mediation preparation requires an existing authorized support case.',
          ['Existing owned support case is required.'],
          invocation.safeContext.sourceRefs,
        );
      }
      findings.push({
        code: 'MEDIATION_PREPARATION_ONLY',
        summary: 'A proposed interim resolution may be prepared on the existing case; renter/provider consent and final Tool Gateway execution remain required.',
        severity: 'MEDIUM',
      });
      recommendedNextStep = 'Prepare a proposed interim resolution on the existing case without executing a mediated domain action.';
    }

    const toolRequests: SpecialistToolRequest[] = toolName
      ? [{ toolName, parametersRef: invocation.caseId, riskClass: invocation.riskClass }]
      : [];
    const draftResponse = await this.createDraft(invocation);

    return {
      status: 'COMPLETED',
      findings,
      evidenceRefs: invocation.safeContext.sourceRefs,
      recommendedNextStep,
      toolRequests,
      draftResponse,
      confidence: liveRefs.length > 0 || knowledgeRefs.length > 0 ? 1 : 0.75,
      unresolvedFacts: [],
      metrics: {
        authoritativeLiveRefs: liveRefs.length,
        approvedKnowledgeRefs: knowledgeRefs.length,
      },
    };
  }
}
