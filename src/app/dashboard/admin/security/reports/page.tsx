import Link from "next/link";
import { Download, FileBarChart, ShieldAlert } from "lucide-react";
import { requireSecurityPermission } from "@/lib/security/authorization";
import { SECURITY_PERMISSIONS } from "@/lib/security/permissions";
import {
  loadSocReports,
  parseSocReportFilters,
  ReportFilterValidationError,
  REPORT_ENVIRONMENTS,
  REPORT_EVENT_SOURCES,
  REPORT_EVENT_STATUSES,
  REPORT_SEVERITIES,
  reportFiltersToSearchParams,
  type SocReportsData,
  type SocReportType,
} from "@/lib/security/reports/reporting.service";

interface ReportsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

function formatDate(value: Date | null): string {
  return value ? `${dateFormatter.format(value)} UTC` : "—";
}

function label(value: string): string {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase());
}

function EmptyRow({ columns, message }: { columns: number; message: string }) {
  return <tr><td colSpan={columns} className="px-4 py-8 text-center text-sm text-slate-500">{message}</td></tr>;
}

function ExportLink({ type, data, children }: { type: SocReportType; data: SocReportsData; children: React.ReactNode }) {
  const params = reportFiltersToSearchParams(data.filters);
  params.set("report", type);
  return (
    <Link
      href={`/api/soc/reports/export?${params.toString()}`}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-500 hover:text-cyan-300"
    >
      <Download className="h-4 w-4" />
      {children}
    </Link>
  );
}

function ReportSection({
  title,
  description,
  exportType,
  data,
  children,
}: {
  title: string;
  description: string;
  exportType: SocReportType;
  data: SocReportsData;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 shadow-xl">
      <div className="flex flex-col gap-4 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        </div>
        <ExportLink type={exportType} data={data}>Export CSV</ExportLink>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

function ReportsFilterForm({ data }: { data: SocReportsData | null }) {
  const filters = data?.filters ?? {};
  return (
    <form method="get" className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-5 md:grid-cols-4">
      <label className="text-sm text-slate-300">
        From
        <input name="from" type="date" defaultValue={filters.from ?? ""} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" />
      </label>
      <label className="text-sm text-slate-300">
        To
        <input name="to" type="date" defaultValue={filters.to ?? ""} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" />
      </label>
      <label className="text-sm text-slate-300">
        Severity
        <select name="severity" defaultValue={filters.severity ?? ""} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white">
          <option value="">All severities</option>
          {REPORT_SEVERITIES.map((value) => <option key={value} value={value}>{label(value)}</option>)}
        </select>
      </label>
      <label className="text-sm text-slate-300">
        Event status
        <select name="status" defaultValue={filters.status ?? ""} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white">
          <option value="">All event statuses</option>
          {REPORT_EVENT_STATUSES.map((value) => <option key={value} value={value}>{label(value)}</option>)}
        </select>
      </label>
      <label className="text-sm text-slate-300">
        Event source
        <select name="source" defaultValue={filters.source ?? ""} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white">
          <option value="">All sources</option>
          {REPORT_EVENT_SOURCES.map((value) => <option key={value} value={value}>{label(value)}</option>)}
        </select>
      </label>
      <label className="text-sm text-slate-300">
        Environment
        <select name="environment" defaultValue={filters.environment ?? ""} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white">
          <option value="">All environments</option>
          {REPORT_ENVIRONMENTS.map((value) => <option key={value} value={value}>{label(value)}</option>)}
        </select>
      </label>
      <label className="text-sm text-slate-300 md:col-span-2">
        Exact event type
        <input
          name="eventType"
          type="text"
          maxLength={80}
          pattern="[A-Za-z0-9_.:-]+"
          defaultValue={filters.eventType ?? ""}
          placeholder="Example: AUTHENTICATION_FAILED"
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
        />
      </label>
      <div className="flex items-end gap-3 md:col-span-4">
        <button type="submit" className="rounded-lg bg-cyan-600 px-4 py-2 font-semibold text-white transition hover:bg-cyan-500">Apply filters</button>
        <Link href="/dashboard/admin/security/reports" className="rounded-lg border border-slate-700 px-4 py-2 font-semibold text-slate-300 hover:text-white">Clear</Link>
        <span className="text-xs text-slate-500">Dates use UTC. Detail tables are capped at 100 authoritative records.</span>
      </div>
    </form>
  );
}

export default async function SecurityReportsPage({ searchParams }: ReportsPageProps) {
  await requireSecurityPermission(SECURITY_PERMISSIONS.REPORTS_EXPORT);

  const rawFilters = await searchParams;
  let data: SocReportsData | null = null;
  let validationIssues: string[] = [];

  try {
    const filters = parseSocReportFilters(rawFilters);
    data = await loadSocReports(filters);
  } catch (error) {
    if (error instanceof ReportFilterValidationError) {
      validationIssues = error.issues;
    } else {
      throw error;
    }
  }

  return (
    <div className="space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950 to-slate-900 p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <FileBarChart className="h-9 w-9 text-cyan-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">Security Reports</h1>
            <p className="mt-1 text-slate-400">Bounded, database-backed SOC reporting. No synthetic records are included.</p>
          </div>
        </div>
      </header>

      <ReportsFilterForm data={data} />

      {validationIssues.length > 0 && (
        <div role="alert" className="rounded-xl border border-red-800 bg-red-950/40 p-4 text-sm text-red-200">
          <p className="font-semibold">The report filters were rejected.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">{validationIssues.map((issue) => <li key={issue}>{issue}</li>)}</ul>
        </div>
      )}

      {data && (
        <>
          <section aria-labelledby="executive-summary-heading">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="executive-summary-heading" className="text-xl font-semibold text-white">Executive Security Summary</h2>
              <p className="text-xs text-slate-500">Generated {formatDate(data.generatedAt)}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
              {[
                ["Security events", data.summary.totalEvents],
                ["Open incidents", data.summary.openIncidents],
                ["Critical / high", data.summary.criticalHighIncidents],
                ["Resolved incidents", data.summary.resolvedIncidents],
                ["Pending approvals", data.summary.pendingApprovals],
                ["Response activity", data.summary.responseActivity],
                ["Active rules", data.summary.activeDetectionRules],
              ].map(([title, value]) => (
                <div key={title} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
                  <p className="mt-2 text-3xl font-bold text-white">{value}</p>
                </div>
              ))}
            </div>
          </section>

          <ReportSection title="Security Event Report" description="Normalized security events only; source summaries and identifiers are excluded." exportType="events" data={data}>
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-900 text-slate-400"><tr>{["Date / time", "Severity", "Status", "Event type", "Source", "Environment", "Result"].map((heading) => <th key={heading} className="px-4 py-3 font-medium">{heading}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {data.events.map((event) => <tr key={event.id}><td className="whitespace-nowrap px-4 py-3">{formatDate(event.occurred_at)}</td><td className="px-4 py-3">{label(event.severity)}</td><td className="px-4 py-3">{label(event.processing_status)}</td><td className="px-4 py-3">{event.event_code}</td><td className="px-4 py-3">{label(event.source_type)}</td><td className="px-4 py-3">{label(event.environment)}</td><td className="px-4 py-3">{event.action_result ?? "—"}</td></tr>)}
                {data.events.length === 0 && <EmptyRow columns={7} message="No security events match the selected filters." />}
              </tbody>
            </table>
          </ReportSection>

          <ReportSection title="Incident Case Report" description="Incident lifecycle, ownership, response state, and age from authoritative case records." exportType="incidents" data={data}>
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-900 text-slate-400"><tr>{["Case", "Severity", "Status", "Origin", "Owner", "Response state", "Age", "Opened"].map((heading) => <th key={heading} className="px-4 py-3 font-medium">{heading}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {data.incidents.map((incident) => <tr key={incident.id}><td className="px-4 py-3 font-medium text-cyan-300">{incident.case_reference}</td><td className="px-4 py-3">{label(incident.severity)}</td><td className="px-4 py-3">{label(incident.status)}</td><td className="px-4 py-3">{label(incident.origin)}</td><td className="px-4 py-3">{incident.assigned_user?.full_name ?? "Unassigned"}</td><td className="px-4 py-3">{incident.latestResponseStatus ? label(incident.latestResponseStatus) : "No response"}</td><td className="px-4 py-3">{incident.ageHours}h</td><td className="whitespace-nowrap px-4 py-3">{formatDate(incident.opened_at)}</td></tr>)}
                {data.incidents.length === 0 && <EmptyRow columns={8} message="No incident cases match the selected filters." />}
              </tbody>
            </table>
          </ReportSection>

          <ReportSection title="Response / Playbook Report" description="Executed response activity and its approval state; targets and failure payloads are excluded." exportType="responses" data={data}>
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-900 text-slate-400"><tr>{["Case", "Playbook", "Response type", "Status", "Approval", "Started", "Completed"].map((heading) => <th key={heading} className="px-4 py-3 font-medium">{heading}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {data.responses.map((response) => <tr key={response.id}><td className="px-4 py-3">{response.incident_case.case_reference}</td><td className="px-4 py-3">{response.playbook.name} v{response.playbook.version}</td><td className="px-4 py-3">{label(response.response_type)}</td><td className="px-4 py-3">{label(response.status)}</td><td className="px-4 py-3">{label(response.approval_grant.request.status)}</td><td className="whitespace-nowrap px-4 py-3">{formatDate(response.started_at)}</td><td className="whitespace-nowrap px-4 py-3">{formatDate(response.completed_at ?? response.failed_at)}</td></tr>)}
                {data.responses.length === 0 && <EmptyRow columns={7} message="No response executions match the selected filters." />}
              </tbody>
            </table>
          </ReportSection>

          <ReportSection title="Approval Report" description="Approval outcomes and timestamps without justification or response targets." exportType="approvals" data={data}>
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-900 text-slate-400"><tr>{["Case", "Status", "Action", "Approver", "Requested", "Decision", "Expires"].map((heading) => <th key={heading} className="px-4 py-3 font-medium">{heading}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {data.approvals.map((approval) => <tr key={approval.id}><td className="px-4 py-3">{approval.incident_case.case_reference}</td><td className="px-4 py-3">{label(approval.status)}</td><td className="px-4 py-3">{approval.response_type ? label(approval.response_type) : "—"}</td><td className="px-4 py-3">{approval.approver?.full_name ?? "Pending"}</td><td className="whitespace-nowrap px-4 py-3">{formatDate(approval.requested_at)}</td><td className="whitespace-nowrap px-4 py-3">{formatDate(approval.decision_at)}</td><td className="whitespace-nowrap px-4 py-3">{formatDate(approval.expires_at)}</td></tr>)}
                {data.approvals.length === 0 && <EmptyRow columns={7} message="No approval records match the selected filters." />}
              </tbody>
            </table>
          </ReportSection>

          <ReportSection title="Detection Rule Report" description="Rule state and authoritative threshold/window trigger configuration." exportType="rules" data={data}>
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-900 text-slate-400"><tr>{["Rule", "Status", "Category", "Severity", "Threshold", "Window", "Cooldown"].map((heading) => <th key={heading} className="px-4 py-3 font-medium">{heading}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {data.detectionRules.map((rule) => <tr key={rule.id}><td className="px-4 py-3">{rule.name} <span className="text-slate-500">v{rule.version}</span></td><td className="px-4 py-3">{label(rule.status)}</td><td className="px-4 py-3">{label(rule.security_domain)}</td><td className="px-4 py-3">{label(rule.base_severity)}</td><td className="px-4 py-3">{rule.threshold_count}</td><td className="px-4 py-3">{rule.window_seconds}s</td><td className="px-4 py-3">{rule.cooldown_seconds}s</td></tr>)}
                {data.detectionRules.length === 0 && <EmptyRow columns={7} message="No detection rules match the selected filters." />}
              </tbody>
            </table>
          </ReportSection>

          <ReportSection title="Behavioral Risk Report" description="Counts of persisted assessments by authoritative risk band, environment, and lifecycle. Subject references are excluded." exportType="behavioral-risk" data={data}>
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-900 text-slate-400"><tr>{["Risk band", "Environment", "Lifecycle", "Assessments"].map((heading) => <th key={heading} className="px-4 py-3 font-medium">{heading}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {data.behavioralRisk.map((item) => <tr key={`${item.risk_band}-${item.environment}-${item.lifecycle}`}><td className="px-4 py-3">{label(item.risk_band)}</td><td className="px-4 py-3">{label(item.environment)}</td><td className="px-4 py-3">{label(item.lifecycle)}</td><td className="px-4 py-3">{item._count._all}</td></tr>)}
                {data.behavioralRisk.length === 0 && <EmptyRow columns={4} message="No behavioral-risk assessments match the selected filters." />}
              </tbody>
            </table>
          </ReportSection>

          <section className="overflow-hidden rounded-2xl border border-violet-900 bg-slate-950/60">
            <div className="flex items-start gap-3">
              <div className="flex items-start gap-3 p-6">
                <ShieldAlert className="mt-0.5 h-6 w-6 text-violet-400" />
                <div><h2 className="text-xl font-semibold text-white">Simulation Report</h2><p className="mt-1 text-sm text-slate-400">Lifecycle-marked simulation events are separated from operational event totals.</p></div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-900 text-slate-400"><tr>{["Date / time", "Event", "Status", "Source", "Environment", "Lifecycle", "Result"].map((heading) => <th key={heading} className="px-4 py-3 font-medium">{heading}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {data.simulation.records.map((event) => <tr key={event.id}><td className="whitespace-nowrap px-4 py-3">{formatDate(event.occurred_at)}</td><td className="px-4 py-3">{event.event_code}</td><td className="px-4 py-3">{label(event.processing_status)}</td><td className="px-4 py-3">{label(event.source_type)}</td><td className="px-4 py-3">{label(event.environment)}</td><td className="px-4 py-3 font-semibold text-violet-300">{label(event.lifecycle_type)}</td><td className="px-4 py-3">{event.action_result ?? "—"}</td></tr>)}
                  {data.simulation.records.length === 0 && <EmptyRow columns={7} message="No simulation activity matches the selected filters." />}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
