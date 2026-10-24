"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { formatEnumLabel, formatDate, safeErrorMessage } from "./playbook-ui";
import { PlaybookListItem } from "@/lib/security/playbooks/playbook-read.service";
import { SECURITY_PERMISSIONS } from "@/lib/security/permissions";

const actionClassName = "inline-flex min-h-10 items-center justify-center rounded-lg border border-blue-500 bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50";
const fieldClassName = "w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none transition focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400/40";

function StatusBadge({ value }: { value: string }) {
  const tone = value === "ACTIVE"
    ? "border-green-500/40 bg-green-500/10 text-green-100"
    : value === "DRAFT"
      ? "border-gray-500/40 bg-gray-500/10 text-gray-200"
      : "border-blue-500/40 bg-blue-500/10 text-blue-100";
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {formatEnumLabel(value)}
    </span>
  );
}

export function PlaybookListClient({ activePermissions }: { activePermissions: readonly string[] }) {
  const [playbooks, setPlaybooks] = useState<PlaybookListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [cursorStack, setCursorStack] = useState<Array<string | null>>([null]);
  const [refreshVersion, setRefreshVersion] = useState(0);

  const [createExpanded, setCreateExpanded] = useState(false);
  const [createPending, setCreatePending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const currentCursor = cursorStack.at(-1) ?? null;
  const canCreate = activePermissions.includes(SECURITY_PERMISSIONS.PLAYBOOK_CREATE);

  const loadPlaybooks = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    const query = new URLSearchParams({ limit: "25" });
    if (currentCursor) query.set("cursor", currentCursor);

    try {
      const response = await fetch(`/api/soc/playbooks/list?${query}`, { signal, headers: { Accept: "application/json" } });
      if (!response.ok) {
        setPlaybooks([]);
        setNextCursor(null);
        setError(safeErrorMessage(response.status));
        return;
      }
      const payload = await response.json();
      setPlaybooks(Array.isArray(payload.data) ? payload.data : []);
      setNextCursor(payload.pagination?.next_cursor ?? null);
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      setPlaybooks([]);
      setNextCursor(null);
      setError("Playbook management is temporarily unavailable.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [currentCursor]);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPlaybooks(controller.signal);
    return () => controller.abort();
  }, [loadPlaybooks, refreshVersion]);

  async function createDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setCreatePending(true);
    try {
      const response = await fetch("/api/soc/playbooks/draft-create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() })
      });
      const data = await response.json();
      if (!response.ok) {
        setFeedback({ type: "error", message: safeErrorMessage(response.status, data) });
        return;
      }
      setName("");
      setDescription("");
      setCreateExpanded(false);
      setCursorStack([null]);
      setFeedback({ type: "success", message: "Draft playbook created." });
      setRefreshVersion(v => v + 1);
    } catch {
      setFeedback({ type: "error", message: "Network error occurred." });
    } finally {
      setCreatePending(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-gray-800 bg-gray-900 p-5 shadow-xl sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Security Playbooks</h1>
          <p className="mt-2 text-sm text-gray-400">Manage automated response actions.</p>
        </div>
        {canCreate && (
          <button
            type="button"
            className={actionClassName}
            onClick={() => setCreateExpanded(v => !v)}
          >
            {createExpanded ? "Cancel" : "Create draft"}
          </button>
        )}
      </header>

      {feedback && (
        <div role="status" className={`rounded-lg border p-4 text-sm ${feedback.type === "error" ? "border-red-500/40 bg-red-500/10 text-red-100" : "border-green-500/40 bg-green-500/10 text-green-100"}`}>
          {feedback.message}
        </div>
      )}

      {canCreate && createExpanded && (
        <section className="rounded-xl border border-gray-800 bg-gray-900 p-4 sm:p-6">
          <h2 className="text-xl font-bold text-white">Create new draft playbook</h2>
          <form className="mt-5 space-y-5" onSubmit={createDraft}>
            <label className="block space-y-1.5 text-sm font-medium text-gray-200">
              <span>Name</span>
              <input className={fieldClassName} value={name} onChange={e => setName(e.target.value)} required minLength={1} maxLength={100} />
            </label>
            <label className="block space-y-1.5 text-sm font-medium text-gray-200">
              <span>Description</span>
              <textarea className={`${fieldClassName} min-h-24`} value={description} onChange={e => setDescription(e.target.value)} required minLength={1} maxLength={1000} />
            </label>
            <button type="submit" className={actionClassName} disabled={createPending}>
              {createPending ? "Creating..." : "Save draft"}
            </button>
          </form>
        </section>
      )}

      <section className="space-y-4">
        {loading ? (
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center text-gray-300">Loading playbooks...</div>
        ) : error ? (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-red-100">{error}</div>
        ) : playbooks.length === 0 ? (
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center text-gray-300">No playbooks found.</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-950">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="border-b border-gray-800 bg-gray-900 uppercase text-gray-400">
                <tr>
                  <th className="px-4 py-3">Playbook</th>
                  <th className="px-4 py-3">Version</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {playbooks.map(pb => (
                  <tr key={pb.id} className="hover:bg-gray-900/70">
                    <td className="px-4 py-4 font-medium">
                      <Link href={`/dashboard/admin/security/playbooks/${pb.id}`} className="text-blue-300 hover:underline">{pb.name}</Link>
                    </td>
                    <td className="px-4 py-4">v{pb.version}</td>
                    <td className="px-4 py-4"><StatusBadge value={pb.status} /></td>
                    <td className="px-4 py-4">{formatDate(pb.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <nav className="flex items-center justify-between">
          <button
            type="button"
            className="rounded border border-gray-700 px-4 py-2 text-white disabled:opacity-50"
            disabled={loading || cursorStack.length === 1}
            onClick={() => setCursorStack(c => c.length > 1 ? c.slice(0, -1) : c)}
          >Previous</button>
          <button
            type="button"
            className="rounded border border-gray-700 px-4 py-2 text-white disabled:opacity-50"
            disabled={loading || !nextCursor}
            onClick={() => { if (nextCursor) setCursorStack(c => [...c, nextCursor]); }}
          >Next</button>
        </nav>
      </section>
    </div>
  );
}
