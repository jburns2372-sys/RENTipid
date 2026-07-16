import { 
  requireSecurityPermission
} from "@/lib/security/authorization";
import { SECURITY_PERMISSIONS } from "@/lib/security/permissions";
import { createAuditLog } from "@/lib/audit";
import { getServerSession } from "next-auth";

jest.mock("@prisma/client", () => {
  const mPrisma = {
    user: { findUnique: jest.fn() }
  };
  return {
    PrismaClient: jest.fn(() => mPrisma),
    __mockPrisma: mPrisma
  };
});
const { __mockPrisma: prismaMock } = require("@prisma/client"); // eslint-disable-line @typescript-eslint/no-require-imports
import { redirect } from "next/navigation";

jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("@/lib/audit", () => ({ createAuditLog: jest.fn() }));
jest.mock("next/navigation", () => ({ redirect: jest.fn() }));

describe("SOC Authorization Service Matrix", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Simulate Next.js redirect throwing
    (redirect as unknown as jest.Mock).mockImplementation(() => { throw new Error('NEXT_REDIRECT'); });
  });

  it("AUTHZ-P1-001 - Unauthenticated user denied", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    await expect(requireSecurityPermission(SECURITY_PERMISSIONS.DASHBOARD_VIEW)).rejects.toThrow('NEXT_REDIRECT');
    expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "SOC_ACCESS_DENIED_UNAUTHENTICATED" }));
  });

  it("AUTHZ-P1-017 & AUTHZ-P1-018 - Deleted/Missing User or Expired session denied", async () => {
    const id = Date.now().toString() + Math.random().toString();
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id } });
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(requireSecurityPermission(SECURITY_PERMISSIONS.DASHBOARD_VIEW)).rejects.toThrow('NEXT_REDIRECT');
    expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "SOC_ACCESS_DENIED_USER_NOT_FOUND" }));
  });

  function setupAuthContext(role: string, status: string) {
    const testUserId = Date.now().toString() + Math.random().toString();
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUserId, email: "test@example.com", name: "Test User" }
    });
    prismaMock.user.findUnique.mockResolvedValue({
      id: testUserId,
      email: "test@example.com",
      full_name: "Test User",
      role,
      status
    });
    return testUserId;
  }

  const generateRoleTest = (role: string, status: string, expectedDenialReason: string | null) => {
    return async () => {
      const userId = setupAuthContext(role, status, expectedDenialReason);
      
      if (expectedDenialReason) {
        await expect(requireSecurityPermission(SECURITY_PERMISSIONS.DASHBOARD_VIEW)).rejects.toThrow('NEXT_REDIRECT');
        expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: expectedDenialReason }));
      } else {
        const result = await requireSecurityPermission(SECURITY_PERMISSIONS.DASHBOARD_VIEW);
        expect(result.userId).toBe(userId);
      }
    };
  };

  it("AUTHZ-P1-002 - Guest denied", generateRoleTest("Guest", "Verified", "SOC_ACCESS_DENIED_ROLE"));
  it("AUTHZ-P1-003 - Renter denied", generateRoleTest("Renter", "Verified", "SOC_ACCESS_DENIED_ROLE"));
  it("AUTHZ-P1-004 - Individual Provider denied", generateRoleTest("Individual Provider", "Verified", "SOC_ACCESS_DENIED_ROLE"));
  it("AUTHZ-P1-005 - Business Provider denied", generateRoleTest("Business Provider", "Verified", "SOC_ACCESS_DENIED_ROLE"));
  it("AUTHZ-P1-009 - Unauthorized Admin denied (Phase 1 specific)", generateRoleTest("Admin", "Verified", "SOC_ACCESS_DENIED_ROLE"));
  it("AUTHZ-P1-010 - Finance Admin limited", generateRoleTest("Finance Admin", "Verified", "SOC_ACCESS_DENIED_ROLE"));
  it("AUTHZ-P1-011 - Compliance Admin limited", generateRoleTest("Compliance Admin", "Verified", "SOC_ACCESS_DENIED_ROLE"));
  it("AUTHZ-P1-012 - Verified Super Admin allowed", generateRoleTest("Super Admin", "Verified", null));

  it("AUTHZ-P1-006 - Pending administrator denied", generateRoleTest("Super Admin", "Pending", "SOC_ACCESS_DENIED_ACCOUNT_STATUS"));
  it("AUTHZ-P1-007 - Suspended administrator denied", generateRoleTest("Super Admin", "Suspended", "SOC_ACCESS_DENIED_ACCOUNT_STATUS"));
  it("AUTHZ-P1-008 - Blacklisted administrator denied", generateRoleTest("Super Admin", "Blacklisted", "SOC_ACCESS_DENIED_ACCOUNT_STATUS"));

  it("AUTHZ-P1-024 & AUTHZ-P1-025 - Database status/role overrides stale JWT", async () => {
    const id1 = Date.now().toString() + Math.random().toString();
    // JWT says Super Admin / Verified
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: id1, role: "Super Admin", status: "Verified" } });
    
    // DB says Renter / Verified
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: id1, role: "Renter", status: "Verified" });
    await expect(requireSecurityPermission(SECURITY_PERMISSIONS.DASHBOARD_VIEW)).rejects.toThrow('NEXT_REDIRECT');
    expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "SOC_ACCESS_DENIED_ROLE" }));

    jest.clearAllMocks();
    (redirect as unknown as jest.Mock).mockImplementation(() => { throw new Error('NEXT_REDIRECT'); });

    const id2 = Date.now().toString() + Math.random().toString();
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: id2, role: "Super Admin", status: "Verified" } });
    // DB says Super Admin / Suspended
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: id2, role: "Super Admin", status: "Suspended" });
    await expect(requireSecurityPermission(SECURITY_PERMISSIONS.DASHBOARD_VIEW)).rejects.toThrow('NEXT_REDIRECT');
    expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "SOC_ACCESS_DENIED_ACCOUNT_STATUS" }));
  });

  it("AUTHZ-P1-022 - Database failure fails closed", async () => {
    const id = Date.now().toString() + Math.random().toString();
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id } });
    prismaMock.user.findUnique.mockRejectedValue(new Error("DB Down"));
    
    // requireSecurityPermission calls getCurrentDatabaseUser which swallows error and returns null
    await expect(requireSecurityPermission(SECURITY_PERMISSIONS.DASHBOARD_VIEW)).rejects.toThrow('NEXT_REDIRECT');
    // Resulting in user_not_found denial
    expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "SOC_ACCESS_DENIED_USER_NOT_FOUND" }));
  });

  it("AUTHZ-P1-023 - AuditLog failure does not grant access", async () => {
    const id = Date.now().toString() + Math.random().toString();
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id } });
    prismaMock.user.findUnique.mockResolvedValue({ id, role: "Renter", status: "Verified" });
    
    // Simulate audit failure
    (createAuditLog as jest.Mock).mockRejectedValue(new Error("Audit DB Down"));
    
    await expect(requireSecurityPermission(SECURITY_PERMISSIONS.DASHBOARD_VIEW)).rejects.toThrow('NEXT_REDIRECT');
    // Still redirects!
  });

  // Mocks for flooding covered in soc-audit.test.ts (AUTHZ-P1-013, 014, 015, 016 covered by e2e/unit combos)
});
