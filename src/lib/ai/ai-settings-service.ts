import { prisma } from './ai-logger';

export interface AISettings {
  globalEnabled: boolean;
  loggingEnabled: boolean;
  mockModeEnabled: boolean;
  providerMode: string;
  maxPermissionLevel: number;
  responseStyle: string;
  disclaimerText: string;
  enabledModules: string[];
  enabledBots: string[];
}

// In Next.js 14/15, we can use React cache or unstable_cache.
// We'll fetch settings per request (Next.js automatically dedupes fetch requests 
// or Prisma queries in some setups, but we can just query directly for now).

export async function getAISettings(): Promise<AISettings> {
  const allSettings = await prisma.systemSetting.findMany({
    where: {
      setting_key: {
        startsWith: 'ai_'
      }
    }
  });

  const getVal = (key: string, def: string) => 
    allSettings.find(s => s.setting_key === key)?.setting_value ?? def;

  // Global
  const globalEnabled = getVal('ai_global_enabled', 'true') === 'true';
  const loggingEnabled = getVal('ai_logging_enabled', 'true') === 'true';
  const mockModeEnabled = getVal('ai_mock_mode_enabled', 'true') === 'true';
  const providerMode = getVal('ai_provider_mode', 'mock'); // 'mock', 'openai', 'gemini', 'disabled'
  const maxPermissionLevel = parseInt(getVal('ai_max_permission', '3'), 10);
  const responseStyle = getVal('ai_response_style', 'Simple');
  const disclaimerText = getVal('ai_disclaimer_text', 'AI can assist and summarize but cannot make final decisions. Please verify information before acting.');
  
  // Modules (Format: ai_module_{moduleName}_enabled)
  const enabledModules = allSettings
    .filter(s => s.setting_key.startsWith('ai_module_') && s.setting_value === 'true')
    .map(s => s.setting_key.replace('ai_module_', '').replace('_enabled', ''));

  // Bots (Format: ai_bot_{botIdSafe}_enabled)
  const enabledBots = allSettings
    .filter(s => s.setting_key.startsWith('ai_bot_') && s.setting_value === 'true')
    .map(s => s.setting_key.replace('ai_bot_', '').replace('_enabled', ''));

  // If DB is completely empty (first run), we might want to default everything to enabled.
  // For safety, we will assume true if not explicitly set to false in the DB.
  // A robust way is to just let the action seed them, but we'll use a fallback here if needed.

  return {
    globalEnabled,
    loggingEnabled,
    mockModeEnabled,
    providerMode,
    maxPermissionLevel,
    responseStyle,
    disclaimerText,
    enabledModules,
    enabledBots
  };
}

export async function isModuleAIEnabled(module: string): Promise<boolean> {
  const modKey = module.toLowerCase().replace(/\s+/g, '-');
  const setting = await prisma.systemSetting.findUnique({
    where: { setting_key: `ai_module_${modKey}_enabled` }
  });
  // Default to true if not explicitly disabled
  return setting ? setting.setting_value === 'true' : true;
}

export async function isBotEnabled(botId: string): Promise<boolean> {
  const botKey = botId.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const setting = await prisma.systemSetting.findUnique({
    where: { setting_key: `ai_bot_${botKey}_enabled` }
  });
  // Default to true if not explicitly disabled
  return setting ? setting.setting_value === 'true' : true;
}
