import { prisma } from '@/lib/prisma';
import { canAccessKnowledge, parseStoredRoles } from '@/lib/ai/knowledge/visibility';
import { resolveDomainIntent } from '@/lib/ai/specialists/intent-resolver';

const MAX_SOURCES = 250;
const MAX_RESULTS = 4;
const MIN_QUERY_COVERAGE = 0.6;
const MATERIAL_CLAIM_TOKENS = new Set(['guarantee', 'guaranteed', 'promise', 'promised', 'always', 'never']);

const QUERY_STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'available', 'be', 'can', 'could', 'do', 'does',
  'every', 'for', 'from', 'how', 'i', 'in', 'is', 'it', 'me', 'of', 'on',
  'exists', 'functionality', 'guidance', 'please', 'provide', 'provided',
  'something', 'tell', 'the', 'through', 'to', 'use', 'uses', 'what', 'when',
  'find', 'where', 'which', 'who', 'why', 'work', 'would', 'you',
]);

const SECRET_QUERY = /\b(?:database[_ ]?url|api[_ -]?key|secret key|client[_ -]?secret|jwt[_ -]?secret|signing[_ -]?secret|private key|session token|password hash|password)\b/i;
const LIVE_DATA_QUERY = [
  /\bmy\b.{0,40}\b(?:booking|payment|kyc|claim|dispute|listing|account|payout|refund|transaction)\b/i,
  /\b(?:booking|payment|kyc|claim|dispute|listing|payout|refund|transaction)\s*(?:id|number|#)?\s*[-a-z]*\d[-a-z0-9]*/i,
  /\b(?:how many|which)\b.{0,50}\b(?:pending|open|active|current)\b/i,
  /\b(?:current|latest|pending|open|processed|completed)\b.{0,35}\b(?:state|status|bookings|payments|kyc|claims|disputes|payouts|refunds|transactions)\b/i,
];

function normalizeToken(token: string): string {
  if (token === 'rentipid') return token;
  if (token.startsWith('administrat')) return 'admin';
  if (token === 'newcomer' || token === 'join' || token.startsWith('registr') || token === 'signup') return 'register';
  if (token === 'become' || token.startsWith('onboard')) return 'onboard';
  if (token.startsWith('book') || token.startsWith('reserv')) return 'book';
  if (token === 'help' || token.startsWith('support') || token.startsWith('guidance')) return 'guidance';
  if (token === 'law' || token === 'laws' || token.startsWith('legal') || token.startsWith('compliance') || token.startsWith('regulation') || token.startsWith('jurisdiction')) return 'legal';
  if (token.startsWith('mediat')) return 'dispute';
  if (token.startsWith('review')) return 'review';
  if (token.startsWith('rent')) return 'rent';
  if (token.startsWith('cancel')) return 'cancel';
  if (token.endsWith('ies') && token.length > 4) return `${token.slice(0, -3)}y`;
  if (token.endsWith('s') && token.length > 3) return token.slice(0, -1);
  return token;
}

function tokenize(value: string): string[] {
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

function isStaticKnowledgeQuery(prompt: string): boolean {
  return !SECRET_QUERY.test(prompt) && !LIVE_DATA_QUERY.some(pattern => pattern.test(prompt));
}

export interface RetrievedKnowledgeMatch {
  sourceKey: string;
  version: string;
  chunkKey: string;
  headingPath: string;
  content: string;
  score: number;
  coverage: number;
}

export async function retrieveApprovedKnowledgeMatches(
  prompt: string,
  userRole: string | undefined,
): Promise<RetrievedKnowledgeMatch[]> {
  if (!isStaticKnowledgeQuery(prompt)) return [];
  const queryTokens = tokenize(prompt);
  if (queryTokens.length === 0) return [];
  const now = new Date();
  
  const intentDomains = resolveDomainIntent(prompt);

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

  const matches: RetrievedKnowledgeMatch[] = [];
  for (const source of sources) {
    if (canonicalSourcesPresent && (source.authority === 'OAT_TEST_FIXTURE' || source.sourceKey.startsWith('oat-'))) continue;
    const sourceRoles = parseStoredRoles(source.roles, source.applicableRoles);
    if (!canAccessKnowledge(source.visibility, sourceRoles, userRole)) continue;
    const sourceKeywords = jsonStrings(source.metadata && typeof source.metadata === 'object'
      ? (source.metadata as Record<string, unknown>).keywords
      : undefined);
    const sourceFieldTokens = new Set(tokenize([
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
      const headingTokens = new Set(tokenize(chunk.headingPath));
      const contentTokens = new Set(tokenize(chunk.normalizedContent));
      const keywordTokens = new Set(tokenize(jsonStrings(chunk.keywords).join(' ')));
      let score = 0;
      let matched = 0;
      const matchedTokens = new Set<string>();
      for (const token of queryTokens) {
        let tokenScore = 0;
        if (sourceFieldTokens.has(token)) tokenScore = Math.max(tokenScore, 4);
        if (keywordTokens.has(token)) tokenScore = Math.max(tokenScore, 3);
        if (headingTokens.has(token)) tokenScore = Math.max(tokenScore, 2);
        if (contentTokens.has(token)) tokenScore = Math.max(tokenScore, 1);
        if (tokenScore > 0) {
          matched += 1;
          matchedTokens.add(token);
          score += tokenScore;
        }
      }
      
      const coverage = matched / queryTokens.length;
      if (coverage < MIN_QUERY_COVERAGE) continue;
      const materialClaims = queryTokens.filter(token => MATERIAL_CLAIM_TOKENS.has(token));
      if (materialClaims.some(token => !matchedTokens.has(token))) continue;
      if (source.topic.toLowerCase() === 'overview' && queryTokens.includes('rentipid')) score += 3;
      if (source.authority !== 'LEGACY') score += 0.25;
      
      if (intentDomains.includes(source.module)) {
        score += 5;
      }
      
      // Broad legal/compliance protection
      const isLegalOrCompliance = source.module === 'Legal' || source.module === 'Compliance' || source.topic === 'compliance' || source.topic === 'legal';
      if (isLegalOrCompliance && !intentDomains.includes('Legal') && !intentDomains.includes('Compliance')) {
        score -= 20;
      }

      if (score <= 0) continue;

      matches.push({
        sourceKey: source.sourceKey,
        version: source.version,
        chunkKey: chunk.chunkKey,
        headingPath: chunk.headingPath,
        content: chunk.content,
        score,
        coverage,
      });
    }
  }

  return matches
    .sort((left, right) =>
      right.score - left.score ||
      right.coverage - left.coverage ||
      left.sourceKey.localeCompare(right.sourceKey) ||
      left.chunkKey.localeCompare(right.chunkKey))
    .slice(0, MAX_RESULTS);
}

export async function retrieveApprovedKnowledge(
  prompt: string,
  userRole: string | undefined,
): Promise<string | null> {
  const matches = await retrieveApprovedKnowledgeMatches(prompt, userRole);
  if (matches.length === 0) return null;
  return matches
    .map(match => `[${match.sourceKey} > ${match.headingPath}]\n${match.content}`)
    .join('\n\n');
}
