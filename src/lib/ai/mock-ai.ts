import { BotId } from './ai-permissions';
import { composeGroundedAnswer, type GroundedAnswerInput, type GroundedAnswerResult } from './context/grounded-answer-composer';

export async function processMockAIRequest(
  botId: BotId, 
  prompt: string, 
  contextStr: string,
  systemPrompt: string,
  grounding?: GroundedAnswerInput,
): Promise<GroundedAnswerResult> {
  // Delay slightly to simulate network request
  await new Promise(resolve => setTimeout(resolve, 800));

  void botId;
  void prompt;
  void contextStr;
  void systemPrompt;
  return composeGroundedAnswer(grounding ?? {
    question: prompt,
    effectiveQuestion: prompt,
    classification: 'AMBIGUOUS',
    evidence: [],
  });
}
