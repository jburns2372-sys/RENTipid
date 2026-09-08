import { cancelBookingTool } from '@/lib/ai/tools/registry';
import type { GroundedAnswerResult } from './grounded-answer-composer';
import type { RentipidQuestionClassification } from './question-classifier';

const TOOLS = new Map([[cancelBookingTool.name, cancelBookingTool]]);

export function composeToolAuthorityExplanation(
  toolKey: string,
  classification: RentipidQuestionClassification,
): GroundedAnswerResult {
  const tool = TOOLS.get(toolKey);
  if (!tool) {
    return {
      message: 'The required RENTipid action is unavailable.',
      evidenceRefs: [],
      materialClaims: [],
      safelyUncertain: true,
      adequacyPassed: false,
      evidenceSufficient: false,
      answeredIntent: classification.intent,
      composerMode: 'DETERMINISTIC_FALLBACK',
      composerProvider: 'deterministic-tool-authority',
      verifierReasons: ['TOOL_AUTHORITY_UNAVAILABLE'],
    };
  }
  const requirements = [
    tool.requiresConfirmation ? 'your explicit confirmation' : '',
    tool.requiresPolicy ? 'the applicable RENTipid policy check' : '',
  ].filter(Boolean).join(' and ');
  const message = `Open the relevant booking in RENTipid to request cancellation. The action is limited to an authorized renter${requirements ? ` and requires ${requirements}` : ''}; this Help Center explanation does not cancel the booking.`;
  const ref = `tool:${tool.name}`;
  return {
    message,
    evidenceRefs: [ref],
    materialClaims: [{ text: message, evidenceRefs: [ref], supportingText: tool.description }],
    safelyUncertain: false,
    adequacyPassed: true,
    evidenceSufficient: true,
    answeredIntent: classification.intent,
    coveredEntities: [],
    composerMode: 'DETERMINISTIC_FALLBACK',
    composerProvider: 'deterministic-tool-authority',
    verifierReasons: [],
    retryUsed: false,
  };
}
