import "server-only";

import { randomUUID } from "crypto";
import type { ApiSecurityLog, PrismaClient } from "@prisma/client";
import { SecurityEnvironment, SecurityLifecycle } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { ApiSecurityLogAdapter } from "@/lib/security/events/adapters/api-security-adapter";
import { logAdministrationEvent } from "@/lib/security/events/writers/administration-writer";
import { evaluateRuleDsl } from "@/lib/security/rules/dsl/evaluator";
import { RuleDslV1Schema } from "@/lib/security/rules/dsl/schema";

export const SIMULATION_SCENARIOS = ["API_AUTHORIZATION_PROBE"] as const;
export type SimulationScenario = (typeof SIMULATION_SCENARIOS)[number];

const simulationRequestSchema = z
  .object({ scenario: z.enum(SIMULATION_SCENARIOS) })
  .strict();

const simulationAuditSchema = z
  .object({
    simulation_only: z.literal(true),
    simulation_reference: z.string().min(1).max(100),
    scenario: z.enum(SIMULATION_SCENARIOS),
    event_reference: z.string().min(1).max(120),
    expected_outcome: z.string().min(1).max(160),
    actual_outcome: z.string().min(1).max(160),
    result: z.enum(["PASS", "FAIL"]),
    started_at: z.string().datetime(),
    completed_at: z.string().datetime(),
    triggered_rule_id: z.string().min(1).max(191).optional(),
    incident_result: z.literal("NOT_CREATED_SIMULATION_SAFETY"),
    response_result: z.literal("NOT_EXECUTED_SIMULATION_SAFETY"),
    environment: z.literal("TEST"),
    lifecycle: z.literal("SIMULATION"),
  })
  .strict();

export const SIMULATION_SAFETY_CAPABILITIES = Object.freeze({
  changesRealFinancialState: false,
  deletesProductionData: false,
  disablesRealSecurityControls: false,
  overridesRbac: false,
  bypassesApprovals: false,
  arbitraryCommandExecution: false,
  arbitraryEventPayload: false,
});

export const SCENARIO_CATALOG = Object.freeze({
  API_AUTHORIZATION_PROBE: Object.freeze({
    scenario: "API_AUTHORIZATION_PROBE" as const,
    title: "API authorization probe",
    description:
      "Normalizes a fixed simulated API authorization denial and evaluates it against the existing database-backed authorization-probe rule DSL.",
    ruleId: "API-AUTHORIZATION-PROBE-01",
    sourcePath: "ApiSecurityLogAdapter → DetectionRule DSL evaluator",
    expectedOutcome: "RULE_PREDICATE_MATCHED",
  }),
});

type SimulationDatabase = Pick<PrismaClient, "auditLog" | "detectionRule">;

export interface SimulationCatalogItem {
  scenario: SimulationScenario;
  title: string;
  description: string;
  existingSocPath: string;
  expectedOutcome: string;
  supported: boolean;
  supportReason: string;
}

export interface SimulationResult {
  simulationReference: string;
  scenario: SimulationScenario;
  simulationOnly: true;
  lifecycle: "SIMULATION";
  environment: "TEST";
  startedAt: Date;
  completedAt: Date;
  eventReference: string;
  expectedOutcome: string;
  actualOutcome: string;
  result: "PASS" | "FAIL";
  triggeredRuleId: string | null;
  incidentReference: null;
  incidentResult: "NOT_CREATED_SIMULATION_SAFETY";
  responseResult: "NOT_EXECUTED_SIMULATION_SAFETY";
}

export interface SimulationHistoryItem extends SimulationResult {
  initiator: string;
}

type AuditWriter = typeof logAdministrationEvent;

export interface SimulationDependencies {
  database: SimulationDatabase;
  auditWriter: AuditWriter;
  now: () => Date;
  createReference: () => string;
}

const defaultDependencies: SimulationDependencies = {
  database: prisma,
  auditWriter: logAdministrationEvent,
  now: () => new Date(),
  createReference: () => randomUUID(),
};

export class SimulationRequestError extends Error {
  constructor(public readonly code: "INVALID_REQUEST" | "SCENARIO_UNAVAILABLE" | "AUDIT_REQUIRED") {
    super(code);
    this.name = "SimulationRequestError";
  }
}

export function validateSimulationRequest(input: unknown): {
  scenario: SimulationScenario;
} {
  const parsed = simulationRequestSchema.safeParse(input);
  if (!parsed.success) throw new SimulationRequestError("INVALID_REQUEST");
  return parsed.data;
}

export async function loadSimulationCatalog(
  database: SimulationDatabase = prisma,
): Promise<SimulationCatalogItem[]> {
  const definition = SCENARIO_CATALOG.API_AUTHORIZATION_PROBE;
  let supported = false;

  try {
    const activeRule = await database.detectionRule.findFirst({
      where: { rule_id: definition.ruleId, status: "ACTIVE" },
      select: { id: true },
    });
    supported = Boolean(activeRule);
  } catch {
    supported = false;
  }

  return [
    {
      scenario: definition.scenario,
      title: definition.title,
      description: definition.description,
      existingSocPath: definition.sourcePath,
      expectedOutcome: definition.expectedOutcome,
      supported,
      supportReason: supported
        ? "The authoritative detection rule is active."
        : "The authoritative detection rule is not active or could not be read.",
    },
  ];
}

async function writeVerifiedAudit(
  dependencies: SimulationDependencies,
  payload: Parameters<AuditWriter>[0],
): Promise<void> {
  await dependencies.auditWriter(payload);
  const verified = await dependencies.database.auditLog.findFirst({
    where: {
      action: payload.action,
      module: payload.targetType,
      target_id: payload.targetId,
    },
    select: { id: true },
  });
  if (!verified) throw new SimulationRequestError("AUDIT_REQUIRED");
}

function buildSyntheticApiLog(
  eventReference: string,
  simulationReference: string,
  occurredAt: Date,
): ApiSecurityLog {
  return {
    id: eventReference,
    event_code: "API_AUTHORIZATION_DENIED",
    outcome: "SIMULATED_DENIAL",
    actor_user_id: null,
    subject_reference_hash: null,
    ip_reference_hash: null,
    device_reference_hash: null,
    target_reference_hash: null,
    safe_route_family: "soc-simulation",
    http_method: "POST",
    policy_family: "SOC_SIMULATION",
    threshold_category: null,
    distinct_target_count: null,
    correlation_id: simulationReference,
    environment: SecurityEnvironment.TEST,
    lifecycle: SecurityLifecycle.SIMULATION,
    sanitized_metadata: JSON.stringify({
      simulation_only: true,
      simulation_reference: simulationReference,
    }),
    occurred_at: occurredAt,
    created_at: occurredAt,
  };
}

export async function executeSimulation(
  actorUserId: string,
  input: unknown,
  overrides: Partial<SimulationDependencies> = {},
): Promise<SimulationResult> {
  const request = validateSimulationRequest(input);
  const dependencies = { ...defaultDependencies, ...overrides };
  const definition = SCENARIO_CATALOG[request.scenario];
  const rule = await dependencies.database.detectionRule.findFirst({
    where: { rule_id: definition.ruleId, status: "ACTIVE" },
    select: {
      rule_id: true,
      evaluation_dsl: true,
    },
  });
  if (!rule) throw new SimulationRequestError("SCENARIO_UNAVAILABLE");

  const referenceToken = dependencies.createReference();
  const simulationReference = `SIM-${referenceToken}`;
  const eventReference = `SIM-EVT-${referenceToken}`;
  const startedAt = dependencies.now();

  await writeVerifiedAudit(dependencies, {
    action: "SOC_SIMULATION_STARTED",
    outcome: "COMPLETED",
    actorUserId,
    targetType: "SOC_SIMULATION",
    targetId: simulationReference,
    environment: SecurityEnvironment.TEST,
    lifecycle: SecurityLifecycle.SIMULATION,
    metadata: {
      simulation_only: true,
      simulation_reference: simulationReference,
      scenario: request.scenario,
      event_reference: eventReference,
      status: "RUNNING",
    },
  });

  let actualOutcome = "SIMULATION_EXECUTION_FAILED";
  let result: "PASS" | "FAIL" = "FAIL";
  let triggeredRuleId: string | null = null;

  try {
    const adapter = new ApiSecurityLogAdapter();
    const normalized = adapter.normalize(
      buildSyntheticApiLog(eventReference, simulationReference, startedAt),
      SecurityLifecycle.SIMULATION,
      SecurityEnvironment.TEST,
    );
    const dsl = RuleDslV1Schema.parse(rule.evaluation_dsl);
    const matched = evaluateRuleDsl(dsl, normalized as unknown as Record<string, unknown>);

    actualOutcome = matched
      ? "RULE_PREDICATE_MATCHED"
      : "RULE_PREDICATE_DID_NOT_MATCH";
    result = matched ? "PASS" : "FAIL";
    triggeredRuleId = matched ? rule.rule_id : null;
  } catch {
    actualOutcome = "SIMULATION_EXECUTION_FAILED";
    result = "FAIL";
  }

  const completedAt = dependencies.now();
  const resultPayload = {
    simulation_only: true as const,
    simulation_reference: simulationReference,
    scenario: request.scenario,
    event_reference: eventReference,
    expected_outcome: definition.expectedOutcome,
    actual_outcome: actualOutcome,
    result,
    started_at: startedAt.toISOString(),
    completed_at: completedAt.toISOString(),
    ...(triggeredRuleId ? { triggered_rule_id: triggeredRuleId } : {}),
    incident_result: "NOT_CREATED_SIMULATION_SAFETY" as const,
    response_result: "NOT_EXECUTED_SIMULATION_SAFETY" as const,
  };

  await writeVerifiedAudit(dependencies, {
    action: result === "PASS" ? "SOC_SIMULATION_COMPLETED" : "SOC_SIMULATION_FAILED",
    outcome: result === "PASS" ? "COMPLETED" : "FAILED",
    actorUserId,
    targetType: "SOC_SIMULATION",
    targetId: simulationReference,
    environment: SecurityEnvironment.TEST,
    lifecycle: SecurityLifecycle.SIMULATION,
    metadata: resultPayload,
  });

  return {
    simulationReference,
    scenario: request.scenario,
    simulationOnly: true,
    lifecycle: "SIMULATION",
    environment: "TEST",
    startedAt,
    completedAt,
    eventReference,
    expectedOutcome: definition.expectedOutcome,
    actualOutcome,
    result,
    triggeredRuleId,
    incidentReference: null,
    incidentResult: "NOT_CREATED_SIMULATION_SAFETY",
    responseResult: "NOT_EXECUTED_SIMULATION_SAFETY",
  };
}

export async function loadSimulationHistory(
  database: SimulationDatabase = prisma,
): Promise<SimulationHistoryItem[]> {
  const records = await database.auditLog.findMany({
    where: {
      module: "SOC_SIMULATION",
      action: { in: ["SOC_SIMULATION_COMPLETED", "SOC_SIMULATION_FAILED"] },
    },
    orderBy: { created_at: "desc" },
    take: 25,
    select: {
      details: true,
      actor: { select: { full_name: true } },
    },
  });

  const history: SimulationHistoryItem[] = [];
  for (const record of records) {
    if (!record.details) continue;
    try {
      const parsed = simulationAuditSchema.safeParse(JSON.parse(record.details));
      if (!parsed.success) continue;
      const metadata = parsed.data;
      history.push({
        simulationReference: metadata.simulation_reference,
        scenario: metadata.scenario,
        simulationOnly: true,
        lifecycle: "SIMULATION",
        environment: "TEST",
        initiator: record.actor?.full_name ?? "Unknown operator",
        startedAt: new Date(metadata.started_at),
        completedAt: new Date(metadata.completed_at),
        eventReference: metadata.event_reference,
        expectedOutcome: metadata.expected_outcome,
        actualOutcome: metadata.actual_outcome,
        result: metadata.result,
        triggeredRuleId: metadata.triggered_rule_id ?? null,
        incidentReference: null,
        incidentResult: metadata.incident_result,
        responseResult: metadata.response_result,
      });
    } catch {
      // Invalid legacy or unrelated audit details are omitted from the view.
    }
  }
  return history;
}
