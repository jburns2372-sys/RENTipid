jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/lib/security/authorization", () => ({ requireSecurityPermission: jest.fn() }));
jest.mock("@/lib/security/simulations/simulation.service", () => {
  const actual = jest.requireActual("@/lib/security/simulations/simulation.service");
  return { ...actual, executeSimulation: jest.fn() };
});

import { revalidatePath } from "next/cache";
import {
  parseSimulationFormData,
  runSimulationAction,
} from "@/app/dashboard/admin/security/simulations/actions";
import { requireSecurityPermission } from "@/lib/security/authorization";
import { SECURITY_PERMISSIONS } from "@/lib/security/permissions";
import { executeSimulation } from "@/lib/security/simulations/simulation.service";

describe("SOC v1.1 simulation Server Action", () => {
  beforeEach(() => jest.clearAllMocks());

  it("authorizes server-side before executing a supported simulation", async () => {
    (requireSecurityPermission as jest.Mock).mockResolvedValue({ userId: "soc-operator" });
    (executeSimulation as jest.Mock).mockResolvedValue({ result: "PASS" });
    const formData = new FormData();
    formData.set("scenario", "API_AUTHORIZATION_PROBE");

    const result = await runSimulationAction({ status: "IDLE" }, formData);

    expect(requireSecurityPermission).toHaveBeenCalledWith(
      SECURITY_PERMISSIONS.SIMULATIONS_RUN,
    );
    expect(executeSimulation).toHaveBeenCalledWith("soc-operator", {
      scenario: "API_AUTHORIZATION_PROBE",
    });
    expect(revalidatePath).toHaveBeenCalledWith(
      "/dashboard/admin/security/simulations",
    );
    expect(result.status).toBe("COMPLETED");
  });

  it("fails closed when authorization is rejected", async () => {
    (requireSecurityPermission as jest.Mock).mockRejectedValue(new Error("Unauthorized"));
    const formData = new FormData();
    formData.set("scenario", "API_AUTHORIZATION_PROBE");

    await expect(runSimulationAction({ status: "IDLE" }, formData)).rejects.toThrow(
      "Unauthorized",
    );
    expect(executeSimulation).not.toHaveBeenCalled();
  });

  it("rejects unsupported scenarios and arbitrary event/action injection", async () => {
    (requireSecurityPermission as jest.Mock).mockResolvedValue({ userId: "soc-operator" });
    const unsupported = new FormData();
    unsupported.set("scenario", "ARBITRARY_COMMAND");
    const injected = new FormData();
    injected.set("scenario", "API_AUTHORIZATION_PROBE");
    injected.set("event", JSON.stringify({ action: "DELETE", target: "production" }));

    await expect(runSimulationAction({ status: "IDLE" }, unsupported)).resolves.toEqual({
      status: "FAILED",
      message: "The simulation request was rejected.",
    });
    expect(() => parseSimulationFormData(injected)).toThrow("INVALID_REQUEST");
    expect(executeSimulation).not.toHaveBeenCalled();
  });

  it("rejects duplicate scenario inputs", () => {
    const formData = new FormData();
    formData.append("scenario", "API_AUTHORIZATION_PROBE");
    formData.append("scenario", "API_AUTHORIZATION_PROBE");
    expect(() => parseSimulationFormData(formData)).toThrow("INVALID_REQUEST");
  });
});
