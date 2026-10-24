"use server";

import { revalidatePath } from "next/cache";

import { requireSecurityPermission } from "@/lib/security/authorization";
import { SECURITY_PERMISSIONS } from "@/lib/security/permissions";
import {
  executeSimulation,
  SimulationRequestError,
  validateSimulationRequest,
  type SimulationResult,
} from "@/lib/security/simulations/simulation.service";

export type SimulationActionState =
  | { status: "IDLE" }
  | { status: "COMPLETED"; result: SimulationResult }
  | { status: "FAILED"; message: string };

export const INITIAL_SIMULATION_ACTION_STATE: SimulationActionState = {
  status: "IDLE",
};

export async function parseSimulationFormData(formData: FormData) {
  const suppliedKeys = Array.from(formData.keys()).filter(
    (key) => !key.startsWith("$ACTION_"),
  );
  if (
    suppliedKeys.length !== 1 ||
    suppliedKeys[0] !== "scenario" ||
    formData.getAll("scenario").length !== 1
  ) {
    throw new SimulationRequestError("INVALID_REQUEST");
  }

  return validateSimulationRequest({ scenario: formData.get("scenario") });
}

export async function runSimulationAction(
  _previousState: SimulationActionState,
  formData: FormData,
): Promise<SimulationActionState> {
  const authorization = await requireSecurityPermission(
    SECURITY_PERMISSIONS.SIMULATIONS_RUN,
  );

  let request: ReturnType<typeof parseSimulationFormData>;
  try {
    request = parseSimulationFormData(formData);
  } catch {
    return {
      status: "FAILED",
      message: "The simulation request was rejected.",
    };
  }

  try {
    const result = await executeSimulation(authorization.userId, request);
    revalidatePath("/dashboard/admin/security/simulations");
    return { status: "COMPLETED", result };
  } catch (error) {
    const message =
      error instanceof SimulationRequestError &&
      error.code === "SCENARIO_UNAVAILABLE"
        ? "The scenario is unavailable because its authoritative rule is not active."
        : "The simulation could not be completed safely.";
    return { status: "FAILED", message };
  }
}
