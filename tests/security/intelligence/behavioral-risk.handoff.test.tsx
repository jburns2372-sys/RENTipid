/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { BehavioralRiskHandoff } from "../../../src/app/dashboard/admin/security/intelligence/behavioral-risk/behavioral-risk-handoff";
import { AssessmentDto, InvestigationContext } from "../../../src/app/dashboard/admin/security/intelligence/behavioral-risk/behavioral-risk-investigation-client";

describe("Behavioral Risk Investigation - Analyst Handoff", () => {
  let writeTextMock: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    writeTextMock = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock
      }
    });
    if (!global.fetch) {
      Object.assign(global, { fetch: jest.fn() });
    }
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  const validContext: InvestigationContext = {
    subjectRef: "u123",
    environment: "PRODUCTION",
    lifecycle: "LIVE",
    limit: 15,
    assessmentId: "a123"
  };

  const validAssessment: AssessmentDto = {
    id: "a123",
    subjectRef: "u123",
    score: 85.5,
    riskBand: "HIGH",
    confidence: "HIGH",
    policyVersion: "1.0",
    windowStart: "2026-07-01T00:00:00.000Z",
    windowEnd: "2026-07-26T00:00:00.000Z",
    generatedAt: "2026-07-26T12:00:00.000Z",
    contributingSignals: [
      {
        signalCode: "SIG_001",
        title: "Test Signal",
        explanation: "Test explanation",
        rawWeight: 10,
        effectiveWeight: 10,
        confidence: "HIGH",
        firstObservedAt: "2026-07-01T00:00:00.000Z",
        lastObservedAt: "2026-07-26T00:00:00.000Z",
        evidenceEventIds: [],
        contributingEventTypes: [],
        sourceCount: 1
      }
    ],
    evidenceEventIds: [],
    sourceDiversity: 1,
    advisoryOnly: true
  };

  it("1, 2, 20: Handoff renders for valid assessment, unavailable without it, absent state handled", () => {
    const { rerender } = render(<BehavioralRiskHandoff context={validContext} assessment={validAssessment} />);
    expect(screen.getByText("Analyst Handoff")).not.toBeNull();
    
    // Copy buttons are enabled
    expect((screen.getByRole("button", { name: /Copy Investigation Summary/i }) as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByRole("button", { name: /Copy Investigation Link/i }) as HTMLButtonElement).disabled).toBe(false);

    // Rerender with missing assessment ID
    rerender(<BehavioralRiskHandoff context={validContext} assessment={{ ...validAssessment, id: undefined }} />);
    expect((screen.getByRole("button", { name: /Copy Investigation Summary/i }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("3, 4, 5, 6, 7, 8, 12: Copy Summary includes correct heading, statements, fields, and requires user action", async () => {
    render(<BehavioralRiskHandoff context={validContext} assessment={validAssessment} />);
    const btn = screen.getByRole("button", { name: /Copy Investigation Summary/i });
    
    expect(writeTextMock).not.toHaveBeenCalled(); // User action required
    fireEvent.click(btn);
    
    expect(writeTextMock).toHaveBeenCalledTimes(1);
    const summaryText = writeTextMock.mock.calls[0][0];

    // Check headings and statements
    expect(summaryText).toContain("RENTipid Behavioral Risk Investigation Handoff");
    expect(summaryText).toContain("- Advisory only");
    expect(summaryText).toContain("- Human review required");
    expect(summaryText).toContain("- No automated enforcement was executed");

    // Check permitted fields
    expect(summaryText).toContain("Subject Reference: u123");
    expect(summaryText).toContain("Environment: PRODUCTION");
    expect(summaryText).toContain("Lifecycle: LIVE");
    expect(summaryText).toContain("Assessment ID: a123");
    expect(summaryText).toContain("Score: 85.5");
    expect(summaryText).toContain("Risk Band: HIGH");
    expect(summaryText).toContain("Confidence: HIGH");
    
    // Check signals
    expect(summaryText).toContain("- Test Signal (SIG_001): Test explanation");
  });

  it("9, 10, 11: Summary excludes raw metadata, credentials, tokens, profiles, payments", async () => {
    render(<BehavioralRiskHandoff context={validContext} assessment={validAssessment} />);
    fireEvent.click(screen.getByRole("button", { name: /Copy Investigation Summary/i }));
    
    const summaryText = writeTextMock.mock.calls[0][0];
    
    // Exclusions
    expect(summaryText).not.toContain("rawEventMetadata");
    expect(summaryText).not.toContain("password");
    expect(summaryText).not.toContain("token");
    expect(summaryText).not.toContain("payment");
    expect(summaryText).not.toContain("profile");
  });

  it("13, 14, 15: Copy Link contains 5 parameters and excludes sensitive data, requires user action", () => {
    render(<BehavioralRiskHandoff context={validContext} assessment={validAssessment} />);
    const btn = screen.getByRole("button", { name: /Copy Investigation Link/i });
    
    expect(writeTextMock).not.toHaveBeenCalled(); // User action required
    fireEvent.click(btn);
    
    expect(writeTextMock).toHaveBeenCalledTimes(1);
    const linkUrl = writeTextMock.mock.calls[0][0];
    
    // Accepted params
    expect(linkUrl).toContain("subjectRef=u123");
    expect(linkUrl).toContain("environment=PRODUCTION");
    expect(linkUrl).toContain("lifecycle=LIVE");
    expect(linkUrl).toContain("limit=15");
    expect(linkUrl).toContain("assessmentId=a123");

    // Excluded fields
    expect(linkUrl).not.toContain("score=");
    expect(linkUrl).not.toContain("SIG_001");
    expect(linkUrl).not.toContain("evidence");
    expect(linkUrl).not.toContain("metadata");
    expect(linkUrl).not.toContain("actor");
    expect(linkUrl).not.toContain("token");
  });

  it("16: Clipboard success is announced", async () => {
    render(<BehavioralRiskHandoff context={validContext} assessment={validAssessment} />);
    fireEvent.click(screen.getByRole("button", { name: /Copy Investigation Link/i }));
    
    await waitFor(() => {
      expect(screen.getByText("Link copied")).not.toBeNull();
    });
  });

  it("17: Clipboard failure is sanitized", async () => {
    writeTextMock.mockRejectedValueOnce(new Error("Browser clipboard denied"));
    render(<BehavioralRiskHandoff context={validContext} assessment={validAssessment} />);
    
    fireEvent.click(screen.getByRole("button", { name: /Copy Investigation Summary/i }));
    
    await waitFor(() => {
      expect(screen.getByText("Copy unavailable")).not.toBeNull();
      expect(screen.queryByText("Browser clipboard denied")).toBeNull();
    });
  });

  it("18, 19: No network request occurs, no persistence", async () => {
    const fetchSpy = jest.spyOn(global, "fetch");
    
    render(<BehavioralRiskHandoff context={validContext} assessment={validAssessment} />);
    fireEvent.click(screen.getByRole("button", { name: /Copy Investigation Summary/i }));
    fireEvent.click(screen.getByRole("button", { name: /Copy Investigation Link/i }));
    
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
