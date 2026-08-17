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
  specialistStates?: Readonly<Record<string, boolean>>;
  semanticContextLayerEnabled: boolean;
  semanticLexiconVersion: string;
  semanticMaxExpansions: number;
  semanticFuzzyMatchEnabled: boolean;
  semanticAdaptiveLearningEnabled: boolean;
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
  const providerMode = getVal('ai_provider_mode', 'openai'); // 'mock', 'openai', 'gemini', 'disabled'
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

  // Revision 2 specialist flags reuse the existing SystemSetting feature-control namespace.
  const specialistStates = Object.fromEntries(
    allSettings
      .filter(s => s.setting_key.startsWith('ai_specialist_') && s.setting_key.endsWith('_enabled'))
      .map(s => [s.setting_key, s.setting_value === 'true']),
  );

  // If DB is completely empty (first run), we might want to default everything to enabled.
  // For safety, we will assume true if not explicitly set to false in the DB.
  // A robust way is to just let the action seed them, but we'll use a fallback here if needed.

  const semanticContextLayerEnabled = getVal('ai_semantic_context_layer_enabled', 'true') === 'true';
  const semanticLexiconVersion = getVal('ai_semantic_lexicon_version', 'v1.1-SCL-01');
  const semanticMaxExpansions = parseInt(getVal('ai_semantic_max_expansions', '5'), 10);
  const semanticFuzzyMatchEnabled = getVal('ai_semantic_fuzzy_match_enabled', 'true') === 'true';

  return {
    globalEnabled,
    loggingEnabled,
    mockModeEnabled,
    providerMode,
    maxPermissionLevel,
    responseStyle,
    disclaimerText,
    enabledModules,
    enabledBots,
    specialistStates,
    semanticContextLayerEnabled,
    semanticLexiconVersion,
    semanticMaxExpansions,
    semanticFuzzyMatchEnabled,
    semanticAdaptiveLearningEnabled: getVal('ai_semantic_adaptive_learning_enabled', 'true') === 'true',
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
