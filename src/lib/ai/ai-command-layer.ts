import { BotId, canUserAccessBot, MAX_ALLOWED_PERMISSION } from './ai-permissions';
import { checkGuardrails } from './ai-guardrails';
import { buildSafeContext } from './ai-context-builder';
import { getSystemPrompt } from './ai-prompts';
import { processMockAIRequest } from './mock-ai';
import { logAIInteraction } from './ai-logger';
import { getAISettings, isModuleAIEnabled, isBotEnabled } from './ai-settings-service';

export interface AIRequest {
  botId: BotId;
  prompt: string;
  module: string;
  recordId?: string;
  userRole?: string;
  userId?: string;
}

export interface AIResponse {
  success: boolean;
  message: string;
  isBlocked?: boolean;
}

export async function processAICommand(req: AIRequest): Promise<AIResponse> {
  const { botId, prompt, module, recordId, userRole, userId } = req;
  
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

  // Simulate Tool Dispatch Guard (Since actual tool dispatch is not implemented yet)
  // We check if the prompt explicitly tries to run a tool
  const toolMatch = prompt.match(/execute tool:\s*([a-zA-Z0-9_]+)/i);
  if (toolMatch) {
     const toolName = toolMatch[1];
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
  const safeContext = buildSafeContext(userRole, module, recordId);
  const systemPrompt = getSystemPrompt(botId, userRole || 'Guest', module);

  // 5. Execute AI
  let responseMessage = '';
  if (settings.providerMode === 'mock' || settings.mockModeEnabled) {
    responseMessage = await processMockAIRequest(botId, prompt, safeContext, systemPrompt);
  } else {
    // For Phase 7, default to mock even if configured otherwise, to prevent uncontrolled execution
    responseMessage = await processMockAIRequest(botId, prompt, safeContext, systemPrompt);
  }

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
