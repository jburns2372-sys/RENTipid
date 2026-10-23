import {
  Beaker,
  CheckCircle2,
  FlaskConical,
  GitBranch,
  ShieldAlert,
} from "lucide-react";

import { requireSecurityPermission } from "@/lib/security/authorization";
import { SECURITY_PERMISSIONS } from "@/lib/security/permissions";
import {
  loadSimulationCatalog,
  loadSimulationHistory,
} from "@/lib/security/simulations/simulation.service";
import { SimulationRunner } from "./simulation-runner";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

function formatDate(value: Date): string {
  return `${dateFormatter.format(value)} UTC`;
}

export default async function SecuritySimulationsPage() {
  await requireSecurityPermission(SECURITY_PERMISSIONS.SIMULATIONS_RUN);
  const [catalog, history] = await Promise.all([
    loadSimulationCatalog(),
    loadSimulationHistory(),
  ]);
  const scenario = catalog[0];

  return (
    <main className="space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="rounded-2xl border border-violet-800 bg-gradient-to-br from-slate-950 via-slate-950 to-violet-950/40 p-6 shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <FlaskConical className="h-9 w-9 text-violet-400" aria-hidden="true" />
            <div>
              <h1 className="text-3xl font-bold text-white">SOC Simulations</h1>
              <p className="mt-1 text-slate-400">
                Controlled dry-runs of existing SOC normalization and detection logic.
              </p>
            </div>
          </div>
          <span className="rounded-full border border-violet-700 bg-violet-950/70 px-4 py-2 text-xs font-bold tracking-widest text-violet-200">
            SIMULATION ENVIRONMENT
          </span>
        </div>
      </header>

      <section className="rounded-2xl border border-amber-800 bg-amber-950/20 p-5">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-6 w-6 text-amber-400" aria-hidden="true" />
          <div>
            <h2 className="font-semibold text-amber-100">Simulation-only safety boundary</h2>
            <p className="mt-1 text-sm text-amber-200/80">
              Runs use lifecycle SIMULATION and environment TEST. They do not persist
              synthetic SecurityEvents or incidents, execute responses, change financial
              state, alter approvals, or disable controls. Audit history remains clearly marked.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="catalog-heading" className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <Beaker className="h-6 w-6 text-cyan-400" aria-hidden="true" />
          <div>
            <h2 id="catalog-heading" className="text-xl font-semibold text-white">Simulation Catalog</h2>
            <p className="mt-1 text-sm text-slate-400">Only scenarios backed by an existing authoritative SOC rule are offered.</p>
          </div>
        </div>
        <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-semibold text-white">{scenario.title}</h3>
              <p className="mt-2 max-w-3xl text-sm text-slate-400">{scenario.description}</p>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${scenario.supported ? "border-emerald-700 bg-emerald-950/60 text-emerald-300" : "border-slate-700 bg-slate-950 text-slate-400"}`}>
              {scenario.supported ? "SUPPORTED" : "UNAVAILABLE"}
            </span>
          </div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-500">Existing SOC path</dt><dd className="mt-1 text-slate-200">{scenario.existingSocPath}</dd></div>
            <div><dt className="text-slate-500">Expected outcome</dt><dd className="mt-1 text-slate-200">{scenario.expectedOutcome}</dd></div>
          </dl>
          <p className="mt-4 text-xs text-slate-500">{scenario.supportReason}</p>
        </div>
      </section>

      <SimulationRunner scenario={scenario} />

      <section aria-labelledby="history-heading" className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 shadow-xl">
        <div className="flex items-center gap-3 border-b border-slate-800 p-5">
          <GitBranch className="h-6 w-6 text-cyan-400" aria-hidden="true" />
          <div>
            <h2 id="history-heading" className="text-xl font-semibold text-white">Simulation History</h2>
            <p className="mt-1 text-sm text-slate-400">Latest 25 verified, simulation-marked audit outcomes.</p>
          </div>
        </div>
        {history.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">No simulation executions are recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-900 text-slate-400"><tr>{["Result", "Scenario", "Reference", "Initiator", "Expected", "Actual", "Rule", "Completed"].map((heading) => <th key={heading} className="px-4 py-3 font-medium">{heading}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {history.map((item) => (
                  <tr key={item.simulationReference}>
                    <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 font-semibold ${item.result === "PASS" ? "text-emerald-300" : "text-red-300"}`}><CheckCircle2 className="h-4 w-4" aria-hidden="true" />{item.result}</span></td>
                    <td className="px-4 py-3">API authorization probe</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-violet-300">{item.simulationReference}</td>
                    <td className="px-4 py-3">{item.initiator}</td>
                    <td className="px-4 py-3">{item.expectedOutcome}</td>
                    <td className="px-4 py-3">{item.actualOutcome}</td>
                    <td className="px-4 py-3">{item.triggeredRuleId ?? "No match"}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatDate(item.completedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
