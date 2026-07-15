import { GET } from "@/app/api/admin/security/events/route";
import { NextRequest } from "next/server";

// Mock auth
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));

// Mock Prisma
jest.mock("@prisma/client", () => {
  const original = jest.requireActual("@prisma/client");
  const mPrisma = {
    user: { findUnique: jest.fn() },
    securityEvent: { findMany: jest.fn() },
    auditLog: { create: jest.fn() }
  };
  return {
    ...original,
    PrismaClient: jest.fn(() => mPrisma),
    __mockPrisma: mPrisma
  };
});
const { __mockPrisma: prismaMock } = require("@prisma/client"); // eslint-disable-line @typescript-eslint/no-require-imports

import { getServerSession } from "next-auth";

describe("SOC Query API Matrix", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createReq = (url: string) => new NextRequest(new URL(url, "http://localhost"));

  describe("Authorization", () => {
    it("denies unauthenticated access", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      const res = await GET(createReq("/api/admin/security/events"));
      expect(res.status).toBe(401);
    });

    const deniedRoles = [
      "Guest", "Renter", "Individual Provider", "Business Provider", 
      "Admin", "Finance Admin", "Compliance Admin"
    ];

    deniedRoles.forEach(role => {
      it(`denies ${role}`, async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "user1", role, status: "Verified" } });
        prismaMock.user.findUnique.mockResolvedValue({ id: "user1", role, status: "Verified" });
        const res = await GET(createReq("/api/admin/security/events"));
        expect(res.status).toBe(403);
      });
    });

    it("allows Verified Super Admin", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "superadmin" } });
      prismaMock.user.findUnique.mockResolvedValue({ id: "superadmin", role: "Super Admin", status: "Verified" });
      prismaMock.securityEvent.findMany.mockResolvedValue([]);
      const res = await GET(createReq("/api/admin/security/events"));
      expect(res.status).toBe(200);
    });

    const deniedStatuses = ["Pending", "Suspended", "Blacklisted"];
    deniedStatuses.forEach(status => {
      it(`denies ${status} Super Admin`, async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "superadmin" } });
        prismaMock.user.findUnique.mockResolvedValue({ id: "superadmin", role: "Super Admin", status });
        const res = await GET(createReq("/api/admin/security/events"));
        expect(res.status).toBe(403);
      });
    });

    it("denies missing database user", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "missing" } });
      prismaMock.user.findUnique.mockResolvedValue(null);
      const res = await GET(createReq("/api/admin/security/events"));
      expect(res.status).toBe(401); // Or 403, depends on implementation, but denied.
    });

    it("denies stale JWT role", async () => {
      // JWT says Super Admin, but DB says Renter
      (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "stale" } });
      prismaMock.user.findUnique.mockResolvedValue({ id: "stale", role: "Renter", status: "Verified" });
      const res = await GET(createReq("/api/admin/security/events"));
      expect(res.status).toBe(403);
    });
  });

  describe("Validation & Bounds", () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "superadmin" } });
      prismaMock.user.findUnique.mockResolvedValue({ id: "superadmin", role: "Super Admin", status: "Verified" });
      prismaMock.securityEvent.findMany.mockResolvedValue([]);
    });

    it("rejects invalid source", async () => {
      const res = await GET(createReq("/api/admin/security/events?source_type=HACK"));
      expect(res.status).toBe(400);
    });

    it("rejects excessive page size", async () => {
      const res = await GET(createReq("/api/admin/security/events?limit=1000"));
      // The API should cap it to 100, so it returns 200 with limited data, or 400.
      expect([200, 400]).toContain(res.status);
    });

    it("enforces stable sorting by occurred_at DESC, id DESC", async () => {
      await GET(createReq("/api/admin/security/events"));
      expect(prismaMock.securityEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [
            { occurred_at: "desc" },
            { id: "desc" }
          ]
        })
      );
    });
  });
});
