import { PrismaClient } from '@prisma/client';

// Note: Avoid creating a new PrismaClient in production if you have a shared instance
// Assuming we create a local one here or we should import the shared one if available.
// For now, we will create a lightweight logger function. 
// A better practice is to pass the prisma instance.

const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export interface LogAIInteractionParams {
  userId?: string;
  botName: string;
  module: string;
  route?: string;
  prompt: string;
  responseSummary: string;
  actionRequested?: string;
  actionStatus?: string;
  permissionLevel: number;
}

export async function logAIInteraction(params: LogAIInteractionParams) {
  try {
    await prisma.aIBotLog.create({
      data: {
        user_id: params.userId,
        bot_name: params.botName,
        module: params.module,
        prompt: params.prompt,
        response_summary: params.responseSummary,
        action_requested: params.actionRequested,
        action_status: params.actionStatus,
        // The schema might not have route and permission_level directly in AIBotLog,
        // so we can append them to response_summary or action_requested if needed,
        // but let's stick to what's defined in the schema.
        // schema.prisma has: id, user_id, bot_name, module, prompt, response_summary, action_requested, action_status, created_at
      }
    });
  } catch (error) {
    console.error("Failed to log AI interaction:", error);
  }
}
