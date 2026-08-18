import {
  Activity,
  ClipboardCheck,
  Database,
  FileClock,
  RefreshCw,
  ShieldCheck,
  Siren,
  Wrench,
} from "lucide-react";

import { requireSecurityPermission } from "@/lib/security/authorization";
import {
  loadMaintenanceHealth,
  MAINTENANCE_CAPABILITIES,
  type MaintenanceHealthStatus,
} from "@/lib/security/maintenance/maintenance-health.service";
import { SECURITY_PERMISSIONS } from "@/lib/security/permissions";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

const statusStyles: Record<MaintenanceHealthStatus, string> = {
  HEALTHY: "border-emerald-700 bg-emerald-950/60 text-emerald-300",
  DEGRADED: "border-amber-700 bg-amber-950/60 text-amber-300",
  FAILED: "border-red-700 bg-red-950/60 text-red-300",
  UNKNOWN: "border-slate-700 bg-slate-900 text-slate-300",
};

function formatDate(value: Date | null): string {
  return value ? `${dateFormatter.format(value)} UTC` : "Not available";
}

function formatCount(value: number | null): string {
  return value === null ? "Not available" : value.toLocaleString("en-US");
}

function StatusBadge({ status }: { status: MaintenanceHealthStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-2 text-lg font-semibold text-white">{value}</dd>
    </div>
  );
}

function HealthSection({
  id,
  title,
  description,
  status,
  icon,
  children,
}: {
  id: string;
  title: string;
  description: string;
  status: MaintenanceHealthStatus;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 shadow-xl"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="mt-0.5 text-cyan-400">{icon}</div>
          <div>
            <h2 id={id} className="text-xl font-semibold text-white">
              {title}
            </h2>
            <p className="mt-1 text-sm text-slate-400">{description}</p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>
      <dl className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{children}</dl>
    </section>
  );
}

export default async function SecurityMaintenancePage() {
  await requireSecurityPermission(SECURITY_PERMISSIONS.DASHBOARD_VIEW);
  const health = await loadMaintenanceHealth();

  return (
    <main className="space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950 to-slate-900 p-6 shadow-xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Wrench className="h-9 w-9 text-cyan-400" aria-hidden="true" />
            <div>
              <h1 className="text-3xl font-bold text-white">SOC Maintenance</h1>
              <p className="mt-1 text-slate-400">
                Read-only operational health from authoritative SOC records.
              </p>
            </div>
          </div>
          <form action="/dashboard/admin/security/maintenance" method="get">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-500 hover:text-cyan-300"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Refresh health
            </button>
          </form>
        </div>
      </header>

      <section
        aria-labelledby="overall-health-heading"
        className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 shadow-xl"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="overall-health-heading" className="text-xl font-semibold text-white">
              Overall SOC Health
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Last checked {formatDate(health.checkedAt)}. Unknown means the
              underlying records do not support a reliable status.
            </p>
          </div>
          <StatusBadge status={health.overallStatus} />
        </div>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric label="Database connectivity" value={health.database.status} />
          <Metric label="Event ingestion" value={health.ingestion.status} />
          <Metric label="Incident processing" value={health.incidents.status} />
          <Metric label="Detection rules" value={health.detectionRules.status} />
          <Metric label="Audit subsystem" value={health.audit.status} />
        </dl>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <HealthSection
          id="event-ingestion-heading"
          title="Event Ingestion"
          description="SecurityEvent intake, checkpoints, unresolved failures, and processing backlog."
          status={health.ingestion.status}
          icon={<Activity className="h-6 w-6" aria-hidden="true" />}
        >
          <Metric label="Latest event received" value={formatDate(health.ingestion.latestEventAt)} />
          <Metric label="Latest successful run" value={formatDate(health.ingestion.latestSuccessfulRunAt)} />
          <Metric label="Latest completed run" value={formatDate(health.ingestion.latestRunCompletedAt)} />
          <Metric label="Unresolved failures" value={formatCount(health.ingestion.unresolvedFailures)} />
          <Metric label="Processing backlog" value={formatCount(health.ingestion.backlogCount)} />
          <Metric label="Latest failure" value={formatDate(health.ingestion.latestFailureAt)} />
          <Metric label="Retryable failures" value="Not tracked by current model" />
        </HealthSection>

        <HealthSection
          id="incident-processing-heading"
          title="Incident Processing"
          description="Existing incident lifecycle activity; no lifecycle controls are exposed here."
          status={health.incidents.status}
          icon={<Siren className="h-6 w-6" aria-hidden="true" />}
        >
          <Metric label="Open cases" value={formatCount(health.incidents.openCount)} />
          <Metric label="Containment pending" value={formatCount(health.incidents.containmentPendingCount)} />
          <Metric label="Latest processing activity" value={formatDate(health.incidents.latestActivityAt)} />
          <Metric label="Latest resolved / closed" value={formatDate(health.incidents.latestSuccessfulProcessingAt)} />
          <Metric label="Failed processing" value="Not tracked by current model" />
          <Metric label="Queued processing" value="Not tracked by current model" />
        </HealthSection>

        <HealthSection
          id="detection-health-heading"
          title="Detection Rule Health"
          description="Operational rule and evaluation signals; rule authoring remains on Detection Rules."
          status={health.detectionRules.status}
          icon={<ShieldCheck className="h-6 w-6" aria-hidden="true" />}
        >
          <Metric label="Active rules" value={formatCount(health.detectionRules.activeCount)} />
          <Metric label="Inactive rules" value={formatCount(health.detectionRules.inactiveCount)} />
          <Metric label="Quarantined rules" value={formatCount(health.detectionRules.quarantinedCount)} />
          <Metric label="Configuration errors" value="Not tracked by current model" />
          <Metric label="Evaluation errors (24h)" value={formatCount(health.detectionRules.recentEvaluationErrorCount)} />
          <Metric label="Latest evaluation" value={formatDate(health.detectionRules.latestEvaluationAt)} />
          <Metric label="Latest successful run" value={formatDate(health.detectionRules.latestSuccessfulRunAt)} />
        </HealthSection>

        <HealthSection
          id="audit-health-heading"
          title="Audit Health"
          description="Audit availability and write timestamps only; payloads and actor details are excluded."
          status={health.audit.status}
          icon={<ClipboardCheck className="h-6 w-6" aria-hidden="true" />}
        >
          <Metric label="Latest audit event" value={formatDate(health.audit.latestAuditAt)} />
          <Metric label="Audit writes (24h)" value={formatCount(health.audit.recentWriteCount)} />
          <Metric label="Audit payload exposure" value="Disabled" />
        </HealthSection>
      </div>

      <section
        aria-labelledby="safe-actions-heading"
        className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <Database className="mt-0.5 h-6 w-6 text-cyan-400" aria-hidden="true" />
          <div>
            <h2 id="safe-actions-heading" className="text-xl font-semibold text-white">
              Safe Maintenance Actions
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Refreshing this view repeats permission-checked, bounded health reads.
              No approved production-safe state-changing recovery operation is exposed.
            </p>
          </div>
        </div>
        {MAINTENANCE_CAPABILITIES.stateChangingActions.length === 0 && (
          <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
            State-changing maintenance actions are unavailable. SQL, shell, script,
            deletion, RBAC, and approval controls are not part of this interface.
          </div>
        )}
      </section>

      <section
        aria-labelledby="maintenance-activity-heading"
        className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <FileClock className="mt-0.5 h-6 w-6 text-cyan-400" aria-hidden="true" />
          <div>
            <h2 id="maintenance-activity-heading" className="text-xl font-semibold text-white">
              Recent Maintenance Activity
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Privacy-minimized entries from the existing SOC audit log.
            </p>
          </div>
        </div>
        {health.recentMaintenanceActivity.length === 0 ? (
          <p className="mt-5 rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-400">
            No maintenance activity is recorded.
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-slate-800 rounded-xl border border-slate-800">
            {health.recentMaintenanceActivity.map((activity, index) => (
              <li
                key={`${activity.action}-${activity.createdAt.toISOString()}-${index}`}
                className="flex flex-col gap-1 p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-medium text-slate-200">{activity.action}</span>
                <span className="text-slate-500">{formatDate(activity.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
