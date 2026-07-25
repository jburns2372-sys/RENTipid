/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { SocCommandCenterHeader } from "./SocCommandCenterHeader";
import { SocKpiStrip } from "./SocKpiStrip";
import { SocThreatMap } from "./SocThreatMap";
import { SocEventDetailsPanel } from "./SocEventDetailsPanel";
import { SocLiveEventFeed } from "./SocLiveEventFeed";
import { SocApprovedResponsesPanel } from "./SocApprovedResponsesPanel";
import { SocSimulationTray } from "./SocSimulationTray";

export function SocCommandCenterClient() {
  const [includeSimulations, setIncludeSimulations] = useState(false);
  const [environment, setEnvironment] = useState<string>("");
  const [lifecycle, setLifecycle] = useState<string>("");
  const [isPaused, setIsPaused] = useState(false);
  
  const [summaryData, setSummaryData] = useState<any>(null);
  const [feedData, setFeedData] = useState<any[]>([]);
  const [responsesData, setResponsesData] = useState<any[]>([]);
  
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventDetails, setEventDetails] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      if (isPaused) return;

      const params = new URLSearchParams();
      if (environment) params.append("environment", environment);
      if (lifecycle) params.append("lifecycle", lifecycle);
      if (includeSimulations) params.append("includeSimulations", "true");

      const [summaryRes, feedRes, responsesRes] = await Promise.all([
        fetch(`/api/soc/dashboard?action=summary&${params.toString()}`),
        fetch(`/api/soc/dashboard?action=feed&limit=50&${params.toString()}`),
        fetch(`/api/soc/dashboard?action=responses&limit=20&${params.toString()}`)
      ]);

      if (!summaryRes.ok) throw new Error("Failed to load summary");
      
      const summary = await summaryRes.json();
      const feed = await feedRes.json();
      const responses = await responsesRes.json();

      setSummaryData(summary);
      setFeedData(feed.events || []);
      setResponsesData(responses.responses || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || "An error occurred fetching dashboard data.");
    } finally {
      setIsLoading(false);
    }
  }, [environment, lifecycle, includeSimulations, isPaused]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 45000); // 45s refresh
    
    // Pause refresh when tab is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
      } else {
        setIsPaused(false);
        fetchDashboardData();
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchDashboardData]);

  // Fetch event details when selected
  useEffect(() => {
    if (!selectedEventId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEventDetails(null);
      return;
    }
    const fetchDetails = async () => {
      try {
        const found = feedData.find(e => e.id === selectedEventId);
        if (found) {
          setEventDetails(found);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchDetails();
  }, [selectedEventId, feedData]);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 min-h-screen text-slate-200">
      <SocCommandCenterHeader 
        includeSimulations={includeSimulations}
        onSimulationsChange={setIncludeSimulations}
        environment={environment}
        onEnvironmentChange={setEnvironment}
        lifecycle={lifecycle}
        onLifecycleChange={setLifecycle}
        isPaused={isPaused}
        onPauseChange={setIsPaused}
        onManualRefresh={fetchDashboardData}
        lastRefreshed={summaryData?.lastRefreshed}
        emergencyFreezeActive={summaryData?.emergencyFreezeActive || false}
      />

      {error && (
        <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center gap-3">
          <span className="font-semibold">Error Loading Dashboard:</span>
          {error}
        </div>
      )}

      <SocKpiStrip kpis={summaryData?.kpis} isLoading={isLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
            <SocThreatMap 
                events={feedData} 
                onSelectEvent={setSelectedEventId} 
                selectedEventId={selectedEventId}
            />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-6">
            <SocEventDetailsPanel 
                event={eventDetails} 
                onClose={() => setSelectedEventId(null)}
            />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SocLiveEventFeed 
            events={feedData} 
            isLoading={isLoading} 
            selectedEventId={selectedEventId}
            onSelectEvent={setSelectedEventId} 
        />
        <SocApprovedResponsesPanel 
            responses={responsesData} 
            isLoading={isLoading} 
        />
      </div>

      {includeSimulations && (
        <SocSimulationTray />
      )}
    </div>
  );
}
