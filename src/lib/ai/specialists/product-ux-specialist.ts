import {
  SpecialistFinding,
  SpecialistInvocationContract,
  SpecialistResultInput,
} from './contracts';
import { SpecialistExecutor, SpecialistInvocationAuthority } from './orchestrator';

export type ProductUXProvider = (
  invocation: Readonly<SpecialistInvocationContract>,
) => Promise<{ 
  finding: string; 
  priority: 'HIGH' | 'MEDIUM' | 'LOW'; 
  hypothesis: string;
  acceptanceCriteria: string[];
  experimentRecommendation: string;
  measurementPlan: string;
}>;

const mutationPattern =
  /\b(?:change.*now|fix.*production|deploy|rewrite.*component|push.*fix|release.*dashboard|modify.*css|turn.*experiment on)\b/i;

const unminimizedFeedbackPattern =
  /\b(?:ssn|credit card|phone number|residential address|bank account|password)\b/i;

function blocked(reason: string, code: string = 'PRODUCT_UX_AUTHORITY_BLOCKED'): SpecialistResultInput {
  return {
    status: 'SYSTEM_BLOCKED',
    findings: [{ code, summary: reason, severity: 'HIGH' }],
    evidenceRefs: [],
    toolRequests: [],
    unresolvedFacts: [],
    safeHoldReason: reason,
  };
}

export class ProductUXSpecialistExecutor implements SpecialistExecutor {
  constructor(private readonly provider: ProductUXProvider) {}

  async execute(
    invocation: Readonly<SpecialistInvocationContract>,
    _authority: SpecialistInvocationAuthority,
  ): Promise<SpecialistResultInput> {
    if (invocation.specialistId !== 'ProductUXSpecialist') {
      throw new Error('PRODUCT_UX_SPECIALIST_INVOCATION_REQUIRED');
    }

    if (mutationPattern.test(invocation.requestedTask.instruction)) {
      return blocked('Autonomous UI modification and code deployment are strictly denied.', 'UI_MUTATION_DENIED');
    }
    
    if (invocation.requestedTask.instruction.includes('change policy') || invocation.requestedTask.instruction.includes('business rule')) {
       return blocked('Business-rule and policy mutation requests are denied.', 'POLICY_MUTATION_DENIED');
    }

    if (unminimizedFeedbackPattern.test(invocation.safeContext.content)) {
      return {
        status: 'SAFE_HOLD',
        findings: [{ code: 'UNMINIMIZED_FEEDBACK', summary: 'Input contains unminimized PII.', severity: 'MEDIUM' }],
        evidenceRefs: [],
        toolRequests: [],
        unresolvedFacts: ['Feedback requires minimization before analysis.'],
        safeHoldReason: 'Feedback must be aggregated and minimized to protect user privacy.',
      };
    }

    const validRefs = invocation.safeContext.sourceRefs.filter(ref =>
      ref.includes('product_telemetry') ||
      ref.includes('ux_artifacts') ||
      ref.includes('support_aggregates')
    );

    if (validRefs.length === 0 && !invocation.safeContext.content.includes('approved_telemetry')) {
      return {
        status: 'SAFE_HOLD',
        findings: [{ code: 'UNAPPROVED_TELEMETRY', summary: 'Requires approved product telemetry or artifacts.', severity: 'MEDIUM' }],
        evidenceRefs: [],
        toolRequests: [],
        unresolvedFacts: ['Missing approved UX context.'],
        safeHoldReason: 'Requires approved product telemetry or artifacts.',
      };
    }
    
    if (invocation.requestedTask.instruction.includes('missing telemetry')) {
       return {
         status: 'SAFE_HOLD',
         findings: [],
         evidenceRefs: [],
         toolRequests: [],
         unresolvedFacts: [],
         safeHoldReason: 'INSUFFICIENT_EVIDENCE: Cannot fabricate metrics for missing telemetry.'
       };
    }

    let uxData;
    try {
      uxData = await this.provider(invocation);
    } catch (e: any) {
      return blocked(`Analysis failed: ${e.message}`);
    }

    const findings: SpecialistFinding[] = [
      {
        code: 'UX_ANALYSIS_COMPLETED',
        summary: `Prioritized finding (${uxData.priority}): ${uxData.finding}`,
        severity: 'INFO',
      }
    ];

    return {
      status: 'COMPLETED',
      findings,
      evidenceRefs: validRefs,
      recommendedNextStep: 'HANDOFF TO NORMAL ENGINEERING: Evaluate acceptance criteria and consider experiment plan.',
      toolRequests: [],
      unresolvedFacts: [],
      draftResponse: `Friction Finding (${uxData.priority}): ${uxData.finding}\nHypothesis: ${uxData.hypothesis}\nAcceptance Criteria:\n${uxData.acceptanceCriteria.map(c => `- ${c}`).join('\n')}\nExperiment: ${uxData.experimentRecommendation}\nMeasurement: ${uxData.measurementPlan}\nRECOMMENDATION ONLY - NO AUTONOMOUS UI MODIFICATION.`,
      metrics: {
        'ux_reviews': 1
      }
    };
  }
}
