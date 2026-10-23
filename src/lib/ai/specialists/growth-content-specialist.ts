import {
  SpecialistFinding,
  SpecialistInvocationContract,
  SpecialistResultInput,
} from './contracts';
import { SpecialistExecutor, SpecialistInvocationAuthority } from './orchestrator';

export type GrowthDraftProvider = (
  invocation: Readonly<SpecialistInvocationContract>,
) => Promise<string>;

const publishAttemptPattern =
  /\b(?:publish|post|send|boost|schedule|approve|launch|activate|override anti-spam|override consent|bypass approval)\b/i;

function blocked(reason: string): SpecialistResultInput {
  return {
    status: 'SYSTEM_BLOCKED',
    findings: [{ code: 'GROWTH_CONTENT_AUTHORITY_BLOCKED', summary: reason, severity: 'HIGH' }],
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
    findings: [{ code: 'GROWTH_SAFE_HOLD', summary: reason, severity: 'MEDIUM' }],
    evidenceRefs,
    recommendedNextStep: 'Provide approved campaign context before continuing.',
    toolRequests: [],
    unresolvedFacts,
    safeHoldReason: reason,
  };
}

/**
 * Logical P4.3 growth-content capability.
 *
 * This executor generates bounded drafts/recommendations only.
 * It has no direct publication or scheduling authority.
 */
export class GrowthContentSpecialistExecutor implements SpecialistExecutor {
  constructor(private readonly createDraft: GrowthDraftProvider) {}

  async execute(
    invocation: Readonly<SpecialistInvocationContract>,
    _authority: SpecialistInvocationAuthority,
  ): Promise<SpecialistResultInput> {
    if (invocation.specialistId !== 'GrowthContentSpecialist') {
      throw new Error('GROWTH_SPECIALIST_INVOCATION_REQUIRED');
    }

    if (publishAttemptPattern.test(invocation.requestedTask.instruction)) {
      return blocked('Prompt or context cannot grant publish, schedule, post, send, boost, approve, or launch authority. Must use existing Social Growth Bot approval workflow.');
    }

    const campaignRefs = invocation.safeContext.sourceRefs.filter(reference => reference.includes('campaign_context') || reference.includes('brand_guidelines') || reference.includes('product_facts') || reference.includes('MarketplaceIntelligenceSpecialist'));
    if (campaignRefs.length === 0) {
      return safeHold(
        'Campaign content generation requires approved context (campaign facts, brand guidelines, or aggregate insights).',
        ['Missing approved campaign context.'],
        invocation.safeContext.sourceRefs,
      );
    }

    // P4.3 rules: must not invent policy/claims.
    const findings: SpecialistFinding[] = [
      {
        code: 'GROWTH_CONTENT_INTENT_CLASSIFIED',
        summary: `Validated intent: ${invocation.intent}`,
        severity: 'INFO',
      },
    ];

    let draftResponse = '';
    try {
      draftResponse = await this.createDraft(invocation);
    } catch (e: any) {
      return blocked(`Draft generation failed: ${e.message}`);
    }

    return {
      status: 'COMPLETED',
      findings,
      evidenceRefs: [...invocation.safeContext.sourceRefs],
      recommendedNextStep: 'Review draft and submit to Social Growth Bot authorization flow.',
      toolRequests: [],
      draftResponse,
      unresolvedFacts: [],
      metrics: {
        'drafts_generated': 1
      }
    };
  }
}
