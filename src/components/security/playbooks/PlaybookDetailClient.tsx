"use client";

import { useState } from "react";
import { formatEnumLabel, formatDate, safeErrorMessage } from "./playbook-ui";
import { PlaybookDetail } from "@/lib/security/playbooks/playbook-read.service";
import { SECURITY_PERMISSIONS } from "@/lib/security/permissions";
import { useRouter } from "next/navigation";

const actionClassName = "inline-flex items-center justify-center rounded-lg border border-blue-500 bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus:outline-none disabled:opacity-50";

export function PlaybookDetailClient({
  initialPlaybook,
  activePermissions
}: {
  initialPlaybook: PlaybookDetail;
  activePermissions: readonly string[];
}) {
  const router = useRouter();
  const [playbook, setPlaybook] = useState<PlaybookDetail>(initialPlaybook);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  const canEdit = activePermissions.includes(SECURITY_PERMISSIONS.PLAYBOOK_EDIT) && playbook.status === "DRAFT";
  const canActivate = activePermissions.includes(SECURITY_PERMISSIONS.PLAYBOOK_ACTIVATE) && playbook.status === "APPROVED";
  const canSubmit = activePermissions.includes(SECURITY_PERMISSIONS.PLAYBOOK_SUBMIT_REVIEW) && playbook.status === "DRAFT";
  const canVersion = activePermissions.includes(SECURITY_PERMISSIONS.PLAYBOOK_VERSION_CREATE);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function apiAction(endpoint: string, body: any) {
    setFeedback(null);
    try {
      const response = await fetch(`/api/soc/playbooks/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) {
        setFeedback({ type: "error", message: safeErrorMessage(response.status, data) });
        return false;
      }
      setFeedback({ type: "success", message: "Success" });
      router.refresh();
      return true;
    } catch {
      setFeedback({ type: "error", message: "Network error." });
      return false;
    }
  }

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h1 className="text-2xl font-bold text-white">{playbook.name} (v{playbook.version})</h1>
        <p className="text-gray-400">{playbook.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-200 border border-blue-500/30">
            {formatEnumLabel(playbook.status)}
          </span>
          {canSubmit && (
            <button className={actionClassName} onClick={() => apiAction("review-submit", { playbook_id: playbook.playbook_id, expected_lock_version: playbook.lock_version })}>
              Submit for Review
            </button>
          )}
          {canActivate && (
            <button className={actionClassName} onClick={() => apiAction("activate", { playbook_id: playbook.playbook_id, expected_lock_version: playbook.lock_version })}>
              Activate
            </button>
          )}
          {canVersion && playbook.status === "ACTIVE" && (
            <button className={actionClassName} onClick={() => apiAction("version-create", { playbook_id: playbook.playbook_id, expected_lock_version: playbook.lock_version })}>
              Create New Version
            </button>
          )}
        </div>
      </header>

      {feedback && (
        <div className={`p-4 rounded border text-sm ${feedback.type === 'error' ? 'bg-red-900/50 border-red-500 text-red-200' : 'bg-green-900/50 border-green-500 text-green-200'}`}>
          {feedback.message}
        </div>
      )}

      <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-xl font-bold text-white mb-4">Steps</h2>
        {playbook.steps.length === 0 ? (
          <p className="text-gray-400">No steps defined.</p>
        ) : (
          <ul className="space-y-3">
            {playbook.steps.map(step => (
              <li key={step.id} className="p-4 border border-gray-800 rounded bg-gray-950 flex justify-between">
                <div>
                  <div className="font-semibold text-gray-200">{step.step_order}. {formatEnumLabel(step.action_type)}</div>
                  <div className="text-sm text-gray-400">{step.human_instruction}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-xl font-bold text-white mb-4">Version History</h2>
        <ul className="space-y-2">
          {playbook.history.map(hist => (
            <li key={hist.id} className="text-sm text-gray-400">
              v{hist.version} - {formatEnumLabel(hist.status)} ({formatDate(hist.created_at)})
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
