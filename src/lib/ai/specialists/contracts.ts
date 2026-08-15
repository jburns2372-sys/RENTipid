import { Revision2SpecialistId, SpecialistMaturityLevel } from './framework-registry';

export type SpecialistAnswerClass = 'INFORMATION' | 'PERSONALIZED' | 'DRAFT' | 'ACTION';
export type SpecialistRiskClass = 'T0_INFORMATION' | 'T1_PERSONALIZED' | 'T2_OPERATIONAL' | 'T3_PROHIBITED';
export type SpecialistResultStatus = 'COMPLETED' | 'NEEDS_INFORMATION' | 'SAFE_HOLD' | 'SYSTEM_BLOCKED';

export interface SpecialistEntityReference {
  entityType: string;
  entityId: string;
}

export interface SpecialistSafeContext {
  content: string;
  sourceRefs: readonly string[];
}

export interface SpecialistRequestedTask {
  code: string;
  instruction: string;
}

export interface SpecialistInvocationContract {
  specialistId: Revision2SpecialistId;
  specialistVersion: string;
  actorId: string;
  persistedRole: string;
  sessionId: string;
  caseId?: string;
  entityRefs: readonly SpecialistEntityReference[];
  intent: string;
  answerClass: SpecialistAnswerClass;
  riskClass: SpecialistRiskClass;
  safeContext: SpecialistSafeContext;
  requestedTask: SpecialistRequestedTask;
  allowedToolScopes: readonly string[];
  locale?: string;
  traceId: string;
}

export interface SpecialistFinding {
  code: string;
  summary: string;
  severity?: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface SpecialistToolRequest {
  toolName: string;
  parametersRef?: string;
  riskClass: SpecialistRiskClass;
}

export interface SpecialistResultContract {
  specialistId: Revision2SpecialistId;
  specialistVersion: string;
  status: SpecialistResultStatus;
  findings: readonly SpecialistFinding[];
  evidenceRefs: readonly string[];
  recommendedNextStep?: string;
  toolRequests: readonly SpecialistToolRequest[];
  draftResponse?: string;
  confidence?: number;
  unresolvedFacts: readonly string[];
  safeHoldReason?: string;
  metrics?: Readonly<Record<string, number>>;
  traceId: string;
}

export interface SpecialistInvocationInput {
  actorId: string;
  persistedRole: string;
  sessionId: string;
  caseId?: string;
  entityRefs?: readonly SpecialistEntityReference[];
  intent: string;
  answerClass: SpecialistAnswerClass;
  riskClass: SpecialistRiskClass;
  safeContext: SpecialistSafeContext;
  requestedTask: SpecialistRequestedTask;
  allowedToolScopes: readonly string[];
  locale?: string;
  traceId: string;
}

export type SpecialistResultInput = Omit<SpecialistResultContract, 'specialistId' | 'specialistVersion' | 'traceId'>;

const LIMITS = {
  id: 200,
  role: 100,
  intent: 100,
  context: 20_000,
  task: 10_000,
  text: 4_000,
  refs: 25,
  findings: 20,
  tools: 10,
  metrics: 20,
} as const;

function bounded(value: string, field: string, maximum: number): string {
  const normalized = value.trim();
  if (!normalized || normalized.length > maximum) throw new Error(`INVALID_SPECIALIST_${field.toUpperCase()}`);
  return normalized;
}

function boundedOptional(value: string | undefined, field: string, maximum: number): string | undefined {
  return value === undefined ? undefined : bounded(value, field, maximum);
}

function boundedRefs(values: readonly string[], field: string): readonly string[] {
  if (values.length > LIMITS.refs) throw new Error(`INVALID_SPECIALIST_${field.toUpperCase()}`);
  return Object.freeze(values.map(value => bounded(value, field, LIMITS.id)));
}

export function createSpecialistInvocationContract(
  specialistId: Revision2SpecialistId,
  specialistVersion: string,
  input: SpecialistInvocationInput,
): Readonly<SpecialistInvocationContract> {
  if ((input.entityRefs?.length ?? 0) > LIMITS.refs) throw new Error('INVALID_SPECIALIST_ENTITY_REFS');
  if (input.allowedToolScopes.length > LIMITS.tools) throw new Error('INVALID_SPECIALIST_TOOL_SCOPES');

  return Object.freeze({
    specialistId,
    specialistVersion: bounded(specialistVersion, 'version', 50),
    actorId: bounded(input.actorId, 'actor_id', LIMITS.id),
    persistedRole: bounded(input.persistedRole, 'persisted_role', LIMITS.role),
    sessionId: bounded(input.sessionId, 'session_id', LIMITS.id),
    caseId: boundedOptional(input.caseId, 'case_id', LIMITS.id),
    entityRefs: Object.freeze((input.entityRefs ?? []).map(reference => Object.freeze({
      entityType: bounded(reference.entityType, 'entity_type', 100),
      entityId: bounded(reference.entityId, 'entity_id', LIMITS.id),
    }))),
    intent: bounded(input.intent, 'intent', LIMITS.intent),
    answerClass: input.answerClass,
    riskClass: input.riskClass,
    safeContext: Object.freeze({
      content: bounded(input.safeContext.content, 'safe_context', LIMITS.context),
      sourceRefs: boundedRefs(input.safeContext.sourceRefs, 'safe_context_ref'),
    }),
    requestedTask: Object.freeze({
      code: bounded(input.requestedTask.code, 'task_code', 100),
      instruction: bounded(input.requestedTask.instruction, 'task_instruction', LIMITS.task),
    }),
    allowedToolScopes: boundedRefs(input.allowedToolScopes, 'tool_scope'),
    locale: boundedOptional(input.locale, 'locale', 30),
    traceId: bounded(input.traceId, 'trace_id', LIMITS.id),
  });
}

export function createSpecialistResultContract(
  invocation: SpecialistInvocationContract,
  input: SpecialistResultInput,
): Readonly<SpecialistResultContract> {
  if (input.findings.length > LIMITS.findings) throw new Error('INVALID_SPECIALIST_FINDINGS');
  if (input.toolRequests.length > LIMITS.tools) throw new Error('INVALID_SPECIALIST_TOOL_REQUESTS');
  if (input.unresolvedFacts.length > LIMITS.refs) throw new Error('INVALID_SPECIALIST_UNRESOLVED_FACTS');
  if (input.confidence !== undefined && (input.confidence < 0 || input.confidence > 1)) throw new Error('INVALID_SPECIALIST_CONFIDENCE');
  if (input.metrics && Object.keys(input.metrics).length > LIMITS.metrics) throw new Error('INVALID_SPECIALIST_METRICS');

  return Object.freeze({
    specialistId: invocation.specialistId,
    specialistVersion: invocation.specialistVersion,
    status: input.status,
    findings: Object.freeze(input.findings.map(finding => Object.freeze({
      code: bounded(finding.code, 'finding_code', 100),
      summary: bounded(finding.summary, 'finding_summary', LIMITS.text),
      severity: finding.severity,
    }))),
    evidenceRefs: boundedRefs(input.evidenceRefs, 'evidence_ref'),
    recommendedNextStep: boundedOptional(input.recommendedNextStep, 'next_step', LIMITS.text),
    toolRequests: Object.freeze(input.toolRequests.map(request => Object.freeze({
      toolName: bounded(request.toolName, 'tool_name', 100),
      parametersRef: boundedOptional(request.parametersRef, 'parameters_ref', LIMITS.id),
      riskClass: request.riskClass,
    }))),
    draftResponse: boundedOptional(input.draftResponse, 'draft_response', LIMITS.text),
    confidence: input.confidence,
    unresolvedFacts: boundedRefs(input.unresolvedFacts, 'unresolved_fact'),
    safeHoldReason: boundedOptional(input.safeHoldReason, 'safe_hold_reason', LIMITS.text),
    metrics: input.metrics ? Object.freeze({ ...input.metrics }) : undefined,
    traceId: invocation.traceId,
  });
}

export const maturityRiskCeiling: Readonly<Record<SpecialistMaturityLevel, SpecialistRiskClass>> = {
  L1_OBSERVE_RECOMMEND: 'T0_INFORMATION',
  L2_DRAFT: 'T0_INFORMATION',
  L3_EXECUTE_LOW_RISK: 'T1_PERSONALIZED',
  L4_EXECUTE_POLICY_APPROVED_OPERATIONAL: 'T2_OPERATIONAL',
};