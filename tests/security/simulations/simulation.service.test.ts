jest.mock("@/lib/prisma", () => ({ prisma: {} }));

import {
  executeSimulation,
  loadSimulationCatalog,
  loadSimulationHistory,
  SIMULATION_SAFETY_CAPABILITIES,
  SimulationRequestError,
  validateSimulationRequest,
} from "@/lib/security/simulations/simulation.service";

function createSimulationDatabase() {
  return {
    detectionRule: { findFirst: jest.fn() },
    auditLog: { findFirst: jest.fn(), findMany: jest.fn() },
  };
}

const activeRule = {
  rule_id: "API-AUTHORIZATION-PROBE-01",
  evaluation_dsl: {
    AND: [
      {
        field: "event_code",
        operator: "EQUALS",
        value: "API_AUTHORIZATION_DENIED",
      },
    ],
  },
};

describe("SOC v1.1 simulation service", () => {
  it("accepts only the fixed supported scenario and rejects arbitrary payloads", () => {
    expect(validateSimulationRequest({ scenario: "API_AUTHORIZATION_PROBE" })).toEqual({
      scenario: "API_AUTHORIZATION_PROBE",
    });
    expect(() => validateSimulationRequest({ scenario: "DELETE_PRODUCTION_DATA" })).toThrow(
      SimulationRequestError,
    );
    expect(() =>
      validateSimulationRequest({
        scenario: "API_AUTHORIZATION_PROBE",
        event: { action: "arbitrary" },
      }),
    ).toThrow(SimulationRequestError);
  });

  it("runs the existing adapter and active rule DSL with simulation markers", async () => {
    const database = createSimulationDatabase();
    const auditWriter = jest.fn().mockResolvedValue(undefined);
    const startedAt = new Date("2026-08-09T10:00:00.000Z");
    const completedAt = new Date("2026-08-09T10:00:01.000Z");
    database.detectionRule.findFirst.mockResolvedValue(activeRule);
    database.auditLog.findFirst.mockResolvedValue({ id: "audit-verified" });

    const result = await executeSimulation(
      "soc-operator",
      { scenario: "API_AUTHORIZATION_PROBE" },
      {
        database: database as never,
        auditWriter,
        createReference: () => "reference-1",
        now: jest.fn().mockReturnValueOnce(startedAt).mockReturnValueOnce(completedAt),
      },
    );

    expect(result).toEqual({
      simulationReference: "SIM-reference-1",
      scenario: "API_AUTHORIZATION_PROBE",
      simulationOnly: true,
      lifecycle: "SIMULATION",
      environment: "TEST",
      startedAt,
      completedAt,
      eventReference: "SIM-EVT-reference-1",
      expectedOutcome: "RULE_PREDICATE_MATCHED",
      actualOutcome: "RULE_PREDICATE_MATCHED",
      result: "PASS",
      triggeredRuleId: "API-AUTHORIZATION-PROBE-01",
      incidentReference: null,
      incidentResult: "NOT_CREATED_SIMULATION_SAFETY",
      responseResult: "NOT_EXECUTED_SIMULATION_SAFETY",
    });
    expect(database.detectionRule.findFirst).toHaveBeenCalledWith({
      where: { rule_id: "API-AUTHORIZATION-PROBE-01", status: "ACTIVE" },
      select: { rule_id: true, evaluation_dsl: true },
    });
    expect(auditWriter).toHaveBeenCalledTimes(2);
    expect(auditWriter).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        actorUserId: "soc-operator",
        targetType: "SOC_SIMULATION",
        lifecycle: "SIMULATION",
        environment: "TEST",
      }),
    );
    expect(auditWriter).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        action: "SOC_SIMULATION_COMPLETED",
        metadata: expect.objectContaining({
          simulation_only: true,
          event_reference: "SIM-EVT-reference-1",
          result: "PASS",
          triggered_rule_id: "API-AUTHORIZATION-PROBE-01",
        }),
      }),
    );
  });

  it("derives FAIL from the actual rule outcome instead of fabricating PASS", async () => {
    const database = createSimulationDatabase();
    database.detectionRule.findFirst.mockResolvedValue({
      ...activeRule,
      evaluation_dsl: {
        AND: [{ field: "event_code", operator: "EQUALS", value: "OTHER_EVENT" }],
      },
    });
    database.auditLog.findFirst.mockResolvedValue({ id: "audit-verified" });

    const result = await executeSimulation(
      "soc-operator",
      { scenario: "API_AUTHORIZATION_PROBE" },
      {
        database: database as never,
        auditWriter: jest.fn().mockResolvedValue(undefined),
        createReference: () => "reference-2",
      },
    );

    expect(result.result).toBe("FAIL");
    expect(result.actualOutcome).toBe("RULE_PREDICATE_DID_NOT_MATCH");
    expect(result.triggeredRuleId).toBeNull();
  });

  it("rejects execution when the authoritative active rule is unavailable", async () => {
    const database = createSimulationDatabase();
    database.detectionRule.findFirst.mockResolvedValue(null);
    const auditWriter = jest.fn();

    await expect(
      executeSimulation(
        "soc-operator",
        { scenario: "API_AUTHORIZATION_PROBE" },
        { database: database as never, auditWriter },
      ),
    ).rejects.toMatchObject({ code: "SCENARIO_UNAVAILABLE" });
    expect(auditWriter).not.toHaveBeenCalled();
  });

  it("fails closed before evaluation when the launch audit cannot be verified", async () => {
    const database = createSimulationDatabase();
    database.detectionRule.findFirst.mockResolvedValue(activeRule);
    database.auditLog.findFirst.mockResolvedValue(null);
    const auditWriter = jest.fn().mockResolvedValue(undefined);

    await expect(
      executeSimulation(
        "soc-operator",
        { scenario: "API_AUTHORIZATION_PROBE" },
        { database: database as never, auditWriter },
      ),
    ).rejects.toMatchObject({ code: "AUDIT_REQUIRED" });
    expect(auditWriter).toHaveBeenCalledTimes(1);
  });

  it("reports catalog support from the authoritative active rule", async () => {
    const database = createSimulationDatabase();
    database.detectionRule.findFirst.mockResolvedValue({ id: "rule-db-id" });

    const catalog = await loadSimulationCatalog(database as never);

    expect(catalog).toHaveLength(1);
    expect(catalog[0]).toMatchObject({
      scenario: "API_AUTHORIZATION_PROBE",
      supported: true,
      existingSocPath: "ApiSecurityLogAdapter → DetectionRule DSL evaluator",
    });
  });

  it("loads only valid, marked simulation audit history", async () => {
    const database = createSimulationDatabase();
    database.auditLog.findMany.mockResolvedValue([
      {
        actor: { full_name: "SOC Operator" },
        details: JSON.stringify({
          simulation_only: true,
          simulation_reference: "SIM-history-1",
          scenario: "API_AUTHORIZATION_PROBE",
          event_reference: "SIM-EVT-history-1",
          expected_outcome: "RULE_PREDICATE_MATCHED",
          actual_outcome: "RULE_PREDICATE_MATCHED",
          result: "PASS",
          started_at: "2026-08-09T10:00:00.000Z",
          completed_at: "2026-08-09T10:00:01.000Z",
          triggered_rule_id: "API-AUTHORIZATION-PROBE-01",
          incident_result: "NOT_CREATED_SIMULATION_SAFETY",
          response_result: "NOT_EXECUTED_SIMULATION_SAFETY",
          environment: "TEST",
          lifecycle: "SIMULATION",
        }),
      },
      { actor: null, details: JSON.stringify({ simulation_only: false }) },
      { actor: null, details: "not-json" },
    ]);

    const history = await loadSimulationHistory(database as never);

    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      simulationReference: "SIM-history-1",
      eventReference: "SIM-EVT-history-1",
      initiator: "SOC Operator",
      simulationOnly: true,
      lifecycle: "SIMULATION",
      incidentReference: null,
    });
  });

  it("exposes no financial, deletion, control, RBAC, approval, or command capability", () => {
    expect(SIMULATION_SAFETY_CAPABILITIES).toEqual({
      changesRealFinancialState: false,
      deletesProductionData: false,
      disablesRealSecurityControls: false,
      overridesRbac: false,
      bypassesApprovals: false,
      arbitraryCommandExecution: false,
      arbitraryEventPayload: false,
    });
  });
});
