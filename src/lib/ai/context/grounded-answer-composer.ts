import type { RentipidQuestionClass } from './question-classifier';
import type { RetrievedKnowledgeMatch } from './knowledge-retrieval';
import { tokenizeKnowledgeText } from './knowledge-retrieval';
import { classifyRentipidQuestion, type RentipidQuestionClassification } from './question-classifier';
import {
  assessEvidenceSufficiency,
  validateAnswerAdequacy,
  type AnswerAdequacyResult,
} from './answer-adequacy';

export interface GroundedAnswerDiagnostic {
  classification: RentipidQuestionClass;
  intent: RentipidQuestionClassification['intent'];
  evidenceRefs: readonly string[];
  projectedEvidence: readonly string[];
  evidenceSufficient: boolean;
  evidenceSufficiencyReasons: readonly string[];
  preAdequacyAnswer: string;
  procedureCount: number;
  conceptCount: number;
  requestedConcepts: readonly string[];
  adequacyReasons: readonly string[];
  recompositionAttempted: boolean;
  finalAnswer: string;
}

export interface GroundedMaterialClaim {
  text: string;
  evidenceRefs: readonly string[];
}

export interface GroundedAnswerInput {
  question: string;
  effectiveQuestion: string;
  classification: RentipidQuestionClass;
  evidence: readonly RetrievedKnowledgeMatch[];
  authorizedLiveContext?: string;
  liveEvidenceRef?: string;
  questionAnalysis?: RentipidQuestionClassification;
  onDiagnostic?: (diagnostic: GroundedAnswerDiagnostic) => void;
}

export interface GroundedAnswerResult {
  message: string;
  evidenceRefs: readonly string[];
  materialClaims: readonly GroundedMaterialClaim[];
  safelyUncertain: boolean;
  adequacyPassed?: boolean;
  evidenceSufficient?: boolean;
  compositionAttempts?: 1 | 2;
}

const INTERNAL_CONTENT =
  /\b(?:source key|chunk id|registry id|database|migration|commit|oat|test suite|implementation detail|internal telemetry|phase\s*\d+|pass\s*\d*|taxonomy|fixture|ingested|canonical|sample users|provider reads|negative test)\b/i;
const DURATION_QUESTION = /\b(?:how long|duration|timeline|how many (?:days|hours|weeks)|when will)\b/i;
const DURATION_EVIDENCE = /\b(?:minute|minutes|hour|hours|day|days|week|weeks|month|months|duration|timeline|within|by the next)\b/i;

function evidenceRef(match: RetrievedKnowledgeMatch): string {
  return `knowledge:${match.sourceKey}:${match.chunkKey}`;
}

function simpleEnglish(value: string): string {
  return value
    .replace(/\[([^\]]+)]\([^\s)]+\)/g, '$1')
    .replace(/[`*_>#]/g, '')
    .replace(/\bauthenticated users?\b/gi, 'signed-in users')
    .replace(/\bpasswords?\b/gi, 'sign-in secrets')
    .replace(/\bauthorization\b/gi, 'permission')
    .replace(/\bworkflow\b/gi, 'process')
    .replace(/\bworkflows\b/gi, 'processes')
    .replace(/\bUI\b/g, 'screen')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[;:,.\-\s]+|[;:,\-\s]+$/g, '');
}

function safeLine(value: string): string | null {
  const clean = simpleEnglish(value);
  if (!clean || clean.length < 12 || clean.length > 280 || INTERNAL_CONTENT.test(clean)) return null;
  return /[.!?]$/.test(clean) ? clean : `${clean}.`;
}

interface CandidateClaim {
  text: string;
  ref: string;
  score: number;
  ordinal: number;
}

function procedureIntro(analysis: RentipidQuestionClassification): string {
  if (analysis.intent === 'BOOKING_PROCESS') return 'Booking on RENTipid works like this:';
  if (analysis.intent === 'PROVIDER_PAYMENT_PROCESS') return 'Providers receive rental payment through this payout process:';
  if (analysis.intent === 'CREATE_LISTING' && analysis.providerContext === 'EXISTING_PROVIDER') {
    return 'Since you already have a provider account, create the listing like this:';
  }
  if (analysis.intent === 'CREATE_LISTING') return 'Create a rental listing like this:';
  if (analysis.intent === 'REGISTRATION') return 'Create a RENTipid account like this:';
  return 'Here is what to do:';
}

function answerIntentScore(
  match: RetrievedKnowledgeMatch,
  analysis: RentipidQuestionClassification,
): number {
  const text = [match.sourceKey, match.topic, match.headingPath, match.content].join(' ');
  if (analysis.intent === 'BOOKING_PROCESS' && /\bbooking process|send a booking request\b/i.test(text)) return 30;
  if (analysis.intent === 'PROVIDER_PAYMENT_PROCESS' && /\bprovider payout process\b/i.test(text)) return 30;
  if (analysis.intent === 'CREATE_LISTING' && /\blisting creation|create new listing\b/i.test(text)) return 30;
  if (analysis.intent === 'REGISTRATION' && /\baccount creation\b/i.test(text)) return 30;
  return 0;
}

function relevanceScore(text: string, questionTokens: readonly string[]): number {
  const tokens = new Set(tokenizeKnowledgeText(text));
  return questionTokens.reduce((score, token) => score + (tokens.has(token) ? 1 : 0), 0);
}

function extractSteps(match: RetrievedKnowledgeMatch, questionTokens: readonly string[]): CandidateClaim[] {
  const ref = evidenceRef(match);
  return match.content
    .split(/\r?\n/)
    .map((line, ordinal) => ({ line, ordinal }))
    .filter(({ line }) => /^\s*\d+[.)]\s+/.test(line))
    .map(({ line, ordinal }) => {
      const text = safeLine(line.replace(/^\s*\d+[.)]\s+/, ''));
      return text ? { text, ref, score: relevanceScore(text, questionTokens), ordinal } : null;
    })
    .filter((claim): claim is CandidateClaim => claim !== null);
}

function extractSentences(match: RetrievedKnowledgeMatch, questionTokens: readonly string[]): CandidateClaim[] {
  const ref = evidenceRef(match);
  return match.content
    .split(/(?:(?<=[.!?])\s+|\r?\n+)/)
    .map((sentence, ordinal) => {
      const text = safeLine(sentence);
      return text ? { text, ref, score: relevanceScore(text, questionTokens), ordinal } : null;
    })
    .filter((claim): claim is CandidateClaim => claim !== null);
}

function staticAnswer(input: GroundedAnswerInput): GroundedAnswerResult {
  const requiresDuration = DURATION_QUESTION.test(input.question);
  if (input.evidence.length === 0) {
    return {
      message: requiresDuration
        ? "I don't have an approved RENTipid timeline for that yet."
        : "I don't have enough approved RENTipid information to answer that. Could you be more specific?",
      evidenceRefs: [],
      materialClaims: [],
      safelyUncertain: true,
    };
  }

  const questionTokens = tokenizeKnowledgeText(input.effectiveQuestion);
  const analysis = input.questionAnalysis ?? classifyRentipidQuestion(input.effectiveQuestion);
  const eligibleEvidence = requiresDuration
    ? input.evidence.filter(match => DURATION_EVIDENCE.test(match.content))
    : input.evidence;
  if (eligibleEvidence.length === 0) {
    return {
      message: "I don't have an approved RENTipid timeline for that yet.",
      evidenceRefs: [],
      materialClaims: [],
      safelyUncertain: true,
    };
  }

  if (analysis.intent === 'CATEGORY_ELIGIBILITY') {
    return categoryAnswer(input, analysis);
  }

  const procedural = ['BOOKING_PROCESS', 'PROVIDER_PAYMENT_PROCESS', 'CREATE_LISTING', 'REGISTRATION']
    .includes(analysis.intent)
    || /\b(?:how|steps?|start|create|register|list|publish|edit|change|update|submit|need)\b/i.test(input.question);
  const rankedEvidence = [...eligibleEvidence].sort((left, right) => {
    const intentDifference = answerIntentScore(right, analysis) - answerIntentScore(left, analysis);
    if (intentDifference !== 0) return intentDifference;
    const leftCustomerSource = ['MANUAL', 'PUBLISHED_GUIDANCE'].includes(left.sourceType) ? 1 : 0;
    const rightCustomerSource = ['MANUAL', 'PUBLISHED_GUIDANCE'].includes(right.sourceType) ? 1 : 0;
    return rightCustomerSource - leftCustomerSource || right.score - left.score;
  });

  if (procedural) {
    for (const match of rankedEvidence) {
      const steps = extractSteps(match, questionTokens);
      if (steps.length >= 2) {
        const selected = steps.slice(0, 4);
        const intentMessage = procedureIntro(analysis) + '\n'
          + selected.map((step, index) => (index + 1) + '. ' + step.text).join('\n');
        return {
          message: intentMessage,
          evidenceRefs: [...new Set(selected.map(step => step.ref))],
          materialClaims: selected.map(step => ({ text: step.text, evidenceRefs: [step.ref] })),
          safelyUncertain: false,
        };
      }
    }
  }

  const candidates = rankedEvidence
    .flatMap(match => extractSentences(match, questionTokens))
    .filter(claim => !requiresDuration || DURATION_EVIDENCE.test(claim.text))
    .sort((left, right) => right.score - left.score || left.ordinal - right.ordinal);
  const selected: CandidateClaim[] = [];
  const seen = new Set<string>();
  for (const claim of candidates) {
    const key = claim.text.toLowerCase();
    if (seen.has(key)) continue;
    if (selected.length > 0 && claim.score === 0) continue;
    seen.add(key);
    selected.push(claim);
    if (selected.length === 2) break;
  }
  if (selected.length === 0) {
    return {
      message: "I don't have enough approved RENTipid information to answer that. Could you be more specific?",
      evidenceRefs: [],
      materialClaims: [],
      safelyUncertain: true,
    };
  }

  return {
    message: selected.map(claim => claim.text).join(' '),
    evidenceRefs: [...new Set(selected.map(claim => claim.ref))],
    materialClaims: selected.map(claim => ({ text: claim.text, evidenceRefs: [claim.ref] })),
    safelyUncertain: false,
  };
}

interface RentalCategory {
  name: string;
  slug: string;
  subcategories: readonly string[];
  ref: string;
}

function normalizedCategory(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/s$/, '');
}

function rentalCategories(evidence: readonly RetrievedKnowledgeMatch[]): RentalCategory[] {
  const categories: RentalCategory[] = [];
  for (const match of evidence) {
    for (const line of match.content.split(/\r?\n/)) {
      const parsed = line.match(/^[-*]\s+(.+?)\s+\(([^)]+)\):\s*(.+)$/);
      if (!parsed) continue;
      categories.push({
        name: parsed[1].trim(),
        slug: parsed[2].trim(),
        subcategories: parsed[3].split(',').map(value => value.trim()),
        ref: evidenceRef(match),
      });
    }
  }
  return categories;
}

function matchedCategoryAnswer(
  requested: readonly string[],
  categories: readonly RentalCategory[],
): GroundedAnswerResult {
  const claims: GroundedMaterialClaim[] = [];
  const lines: string[] = [];
  let uncertain = false;
  for (const term of requested) {
    const normalizedTerm = normalizedCategory(term);
    const match = categories.find(category => {
      const searchable = [category.name, category.slug, ...category.subcategories]
        .map(normalizedCategory);
      return searchable.some(value => value === normalizedTerm
        || value.includes(normalizedTerm)
        || normalizedTerm.includes(value));
    });
    if (!match) {
      uncertain = true;
      lines.push('- ' + term + ': RENTipid cannot confirm this from the approved rental categories.');
      continue;
    }
    const text = match.name + ' is a supported RENTipid rental category.';
    lines.push('- ' + match.name + ': Supported.');
    claims.push({ text, evidenceRefs: [match.ref] });
  }
  return {
    message: lines.join('\n'),
    evidenceRefs: [...new Set(claims.flatMap(claim => claim.evidenceRefs))],
    materialClaims: claims,
    safelyUncertain: uncertain,
  };
}

function requestedCategoryAnswer(
  requested: readonly string[],
  categories: readonly RentalCategory[],
  question: string,
): GroundedAnswerResult {
  if (requested.length === 0) {
    const asksForList = /\b(?:types?|categor(?:y|ies))\b/i.test(question);
    if (!asksForList) {
      return {
        message: 'Which item or property type would you like to list?',
        evidenceRefs: [],
        materialClaims: [],
        safelyUncertain: true,
      };
    }
    const refs = [...new Set(categories.map(category => category.ref))];
    const claim = 'Supported rental categories include: '
      + categories.map(category => category.name).join(', ')
      + '.';
    return {
      message: claim,
      evidenceRefs: refs,
      materialClaims: [{ text: claim, evidenceRefs: refs }],
      safelyUncertain: false,
    };
  }
  return matchedCategoryAnswer(requested, categories);
}

function categoryAnswer(
  input: GroundedAnswerInput,
  analysis: RentipidQuestionClassification,
): GroundedAnswerResult {
  const categories = rentalCategories(input.evidence);
  if (categories.length === 0) {
    return {
      message: 'Approved RENTipid category information is unavailable for that item.',
      evidenceRefs: [],
      materialClaims: [],
      safelyUncertain: true,
    };
  }
  return requestedCategoryAnswer(analysis.requestedCategoryTerms, categories, input.question);
}

function liveAnswer(input: GroundedAnswerInput): GroundedAnswerResult {
  const state = input.authorizedLiveContext?.match(/Authoritative ([^:\n]+) state:\s*([^\n]+)/i);
  if (!state || !input.liveEvidenceRef) {
    return {
      message: 'I can’t verify that live status without an authorized RENTipid record. Please open the relevant record and ask again.',
      evidenceRefs: [],
      materialClaims: [],
      safelyUncertain: true,
    };
  }

  const entity = state[1].trim().toLowerCase();
  const fields = state[2]
    .split(';')
    .map(field => field.trim())
    .filter(field => field && !field.toLowerCase().startsWith('refreshedat='))
    .map(field => field.split('='))
    .filter(parts => parts.length === 2 && parts[1] && parts[1] !== 'undefined')
    .map(([key, value]) => `${simpleEnglish(key.replace(/([a-z])([A-Z])/g, '$1 $2'))}: ${simpleEnglish(value)}`);
  if (fields.length === 0) {
    return {
      message: 'I can’t verify that live status from the authorized record right now.',
      evidenceRefs: [],
      materialClaims: [],
      safelyUncertain: true,
    };
  }
  const claim = `Your ${entity} ${fields.join('; ')}.`;
  return {
    message: claim,
    evidenceRefs: [input.liveEvidenceRef],
    materialClaims: [{ text: claim, evidenceRefs: [input.liveEvidenceRef] }],
    safelyUncertain: false,
  };
}

function recompositionUtility(claim: CandidateClaim): number {
  const usefulAction = /\b(?:browse|choose|select|send|enter|set|save|submit|check|return|complete|open|receive|review|approve|accept|publish|create)\b/i
    .test(claim.text) ? 5 : 0;
  const genericPenalty = /\b(?:handled by rentipid|uses? controls|relevant module|general guidance)\b/i
    .test(claim.text) ? 8 : 0;
  return claim.score + usefulAction - genericPenalty;
}

function isDocumentHeading(claim: CandidateClaim): boolean {
  const words = claim.text.match(/[a-z0-9]+/gi) ?? [];
  return words.length <= 5 && /\b(?:process|procedure|guidance|steps)\.?$/i.test(claim.text);
}

function recomposeStaticAnswer(input: GroundedAnswerInput): GroundedAnswerResult {
  const analysis = input.questionAnalysis ?? classifyRentipidQuestion(input.effectiveQuestion);
  if (analysis.intent === 'CATEGORY_ELIGIBILITY') return categoryAnswer(input, analysis);

  const questionTokens = tokenizeKnowledgeText(input.effectiveQuestion);
  const intentEvidence = input.evidence.filter(match => answerIntentScore(match, analysis) > 0);
  const evidence = intentEvidence.length > 0 ? intentEvidence : input.evidence;
  const candidates = evidence.flatMap(match => {
    const steps = extractSteps(match, questionTokens);
    return steps.length > 0 ? steps : extractSentences(match, questionTokens);
  });
  const usefulCandidates = candidates.filter(claim =>
    !isDocumentHeading(claim) && recompositionUtility(claim) > 0);
  const candidatePool = usefulCandidates.length > 0
    ? usefulCandidates
    : candidates.filter(claim => !isDocumentHeading(claim));
  const selected: CandidateClaim[] = [];
  const seen = new Set<string>();
  for (const claim of [...candidatePool].sort((left, right) =>
    recompositionUtility(right) - recompositionUtility(left) || left.ordinal - right.ordinal)) {
    const key = claim.text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    selected.push(claim);
    if (selected.length === 4) break;
  }

  if (selected.length === 0) return staticAnswer(input);
  const procedural = ['BOOKING_PROCESS', 'PROVIDER_PAYMENT_PROCESS', 'CREATE_LISTING', 'REGISTRATION']
    .includes(analysis.intent);
  const message = procedural
    ? procedureIntro(analysis) + '\n'
      + selected.map((claim, index) => `${index + 1}. ${claim.text}`).join('\n')
    : selected.map(claim => claim.text).join(' ');
  return {
    message,
    evidenceRefs: [...new Set(selected.map(claim => claim.ref))],
    materialClaims: selected.map(claim => ({ text: claim.text, evidenceRefs: [claim.ref] })),
    safelyUncertain: false,
  };
}

function validateResult(
  input: GroundedAnswerInput,
  result: GroundedAnswerResult,
  evidenceSufficiency: ReturnType<typeof assessEvidenceSufficiency>,
): AnswerAdequacyResult {
  const classification = input.questionAnalysis ?? classifyRentipidQuestion(input.effectiveQuestion);
  return validateAnswerAdequacy({
    classification,
    message: result.message,
    materialClaims: result.materialClaims,
    safelyUncertain: result.safelyUncertain,
    evidence: input.evidence,
    evidenceSufficiency,
    authorizedLiveContext: input.authorizedLiveContext,
    liveEvidenceRef: input.liveEvidenceRef,
  });
}

function adequacyProtected(
  input: GroundedAnswerInput,
  result: GroundedAnswerResult,
): GroundedAnswerResult {
  const classification = input.questionAnalysis ?? classifyRentipidQuestion(input.effectiveQuestion);
  const evidenceSufficiency = assessEvidenceSufficiency({
    classification,
    question: input.question,
    evidence: input.evidence,
    authorizedLiveContext: input.authorizedLiveContext,
    liveEvidenceRef: input.liveEvidenceRef,
  });
  const initialAdequacy = validateResult(input, result, evidenceSufficiency);
  let finalResult = result;
  let finalAdequacy = initialAdequacy;
  let compositionAttempts: 1 | 2 = 1;

  if (!initialAdequacy.pass
    && evidenceSufficiency.sufficient
    && input.classification === 'STATIC_RENTIPID_KNOWLEDGE') {
    compositionAttempts = 2;
    finalResult = recomposeStaticAnswer(input);
    finalAdequacy = validateResult(input, finalResult, evidenceSufficiency);
  }

  if (!finalAdequacy.pass) {
    finalResult = {
      message: 'Approved RENTipid information is not sufficient to answer that clearly. Please be more specific.',
      evidenceRefs: [],
      materialClaims: [],
      safelyUncertain: true,
    };
  }

  input.onDiagnostic?.({
    classification: input.classification,
    intent: classification.intent,
    evidenceRefs: evidenceSufficiency.evidenceRefs,
    projectedEvidence: input.evidence.map(match => match.content),
    evidenceSufficient: evidenceSufficiency.sufficient,
    evidenceSufficiencyReasons: evidenceSufficiency.reasons,
    preAdequacyAnswer: result.message,
    procedureCount: initialAdequacy.procedureCount,
    conceptCount: initialAdequacy.conceptCount,
    requestedConcepts: initialAdequacy.requestedConcepts,
    adequacyReasons: initialAdequacy.reasons,
    recompositionAttempted: compositionAttempts === 2,
    finalAnswer: finalResult.message,
  });

  return {
    ...finalResult,
    adequacyPassed: finalAdequacy.pass,
    evidenceSufficient: evidenceSufficiency.sufficient,
    compositionAttempts,
  };
}

export function composeGroundedAnswer(input: GroundedAnswerInput): GroundedAnswerResult {
  if (input.classification === 'LIVE_RENTIPID_STATE') return adequacyProtected(input, liveAnswer(input));
  if (input.classification === 'CONSEQUENTIAL_ACTION') {
    return adequacyProtected(input, {
      message: 'This chat cannot carry out that action. Open the relevant RENTipid record to use an available action, or ask how the process works.',
      evidenceRefs: [],
      materialClaims: [],
      safelyUncertain: true,
    });
  }
  if (input.classification === 'OUT_OF_SCOPE_OR_UNSUPPORTED') {
    return adequacyProtected(input, {
      message: 'I’m here to help with RENTipid accounts, listings, bookings, payments, safety, and support. Please ask me a RENTipid question.',
      evidenceRefs: [],
      materialClaims: [],
      safelyUncertain: true,
    });
  }
  if (input.classification === 'AMBIGUOUS') {
    return adequacyProtected(input, {
      message: 'Could you tell me which RENTipid feature or process you mean?',
      evidenceRefs: [],
      materialClaims: [],
      safelyUncertain: true,
    });
  }
  return adequacyProtected(input, staticAnswer(input));
}
