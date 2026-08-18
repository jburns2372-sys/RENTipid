import { PrismaClient } from "@prisma/client";
import { logApiSecurityEvent } from "../../src/lib/security/events/writers/api-security-writer";
import { getAdapterForRecord } from "../../src/lib/security/events/adapters/registry";
import { SecurityEventClassification, SecuritySeverity } from "../../src/lib/security/events/taxonomy";

const prisma = new PrismaClient();

describe("Gate 4B-3: API and Web Security Telemetry", () => {
  beforeAll(async () => {
    process.env.SECURITY_TELEMETRY_HMAC_KEY = "test-hmac-key-001";
    
    // Clear test events
    await prisma.securityEvent.deleteMany({
      where: { source_type: "API_SECURITY_LOG" }
    });
    await prisma.apiSecurityLog.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("ApiSecurityLog Writer", () => {
    it("should write API_AUTHORIZATION_DENIED correctly and ingest it", async () => {
      await logApiSecurityEvent({
        event_code: "API_AUTHORIZATION_DENIED",
        outcome: "DENIED",
        safe_route_family: "/api/bookings",
        http_method: "POST",
        policy_family: "AUTHENTICATION_REQUIRED",
        raw_ip: "192.168.1.1",
        sanitized_metadata: { test: true }
      });

      // Wait for async ingestion
      await new Promise(resolve => setTimeout(resolve, 1500));

      const logs = await prisma.apiSecurityLog.findMany({
        where: { event_code: "API_AUTHORIZATION_DENIED" }
      });

      expect(logs.length).toBe(1);
      expect(logs[0].safe_route_family).toBe("/api/bookings");
      expect(logs[0].ip_reference_hash).toBeDefined();

      const events = await prisma.securityEvent.findMany({
        where: { source_type: "API_SECURITY_LOG", event_code: "API_AUTHORIZATION_DENIED" }
      });

      expect(events.length).toBe(1);
      expect(events[0].event_classification).toBe(SecurityEventClassification.POLICY_VIOLATION);
      expect(events[0].severity).toBe(SecuritySeverity.MEDIUM);
    });

    it("should write API_RATE_LIMIT_EXCEEDED correctly and ingest it", async () => {
      await logApiSecurityEvent({
        event_code: "API_RATE_LIMIT_EXCEEDED",
        outcome: "DENIED",
        safe_route_family: "/api/health",
        http_method: "GET",
        threshold_category: "GENERAL_100PM",
        raw_ip: "10.0.0.1",
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      const logs = await prisma.apiSecurityLog.findMany({
        where: { event_code: "API_RATE_LIMIT_EXCEEDED" }
      });

      expect(logs.length).toBe(1);

      const events = await prisma.securityEvent.findMany({
        where: { source_type: "API_SECURITY_LOG", event_code: "API_RATE_LIMIT_EXCEEDED" }
      });

      expect(events.length).toBe(1);
      expect(events[0].event_classification).toBe(SecurityEventClassification.SUSPICIOUS_ACTIVITY);
      expect(events[0].severity).toBe(SecuritySeverity.MEDIUM);
    });
  });

  describe("ApiSecurityLog Adapter", () => {
    it("should correctly identify an ApiSecurityLog record", async () => {
      const record = {
        id: "test",
        event_code: "API_AUTHORIZATION_DENIED",
        safe_route_family: "/api/test",
        http_method: "GET",
        occurred_at: new Date()
      };

      const adapter = getAdapterForRecord(record);
      expect(adapter).not.toBeNull();
      expect(adapter?.sourceType).toBe("API_SECURITY_LOG");
    });
  });
});
