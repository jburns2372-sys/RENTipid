import type {
  CustomerAnswerContract,
  CustomerObjectiveDefinition,
} from './customer-objective-catalog';
import type { CustomerEvidenceBundle } from './customer-evidence-bundle';

export interface BoundAnswerAuthority {
  audience: string;
  answerClass: string;
  authorityType: string;
  authorityReference: string;
  knowledgeSourceKey?: string | null;
  knowledgeSectionKey?: string | null;
  liveServiceKey?: string | null;
  toolKey?: string | null;
}

export interface ContractMaterialClaim {
  text: string;
  evidenceRefs: readonly string[];
  supportingText?: string;
}

export interface ContractAnswerCandidate {
  message: string;
  evidenceRefs: readonly string[];
  materialClaims: readonly ContractMaterialClaim[];
  safelyUncertain: boolean;
}

export interface CustomerAnswerContractVerification {
  pass: boolean;
  safeHold: boolean;
  authorityPassed: boolean;
  evidencePassed: boolean;
  missingRequiredFacts: readonly string[];
  forbiddenClaims: readonly string[];
  reasons: readonly string[];
}

export interface CustomerAnswerContractInput {
  objective: CustomerObjectiveDefinition;
  authority?: BoundAnswerAuthority;
  bundle: CustomerEvidenceBundle;
  answer: ContractAnswerCandidate;
  authorizedLiveEvidenceRef?: string;
}

const CONTRACT_STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'if', 'in', 'is',
  'it', 'of', 'on', 'or', 'the', 'their', 'this', 'to', 'with', 'within', 'your',
]);

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function materialTokens(value: string): string[] {
  return [...new Set(normalize(value).split(' ')
    .filter(token => token.length > 1 && !CONTRACT_STOP_WORDS.has(token)))];
}

function materialCoverage(text: string, fact: string): number {
  const tokens = materialTokens(fact);
  if (tokens.length === 0) return 1;
  const answerTokens = new Set(materialTokens(text));
  return tokens.filter(token => answerTokens.has(token)).length / tokens.length;
}

export function materiallyRepresentsFact(answer: string, fact: string): boolean {
  const normalizedAnswer = normalize(answer);
  const normalizedFact = normalize(fact);
  if (normalizedAnswer.includes(normalizedFact)) return true;
  const tokenCount = materialTokens(fact).length;
  const threshold = tokenCount <= 4 ? 1 : tokenCount <= 8 ? 0.875 : 0.8;
  return materialCoverage(answer, fact) >= threshold;
}

function containsForbiddenClaim(answer: string, claim: string): boolean {
  const normalizedAnswer = normalize(answer);
  const normalizedClaim = normalize(claim);
  if (normalizedAnswer.includes(normalizedClaim)) return true;

  const polarityTokens = materialTokens(claim)
    .filter(token => ['never', 'not', 'no', 'allowed', 'accepted', 'active', 'instant', 'immediate'].includes(token));
  if (polarityTokens.length > 0) {
    const answerTokens = new Set(materialTokens(answer));
    if (!polarityTokens.every(token => answerTokens.has(token))) return false;
  }
  return materialCoverage(answer, claim) >= 0.92;
}

export function contractEvidenceRef(objectiveId: string, factIndex: number): string {
  return `contract:${objectiveId}:required:${factIndex + 1}`;
}

export function customerContractEvidenceDocuments(
  objective: CustomerObjectiveDefinition,
): ReadonlyMap<string, string> {
  return new Map(objective.answerContract.requiredFacts.map((fact, index) => [
    contractEvidenceRef(objective.objectiveId, index),
    fact,
  ]));
}

function expectedAuthorityTypes(contract: CustomerAnswerContract): readonly string[] {
  switch (contract.authorityClass) {
    case 'POLICY_AUTHORITY': return ['POLICY_TAXONOMY'];
    case 'ACTION_TOOL': return ['TOOL_GATEWAY'];
    case 'LIVE_SERVICE': return ['LIVE_SERVICE'];
    case 'POLICY_PLUS_LIVE': return ['KNOWLEDGE_CENTER', 'LIVE_SERVICE'];
    default: return ['KNOWLEDGE_CENTER'];
  }
}

function authorityMatches(
  contract: CustomerAnswerContract,
  authority: BoundAnswerAuthority | undefined,
): boolean {
  if (!authority) return false;
  return authority.authorityReference === contract.authorityReference
    && expectedAuthorityTypes(contract).includes(authority.authorityType);
}

function hasBoundKnowledgeEvidence(
  contract: CustomerAnswerContract,
  bundle: CustomerEvidenceBundle,
): boolean {
  if (!contract.knowledgeSourceKey) return bundle.chunkCount > 0;
  return bundle.sections.some(section =>
    section.sourceKey === contract.knowledgeSourceKey
      && (!contract.knowledgeSectionKey || section.sectionKey === contract.knowledgeSectionKey));
}

function hasAuthorityEvidence(input: CustomerAnswerContractInput): boolean {
  const contract = input.objective.answerContract;
  if (contract.authorityClass === 'POLICY_AUTHORITY') {
    return input.answer.evidenceRefs.some(ref =>
      ref.startsWith(`policy:${contract.authorityReference}:`));
  }
  if (contract.authorityClass === 'ACTION_TOOL') {
    return input.answer.evidenceRefs.some(ref =>
      ref === `tool:${contract.toolKey ?? contract.authorityReference}`);
  }
  if (contract.authorityClass === 'LIVE_SERVICE') {
    return Boolean(input.authorizedLiveEvidenceRef
      && input.answer.evidenceRefs.includes(input.authorizedLiveEvidenceRef));
  }
  if (contract.authorityClass === 'POLICY_PLUS_LIVE') {
    return input.answer.evidenceRefs.some(ref =>
      ref.startsWith('live:') || ref.startsWith('knowledge:') || ref.startsWith('contract:'));
  }
  return hasBoundKnowledgeEvidence(contract, input.bundle);
}

export function verifyCustomerAnswerContract(
  input: CustomerAnswerContractInput,
): CustomerAnswerContractVerification {
  const contract = input.objective.answerContract;
  const authorityPassed = authorityMatches(contract, input.authority);
  const forbiddenClaims = contract.forbiddenClaims.filter(claim =>
    containsForbiddenClaim(input.answer.message, claim));

  const justifiedLiveHold = contract.authorityClass === 'LIVE_SERVICE'
    && !input.authorizedLiveEvidenceRef
    && input.answer.safelyUncertain
    && input.answer.materialClaims.length === 0;
  if (justifiedLiveHold) {
    const reasons = [
      ...(authorityPassed ? [] : ['CONTRACT_AUTHORITY']),
      ...(forbiddenClaims.length === 0 ? [] : ['CONTRACT_FORBIDDEN_CLAIM']),
    ];
    return {
      pass: reasons.length === 0,
      safeHold: true,
      authorityPassed,
      evidencePassed: true,
      missingRequiredFacts: [],
      forbiddenClaims,
      reasons,
    };
  }

  const evidencePassed = hasAuthorityEvidence(input);
  const missingRequiredFacts = contract.requiredFacts.filter(fact =>
    !materiallyRepresentsFact(input.answer.message, fact));
  const reasons = [
    ...(authorityPassed ? [] : ['CONTRACT_AUTHORITY']),
    ...(evidencePassed ? [] : ['CONTRACT_EVIDENCE']),
    ...(missingRequiredFacts.length === 0 ? [] : ['CONTRACT_REQUIRED_FACTS']),
    ...(forbiddenClaims.length === 0 ? [] : ['CONTRACT_FORBIDDEN_CLAIM']),
    ...(input.answer.safelyUncertain ? ['CONTRACT_UNJUSTIFIED_UNCERTAINTY'] : []),
  ];
  return {
    pass: reasons.length === 0,
    safeHold: false,
    authorityPassed,
    evidencePassed,
    missingRequiredFacts,
    forbiddenClaims,
    reasons,
  };
}

function answerIntro(objectiveId: string): string {
  if (objectiveId === 'provider.profile.public_vs_private') {
    return 'If by “account” you mean the provider’s public rental profile, here is what is visible and what remains private:';
  }
  if (objectiveId === 'booking.cancel.process') return 'To cancel a RENTipid booking safely:';
  if (objectiveId === 'renter.refund.request_how_to') return 'To request a RENTipid refund:';
  if (objectiveId === 'rental.damage.general') return 'If a rented item is damaged:';
  if (objectiveId === 'renter.payment.methods') return 'RENTipid payment guidance:';
  return 'RENTipid guidance:';
}

function paymentEnvironmentNotice(objectiveId: string): string | undefined {
  if (objectiveId !== 'renter.payment.methods' || process.env.VERCEL_ENV === 'production') return undefined;
  return 'Private Beta — Mock Payments Active. Real financial transactions are disabled in this Preview environment.';
}

export function composeCustomerContractAnswer(
  objective: CustomerObjectiveDefinition,
  authorityEvidenceRefs: readonly string[],
): ContractAnswerCandidate {
  const facts = objective.answerContract.requiredFacts;
  const notice = paymentEnvironmentNotice(objective.objectiveId);
  const claims = facts.map((fact, index) => ({
    text: fact,
    supportingText: fact,
    evidenceRefs: Object.freeze([
      contractEvidenceRef(objective.objectiveId, index),
      ...authorityEvidenceRefs,
    ]),
  }));
  const message = [
    answerIntro(objective.objectiveId),
    ...facts.map(fact => `- ${fact}`),
    notice ? `\n${notice}` : '',
  ].filter(Boolean).join('\n');
  return {
    message,
    evidenceRefs: Object.freeze([...new Set<string>(claims.flatMap(claim => claim.evidenceRefs))]),
    materialClaims: Object.freeze(claims),
    safelyUncertain: false,
  };
}
