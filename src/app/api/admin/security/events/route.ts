import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";
import { 
  requireAuthenticatedUser, 
  getCurrentDatabaseUser, 
  assertAccountAllowedForSocAccess, 
  canAccessSecurityPermission,
  recordSecurityAccessDenied,
  DenialCategory
} from "@/lib/security/authorization";
import { SECURITY_PERMISSIONS } from "@/lib/security/permissions";
import { z } from "zod";
import { 
  SecurityEventSource, 
  SecurityDomain, 
  SecuritySeverity, 
  SecurityLifecycle, 
  SecurityProcessingStatus 
} from "@/lib/security/events/taxonomy";

const prisma = new PrismaClient();

const querySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  lifecycle_type: z.nativeEnum(SecurityLifecycle).optional(),
  source_type: z.nativeEnum(SecurityEventSource).optional(),
  security_domain: z.nativeEnum(SecurityDomain).optional(),
  severity: z.nativeEnum(SecuritySeverity).optional(),
  processing_status: z.nativeEnum(SecurityProcessingStatus).optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional()
});

export async function GET(request: NextRequest) {
  try {
    // 1. Authoritative API Authentication
    const sessionUser = await requireAuthenticatedUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const dbUser = await getCurrentDatabaseUser((sessionUser as { id: string }).id);
    if (!dbUser) {
      await recordSecurityAccessDenied((sessionUser as { id: string }).id, "SOC_ACCESS_DENIED_USER_NOT_FOUND", SECURITY_PERMISSIONS.EVENTS_VIEW);
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const policyResult = await assertAccountAllowedForSocAccess(dbUser);
    if (!policyResult.allowed) {
      await recordSecurityAccessDenied(dbUser.id, policyResult.reason as DenialCategory, SECURITY_PERMISSIONS.EVENTS_VIEW);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const activePermissions = policyResult.permissions!;
    if (!canAccessSecurityPermission(activePermissions, SECURITY_PERMISSIONS.EVENTS_VIEW)) {
      await recordSecurityAccessDenied(dbUser.id, "SOC_ACCESS_DENIED_PERMISSION", SECURITY_PERMISSIONS.EVENTS_VIEW);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Query Validation
    const { searchParams } = new URL(request.url);
    const parseResult = querySchema.safeParse(Object.fromEntries(searchParams));

    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
    }

    const filters = parseResult.data;

    // 3. Secure Prisma Query Construction
    const where: Prisma.SecurityEventWhereInput = {
      // Exclude SIMULATION by default unless explicitly requested
      lifecycle_type: filters.lifecycle_type ? filters.lifecycle_type : { not: SecurityLifecycle.SIMULATION },
    };

    if (filters.source_type) where.source_type = filters.source_type;
    if (filters.security_domain) where.security_domain = filters.security_domain;
    if (filters.severity) where.severity = filters.severity;
    if (filters.processing_status) where.processing_status = filters.processing_status;
    
    if (filters.start_date || filters.end_date) {
      where.occurred_at = {};
      if (filters.start_date) where.occurred_at.gte = new Date(filters.start_date);
      if (filters.end_date) where.occurred_at.lte = new Date(filters.end_date);
    }

    // Cursor-based pagination using Prisma
    // We order by occurred_at DESC, id DESC for stability
    const findArgs: Prisma.SecurityEventFindManyArgs = {
      where,
      take: filters.limit + 1, // take one extra to determine hasNextPage
      orderBy: [
        { occurred_at: "desc" },
        { id: "desc" }
      ]
    };

    if (filters.cursor) {
      findArgs.cursor = { id: filters.cursor };
      findArgs.skip = 1; // Skip the cursor itself
    }

    const events = await prisma.securityEvent.findMany(findArgs);

    let nextCursor: string | undefined = undefined;
    if (events.length > filters.limit) {
      const nextItem = events.pop(); 
      nextCursor = nextItem!.id;
    }

    return NextResponse.json({
      data: events,
      pagination: {
        nextCursor,
        limit: filters.limit
      }
    });
  } catch (error) {
    console.error("SOC Event Query Failed", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
