import type { RetrievedKnowledgeMatch } from './knowledge-retrieval';
import type { RentipidQuestionClassification } from './question-classifier';
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
  materialClaims: readonly {
    text: string;
    evidenceRefs: readonly string[];
    supportingText?: string;
  }[];
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

const DURATION_QUESTION = /\b(?:how long|duration|timeline|how many (?:days|hours|weeks)|when will)\b/i;
const DURATION_EVIDENCE = /\b(?:minute|hour|day|week|month|duration|timeline|within|by the next)\b/i;
const HOW_QUESTION = /\b(?:how|steps?|what happens|process)\b/i;
const SUPPORTED_ACTION =
  /\b(?:add|apply|browse|check|choose|complete|confirm|contact|create|enter|find|follow|open|provide|receive|register|request|return|review|save|select|send|sign|submit|upload|use|verify)\b/i;
const TOKEN_STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'can', 'for', 'from', 'in',
  'is', 'it', 'of', 'on', 'or', 'rentipid', 'that', 'the', 'this', 'to', 'with', 'your',
]);

function evidenceRef(match: RetrievedKnowledgeMatch): string {
  return `knowledge:${match.sourceKey}:${match.chunkKey}`;
}

function normalizeEntity(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/s\b/g, '');
}

function normalizeToken(token: string): string {
  if (token === 'paid' || token.startsWith('payment') || token.startsWith('payout')) return 'payment';
  if (token.startsWith('categor')) return 'category';
  if (token.startsWith('book')) return 'book';
  if (token.startsWith('list')) return 'list';
  if (token.endsWith('ies') && token.length > 4) return `${token.slice(0, -3)}y`;
  return token.replace(/(?:ing|ed|es|s)$/, '');
}

function tokens(value: string): string[] {
  return [...new Set(value.toLowerCase().match(/[a-z0-9]+/g) ?? [])]
    .map(normalizeToken)
    .filter(token => token.length > 2 && !TOKEN_STOP_WORDS.has(token));
}

function requestedEntities(
  classification: RentipidQuestionClassification,
  question: string,
  evidence: readonly RetrievedKnowledgeMatch[],
): string[] {
  if (classification.requestedCategoryTerms.length > 0) {
    return [...classification.requestedCategoryTerms];
  }
  if (classification.intent === 'CATEGORY_ELIGIBILITY') return [];
  const evidenceTokens = new Set(tokens(evidence.map(match => [
    match.sectionTitle,
    ...match.entities,
    match.content,
  ].join(' ')).join(' ')));
  return tokens(question).filter(token => evidenceTokens.has(token));
}

export function assessEvidenceSufficiency(input: EvidenceSufficiencyInput): EvidenceSufficiencyResult {
  if (input.classification.kind === 'LIVE_RENTIPID_STATE') {
    const sufficient = Boolean(input.authorizedLiveContext && input.liveEvidenceRef);
    return {
      sufficient,
      reasons: sufficient ? [] : ['AUTHORIZED_LIVE_EVIDENCE_MISSING'],
      evidenceRefs: sufficient && input.liveEvidenceRef ? [input.liveEvidenceRef] : [],
      requestedConcepts: [],
      supportedConcepts: sufficient ? ['authorized-live-state'] : [],
    };
  }
  if (input.classification.kind !== 'STATIC_RENTIPID_KNOWLEDGE') {
    return {
      sufficient: false,
      reasons: ['STATIC_EVIDENCE_NOT_APPLICABLE'],
      evidenceRefs: [],
      requestedConcepts: [],
      supportedConcepts: [],
    };
  }

  const customerEvidence = input.evidence.filter(match =>
    match.audience === 'CUSTOMER'
    && match.answerClass === 'INFORMATION'
    && projectCustomerAnswerableText(match.content, match.headingPath).length > 0);
  const questionTokens = new Set(tokens(input.question));
  const classifiedSubjectTokens = new Set(
    tokens(input.classification.intent.replace(/_/g, ' '))
      .filter(token => !['process', 'general', 'create', 'eligibility'].includes(token)),
  );
  const relevant = customerEvidence.filter(match => {
    if (match.evidenceRole !== 'SEED') return false;
    const subjectTokens = tokens([match.sectionTitle, ...match.entities, match.content].join(' '));
    const domainMatches = input.classification.domains.includes(match.module);
    const subjectMatches = classifiedSubjectTokens.size > 0
      ? [...classifiedSubjectTokens].every(token => subjectTokens.includes(token))
      : subjectTokens.some(token => questionTokens.has(token));
    return input.classification.intent === 'GENERAL_RENTIPID'
      ? domainMatches || subjectMatches
      : subjectMatches;
  });
  const reasons: string[] = [];
  if (customerEvidence.length === 0) reasons.push('NO_APPROVED_CUSTOMER_EVIDENCE');
  else if (relevant.length === 0) reasons.push('EVIDENCE_DOMAIN_OR_RETRIEVAL_MISMATCH');
  if (DURATION_QUESTION.test(input.question)
    && relevant.length > 0
    && relevant.every(match => !DURATION_EVIDENCE.test(match.content))) {
    reasons.push('REQUESTED_TIMELINE_NOT_SUPPORTED');
  }
  const requested = requestedEntities(input.classification, input.question, relevant);
  return {
    sufficient: reasons.length === 0,
    reasons,
    evidenceRefs: relevant.map(evidenceRef),
    requestedConcepts: requested,
    supportedConcepts: requested.filter(entity =>
      relevant.some(match => normalizeEntity(match.content).includes(normalizeEntity(entity)))),
  };
}

function claimSupported(
  claim: AnswerAdequacyInput['materialClaims'][number],
  input: AnswerAdequacyInput,
): boolean {
  if (claim.evidenceRefs.length === 0) return false;
  const documents = new Map(input.evidence.map(match => [evidenceRef(match), match.content]));
  if (input.liveEvidenceRef && input.authorizedLiveContext) {
    documents.set(input.liveEvidenceRef, input.authorizedLiveContext);
  }
  const cited = claim.evidenceRefs.map(ref => documents.get(ref) ?? '').join(' ');
  if (!cited) return false;
  if (claim.supportingText) {
    return normalizeEntity(cited).includes(normalizeEntity(claim.supportingText));
  }
  const citedTokens = new Set(tokens(cited));
  return tokens(claim.text).every(token => citedTokens.has(token));
}

function entitiesCovered(input: AnswerAdequacyInput): string[] {
  const message = normalizeEntity(input.message);
  return input.evidenceSufficiency.requestedConcepts.filter(entity =>
    message.includes(normalizeEntity(entity)));
}

function directlyAnswers(input: AnswerAdequacyInput, covered: readonly string[]): boolean {
  if (input.materialClaims.length === 0) return false;
  if (input.classification.intent === 'CATEGORY_ELIGIBILITY') {
    return covered.length === input.evidenceSufficiency.requestedConcepts.length;
  }
  if (input.classification.providerContext === 'EXISTING_PROVIDER'
    && /\b(?:become a provider|provider onboarding|register as a provider|complete kyc)\b/i.test(input.message)) {
    return false;
  }
  if (HOW_QUESTION.test(input.classification.effectiveQuestion)) {
    return input.materialClaims.some(claim => SUPPORTED_ACTION.test(claim.supportingText ?? claim.text));
  }
  return true;
}

export function validateAnswerAdequacy(input: AnswerAdequacyInput): AnswerAdequacyResult {
  const reasons: string[] = [];
  const covered = entitiesCovered(input);
  const categoryDisposition = input.classification.intent === 'CATEGORY_ELIGIBILITY'
    && covered.length === input.evidenceSufficiency.requestedConcepts.length;

  if (!input.message.trim()) reasons.push('EMPTY_RESPONSE');
  if (!isCustomerAnswerableText(input.message)) reasons.push('INTERNAL_CONTENT');
  if (input.safelyUncertain && input.evidenceSufficiency.sufficient && !categoryDisposition) {
    reasons.push('SAFE_UNCERTAINTY_WITH_SUFFICIENT_EVIDENCE');
  }
  if (!input.safelyUncertain && !input.evidenceSufficiency.sufficient) {
    reasons.push('ANSWER_WITH_INSUFFICIENT_EVIDENCE');
  }
  if (!input.safelyUncertain && input.materialClaims.some(claim => !claimSupported(claim, input))) {
    reasons.push('UNGROUNDED_CLAIM');
  }
  if (!input.safelyUncertain && !directlyAnswers(input, covered)) reasons.push('INTENT_NOT_ANSWERED');

  return {
    pass: reasons.length === 0,
    reasons,
    procedureCount: (input.message.match(/^\d+[.)]\s+/gm) ?? []).length,
    conceptCount: covered.length,
    requestedConcepts: input.evidenceSufficiency.requestedConcepts,
    coveredConcepts: covered,
  };
}
