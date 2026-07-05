// RENTipid AI Command Layer Placeholder Structure

export type AIPermissionLevel = 
  | 1 // Answer only
  | 2 // Suggest action
  | 3 // Prepare draft
  | 4 // Execute after user approval
  | 5 // Admin-only execution
  | 6 // Restricted / no automation

export interface AIBotConfig {
  name: string;
  description: string;
  maxPermissionLevel: AIPermissionLevel;
  modules: string[];
}

// Global registry of all specialized AI bots
export const AI_BOT_REGISTRY: Record<string, AIBotConfig> = {
  'RENTipid Concierge': {
    name: 'RENTipid Concierge',
    description: 'Help users find rentals using simple language and recommend categories.',
    maxPermissionLevel: 2,
    modules: ['homepage', 'search', 'browse']
  },
  'Onboarding Bot': {
    name: 'Onboarding Bot',
    description: 'Guide user or business provider through setup.',
    maxPermissionLevel: 3,
    modules: ['register', 'dashboard']
  },
  'Verification Bot': {
    name: 'Verification Bot',
    description: 'Check missing documents and explain requirements.',
    maxPermissionLevel: 2,
    modules: ['kyc', 'dashboard']
  },
  'Listing Builder Bot': {
    name: 'Listing Builder Bot',
    description: 'Generate title, description, tags, and listing checklist.',
    maxPermissionLevel: 4,
    modules: ['listings']
  },
  'Pricing Bot': {
    name: 'Pricing Bot',
    description: 'Suggest rental price, deposit, and late fee based on category and risk.',
    maxPermissionLevel: 2,
    modules: ['listings']
  },
  'Contract Bot': {
    name: 'Contract Bot',
    description: 'Generate rental agreement and explain terms.',
    maxPermissionLevel: 3,
    modules: ['bookings', 'agreements']
  },
  'Admin Copilot': {
    name: 'Admin Copilot',
    description: 'Summarize pending approvals and risk indicators.',
    maxPermissionLevel: 5,
    modules: ['admin', 'compliance']
  },
  'Dispute Bot': {
    name: 'Dispute Bot',
    description: 'Summarize evidence and create case timeline.',
    maxPermissionLevel: 3,
    modules: ['disputes', 'admin']
  },
  'SOC Bot': {
    name: 'SOC Bot',
    description: 'Flag suspicious activity, fake listings, abuse, and off-platform payment attempts.',
    maxPermissionLevel: 5,
    modules: ['security', 'admin']
  }
};

export const canAIPerformAction = (botName: string, requiredLevel: AIPermissionLevel): boolean => {
  const bot = AI_BOT_REGISTRY[botName];
  if (!bot) return false;
  return requiredLevel <= bot.maxPermissionLevel;
};
