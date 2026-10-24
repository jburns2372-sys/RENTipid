import {
  SpecialistFinding,
  SpecialistInvocationContract,
  SpecialistResultInput,
} from './contracts';
import { SpecialistExecutor, SpecialistInvocationAuthority } from './orchestrator';

export type ContractPolicyProvider = (
  invocation: Readonly<SpecialistInvocationContract>,
) => Promise<{ 
  clauseCategory?: string; 
  baselineReference?: string; 
  deviation?: string; 
  version?: string;
  effectiveDate?: string;
  isDraft?: boolean;
}>;

const mutationPattern =
  /\b(?:approve|sign|execute|accept terms|publish|change policy|modify customer terms)\b/i;

const legalAdvicePattern =
  /\b(?:legally binding|legal advice|enforceable|you are legally required|guarantees)\b/i;

function blocked(reason: string, code: string = 'CONTRACT_AUTHORITY_BLOCKED'): SpecialistResultInput {
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
    findings: [{ code: 'CONTRACT_SAFE_HOLD', summary: reason, severity: 'MEDIUM' }],
    evidenceRefs,
    recommendedNextStep: 'Provide authorized document baseline for review.',
    toolRequests: [],
    unresolvedFacts,
    safeHoldReason: reason,
  };
}

export class ContractPolicySpecialistExecutor implements SpecialistExecutor {
  constructor(private readonly provider: ContractPolicyProvider) {}

  async execute(
    invocation: Readonly<SpecialistInvocationContract>,
    _authority: SpecialistInvocationAuthority,
  ): Promise<SpecialistResultInput> {
    if (invocation.specialistId !== 'ContractPolicySpecialist') {
      throw new Error('CONTRACT_POLICY_SPECIALIST_INVOCATION_REQUIRED');
    }

    if (mutationPattern.test(invocation.requestedTask.instruction)) {
      return blocked('Contract execution and policy mutation requests are denied.', 'CONTRACT_MUTATION_DENIED');
    }

    if (legalAdvicePattern.test(invocation.requestedTask.instruction)) {
      return blocked('Binding legal advice is strictly prohibited.', 'BINDING_LEGAL_ADVICE_PROHIBITED');
    }

    const validRefs = invocation.safeContext.sourceRefs.filter(ref =>
      ref.includes('provider_agreements') ||
      ref.includes('vendor_agreements') ||
      ref.includes('internal_policy_drafts') ||
      ref.includes('authorized_document')
    );

    if (validRefs.length === 0 && !invocation.safeContext.content.includes('authorized_document')) {
      return blocked('Restricted document access requires authorized internal source context.', 'UNAUTHORIZED_DOCUMENT_ACCESS');
    }

    let policyData;
    try {
      policyData = await this.provider(invocation);
    } catch (e: any) {
      if (e.message.includes('superseded')) {
        return blocked('Superseded document cannot be treated as authoritative policy.', 'SUPERSEDED_DOCUMENT_DENIED');
      }
      return blocked(`Analysis failed: ${e.message}`);
    }

    if (invocation.safeContext.content.includes('draft') || policyData.isDraft) {
      if (invocation.requestedTask.instruction.includes('customer policy') || invocation.intent.includes('customer_policy')) {
        return blocked('Draft/unapproved clause cannot become customer policy.', 'DRAFT_AS_POLICY_DENIED');
      }
    }

    const findings: SpecialistFinding[] = [
      {
        code: 'CONTRACT_ANALYSIS_COMPLETED',
        summary: `Analyzed document version ${policyData.version ?? 'UNKNOWN'} effective ${policyData.effectiveDate ?? 'UNKNOWN'}`,
        severity: 'INFO',
      }
    ];

    let deviationText = 'NO_DEVIATION';
    if (!policyData.baselineReference) {
       findings.push({
         code: 'NO_APPROVED_BASELINE',
         summary: 'No approved baseline available for comparison.',
         severity: 'MEDIUM'
       });
       deviationText = 'NO_APPROVED_BASELINE';
    } else if (policyData.deviation) {
       findings.push({
         code: 'BASELINE_DEVIATION_DETECTED',
         summary: `Deviation detected from baseline ${policyData.baselineReference}: ${policyData.deviation}`,
         severity: 'MEDIUM'
       });
       deviationText = policyData.deviation;
    }

    return {
      status: 'COMPLETED',
      findings,
      evidenceRefs: [...validRefs, policyData.baselineReference].filter(Boolean) as string[],
      recommendedNextStep: 'INTERNAL REVIEW RECOMMENDATION: Review identified deviations. NOT BINDING LEGAL ADVICE.',
      toolRequests: [],
      unresolvedFacts: [],
      draftResponse: `Analysis complete. Version: ${policyData.version}, Category: ${policyData.clauseCategory}, Deviation: ${deviationText}. INTERNAL REVIEW RECOMMENDATION - NOT BINDING LEGAL ADVICE.`,
      metrics: {
        'clauses_analyzed': 1
      }
    };
  }
}
