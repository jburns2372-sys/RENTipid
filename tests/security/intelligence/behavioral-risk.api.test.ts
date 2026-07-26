import { GET as getAssessmentById } from "@/app/api/soc/intelligence/behavioral-risk/[assessmentId]/route";
import { GET as getLatestAssessment } from "@/app/api/soc/intelligence/behavioral-risk/latest/route";
import { GET as getHistory } from "@/app/api/soc/intelligence/behavioral-risk/history/route";
import * as assessmentByIdRoute from "@/app/api/soc/intelligence/behavioral-risk/[assessmentId]/route";
import * as latestRoute from "@/app/api/soc/intelligence/behavioral-risk/latest/route";
import * as historyRoute from "@/app/api/soc/intelligence/behavioral-risk/history/route";
import fs from "fs";
import path from "path";

jest.mock("@/lib/security/authorization", () => ({
  requireAuthenticatedUser: jest.fn(),
  getValidSessionIdentity: jest.fn(),
  assertSecurityPermissionForService: jest.fn()
}));

jest.mock("@/lib/security/intelligence/behavioral-risk.queries", () => ({
  getBehavioralRiskAssessmentById: jest.fn(),
  getLatestBehavioralRiskAssessmentForSubject: jest.fn(),
  listBehavioralRiskHistoryForSubject: jest.fn(),
  MAX_ASSESSMENT_HISTORY_LIMIT: 50
}));

import { requireAuthenticatedUser, getValidSessionIdentity, assertSecurityPermissionForService } from "@/lib/security/authorization";
import { getBehavioralRiskAssessmentById, getLatestBehavioralRiskAssessmentForSubject, listBehavioralRiskHistoryForSubject } from "@/lib/security/intelligence/behavioral-risk.queries";

describe("Behavioral Risk API Slice 3", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createReq = (url: string) => new Request(new URL(url, "http://localhost"));

  describe("Authentication and Authorization", () => {
    it("Unauthenticated request is rejected (401)", async () => {
      (requireAuthenticatedUser as jest.Mock).mockResolvedValue(null);
      const res = await getAssessmentById(createReq("/api/soc/intelligence/behavioral-risk/123"), { params: Promise.resolve({ assessmentId: "123" }) });
      expect(res.status).toBe(401);

      const resLatest = await getLatestAssessment(createReq("/api/soc/intelligence/behavioral-risk/latest"));
      expect(resLatest.status).toBe(401);
    });

    it("Authenticated user without SOC read permission is forbidden (403)", async () => {
      (requireAuthenticatedUser as jest.Mock).mockResolvedValue({ id: "user-1" });
      (getValidSessionIdentity as jest.Mock).mockReturnValue("user-1");
      (assertSecurityPermissionForService as jest.Mock).mockResolvedValue(false);

      const res = await getAssessmentById(createReq("/api/soc/intelligence/behavioral-risk/123"), { params: Promise.resolve({ assessmentId: "123" }) });
      expect(res.status).toBe(403);
    });

    it("No record-existence disclosure occurs across forbidden boundaries", async () => {
      (requireAuthenticatedUser as jest.Mock).mockResolvedValue({ id: "user-1" });
      (getValidSessionIdentity as jest.Mock).mockReturnValue("user-1");
      (assertSecurityPermissionForService as jest.Mock).mockResolvedValue(false);

      const res = await getAssessmentById(createReq("/api/soc/intelligence/behavioral-risk/real-id"), { params: Promise.resolve({ assessmentId: "real-id" }) });
      expect(res.status).toBe(403);
      expect(getBehavioralRiskAssessmentById).not.toHaveBeenCalled();
    });
  });

  describe("Assessment By ID Route", () => {
    beforeEach(() => {
      (requireAuthenticatedUser as jest.Mock).mockResolvedValue({ id: "soc-admin" });
      (getValidSessionIdentity as jest.Mock).mockReturnValue("soc-admin");
      (assertSecurityPermissionForService as jest.Mock).mockResolvedValue(true);
    });

    it("Authorized assessment-by-ID request succeeds", async () => {
      const mockResult = { id: "123", advisoryOnly: true };
      (getBehavioralRiskAssessmentById as jest.Mock).mockResolvedValue(mockResult);

      const req = createReq("/api/soc/intelligence/behavioral-risk/123?environment=PRODUCTION&lifecycle=LIVE");
      const res = await getAssessmentById(req, { params: Promise.resolve({ assessmentId: "123" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual(mockResult);
      expect(getBehavioralRiskAssessmentById).toHaveBeenCalledWith("123", { environment: "PRODUCTION", lifecycle: "LIVE" });
    });

    it("Assessment-by-ID validates environment and lifecycle", async () => {
      const res1 = await getAssessmentById(createReq("/api/soc/intelligence/behavioral-risk/123"), { params: Promise.resolve({ assessmentId: "123" }) });
      expect(res1.status).toBe(400);

      const res2 = await getAssessmentById(createReq("/api/soc/intelligence/behavioral-risk/123?environment=INVALID&lifecycle=LIVE"), { params: Promise.resolve({ assessmentId: "123" }) });
      expect(res2.status).toBe(400);
    });

    it("Missing assessment returns safe not-found", async () => {
      (getBehavioralRiskAssessmentById as jest.Mock).mockResolvedValue(null);
      const req = createReq("/api/soc/intelligence/behavioral-risk/999?environment=PRODUCTION&lifecycle=LIVE");
      const res = await getAssessmentById(req, { params: Promise.resolve({ assessmentId: "999" }) });
      expect(res.status).toBe(404);
    });
  });

  describe("Latest Assessment Route", () => {
    beforeEach(() => {
      (requireAuthenticatedUser as jest.Mock).mockResolvedValue({ id: "soc-admin" });
      (getValidSessionIdentity as jest.Mock).mockReturnValue("soc-admin");
      (assertSecurityPermissionForService as jest.Mock).mockResolvedValue(true);
    });

    it("Latest route requires subject, environment, and lifecycle", async () => {
      const res = await getLatestAssessment(createReq("/api/soc/intelligence/behavioral-risk/latest"));
      expect(res.status).toBe(400);
    });

    it("Latest route preserves subject isolation", async () => {
      const mockResult = { id: "latest-1", advisoryOnly: true, signals: [], evidenceIds: [] };
      (getLatestBehavioralRiskAssessmentForSubject as jest.Mock).mockResolvedValue(mockResult);

      const req = createReq("/api/soc/intelligence/behavioral-risk/latest?subjectRef=sub-1&environment=PRODUCTION&lifecycle=LIVE");
      const res = await getLatestAssessment(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toEqual(mockResult);
      expect(getLatestBehavioralRiskAssessmentForSubject).toHaveBeenCalledWith({
        subjectReference: "sub-1",
        environment: "PRODUCTION",
        lifecycle: "LIVE"
      });
    });
  });

  describe("History Route", () => {
    beforeEach(() => {
      (requireAuthenticatedUser as jest.Mock).mockResolvedValue({ id: "soc-admin" });
      (getValidSessionIdentity as jest.Mock).mockReturnValue("soc-admin");
      (assertSecurityPermissionForService as jest.Mock).mockResolvedValue(true);
    });

    it("History route requires subject, environment, and lifecycle", async () => {
      const res = await getHistory(createReq("/api/soc/intelligence/behavioral-risk/history"));
      expect(res.status).toBe(400);
    });

    it("History route enforces maximum page size", async () => {
      (listBehavioralRiskHistoryForSubject as jest.Mock).mockResolvedValue([]);

      const req = createReq("/api/soc/intelligence/behavioral-risk/history?subjectRef=sub-1&environment=PRODUCTION&lifecycle=LIVE&limit=1000");
      const res = await getHistory(req);
      expect(res.status).toBe(200);

      expect(listBehavioralRiskHistoryForSubject).toHaveBeenCalledWith({
        subjectReference: "sub-1",
        environment: "PRODUCTION",
        lifecycle: "LIVE"
      }, 50); // MAX_ASSESSMENT_HISTORY_LIMIT
    });

    it("History route passes stable pagination values correctly", async () => {
      (listBehavioralRiskHistoryForSubject as jest.Mock).mockResolvedValue([{ id: "hist-1", advisoryOnly: true }]);

      const req = createReq("/api/soc/intelligence/behavioral-risk/history?subjectRef=sub-1&environment=PRODUCTION&lifecycle=LIVE&limit=10");
      const res = await getHistory(req);
      expect(res.status).toBe(200);

      expect(listBehavioralRiskHistoryForSubject).toHaveBeenCalledWith({
        subjectReference: "sub-1",
        environment: "PRODUCTION",
        lifecycle: "LIVE"
      }, 10);
    });

    it("Query service receives sanitized subject reference", async () => {
      (listBehavioralRiskHistoryForSubject as jest.Mock).mockResolvedValue([]);

      const req = createReq("/api/soc/intelligence/behavioral-risk/history?subjectRef=%20sub-1%20&environment=PRODUCTION&lifecycle=LIVE");
      await getHistory(req);

      expect(listBehavioralRiskHistoryForSubject).toHaveBeenCalledWith(
        expect.objectContaining({ subjectReference: "sub-1" }),
        undefined
      );
    });
  });

  describe("Response Safety Guarantees", () => {
    beforeEach(() => {
      (requireAuthenticatedUser as jest.Mock).mockResolvedValue({ id: "soc-admin" });
      (getValidSessionIdentity as jest.Mock).mockReturnValue("soc-admin");
      (assertSecurityPermissionForService as jest.Mock).mockResolvedValue(true);
    });

    it("API output contains signals and evidence IDs, absent raw events", async () => {
      const mockSafeResult = {
        id: "123",
        advisoryOnly: true,
        riskBand: "HIGH",
        confidence: "HIGH",
        signals: [{ code: "AUTH_REPEATED_DENIAL" }],
        evidenceIds: ["ev-1", "ev-2"]
      };
      (getBehavioralRiskAssessmentById as jest.Mock).mockResolvedValue(mockSafeResult);

      const req = createReq("/api/soc/intelligence/behavioral-risk/123?environment=PRODUCTION&lifecycle=LIVE");
      const res = await getAssessmentById(req, { params: Promise.resolve({ assessmentId: "123" }) });
      const data = await res.json();

      expect(data.signals).toBeDefined();
      expect(data.evidenceIds).toBeDefined();
      expect(data.rawEventMetadata).toBeUndefined();
      expect(data.credentials).toBeUndefined();
      expect(data.tokens).toBeUndefined();
      expect(data.paymentData).toBeUndefined();
      expect(data.advisoryOnly).toBe(true);
    });
  });

  describe("Implementation Requirements", () => {
    it("No mutation service is imported or called", () => {
      const routes = [
        "src/app/api/soc/intelligence/behavioral-risk/[assessmentId]/route.ts",
        "src/app/api/soc/intelligence/behavioral-risk/latest/route.ts",
        "src/app/api/soc/intelligence/behavioral-risk/history/route.ts"
      ];
      routes.forEach(route => {
        const content = fs.readFileSync(path.resolve(process.cwd(), route), 'utf-8');
        expect(content).not.toContain("behavioral-risk.persistence");
        expect(content).not.toContain("persistBehavioralRiskAssessment");
      });
    });

    it("Unsupported HTTP methods are unavailable", () => {
      const unsupported = ['POST', 'PUT', 'PATCH', 'DELETE'];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const modules: any[] = [assessmentByIdRoute, latestRoute, historyRoute];

      modules.forEach(routeModule => {
        unsupported.forEach(method => {
          expect(routeModule[method]).toBeUndefined();
        });
        expect(routeModule.GET).toBeDefined();
      });
    });
  });
});
