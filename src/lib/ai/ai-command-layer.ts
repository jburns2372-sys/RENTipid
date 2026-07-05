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
