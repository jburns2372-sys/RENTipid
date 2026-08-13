import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MAX_CANDIDATES = 50;
const MAX_RESULTS = 3;
const MIN_TOPIC_MATCH_RATIO = 0.6;

const QUERY_STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'be', 'become', 'can', 'do', 'does', 'every',
  'for', 'how', 'i', 'in', 'is', 'it', 'me', 'of', 'on', 'something',
  'the', 'through', 'to', 'what', 'work'
]);

function normalizeToken(token: string): string {
  if (token === 'rentipid') return token;
  if (token.startsWith('rent')) return 'rent';
  if (token.startsWith('cancel')) return 'cancel';
  if (token.endsWith('ies') && token.length > 4) return `${token.slice(0, -3)}y`;
  if (token.endsWith('s') && token.length > 3) return token.slice(0, -1);
  return token;
}

function tokenize(value: string): string[] {
  const tokens = value.toLowerCase().match(/[a-z0-9]+/g) || [];
  return Array.from(new Set(
    tokens
      .filter(token => !/^\d+$/.test(token))
      .filter(token => !QUERY_STOP_WORDS.has(token))
      .map(normalizeToken)
      .filter(token => !QUERY_STOP_WORDS.has(token))
  ));
}

export async function retrieveApprovedKnowledge(prompt: string, userRole: string | undefined): Promise<string | null> {
  const promptTokens = tokenize(prompt);
  const topicTokens = promptTokens.filter(token => token !== 'rentipid');
  const searchTokens = topicTokens.length > 0
    ? topicTokens
    : promptTokens.includes('rentipid') ? ['rentipid'] : [];

  if (searchTokens.length === 0) {
    return null;
  }

  const now = new Date();
  const knowledgeSources = await prisma.aiKnowledgeSource.findMany({
    where: {
      status: 'ACTIVE',
      effectiveFrom: { lte: now },
      AND: [
        {
          OR: [
            { effectiveUntil: null },
            { effectiveUntil: { gt: now } }
          ]
        },
        {
          OR: searchTokens.flatMap(token => [
            { title: { contains: token, mode: 'insensitive' as const } },
            { slug: { contains: token, mode: 'insensitive' as const } },
            { category: { contains: token, mode: 'insensitive' as const } },
            { sourceReference: { contains: token, mode: 'insensitive' as const } }
          ])
        }
      ]
    },
    orderBy: [
      { effectiveFrom: 'desc' },
      { version: 'desc' },
      { slug: 'asc' }
    ],
    take: MAX_CANDIDATES
  });

  const validSources = knowledgeSources
    .filter(source => {
      if (source.applicableRoles.trim().toLowerCase() === 'all') return true;
      if (!userRole) return false;
      const roles = source.applicableRoles
        .split(',')
        .map(role => role.trim().toLowerCase());
      return roles.includes(userRole.toLowerCase()) || roles.includes('all');
    })
    .map(source => {
      const sourceTokens = new Set(tokenize([
        source.slug,
        source.title,
        source.category,
        source.sourceReference || ''
      ].join(' ')));
      const matchedTopicCount = topicTokens.filter(token => sourceTokens.has(token)).length;
      const relevance = topicTokens.length === 0 ? 1 : matchedTopicCount / topicTokens.length;
      const overviewBoost = topicTokens.length === 0 && source.category.toLowerCase() === 'overview' ? 1 : 0;
      return { source, relevance, overviewBoost };
    })
    .filter(result => result.relevance >= MIN_TOPIC_MATCH_RATIO)
    .sort((a, b) => b.overviewBoost - a.overviewBoost || b.relevance - a.relevance)
    .slice(0, MAX_RESULTS)
    .map(result => result.source);

  if (validSources.length === 0) {
    return null;
  }

  return validSources
    .map(source => source.sourceReference || source.title)
    .join('\n');
}
