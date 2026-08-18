"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  abbreviatedHash,
  AssigneeOption,
  CASE_EVIDENCE_SOURCES,
  CASE_EVIDENCE_TYPES,
  CASE_NOTE_TYPES,
  CaseEvidenceSource,
  CaseEvidenceType,
  CaseNoteType,
  containsSensitiveInput,
  createIdempotencyKey,
  EVIDENCE_REFERENCE_PREFIX,
  formatCaseDate,
  formatEnumLabel,
  hasPermission,
  INCIDENT_CASE_PERMISSIONS,
  IncidentCaseDetail,
  linkedEventReference,
  safeCaseErrorMessage,
  TRANSITION_OPTIONS,
  TransitionOption,
} from "./incident-case-ui";

const fieldClassName =
  "w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none transition focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400/40";

const actionClassName =
  "inline-flex min-h-10 items-center justify-center rounded-lg border border-blue-500 bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50";

function chronological<T extends { id: string }>(
  values: T[],
  getDate: (value: T) => string,
): T[] {
  return [...values].sort((left, right) => {
    const difference =
      new Date(getDate(left)).getTime() - new Date(getDate(right)).getTime();
    return difference || left.id.localeCompare(right.id);
  });
}

export function IncidentCaseDetailClient({
  caseId,
  activePermissions,
  assigneeOptions,
}: {
  caseId: string;
  activePermissions: readonly string[];
  assigneeOptions: AssigneeOption[];
}) {
  const [incidentCase, setIncidentCase] = useState<IncidentCaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mutationPending, setMutationPending] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [transitionReason, setTransitionReason] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [assignmentReason, setAssignmentReason] = useState("");
  const [noteType, setNoteType] = useState<CaseNoteType>("INVESTIGATION");
  const [noteContent, setNoteContent] = useState("");
  const [evidenceType, setEvidenceType] =
    useState<CaseEvidenceType>("SYSTEM_LOG");
  const [evidenceSource, setEvidenceSource] =
    useState<CaseEvidenceSource>("INTERNAL_SYSTEM");
  const [evidenceReference, setEvidenceReference] = useState("");
  const [integrityHash, setIntegrityHash] = useState("");
  const [collectedAt, setCollectedAt] = useState("");
  const [contentType, setContentType] = useState("");
  const [sizeBytes, setSizeBytes] = useState("");

  const loadCase = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(
        `/api/admin/security/cases/${encodeURIComponent(caseId)}`,
        { headers: { Accept: "application/json" } },
      );
      if (!response.ok) {
        setIncidentCase(null);
        setLoadError(safeCaseErrorMessage(response.status));
        return;
      }
      const payload = (await response.json()) as { data: IncidentCaseDetail };
      setIncidentCase({
        ...payload.data,
        histories: chronological(
          payload.data.histories ?? [],
          (item) => item.occurred_at,
        ),
        notes: chronological(payload.data.notes ?? [], (item) => item.created_at),
        evidences: chronological(
          payload.data.evidences ?? [],
          (item) => item.collected_at,
        ),
      });
      setAssigneeId(payload.data.assigned_user?.id ?? "");
    } catch {
      setIncidentCase(null);
      setLoadError("Case management is temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCase();
  }, [loadCase]);

  const transitions = useMemo(
    () =>
      incidentCase
        ? TRANSITION_OPTIONS[incidentCase.status].filter((option) =>
            hasPermission(activePermissions, option.permission),
          )
        : [],
    [activePermissions, incidentCase],
  );

  async function submitMutation(
    path: string,
    body: Record<string, unknown>,
    successMessage: string,
    clearSensitiveState?: () => void,
  ) {
    setMutationPending(true);
    setFeedback(null);
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        setFeedback({
          type: "error",
          message: safeCaseErrorMessage(response.status),
        });
        if (response.status === 409) await loadCase();
        return false;
      }
      clearSensitiveState?.();
      await loadCase();
      setFeedback({ type: "success", message: successMessage });
      return true;
    } catch {
      setFeedback({
        type: "error",
        message: "The case operation could not be completed. Please try again.",
      });
      return false;
    } finally {
      setMutationPending(false);
    }
  }

  async function transitionCase(option: TransitionOption) {
    if (!incidentCase) return;
    if (
      option.highImpact &&
      !window.confirm(
        `${option.label}? This changes the authoritative case lifecycle.`,
      )
    ) {
      return;
    }
    await submitMutation(
      `/api/admin/security/cases/${encodeURIComponent(caseId)}/status`,
      {
        expected_status: incidentCase.status,
        expected_version: incidentCase.version,
        new_status: option.status,
        reason_note: transitionReason.trim() || null,
        idempotency_key: createIdempotencyKey("case-ui-status"),
      },
      `Case status changed to ${formatEnumLabel(option.status)}.`,
      () => setTransitionReason(""),
    );
  }

  async function assignCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!incidentCase || !assigneeId) return;
    if (assigneeId === incidentCase.assigned_user?.id) {
      setFeedback({
        type: "error",
        message: "This user is already assigned. The case status was not changed.",
      });
      return;
    }
    await submitMutation(
      `/api/admin/security/cases/${encodeURIComponent(caseId)}/assignment`,
      {
        assignee_user_id: assigneeId,
        expected_version: incidentCase.version,
        reason_note: assignmentReason.trim() || null,
        idempotency_key: createIdempotencyKey("case-ui-assignment"),
      },
      incidentCase.assigned_user
        ? "Case reassigned. The case status was not changed."
        : "Case assigned. The case status was not changed.",
      () => setAssignmentReason(""),
    );
  }

  async function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!noteContent.trim()) return;
    if (!window.confirm("Append this note to the authorized case record?")) return;
    await submitMutation(
      `/api/admin/security/cases/${encodeURIComponent(caseId)}/notes`,
      {
        note_type: noteType,
        content: noteContent.trim(),
        idempotency_key: createIdempotencyKey("case-ui-note"),
      },
      "Note appended to the case.",
      () => setNoteContent(""),
    );
  }

  async function addEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const reference = evidenceReference.trim();
    const mimeType = contentType.trim();
    const requiredPrefix = EVIDENCE_REFERENCE_PREFIX[evidenceType];
    if (!reference.startsWith(requiredPrefix)) {
      setFeedback({
        type: "error",
        message: `The evidence reference must begin with ${requiredPrefix}`,
      });
      return;
    }
    if (containsSensitiveInput(reference) || containsSensitiveInput(mimeType)) {
      setFeedback({
        type: "error",
        message: "Evidence references cannot contain credentials or connection details.",
      });
      return;
    }
    if (!/^[0-9a-f]{64}$/i.test(integrityHash)) {
      setFeedback({
        type: "error",
        message: "Integrity hash must contain exactly 64 hexadecimal characters.",
      });
      return;
    }
    const collectedDate = new Date(collectedAt);
    if (Number.isNaN(collectedDate.getTime())) {
      setFeedback({
        type: "error",
        message: "Enter a valid evidence collection date and time.",
      });
      return;
    }

    await submitMutation(
      `/api/admin/security/cases/${encodeURIComponent(caseId)}/evidence`,
      {
        evidence_type: evidenceType,
        source: evidenceSource,
        reference_key: reference,
        integrity_hash: integrityHash.toLowerCase(),
        collected_at: collectedDate.toISOString(),
        content_type: mimeType || null,
        size_bytes: sizeBytes === "" ? null : Number(sizeBytes),
        idempotency_key: createIdempotencyKey("case-ui-evidence"),
      },
      "Evidence reference appended to the case.",
      () => {
        setEvidenceReference("");
        setIntegrityHash("");
        setCollectedAt("");
        setContentType("");
        setSizeBytes("");
      },
    );
  }

  const canAssign =
    incidentCase &&
    hasPermission(
      activePermissions,
      incidentCase.assigned_user
        ? INCIDENT_CASE_PERMISSIONS.REASSIGN
        : INCIDENT_CASE_PERMISSIONS.ASSIGN,
    );
  const canAddNote = hasPermission(
    activePermissions,
    INCIDENT_CASE_PERMISSIONS.ADD_NOTE,
  );
  const canAddEvidence = hasPermission(
    activePermissions,
    INCIDENT_CASE_PERMISSIONS.ADD_EVIDENCE,
  );

  if (loading && !incidentCase) {
    return (
      <div
        role="status"
        className="rounded-xl border border-gray-800 bg-gray-900 p-10 text-center text-gray-300"
      >
        Loading authorized case detail…
      </div>
    );
  }

  if (loadError || !incidentCase) {
    return (
      <div className="space-y-5">
        <Link
          href="/dashboard/admin/security/cases"
          className="text-sm font-semibold text-blue-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
        >
          ← Back to incident cases
        </Link>
        <div
          role="alert"
          className="rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-red-100"
        >
          <p>{loadError ?? "The case could not be loaded."}</p>
          <button
            type="button"
            className="mt-4 rounded-lg border border-red-300/50 px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
            onClick={() => void loadCase()}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6" data-testid="case-detail-layout">
      <Link
        href="/dashboard/admin/security/cases"
        className="inline-flex text-sm font-semibold text-blue-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
      >
        ← Back to incident cases
      </Link>

      <header className="rounded-2xl border border-gray-800 bg-gray-900 p-5 shadow-xl sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm uppercase tracking-[0.18em] text-blue-400">
              Incident case
            </p>
            <h1 className="mt-1 break-words text-2xl font-bold text-white sm:text-3xl">
              {incidentCase.case_reference}
            </h1>
            <p className="mt-2 break-words text-gray-300">{incidentCase.title}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-sm font-semibold text-blue-100">
              Status: {formatEnumLabel(incidentCase.status)}
            </span>
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-100">
              Severity: {formatEnumLabel(incidentCase.severity)}
            </span>
          </div>
        </div>
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

      <section
        aria-labelledby="case-summary-heading"
        className="rounded-xl border border-gray-800 bg-gray-900 p-4 sm:p-6"
      >
        <h2 id="case-summary-heading" className="text-xl font-bold text-white">
          Case summary
        </h2>
        <dl className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Origin", formatEnumLabel(incidentCase.origin)],
            ["Assignee", incidentCase.assigned_user?.full_name ?? "Unassigned"],
            [
              "SecurityEvent",
              linkedEventReference(incidentCase.originating_security_event_id),
            ],
            ["Created", formatCaseDate(incidentCase.created_at)],
            ["Updated", formatCaseDate(incidentCase.updated_at)],
            ["Opened", formatCaseDate(incidentCase.opened_at)],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {label}
              </dt>
              <dd className="mt-1 break-words text-sm text-gray-200">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 border-t border-gray-800 pt-5">
          <h3 className="text-sm font-semibold text-gray-300">Authorized summary</h3>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm text-gray-400">
            {incidentCase.summary || "No case summary recorded."}
          </p>
        </div>
      </section>

      {(transitions.length > 0 || canAssign) && (
        <section
          aria-labelledby="case-actions-heading"
          className="rounded-xl border border-gray-800 bg-gray-900 p-4 sm:p-6"
        >
          <h2 id="case-actions-heading" className="text-xl font-bold text-white">
            Authorized case actions
          </h2>

          {transitions.length > 0 && (
            <div className="mt-5 space-y-3">
              <label className="block space-y-1.5 text-sm font-medium text-gray-200">
                <span>Lifecycle reason (optional)</span>
                <textarea
                  className={`${fieldClassName} min-h-20 resize-y`}
                  value={transitionReason}
                  onChange={(event) => setTransitionReason(event.target.value)}
                  maxLength={1000}
                />
              </label>
              <div className="flex flex-wrap gap-3">
                {transitions.map((option) => (
                  <button
                    key={option.status}
                    type="button"
                    className={
                      option.highImpact
                        ? `${actionClassName} border-amber-500 bg-amber-600 hover:bg-amber-500`
                        : actionClassName
                    }
                    disabled={mutationPending}
                    onClick={() => void transitionCase(option)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {canAssign && (
            <form
              className="mt-6 grid gap-4 border-t border-gray-800 pt-6 md:grid-cols-2"
              onSubmit={assignCase}
              aria-label="Case assignment"
            >
              <label className="space-y-1.5 text-sm font-medium text-gray-200">
                <span>{incidentCase.assigned_user ? "Reassign to" : "Assign to"}</span>
                <select
                  className={fieldClassName}
                  value={assigneeId}
                  onChange={(event) => setAssigneeId(event.target.value)}
                  required
                >
                  <option value="">Select an authorized assignee</option>
                  {assigneeOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.full_name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5 text-sm font-medium text-gray-200">
                <span>Assignment reason (optional)</span>
                <input
                  className={fieldClassName}
                  value={assignmentReason}
                  onChange={(event) => setAssignmentReason(event.target.value)}
                  maxLength={1000}
                />
              </label>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className={actionClassName}
                  disabled={mutationPending || !assigneeId}
                >
                  {incidentCase.assigned_user ? "Reassign case" : "Assign case"}
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      <section
        aria-labelledby="case-history-heading"
        className="rounded-xl border border-gray-800 bg-gray-900 p-4 sm:p-6"
      >
        <h2 id="case-history-heading" className="text-xl font-bold text-white">
          Chronological history
        </h2>
        {incidentCase.histories.length === 0 ? (
          <p className="mt-4 text-sm text-gray-400">No history entries recorded.</p>
        ) : (
          <ol className="mt-5 space-y-4 border-l border-gray-700 pl-5">
            {incidentCase.histories.map((history) => (
              <li key={history.id} className="relative min-w-0">
                <span
                  aria-hidden="true"
                  className="absolute -left-[1.45rem] top-1.5 h-2.5 w-2.5 rounded-full bg-blue-400 ring-4 ring-gray-900"
                />
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="break-words font-semibold text-white">
                    {formatEnumLabel(history.reason)}
                  </h3>
                  <time
                    dateTime={history.occurred_at}
                    className="text-xs text-gray-500"
                  >
                    {formatCaseDate(history.occurred_at)}
                  </time>
                </div>
                <p className="mt-1 break-words text-sm text-gray-400">
                  {history.previous_status
                    ? `${formatEnumLabel(history.previous_status)} → ${formatEnumLabel(history.new_status)}`
                    : `Created as ${formatEnumLabel(history.new_status)}`}
                  {history.actor_user?.full_name
                    ? ` by ${history.actor_user.full_name}`
                    : ""}
                  {history.assigned_to_user?.full_name
                    ? `; assigned to ${history.assigned_to_user.full_name}`
                    : ""}
                </p>
                {history.reason_note && (
                  <p className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-gray-950 p-3 text-sm text-gray-300">
                    {history.reason_note}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section
        aria-labelledby="case-notes-heading"
        className="rounded-xl border border-gray-800 bg-gray-900 p-4 sm:p-6"
      >
        <h2 id="case-notes-heading" className="text-xl font-bold text-white">
          Authorized notes
        </h2>
        <div className="mt-5 space-y-3">
          {incidentCase.notes.length === 0 ? (
            <p className="text-sm text-gray-400">No authorized notes recorded.</p>
          ) : (
            incidentCase.notes.map((note) => (
              <article
                key={note.id}
                className="min-w-0 rounded-lg border border-gray-800 bg-gray-950 p-4"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="font-semibold text-white">
                    {formatEnumLabel(note.note_type)}
                  </h3>
                  <time dateTime={note.created_at} className="text-xs text-gray-500">
                    {formatCaseDate(note.created_at)}
                  </time>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Added by {note.actor_user?.full_name ?? "Authorized user"}
                </p>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm text-gray-300">
                  {note.is_redacted ? "Note content redacted." : note.content}
                </p>
              </article>
            ))
          )}
        </div>

        {canAddNote && (
          <form
            aria-label="Add case note"
            className="mt-6 space-y-4 border-t border-gray-800 pt-6"
            onSubmit={addNote}
          >
            <div className="grid gap-4 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
              <label className="space-y-1.5 text-sm font-medium text-gray-200">
                <span>Note type</span>
                <select
                  className={fieldClassName}
                  value={noteType}
                  onChange={(event) =>
                    setNoteType(event.target.value as CaseNoteType)
                  }
                >
                  {CASE_NOTE_TYPES.map((value) => (
                    <option key={value} value={value}>
                      {formatEnumLabel(value)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5 text-sm font-medium text-gray-200">
                <span>Note</span>
                <textarea
                  className={`${fieldClassName} min-h-28 resize-y`}
                  value={noteContent}
                  onChange={(event) => setNoteContent(event.target.value)}
                  required
                  maxLength={4000}
                />
                <span className="block text-xs font-normal text-gray-500">
                  Maximum 4,000 characters. Do not enter credentials or secrets.
                </span>
              </label>
            </div>
            <button
              type="submit"
              className={actionClassName}
              disabled={mutationPending || !noteContent.trim()}
            >
              Append note
            </button>
          </form>
        )}
      </section>

      <section
        aria-labelledby="case-evidence-heading"
        className="rounded-xl border border-gray-800 bg-gray-900 p-4 sm:p-6"
      >
        <h2 id="case-evidence-heading" className="text-xl font-bold text-white">
          Evidence references
        </h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {incidentCase.evidences.length === 0 ? (
            <p className="text-sm text-gray-400">No evidence references recorded.</p>
          ) : (
            incidentCase.evidences.map((evidence) => (
              <article
                key={evidence.id}
                className="min-w-0 rounded-lg border border-gray-800 bg-gray-950 p-4"
              >
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-blue-500/40 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-100">
                    {formatEnumLabel(evidence.evidence_type)}
                  </span>
                  <span className="rounded-full border border-gray-700 px-2.5 py-1 text-xs text-gray-300">
                    {formatEnumLabel(evidence.source)}
                  </span>
                </div>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div className="min-w-0 sm:col-span-2">
                    <dt className="text-xs uppercase text-gray-500">Reference</dt>
                    <dd className="break-all text-gray-200">{evidence.reference_key}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs uppercase text-gray-500">Integrity hash</dt>
                    <dd className="break-all font-mono text-xs text-gray-300">
                      {abbreviatedHash(evidence.integrity_hash)}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs uppercase text-gray-500">Collected</dt>
                    <dd className="break-words text-gray-300">
                      {formatCaseDate(evidence.collected_at)}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs uppercase text-gray-500">Content type</dt>
                    <dd className="break-words text-gray-300">
                      {evidence.content_type ?? "Not recorded"}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs uppercase text-gray-500">Size</dt>
                    <dd className="break-words text-gray-300">
                      {evidence.size_bytes === null
                        ? "Not recorded"
                        : `${evidence.size_bytes.toLocaleString()} bytes`}
                    </dd>
                  </div>
                  <div className="min-w-0 sm:col-span-2">
                    <dt className="text-xs uppercase text-gray-500">Added by</dt>
                    <dd className="break-words text-gray-300">
                      {evidence.added_by_user?.full_name ?? "Authorized user"}
                    </dd>
                  </div>
                </dl>
              </article>
            ))
          )}
        </div>

        {canAddEvidence && (
          <form
            aria-label="Add evidence reference"
            className="mt-6 space-y-4 border-t border-gray-800 pt-6"
            onSubmit={addEvidence}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5 text-sm font-medium text-gray-200">
                <span>Evidence type</span>
                <select
                  className={fieldClassName}
                  value={evidenceType}
                  onChange={(event) => {
                    const value = event.target.value as CaseEvidenceType;
                    setEvidenceType(value);
                    setEvidenceReference(EVIDENCE_REFERENCE_PREFIX[value]);
                  }}
                >
                  {CASE_EVIDENCE_TYPES.map((value) => (
                    <option key={value} value={value}>
                      {formatEnumLabel(value)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5 text-sm font-medium text-gray-200">
                <span>Evidence source</span>
                <select
                  className={fieldClassName}
                  value={evidenceSource}
                  onChange={(event) =>
                    setEvidenceSource(event.target.value as CaseEvidenceSource)
                  }
                >
                  {CASE_EVIDENCE_SOURCES.map((value) => (
                    <option key={value} value={value}>
                      {formatEnumLabel(value)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5 text-sm font-medium text-gray-200 md:col-span-2">
                <span>Reference</span>
                <input
                  className={fieldClassName}
                  value={evidenceReference}
                  onChange={(event) => setEvidenceReference(event.target.value)}
                  required
                  minLength={1}
                  maxLength={256}
                  autoComplete="off"
                  placeholder={`Begin with ${EVIDENCE_REFERENCE_PREFIX[evidenceType]}`}
                />
              </label>
              <label className="space-y-1.5 text-sm font-medium text-gray-200 md:col-span-2">
                <span>SHA-256 integrity hash</span>
                <input
                  className={fieldClassName}
                  value={integrityHash}
                  onChange={(event) => setIntegrityHash(event.target.value)}
                  required
                  minLength={64}
                  maxLength={64}
                  pattern="[0-9a-fA-F]{64}"
                  autoComplete="off"
                />
              </label>
              <label className="space-y-1.5 text-sm font-medium text-gray-200">
                <span>Collected at</span>
                <input
                  type="datetime-local"
                  className={fieldClassName}
                  value={collectedAt}
                  onChange={(event) => setCollectedAt(event.target.value)}
                  required
                />
              </label>
              <label className="space-y-1.5 text-sm font-medium text-gray-200">
                <span>Content type (optional)</span>
                <input
                  className={fieldClassName}
                  value={contentType}
                  onChange={(event) => setContentType(event.target.value)}
                  maxLength={120}
                  placeholder="application/json"
                />
              </label>
              <label className="space-y-1.5 text-sm font-medium text-gray-200">
                <span>Size in bytes (optional)</span>
                <input
                  type="number"
                  className={fieldClassName}
                  value={sizeBytes}
                  onChange={(event) => setSizeBytes(event.target.value)}
                  min={0}
                  max={2147483647}
                  step={1}
                />
              </label>
            </div>
            <p className="text-xs text-gray-500">
              Reference metadata only. File upload is not available. Never enter
              passwords, tokens, database URLs, or connection strings.
            </p>
            <button
              type="submit"
              className={actionClassName}
              disabled={mutationPending}
            >
              Append evidence reference
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
