import type { RetrievedKnowledgeMatch } from './knowledge-retrieval';
import type {
  CustomerQuestionIntent,
  RentipidQuestionClassification,
} from './question-classifier';
import {
  isCustomerAnswerableText,
  projectCustomerAnswerableText,
} from './customer-knowledge-projection';

export interface EvidenceSufficiencyInput {
  classification: RentipidQuestionClassification;
  question: string;
  evidence: readonly RetrievedKnowledgeMatch[];
  authorizedLiveContext?: string;
  liveEvidenceRef?: string;
}

export interface EvidenceSufficiencyResult {
  sufficient: boolean;
  reasons: readonly string[];
  evidenceRefs: readonly string[];
  requestedConcepts: readonly string[];
  supportedConcepts: readonly string[];
}

export interface AnswerAdequacyInput {
  classification: RentipidQuestionClassification;
  message: string;
  materialClaims: readonly { text: string; evidenceRefs: readonly string[] }[];
  safelyUncertain: boolean;
  evidence: readonly RetrievedKnowledgeMatch[];
  evidenceSufficiency: EvidenceSufficiencyResult;
  authorizedLiveContext?: string;
  liveEvidenceRef?: string;
}

export interface AnswerAdequacyResult {
  pass: boolean;
  reasons: readonly string[];
  procedureCount: number;
  conceptCount: number;
  requestedConcepts: readonly string[];
  coveredConcepts: readonly string[];
}

interface IntentProfile {
  subject: RegExp;
  evidence: RegExp;
  concepts: readonly { id: string; pattern: RegExp }[];
}

const INTENT_PROFILES: Partial<Record<CustomerQuestionIntent, IntentProfile>> = {
  BOOKING_PROCESS: {
    subject: /\b(?:book|booking|reserve|reservation)\b/i,
    evidence: /\bbooking (?:process|request)|send (?:a )?booking request|reserve\b/i,
    concepts: [
      { id: 'find-rental', pattern: /\b(?:browse|find|choose|select|listing)\b/i },
      { id: 'request-details', pattern: /\b(?:date|duration|request|reserve|reservation)\b/i },
      { id: 'provider-response', pattern: /\bprovider\b.{0,35}\b(?:approve|accept|confirm|review)|\b(?:approve|accept|confirm|review)\b.{0,35}\bprovider\b/i },
      { id: 'rental-fulfilment', pattern: /\b(?:payment|agreement|pickup|delivery|turnover|return|inspection)\b/i },
    ],
  },
  PROVIDER_PAYMENT_PROCESS: {
    subject: /\b(?:provider|payout|payment|earnings|paid)\b/i,
    evidence: /\b(?:provider payout|provider payment|rental earnings|payout process)\b/i,
    concepts: [
      { id: 'payout-eligibility', pattern: /\b(?:eligible|completed|approved|returned|inspection)\b/i },
      { id: 'payout-review', pattern: /\b(?:finance review|reviewed|manual|processed|processing)\b/i },
      { id: 'payout-status', pattern: /\b(?:my payouts|provider dashboard|status|statement)\b/i },
      { id: 'receive-payment', pattern: /\b(?:receive|paid|payout|transfer|earnings)\b/i },
    ],
  },
  CREATE_LISTING: {
    subject: /\b(?:list|listing|rental|item)\b/i,
    evidence: /\b(?:listing creation|create (?:a |new )?listing|provider listings|listing details|submit for review)\b/i,
    concepts: [
      { id: 'start-listing', pattern: /\b(?:provider listings|create new listing|start|create|add)\b/i },
      { id: 'listing-details', pattern: /\b(?:details|title|description|category|rate|location|photo)\b/i },
      { id: 'save-draft', pattern: /\bdraft\b/i },
      { id: 'submit-listing', pattern: /\b(?:submit|review|publish)\b/i },
    ],
  },
  REGISTRATION: {
    subject: /\b(?:register|sign up|account|join)\b/i,
    evidence: /\b(?:account creation|registration and onboarding|register|sign up)\b/i,
    concepts: [
      { id: 'account-details', pattern: /\b(?:name|email|mobile|address|location|details)\b/i },
      { id: 'accept-terms', pattern: /\b(?:terms|privacy)\b/i },
      { id: 'create-account', pattern: /\b(?:register|sign up|create|submit)\b/i },
      { id: 'sign-in', pattern: /\b(?:sign in|log in|account)\b/i },
    ],
  },
};

const DURATION_QUESTION = /\b(?:how long|duration|timeline|how many (?:days|hours|weeks)|when will)\b/i;
const DURATION_EVIDENCE = /\b(?:minute|hour|day|week|month|duration|timeline|within|by the next)\b/i;
const MATERIAL_STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'in', 'is', 'it',
  'of', 'on', 'or', 'rentipid', 'that', 'the', 'this', 'to', 'with', 'your',
]);

function refFor(match: RetrievedKnowledgeMatch): string {
  return `knowledge:${match.sourceKey}:${match.chunkKey}`;
}

function evidenceText(match: RetrievedKnowledgeMatch): string {
  return [match.sourceKey, match.title, match.module, match.topic, match.headingPath, match.content].join(' ');
}

function procedureCount(message: string): number {
  return (message.match(/^\d+[.)]\s+/gm) ?? []).length;
}

function requestedConcepts(classification: RentipidQuestionClassification): string[] {
  if (classification.intent === 'CATEGORY_ELIGIBILITY') {
    return classification.requestedCategoryTerms.length > 0
      ? [...classification.requestedCategoryTerms]
      : ['supported-rental-categories'];
  }
  return INTENT_PROFILES[classification.intent]?.concepts.map(concept => concept.id) ?? [];
}

function matchingConcepts(intent: CustomerQuestionIntent, text: string): string[] {
  return INTENT_PROFILES[intent]?.concepts
    .filter(concept => concept.pattern.test(text))
    .map(concept => concept.id) ?? [];
}

function supportsIntent(
  match: RetrievedKnowledgeMatch,
  classification: RentipidQuestionClassification,
  question: string,
): boolean {
  const text = evidenceText(match);
  const profile = INTENT_PROFILES[classification.intent];
  if (profile && !profile.evidence.test(text)) return false;
  if (classification.intent === 'CATEGORY_ELIGIBILITY') {
    return match.sourceKey === 'provider.marketplace-taxonomy'
      || /\bsupported rental categor(?:y|ies)\b/i.test(text);
  }
  if (classification.intent === 'GENERAL_RENTIPID') {
    const domainMatch = classification.domains.some(domain =>
      domain.toLowerCase() === match.module.toLowerCase());
    const evidenceTokens = new Set(normalizedTokens(text));
    const subjectMatch = normalizedTokens(question).some(token => evidenceTokens.has(token));
    return classification.domains.length === 0 || domainMatch || subjectMatch;
  }
  return true;
}

function contradictoryCategoryEvidence(evidence: readonly RetrievedKnowledgeMatch[]): boolean {
  const text = evidence.map(match => match.content).join('\n');
  const supported = new Set([...text.matchAll(/^[-*]\s+(.+?)\s+\([^)]+\):/gm)]
    .map(match => match[1].toLowerCase().trim()));
  const unsupported = new Set([...text.matchAll(/^[-*]\s+(.+?):\s+not supported\b/gim)]
    .map(match => match[1].toLowerCase().trim()));
  return [...supported].some(value => unsupported.has(value));
}

export function assessEvidenceSufficiency(input: EvidenceSufficiencyInput): EvidenceSufficiencyResult {
  const reasons: string[] = [];
  const requested = requestedConcepts(input.classification);

  if (input.classification.kind === 'LIVE_RENTIPID_STATE') {
    const sufficient = Boolean(input.authorizedLiveContext && input.liveEvidenceRef);
    return {
      sufficient,
      reasons: sufficient ? [] : ['AUTHORIZED_LIVE_EVIDENCE_MISSING'],
      evidenceRefs: sufficient && input.liveEvidenceRef ? [input.liveEvidenceRef] : [],
      requestedConcepts: requested,
      supportedConcepts: sufficient ? ['authorized-live-state'] : [],
    };
  }

  if (input.classification.kind !== 'STATIC_RENTIPID_KNOWLEDGE') {
    return {
      sufficient: false,
      reasons: ['STATIC_EVIDENCE_NOT_APPLICABLE'],
      evidenceRefs: [],
      requestedConcepts: requested,
      supportedConcepts: [],
    };
  }

  const customerSafe = input.evidence
    .map(match => ({ ...match, content: projectCustomerAnswerableText(match.content) }))
    .filter(match => match.customerProjected !== false
      && match.content.length > 0
      && isCustomerAnswerableText(match.content));
  if (customerSafe.length === 0) reasons.push('NO_APPROVED_CUSTOMER_EVIDENCE');

  const relevant = customerSafe.filter(match =>
    supportsIntent(match, input.classification, input.question));
  if (customerSafe.length > 0 && relevant.length === 0) reasons.push('EVIDENCE_INTENT_MISMATCH');

  if (input.classification.providerContext === 'EXISTING_PROVIDER'
    && input.classification.intent === 'CREATE_LISTING'
    && relevant.every(match => !/\b(?:listing|create|submit|publish|draft)\b/i.test(evidenceText(match)))) {
    reasons.push('EXISTING_PROVIDER_CONTEXT_NOT_SUPPORTED');
  }

  if (DURATION_QUESTION.test(input.question)
    && relevant.length > 0
    && relevant.every(match => !DURATION_EVIDENCE.test(match.content))) {
    reasons.push('REQUESTED_TIMELINE_NOT_SUPPORTED');
  }

  if (input.classification.intent === 'CATEGORY_ELIGIBILITY'
    && contradictoryCategoryEvidence(relevant)) {
    reasons.push('CONTRADICTORY_CATEGORY_EVIDENCE');
  }

  const combined = relevant.map(match => [match.headingPath, match.content].join(' ')).join('\n');
  const supported = matchingConcepts(input.classification.intent, combined);
  if (INTENT_PROFILES[input.classification.intent] && supported.length === 0) {
    reasons.push('NO_SUPPORTED_PROCESS_FACT');
  }

  return {
    sufficient: reasons.length === 0,
    reasons,
    evidenceRefs: relevant.map(refFor),
    requestedConcepts: requested,
    supportedConcepts: supported,
  };
}

function normalizedTokens(value: string): string[] {
  return (value.toLowerCase().match(/[a-z0-9]+/g) ?? [])
    .map(token => token.replace(/(?:ing|ed|es|s)$/, ''))
    .filter(token => token.length > 2 && !MATERIAL_STOP_WORDS.has(token));
}

function claimIsSupported(
  claim: { text: string; evidenceRefs: readonly string[] },
  input: AnswerAdequacyInput,
): boolean {
  if (claim.evidenceRefs.length === 0) return false;
  const documents = new Map(input.evidence.map(match => [refFor(match), evidenceText(match)]));
  if (input.liveEvidenceRef && input.authorizedLiveContext) {
    documents.set(input.liveEvidenceRef, input.authorizedLiveContext);
  }
  const support = claim.evidenceRefs.map(ref => documents.get(ref) ?? '').join(' ');
  if (!support.trim()) return false;
  const claimTokens = [...new Set(normalizedTokens(claim.text))];
  if (claimTokens.length === 0) return false;
  const supportTokens = new Set(normalizedTokens(support));
  const covered = claimTokens.filter(token => supportTokens.has(token)).length;
  return covered / claimTokens.length >= 0.6;
}

function addressesIntent(input: AnswerAdequacyInput): {
  pass: boolean;
  coveredConcepts: readonly string[];
} {
  const intent = input.classification.intent;
  const message = input.message;
  const profile = INTENT_PROFILES[intent];
  const covered = matchingConcepts(intent, message)
    .filter(concept => input.evidenceSufficiency.supportedConcepts.includes(concept));

  if (intent === 'CATEGORY_ELIGIBILITY') {
    const terms = input.classification.requestedCategoryTerms;
    const pass = terms.length === 0
      ? /\bsupported rental categories\b/i.test(message)
      : terms.every(term => {
        const root = term.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/s$/, '');
        return root.length > 1 && message.toLowerCase().includes(root);
      });
    return { pass, coveredConcepts: pass ? input.evidenceSufficiency.requestedConcepts : [] };
  }

  if (!profile) {
    return { pass: input.materialClaims.length > 0, coveredConcepts: covered };
  }

  const contextPreserved = input.classification.providerContext !== 'EXISTING_PROVIDER'
    || intent !== 'CREATE_LISTING'
    || !/\b(?:register as|provider onboarding|become a provider|kyc)\b/i.test(message);
  const genericDisclaimer = /\b(?:safety controls?|uses? controls|permission|general guidance|relevant module)\b/i
    .test(message)
    && !/\b(?:browse|choose|send|enter|save|submit|check|return|complete|open|receive|review|publish|create)\b/i
      .test(message);
  const supportedCount = input.evidenceSufficiency.supportedConcepts.length;
  const relativeCoverage = supportedCount === 0 ? 0 : covered.length / supportedCount;
  return {
    pass: profile.subject.test(message)
      && contextPreserved
      && !genericDisclaimer
      && covered.length > 0
      && relativeCoverage >= 0.5
      && input.materialClaims.length > 0,
    coveredConcepts: covered,
  };
}

export function validateAnswerAdequacy(input: AnswerAdequacyInput): AnswerAdequacyResult {
  const reasons: string[] = [];
  const intentResult = addressesIntent(input);

  if (!input.message.trim()) reasons.push('EMPTY_RESPONSE');
  if (!isCustomerAnswerableText(input.message)) reasons.push('INTERNAL_CONTENT');

  const categoryDisposition = input.classification.intent === 'CATEGORY_ELIGIBILITY'
    && intentResult.pass;
  if (input.safelyUncertain && input.evidenceSufficiency.sufficient && !categoryDisposition) {
    reasons.push('SAFE_UNCERTAINTY_WITH_SUFFICIENT_EVIDENCE');
  }
  if (!input.safelyUncertain && !input.evidenceSufficiency.sufficient) {
    reasons.push('ANSWER_WITH_INSUFFICIENT_EVIDENCE');
  }
  if (!input.safelyUncertain
    && input.materialClaims.some(claim => !claimIsSupported(claim, input))) {
    reasons.push('UNGROUNDED_CLAIM');
  }
  if (!input.safelyUncertain && !intentResult.pass) reasons.push('INTENT_NOT_ANSWERED');

  return {
    pass: reasons.length === 0,
    reasons,
    procedureCount: procedureCount(input.message),
    conceptCount: intentResult.coveredConcepts.length,
    requestedConcepts: input.evidenceSufficiency.requestedConcepts,
    coveredConcepts: intentResult.coveredConcepts,
  };
}
