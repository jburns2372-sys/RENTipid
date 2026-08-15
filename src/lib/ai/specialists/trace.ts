import { SpecialistInvocationContract, SpecialistResultContract } from './contracts';
import { Revision2SpecialistId } from './framework-registry';

export type SpecialistConfirmationState = 'NOT_REQUIRED' | 'REQUIRED' | 'CONFIRMED' | 'DENIED' | 'EXPIRED';

export interface SpecialistTraceEnvelope {
  traceId: string;
  sessionId: string;
  caseId?: string;
  entityRefs: readonly { entityType: string; entityId: string }[];
  actorId: string;
  persistedRole: string;
  tenantScope?: string;
  intent: string;
  answerClass: string;
  selectedSpecialist: Revision2SpecialistId;
  specialistVersion: string;
  declaredConsultedSpecialists: readonly Revision2SpecialistId[];
  knowledgeRefs: readonly string[];
  requestedTools: readonly string[];
  executedTools: readonly string[];
  policyDecisionRefs: readonly string[];
  confirmationState: SpecialistConfirmationState;
  resultStatus: string;
  safeHoldReason?: string;
  latencyMs?: number;
  boundedCostMetrics?: Readonly<Record<string, number>>;
  finalResponseRef?: string;
  environment?: 'development' | 'test' | 'production' | 'unknown';
  commitIdentity?: string;
}

export interface SpecialistTraceInput {
  invocation: SpecialistInvocationContract;
  result: SpecialistResultContract;
  declaredConsultedSpecialists?: readonly Revision2SpecialistId[];
  knowledgeRefs?: readonly string[];
  executedTools?: readonly string[];
  policyDecisionRefs?: readonly string[];
  confirmationState?: SpecialistConfirmationState;
  tenantScope?: string;
  latencyMs?: number;
  boundedCostMetrics?: Readonly<Record<string, number>>;
  finalResponseRef?: string;
  environment?: 'development' | 'test' | 'production' | 'unknown';
  commitIdentity?: string;
}

const bounded = (value: string | undefined, maximum: number, field: string) => {
  if (value === undefined) return undefined;
  const normalized = value.trim();
  if (!normalized || normalized.length > maximum) throw new Error(`INVALID_SPECIALIST_TRACE_${field}`);
  return normalized;
};

const refs = (values: readonly string[], field: string) => {
  if (values.length > 25) throw new Error(`INVALID_SPECIALIST_TRACE_${field}`);
  return Object.freeze(values.map(value => bounded(value, 200, field)!));
};

export function createSpecialistTraceEnvelope(input: SpecialistTraceInput): Readonly<SpecialistTraceEnvelope> {
  if (input.latencyMs !== undefined && (!Number.isFinite(input.latencyMs) || input.latencyMs < 0)) {
    throw new Error('INVALID_SPECIALIST_TRACE_LATENCY');
  }
  if (input.boundedCostMetrics && Object.keys(input.boundedCostMetrics).length > 10) {
    throw new Error('INVALID_SPECIALIST_TRACE_COST_METRICS');
  }

  return Object.freeze({
    traceId: input.invocation.traceId,
    sessionId: input.invocation.sessionId,
    caseId: input.invocation.caseId,
    entityRefs: Object.freeze(input.invocation.entityRefs.map(reference => Object.freeze({ ...reference }))),
    actorId: input.invocation.actorId,
    persistedRole: input.invocation.persistedRole,
    tenantScope: bounded(input.tenantScope, 100, 'TENANT_SCOPE'),
    intent: input.invocation.intent,
    answerClass: input.invocation.answerClass,
    selectedSpecialist: input.invocation.specialistId,
    specialistVersion: input.invocation.specialistVersion,
    declaredConsultedSpecialists: Object.freeze([...(input.declaredConsultedSpecialists ?? [])]),
    knowledgeRefs: refs(input.knowledgeRefs ?? input.invocation.safeContext.sourceRefs, 'KNOWLEDGE_REFS'),
    requestedTools: refs(input.result.toolRequests.map(request => request.toolName), 'REQUESTED_TOOLS'),
    executedTools: refs(input.executedTools ?? [], 'EXECUTED_TOOLS'),
    policyDecisionRefs: refs(input.policyDecisionRefs ?? [], 'POLICY_REFS'),
    confirmationState: input.confirmationState ?? 'NOT_REQUIRED',
    resultStatus: input.result.status,
    safeHoldReason: bounded(input.result.safeHoldReason, 500, 'SAFE_HOLD_REASON'),
    latencyMs: input.latencyMs,
    boundedCostMetrics: input.boundedCostMetrics ? Object.freeze({ ...input.boundedCostMetrics }) : undefined,
    finalResponseRef: bounded(input.finalResponseRef, 200, 'FINAL_RESPONSE_REF'),
    environment: input.environment,
    commitIdentity: bounded(input.commitIdentity, 100, 'COMMIT_IDENTITY'),
  });
}