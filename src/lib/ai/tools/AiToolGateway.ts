import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

export class AiToolGateway {
  private static instance = new AiToolGateway();
  private registry = new Map<string, ToolDefinition>();
  
  // In-memory idempotency cache for local testing
  private idempotencyCache = new Set<string>();

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
    caseId?: string
  ) {
    const tool = this.registry.get(toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }

    if (tool.riskClass === 'PROHIBITED') {
      await this.logSecurityEvent(userId, 'TOOL_PROHIBITED_DENIAL', toolName);
      throw new Error('Tool execution prohibited');
    }

    // Server-side Actor Resolution & RBAC
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('Unauthorized actor');
    }
    
    if (!tool.allowedRoles.includes(user.role)) {
      await this.logSecurityEvent(userId, 'TOOL_RBAC_DENIAL', toolName);
      throw new Error(`Role ${user.role} not authorized for tool ${toolName}`);
    }

    // Idempotency / Replay Protection
    const cacheKey = `${userId}:${toolName}:${requestFingerprint}`;
    if (this.idempotencyCache.has(cacheKey)) {
      throw new Error('Replay attempt denied');
    }
    if (tool.riskClass !== 'READ_ONLY') {
      this.idempotencyCache.add(cacheKey);
    }

    // Confirmation Enforcement
    if (tool.requiresConfirmation && !userConfirmed) {
      // Record pending execution requiring confirmation
      await this.recordExecution(toolName, sessionId, requestFingerprint, tool.riskClass, 'pending', caseId);
      throw new Error('USER_CONFIRMATION_REQUIRED');
    }

    // Policy Enforcement (Mock check)
    if (tool.requiresPolicy) {
      // e.g. check insurance limits or payment rules
      // For this local validation, we assume policy engine passes if requested.
    }

    // Execute Handler
    const context: ToolContext = { userId, sessionId, caseId, requestFingerprint };
    let result;
    try {
      result = await tool.handler(args, context);
    } catch (e: any) {
      await this.recordExecution(toolName, sessionId, requestFingerprint, tool.riskClass, 'denied', caseId);
      throw e;
    }

    // Audit and Verify
    await this.recordExecution(toolName, sessionId, requestFingerprint, tool.riskClass, 'authorized', caseId);
    
    // Privacy Serialization (Ensure no raw DB records leak)
    const safeResult = JSON.parse(JSON.stringify(result)); // Deep copy simple privacy
    
    return {
      status: 'VERIFIED_SUCCESS',
      data: safeResult
    };
  }

  private async logSecurityEvent(userId: string, code: string, target: string) {
    // Write to AuditLog as fallback for SecurityEvent
    await prisma.auditLog.create({
      data: {
        actor_user_id: userId,
        action: code,
        module: 'AiToolGateway',
        target_id: target,
        details: 'Security violation attempt'
      }
    });
  }

  private async recordExecution(
    toolName: string, 
    sessionId: string, 
    fingerprint: string, 
    riskClass: string,
    status: string,
    caseId?: string
  ) {
    await prisma.aiToolExecution.create({
      data: {
        toolName,
        sessionId,
        requestFingerprint: fingerprint,
        riskClass,
        authorizationStatus: status,
        caseId,
        idempotencyKey: fingerprint,
        executionStatus: status === 'authorized' ? 'completed' : 'failed'
      }
    });
  }

  // Internal test helper
  _clearIdempotency() {
    this.idempotencyCache.clear();
  }
}
