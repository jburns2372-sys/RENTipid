import type { RentipidQuestionClass } from './question-classifier';
import type { RetrievedKnowledgeMatch } from './knowledge-retrieval';
import { tokenizeKnowledgeText } from './knowledge-retrieval';

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
}

export interface GroundedAnswerResult {
  message: string;
  evidenceRefs: readonly string[];
  materialClaims: readonly GroundedMaterialClaim[];
  safelyUncertain: boolean;
}

const INTERNAL_CONTENT =
  /\b(?:source key|chunk id|registry id|database|migration|commit|oat|test suite|implementation detail|internal telemetry|phase\s*\d+|pass\s*\d*)\b/i;
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
    .replace(/\r?\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
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

  const procedural = /\b(?:how|steps?|start|create|register|list|publish|edit|change|update|submit|need)\b/i.test(input.question);
  const rankedEvidence = [...eligibleEvidence].sort((left, right) => {
    const leftCustomerSource = ['MANUAL', 'PUBLISHED_GUIDANCE'].includes(left.sourceType) ? 1 : 0;
    const rightCustomerSource = ['MANUAL', 'PUBLISHED_GUIDANCE'].includes(right.sourceType) ? 1 : 0;
    return rightCustomerSource - leftCustomerSource || right.score - left.score;
  });

  if (procedural) {
    for (const match of rankedEvidence) {
      const steps = extractSteps(match, questionTokens);
      if (steps.length >= 2) {
        const selected = steps.slice(0, 4);
        const message = `Here’s what to do:\n${selected.map((step, index) => `${index + 1}. ${step.text}`).join('\n')}`;
        return {
          message,
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

export function composeGroundedAnswer(input: GroundedAnswerInput): GroundedAnswerResult {
  if (input.classification === 'LIVE_RENTIPID_STATE') return liveAnswer(input);
  if (input.classification === 'OUT_OF_SCOPE_OR_UNSUPPORTED') {
    return {
      message: 'I’m here to help with RENTipid accounts, listings, bookings, payments, safety, and support. Please ask me a RENTipid question.',
      evidenceRefs: [],
      materialClaims: [],
      safelyUncertain: true,
    };
  }
  if (input.classification === 'AMBIGUOUS') {
    return {
      message: 'Could you tell me which RENTipid feature or process you mean?',
      evidenceRefs: [],
      materialClaims: [],
      safelyUncertain: true,
    };
  }
  return staticAnswer(input);
}
