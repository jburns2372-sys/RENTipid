import {
  SpecialistFinding,
  SpecialistInvocationContract,
  SpecialistResultInput,
} from './contracts';
import { SpecialistExecutor, SpecialistInvocationAuthority } from './orchestrator';

export type ProviderAcquisitionDraftProvider = (
  invocation: Readonly<SpecialistInvocationContract>,
) => Promise<string>;

const sensitiveInferencePattern =
  /\b(?:race|religion|ethnicity|sexual orientation|health|political|union|gender|age)\b/i;

const messagingOverridePattern =
  /\b(?:bypass permission|override consent|ignore opt-out|mass message|ignore anti-spam|send immediately|override limits|force send|send to all)\b/i;

const stateModificationPattern =
  /\b(?:approve kyc|verify identity|activate account|create provider|force approval)\b/i;

function blocked(reason: string, code: string = 'PROVIDER_AUTHORITY_BLOCKED'): SpecialistResultInput {
  return {
    status: 'SYSTEM_BLOCKED',
    findings: [{ code, summary: reason, severity: 'HIGH' }],
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
    findings: [{ code: 'PROVIDER_SAFE_HOLD', summary: reason, severity: 'MEDIUM' }],
    evidenceRefs,
    recommendedNextStep: 'Provide required context or explicitly authorized criteria to proceed.',
    toolRequests: [],
    unresolvedFacts,
    safeHoldReason: reason,
  };
}

/**
 * Logical P4.4 provider-acquisition capability.
 *
 * This executor qualifies leads and prepares drafts/recommendations based
 * strictly on authorized canonical provider context. It has no independent CRM,
 * messaging, identity creation, or KYC approval authority.
 */
export class ProviderAcquisitionSpecialistExecutor implements SpecialistExecutor {
  constructor(private readonly createDraft: ProviderAcquisitionDraftProvider) {}

  async execute(
    invocation: Readonly<SpecialistInvocationContract>,
    _authority: SpecialistInvocationAuthority,
  ): Promise<SpecialistResultInput> {
    if (invocation.specialistId !== 'ProviderAcquisitionSpecialist') {
      throw new Error('PROVIDER_ACQUISITION_SPECIALIST_INVOCATION_REQUIRED');
    }

    if (sensitiveInferencePattern.test(invocation.requestedTask.instruction)) {
      return blocked('Prompt attempts sensitive or protected inference, which is strictly prohibited.', 'SENSITIVE_INFERENCE_PROHIBITED');
    }

    if (messagingOverridePattern.test(invocation.requestedTask.instruction)) {
      return blocked('Prompt cannot override communication permissions, consent, or anti-spam rules.', 'MESSAGING_PERMISSION_BLOCKED');
    }

    if (stateModificationPattern.test(invocation.requestedTask.instruction)) {
      return blocked('Provider Acquisition cannot autonomously approve KYC, activate accounts, or modify state.', 'STATE_MODIFICATION_BLOCKED');
    }

    // Only allow operations if context contains valid provider/onboarding data, listingbridge import, or marketplace insights.
    const validRefs = invocation.safeContext.sourceRefs.filter(ref =>
      ref.includes('provider_lead') ||
      ref.includes('provider_onboarding') ||
      ref.includes('fleet_prospect') ||
      ref.includes('listingbridge') ||
      ref.includes('MarketplaceIntelligenceSpecialist')
    );

    // To prevent cross-tenant/arbitrary access, if NO valid refs exist, hold.
    if (validRefs.length === 0) {
      return safeHold(
        'Provider Acquisition requires valid provider, onboarding, or aggregate marketplace context.',
        ['Missing valid provider/onboarding context.'],
        invocation.safeContext.sourceRefs,
      );
    }

    const findings: SpecialistFinding[] = [
      {
        code: 'PROVIDER_INTENT_CLASSIFIED',
        summary: `Validated intent: ${invocation.intent}`,
        severity: 'INFO',
      },
      {
        code: 'QUALIFICATION_EVALUATION',
        summary: 'Evaluation based strictly on operational criteria and verified context.',
        severity: 'INFO',
      }
    ];

    let draftResponse = '';
    try {
      draftResponse = await this.createDraft(invocation);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return blocked(`Draft generation failed: ${message}`);
    }

    return {
      status: 'COMPLETED',
      findings,
      evidenceRefs: [...validRefs],
      recommendedNextStep: 'Review draft and execute through canonical CRM/messaging workflow if permitted.',
      toolRequests: [],
      draftResponse,
      unresolvedFacts: [],
      metrics: {
        'leads_evaluated': 1
      }
    };
  }
}
