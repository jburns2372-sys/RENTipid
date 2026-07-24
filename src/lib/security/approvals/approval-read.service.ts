import "server-only";
import { PrismaClient } from "@prisma/client";
import { getPhase1PermissionsForRole, SECURITY_PERMISSIONS } from "../permissions";

export type ApprovalListItem = {
  id: string;
  incident_case_id: string;
  playbook_id: string;
  playbook_version: number;
  status: string;
  requester_id: string;
  requested_at: Date;
  expires_at: Date | null;
  requester: { full_name: string } | null;
  grants: { grant_state: string }[];
};

export type ApprovalDetail = Omit<ApprovalListItem, "grants"> & {
  justification: string;
  decision_at: Date | null;
  approver: { full_name: string } | null;
  decisions: {
    event_type: string;
    occurred_at: Date;
    reason: string | null;
    actor: { full_name: string } | null;
  }[];
  grants: {
    grant_state: string;
    issued_at: Date;
    expires_at: Date;
    consumed_at: Date | null;
    revoked_at: Date | null;
    revoked_by: { full_name: string } | null;
  }[];
};

async function checkApprovalAccess(db: PrismaClient, userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true, status: true } });
  if (!user || user.status !== "Verified") throw new Error("PERMISSION_DENIED");
  const permissions = getPhase1PermissionsForRole(user.role);
  if (!permissions.includes(SECURITY_PERMISSIONS.RESPONSE_REQUEST) && !permissions.includes(SECURITY_PERMISSIONS.RESPONSE_APPROVE)) {
    throw new Error("PERMISSION_DENIED");
  }
}

export async function listApprovals(db: PrismaClient, userId: string, limit: number = 25, cursor?: string | null): Promise<{ data: ApprovalListItem[], pagination: { limit: number, next_cursor: string | null } }> {
  await checkApprovalAccess(db, userId);

  const take = Math.min(limit + 1, 100);
  const data = await db.securityResponseApprovalRequest.findMany({
    take,
    ...(cursor ? { cursor: { id: cursor } } : {}),
    orderBy: { requested_at: "desc" },
    select: {
      id: true,
      incident_case_id: true,
      playbook_id: true,
      playbook_version: true,
      status: true,
      requester_id: true,
      requested_at: true,
      expires_at: true,
      requester: { select: { full_name: true } },
      grants: { select: { grant_state: true } }
    }
  });

  let next_cursor: string | null = null;
  if (data.length > limit) {
    const nextItem = data.pop();
    next_cursor = nextItem!.id;
  }

  return { data, pagination: { limit, next_cursor } };
}

export async function getApprovalDetail(db: PrismaClient, userId: string, id: string): Promise<ApprovalDetail | null> {
  await checkApprovalAccess(db, userId);

  return db.securityResponseApprovalRequest.findUnique({
    where: { id },
    include: {
      requester: { select: { full_name: true } },
      approver: { select: { full_name: true } },
      decisions: {
        orderBy: { occurred_at: "desc" },
        include: { actor: { select: { full_name: true } } }
      },
      grants: {
        include: { revoked_by: { select: { full_name: true } } }
      }
    }
  });
}
