import {
  SpecialistFinding,
  SpecialistInvocationContract,
  SpecialistResultInput,
} from './contracts';
import { SpecialistExecutor, SpecialistInvocationAuthority } from './orchestrator';

export type IncidentTelemetryProvider = (
  invocation: Readonly<SpecialistInvocationContract>,
) => Promise<{ logs: any[]; events: any[]; timeline: any[]; confidence: 'HIGH' | 'MEDIUM' | 'LOW'; likelyCause?: string }>;

const mutationPattern =
  /\b(?:deploy|restart|rollback|migrate|run migration|change schema|reboot|shutdown|start worker)\b/i;

const redactionPattern = /\b(?:password|secret|token|key|cvv|credit_card|ssn|api_key)\b/i;

function blocked(reason: string, code: string = 'RCA_AUTHORITY_BLOCKED'): SpecialistResultInput {
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
    findings: [{ code: 'RCA_SAFE_HOLD', summary: reason, severity: 'MEDIUM' }],
    evidenceRefs,
    recommendedNextStep: 'Provide bounded telemetry context to proceed with RCA.',
    toolRequests: [],
    unresolvedFacts,
    safeHoldReason: reason,
  };
}

export class IncidentRCASpecialistExecutor implements SpecialistExecutor {
  constructor(private readonly provider: IncidentTelemetryProvider) {}

  async execute(
    invocation: Readonly<SpecialistInvocationContract>,
    _authority: SpecialistInvocationAuthority,
  ): Promise<SpecialistResultInput> {
    if (invocation.specialistId !== 'IncidentRCASpecialist') {
      throw new Error('INCIDENT_RCA_SPECIALIST_INVOCATION_REQUIRED');
    }

    if (mutationPattern.test(invocation.requestedTask.instruction)) {
      return blocked('Production-state mutation (deploy/restart/schema) is denied.', 'PRODUCTION_MUTATION_DENIED');
    }

    if (redactionPattern.test(invocation.safeContext.content)) {
       return safeHold(
        'Redaction failure: sensitive terms found in context.',
        ['Unredacted sensitive data.'],
        [],
      );
    }

    const validRefs = invocation.safeContext.sourceRefs.filter(ref =>
      ref.includes('system_logs') ||
      ref.includes('api_errors') ||
      ref.includes('deployment_events') ||
      ref.includes('processor_telemetry') ||
      ref.includes('telemetry')
    );

    if (validRefs.length === 0 && !invocation.safeContext.content.includes('approved_telemetry')) {
      return safeHold(
        'Incident RCA requires approved, bounded telemetry context.',
        ['Missing approved telemetry sources.'],
        invocation.safeContext.sourceRefs,
      );
    }
    
    if (invocation.safeContext.content.includes('unbounded') || invocation.safeContext.content.includes('all time')) {
        return blocked('Time window must be bounded.', 'UNBOUNDED_TIME_WINDOW');
    }
    
    if (invocation.safeContext.content.includes('millions of events')) {
        return blocked('Event count exceeds safe limits.', 'EVENT_COUNT_EXCEEDED');
    }

    const findings: SpecialistFinding[] = [
      {
        code: 'RCA_INTENT_CLASSIFIED',
        summary: `Validated intent: ${invocation.intent}`,
        severity: 'INFO',
      }
    ];

    let rcaData;
    try {
      rcaData = await this.provider(invocation);
    } catch (e: any) {
      if (e.message.includes('missing evidence') || e.message.includes('insufficient')) {
          return safeHold(
            'Insufficient evidence to form a root cause hypothesis.',
            ['Lack of correlating logs or error traces.'],
            validRefs,
          );
      }
      return blocked(`RCA failed: ${e.message}`);
    }

    const likelyCause = rcaData.likelyCause ?? 'UNKNOWN';

    findings.push({
      code: 'RCA_ANALYSIS_COMPLETED',
      summary: `Correlated ${rcaData.events.length} events. Likely Cause: ${likelyCause}`,
      severity: rcaData.confidence === 'HIGH' ? 'INFO' : 'MEDIUM',
    });

    return {
      status: 'COMPLETED',
      findings,
      evidenceRefs: [...validRefs],
      recommendedNextStep: 'Review hypothesis and initiate standard engineering remediation if confirmed.',
      toolRequests: [],
      unresolvedFacts: [],
      draftResponse: `RCA result: Likely Cause: ${likelyCause}. Confidence: ${rcaData.confidence}. Timeline events: ${rcaData.timeline.length}`,
      metrics: {
        'events_analyzed': rcaData.events.length
      }
    };
  }
}
