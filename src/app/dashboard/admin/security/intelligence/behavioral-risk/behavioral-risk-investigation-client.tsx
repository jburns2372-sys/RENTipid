"use client";

import React, { useState, useRef, useCallback } from "react";

// DTOs for client to avoid importing Prisma types
interface SignalDto {
  signalCode: string;
  title: string;
  explanation: string;
  rawWeight: number;
  effectiveWeight: number;
  confidence: string;
  firstObservedAt: string;
  lastObservedAt: string;
  evidenceEventIds: string[];
  contributingEventTypes: string[];
  sourceCount: number;
}

interface AssessmentDto {
  id?: string;
  subjectRef: string;
  score: number;
  riskBand: string;
  confidence: string;
  policyVersion: string;
  windowStart: string;
  windowEnd: string;
  generatedAt: string;
  contributingSignals: SignalDto[];
  evidenceEventIds: string[];
  sourceDiversity: number;
  advisoryOnly: boolean;
}

const VALID_ENVIRONMENTS = ["DEVELOPMENT", "TEST", "UAT", "STAGING", "PRODUCTION"];
const VALID_LIFECYCLES = ["LIVE", "TEST", "SIMULATION"];

export function BehavioralRiskInvestigationClient() {
  const [subjectRef, setSubjectRef] = useState("");
  const [environment, setEnvironment] = useState("PRODUCTION");
  const [lifecycle, setLifecycle] = useState("LIVE");
  const [limit, setLimit] = useState<number>(10);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [latestAssessment, setLatestAssessment] = useState<AssessmentDto | null>(null);
  const [history, setHistory] = useState<AssessmentDto[]>([]);

  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [selectedAssessmentDetails, setSelectedAssessmentDetails] = useState<AssessmentDto | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  // Abort controller to prevent stale responses overwriting newer searches
  const searchAbortController = useRef<AbortController | null>(null);
  const detailsAbortController = useRef<AbortController | null>(null);

  const handleClear = useCallback(() => {
    setLatestAssessment(null);
    setHistory([]);
    setSelectedAssessmentId(null);
    setSelectedAssessmentDetails(null);
    setError(null);
  }, []);

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedSubject = subjectRef.trim();
    if (!trimmedSubject) {
      setError("Subject reference is required");
      return;
    }

    // Bounds check limit
    const safeLimit = Math.min(Math.max(1, limit), 50);
    setLimit(safeLimit);

    if (searchAbortController.current) {
      searchAbortController.current.abort();
    }
    searchAbortController.current = new AbortController();

    setIsLoading(true);
    setError(null);
    handleClear(); // Clear existing results

    try {
      const params = new URLSearchParams({
        subjectRef: trimmedSubject,
        environment,
        lifecycle,
        limit: safeLimit.toString()
      });

      const [latestRes, historyRes] = await Promise.all([
        fetch(`/api/soc/intelligence/behavioral-risk/latest?${params.toString()}`, { signal: searchAbortController.current.signal }),
        fetch(`/api/soc/intelligence/behavioral-risk/history?${params.toString()}`, { signal: searchAbortController.current.signal })
      ]);

      if (latestRes.status === 401 || historyRes.status === 401) throw new Error("UNAUTHORIZED");
      if (latestRes.status === 403 || historyRes.status === 403) throw new Error("FORBIDDEN");

      // Allow 404 for latest to mean "no data found"
      if (!latestRes.ok && latestRes.status !== 404) throw new Error("INTERNAL_SERVER_ERROR");
      if (!historyRes.ok && historyRes.status !== 404) throw new Error("INTERNAL_SERVER_ERROR");

      if (latestRes.status === 200) {
        const latestData = await latestRes.json();
        setLatestAssessment(latestData);
      }

      if (historyRes.status === 200) {
        const historyData = await historyRes.json();
        setHistory(historyData.history || []);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      if (err instanceof Error) {
        if (err.message === "UNAUTHORIZED") setError("Unauthorized: Please log in again.");
        else if (err.message === "FORBIDDEN") setError("Forbidden: You do not have permission to view behavioral risk data.");
        else setError("An internal server error occurred while fetching data.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [subjectRef, environment, lifecycle, limit, handleClear]);

  const fetchDetails = useCallback(async (assessmentId: string) => {
    setSelectedAssessmentId(assessmentId);
    if (!assessmentId) {
      setSelectedAssessmentDetails(null);
      return;
    }

    if (detailsAbortController.current) {
      detailsAbortController.current.abort();
    }
    detailsAbortController.current = new AbortController();

    setIsDetailsLoading(true);
    try {
      const params = new URLSearchParams({ environment, lifecycle });
      const res = await fetch(`/api/soc/intelligence/behavioral-risk/${assessmentId}?${params.toString()}`, {
        signal: detailsAbortController.current.signal
      });

      if (res.status === 401) throw new Error("UNAUTHORIZED");
      if (res.status === 403) throw new Error("FORBIDDEN");
      if (res.status === 404) throw new Error("NOT_FOUND");
      if (!res.ok) throw new Error("INTERNAL_SERVER_ERROR");

      const data = await res.json();
      setSelectedAssessmentDetails(data);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      // Fail silently for details
      console.error(err);
      setSelectedAssessmentDetails(null);
    } finally {
      setIsDetailsLoading(false);
    }
  }, [environment, lifecycle]);

  return (
    <div className="space-y-6">
      {/* A. Page heading */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Behavioral Risk Investigation</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review advisory and explainable behavioral risk assessments.
          No automated enforcement occurs based on this data.
        </p>
      </header>

      {/* F. Safety banner */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4" role="alert">
        <div className="flex">
          <div className="ml-3">
            <h2 className="text-sm font-medium text-yellow-800">Advisory Only</h2>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                This information requires human review. No account, payment, KYC, listing, booking,
                permission, or response action is executed from this page.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* B. Search panel */}
      <form onSubmit={handleSearch} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label htmlFor="subjectRef" className="block text-sm font-medium text-gray-700 mb-1">Subject Reference</label>
            <input
              id="subjectRef"
              type="text"
              required
              value={subjectRef}
              onChange={e => setSubjectRef(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border px-3 py-2"
              placeholder="User ID, IP, etc."
            />
          </div>
          <div>
            <label htmlFor="environment" className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
            <select
              id="environment"
              value={environment}
              onChange={e => setEnvironment(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border px-3 py-2"
            >
              {VALID_ENVIRONMENTS.map(env => <option key={env} value={env}>{env}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="lifecycle" className="block text-sm font-medium text-gray-700 mb-1">Lifecycle</label>
            <select
              id="lifecycle"
              value={lifecycle}
              onChange={e => setLifecycle(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border px-3 py-2"
            >
              {VALID_LIFECYCLES.map(lc => <option key={lc} value={lc}>{lc}</option>)}
            </select>
          </div>
          <div className="flex space-x-2">
            <div className="flex-1">
              <label htmlFor="limit" className="block text-sm font-medium text-gray-700 mb-1">Limit (max 50)</label>
              <input
                id="limit"
                type="number"
                min={1}
                max={50}
                value={limit}
                onChange={e => setLimit(parseInt(e.target.value) || 10)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border px-3 py-2"
              />
            </div>
            <div className="flex items-end space-x-2 pb-1">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isLoading ? "Searching..." : "Search"}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded shadow hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </form>

      <div aria-live="polite">
        {isLoading && <p className="text-gray-500 italic">Loading assessment data...</p>}
      </div>

      {error && (
        <div role="alert" className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && !latestAssessment && history.length === 0 && (
        <div className="bg-gray-50 text-center py-12 rounded-lg border border-gray-200 text-gray-500">
          Enter a subject reference to begin behavioral risk investigation.
        </div>
      )}

      {!isLoading && latestAssessment && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            {/* C. Latest-assessment summary */}
            <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Latest Assessment Summary</h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Subject Reference</dt>
                  <dd className="mt-1 text-sm text-gray-900 break-all">{latestAssessment.subjectRef}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Score</dt>
                  <dd className="mt-1 text-sm text-gray-900">{latestAssessment.score?.toFixed(1)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Risk Band</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-semibold">{latestAssessment.riskBand}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Confidence</dt>
                  <dd className="mt-1 text-sm text-gray-900">{latestAssessment.confidence}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Generated At</dt>
                  <dd className="mt-1 text-sm text-gray-900">{latestAssessment.generatedAt ? new Date(latestAssessment.generatedAt).toLocaleString() : ""}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Policy Version</dt>
                  <dd className="mt-1 text-sm text-gray-900">{latestAssessment.policyVersion}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Evaluation Window</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {latestAssessment.windowStart ? new Date(latestAssessment.windowStart).toLocaleString() : ""} - {latestAssessment.windowEnd ? new Date(latestAssessment.windowEnd).toLocaleString() : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Source Diversity</dt>
                  <dd className="mt-1 text-sm text-gray-900">{latestAssessment.sourceDiversity?.toFixed(1)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Advisory Only</dt>
                  <dd className="mt-1 text-sm text-gray-900">{latestAssessment.advisoryOnly ? "Yes" : "No"}</dd>
                </div>
              </dl>
            </section>

            {/* D. Assessment-history table */}
            <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Assessment History</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Generated</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Score / Band</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                      <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {history.map(item => (
                      <tr key={item.id} className={selectedAssessmentId === item.id ? "bg-blue-50" : ""}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {item.generatedAt ? new Date(item.generatedAt).toLocaleString() : ""}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {item.score?.toFixed(1)} - {item.riskBand}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {item.confidence}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => item.id && fetchDetails(item.id)}
                            className="text-blue-600 hover:text-blue-900 focus:outline-none focus:underline"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <div>
            {/* E. Explainable signal details */}
            <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Explainable Signal Details</h2>
              <div aria-live="polite">
                {isDetailsLoading && <p className="text-gray-500 italic">Loading details...</p>}
              </div>
              {!isDetailsLoading && !selectedAssessmentDetails && (
                <div className="text-gray-500 text-sm text-center mt-10">
                  Select an assessment from history to view signals.
                </div>
              )}
              {!isDetailsLoading && selectedAssessmentDetails && (
                <div className="space-y-6">
                  {selectedAssessmentDetails.contributingSignals && selectedAssessmentDetails.contributingSignals.length > 0 ? (
                    selectedAssessmentDetails.contributingSignals.map((sig, idx) => (
                      <div key={idx} className="border border-gray-200 rounded p-4">
                        <h3 className="font-semibold text-gray-800">{sig.title || sig.signalCode}</h3>
                        <p className="text-sm text-gray-600 mb-2">{sig.explanation}</p>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 mb-2 bg-gray-50 p-2 rounded">
                          <div><span className="font-medium text-gray-500">Code:</span> {sig.signalCode}</div>
                          <div><span className="font-medium text-gray-500">Confidence:</span> {sig.confidence}</div>
                          <div><span className="font-medium text-gray-500">Raw Wt:</span> {sig.rawWeight}</div>
                          <div><span className="font-medium text-gray-500">Eff. Wt:</span> {sig.effectiveWeight}</div>
                          <div><span className="font-medium text-gray-500">First:</span> {sig.firstObservedAt ? new Date(sig.firstObservedAt).toLocaleString() : ""}</div>
                          <div><span className="font-medium text-gray-500">Last:</span> {sig.lastObservedAt ? new Date(sig.lastObservedAt).toLocaleString() : ""}</div>
                          <div><span className="font-medium text-gray-500">Sources:</span> {sig.sourceCount}</div>
                        </div>
                        <div className="mb-2">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Event Types</span>
                          <div className="flex flex-wrap gap-1">
                            {(sig.contributingEventTypes || []).map(t => (
                              <span key={t} className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs">{t}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Evidence IDs</span>
                          <ul className="list-disc pl-5 text-xs text-gray-600 break-all space-y-1">
                            {(sig.evidenceEventIds || []).map(eid => (
                              <li key={eid}>{eid}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 text-sm">No contributing signals found.</div>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
