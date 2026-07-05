import { BotId } from './ai-permissions';

export async function processMockAIRequest(
  botId: BotId, 
  prompt: string, 
  contextStr: string,
  systemPrompt: string
): Promise<string> {
  // Simple mock logic simulating an LLM response based on keywords
  const lowerPrompt = prompt.toLowerCase();
  
  // Delay slightly to simulate network request
  await new Promise(resolve => setTimeout(resolve, 800));

  if (lowerPrompt.includes("what should i do next") || lowerPrompt.includes("next step")) {
    return "[Mock AI Mode] Based on your current context, you should review the pending actions in your dashboard and complete any outstanding requirements.";
  }
  
  if (lowerPrompt.includes("explain")) {
    return `[Mock AI Mode] Here is an explanation based on your module: ${contextStr}. (This is a predefined mock response because live AI is not activated).`;
  }
  
  if (lowerPrompt.includes("summarize")) {
    return `[Mock AI Mode] Summary: Everything looks to be in order. There are 2 pending items requiring your attention.`;
  }
  
  if (lowerPrompt.includes("missing")) {
    return `[Mock AI Mode] It looks like the Proof of Address document might be missing or under review. Please check your documents tab.`;
  }
  
  if (lowerPrompt.includes("draft") || lowerPrompt.includes("write")) {
    return `[Mock AI Mode] Here is a draft:\n\n"High-quality rental item perfect for your needs. Well maintained and ready for pickup."\n\n(Please review and edit before saving.)`;
  }

  return `[Mock AI Mode] I am the ${botId}. I received your message: "${prompt}". Because I am in Mock Mode, I can only provide predefined responses.`;
}
