import "server-only";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient, Prisma } from "@prisma/client";
import { getPhase1PermissionsForRole, SecurityPermission } from "./permissions";
import { createPrivacySafeAuthorizationContext, serializePrivacySafeIp } from "./serializers";
import { logAdministrationEvent } from "./events/writers/administration-writer";
import {
  getCurrentSessionAal2,
  MfaSessionAssuranceRequiredError,
  requireCurrentSessionAal2,
} from "./auth/mfa-session-assurance";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

// Bounded in-memory deduplication cache for AuditLog flooding protection.
// Prevents an attacker from flooding the DB with 1000s of identical denied requests per second.
const AUDIT_CACHE_LIMIT = 5000;
const AUDIT_CACHE_TTL_MS = 60 * 1000; // 60 seconds
const auditCache = new Map<string, number>();

function isFlood(key: string): boolean {
  const now = Date.now();
  if (auditCache.size > AUDIT_CACHE_LIMIT) {
    // Prune expired entries to protect memory
    for (const [k, timestamp] of auditCache.entries()) {
      if (now - timestamp > AUDIT_CACHE_TTL_MS) {
        auditCache.delete(k);
      }
    }
    // If still full, fail-safe to blocking the log to protect DB
    if (auditCache.size > AUDIT_CACHE_LIMIT) return true;
  }

  const lastSeen = auditCache.get(key);
  if (lastSeen && now - lastSeen < AUDIT_CACHE_TTL_MS) {
    return true; // Flooding detected
  }
  
  auditCache.set(key, now);
  return false;
}

export type DenialCategory = 
  | "SOC_ACCESS_DENIED_UNAUTHENTICATED"
  | "SOC_ACCESS_DENIED_USER_NOT_FOUND"
  | "SOC_ACCESS_DENIED_ACCOUNT_STATUS"
  | "SOC_ACCESS_DENIED_ROLE"
  | "SOC_ACCESS_DENIED_PERMISSION"
  | "SOC_ACCESS_DENIED_AUTHORIZATION_SERVICE_FAILURE";

export function getValidSessionIdentity(session: unknown): string {
  if (
    session &&
    typeof session === "object" &&
    "user" in session &&
    session.user &&
    typeof session.user === "object" &&
    "id" in session.user &&
    typeof (session.user as { id: unknown }).id === "string"
  ) {
    const id = (session.user as { id: string }).id.trim();
    if (id !== "") {
      return id;
    }
  }
  throw new Error("UNAUTHORIZED_SESSION_IDENTITY");
}

export function getValidSessionTimestamp(sessionUser: unknown): number {
  if (
    sessionUser &&
    typeof sessionUser === "object" &&
    "iat" in sessionUser &&
    typeof (sessionUser as { iat: unknown }).iat === "number" &&
    Number.isFinite((sessionUser as { iat: number }).iat)
  ) {
    return (sessionUser as { iat: number }).iat * 1000;
  }
  throw new Error("UNAUTHORIZED_SESSION_TIMESTAMP");
}

export async function requireAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    await recordSecurityAccessDenied(null, "SOC_ACCESS_DENIED_UNAUTHENTICATED");
    return null;
  }
  return session.user;
}

/**
 * PostgreSQL-authoritative lookup, bypassing stale JWT role/status.
 * Uses an explicit allowlist of non-sensitive fields.
 */
export async function getCurrentDatabaseUser(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        status: true,
        updated_at: true,
      }
    });
    return user;
  } catch {
    // Database failure fails closed
    console.error("Database lookup failed during authorization.");
    return null;
  }
}

export async function assertAccountAllowedForSocAccess(user: { status: string, role: string } | null) {
  if (!user) return { allowed: false, reason: "SOC_ACCESS_DENIED_USER_NOT_FOUND" as DenialCategory };
  
  if (user.status !== "Verified") {
    return { allowed: false, reason: "SOC_ACCESS_DENIED_ACCOUNT_STATUS" as DenialCategory };
  }

  const permissions = getPhase1PermissionsForRole(user.role);
  if (permissions.length === 0) {
    return { allowed: false, reason: "SOC_ACCESS_DENIED_ROLE" as DenialCategory };
  }

  return { allowed: true, permissions };
}

export function canAccessSecurityPermission(activePermissions: SecurityPermission[], requiredPermission: SecurityPermission) {
  return activePermissions.includes(requiredPermission);
}

export async function recordSecurityAccessDenied(
  userId: string | null, 
  reason: DenialCategory, 
  requiredPermission?: string
) {
  try {
    const safeIp = serializePrivacySafeIp("request_ip_context_unavailable_in_rsc");
    const dedupeKey = `deny:${userId || "anon"}:${reason}:${requiredPermission || "none"}`;
    
    if (isFlood(dedupeKey)) {
      return; // Skip logging, but access remains denied
    }

    await logAdministrationEvent({
      action: "ADMIN_AUTHORIZATION_DENIED",
      outcome: "DENIED",
      actorUserId: userId || null,
      targetType: "SecurityOperationsCenter",
      metadata: {
        denial_reason: reason,
        required_permission: requiredPermission,
        ip: safeIp
      }
    });
  } catch {
    console.error("Failed to record security access denied");
  }
}

/**
 * Main guard for canonical route layout/pages.
 */
export async function requireSecurityPermission(permission: SecurityPermission) {
  try {
    const sessionUser = await requireAuthenticatedUser();
    if (!sessionUser) {
      redirect("/login");
    }

    // 1. Force PostgreSQL authoritative check (override JWT)
    const validUserId = getValidSessionIdentity({ user: sessionUser });
    const dbUser = await getCurrentDatabaseUser(validUserId);
    if (!dbUser) {
      await recordSecurityAccessDenied(null, "SOC_ACCESS_DENIED_USER_NOT_FOUND", permission);
      redirect("/login");
    }

    // 2. Account status & Role resolution
    const policyResult = await assertAccountAllowedForSocAccess(dbUser);
    if (!policyResult.allowed) {
      await recordSecurityAccessDenied(dbUser.id, policyResult.reason as DenialCategory, permission);
      redirect("/dashboard"); // Redirect unauthorized verified users to standard dashboard
    }

    // 3. Permission evaluation
    const activePermissions = policyResult.permissions!;
    if (!canAccessSecurityPermission(activePermissions, permission)) {
      await recordSecurityAccessDenied(dbUser.id, "SOC_ACCESS_DENIED_PERMISSION", permission);
      redirect("/dashboard");
    }

    // 4. Step-up Authentication Enforcement
    // Privileged SOC operations require current-session MFA assurance.
    const mfa = await prisma.userMfa.findUnique({ where: { user_id: dbUser.id } });
    const sessionIat = getValidSessionTimestamp(sessionUser);
    
    // Password reset invalidates existing session security state
    // We use dbUser.updated_at > iat (with a 2 second buffer) to detect password changes or critical user updates
    if (sessionIat > 0 && dbUser.updated_at.getTime() > sessionIat + 2000) {
      redirect("/login");
    }

    // MFA reset invalidates existing session security state
    if (mfa && mfa.reset_at && sessionIat > 0 && mfa.reset_at.getTime() > sessionIat + 2000) {
      redirect("/login");
    }

    if (!mfa || mfa.status !== 'ENABLED') {
      redirect("/mfa-enroll");
    }

    try {
      const assurance = await requireCurrentSessionAal2();
      if (assurance.userId !== dbUser.id) {
        redirect("/mfa-challenge");
      }
    } catch (error) {
      if (error instanceof MfaSessionAssuranceRequiredError) {
        redirect("/mfa-challenge");
      }
      throw error;
    }

    // 5. Return explicit privacy-safe context
    return createPrivacySafeAuthorizationContext(dbUser, activePermissions);

  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'message' in e && e.message === 'NEXT_REDIRECT') {
      throw e; // Let Next.js handle redirect
    }
    // Any unexpected authorization service failure fails closed
    console.error("Authorization Service Failure");
    redirect("/dashboard");
  }
}

/**
 * Service-level authorization guard for SOC operations.
 * Returns true if allowed, false if denied. Denies by default.
 * Requires an explicit authenticated actorUserId from the caller.
 * Creates NO database or audit mutation.
 */
export async function assertSecurityPermissionForService(
  actorUserId: string,
  permission: SecurityPermission,
  db: Prisma.TransactionClient | PrismaClient = prisma
): Promise<boolean> {
  try {
    const dbUser = await db.user.findUnique({
      where: { id: actorUserId },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        status: true,
        updated_at: true,
      }
    });
    if (!dbUser) {
      return false;
    }

    const policyResult = await assertAccountAllowedForSocAccess(dbUser);
    if (!policyResult.allowed) {
      return false;
    }

    const activePermissions = policyResult.permissions!;
    if (!canAccessSecurityPermission(activePermissions, permission)) {
      return false;
    }

    const assurance = await getCurrentSessionAal2();
    if (!assurance || assurance.userId !== actorUserId) {
      return false;
    }

    return true;
  } catch {
    console.error("Service Authorization Failure");
    return false;
  }
}
