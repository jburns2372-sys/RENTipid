"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  AssigneeOption,
  CASE_ORIGINS,
  CASE_SEVERITIES,
  CASE_STATUSES,
  CaseSeverity,
  CREATE_CASE_ORIGINS,
  createIdempotencyKey,
  formatCaseDate,
  formatEnumLabel,
  hasPermission,
  INCIDENT_CASE_PERMISSIONS,
  IncidentCaseListItem,
  linkedEventReference,
  safeCaseErrorMessage,
} from "./incident-case-ui";

type ListResponse = {
  data: IncidentCaseListItem[];
  pagination: {
    limit: number;
    next_cursor: string | null;
  };
};

type Filters = {
  status: string;
  severity: string;
  origin: string;
  assigned_user_id: string;
  security_event_id: string;
};

const EMPTY_FILTERS: Filters = {
  status: "",
  severity: "",
  origin: "",
  assigned_user_id: "",
  security_event_id: "",
};

const fieldClassName =
  "w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none transition focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400/40";

const actionClassName =
  "inline-flex min-h-10 items-center justify-center rounded-lg border border-blue-500 bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50";

function StatusBadge({
  value,
  kind,
}: {
  value: string;
  kind: "status" | "severity";
}) {
  const tone =
    kind === "severity" && (value === "CRITICAL" || value === "HIGH")
      ? "border-red-500/40 bg-red-500/10 text-red-200"
      : kind === "severity" && value === "MEDIUM"
        ? "border-amber-500/40 bg-amber-500/10 text-amber-100"
        : value === "CLOSED" || value === "RESOLVED"
          ? "border-green-500/40 bg-green-500/10 text-green-100"
          : "border-blue-500/40 bg-blue-500/10 text-blue-100";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}
    >
      <span className="sr-only">{kind === "severity" ? "Severity: " : "Status: "}</span>
      {formatEnumLabel(value)}
    </span>
  );
}

export function IncidentCaseListClient({
  activePermissions,
  assigneeOptions,
}: {
  activePermissions: readonly string[];
  assigneeOptions: AssigneeOption[];
}) {
  const [cases, setCases] = useState<IncidentCaseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [cursorStack, setCursorStack] = useState<Array<string | null>>([null]);
  const [draftFilters, setDraftFilters] = useState<Filters>(EMPTY_FILTERS);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [createExpanded, setCreateExpanded] = useState(false);
  const [createPending, setCreatePending] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [severity, setSeverity] = useState<CaseSeverity>("MEDIUM");
  const [origin, setOrigin] = useState<(typeof CREATE_CASE_ORIGINS)[number]>(
    "MANUAL",
  );
  const [securityEventId, setSecurityEventId] = useState("");

  const currentCursor = cursorStack.at(-1) ?? null;
  const canCreate = hasPermission(
    activePermissions,
    INCIDENT_CASE_PERMISSIONS.CREATE,
  );

  const loadCases = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      const query = new URLSearchParams({ limit: "25" });
      if (currentCursor) query.set("cursor", currentCursor);
      Object.entries(filters).forEach(([key, value]) => {
        if (value) query.set(key, value);
      });

      try {
        const response = await fetch(`/api/admin/security/cases?${query}`, {
          signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) {
          setCases([]);
          setNextCursor(null);
          setError(safeCaseErrorMessage(response.status));
          return;
        }
        const payload = (await response.json()) as ListResponse;
        setCases(Array.isArray(payload.data) ? payload.data : []);
        setNextCursor(payload.pagination?.next_cursor ?? null);
      } catch (reason) {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setCases([]);
        setNextCursor(null);
        setError("Case management is temporarily unavailable. Please try again.");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [currentCursor, filters],
  );

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCases(controller.signal);
    return () => controller.abort();
  }, [loadCases, refreshVersion]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCursorStack([null]);
    setFilters({
      ...draftFilters,
      security_event_id: draftFilters.security_event_id.trim(),
    });
  }

  function clearFilters() {
    setDraftFilters(EMPTY_FILTERS);
    setCursorStack([null]);
    setFilters(EMPTY_FILTERS);
  }

  async function createCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    if (origin === "SECURITY_EVENT" && !securityEventId.trim()) {
      setFeedback({
        type: "error",
        message: "A SecurityEvent reference is required for this origin.",
      });
      return;
    }
    if (origin === "MANUAL" && securityEventId.trim()) {
      setFeedback({
        type: "error",
        message: "Remove the SecurityEvent reference or select Security event origin.",
      });
      return;
    }

    setCreatePending(true);
    try {
      const response = await fetch("/api/admin/security/cases", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          severity,
          origin,
          title: title.trim(),
          summary: summary.trim() || null,
          security_event_id: securityEventId.trim() || null,
          initial_status: "OPEN",
          idempotency_key: createIdempotencyKey("case-ui-create"),
        }),
      });
      if (!response.ok) {
        setFeedback({
          type: "error",
          message: safeCaseErrorMessage(response.status),
        });
        return;
      }
      setTitle("");
      setSummary("");
      setSeverity("MEDIUM");
      setOrigin("MANUAL");
      setSecurityEventId("");
      setCreateExpanded(false);
      setCursorStack([null]);
      setFeedback({
        type: "success",
        message: "Case created with initial status Open.",
      });
      setRefreshVersion((value) => value + 1);
    } catch {
      setFeedback({
        type: "error",
        message: "The case could not be created. Please try again.",
      });
    } finally {
      setCreatePending(false);
    }
  }

  return (
    <div className="space-y-6" data-testid="case-management-layout">
      <header className="flex flex-col gap-4 rounded-2xl border border-gray-800 bg-gray-900 p-5 shadow-xl sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-400">
            Security Operations
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            Incident cases
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-400">
            Review authorized case summaries and manage the incident lifecycle.
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            className={actionClassName}
            aria-controls="create-case-panel"
            aria-expanded={createExpanded}
            onClick={() => setCreateExpanded((value) => !value)}
          >
            {createExpanded ? "Cancel case creation" : "Create case"}
          </button>
        )}
      </header>

      <div aria-live="polite" aria-atomic="true">
        {feedback && (
          <div
            role={feedback.type === "error" ? "alert" : "status"}
            className={`rounded-lg border p-4 text-sm ${
              feedback.type === "error"
                ? "border-red-500/40 bg-red-500/10 text-red-100"
                : "border-green-500/40 bg-green-500/10 text-green-100"
            }`}
          >
            {feedback.message}
          </div>
        )}
      </div>

      {canCreate && createExpanded && (
        <section
          id="create-case-panel"
          aria-labelledby="create-case-heading"
          className="rounded-xl border border-gray-800 bg-gray-900 p-4 sm:p-6"
        >
          <h2 id="create-case-heading" className="text-xl font-bold text-white">
            Create incident case
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            The initial status is fixed at Open. Lifecycle changes remain API-authoritative.
          </p>
          <form className="mt-5 space-y-5" onSubmit={createCase}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5 text-sm font-medium text-gray-200">
                <span>Title</span>
                <input
                  className={fieldClassName}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                  minLength={1}
                  maxLength={160}
                />
              </label>
              <label className="space-y-1.5 text-sm font-medium text-gray-200">
                <span>Initial status</span>
                <input
                  className={`${fieldClassName} cursor-not-allowed text-gray-400`}
                  value="OPEN"
                  readOnly
                  aria-readonly="true"
                />
              </label>
              <label className="space-y-1.5 text-sm font-medium text-gray-200">
                <span>Severity</span>
                <select
                  className={fieldClassName}
                  value={severity}
                  onChange={(event) =>
                    setSeverity(event.target.value as CaseSeverity)
                  }
                >
                  {CASE_SEVERITIES.map((value) => (
                    <option key={value} value={value}>
                      {formatEnumLabel(value)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5 text-sm font-medium text-gray-200">
                <span>Origin</span>
                <select
                  className={fieldClassName}
                  value={origin}
                  onChange={(event) => {
                    const value = event.target
                      .value as (typeof CREATE_CASE_ORIGINS)[number];
                    setOrigin(value);
                    if (value === "MANUAL") setSecurityEventId("");
                  }}
                >
                  {CREATE_CASE_ORIGINS.map((value) => (
                    <option key={value} value={value}>
                      {formatEnumLabel(value)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block space-y-1.5 text-sm font-medium text-gray-200">
              <span>Summary (optional)</span>
              <textarea
                className={`${fieldClassName} min-h-24 resize-y`}
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                maxLength={2000}
              />
              <span className="block text-xs font-normal text-gray-500">
                Maximum 2,000 characters. Do not enter credentials or secrets.
              </span>
            </label>
            {origin === "SECURITY_EVENT" && (
              <label className="block space-y-1.5 text-sm font-medium text-gray-200">
                <span>Existing SecurityEvent reference</span>
                <input
                  className={fieldClassName}
                  value={securityEventId}
                  onChange={(event) => setSecurityEventId(event.target.value)}
                  required
                  maxLength={191}
                  autoComplete="off"
                />
              </label>
            )}
            <button type="submit" className={actionClassName} disabled={createPending}>
              {createPending ? "Creating case…" : "Create open case"}
            </button>
          </form>
        </section>
      )}

      <section
        aria-labelledby="case-filter-heading"
        className="rounded-xl border border-gray-800 bg-gray-900 p-4 sm:p-5"
      >
        <h2 id="case-filter-heading" className="font-semibold text-white">
          Filters
        </h2>
        <form className="mt-4 space-y-4" onSubmit={applyFilters}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <label className="space-y-1.5 text-sm text-gray-300">
              <span>Status</span>
              <select
                className={fieldClassName}
                value={draftFilters.status}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    status: event.target.value,
                  }))
                }
              >
                <option value="">All statuses</option>
                {CASE_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {formatEnumLabel(value)}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm text-gray-300">
              <span>Severity</span>
              <select
                className={fieldClassName}
                value={draftFilters.severity}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    severity: event.target.value,
                  }))
                }
              >
                <option value="">All severities</option>
                {CASE_SEVERITIES.map((value) => (
                  <option key={value} value={value}>
                    {formatEnumLabel(value)}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm text-gray-300">
              <span>Origin</span>
              <select
                className={fieldClassName}
                value={draftFilters.origin}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    origin: event.target.value,
                  }))
                }
              >
                <option value="">All origins</option>
                {CASE_ORIGINS.map((value) => (
                  <option key={value} value={value}>
                    {formatEnumLabel(value)}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm text-gray-300">
              <span>Assignee</span>
              <select
                className={fieldClassName}
                value={draftFilters.assigned_user_id}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    assigned_user_id: event.target.value,
                  }))
                }
              >
                <option value="">All assignees</option>
                {assigneeOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.full_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm text-gray-300">
              <span>Linked SecurityEvent</span>
              <input
                className={fieldClassName}
                value={draftFilters.security_event_id}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    security_event_id: event.target.value,
                  }))
                }
                maxLength={191}
                placeholder="Exact authorized reference"
                autoComplete="off"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="submit" className={actionClassName}>
              Apply filters
            </button>
            <button
              type="button"
              className="min-h-10 rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </div>
        </form>
      </section>

      <section aria-labelledby="case-results-heading" className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 id="case-results-heading" className="text-xl font-bold text-white">
            Case results
          </h2>
          <span className="text-sm text-gray-400" aria-live="polite">
            {loading ? "Loading cases" : `${cases.length} cases on this page`}
          </span>
        </div>

        {loading ? (
          <div
            role="status"
            className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center text-gray-300"
          >
            Loading authorized cases…
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-red-100"
          >
            <p>{error}</p>
            <button
              type="button"
              className="mt-4 rounded-lg border border-red-300/50 px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
              onClick={() => setRefreshVersion((value) => value + 1)}
            >
              Try again
            </button>
          </div>
        ) : cases.length === 0 ? (
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
            <h3 className="font-semibold text-white">No incident cases found</h3>
            <p className="mt-1 text-sm text-gray-400">
              No authorized case summaries match the current filters.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-xl border border-gray-800 md:block">
              <table className="w-full table-fixed text-left text-sm text-gray-300">
                <thead className="border-b border-gray-800 bg-gray-900 text-xs uppercase tracking-wide text-gray-400">
                  <tr>
                    <th scope="col" className="w-[20%] px-4 py-3">Case</th>
                    <th scope="col" className="w-[12%] px-4 py-3">Status</th>
                    <th scope="col" className="w-[11%] px-4 py-3">Severity</th>
                    <th scope="col" className="w-[13%] px-4 py-3">Origin</th>
                    <th scope="col" className="w-[13%] px-4 py-3">Assignee</th>
                    <th scope="col" className="w-[11%] px-4 py-3">Event</th>
                    <th scope="col" className="w-[10%] px-4 py-3">Created</th>
                    <th scope="col" className="w-[10%] px-4 py-3">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 bg-gray-950">
                  {cases.map((incidentCase) => (
                    <tr key={incidentCase.id} className="align-top hover:bg-gray-900/70">
                      <th scope="row" className="px-4 py-4 font-medium">
                        <Link
                          href={`/dashboard/admin/security/cases/${encodeURIComponent(incidentCase.id)}`}
                          className="break-words text-blue-300 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                        >
                          {incidentCase.case_reference}
                        </Link>
                      </th>
                      <td className="px-4 py-4"><StatusBadge value={incidentCase.status} kind="status" /></td>
                      <td className="px-4 py-4"><StatusBadge value={incidentCase.severity} kind="severity" /></td>
                      <td className="break-words px-4 py-4">{formatEnumLabel(incidentCase.origin)}</td>
                      <td className="break-words px-4 py-4">{incidentCase.assigned_user?.full_name ?? "Unassigned"}</td>
                      <td className="break-words px-4 py-4">{linkedEventReference(incidentCase.originating_security_event_id)}</td>
                      <td className="px-4 py-4 text-xs">{formatCaseDate(incidentCase.created_at)}</td>
                      <td className="px-4 py-4 text-xs">{formatCaseDate(incidentCase.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 md:hidden">
              {cases.map((incidentCase) => (
                <article
                  key={incidentCase.id}
                  className="min-w-0 rounded-xl border border-gray-800 bg-gray-900 p-4"
                >
                  <Link
                    href={`/dashboard/admin/security/cases/${encodeURIComponent(incidentCase.id)}`}
                    className="break-words text-base font-bold text-blue-300 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                  >
                    {incidentCase.case_reference}
                  </Link>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge value={incidentCase.status} kind="status" />
                    <StatusBadge value={incidentCase.severity} kind="severity" />
                  </div>
                  <dl className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-3 gap-y-3 text-sm">
                    <div className="min-w-0">
                      <dt className="text-xs uppercase text-gray-500">Origin</dt>
                      <dd className="break-words text-gray-200">{formatEnumLabel(incidentCase.origin)}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs uppercase text-gray-500">Assignee</dt>
                      <dd className="break-words text-gray-200">{incidentCase.assigned_user?.full_name ?? "Unassigned"}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs uppercase text-gray-500">SecurityEvent</dt>
                      <dd className="break-words text-gray-200">{linkedEventReference(incidentCase.originating_security_event_id)}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs uppercase text-gray-500">Created</dt>
                      <dd className="break-words text-gray-200">{formatCaseDate(incidentCase.created_at)}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs uppercase text-gray-500">Updated</dt>
                      <dd className="break-words text-gray-200">{formatCaseDate(incidentCase.updated_at)}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </>
        )}

        <nav
          aria-label="Case result pages"
          className="flex flex-col gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4 text-sm text-gray-400 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>Up to 25 cases per page</span>
          <div className="flex gap-2">
            <button
              type="button"
              className="min-h-10 rounded-lg border border-gray-700 px-4 py-2 font-semibold text-white hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading || cursorStack.length === 1}
              onClick={() =>
                setCursorStack((current) =>
                  current.length > 1 ? current.slice(0, -1) : current,
                )
              }
            >
              Previous
            </button>
            <button
              type="button"
              className="min-h-10 rounded-lg border border-gray-700 px-4 py-2 font-semibold text-white hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading || !nextCursor}
              onClick={() => {
                if (nextCursor) {
                  setCursorStack((current) => [...current, nextCursor]);
                }
              }}
            >
              Next
            </button>
          </div>
        </nav>
      </section>
    </div>
  );
}
