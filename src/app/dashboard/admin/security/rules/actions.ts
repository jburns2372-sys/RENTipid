'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RuleInitializationService } from "@/lib/security/rules/rule-initialization.service";
import { PrismaClient } from "@prisma/client";
import { hasPermission } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function initializeRulesAction() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = (session.user as any).id;
  
  // Verify user in DB to prevent stale JWT bypass
  const dbUser = await prisma.user.findUnique({ where: { id: userId }});
  
  if (!dbUser || dbUser.role !== 'Super Admin' || dbUser.status !== 'Verified') {
    // Audit log for denial
    if (dbUser) {
        await prisma.auditLog.create({
            data: {
                actor_user_id: userId,
                action: "UNAUTHORIZED_SOC_RULE_INITIALIZATION",
                module: "SECURITY_RULES",
                details: "Attempted to initialize SOC rules without Super Admin Verified status."
            }
        });
    }
    return { success: false, error: "Unauthorized: Requires Verified Super Admin." };
  }
  
  if (!hasPermission(dbUser.role as any, 'security_rules', 'initialize')) {
    return { success: false, error: "Unauthorized: Missing required permission security.rules.initialize." };
  }

  try {
    const results = await RuleInitializationService.initializeInitialDrafts(userId);
    revalidatePath("/dashboard/admin/security/rules");
    return { success: true, results };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
