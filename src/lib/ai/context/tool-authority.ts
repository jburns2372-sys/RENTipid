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
  let message = `To cancel a booking:
1. Navigate to Dashboard > Bookings and select the booking you want to cancel.
2. Review the applicable cancellation policy and refund eligibility for your booking timeline.
3. Select 'Cancel Booking' and provide your explicit confirmation.
If the provider cancels, the renter receives a 100% full refund including security deposit and service fees.
Note: This Help Center explanation provides guidance and policy rules; the actual cancellation action must be confirmed by the authorized user on the specific booking record.`;

  if (toolKey !== 'cancelBooking') {
    const requirements = [
      tool.requiresConfirmation ? 'your explicit confirmation' : '',
      tool.requiresPolicy ? 'the applicable RENTipid policy check' : '',
    ].filter(Boolean).join(' and ');
    message = `Open the relevant record in RENTipid to request this action. The action is limited to authorized users${requirements ? ` and requires ${requirements}` : ''}; this Help Center explanation does not execute the action.`;
  }

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
