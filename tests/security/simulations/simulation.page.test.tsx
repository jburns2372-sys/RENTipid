/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";

import SecuritySimulationsPage from "@/app/dashboard/admin/security/simulations/page";
import { requireSecurityPermission } from "@/lib/security/authorization";
import { SECURITY_PERMISSIONS } from "@/lib/security/permissions";
import {
  loadSimulationCatalog,
  loadSimulationHistory,
} from "@/lib/security/simulations/simulation.service";

jest.mock("@/lib/security/authorization", () => ({ requireSecurityPermission: jest.fn() }));
jest.mock("@/lib/security/simulations/simulation.service", () => ({
  loadSimulationCatalog: jest.fn(),
  loadSimulationHistory: jest.fn(),
}));
jest.mock("@/app/dashboard/admin/security/simulations/simulation-runner", () => ({
  SimulationRunner: () => <div>Simulation runner</div>,
}));

const catalog = [{
  scenario: "API_AUTHORIZATION_PROBE",
  title: "API authorization probe",
  description: "Fixed scenario",
  existingSocPath: "ApiSecurityLogAdapter → DetectionRule DSL evaluator",
  expectedOutcome: "RULE_PREDICATE_MATCHED",
  supported: true,
  supportReason: "The authoritative detection rule is active.",
}];

describe("SOC v1.1 Simulations page", () => {
  beforeEach(() => jest.clearAllMocks());

  it("rejects unauthorized page access before reading simulation data", async () => {
    (requireSecurityPermission as jest.Mock).mockRejectedValue(new Error("Unauthorized"));

    await expect(SecuritySimulationsPage()).rejects.toThrow("Unauthorized");
    expect(requireSecurityPermission).toHaveBeenCalledWith(
      SECURITY_PERMISSIONS.SIMULATIONS_RUN,
    );
    expect(loadSimulationCatalog).not.toHaveBeenCalled();
    expect(loadSimulationHistory).not.toHaveBeenCalled();
  });

  it("renders the authorized catalog, safety marker, and genuine empty state", async () => {
    (requireSecurityPermission as jest.Mock).mockResolvedValue({ userId: "soc-operator" });
    (loadSimulationCatalog as jest.Mock).mockResolvedValue(catalog);
    (loadSimulationHistory as jest.Mock).mockResolvedValue([]);

    render(await SecuritySimulationsPage());

    expect(screen.getByRole("heading", { name: "SOC Simulations" })).toBeTruthy();
    expect(screen.getByText("SIMULATION ENVIRONMENT")).toBeTruthy();
    expect(screen.getByText("API authorization probe")).toBeTruthy();
    expect(screen.getByText("No simulation executions are recorded.")).toBeTruthy();
    expect(screen.queryByText(/sample|demo history/i)).toBeNull();
  });

  it("renders verified PASS history with associated references", async () => {
    (requireSecurityPermission as jest.Mock).mockResolvedValue({ userId: "soc-operator" });
    (loadSimulationCatalog as jest.Mock).mockResolvedValue(catalog);
    (loadSimulationHistory as jest.Mock).mockResolvedValue([{
      simulationReference: "SIM-history-1",
      scenario: "API_AUTHORIZATION_PROBE",
      simulationOnly: true,
      lifecycle: "SIMULATION",
      environment: "TEST",
      initiator: "SOC Operator",
      startedAt: new Date("2026-08-09T10:00:00.000Z"),
      completedAt: new Date("2026-08-09T10:00:01.000Z"),
      eventReference: "SIM-EVT-history-1",
      expectedOutcome: "RULE_PREDICATE_MATCHED",
      actualOutcome: "RULE_PREDICATE_MATCHED",
      result: "PASS",
      triggeredRuleId: "API-AUTHORIZATION-PROBE-01",
      incidentReference: null,
      incidentResult: "NOT_CREATED_SIMULATION_SAFETY",
      responseResult: "NOT_EXECUTED_SIMULATION_SAFETY",
    }]);

    render(await SecuritySimulationsPage());

    expect(screen.getByText("SIM-history-1")).toBeTruthy();
    expect(screen.getByText("SOC Operator")).toBeTruthy();
    expect(screen.getByText("API-AUTHORIZATION-PROBE-01")).toBeTruthy();
    expect(screen.getByText("PASS")).toBeTruthy();
  });
});
