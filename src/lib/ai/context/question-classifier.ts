import { resolveDomainIntent } from '@/lib/ai/specialists/intent-resolver';

export type RentipidQuestionClass =
  | 'STATIC_RENTIPID_KNOWLEDGE'
  | 'LIVE_RENTIPID_STATE'
  | 'CONSEQUENTIAL_ACTION'
  | 'OUT_OF_SCOPE_OR_UNSUPPORTED'
  | 'AMBIGUOUS';

export type CustomerQuestionIntent =
  | 'BOOKING_PROCESS'
  | 'PROVIDER_PAYMENT_PROCESS'
  | 'CREATE_LISTING'
  | 'CATEGORY_ELIGIBILITY'
  | 'REGISTRATION'
  | 'GENERAL_RENTIPID'
  | 'OUT_OF_SCOPE';

export type ProviderContext = 'EXISTING_PROVIDER' | 'PROVIDER_ONBOARDING' | 'UNSPECIFIED';

export interface ConversationContextMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface RentipidQuestionClassification {
  kind: RentipidQuestionClass;
  effectiveQuestion: string;
  usedConversationContext: boolean;
  domains: readonly string[];
  intent: CustomerQuestionIntent;
  providerContext: ProviderContext;
  requestedCategoryTerms: readonly string[];
}

const LIVE_STATE_PATTERNS = [
  /\bmy\b.{0,50}\b(?:account|booking|payment|kyc|verification|claim|dispute|listing|payout|refund|deposit|transaction)\b.{0,35}\b(?:status|state|failed|pending|approved|verified|paid|processed|completed|cancelled|canceled|refunded)\b/i,
  /\b(?:is|was|has|have|did|where)\b.{0,25}\bmy\b.{0,35}\b(?:approved|verified|paid|processed|completed|cancelled|canceled|refunded|payout|refund|status)\b/i,
  /\b(?:booking|payment|kyc|claim|dispute|listing|payout|refund|deposit|transaction)\s*(?:id|number|#)?\s*[-a-z]*\d[-a-z0-9]*/i,
  /\b(?:current|latest|pending|open|processed|completed|approved|verified)\b.{0,40}\b(?:state|status|booking|payment|kyc|claim|dispute|payout|refund|deposit|transaction)\b/i,
  /\b(?:booking|payment|kyc|claim|dispute|listing|payout|refund|deposit|transaction)(?:s| requests?)?\b.{0,40}\b(?:current|latest|pending|open|processed|completed|approved|verified|status|state|right now)\b/i,
];

const AMBIGUOUS_FOLLOW_UP =
  /^(?:and\s+)?(?:what|which|where|when|why|how|does|do|is|are|can)\b.{0,80}\b(?:it|that|this|they|them|those|documents?|requirements?|long|time|cost|next)\b[?.!]*$/i;

const EXISTING_PROVIDER =
  /\b(?:already|currently)\s+(?:(?:have|using)\s+)?(?:an?\s+)?(?:active\s+|registered\s+)?provider(?:\s+account|\s+profile)?\b|\bexisting\s+provider\b|\bprovider\s+(?:account|profile)\s+is\s+(?:active|approved|verified)\b/i;
const PROVIDER_ONBOARDING =
  /\b(?:become|register|sign\s*up|join|apply)\b.{0,35}\bprovider\b|\bnew\s+provider\b/i;
const CATEGORY_ELIGIBILITY =
  /\b(?:categor(?:y|ies)|allowed|eligible|can\s+i\s+(?:list|rent\s*out|offer)|types?\s+of\s+rentals?)\b|\b(?:item|type|rental|category)\b.{0,25}\bsupported\b|\bsupported\b.{0,25}\b(?:item|type|rental|category)\b/i;
const CREATE_LISTING =
  /\b(?:create|add|make|start|publish|list|offer|put)\b.{0,45}\b(?:listing|rental|item|equipment|something|another)\b|\b(?:list|rent\s*out|offer)\s+(?:an?\s+|another\s+)?(?:item|rental|something)\b/i;
const PROVIDER_PAYMENT =
  /\b(?:providers?|rental\s+earnings?)\b.{0,45}\b(?:paid|payment|payout|earnings?|receive)\b|\b(?:paid|payment|payout|earnings?|receive)\b.{0,45}\bproviders?\b|\breceive\b.{0,35}\brental\s+payment\b/i;
const BOOKING_PROCESS =
  /\b(?:booking\s+process|how\b.{0,30}\bbook(?:ing)?|what\s+happens\b.{0,30}\bbook|reserve\b.{0,35}\b(?:item|rental|something)|book\b.{0,35}\b(?:item|rental|something))\b/i;
const REGISTRATION =
  /\b(?:register|registration|sign\s*up|signup|create\s+(?:a|an|my)\s+(?:rentipid\s+)?account|join\s+rentipid)\b/i;
const CONSEQUENTIAL_ACTION =
  /^(?:please\s+)?(?:cancel|change|modify|extend|approve|reject|release|send|issue|process|pay|refund|delete)\b|\b(?:do|perform|complete)\s+(?:it|this)\s+(?:now|for\s+me)\b/i;

function providerContextFor(
  prompt: string,
  conversationContext: readonly ConversationContextMessage[],
): ProviderContext {
  if (EXISTING_PROVIDER.test(prompt)) return 'EXISTING_PROVIDER';
  if (PROVIDER_ONBOARDING.test(prompt)) return 'PROVIDER_ONBOARDING';
  const priorProviderStatement = [...conversationContext]
    .reverse()
    .find(message => message.role === 'user' && EXISTING_PROVIDER.test(message.content));
  return priorProviderStatement ? 'EXISTING_PROVIDER' : 'UNSPECIFIED';
}

function categoryTerms(prompt: string): string[] {
  const normalized = prompt
    .replace(/[?.!]/g, '')
    .replace(/\bfor\s+rent\b/gi, '')
    .trim();
  const match = normalized.match(/\b(?:list|rent\s*out|offer)\s+(.+)$/i);
  if (!match) return [];
  return match[1]
    .split(/\s*(?:,|\band\b|\bor\b)\s*/i)
    .map(value => value.replace(/^(?:a|an|the|my)\s+/i, '').trim())
    .filter(value => value.length > 1 && !/^(?:item|something|another\s+item)$/i.test(value));
}

function customerIntent(prompt: string): CustomerQuestionIntent {
  if (CATEGORY_ELIGIBILITY.test(prompt)) return 'CATEGORY_ELIGIBILITY';
  if (PROVIDER_PAYMENT.test(prompt)) return 'PROVIDER_PAYMENT_PROCESS';
  if (CREATE_LISTING.test(prompt)) return 'CREATE_LISTING';
  if (BOOKING_PROCESS.test(prompt)) return 'BOOKING_PROCESS';
  if (REGISTRATION.test(prompt)) return 'REGISTRATION';
  return 'GENERAL_RENTIPID';
}

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
  const providerContext = providerContextFor(trimmed, conversationContext);

  if ((domains.length === 0 && looksAmbiguous(trimmed))
    || (providerContext === 'EXISTING_PROVIDER' && CREATE_LISTING.test(trimmed))) {
    const previousUserQuestion = lastUserContext(conversationContext);
    if (previousUserQuestion && previousUserQuestion !== trimmed) {
      effectiveQuestion = `${previousUserQuestion}\nFollow-up: ${trimmed}`;
      domains = resolveDomainIntent(effectiveQuestion);
      usedConversationContext = true;
    }
  }

  const intent = customerIntent(effectiveQuestion);
  const intentDomains: Partial<Record<CustomerQuestionIntent, readonly string[]>> = {
    BOOKING_PROCESS: ['Marketplace'],
    PROVIDER_PAYMENT_PROCESS: ['Payments', 'Finance'],
    CREATE_LISTING: ['Marketplace'],
    CATEGORY_ELIGIBILITY: ['Marketplace'],
    REGISTRATION: ['Core', 'Profile'],
  };
  domains = [...new Set([...domains, ...(intentDomains[intent] ?? [])])];
  const requestedCategoryTerms = intent === 'CATEGORY_ELIGIBILITY' ? categoryTerms(trimmed) : [];

  if (CONSEQUENTIAL_ACTION.test(trimmed)) {
    return {
      kind: 'CONSEQUENTIAL_ACTION',
      effectiveQuestion,
      usedConversationContext,
      domains,
      intent,
      providerContext,
      requestedCategoryTerms,
    };
  }

  if (isLiveRentipidQuestion(effectiveQuestion)) {
    return {
      kind: 'LIVE_RENTIPID_STATE',
      effectiveQuestion,
      usedConversationContext,
      domains,
      intent,
      providerContext,
      requestedCategoryTerms,
    };
  }

  if (domains.length > 0 || /\brentipid\b/i.test(effectiveQuestion)) {
    return {
      kind: 'STATIC_RENTIPID_KNOWLEDGE',
      effectiveQuestion,
      usedConversationContext,
      domains,
      intent,
      providerContext,
      requestedCategoryTerms,
    };
  }

  return {
    kind: looksAmbiguous(trimmed) ? 'AMBIGUOUS' : 'OUT_OF_SCOPE_OR_UNSUPPORTED',
    effectiveQuestion: trimmed,
    usedConversationContext: false,
    domains: [],
    intent: 'OUT_OF_SCOPE',
    providerContext,
    requestedCategoryTerms: [],
  };
}
