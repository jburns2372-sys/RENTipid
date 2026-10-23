"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CirclePlay, LoaderCircle } from "lucide-react";

import {
  INITIAL_SIMULATION_ACTION_STATE,
  runSimulationAction,
} from "./actions";
import type { SimulationCatalogItem } from "@/lib/security/simulations/simulation.service";

function RunButton({ supported }: { supported: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="scenario"
      value="API_AUTHORIZATION_PROBE"
      disabled={!supported || pending}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
    >
      {pending ? (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <CirclePlay className="h-4 w-4" aria-hidden="true" />
      )}
      {pending ? "Running simulation…" : "Run simulation"}
    </button>
  );
}

export function SimulationRunner({ scenario }: { scenario: SimulationCatalogItem }) {
  const [state, formAction] = useActionState(
    runSimulationAction,
    INITIAL_SIMULATION_ACTION_STATE,
  );

  return (
    <section
      aria-labelledby="run-simulation-heading"
      className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 shadow-xl"
    >
      <h2 id="run-simulation-heading" className="text-xl font-semibold text-white">
        Run Simulation
      </h2>
      <p className="mt-1 text-sm text-slate-400">
        The request accepts only the catalogued scenario identifier. Arbitrary event
        fields, targets, actions, and JSON payloads are rejected.
      </p>

      <form action={formAction} className="mt-5">
        <RunButton supported={scenario.supported} />
      </form>

      {!scenario.supported && (
        <p role="status" className="mt-4 rounded-lg border border-amber-800 bg-amber-950/30 p-3 text-sm text-amber-200">
          This scenario cannot run until its authoritative detection rule is active.
        </p>
      )}

      {state.status === "FAILED" && (
        <div role="alert" className="mt-4 rounded-lg border border-red-800 bg-red-950/30 p-4 text-sm text-red-200">
          {state.message}
        </div>
      )}

      {state.status === "COMPLETED" && (
        <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold text-white">Latest result</h3>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${state.result.result === "PASS" ? "border-emerald-700 bg-emerald-950/60 text-emerald-300" : "border-red-700 bg-red-950/60 text-red-300"}`}>
              {state.result.result}
            </span>
          </div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-500">Simulation reference</dt><dd className="mt-1 text-slate-200">{state.result.simulationReference}</dd></div>
            <div><dt className="text-slate-500">Isolated event reference</dt><dd className="mt-1 text-slate-200">{state.result.eventReference}</dd></div>
            <div><dt className="text-slate-500">Expected</dt><dd className="mt-1 text-slate-200">{state.result.expectedOutcome}</dd></div>
            <div><dt className="text-slate-500">Actual</dt><dd className="mt-1 text-slate-200">{state.result.actualOutcome}</dd></div>
            <div><dt className="text-slate-500">Detection rule</dt><dd className="mt-1 text-slate-200">{state.result.triggeredRuleId ?? "No rule matched"}</dd></div>
            <div><dt className="text-slate-500">Response</dt><dd className="mt-1 text-slate-200">Not executed — simulation safety boundary</dd></div>
          </dl>
        </div>
      )}
    </section>
  );
}
