import "server-only";
import { PrismaClient } from "@prisma/client";
import { assertSecurityPermissionForService } from "../authorization";
import { SECURITY_PERMISSIONS } from "../permissions";

export type PlaybookListItem = {
  id: string;
  playbook_id: string;
  version: number;
  name: string;
  description: string;
  status: string;
  created_at: Date;
  updated_at: Date;
};

export type PlaybookDetail = PlaybookListItem & {
  lock_version: number;
  steps: {
    id: string;
    human_instruction: string;
    step_order: number;
    action_type: string;
  }[];
  history: {
    id: string;
    version: number;
    status: string;
    created_at: Date;
  }[];
};

export async function listPlaybooks(db: PrismaClient, userId: string, limit: number = 25, cursor?: string | null): Promise<{ data: PlaybookListItem[], pagination: { limit: number, next_cursor: string | null } }> {
  await assertSecurityPermissionForService(userId, SECURITY_PERMISSIONS.PLAYBOOK_VIEW, db);
  
  const take = Math.min(limit + 1, 100);
  const data = await db.securityResponsePlaybook.findMany({
    take,
    ...(cursor ? { cursor: { id: cursor } } : {}),
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      playbook_id: true,
      version: true,
      name: true,
      description: true,
      status: true,
      created_at: true,
      updated_at: true
    }
  });

  let next_cursor: string | null = null;
  if (data.length > limit) {
    const nextItem = data.pop();
    next_cursor = nextItem!.id;
  }

  return {
    data,
    pagination: { limit, next_cursor }
  };
}

export async function getPlaybookDetail(db: PrismaClient, userId: string, id: string): Promise<PlaybookDetail | null> {
  await assertSecurityPermissionForService(userId, SECURITY_PERMISSIONS.PLAYBOOK_VIEW, db);
  
  const playbook = await db.securityResponsePlaybook.findUnique({
    where: { id },
    include: { steps: { orderBy: { step_order: "asc" } } }
  });
  if (!playbook) return null;

  const history = await db.securityResponsePlaybook.findMany({
    where: { playbook_id: playbook.playbook_id },
    orderBy: { version: "desc" },
    select: { id: true, version: true, status: true, created_at: true }
  });

  return {
    ...playbook,
    history
  };
}
