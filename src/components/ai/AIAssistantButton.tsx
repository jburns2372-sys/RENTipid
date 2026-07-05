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
