import { prisma } from '@/lib/prisma';
import { canAccessKnowledge, parseStoredRoles } from '@/lib/ai/knowledge/visibility';
import { resolveDomainIntent } from '@/lib/ai/specialists/intent-resolver';
import {
  classifyRentipidQuestion,
  type ConversationContextMessage,
  type RentipidQuestionClassification,
} from './question-classifier';
import {
  isOrdinaryCustomerRole,
  classifyKnowledgeSourceAudience,
  projectCustomerAnswerableText,
} from './customer-knowledge-projection';
import { deriveCustomerKnowledgeBlock } from './customer-knowledge-contract';
import {
  buildCustomerEvidenceBundle,
  type CustomerEvidenceBundle,
} from './customer-evidence-bundle';
import type { SemanticContextBundle } from '../semantic/contracts';

const MAX_SOURCES = 250;
const MAX_RESULTS = 4;
const MIN_QUERY_COVERAGE = 0.6;
const MIN_RECOVERY_COVERAGE = 0.34;
const MAX_SCORE_MARGIN = 10;
const MATERIAL_CLAIM_TOKENS = new Set(['guarantee', 'guaranteed', 'promise', 'promised', 'always', 'never']);

const QUERY_STOP_WORDS = new Set([
  'a', 'about', 'an', 'and', 'are', 'as', 'available', 'be', 'can', 'could', 'do', 'does',
  'every', 'for', 'from', 'how', 'i', 'in', 'is', 'it', 'me', 'of', 'on',
  'exists', 'functionality', 'guidance', 'please', 'provide', 'provided',
  'something', 'tell', 'the', 'through', 'to', 'use', 'uses', 'what', 'when',
  'find', 'follow', 'up', 'where', 'which', 'who', 'why', 'work', 'would', 'you',
]);

const SECRET_QUERY = /\b(?:database[_ ]?url|api[_ -]?key|secret key|client[_ -]?secret|jwt[_ -]?secret|signing[_ -]?secret|private key|session token|password hash|password)\b/i;

interface RetrievalConcept {
  id: string;
  pattern: RegExp;
  domains: readonly string[];
  expansion: readonly string[];
}

const RETRIEVAL_CONCEPTS: readonly RetrievalConcept[] = [
  { id: 'registration', pattern: /\b(?:register|registration|sign\s*up|signup|join|newcomer|new\s+renter|new\s+provider|start\b.{0,20}\b(?:renter|provider)|create\s+(?:an?\s+)?account)\b/i, domains: ['Core', 'Profile'], expansion: ['register', 'account', 'onboard', 'renter', 'provider'] },
  { id: 'listing', pattern: /\b(?:list|listed|listing|listings|offer|equipment|put\b.{0,20}\bup\b.{0,20}\brent|add\b.{0,20}\brental|publish|published)\b/i, domains: ['Marketplace', 'Core'], expansion: ['listing', 'provider', 'create', 'publish', 'rental', 'item'] },
  { id: 'booking', pattern: /\b(?:book|booking|reserve|reservation|checkout|rental lifecycle|turnover|inspection|return)\b/i, domains: ['Marketplace', 'Core'], expansion: ['book', 'booking', 'rental', 'listing', 'checkout', 'return'] },
  { id: 'payment', pattern: /\b(?:pay|paid|payment|deposit|refund|payout|receipt|cancel|cancellation)\b/i, domains: ['Payments', 'Marketplace', 'Core'], expansion: ['payment', 'deposit', 'refund', 'payout', 'booking', 'cancel'] },
  { id: 'profile', pattern: /\b(?:profile|account details|personal information|notification|notifications|alert|alerts)\b/i, domains: ['Profile', 'Core'], expansion: ['profile', 'account', 'notification', 'preference', 'edit'] },
  { id: 'verification', pattern: /\b(?:kyc|identity|verify|verification|document|documents)\b/i, domains: ['Core', 'Trust & Safety'], expansion: ['kyc', 'identity', 'verify', 'document', 'onboard'] },
  { id: 'insurance', pattern: /\b(?:insurance|coverage|claim|claims|damage)\b/i, domains: ['Insurance', 'Trust & Safety'], expansion: ['insurance', 'claim', 'damage', 'coverage', 'support'] },
  { id: 'dispute', pattern: /\b(?:dispute|mediation|mediate|resolution|complaint)\b/i, domains: ['Trust & Safety', 'Marketplace', 'Core', 'Unified AI'], expansion: ['dispute', 'mediation', 'claim', 'support', 'booking', 'policy'] },
  { id: 'reviews', pattern: /\b(?:review|reviews|rating|ratings|feedback)\b/i, domains: ['Marketplace', 'Core'], expansion: ['review', 'feedback', 'booking', 'listing', 'support'] },
  { id: 'discovery', pattern: /\b(?:browse|search|discover|filter|category|categories|supported\s+(?:item|rental)\s+types?|types?\s+of\s+rentals?|rentals?\s+(?:allowed|supported))\b/i, domains: ['Marketplace'], expansion: ['browse', 'search', 'listing', 'category', 'rental'] },
  { id: 'safety', pattern: /\b(?:safe|safety|security|prohibited|restricted(?:\s+item)?|firearms?|weapons?|unsafe)\b/i, domains: ['Trust & Safety', 'Security'], expansion: ['safety', 'security', 'prohibited', 'restricted', 'item', 'support'] },
  { id: 'privacy', pattern: /\b(?:privacy|personal data|data correction|data export|delete.*account)\b/i, domains: ['Privacy'], expansion: ['privacy', 'data', 'account', 'correction', 'deletion'] },
  { id: 'legal', pattern: /\b(?:legal|law|laws|compliance|regulation|regulations|jurisdiction|jurisdictions|terms)\b/i, domains: ['Legal'], expansion: ['legal', 'compliance', 'terms', 'privacy', 'jurisdiction'] },
  { id: 'support', pattern: /\b(?:help|support|contact|issue|problem)\b/i, domains: ['Core'], expansion: ['support', 'help', 'issue', 'account', 'rentipid'] },
  { id: 'social', pattern: /\b(?:social|campaign|marketing|promotion|promote|caption|hashtag)\b/i, domains: ['Social'], expansion: ['social', 'campaign', 'marketing', 'provider', 'listing'] },
  { id: 'address', pattern: /\b(?:address|addresses|pass4)\b/i, domains: ['Address'], expansion: ['address', 'implementation', 'status', 'pass4'] },
  { id: 'rbac', pattern: /\b(?:rbac|roles?|permissions?|finance admin|compliance admin|super admin)\b/i, domains: ['Security'], expansion: ['role', 'permission', 'access', 'admin'] },
];

function normalizeToken(token: string): string {
  if (token === 'rentipid') return token;
  if (token.startsWith('administrat')) return 'admin';
  if (token === 'newcomer' || token === 'join' || token.startsWith('registr') || token === 'signup') return 'register';
  if (token === 'become' || token.startsWith('onboard')) return 'onboard';
  if (token.startsWith('book') || token.startsWith('reserv')) return 'book';
  if (token.startsWith('receiv')) return 'receive';
  if (token === 'paid' || token.startsWith('payment') || token.startsWith('payout')) return 'payment';
  if (token === 'help' || token.startsWith('support') || token.startsWith('guidance')) return 'support';
  if (token === 'law' || token === 'laws' || token.startsWith('legal') || token.startsWith('compliance') || token.startsWith('regulation') || token.startsWith('jurisdiction')) return 'legal';
  if (token.startsWith('mediat')) return 'dispute';
  if (token === 'list' || token.startsWith('listing') || token === 'listed' || token.startsWith('offer')) return 'listing';
  if (token.startsWith('equip')) return 'item';
  if (token.startsWith('notif') || token.startsWith('alert')) return 'notification';
  if (token.startsWith('verif')) return 'verify';
  if (token.startsWith('review') || token.startsWith('rating')) return 'review';
  if (token.startsWith('search') || token.startsWith('discover')) return 'browse';
  if (token.startsWith('rent')) return 'rent';
  if (token.startsWith('cancel')) return 'cancel';
  if (token.endsWith('ies') && token.length > 4) return `${token.slice(0, -3)}y`;
  if (token.endsWith('s') && token.length > 3) return token.slice(0, -1);
  return token;
}

export function tokenizeKnowledgeText(value: string): string[] {
  const tokens = value.toLowerCase().match(/[a-z0-9]+/g) || [];
  return [...new Set(tokens
    .filter(token => !/^\d+$/.test(token))
    .filter(token => !QUERY_STOP_WORDS.has(token))
    .map(normalizeToken)
    .filter(token => !QUERY_STOP_WORDS.has(token)))];
}

function jsonStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function normalizePhrase(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function matchingConcepts(prompt: string): readonly RetrievalConcept[] {
  return RETRIEVAL_CONCEPTS.filter(concept => concept.pattern.test(prompt));
}

function matchesResolvedIntent(
  match: RetrievedKnowledgeMatch,
  classification: RentipidQuestionClassification,
): boolean {
  if (classification.intent === 'GENERAL_RENTIPID') return true;
  const intentTokens = tokenizeKnowledgeText(classification.intent.replace(/_/g, ' '));
  const evidenceTokens = new Set(tokenizeKnowledgeText([
    match.topic,
    match.sectionTitle,
    ...match.entities,
    match.content,
  ].join(' ')));
  return intentTokens.some(token => evidenceTokens.has(token));
}

function scoreToken(
  token: string,
  sourceFieldTokens: ReadonlySet<string>,
  keywordTokens: ReadonlySet<string>,
  headingTokens: ReadonlySet<string>,
  contentTokens: ReadonlySet<string>,
): number {
  let score = 0;
  if (sourceFieldTokens.has(token)) score += 1;
  if (keywordTokens.has(token)) score += 1;
  if (headingTokens.has(token)) score += 4;
  if (contentTokens.has(token)) score += 2;
  return score;
}

export interface RetrievedKnowledgeMatch {
  sourceKey: string;
  version: string;
  sourceType: string;
  title: string;
  module: string;
  topic: string;
  chunkKey: string;
  headingPath: string;
  sectionKey: string;
  sectionTitle: string;
  ordinal: number;
  visibility: string;
  audience: 'CUSTOMER' | 'INTERNAL' | 'SYSTEM';
  answerClass: 'INFORMATION';
  entities: readonly string[];
  content: string;
  score: number;
  coverage: number;
  attempt: 1 | 2;
  customerProjected?: boolean;
  evidenceRole: 'SEED' | 'NEIGHBOR';
}

export interface KnowledgeRetrievalResult {
  classification: RentipidQuestionClassification;
  matches: readonly RetrievedKnowledgeMatch[];
  attempts: 0 | 1 | 2;
  bundle: CustomerEvidenceBundle;
}

export async function retrieveApprovedKnowledgeEvidence(
  prompt: string,
  userRole: string | undefined,
  conversationContext: readonly ConversationContextMessage[] = [],
  semanticContext?: SemanticContextBundle,
): Promise<KnowledgeRetrievalResult> {
  const classification = classifyRentipidQuestion(prompt, conversationContext);
  if (classification.kind !== 'STATIC_RENTIPID_KNOWLEDGE' || SECRET_QUERY.test(prompt)) {
    return {
      classification,
      matches: [],
      attempts: 0,
      bundle: buildCustomerEvidenceBundle(prompt, classification, []),
    };
  }

  const queryTokens = tokenizeKnowledgeText(classification.effectiveQuestion);
  if (queryTokens.length === 0) return {
    classification,
    matches: [],
    attempts: 0,
    bundle: buildCustomerEvidenceBundle(prompt, classification, []),
  };

  const concepts = matchingConcepts(classification.effectiveQuestion);
  let baseExpansions = concepts.flatMap(concept => concept.expansion);
  if (semanticContext && semanticContext.retrievalExpansions.length > 0) {
    baseExpansions = baseExpansions.concat(semanticContext.retrievalExpansions);
  }
  const conceptTokens = [...new Set(baseExpansions.flatMap(tokenizeKnowledgeText))];
  const intentDomains = [...new Set([
    ...resolveDomainIntent(classification.effectiveQuestion),
    ...concepts.flatMap(concept => concept.domains),
  ])];
  const now = new Date();
  const sources = await prisma.aiKnowledgeSource.findMany({
    where: {
      status: 'ACTIVE',
      approvalStatus: 'APPROVED',
      effectiveFrom: { lte: now },
      OR: [{ effectiveUntil: null }, { effectiveUntil: { gt: now } }],
    },
    include: {
      chunks: { orderBy: [{ ordinal: 'asc' }, { chunkKey: 'asc' }] },
    },
    orderBy: [{ sourceKey: 'asc' }, { version: 'desc' }],
    take: MAX_SOURCES,
  });
  const canonicalSourcesPresent = sources.some(source =>
    source.authority !== 'OAT_TEST_FIXTURE' && !source.sourceKey.startsWith('oat-'));

  const firstAttempt: RetrievedKnowledgeMatch[] = [];
  const recoveryAttempt: RetrievedKnowledgeMatch[] = [];
  const accessibleCustomerChunks: RetrievedKnowledgeMatch[] = [];
  const customerProjectionRequired = isOrdinaryCustomerRole(userRole);

  for (const source of sources) {
    if (canonicalSourcesPresent && (source.authority === 'OAT_TEST_FIXTURE' || source.sourceKey.startsWith('oat-'))) continue;
    if (customerProjectionRequired && classifyKnowledgeSourceAudience(source.sourceKey) !== 'CUSTOMER') continue;
    const sourceRoles = parseStoredRoles(source.roles, source.applicableRoles);
    if (!canAccessKnowledge(source.visibility, sourceRoles, userRole)) continue;
    const sourceKeywords = jsonStrings(source.metadata && typeof source.metadata === 'object'
      ? (source.metadata as Record<string, unknown>).keywords
      : undefined);
    const sourceFieldTokens = new Set(tokenizeKnowledgeText([
      source.title,
      source.module,
      source.topic,
      source.category,
      ...sourceKeywords,
    ].join(' ')));
    const chunks = source.chunks.length > 0
      ? source.chunks
      : source.authority === 'LEGACY' || source.sourceKey.startsWith('oat-')
        ? [{
            chunkKey: 'legacy',
            headingPath: source.category,
            ordinal: 0,
            content: source.sourceReference || source.title,
            normalizedContent: source.sourceReference || source.title,
            keywords: [] as unknown,
            visibility: null,
            roles: null,
          }]
        : [];

    for (const chunk of chunks) {
      const chunkVisibility = chunk.visibility || source.visibility;
      const chunkRoles = chunk.roles ? parseStoredRoles(chunk.roles) : sourceRoles;
      if (!canAccessKnowledge(chunkVisibility, chunkRoles, userRole)) continue;
      const audienceContext = chunk.headingPath;
      const projectedContent = customerProjectionRequired
        ? projectCustomerAnswerableText(chunk.content, audienceContext)
        : chunk.content;
      if (!projectedContent) continue;
      const chunkKeywords = jsonStrings(chunk.keywords);
      const block = deriveCustomerKnowledgeBlock({
        sourceKey: source.sourceKey,
        chunkKey: chunk.chunkKey,
        headingPath: chunk.headingPath,
        content: projectedContent,
        ordinal: chunk.ordinal,
        domain: source.module,
        topic: source.topic,
        title: source.title,
        visibility: chunkVisibility,
        keywords: chunkKeywords,
      });
      if (customerProjectionRequired && !block) continue;
      const headingTokens = new Set(tokenizeKnowledgeText(chunk.headingPath));
      const contentTokens = new Set(tokenizeKnowledgeText(projectedContent));
      const keywordTokens = new Set(tokenizeKnowledgeText(chunkKeywords.join(' ')));
      const matchedTokens = new Set<string>();
      let lexicalScore = 0;
      for (const token of queryTokens) {
        const tokenScore = scoreToken(token, sourceFieldTokens, keywordTokens, headingTokens, contentTokens);
        if (tokenScore > 0) {
          matchedTokens.add(token);
          lexicalScore += tokenScore;
        }
      }

      const coverage = matchedTokens.size / queryTokens.length;
      const materialClaims = queryTokens.filter(token => MATERIAL_CLAIM_TOKENS.has(token));
      if (materialClaims.some(token => !matchedTokens.has(token))) continue;
      const domainMatched = intentDomains.includes(source.module);
      const isLegal = source.module === 'Legal' || source.topic === 'compliance' || source.topic === 'legal';
      let sharedScore = lexicalScore;
      if (domainMatched) sharedScore += 5;
      if (source.topic.toLowerCase() === 'overview' && queryTokens.includes('rentipid')) sharedScore += 3;
      if (['MANUAL', 'PUBLISHED_GUIDANCE'].includes(source.sourceType)) sharedScore += 1;
      if (source.authority !== 'LEGACY') sharedScore += 0.25;
      if (isLegal && !intentDomains.includes('Legal')) sharedScore -= 20;
      const normalizedQuestion = normalizePhrase(classification.effectiveQuestion);
      const sourceTitlePhrase = normalizePhrase(source.title);
      const sectionTitlePhrase = normalizePhrase(chunk.headingPath.split('>').at(-1) ?? '');
      if (sourceTitlePhrase.length > 5 && normalizedQuestion.includes(sourceTitlePhrase)) sharedScore += 16;
      if (sectionTitlePhrase.length > 5 && normalizedQuestion.includes(sectionTitlePhrase)) sharedScore += 20;
      const intentText = [source.sourceKey, source.topic, chunk.headingPath, projectedContent].join(' ');
      const intentTokens = tokenizeKnowledgeText(classification.intent.replace(/_/g, ' '));
      const intentEvidenceTokens = new Set(tokenizeKnowledgeText(intentText));
      const intentMatches = intentTokens.filter(token => intentEvidenceTokens.has(token)).length;
      sharedScore += Math.min(12, intentMatches * 4);
      if (classification.intent !== 'GENERAL_RENTIPID' && intentMatches === 0) sharedScore -= 8;
      if (classification.providerContext === 'EXISTING_PROVIDER'
        && /\b(?:onboarding|registration|become a provider)\b/i.test(intentText)) {
        sharedScore -= 18;
      }
      const requestedEntityMatches = classification.requestedCategoryTerms.filter(entity => {
        const entityTokens = tokenizeKnowledgeText(entity);
        return entityTokens.length > 0 && entityTokens.every(token => intentEvidenceTokens.has(token));
      }).length;
      sharedScore += Math.min(16, requestedEntityMatches * 8);

      const base = {
        sourceKey: source.sourceKey,
        version: source.version,
        sourceType: source.sourceType,
        title: source.title,
        module: source.module,
        topic: source.topic,
        chunkKey: chunk.chunkKey,
        headingPath: chunk.headingPath,
        sectionKey: block?.sectionKey ?? `${source.sourceKey}:${chunk.headingPath}`,
        sectionTitle: block?.sectionTitle ?? chunk.headingPath,
        ordinal: chunk.ordinal,
        visibility: chunkVisibility,
        audience: block?.audience ?? 'INTERNAL' as const,
        answerClass: 'INFORMATION' as const,
        entities: block?.entities ?? [],
        content: projectedContent,
        customerProjected: customerProjectionRequired,
        evidenceRole: 'SEED' as const,
      };

      if (base.audience === 'CUSTOMER') {
        accessibleCustomerChunks.push({ ...base, score: 0, coverage: 0, attempt: 1 });
      }

      if (coverage >= MIN_QUERY_COVERAGE && sharedScore > 0) {
        firstAttempt.push({ ...base, score: sharedScore, coverage, attempt: 1 });
      }

      if (conceptTokens.length > 0 && domainMatched) {
        let conceptScore = 0;
        let conceptMatches = 0;
        for (const token of conceptTokens) {
          const tokenScore = scoreToken(token, sourceFieldTokens, keywordTokens, headingTokens, contentTokens);
          if (tokenScore > 0) {
            conceptMatches += 1;
            conceptScore += tokenScore;
          }
        }
        const conceptCoverage = conceptMatches / conceptTokens.length;
        if (conceptMatches >= 2 && conceptCoverage >= MIN_RECOVERY_COVERAGE) {
          recoveryAttempt.push({
            ...base,
            score: sharedScore + conceptScore + 2,
            coverage: Math.max(coverage, conceptCoverage),
            attempt: 2,
          });
        }
      }
    }
  }

  const firstAttemptHasIntendedDomain = firstAttempt.some(match => intentDomains.includes(match.module));
  const firstAttemptHasResolvedIntent = firstAttempt.some(match => matchesResolvedIntent(match, classification));
  const shouldRecover = firstAttempt.length === 0
    || !firstAttemptHasIntendedDomain
    || !firstAttemptHasResolvedIntent
    || Math.max(...firstAttempt.map(match => match.coverage)) < 0.75;
  const candidatePool = shouldRecover ? [...firstAttempt, ...recoveryAttempt] : firstAttempt;
  const resolvedIntentCandidates = candidatePool.filter(match => matchesResolvedIntent(match, classification));
  const domainAlignedCandidates = candidatePool.filter(match => intentDomains.includes(match.module));
  const candidates = classification.intent === 'GENERAL_RENTIPID' && intentDomains.length > 0
    ? domainAlignedCandidates
    : classification.intent !== 'GENERAL_RENTIPID' && resolvedIntentCandidates.length > 0
    ? resolvedIntentCandidates
    : candidatePool;
  const deduplicated = new Map<string, RetrievedKnowledgeMatch>();
  for (const candidate of candidates) {
    const key = `${candidate.sourceKey}:${candidate.chunkKey}`;
    const current = deduplicated.get(key);
    if (!current || candidate.score > current.score) deduplicated.set(key, candidate);
  }
  const ranked = [...deduplicated.values()].sort((left, right) =>
    right.score - left.score
    || right.coverage - left.coverage
    || left.attempt - right.attempt
    || left.sourceKey.localeCompare(right.sourceKey)
    || left.chunkKey.localeCompare(right.chunkKey));
  const topScore = ranked[0]?.score ?? 0;
  const matches = ranked
    .filter(match => match.score >= topScore - MAX_SCORE_MARGIN)
    .slice(0, MAX_RESULTS);

  const seedByChunk = new Map(matches.map(match => [
    `${match.sourceKey}:${match.chunkKey}`,
    match,
  ]));
  const selectedSections = new Set(matches.map(match => `${match.sourceKey}:${match.sectionKey}`));
  const sectionScores = new Map<string, number>();
  const normalizedEffectiveQuestion = normalizePhrase(classification.effectiveQuestion);
  for (const match of matches) {
    const key = `${match.sourceKey}:${match.sectionKey}`;
    sectionScores.set(key, Math.max(sectionScores.get(key) ?? 0, match.score));
    for (const candidate of accessibleCustomerChunks) {
      if (candidate.sourceKey !== match.sourceKey
        || !match.headingPath.startsWith(`${candidate.headingPath} >`)) continue;
      const parentKey = `${candidate.sourceKey}:${candidate.sectionKey}`;
      selectedSections.add(parentKey);
      sectionScores.set(parentKey, Math.max(sectionScores.get(parentKey) ?? 0, match.score));
    }
  }
  for (const candidate of accessibleCustomerChunks) {
    const sourceNamed = normalizedEffectiveQuestion.includes(normalizePhrase(candidate.title));
    const sectionNamed = normalizedEffectiveQuestion.includes(normalizePhrase(candidate.sectionTitle));
    if (!sourceNamed || !sectionNamed) continue;
    const namedKey = `${candidate.sourceKey}:${candidate.sectionKey}`;
    selectedSections.add(namedKey);
    sectionScores.set(namedKey, Math.max(sectionScores.get(namedKey) ?? 0, topScore));
  }
  const reconstructedMatches = accessibleCustomerChunks
    .filter(match => selectedSections.has(`${match.sourceKey}:${match.sectionKey}`))
    .map(match => seedByChunk.get(`${match.sourceKey}:${match.chunkKey}`) ?? {
      ...match,
      evidenceRole: 'NEIGHBOR' as const,
    })
    .sort((left, right) =>
      (sectionScores.get(`${right.sourceKey}:${right.sectionKey}`) ?? 0)
        - (sectionScores.get(`${left.sourceKey}:${left.sectionKey}`) ?? 0)
      || left.sourceKey.localeCompare(right.sourceKey)
      || left.sectionKey.localeCompare(right.sectionKey)
      || left.ordinal - right.ordinal);
  const bundle = buildCustomerEvidenceBundle(prompt, classification, reconstructedMatches);

  return {
    classification,
    matches: reconstructedMatches,
    attempts: shouldRecover && recoveryAttempt.length > 0 ? 2 : 1,
    bundle,
  };
}

export async function retrieveApprovedKnowledgeMatches(
  prompt: string,
  userRole: string | undefined,
  conversationContext: readonly ConversationContextMessage[] = [],
  semanticContext?: SemanticContextBundle,
): Promise<RetrievedKnowledgeMatch[]> {
  const result = await retrieveApprovedKnowledgeEvidence(prompt, userRole, conversationContext, semanticContext);
  return [...result.matches];
}

/**
 * Compatibility helper for internal/admin diagnostics. Customer response paths
 * use structured evidence and the grounded composer instead of this rendering.
 */
export async function retrieveApprovedKnowledge(
  prompt: string,
  userRole: string | undefined,
  conversationContext: readonly ConversationContextMessage[] = [],
  semanticContext?: SemanticContextBundle,
): Promise<string | null> {
  const matches = await retrieveApprovedKnowledgeMatches(prompt, userRole, conversationContext, semanticContext);
  if (matches.length === 0) return null;
  return matches
    .map(match => `[${match.sourceKey} > ${match.headingPath}]\n${match.content}`)
    .join('\n\n');
}
