"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatEnumLabel, formatDate, safeErrorMessage } from "./approval-ui";
import { ApprovalListItem } from "@/lib/security/approvals/approval-read.service";
import { SECURITY_PERMISSIONS } from "@/lib/security/permissions";

const actionClassName = "inline-flex min-h-10 items-center justify-center rounded-lg border border-blue-500 bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50";

function StatusBadge({ value }: { value: string }) {
  const tone = value === "PENDING"
    ? "border-amber-500/40 bg-amber-500/10 text-amber-100"
    : value === "APPROVED"
      ? "border-green-500/40 bg-green-500/10 text-green-100"
      : "border-red-500/40 bg-red-500/10 text-red-100";
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {formatEnumLabel(value)}
    </span>
  );
}

export function ApprovalListClient({ activePermissions }: { activePermissions: readonly string[] }) {
  const [approvals, setApprovals] = useState<ApprovalListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [cursorStack, setCursorStack] = useState<Array<string | null>>([null]);
  const [refreshVersion, setRefreshVersion] = useState(0);

  const currentCursor = cursorStack.at(-1) ?? null;

  const loadApprovals = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    const query = new URLSearchParams({ limit: "25" });
    if (currentCursor) query.set("cursor", currentCursor);

    try {
      const response = await fetch(`/api/soc/approvals/list?${query}`, { signal, headers: { Accept: "application/json" } });
      if (!response.ok) {
        setApprovals([]);
        setNextCursor(null);
        setError(safeErrorMessage(response.status));
        return;
      }
      const payload = await response.json();
      setApprovals(Array.isArray(payload.data) ? payload.data : []);
      setNextCursor(payload.pagination?.next_cursor ?? null);
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      setApprovals([]);
      setNextCursor(null);
      setError("Approval management is temporarily unavailable.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [currentCursor]);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadApprovals(controller.signal);
    return () => controller.abort();
  }, [loadApprovals, refreshVersion]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-gray-800 bg-gray-900 p-5 shadow-xl sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Security Approvals</h1>
          <p className="mt-2 text-sm text-gray-400">Manage security response approval requests.</p>
        </div>
      </header>

      <section className="space-y-4">
        {loading ? (
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center text-gray-300">Loading approvals...</div>
        ) : error ? (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-red-100">{error}</div>
        ) : approvals.length === 0 ? (
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center text-gray-300">No approval requests found.</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-950">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="border-b border-gray-800 bg-gray-900 uppercase text-gray-400">
                <tr>
                  <th className="px-4 py-3">Request ID</th>
                  <th className="px-4 py-3">Case ID</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Requester</th>
                  <th className="px-4 py-3">Requested</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {approvals.map(req => (
                  <tr key={req.id} className="hover:bg-gray-900/70">
                    <td className="px-4 py-4 font-medium">
                      <Link href={`/dashboard/admin/security/approvals/${req.id}`} className="text-blue-300 hover:underline">{req.id.slice(0,8)}...</Link>
                    </td>
                    <td className="px-4 py-4">{req.incident_case_id}</td>
                    <td className="px-4 py-4"><StatusBadge value={req.status} /></td>
                    <td className="px-4 py-4">{req.requester?.full_name ?? "Unknown"}</td>
                    <td className="px-4 py-4">{formatDate(req.requested_at)}</td>
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
