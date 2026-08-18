import {
  createSpecialistInvocationContract,
  createSpecialistResultContract,
  SpecialistInvocationContract,
  SpecialistInvocationInput,
  SpecialistResultContract,
  SpecialistResultInput,
} from './contracts';
import { revision2SpecialistRegistry, Revision2SpecialistDefinition, Revision2SpecialistId } from './framework-registry';
import {
  intentOwnershipRegistry,
  IntentOwnershipDefinition,
  IntentOwnershipRegistry,
  IntentOwnershipRegistryError,
} from './ownership-registry';
import { evaluateSpecialistPermission, SpecialistPermissionDecision } from './permission-matrix';
import { aiSpecialistRegistry, AiSpecialist } from './registry';
import { createSpecialistTraceEnvelope, SpecialistTraceEnvelope } from './trace';

export interface SpecialistSelection {
  ownership: IntentOwnershipDefinition;
  definition: Revision2SpecialistDefinition;
  supportSubdomain?: AiSpecialist;
  usedFallback: boolean;
}

export class SpecialistSelectionError extends Error {
  constructor(readonly code: 'SPECIALIST_DISABLED' | 'INVALID_FALLBACK' | 'INVOCATION_MISMATCH', message: string) {
    super(message);
    this.name = 'SpecialistSelectionError';
  }
}

export type SpecialistFeatureStates = Readonly<Record<string, boolean>>;

declare const orchestratorAuthorityBrand: unique symbol;
export interface SpecialistInvocationAuthority {
  readonly [orchestratorAuthorityBrand]: 'UNIFIED_AI_ORCHESTRATOR';
}

const ORCHESTRATOR_AUTHORITY = Object.freeze({}) as SpecialistInvocationAuthority;

export interface SpecialistExecutor {
  execute(
    invocation: Readonly<SpecialistInvocationContract>,
    authority: SpecialistInvocationAuthority,
  ): Promise<SpecialistResultInput>;
}

export interface SpecialistExecution {
  result: Readonly<SpecialistResultContract>;
  trace: Readonly<SpecialistTraceEnvelope>;
}

const featureEnabled = (definition: Revision2SpecialistDefinition, states: SpecialistFeatureStates) =>
  definition.status === 'ENABLED' && states[definition.featureFlag] !== false;

export class UnifiedAiSpecialistOrchestrator {
  constructor(
    private readonly ownershipRegistry: IntentOwnershipRegistry = intentOwnershipRegistry,
    private readonly definitions: Readonly<Record<Revision2SpecialistId, Revision2SpecialistDefinition>> = revision2SpecialistRegistry,
  ) {}

  select(intent: string | undefined, featureStates: SpecialistFeatureStates = {}): SpecialistSelection {
    const ownership = this.ownershipRegistry.resolveWithGeneralFallback(intent);
    const primary = this.definitions[ownership.primarySpecialistId];
    if (primary && featureEnabled(primary, featureStates)) {
      return Object.freeze({
        ownership,
        definition: primary,
        supportSubdomain: ownership.supportSubdomainId ? aiSpecialistRegistry[ownership.supportSubdomainId] : undefined,
        usedFallback: false,
      });
    }

    if (!ownership.fallback) {
      throw new SpecialistSelectionError('SPECIALIST_DISABLED', `Specialist '${ownership.primarySpecialistId}' is disabled.`);
    }
    const fallback = this.definitions[ownership.fallback.primarySpecialistId];
    if (!fallback || !featureEnabled(fallback, featureStates) || fallback.id === ownership.primarySpecialistId) {
      throw new SpecialistSelectionError('INVALID_FALLBACK', `Fallback for '${ownership.intent}' is unavailable.`);
    }
    return Object.freeze({
      ownership,
      definition: fallback,
      supportSubdomain: ownership.fallback.supportSubdomainId
        ? aiSpecialistRegistry[ownership.fallback.supportSubdomainId]
        : undefined,
      usedFallback: true,
    });
  }

  declaredConsultations(selection: SpecialistSelection): readonly Revision2SpecialistId[] {
    return Object.freeze([...selection.ownership.consultedSpecialists]);
  }

  permissionFor(
    selection: SpecialistSelection,
    input: Omit<Parameters<typeof evaluateSpecialistPermission>[0], 'specialistId' | 'supportSubdomain'>,
  ): SpecialistPermissionDecision {
    return evaluateSpecialistPermission({
      ...input,
      specialistId: selection.definition.id,
      supportSubdomain: selection.supportSubdomain,
    });
  }

  createInvocation(selection: SpecialistSelection, input: SpecialistInvocationInput): Readonly<SpecialistInvocationContract> {
    if (input.intent !== selection.ownership.intent) {
      throw new SpecialistSelectionError('INVOCATION_MISMATCH', 'Invocation intent does not match orchestrator ownership.');
    }
    return createSpecialistInvocationContract(selection.definition.id, selection.definition.version, input);
  }

  async invoke(
    selection: SpecialistSelection,
    invocation: Readonly<SpecialistInvocationContract>,
    executor: SpecialistExecutor,
  ): Promise<SpecialistExecution> {
    if (invocation.specialistId !== selection.definition.id || invocation.intent !== selection.ownership.intent) {
      throw new SpecialistSelectionError('INVOCATION_MISMATCH', 'Only the selected specialist may execute this invocation.');
    }
    const startedAt = Date.now();
    const resultInput = await executor.execute(invocation, ORCHESTRATOR_AUTHORITY);
    const result = createSpecialistResultContract(invocation, resultInput);
    for (const request of result.toolRequests) {
      if (!invocation.allowedToolScopes.includes(request.toolName)) {
        throw new SpecialistSelectionError('INVOCATION_MISMATCH', `Result requested unscoped tool '${request.toolName}'.`);
      }
    }
    const trace = createSpecialistTraceEnvelope({
      invocation,
      result,
      declaredConsultedSpecialists: this.declaredConsultations(selection),
      latencyMs: Date.now() - startedAt,
      environment: process.env.NODE_ENV === 'production'
        ? 'production'
        : process.env.NODE_ENV === 'test'
          ? 'test'
          : 'development',
      commitIdentity: process.env.VERCEL_GIT_COMMIT_SHA,
    });
    return Object.freeze({ result, trace });
  }
}

export const unifiedAiSpecialistOrchestrator = new UnifiedAiSpecialistOrchestrator();

export function isOwnershipError(error: unknown): error is IntentOwnershipRegistryError {
  return error instanceof IntentOwnershipRegistryError;
}