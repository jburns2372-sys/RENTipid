/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import BehavioralRiskInvestigationPage from "@/app/dashboard/admin/security/intelligence/behavioral-risk/page";
import { BehavioralRiskInvestigationClient } from "@/app/dashboard/admin/security/intelligence/behavioral-risk/behavioral-risk-investigation-client";
import { requireSecurityPermission } from "@/lib/security/authorization";
import { SECURITY_PERMISSIONS } from "@/lib/security/permissions";

// Mock authorization
jest.mock("@/lib/security/authorization", () => ({
  requireSecurityPermission: jest.fn()
}));

// Mock global fetch
const originalFetch = global.fetch;

describe("Behavioral Risk Investigation Dashboard (Slice 4)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  const mockValidAssessment = {
    id: "assess-1",
    subjectRef: "user-123",
    score: 85.5,
    riskBand: "HIGH",
    confidence: "HIGH",
    policyVersion: "1.0",
    windowStart: "2026-07-26T00:00:00Z",
    windowEnd: "2026-07-26T12:00:00Z",
    generatedAt: "2026-07-26T12:01:00Z",
    sourceDiversity: 2.5,
    advisoryOnly: true,
    contributingSignals: [
      {
        signalCode: "AUTH_REPEATED_DENIAL",
        title: "Repeated Auth Denials",
        explanation: "Multiple failed auth",
        rawWeight: 5,
        effectiveWeight: 5,
        confidence: "HIGH",
        firstObservedAt: "2026-07-26T10:00:00Z",
        lastObservedAt: "2026-07-26T11:00:00Z",
        sourceCount: 1,
        contributingEventTypes: ["auth.failed"],
        evidenceEventIds: ["ev-1", "ev-2"]
      }
    ],
    evidenceEventIds: ["ev-1", "ev-2"]
  };

  describe("Server Page Constraints", () => {
    it("1. Unauthorized page access is blocked", async () => {
      (requireSecurityPermission as jest.Mock).mockRejectedValueOnce(new Error("Unauthorized"));
      await expect(BehavioralRiskInvestigationPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("Unauthorized");
      expect(requireSecurityPermission).toHaveBeenCalledWith(SECURITY_PERMISSIONS.DASHBOARD_VIEW);
    });

    it("2. Authorized page renders the investigation client", async () => {
      (requireSecurityPermission as jest.Mock).mockResolvedValueOnce({ activePermissions: [SECURITY_PERMISSIONS.DASHBOARD_VIEW] });
      const jsx = await BehavioralRiskInvestigationPage({ searchParams: Promise.resolve({}) });
      expect(jsx.type).toBe("div");
    });
  });

  describe("Client Interactions and Validation", () => {
    it("3. No request occurs on initial render", () => {
      render(<BehavioralRiskInvestigationClient />);
      expect(global.fetch).not.toHaveBeenCalled();
      expect(screen.getByText(/Advisory Only/i)).toBeTruthy();
    });

    it("4. Required-field validation prevents an invalid request", async () => {
      render(<BehavioralRiskInvestigationClient />);
      const searchButton = screen.getByRole("button", { name: /search/i });

      fireEvent.submit(searchButton.closest("form")!);
      expect(global.fetch).not.toHaveBeenCalled();
      expect(screen.getByText(/Subject reference is required/i)).toBeTruthy();
    });

    it("5. Subject reference is trimmed, 6. Environment/lifecycle passed exactly, 7. Limit cannot exceed 50, 8. Search requests latest and history only", async () => {
      render(<BehavioralRiskInvestigationClient />);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({})
      });

      const subjectInput = screen.getByLabelText(/Subject Reference/i);
      const limitInput = screen.getByLabelText(/Limit/i);
      const searchBtn = screen.getByRole("button", { name: /search/i });

      fireEvent.change(subjectInput, { target: { value: "   user-123   " } });
      fireEvent.change(limitInput, { target: { value: "999" } });
      fireEvent.submit(searchBtn.closest("form")!);

      await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
      const latestCall = (global.fetch as jest.Mock).mock.calls[0][0];
      const historyCall = (global.fetch as jest.Mock).mock.calls[1][0];

      expect(latestCall).toContain("subjectRef=user-123");
      expect(latestCall).toContain("limit=50");
      expect(latestCall).toContain("environment=PRODUCTION");
      expect(latestCall).toContain("lifecycle=LIVE");

      expect(latestCall).toContain("/api/soc/intelligence/behavioral-risk/latest");
      expect(historyCall).toContain("/api/soc/intelligence/behavioral-risk/history");

      expect((global.fetch as jest.Mock).mock.calls[0][1]?.method).toBeUndefined();
    });

    it("9. Loading state is visible", async () => {
      render(<BehavioralRiskInvestigationClient />);

      let resolveLatest: ((value: { ok: boolean; status: number; json: () => Promise<unknown> }) => void) | undefined;
      (global.fetch as jest.Mock).mockReturnValue(new Promise(resolve => {
        resolveLatest = resolve;
      }));

      fireEvent.change(screen.getByLabelText(/Subject Reference/i), { target: { value: "user-123" } });
      fireEvent.submit(screen.getByRole("button", { name: /search/i }).closest("form")!);

      await screen.findByText(/Loading assessment data\.\.\./i);

      if (resolveLatest) {
        resolveLatest({ ok: true, status: 200, json: async () => ({}) });
      }
    });

    it("10. Latest assessment summary renders safely, 11. History renders in API-provided order, 14. Empty state is handled", async () => {
      render(<BehavioralRiskInvestigationClient />);

      (global.fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes("latest")) {
          return Promise.resolve({ ok: true, status: 200, json: async () => mockValidAssessment });
        }
        if (url.includes("history")) {
          return Promise.resolve({ ok: true, status: 200, json: async () => ({ history: [mockValidAssessment] }) });
        }
        return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
      });

      fireEvent.change(screen.getByLabelText(/Subject Reference/i), { target: { value: "user-123" } });
      fireEvent.submit(screen.getByRole("button", { name: /search/i }).closest("form")!);

      await screen.findByText(/Latest Assessment Summary/i);

      expect(screen.getAllByText(/85\.5/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/HIGH/)).toHaveLength(4);
      expect(screen.queryByText(/rawEventMetadata/i)).toBeNull();
      expect(screen.queryByText(/credentials/i)).toBeNull();
    });

    it("12. Details render explainable signals, 13. Evidence IDs render", async () => {
      render(<BehavioralRiskInvestigationClient />);

      (global.fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes("latest")) return Promise.resolve({ ok: true, status: 200, json: async () => mockValidAssessment });
        if (url.includes("history")) return Promise.resolve({ ok: true, status: 200, json: async () => ({ history: [mockValidAssessment] }) });
        if (url.includes("assess-1")) return Promise.resolve({ ok: true, status: 200, json: async () => mockValidAssessment });
        return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
      });

      fireEvent.change(screen.getByLabelText(/Subject Reference/i), { target: { value: "user-123" } });
      fireEvent.submit(screen.getByRole("button", { name: /search/i }).closest("form")!);

      const detailsBtn = await screen.findByRole("button", { name: /Details/i });
      fireEvent.click(detailsBtn);

      await screen.findByText(/Repeated Auth Denials/i);

      expect(screen.getAllByText(/Multiple failed auth/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/ev-1/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/ev-2/).length).toBeGreaterThan(0);
    });

    it("15. Unauthorized handled, 16. Forbidden handled, 17. Not-found handled safely, 18. Generic server error sanitized", async () => {
      render(<BehavioralRiskInvestigationClient />);

      // Test 401
      (global.fetch as jest.Mock).mockResolvedValue({ status: 401 });
      fireEvent.change(screen.getByLabelText(/Subject Reference/i), { target: { value: "u1" } });
      fireEvent.submit(screen.getByRole("button", { name: /search/i }).closest("form")!);
      await screen.findByText(/Unauthorized: Please log in again/i);

      // Test 403
      (global.fetch as jest.Mock).mockResolvedValue({ status: 403 });
      fireEvent.submit(screen.getByRole("button", { name: /search/i }).closest("form")!);
      await screen.findByText(/Forbidden: You do not have permission/i);

      // Test 404
      (global.fetch as jest.Mock).mockResolvedValue({ status: 404, ok: false });
      fireEvent.submit(screen.getByRole("button", { name: /search/i }).closest("form")!);
      await screen.findByText(/assessment/i); // Matches either empty state text

      // Test Generic 500
      (global.fetch as jest.Mock).mockResolvedValue({ status: 500, ok: false });
      fireEvent.submit(screen.getByRole("button", { name: /search/i }).closest("form")!);
      await screen.findByText(/An internal server error occurred/i);
    });

    it("21. Clear control removes the result state", async () => {
      render(<BehavioralRiskInvestigationClient />);

      (global.fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes("latest")) return Promise.resolve({ ok: true, status: 200, json: async () => mockValidAssessment });
        if (url.includes("history")) return Promise.resolve({ ok: true, status: 200, json: async () => ({ history: [mockValidAssessment] }) });
        return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
      });
      fireEvent.change(screen.getByLabelText(/Subject Reference/i), { target: { value: "u1" } });
      fireEvent.submit(screen.getByRole("button", { name: /search/i }).closest("form")!);

      await screen.findByText(/Latest Assessment Summary/i);

      fireEvent.click(screen.getByRole("button", { name: /clear/i }));
      expect(screen.queryByText(/Latest Assessment Summary/i)).toBeNull();
    });

    it("22. Stale request result cannot overwrite a newer search", async () => {
      render(<BehavioralRiskInvestigationClient />);

      let resolveFirst: (() => void) | undefined;
      const firstPromise = new Promise((resolve, reject) => {
        resolveFirst = () => reject(new DOMException("Aborted", "AbortError"));
      });

      let resolveSecond: (() => void) | undefined;
      const secondPromise = new Promise(resolve => {
        resolveSecond = () => resolve({ ok: true, status: 200, json: async () => mockValidAssessment });
      });

      (global.fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes("history")) return Promise.resolve({ ok: true, status: 200, json: async () => ({ history: [] }) });
        return firstPromise;
      });

      fireEvent.change(screen.getByLabelText(/Subject Reference/i), { target: { value: "u1" } });
      fireEvent.submit(screen.getByRole("button", { name: /search/i }).closest("form")!);

      (global.fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes("history")) return Promise.resolve({ ok: true, status: 200, json: async () => ({ history: [] }) });
        return secondPromise;
      });
      fireEvent.submit(screen.getByRole("button", { name: /search/i }).closest("form")!);

      if (resolveFirst) resolveFirst();
      if (resolveSecond) resolveSecond();

      await screen.findByText(/Latest Assessment Summary/i);
      expect(screen.queryByText(/Error/i)).toBeNull();
    });
  });

  describe("Slice 5B: Deep-Linked Investigation Context", () => {
    beforeEach(() => {
      jest.spyOn(window.history, 'replaceState').mockImplementation(() => {});
      delete (window as any).location;
      window.location = new URL('http://localhost/dashboard/admin/security/intelligence/behavioral-risk') as any;
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("S5B.1: Valid initial URL context prefills controls and performs one initial load", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
      
      render(<BehavioralRiskInvestigationClient initialContext={{ subjectRef: "user-123", environment: "TEST", lifecycle: "SIMULATION", limit: 25 }} />);
      
      const subjectInput = screen.getByLabelText(/Subject Reference/i) as HTMLInputElement;
      expect(subjectInput.value).toBe("user-123");
      const envInput = screen.getByLabelText(/Environment/i) as HTMLSelectElement;
      expect(envInput.value).toBe("TEST");
      const lcInput = screen.getByLabelText(/Lifecycle/i) as HTMLSelectElement;
      expect(lcInput.value).toBe("SIMULATION");
      const limitInput = screen.getByLabelText(/Limit/i) as HTMLInputElement;
      expect(limitInput.value).toBe("25");

      await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain("subjectRef=user-123");
      expect(url).toContain("environment=TEST");
      expect(url).toContain("lifecycle=SIMULATION");
      expect(url).toContain("limit=25");
      
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("S5B.2: Incomplete context does not fetch", () => {
      render(<BehavioralRiskInvestigationClient initialContext={{ subjectRef: "user-123" }} />); 
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("S5B.3: Invalid environment/lifecycle is safely ignored and limit bounded on server", async () => {
      (requireSecurityPermission as jest.Mock).mockResolvedValueOnce({ activePermissions: [SECURITY_PERMISSIONS.DASHBOARD_VIEW] });
      const jsx = await BehavioralRiskInvestigationPage({ searchParams: Promise.resolve({ subjectRef: "   user-123   ", environment: "INVALID", lifecycle: "HACK", limit: "999" }) });
      
      const clientProps = jsx.props.children.props.initialContext;
      expect(clientProps.subjectRef).toBe("user-123");
      expect(clientProps.environment).toBeUndefined(); 
      expect(clientProps.lifecycle).toBeUndefined(); 
      expect(clientProps.limit).toBe(50); 
    });

    it("S5B.4: Initial assessmentId loads details", async () => {
      (global.fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes("latest") || url.includes("history")) return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
        if (url.includes("assess-1")) return Promise.resolve({ ok: true, status: 200, json: async () => mockValidAssessment });
        return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
      });

      render(<BehavioralRiskInvestigationClient initialContext={{ subjectRef: "u1", environment: "PRODUCTION", lifecycle: "LIVE", limit: 10, assessmentId: "assess-1" }} />);
      
      await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(3));
      const detailsCall = (global.fetch as jest.Mock).mock.calls.find(c => c[0].includes("assess-1"));
      expect(detailsCall).toBeDefined();
    });

    it("S5B.5: Manual search updates URL with sanitized values, no sensitive response fields", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200, json: async () => mockValidAssessment });
      
      render(<BehavioralRiskInvestigationClient />);
      fireEvent.change(screen.getByLabelText(/Subject Reference/i), { target: { value: "manual-search" } });
      fireEvent.submit(screen.getByRole("button", { name: /search/i }).closest("form")!);
      
      await waitFor(() => expect(window.history.replaceState).toHaveBeenCalled());
      const lastCall = (window.history.replaceState as jest.Mock).mock.calls.slice(-1)[0][2];
      expect(lastCall).toContain("subjectRef=manual-search");
      expect(lastCall).not.toContain("rawEventMetadata"); 
      expect(lastCall).not.toContain("score=");
    });

    it("S5B.6: Assessment selection updates assessmentId", async () => {
      (global.fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes("latest")) return Promise.resolve({ ok: true, status: 200, json: async () => mockValidAssessment });
        if (url.includes("history")) return Promise.resolve({ ok: true, status: 200, json: async () => ({ history: [mockValidAssessment] }) });
        return Promise.resolve({ ok: true, status: 200, json: async () => mockValidAssessment });
      });

      render(<BehavioralRiskInvestigationClient />);
      fireEvent.change(screen.getByLabelText(/Subject Reference/i), { target: { value: "u1" } });
      fireEvent.submit(screen.getByRole("button", { name: /search/i }).closest("form")!);
      
      const detailsBtn = await screen.findByRole("button", { name: /Details/i });
      fireEvent.click(detailsBtn);
      
      await waitFor(() => {
        const lastCall = (window.history.replaceState as jest.Mock).mock.calls.slice(-1)[0][2];
        expect(lastCall).toContain("assessmentId=assess-1");
      });
    });

    it("S5B.7: Clear removes investigation parameters", async () => {
      render(<BehavioralRiskInvestigationClient />);
      fireEvent.click(screen.getByRole("button", { name: /clear/i }));
      
      await waitFor(() => {
        const lastCall = (window.history.replaceState as jest.Mock).mock.calls.slice(-1)[0][2];
        expect(lastCall).not.toContain("subjectRef=");
        expect(lastCall).not.toContain("assessmentId=");
      });
    });

    it("S5B.8: Stale initial response cannot overwrite a newer manual search", async () => {
      let resolveInitial: (() => void) | undefined;
      const initialPromise = new Promise((resolve, reject) => {
        resolveInitial = () => reject(new DOMException("Aborted", "AbortError"));
      });
      let resolveManual: (() => void) | undefined;
      const manualPromise = new Promise(resolve => {
        resolveManual = () => resolve({ ok: true, status: 200, json: async () => mockValidAssessment });
      });

      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation((url) => {
        callCount++;
        if (callCount <= 2) return initialPromise; 
        if (url.includes("history")) return Promise.resolve({ ok: true, status: 200, json: async () => ({ history: [] }) });
        return manualPromise;
      });

      render(<BehavioralRiskInvestigationClient initialContext={{ subjectRef: "slow-initial", environment: "PRODUCTION", lifecycle: "LIVE" }} />);
      
      fireEvent.change(screen.getByLabelText(/Subject Reference/i), { target: { value: "fast-manual" } });
      fireEvent.submit(screen.getByRole("button", { name: /search/i }).closest("form")!);
      
      if (resolveInitial) resolveInitial();
      if (resolveManual) resolveManual();
      
      await screen.findByText(/Latest Assessment Summary/i);
      expect(screen.queryByText(/Error/i)).toBeNull();
    });

    it("S5B.9: Server page enforces authorization independently of initial context", async () => {
      (requireSecurityPermission as jest.Mock).mockRejectedValueOnce(new Error("Unauthorized"));
      await expect(BehavioralRiskInvestigationPage({ searchParams: Promise.resolve({ subjectRef: "u1" }) })).rejects.toThrow("Unauthorized");
      expect(requireSecurityPermission).toHaveBeenCalledWith(SECURITY_PERMISSIONS.DASHBOARD_VIEW);
    });
  });
});
