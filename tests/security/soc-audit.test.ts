import { recordSecurityAccessDenied } from "@/lib/security/authorization";
import { createAuditLog } from "@/lib/audit";

jest.mock("@/lib/audit", () => ({ createAuditLog: jest.fn() }));

describe("SOC Audit Integration Matrix", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("AUDIT-P1-001 & AUDIT-P1-002 & AUDIT-P1-004 & AUDIT-P1-005 - Action, actor, permission logged", async () => {
    await recordSecurityAccessDenied("user123", "SOC_ACCESS_DENIED_ROLE", "security.dashboard.view");
    expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      actor_user_id: "user123",
      action: "SOC_ACCESS_DENIED_ROLE",
      details: expect.stringContaining("security.dashboard.view")
    }));
  });

  it("AUDIT-P1-006 & AUDIT-P1-007 & AUDIT-P1-008 & AUDIT-P1-009 & AUDIT-P1-010 & AUDIT-P1-011 - Secrets absent in details", async () => {
    await recordSecurityAccessDenied("user123", "SOC_ACCESS_DENIED_UNAUTHENTICATED", "security.dashboard.view");
    const callArg = (createAuditLog as jest.Mock).mock.calls[0][0];
    const details = callArg.details;
    expect(details).not.toContain("password");
    expect(details).not.toContain("token");
    expect(details).not.toContain("authorization");
    expect(details).not.toContain("cookie");
    expect(details).not.toContain("secret");
  });

  it("AUDIT-P1-012 & AUDIT-P1-017 - Flooding protection works (deduplication)", async () => {
    // Generate identical requests to trigger flood protection
    await recordSecurityAccessDenied("flooder", "SOC_ACCESS_DENIED_ROLE", "security.dashboard.view");
    await recordSecurityAccessDenied("flooder", "SOC_ACCESS_DENIED_ROLE", "security.dashboard.view");
    await recordSecurityAccessDenied("flooder", "SOC_ACCESS_DENIED_ROLE", "security.dashboard.view");

    // createAuditLog should only be called once because of the in-memory LRU window
    expect(createAuditLog).toHaveBeenCalledTimes(1);
    
    // A different route/user should still log
    await recordSecurityAccessDenied("flooder2", "SOC_ACCESS_DENIED_ROLE", "security.dashboard.view");
    expect(createAuditLog).toHaveBeenCalledTimes(2);
  });

  it("AUDIT-P1-013 & AUDIT-P1-014 - Audit failure swallowed safely", async () => {
    (createAuditLog as jest.Mock).mockRejectedValueOnce(new Error("DB Connection Refused"));
    // recordSecurityAccessDenied should not throw an exception, it should swallow it safely.
    await expect(recordSecurityAccessDenied("user", "SOC_ACCESS_DENIED_ROLE", "security.dashboard.view")).resolves.not.toThrow();
  });
});
