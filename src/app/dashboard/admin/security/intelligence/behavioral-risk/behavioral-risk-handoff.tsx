"use client";

import React, { useState, useCallback } from "react";
import { AssessmentDto, InvestigationContext } from "./behavioral-risk-investigation-client";

interface HandoffProps {
  context: InvestigationContext;
  assessment: AssessmentDto;
}

export function BehavioralRiskHandoff({ context, assessment }: HandoffProps) {
  const [copyStatus, setCopyStatus] = useState<string>("");

  const getDeepLink = useCallback(() => {
    const url = new URL(window.location.origin + window.location.pathname);
    if (context.subjectRef) url.searchParams.set("subjectRef", context.subjectRef);
    if (context.environment) url.searchParams.set("environment", context.environment);
    if (context.lifecycle) url.searchParams.set("lifecycle", context.lifecycle);
    if (context.limit) url.searchParams.set("limit", context.limit.toString());
    if (context.assessmentId) url.searchParams.set("assessmentId", context.assessmentId);
    return url.toString();
  }, [context]);

  const handleCopyLink = useCallback(async () => {
    try {
      const link = getDeepLink();
      await navigator.clipboard.writeText(link);
      setCopyStatus("Link copied");
      setTimeout(() => setCopyStatus(""), 3000);
    } catch {
      setCopyStatus("Copy unavailable");
      setTimeout(() => setCopyStatus(""), 3000);
    }
  }, [getDeepLink]);

  const handleCopySummary = useCallback(async () => {
    try {
      const link = getDeepLink();
      const signals = assessment.contributingSignals?.map(s =>
        `- ${s.title || s.signalCode} (${s.signalCode}): ${s.explanation}`
      ).join("\n") || "None";

      const generatedStr = assessment.generatedAt ? new Date(assessment.generatedAt).toLocaleString() : 'N/A';
      const windowStartStr = assessment.windowStart ? new Date(assessment.windowStart).toLocaleString() : 'N/A';
      const windowEndStr = assessment.windowEnd ? new Date(assessment.windowEnd).toLocaleString() : 'N/A';

      const summary = `RENTipid Behavioral Risk Investigation Handoff

Statements:
- Advisory only
- Human review required
- No automated enforcement was executed

Context:
Subject Reference: ${context.subjectRef || 'N/A'}
Environment: ${context.environment || 'N/A'}
Lifecycle: ${context.lifecycle || 'N/A'}
Assessment ID: ${assessment.id || 'N/A'}
Deep-link URL: ${link}

Assessment Details:
Generated: ${generatedStr}
Score: ${assessment.score}
Risk Band: ${assessment.riskBand}
Confidence: ${assessment.confidence}
Policy Version: ${assessment.policyVersion}
Evaluation Window: ${windowStartStr} to ${windowEndStr}
Advisory Only: ${assessment.advisoryOnly ? "Yes" : "No"}

Signals:
${signals}
`;
      await navigator.clipboard.writeText(summary);
      setCopyStatus("Summary copied");
      setTimeout(() => setCopyStatus(""), 3000);
    } catch {
      setCopyStatus("Copy unavailable");
      setTimeout(() => setCopyStatus(""), 3000);
    }
  }, [assessment, context, getDeepLink]);

  const isContextValid = !!(context.subjectRef && context.environment && context.lifecycle);

  return (
    <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">Analyst Handoff</h3>
      <div className="flex items-center space-x-3">
        <button
          onClick={handleCopySummary}
          disabled={!isContextValid || !assessment.id}
          className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          Copy Investigation Summary
        </button>
        <button
          onClick={handleCopyLink}
          disabled={!isContextValid}
          className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          Copy Investigation Link
        </button>
        <div aria-live="polite" className="text-sm text-green-600 font-medium h-5">
          {copyStatus}
        </div>
      </div>
    </div>
  );
}
