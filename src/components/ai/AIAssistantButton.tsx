import React from 'react';
import RentipidAIAssistant from './RentipidAIAssistant';
import { getAISettings, isModuleAIEnabled, isBotEnabled } from '@/lib/ai/ai-settings-service';
import { getAllowedBotsForRole, BotId } from '@/lib/ai/ai-permissions';

interface AIAssistantButtonProps {
  context?: string;
  userRole?: string;
  recordId?: string;
}

export default async function AIAssistantButton({ context = 'General', userRole, recordId }: AIAssistantButtonProps) {
  try {
    return await renderAIAssistantButton({ context, userRole, recordId });
  } catch (error) {
    const details = serializeServerError(error);
    console.error('[ai-assistant-button] disabled after settings failure', details);
    return null;
  }
}

async function renderAIAssistantButton({ context = 'General', userRole, recordId }: AIAssistantButtonProps) {
  const settings = await getAISettings();

  // 1. Check Global Switch
  if (!settings.globalEnabled || settings.providerMode === 'disabled') {
    return null; // Hide the button completely
  }

  // 2. Check Module Switch
  const moduleEnabled = await isModuleAIEnabled(context);
  if (!moduleEnabled) {
    return null; // Hide the button if module is disabled
  }

  // 3. Filter Bots based on Role AND Bot Settings
  const roleBots = getAllowedBotsForRole(userRole);
  
  // Filter out globally disabled bots
  const finalBots: BotId[] = [];
  for (const bot of roleBots) {
    const enabled = await isBotEnabled(bot);
    if (enabled) {
      finalBots.push(bot);
    }
  }

  if (finalBots.length === 0) {
    return null; // Hide if no bots are available to the user
  }

  return (
    <RentipidAIAssistant 
      module={context} 
      userRole={userRole} 
      recordId={recordId} 
      allowedBots={finalBots}
      disclaimerText={settings.disclaimerText}
    />
  );
}

function serializeServerError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      code: 'code' in error ? String(error.code) : undefined,
      meta: 'meta' in error ? String(error.meta) : undefined,
      stack: error.stack,
    };
  }

  if (typeof error === 'object' && error !== null) {
    const candidate = error as Record<string, unknown>;
    return {
      name: typeof candidate.name === 'string' ? candidate.name : undefined,
      message: typeof candidate.message === 'string' ? candidate.message : undefined,
      code: typeof candidate.code === 'string' ? candidate.code : undefined,
      meta: typeof candidate.meta === 'string' ? candidate.meta : undefined,
      stack: typeof candidate.stack === 'string' ? candidate.stack : undefined,
    };
  }

  return { name: typeof error, message: String(error) };
}
