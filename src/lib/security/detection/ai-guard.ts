import { getAIPolicyForTool, AIActionClassification } from './ai-policy';
import { DetectionEvaluator } from './evaluator';

interface AISession {
  sessionId: string;
  authenticatedUserId: string;
  currentRole: string;
  authorizedResourceScope: string[];
  expiration: number;
  modelOrProvider: string;
  allowedToolSet: string[];
}

export class AIGuard {
  private evaluator: DetectionEvaluator;
  // Local synthetic rate limiting store for session limits
  private sessionRateLimits = new Map<string, { count: number, resetAt: number }>();

  constructor(evaluator: DetectionEvaluator) {
    this.evaluator = evaluator;
  }

  public authorizeSession(session: AISession): boolean {
    if (Date.now() > session.expiration) {
      return false;
    }
    if (!session.authenticatedUserId || !session.currentRole) {
      return false;
    }
    return true;
  }

  public checkPromptInjection(prompt: string, userId: string, ipAddress: string): { blocked: boolean, reason?: string } {
    const lowerPrompt = prompt.toLowerCase();

    const blocklist = [
      'ignore previous instructions',
      'you are an administrator',
      'system prompt',
      'reveal your instructions',
      'database_url',
      'override policy',
      'bypass security',
      'the user approved this',
      'finance already authorized this'
    ];

    for (const phrase of blocklist) {
      if (lowerPrompt.includes(phrase)) {
        if (phrase === 'database_url') {
          this.evaluator.evaluateEvent({
            sourceType: 'AIBotLog',
            eventType: 'AI_SECRET_REQUEST_ATTEMPT',
            actorId: userId,
            ipAddress,
            payload: { reason: 'SECRET_EXTRACTION_REQUEST' },
            timestamp: Date.now()
          });
          return { blocked: true, reason: 'SECRET_REQUEST_BLOCKED' };
        } else if (phrase === 'system prompt' || phrase === 'reveal your instructions') {
          this.evaluator.evaluateEvent({
            sourceType: 'AIBotLog',
            eventType: 'AI_SYSTEM_PROMPT_EXTRACTION_ATTEMPT',
            actorId: userId,
            ipAddress,
            payload: { reason: 'SYSTEM_PROMPT_EXTRACTION' },
            timestamp: Date.now()
          });
          return { blocked: true, reason: 'SYSTEM_PROMPT_EXTRACTION_BLOCKED' };
        } else {
           this.evaluator.evaluateEvent({
            sourceType: 'AIBotLog',
            eventType: 'AI_PROMPT_INJECTION_DETECTED',
            actorId: userId,
            ipAddress,
            payload: { reason: 'DIRECT_PROMPT_INJECTION' },
            timestamp: Date.now()
          });
          return { blocked: true, reason: 'DIRECT_PROMPT_INJECTION_BLOCKED' };
        }
      }
    }

    // Simulate indirect injection detection
    if (lowerPrompt.includes('<<<inject')) {
        this.evaluator.evaluateEvent({
            sourceType: 'AIBotLog',
            eventType: 'AI_INDIRECT_INJECTION_DETECTED',
            actorId: userId,
            ipAddress,
            payload: { reason: 'INDIRECT_LISTING_INJECTION' },
            timestamp: Date.now()
        });
        return { blocked: true, reason: 'INDIRECT_LISTING_INJECTION_BLOCKED' };
    }
    return { blocked: false };
  }

  public checkOutputProtection(output: string, userId: string, ipAddress: string): { blocked: boolean, redactedOutput?: string } {
    const sensitivePatterns = [
      /sk-[a-zA-Z0-9]{32,}/g, // Mock API keys
      /postgres:\/\//i
    ];

    for (const pattern of sensitivePatterns) {
      if (pattern.test(output)) {
        this.evaluator.evaluateEvent({
          sourceType: 'AIBotLog',
          eventType: 'AI_SENSITIVE_OUTPUT_BLOCKED',
          actorId: userId,
          ipAddress,
          payload: { reason: 'SENSITIVE_OUTPUT_MATCH' },
          timestamp: Date.now()
        });
        return { blocked: true };
      }
    }

    if (output.includes('cross-user-data-123') && !output.includes(`user-${userId}`)) {
       this.evaluator.evaluateEvent({
          sourceType: 'AIBotLog',
          eventType: 'AI_CROSS_USER_ACCESS_ATTEMPT',
          actorId: userId,
          ipAddress,
          payload: { reason: 'CROSS_USER_OUTPUT_COUNT' },
          timestamp: Date.now()
        });
        return { blocked: true };
    }

    return { blocked: false, redactedOutput: output };
  }

  public authorizeToolExecution(session: AISession, toolName: string, targetResourceOwnerId: string, ipAddress: string): { authorized: boolean, reason?: string, classification?: AIActionClassification } {
    if (!this.authorizeSession(session)) {
      return { authorized: false, reason: 'EXPIRED_AI_SESSION_REJECTED' };
    }

    if (!session.allowedToolSet.includes(toolName)) {
      this.evaluator.evaluateEvent({
        sourceType: 'AIBotLog',
        eventType: 'AI_UNAUTHORIZED_TOOL_ATTEMPT',
        actorId: session.authenticatedUserId,
        ipAddress,
        payload: { tool: toolName, reason: 'UNKNOWN_TOOL_REQUEST' },
        timestamp: Date.now()
      });
      return { authorized: false, reason: 'UNKNOWN_AI_ACTION_PROHIBITED' };
    }

    const policy = getAIPolicyForTool(toolName);

    if (policy.classification === 'PROHIBITED') {
      this.evaluator.evaluateEvent({
        sourceType: 'AIBotLog',
        eventType: 'AI_HIGH_RISK_ACTION_ATTEMPT',
        actorId: session.authenticatedUserId,
        ipAddress,
        payload: { tool: toolName, reason: 'PROHIBITED_FINANCIAL_TOOL' },
        timestamp: Date.now()
      });
      return { authorized: false, reason: 'FINANCIAL_AI_ACTION_NOT_EXECUTED', classification: policy.classification };
    }

    if (policy.classification === 'HUMAN_APPROVAL_REQUIRED') {
      this.evaluator.evaluateEvent({
        sourceType: 'AIBotLog',
        eventType: 'AI_HIGH_RISK_ACTION_ATTEMPT',
        actorId: session.authenticatedUserId,
        ipAddress,
        payload: { tool: toolName, reason: 'HUMAN_APPROVAL_REQUIRED_TOOL' },
        timestamp: Date.now()
      });
      return { authorized: false, reason: 'HUMAN_APPROVAL_REQUIRED_ACTION_NOT_EXECUTED', classification: policy.classification };
    }

    if (policy.requiresResourceOwnershipCheck) {
      if (session.currentRole !== 'Admin' && targetResourceOwnerId !== session.authenticatedUserId) {
        this.evaluator.evaluateEvent({
          sourceType: 'AIBotLog',
          eventType: 'AI_CROSS_USER_ACCESS_ATTEMPT',
          actorId: session.authenticatedUserId,
          ipAddress,
          payload: { tool: toolName, reason: 'CROSS_USER_DATA_REQUEST' },
          timestamp: Date.now()
        });
        return { authorized: false, reason: 'CROSS_USER_RESOURCE_ACCESS_REJECTED', classification: policy.classification };
      }
    }

    // Rate Limit check
    const rateLimitKey = `${session.sessionId}:${toolName}`;
    const rlState = this.sessionRateLimits.get(rateLimitKey) || { count: 0, resetAt: Date.now() + 60000 };
    if (Date.now() > rlState.resetAt) {
      rlState.count = 0;
      rlState.resetAt = Date.now() + 60000;
    }
    rlState.count++;
    this.sessionRateLimits.set(rateLimitKey, rlState);

    if (rlState.count > policy.maxCallsPerTurn) {
      this.evaluator.evaluateEvent({
        sourceType: 'AIBotLog',
        eventType: 'AI_RATE_LIMIT_EXCEEDED',
        actorId: session.authenticatedUserId,
        ipAddress,
        payload: { tool: toolName, reason: 'TOOL_CALL_RATE_LIMIT_ENFORCED' },
        timestamp: Date.now()
      });
      return { authorized: false, reason: 'TOOL_CALL_RATE_LIMIT_ENFORCED', classification: policy.classification };
    }

    return { authorized: true, classification: policy.classification };
  }

  public checkRecursiveLoop(session: AISession, currentDepth: number): boolean {
    if (currentDepth > 5) { // MAX_RECURSIVE_TOOL_DEPTH
       this.evaluator.evaluateEvent({
          sourceType: 'AIBotLog',
          eventType: 'AI_RATE_LIMIT_EXCEEDED',
          actorId: session.authenticatedUserId,
          ipAddress: '0.0.0.0',
          payload: { reason: 'AI_TOOL_LOOP_LIMIT' },
          timestamp: Date.now()
        });
        return false;
    }
    return true;
  }

  public sanitizeLog(toolName: string, classification: string, rawPrompt: string): object {
    // Return sanitized object without raw prompts or outputs
    return {
      toolName,
      actionClassification: classification,
      sanitizedReason: 'PROMPT_REDACTED',
      timestamp: Date.now()
    };
  }

  public resetRateLimits() {
    this.sessionRateLimits.clear();
  }
}
