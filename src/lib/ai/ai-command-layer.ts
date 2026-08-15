import { randomUUID } from 'crypto';
import { BotId, canUserAccessBot, MAX_ALLOWED_PERMISSION } from './ai-permissions';
import { checkGuardrails } from './ai-guardrails';
import { buildSafeContext } from './ai-context-builder';
import { getSystemPrompt } from './ai-prompts';
import { retrieveApprovedKnowledge } from './context/knowledge-retrieval';
import { processMockAIRequest } from './mock-ai';
import { logAIInteraction } from './ai-logger';
import { getAISettings, isModuleAIEnabled, isBotEnabled } from './ai-settings-service';
import { resolveIntent } from './specialists/intent-resolver';
import { SpecialistAnswerClass, SpecialistRiskClass } from './specialists/contracts';
import { SpecialistSelectionError, unifiedAiSpecialistOrchestrator } from './specialists/orchestrator';
import { validateWithSupervisor } from './supervisor/stage';
import { resolveCurrentAiActor } from './authorization/actor';
export interface AIRequest {
  botId: BotId;
  prompt: string;
  module: string;
  recordId?: string;
  userRole?: string;
  userId?: string;
  sessionId?: string;
  caseId?: string;
  locale?: string;
  traceId?: string;
}

export interface AIResponse {
  success: boolean;
  message: string;
  isBlocked?: boolean;
}

export async function processAICommand(req: AIRequest): Promise<AIResponse> {
  const { botId, prompt, module, recordId, userId } = req;
  let userRole = req.userRole;

  // P5: JWT/browser role is never authoritative. Re-read the actor and role
  // for every personalized command, including resumed conversations.
  if (userId) {
    try {
      const actor = await resolveCurrentAiActor(userId);
      userRole = actor.role;
    } catch {
      return { success: false, message: 'Authenticated account is not authorized for AI access.', isBlocked: true };
    }
  }
  
  // 0. Fetch Current System Settings
  const settings = await getAISettings();

  // 1. Hard Settings Checks (Global, Provider, Module, Bot)
  if (!settings.globalEnabled || settings.providerMode === 'disabled') {
    return { success: false, message: "AI Assistant is currently disabled.", isBlocked: true };
  }

  const moduleEnabled = await isModuleAIEnabled(module);
  if (!moduleEnabled) {
    return { success: false, message: `AI Assistant is disabled for the ${module} module.`, isBlocked: true };
  }

  const botEnabled = await isBotEnabled(botId);
  if (!botEnabled) {
    return { success: false, message: `${botId} is currently disabled.`, isBlocked: true };
  }

  // 2. Permission Check
  if (!canUserAccessBot(userRole, botId)) {
    const errorMsg = `Unauthorized: Your role (${userRole || 'Guest'}) does not have access to ${botId}.`;
    await logAIInteraction({
      userId,
      botName: botId,
      module,
      prompt,
      responseSummary: "BLOCKED_UNAUTHORIZED",
      actionStatus: "Blocked",
      permissionLevel: settings.maxPermissionLevel
    });
    return { success: false, message: errorMsg, isBlocked: true };
  }

  // Phase 5K Integration: AIGuard
  const { AIGuard } = require('../security/detection/ai-guard');
  const { DetectionEvaluator } = require('../security/detection/evaluator');
  const aiGuard = new AIGuard(new DetectionEvaluator());

  // Check Prompt Injection
  const injectionCheck = aiGuard.checkPromptInjection(prompt, userId || 'anonymous', '127.0.0.1');
  if (injectionCheck.blocked) {
      return { success: false, message: 'Request blocked due to security policy violations.', isBlocked: true };
  }

  // P4 + Revision 2: resolve intent, exactly-one owner, and compatibility support subdomain.
  const resolvedIntent = resolveIntent(prompt);
  let specialistSelection;
  try {
    specialistSelection = unifiedAiSpecialistOrchestrator.select(resolvedIntent, settings.specialistStates ?? {});
  } catch (error) {
    if (!(error instanceof SpecialistSelectionError)) throw error;
    return {
      success: false,
      message: 'This specialist capability is currently unavailable. Your request was safely held.',
      isBlocked: true,
    };
  }
  const specialist = specialistSelection.supportSubdomain;
  if (!specialist) {
    return { success: false, message: 'No approved support specialist is available.', isBlocked: true };
  }

  // Existing explicit test-tool syntax remains a request only; it grants no authority.
  const toolMatch = prompt.match(/execute tool:\s*([a-zA-Z0-9_]+)/i);
  const requestedTool = toolMatch ? toolMatch[1] : undefined;
  // Authentication alone does not make an informational answer personalized.
  // Only an authorized record-scoped request raises the answer/risk class.
  const isRecordScoped = Boolean(userId && recordId);
  const answerClass: SpecialistAnswerClass = requestedTool ? 'ACTION' : isRecordScoped ? 'PERSONALIZED' : 'INFORMATION';
  const requestedRiskClass: SpecialistRiskClass = requestedTool
    ? 'T2_OPERATIONAL'
    : isRecordScoped
      ? 'T1_PERSONALIZED'
      : 'T0_INFORMATION';
  const permissionDecision = unifiedAiSpecialistOrchestrator.permissionFor(specialistSelection, {
    persistedRole: userRole ?? 'Guest',
    requestedKnowledgeDomains: specialist.knowledgeDomains,
    requestedTools: requestedTool ? [requestedTool] : [],
    requestedRiskClass,
    answerClass,
    rbacAuthorized: true,
  });

  // P4: AI Supervisor Validation Stage
  const supervisorResult = validateWithSupervisor({
    specialist,
    resolvedIntent,
    requestedTool,
    isConsequentialAction: !!requestedTool,
    ownershipValid: specialistSelection.ownership.primarySpecialistId === 'SupportSpecialist',
    specialistEnabled: true,
    permissionDecision,
    maturityLevel: specialistSelection.definition.maturityLevel,
    requestedRiskClass,
    answerClass,
  });

  if (supervisorResult.outcome !== 'PASS') {
    await logAIInteraction({
      userId,
      botName: botId,
      module,
      prompt,
      responseSummary: `SUPERVISOR_BLOCKED: ${supervisorResult.outcome} - ${supervisorResult.reason}`,
      actionStatus: supervisorResult.outcome,
      permissionLevel: settings.maxPermissionLevel
    });
    return { success: false, message: `Request blocked by AI Supervisor: ${supervisorResult.reason}`, isBlocked: true };
  }

  if (requestedTool) {
     const toolName = requestedTool;
     const session = {
         sessionId: 'session-' + Date.now(),
         authenticatedUserId: userId || 'anonymous',
         currentRole: userRole || 'Guest',
         authorizedResourceScope: [],
         expiration: Date.now() + 3600000,
         modelOrProvider: 'mock',
         allowedToolSet: [] // Empty toolset means all tools will be rejected as UNKNOWN
     };
     const toolAuth = aiGuard.authorizeToolExecution(session, toolName, userId || 'anonymous', '127.0.0.1');
     if (!toolAuth.authorized) {
         return { success: false, message: `Tool execution blocked: ${toolAuth.reason}`, isBlocked: true };
     }
  }

  // 3. Guardrail Check
  const guardrailCheck = checkGuardrails(prompt);
  if (!guardrailCheck.isSafe) {
    await logAIInteraction({
      userId,
      botName: botId,
      module,
      prompt,
      responseSummary: "BLOCKED_GUARDRAIL",
      actionStatus: "Blocked",
      permissionLevel: settings.maxPermissionLevel
    });
    return { success: false, message: guardrailCheck.reason || "Request blocked by safety guardrails.", isBlocked: true };
  }

  // 4. Build Context & System Prompt
  let safeContext = await buildSafeContext(userRole, module, recordId, userId);
  
  // 4.1 Knowledge Retrieval
  const retrievedKnowledge = await retrieveApprovedKnowledge(prompt, userRole);
  if (retrievedKnowledge) {
    safeContext += `\n\nApproved Knowledge Context:\n${retrievedKnowledge}`;
  }

  const systemPrompt = getSystemPrompt(botId, userRole || 'Guest', module);

  // 5. Logical specialist execution returns structured advice/draft only.
  const invocation = unifiedAiSpecialistOrchestrator.createInvocation(specialistSelection, {
    actorId: userId ?? 'anonymous',
    persistedRole: userRole ?? 'Guest',
    sessionId: req.sessionId ?? 'stateless-session',
    caseId: req.caseId,
    entityRefs: [],
    intent: specialistSelection.ownership.intent,
    answerClass,
    riskClass: requestedRiskClass,
    safeContext: {
      content: safeContext || 'No personalized context was required.',
      sourceRefs: [],
    },
    requestedTask: {
      code: 'RESPOND_TO_CONTROLLED_SUPPORT_INTENT',
      instruction: prompt,
    },
    allowedToolScopes: permissionDecision.effectiveAllowedTools,
    locale: req.locale,
    traceId: req.traceId ?? randomUUID(),
  });
  const execution = await unifiedAiSpecialistOrchestrator.invoke(specialistSelection, invocation, {
    execute: async specialistInvocation => ({
      status: 'COMPLETED',
      findings: [],
      evidenceRefs: specialistInvocation.safeContext.sourceRefs,
      toolRequests: [],
      draftResponse: await processMockAIRequest(
        botId,
        specialistInvocation.requestedTask.instruction,
        specialistInvocation.safeContext.content,
        systemPrompt,
      ),
      unresolvedFacts: [],
    }),
  });
  // SpecialistResultContract is not customer-facing. The Unified AI command layer
  // applies output protection and remains the sole final-response authority.
  let responseMessage = execution.result.draftResponse ?? "[Mock AI Mode] I don't have approved information to confirm that.";
  void execution.trace;

  // Phase 5K Integration: Output Filter
  const outputCheck = aiGuard.checkOutputProtection(responseMessage, userId || 'anonymous', '127.0.0.1');
  if (outputCheck.blocked) {
      return { success: false, message: 'Response blocked due to sensitive content policy.', isBlocked: true };
  }
  responseMessage = outputCheck.redactedOutput || responseMessage;

  // 6. Log Interaction
  if (settings.loggingEnabled) {
    await logAIInteraction({
      userId,
      botName: botId,
      module,
      prompt,
      responseSummary: responseMessage.substring(0, 200) + (responseMessage.length > 200 ? '...' : ''), 
      actionStatus: "Success",
      permissionLevel: settings.maxPermissionLevel
    });
  }

  return {
    success: true,
    message: responseMessage
  };
}
