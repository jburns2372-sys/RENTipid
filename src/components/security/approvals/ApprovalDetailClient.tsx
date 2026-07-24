"use client";

import { useState } from "react";
import { formatEnumLabel, formatDate, safeErrorMessage } from "./approval-ui";
import { ApprovalDetail } from "@/lib/security/approvals/approval-read.service";
import { SECURITY_PERMISSIONS } from "@/lib/security/permissions";
import { useRouter } from "next/navigation";
import { createIdempotencyKey } from "@/components/security/cases/incident-case-ui";

const actionClassName = "inline-flex items-center justify-center rounded-lg border border-blue-500 bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus:outline-none disabled:opacity-50";

export function ApprovalDetailClient({
  initialApproval,
  activePermissions,
  currentUserId
}: {
  initialApproval: ApprovalDetail;
  activePermissions: readonly string[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [pending, setPending] = useState(false);
  
  const isRequester = currentUserId === initialApproval.requester_id;
  const canCancel = activePermissions.includes(SECURITY_PERMISSIONS.RESPONSE_CANCEL) && isRequester && initialApproval.status === "PENDING";
  
  const canApprove = activePermissions.includes(SECURITY_PERMISSIONS.RESPONSE_APPROVE) && !isRequester && initialApproval.status === "PENDING";
  const canReject = activePermissions.includes(SECURITY_PERMISSIONS.RESPONSE_REJECT) && !isRequester && initialApproval.status === "PENDING";
  
  const activeGrant = initialApproval.grants.find(g => g.grant_state === "AVAILABLE");
  const canRevoke = activePermissions.includes(SECURITY_PERMISSIONS.RESPONSE_REVOKE) && activeGrant !== undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function apiAction(endpoint: string, body: any) {
    if (pending) return;
    setPending(true);
    setFeedback(null);
    try {
      const response = await fetch(`/api/soc/approvals/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) {
        setFeedback({ type: "error", message: safeErrorMessage(response.status, data) });
      } else {
        setFeedback({ type: "success", message: "Success" });
        router.refresh();
      }
    } catch {
      setFeedback({ type: "error", message: "Network error." });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h1 className="text-2xl font-bold text-white">Approval Request: {initialApproval.id}</h1>
        <p className="text-gray-400">Incident Case: {initialApproval.incident_case_id}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-200 border border-blue-500/30">
            {formatEnumLabel(initialApproval.status)}
          </span>
          {canCancel && (
            <button className={actionClassName} disabled={pending} onClick={() => apiAction("cancel", { request_id: initialApproval.id, idempotency_key: createIdempotencyKey("cancel") })}>
              Cancel Request
            </button>
          )}
          {canApprove && (
            <button className={actionClassName} disabled={pending} onClick={() => apiAction("approve", { request_id: initialApproval.id, reason: "Approved via UI", idempotency_key: createIdempotencyKey("approve") })}>
              Approve
            </button>
          )}
          {canReject && (
            <button className={`${actionClassName} !bg-red-600 !border-red-500 hover:!bg-red-500`} disabled={pending} onClick={() => apiAction("reject", { request_id: initialApproval.id, reason: "Rejected via UI", idempotency_key: createIdempotencyKey("reject") })}>
              Reject
            </button>
          )}
          {canRevoke && (
            <button className={`${actionClassName} !bg-red-600 !border-red-500 hover:!bg-red-500`} disabled={pending} onClick={() => apiAction("revoke", { request_id: initialApproval.id, idempotency_key: createIdempotencyKey("revoke") })}>
              Revoke Grant
            </button>
          )}
        </div>
      </header>

      {feedback && (
        <div className={`p-4 rounded border text-sm ${feedback.type === 'error' ? 'bg-red-900/50 border-red-500 text-red-200' : 'bg-green-900/50 border-green-500 text-green-200'}`}>
          {feedback.message}
        </div>
      )}

      <section className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-gray-300 space-y-2 text-sm">
        <p><strong className="text-white">Requester:</strong> {initialApproval.requester?.full_name ?? "Unknown"}</p>
        <p><strong className="text-white">Playbook:</strong> {initialApproval.playbook_id} (v{initialApproval.playbook_version})</p>
        <p><strong className="text-white">Justification:</strong> {initialApproval.justification}</p>
        <p><strong className="text-white">Requested At:</strong> {formatDate(initialApproval.requested_at)}</p>
      </section>

      <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-xl font-bold text-white mb-4">Decisions</h2>
        {initialApproval.decisions.length === 0 ? (
          <p className="text-gray-400">No decisions recorded.</p>
        ) : (
          <ul className="space-y-2">
            {initialApproval.decisions.map((d, i) => (
              <li key={i} className="text-sm text-gray-300">
                {formatEnumLabel(d.event_type)} by {d.actor?.full_name ?? "Unknown"} on {formatDate(d.occurred_at)}
                {d.reason && <span> - Reason: {d.reason}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-xl font-bold text-white mb-4">Grants</h2>
        {initialApproval.grants.length === 0 ? (
          <p className="text-gray-400">No grants issued.</p>
        ) : (
          <ul className="space-y-2">
            {initialApproval.grants.map((g, i) => (
              <li key={i} className="text-sm text-gray-300">
                Status: {formatEnumLabel(g.grant_state)}, Issued: {formatDate(g.issued_at)}, Expires: {formatDate(g.expires_at)}
                {g.revoked_at && <span> - Revoked on {formatDate(g.revoked_at)} by {g.revoked_by?.full_name ?? "Unknown"}</span>}
                {g.consumed_at && <span> - Consumed on {formatDate(g.consumed_at)}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
