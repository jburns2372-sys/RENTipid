import { BotId } from './ai-permissions';
import { composeGroundedAnswer, type GroundedAnswerInput, type GroundedAnswerResult } from './context/grounded-answer-composer';
import { composeCanonicalInformationAnswer } from './context/canonical-information-answer';

export async function processMockAIRequest(
  botId: BotId, 
  prompt: string, 
  contextStr: string,
  systemPrompt: string,
  grounding?: GroundedAnswerInput,
  providerMode?: string,
): Promise<GroundedAnswerResult> {
  // Delay slightly to simulate network request
  await new Promise(resolve => setTimeout(resolve, 800));

  void botId;
  void prompt;
  void contextStr;
  void systemPrompt;
  const groundedInput = grounding ?? {
    question: prompt,
    effectiveQuestion: prompt,
    classification: 'AMBIGUOUS',
    evidence: [],
  };
  if (providerMode) {
    return composeCanonicalInformationAnswer(groundedInput, {
      providerMode,
      systemPrompt,
      conversationContext: contextStr,
    });
  }
  return composeGroundedAnswer(groundedInput);
}
