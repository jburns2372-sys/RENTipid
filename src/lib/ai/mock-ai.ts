import { BotId } from './ai-permissions';

export async function processMockAIRequest(
  botId: BotId, 
  prompt: string, 
  contextStr: string,
  systemPrompt: string
): Promise<string> {
  // Delay slightly to simulate network request
  await new Promise(resolve => setTimeout(resolve, 800));

  // Look for retrieved knowledge in the context string
  const knowledgeMarker = "Approved Knowledge Context:\n";
  const knowledgeIdx = contextStr.indexOf(knowledgeMarker);
  
  if (knowledgeIdx !== -1) {
    const knowledgeText = contextStr.substring(knowledgeIdx + knowledgeMarker.length).trim();
    if (knowledgeText) {
      return `Based on approved RENTipid knowledge: ${knowledgeText}`;
    }
  }

  return "I don't have approved information to confirm that.";
}
