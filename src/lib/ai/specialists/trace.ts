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

export type SpecialistFallbackStatus = 'PRIMARY' | 'FALLBACK';
export type SpecialistSupervisorStatus = 'PASS' | 'SAFE_HOLD' | 'SYSTEM_BLOCKED' | 'REQUEST_MISSING_INFORMATION' | 'NOT_RUN';

/**
 * Privacy-bounded request trace persisted in AiMessage.safePayload.
 * It deliberately excludes prompts, raw evidence, actor identity, and hidden reasoning.
 */
export interface BoundedSpecialistTraceRecord {
  contractVersion: 'uaics-specialist-trace.v1';
  traceId: string;
  environment: 'development' | 'test' | 'production' | 'unknown';
  commitIdentity: string | null;
  sessionId: string | null;
  conversationId: string | null;
  caseId: string | null;
  intent: string;
  answerClass: string;
  selectedSpecialist: Revision2SpecialistId;
  specialistVersion: string;
  consultedSpecialists: readonly Revision2SpecialistId[];
  fallbackStatus: SpecialistFallbackStatus;
  requestedTools: readonly string[];
  executedTools: readonly string[];
  policyOutcome: string;
  supervisorStatus: SpecialistSupervisorStatus;
  resultStatus: string;
  safeHoldReasonCode: string | null;
  finalResponseOwner: 'UNIFIED_AI_COMMAND_LAYER';
  finalResponseRef: string | null;
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function safeString(value: unknown, maximum: number): string | null {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maximum
    ? value
    : null;
}

function safeStrings(value: unknown, maximumItems = 25): string[] | null {
  if (!Array.isArray(value) || value.length > maximumItems) return null;
  const values = value.map(item => safeString(item, 200));
  return values.every((item): item is string => item !== null) ? values : null;
}

/** Rebuilds the public admin DTO from an untrusted JSON payload using an explicit allowlist. */
export function readBoundedSpecialistTraceRecord(value: unknown): BoundedSpecialistTraceRecord | null {
  if (!record(value) || value.contractVersion !== 'uaics-specialist-trace.v1') return null;
  const traceId = safeString(value.traceId, 200);
  const intent = safeString(value.intent, 100);
  const answerClass = safeString(value.answerClass, 50);
  const selectedSpecialist = safeString(value.selectedSpecialist, 100) as Revision2SpecialistId | null;
  const specialistVersion = safeString(value.specialistVersion, 50);
  const consultedSpecialists = safeStrings(value.consultedSpecialists) as Revision2SpecialistId[] | null;
  const requestedTools = safeStrings(value.requestedTools, 10);
  const executedTools = safeStrings(value.executedTools, 10);
  const policyOutcome = safeString(value.policyOutcome, 100);
  const supervisorStatus = safeString(value.supervisorStatus, 50) as SpecialistSupervisorStatus | null;
  const resultStatus = safeString(value.resultStatus, 100);
  if (
    !traceId || !intent || !answerClass || !selectedSpecialist || !specialistVersion
    || !consultedSpecialists || !requestedTools || !executedTools || !policyOutcome
    || !supervisorStatus || !resultStatus
  ) return null;
  if (!['development', 'test', 'production', 'unknown'].includes(String(value.environment))) return null;
  if (!['PRIMARY', 'FALLBACK'].includes(String(value.fallbackStatus))) return null;
  if (!['PASS', 'SAFE_HOLD', 'SYSTEM_BLOCKED', 'REQUEST_MISSING_INFORMATION', 'NOT_RUN'].includes(supervisorStatus)) return null;
  if (value.finalResponseOwner !== 'UNIFIED_AI_COMMAND_LAYER') return null;

  const nullable = (field: unknown, maximum: number) => field === null ? null : safeString(field, maximum);
  const commitIdentity = nullable(value.commitIdentity, 100);
  const sessionId = nullable(value.sessionId, 200);
  const conversationId = nullable(value.conversationId, 200);
  const caseId = nullable(value.caseId, 200);
  const safeHoldReasonCode = nullable(value.safeHoldReasonCode, 100);
  const finalResponseRef = nullable(value.finalResponseRef, 200);
  if (
    (value.commitIdentity !== null && !commitIdentity)
    || (value.sessionId !== null && !sessionId)
    || (value.conversationId !== null && !conversationId)
    || (value.caseId !== null && !caseId)
    || (value.safeHoldReasonCode !== null && !safeHoldReasonCode)
    || (value.finalResponseRef !== null && !finalResponseRef)
  ) return null;

  return Object.freeze({
    contractVersion: 'uaics-specialist-trace.v1',
    traceId,
    environment: value.environment as BoundedSpecialistTraceRecord['environment'],
    commitIdentity,
    sessionId,
    conversationId,
    caseId,
    intent,
    answerClass,
    selectedSpecialist,
    specialistVersion,
    consultedSpecialists: Object.freeze(consultedSpecialists),
    fallbackStatus: value.fallbackStatus as SpecialistFallbackStatus,
    requestedTools: Object.freeze(requestedTools),
    executedTools: Object.freeze(executedTools),
    policyOutcome,
    supervisorStatus,
    resultStatus,
    safeHoldReasonCode,
    finalResponseOwner: 'UNIFIED_AI_COMMAND_LAYER',
    finalResponseRef,
  });
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
