import { resolveDomainIntent } from '@/lib/ai/specialists/intent-resolver';

export type RentipidQuestionClass =
  | 'STATIC_RENTIPID_KNOWLEDGE'
  | 'LIVE_RENTIPID_STATE'
  | 'OUT_OF_SCOPE_OR_UNSUPPORTED'
  | 'AMBIGUOUS';

export interface ConversationContextMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface RentipidQuestionClassification {
  kind: RentipidQuestionClass;
  effectiveQuestion: string;
  usedConversationContext: boolean;
  domains: readonly string[];
}

const LIVE_STATE_PATTERNS = [
  /\bmy\b.{0,50}\b(?:account|booking|payment|kyc|verification|claim|dispute|listing|payout|refund|deposit|transaction)\b/i,
  /\b(?:is|was|has|have|did|where)\b.{0,25}\bmy\b.{0,35}\b(?:approved|verified|paid|processed|completed|cancelled|canceled|refunded|payout|refund|status)\b/i,
  /\b(?:booking|payment|kyc|claim|dispute|listing|payout|refund|deposit|transaction)\s*(?:id|number|#)?\s*[-a-z]*\d[-a-z0-9]*/i,
  /\b(?:current|latest|pending|open|processed|completed|approved|verified)\b.{0,40}\b(?:state|status|booking|payment|kyc|claim|dispute|payout|refund|deposit|transaction)\b/i,
  /\b(?:booking|payment|kyc|claim|dispute|listing|payout|refund|deposit|transaction)(?:s| requests?)?\b.{0,40}\b(?:current|latest|pending|open|processed|completed|approved|verified|status|state|right now)\b/i,
];

const AMBIGUOUS_FOLLOW_UP =
  /^(?:and\s+)?(?:what|which|where|when|why|how|does|do|is|are|can)\b.{0,80}\b(?:it|that|this|they|them|those|documents?|requirements?|long|time|cost|next)\b[?.!]*$/i;

function lastUserContext(context: readonly ConversationContextMessage[]): string | undefined {
  return [...context]
    .reverse()
    .find(message => message.role === 'user' && message.content.trim())
    ?.content.trim()
    .slice(0, 800);
}

function looksAmbiguous(prompt: string): boolean {
  const words = prompt.trim().match(/[a-z0-9]+/gi) ?? [];
  return words.length <= 3
    || AMBIGUOUS_FOLLOW_UP.test(prompt.trim())
    || /\b(?:documents?|requirements?|how long|how much|what next|next step)\b/i.test(prompt)
    || /\b(?:it|that|this|those|them|same one|what about)\b/i.test(prompt);
}

export function isLiveRentipidQuestion(prompt: string): boolean {
  return LIVE_STATE_PATTERNS.some(pattern => pattern.test(prompt));
}

export function classifyRentipidQuestion(
  prompt: string,
  conversationContext: readonly ConversationContextMessage[] = [],
): RentipidQuestionClassification {
  const trimmed = prompt.trim();
  let effectiveQuestion = trimmed;
  let domains = resolveDomainIntent(trimmed);
  let usedConversationContext = false;

  if (domains.length === 0 && looksAmbiguous(trimmed)) {
    const previousUserQuestion = lastUserContext(conversationContext);
    if (previousUserQuestion) {
      effectiveQuestion = `${previousUserQuestion}\nFollow-up: ${trimmed}`;
      domains = resolveDomainIntent(effectiveQuestion);
      usedConversationContext = domains.length > 0 || /\brentipid\b/i.test(effectiveQuestion);
    }
  }

  if (isLiveRentipidQuestion(effectiveQuestion)) {
    return {
      kind: 'LIVE_RENTIPID_STATE',
      effectiveQuestion,
      usedConversationContext,
      domains,
    };
  }

  if (domains.length > 0 || /\brentipid\b/i.test(effectiveQuestion)) {
    return {
      kind: 'STATIC_RENTIPID_KNOWLEDGE',
      effectiveQuestion,
      usedConversationContext,
      domains,
    };
  }

  return {
    kind: looksAmbiguous(trimmed) ? 'AMBIGUOUS' : 'OUT_OF_SCOPE_OR_UNSUPPORTED',
    effectiveQuestion: trimmed,
    usedConversationContext: false,
    domains: [],
  };
}
