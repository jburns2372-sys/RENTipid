import type { CustomerEvidenceBundle } from './customer-evidence-bundle';
import { isCustomerAnswerableText } from './customer-knowledge-projection';
import type { GroundedAnswerResult } from './grounded-answer-composer';
import type { StructuredCategoryFact } from './structured-category-resolver';

export interface GroundedVerificationResult {
  pass: boolean;
  reasons: readonly string[];
  questionCoverage: boolean;
  entityCoverage: boolean;
  claimSupport: boolean;
  contextRespect: boolean;
  leakage: boolean;
  authority: boolean;
}

export interface GroundedVerificationInput {
  bundle: CustomerEvidenceBundle;
  answer: GroundedAnswerResult;
  structuredCategoryFacts: readonly StructuredCategoryFact[];
  authorizedLiveEvidenceRef?: string;
}

function normalized(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/s\b/g, '');
}

function evidenceDocuments(bundle: CustomerEvidenceBundle): Map<string, string> {
  return new Map(bundle.sections.flatMap(section => section.chunks.map(chunk => [
    chunk.evidenceRef,
    chunk.content,
  ] as const)));
}

function supportsClaims(input: GroundedVerificationInput): boolean {
  if (input.answer.safelyUncertain
    && input.bundle.classification.intent !== 'CATEGORY_ELIGIBILITY') {
    return input.answer.materialClaims.length === 0;
  }
  if (input.answer.safelyUncertain && input.answer.materialClaims.length === 0) return true;
  if (input.answer.materialClaims.length === 0) return false;
  const documents = evidenceDocuments(input.bundle);
  return input.answer.materialClaims.every(claim => {
    if (!claim.text.trim() || claim.evidenceRefs.length === 0 || !claim.supportingText?.trim()) return false;
    return claim.evidenceRefs.some(ref => {
      const source = documents.get(ref);
      return source && normalized(source).includes(normalized(claim.supportingText ?? ''));
    });
  });
}

function coversQuestion(input: GroundedVerificationInput): boolean {
  if (input.answer.safelyUncertain
    && input.bundle.classification.intent !== 'CATEGORY_ELIGIBILITY') {
    return input.bundle.sections.length === 0;
  }
  if (input.answer.answeredIntent !== input.bundle.classification.intent) return false;
  if (!input.answer.message.trim() || input.answer.materialClaims.length === 0) return false;
  const asksHow = /\b(?:how|steps?|what happens|process)\b/i.test(input.bundle.question);
  if (!asksHow) return true;
  const supportedAction = /\b(?:add|apply|browse|check|choose|complete|confirm|contact|create|enter|find|follow|open|provide|receive|register|request|return|review|save|select|send|sign|submit|upload|use|verify)\b/i;
  return supportedAction.test(input.answer.message)
    && input.answer.materialClaims.some(claim => supportedAction.test(claim.supportingText ?? claim.text));
}

function coversEntities(input: GroundedVerificationInput): boolean {
  const requested = input.bundle.requestedEntities;
  if (requested.length === 0) return true;
  const covered = normalized(input.answer.message);
  return requested.every(entity => covered.includes(normalized(entity)));
}

function respectsContext(input: GroundedVerificationInput): boolean {
  if (input.bundle.classification.providerContext !== 'EXISTING_PROVIDER') return true;
  return !/\b(?:become a provider|provider onboarding|register as a provider|complete kyc)\b/i
    .test(input.answer.message);
}

function respectsAuthority(input: GroundedVerificationInput): boolean {
  const kind = input.bundle.classification.kind;
  const refs = input.answer.materialClaims.flatMap(claim => claim.evidenceRefs);
  if (kind === 'LIVE_RENTIPID_STATE') {
    return Boolean(input.authorizedLiveEvidenceRef)
      && refs.length > 0
      && refs.every(ref => ref === input.authorizedLiveEvidenceRef);
  }
  if (kind === 'CONSEQUENTIAL_ACTION') {
    return input.answer.safelyUncertain && refs.length === 0;
  }
  return refs.every(ref => ref.startsWith('knowledge:'));
}

function coversStructuredCategories(input: GroundedVerificationInput): boolean {
  if (input.bundle.classification.intent !== 'CATEGORY_ELIGIBILITY') return true;
  if (input.bundle.requestedEntities.length === 0) {
    return input.answer.materialClaims.length > 0
      && input.answer.materialClaims.every(claim => claim.evidenceRefs.length > 0);
  }
  if (input.structuredCategoryFacts.length === 0) return false;
  const answer = normalized(input.answer.message);
  return input.structuredCategoryFacts.every(fact =>
    answer.includes(normalized(fact.entity))
    && (fact.status === 'UNCONFIRMED'
      ? /\b(?:cannot confirm|unconfirmed|not enough approved)\b/i.test(input.answer.message)
      : answer.includes(normalized(fact.status))));
}

export function verifyGroundedAnswer(input: GroundedVerificationInput): GroundedVerificationResult {
  const questionCoverage = coversQuestion(input) && coversStructuredCategories(input);
  const entityCoverage = coversEntities(input);
  const claimSupport = supportsClaims(input);
  const contextRespect = respectsContext(input);
  const leakage = isCustomerAnswerableText(input.answer.message);
  const authority = respectsAuthority(input);
  const reasons: string[] = [];
  if (!questionCoverage) reasons.push('QUESTION_COVERAGE');
  if (!entityCoverage) reasons.push('ENTITY_COVERAGE');
  if (!claimSupport) reasons.push('CLAIM_SUPPORT');
  if (!contextRespect) reasons.push('CONTEXT_RESPECT');
  if (!leakage) reasons.push('LEAKAGE');
  if (!authority) reasons.push('AUTHORITY');
  return {
    pass: reasons.length === 0,
    reasons,
    questionCoverage,
    entityCoverage,
    claimSupport,
    contextRespect,
    leakage,
    authority,
  };
}
