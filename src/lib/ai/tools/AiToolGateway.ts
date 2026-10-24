import { createHash } from 'crypto';
import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type ToolRiskClass = 'READ_ONLY' | 'DRAFT_ONLY' | 'CASE_ACTION' | 'CONFIRMED_ACTION' | 'POLICY_REQUIRED' | 'PROHIBITED';

export interface ToolDefinition {
  name: string;
  riskClass: ToolRiskClass;
  description: string;
  allowedRoles: string[];
  requiresConfirmation?: boolean;
  requiresPolicy?: boolean;
  handler: (args: any, context: ToolContext) => Promise<any>;
}

export interface ToolContext {
  userId: string;
  sessionId: string;
  caseId?: string;
  requestFingerprint: string;
}

function isUniqueConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export class AiToolGateway {
  private static instance = new AiToolGateway();
  private registry = new Map<string, ToolDefinition>();

  constructor(private readonly db: PrismaClient = prisma) {}

  static getInstance() {
    return this.instance;
  }

  registerTool(def: ToolDefinition) {
    this.registry.set(def.name, def);
  }

  async executeTool(
    toolName: string,
    args: any,
    sessionId: string,
    userId: string,
    requestFingerprint: string,
    userConfirmed: boolean = false,
    caseId?: string,
  ) {
    const tool = this.registry.get(toolName);
    if (!tool) throw new Error(`Tool ${toolName} not found`);

    if (tool.riskClass === 'PROHIBITED') {
      await this.logSecurityEvent(userId, 'TOOL_PROHIBITED_DENIAL', toolName);
      throw new Error('Tool execution prohibited');
    }

    // P4/P5 continuity: the persisted actor and current role are re-read for
    // every execution. Neither conversation metadata nor a client role is used.
    const user = await this.db.user.findUnique({ where: { id: userId }, select: { id: true, role: true, status: true } });
    if (!user || user.status === 'Suspended' || user.status === 'Blacklisted') {
      throw new Error('Unauthorized actor');
    }
    if (!tool.allowedRoles.includes(user.role)) {
      await this.logSecurityEvent(userId, 'TOOL_RBAC_DENIAL', toolName);
      throw new Error(`Role ${user.role} not authorized for tool ${toolName}`);
    }

    if (tool.requiresConfirmation && !userConfirmed) {
      await this.recordExecution(toolName, sessionId, requestFingerprint, tool.riskClass, 'pending', 'pending', caseId);
      throw new Error('USER_CONFIRMATION_REQUIRED');
    }

    let claimedExecutionId: string | undefined;
    if (tool.riskClass !== 'READ_ONLY') {
      claimedExecutionId = await this.claimConsequentialExecution(
        toolName,
        sessionId,
        userId,
        requestFingerprint,
        tool.riskClass,
        caseId,
      );
    }

    const context: ToolContext = { userId, sessionId, caseId, requestFingerprint };
    try {
      // Policy and confirmation authority remain outside the handler. Existing
      // policy-enabled tools continue to evaluate their deterministic policy.
      const result = await tool.handler(args, context);

      if (claimedExecutionId) {
        await this.db.aiToolExecution.update({
          where: { id: claimedExecutionId },
          data: {
            authorizationStatus: 'authorized',
            executionStatus: 'success',
            verificationStatus: 'verified',
            completedAt: new Date(),
          },
        });
      } else {
        await this.recordExecution(toolName, sessionId, requestFingerprint, tool.riskClass, 'authorized', 'success', caseId);
      }

      return { status: 'VERIFIED_SUCCESS', data: JSON.parse(JSON.stringify(result)) };
    } catch (error) {
      if (claimedExecutionId) {
        await this.db.aiToolExecution.update({
          where: { id: claimedExecutionId },
          data: { executionStatus: 'failed', verificationStatus: 'unverified', completedAt: new Date() },
        });
      }
      throw error;
    }
  }

  private async claimConsequentialExecution(
    toolName: string,
    sessionId: string,
    userId: string,
    fingerprint: string,
    riskClass: string,
    caseId?: string,
  ) {
    const idempotencyKey = `ai-tool-v1:${createHash('sha256').update(`${userId}|${toolName}|${fingerprint}`).digest('hex')}`;
    try {
      const execution = await this.db.aiToolExecution.create({
        data: {
          toolName,
          sessionId,
          requestFingerprint: fingerprint,
          riskClass,
          authorizationStatus: 'authorized',
          caseId,
          idempotencyKey,
          executionStatus: 'executing',
        },
      });
      return execution.id;
    } catch (error) {
      if (!isUniqueConflict(error)) throw error;
      const existing = await this.db.aiToolExecution.findUnique({ where: { idempotencyKey } });
      throw new Error(`Replay attempt denied: durable execution is ${existing?.executionStatus ?? 'recorded'}`);
    }
  }

  private async logSecurityEvent(userId: string, code: string, target: string) {
    await this.db.auditLog.create({
      data: {
        actor_user_id: userId,
        action: code,
        module: 'AiToolGateway',
        target_id: target,
        details: 'Security violation attempt',
      },
    });
  }

  private async recordExecution(
    toolName: string,
    sessionId: string,
    fingerprint: string,
    riskClass: string,
    authorizationStatus: string,
    executionStatus: string,
    caseId?: string,
  ) {
    return this.db.aiToolExecution.create({
      data: {
        toolName,
        sessionId,
        requestFingerprint: fingerprint,
        riskClass,
        authorizationStatus,
        caseId,
        idempotencyKey: null,
        executionStatus,
        completedAt: executionStatus === 'success' ? new Date() : null,
      },
    });
  }

  _clearIdempotency() {
    // Compatibility no-op: idempotency authority is durable.
  }
}
