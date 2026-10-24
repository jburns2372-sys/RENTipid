"use client";

import { useState } from "react";
import { formatEnumLabel, formatDate } from "@/components/security/approvals/approval-ui";
import { SECURITY_PERMISSIONS } from "@/lib/security/permissions";
import { useRouter } from "next/navigation";
import { createIdempotencyKey } from "@/components/security/cases/incident-case-ui";
import { SecurityExecutionStatus } from "@prisma/client";

export function ResponseDetailClient({
  initialExecution,
  activePermissions,
  isEmergencyFreeze,
}: {
  initialExecution: any;
  activePermissions: readonly string[];
  isEmergencyFreeze: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  
  const canRollback = activePermissions.includes(SECURITY_PERMISSIONS.RESPONSE_ROLLBACK) && 
                      (initialExecution.status === "SUCCEEDED" || initialExecution.status === "FAILED"); // "Eligible reversible execution"

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h1 className="text-2xl font-bold text-white">Execution: {initialExecution.id}</h1>
        <p className="text-gray-400">Incident Case: {initialExecution.incident_case_id}</p>
        <p className="text-gray-400">Grant ID: {initialExecution.approval_grant_id}</p>
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-200 border border-blue-500/30">
            {formatEnumLabel(initialExecution.status)}
          </span>
          {initialExecution.failure_code && (
            <span className="text-red-400 text-sm">Failure: {initialExecution.failure_code}</span>
          )}
        </div>
      </header>

      {isEmergencyFreeze && (
        <div className="rounded-xl border border-red-800 bg-red-950 p-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-red-500 font-bold text-xl">⚠️</span>
            <div>
              <h3 className="font-bold text-red-400">EMERGENCY FREEZE ACTIVE</h3>
              <p className="text-red-300 text-sm">All new security response executions are currently blocked by system policy.</p>
            </div>
          </div>
        </div>
      )}

      <section className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-gray-300 space-y-2 text-sm">
        <p><strong className="text-white">Response Type:</strong> {initialExecution.response_type}</p>
        <p><strong className="text-white">Target:</strong> {initialExecution.target_type} ({initialExecution.target_id})</p>
        <p><strong className="text-white">Playbook:</strong> {initialExecution.playbook_id} (v{initialExecution.playbook_version})</p>
        <p><strong className="text-white">Started At:</strong> {formatDate(initialExecution.started_at)}</p>
        <p><strong className="text-white">Completed At:</strong> {initialExecution.completed_at ? formatDate(initialExecution.completed_at) : 'N/A'}</p>
      </section>

      <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Action History</h2>
          {canRollback && (
            <button 
              className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              disabled={pending}
              onClick={async () => {
                 if (confirm("Are you sure you want to rollback this execution? This action will attempt to reverse all completed actions.")) {
                   setPending(true);
                   try {
                     const res = await fetch(`/api/soc/responses/${initialExecution.id}/rollback`, {
                       method: "POST",
                       headers: { "Content-Type": "application/json" }
                     });
                     const data = await res.json();
                     if (res.ok) {
                       router.refresh();
                     } else {
                       alert(data.error || "Rollback failed");
                     }
                   } finally {
                     setPending(false);
                   }
                 }
              }}
            >
              Rollback Execution
            </button>
          )}
        </div>
        {initialExecution.actions.length === 0 ? (
          <p className="text-gray-400">No actions recorded.</p>
        ) : (
          <ul className="space-y-2">
            {initialExecution.actions.map((a: any, i: number) => (
              <li key={i} className="text-sm text-gray-300 border border-gray-800 p-3 rounded">
                <p>Sequence {a.sequence}: <strong className="text-white">{a.action_type}</strong> on {a.target_reference}</p>
                <p>Status: {formatEnumLabel(a.status)} (Executed: {formatDate(a.executed_at)})</p>
                {a.rolled_back_at && <p className="text-yellow-400">Rolled back at: {formatDate(a.rolled_back_at)}</p>}
                {a.failure_metadata && <p className="text-red-400">Failure metadata: {a.failure_metadata}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
