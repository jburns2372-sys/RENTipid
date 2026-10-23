jest.mock("@/lib/audit", () => ({ createAuditLog: jest.fn() }));

import { createAuditLog } from "@/lib/audit";
import { logAdministrationEvent } from "@/lib/security/events/writers/administration-writer";

describe("SOC v1.1 simulation audit marker forwarding", () => {
  it("forwards SIMULATION and TEST to the existing audit ingestion path", async () => {
    await logAdministrationEvent({
      action: "SOC_SIMULATION_COMPLETED",
      outcome: "COMPLETED",
      actorUserId: "soc-operator",
      targetType: "SOC_SIMULATION",
      targetId: "SIM-1",
      lifecycle: "SIMULATION",
      environment: "TEST",
      metadata: { simulation_only: true },
    });

    expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: "SOC_SIMULATION_COMPLETED",
      module: "SOC_SIMULATION",
      target_id: "SIM-1",
      eventLifecycle: "SIMULATION",
      eventEnvironment: "TEST",
    }));
  });
});
