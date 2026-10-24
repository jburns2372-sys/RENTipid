jest.mock("@prisma/client", () => {
  const actual = jest.requireActual("@prisma/client");
  return {
    ...actual,
    PrismaClient: jest.fn(() => ({
      auditLog: { create: jest.fn() },
    })),
  };
});
jest.mock("@/lib/security/events/event-ingestion", () => ({
  processSecurityEvent: jest.fn(),
}));

import { PrismaClient } from "@prisma/client";
import { createAuditLog } from "@/lib/audit";
import { processSecurityEvent } from "@/lib/security/events/event-ingestion";

const mockAuditLogCreate = (PrismaClient as unknown as jest.Mock).mock.results[0]
  .value.auditLog.create as jest.Mock;

describe("SOC v1.1 required report-export audit contract", () => {
  afterEach(() => jest.restoreAllMocks());

  it("reports persistence failure so the export route can fail closed", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    mockAuditLogCreate.mockRejectedValueOnce(new Error("audit unavailable"));

    await expect(createAuditLog({
      actor_user_id: "soc-admin",
      action: "SOC_REPORT_EXPORTED",
      module: "security_reports",
      target_id: "events",
    })).resolves.toBe(false);

    expect(processSecurityEvent).not.toHaveBeenCalled();
  });
});
