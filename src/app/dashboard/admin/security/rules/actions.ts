'use server';

import { RuleInitializationService } from "@/lib/security/rules/rule-initialization.service";
import { revalidatePath } from "next/cache";
import {
  requireAuthenticatedUser,
  getCurrentDatabaseUser,
  assertAccountAllowedForSocAccess,
  canAccessSecurityPermission,
  recordSecurityAccessDenied
} from "@/lib/security/authorization";
import { SECURITY_PERMISSIONS } from "@/lib/security/permissions";

export async function initializeRulesAction() {
  const sessionUser = await requireAuthenticatedUser();
  if (!sessionUser) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = (sessionUser as { id: string }).id;
  
  const dbUser = await getCurrentDatabaseUser(userId);
  if (!dbUser) {
    await recordSecurityAccessDenied(userId, "SOC_ACCESS_DENIED_USER_NOT_FOUND", SECURITY_PERMISSIONS.RULES_INITIALIZE);
    return { success: false, error: "Unauthorized: User not found." };
  }

  const policyResult = await assertAccountAllowedForSocAccess(dbUser as { status: string, role: string });
  if (!policyResult.allowed) {
    await recordSecurityAccessDenied(dbUser.id, policyResult.reason as Parameters<typeof recordSecurityAccessDenied>[1], SECURITY_PERMISSIONS.RULES_INITIALIZE);
    return { success: false, error: `Unauthorized: ${policyResult.reason}` };
  }

  const activePermissions = policyResult.permissions!;
  if (!canAccessSecurityPermission(activePermissions, SECURITY_PERMISSIONS.RULES_INITIALIZE)) {
    await recordSecurityAccessDenied(dbUser.id, "SOC_ACCESS_DENIED_PERMISSION", SECURITY_PERMISSIONS.RULES_INITIALIZE);
    return { success: false, error: "Unauthorized: Missing required permission security.rules.initialize." };
  }

  try {
    const results = await RuleInitializationService.initializeInitialDrafts(userId);
    revalidatePath("/dashboard/admin/security/rules");
    return { success: true, results };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
