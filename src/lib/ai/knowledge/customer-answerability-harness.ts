import { prisma } from '@/lib/prisma';
import { canAccessKnowledge, parseStoredRoles } from './visibility';
import {
  deriveCustomerKnowledgeBlock,
  deriveSectionKey,
} from '../context/customer-knowledge-contract';
import {
  classifyKnowledgeSourceAudience,
  isMixedKnowledgeContent,
} from '../context/customer-knowledge-projection';

const CUSTOMER_ROLES = ['Guest', 'Renter', 'Individual Provider', 'Business Provider'] as const;

export interface AnswerabilityCase {
  sourceKey: string;
  sectionKey: string;
  sectionTitle: string;
  questionSubject: string;
  domain: string;
  entities: readonly string[];
  multiEntities: readonly string[];
  role: string;
  expectedAuthorityClass: 'STATIC_RENTIPID_KNOWLEDGE';
  supportedFactualScope: string;
  variants: readonly {
    question: string;
    context?: readonly { role: 'user' | 'assistant'; content: string }[];
  }[];
}

export interface CustomerAnswerabilityCatalog {
  activeCustomerSources: number;
  activeCustomerSections: number;
  mixedSourceCountBefore: number;
  mixedSourceCountAfter: number;
  cases: readonly AnswerabilityCase[];
  questionVariants: number;
  multiEntityCases: number;
}

function roleFor(visibility: string, roles: string[]): string | undefined {
  return CUSTOMER_ROLES.find(role => canAccessKnowledge(visibility, roles, role));
}

function variantsFor(
  sectionTitle: string,
  sourceTitle: string,
  content: string,
  entities: readonly string[],
  multiEntities: readonly string[],
): AnswerabilityCase['variants'] {
  const subject = sectionTitle === 'Document' || sectionTitle === sourceTitle
    ? sourceTitle
    : `${sectionTitle} in ${sourceTitle}`;
  const variants: Array<AnswerabilityCase['variants'][number]> = [
    { question: `What does RENTipid say about ${subject}?` },
    { question: `Please explain ${subject} on RENTipid.` },
  ];
  if (/\b(?:add|apply|check|choose|complete|create|enter|open|register|request|return|save|select|send|submit|upload|verify)\b/i.test(content)) {
    variants.push({ question: `How does ${subject} work on RENTipid?` });
  }
  if (/\b(?:dashboard|page|screen|menu|open|select)\b/i.test(content)) {
    variants.push({ question: `Where can I find ${subject} on RENTipid?` });
  }
  if (/\b(?:after|before|during|when|within|day|hour|week|month)\b/i.test(content)) {
    variants.push({ question: `When does ${subject} apply on RENTipid?` });
  }
  if (/\b(?:because|required|requires|so that|to protect|to ensure)\b/i.test(content)) {
    variants.push({ question: `Why is ${subject} relevant on RENTipid?` });
  }
  variants.push({
    question: `What about ${subject}?`,
    context: [
      { role: 'user', content: `Tell me about ${sourceTitle} on RENTipid.` },
      { role: 'assistant', content: 'Which part would you like explained?' },
    ],
  });
  if (multiEntities.length >= 2) {
    variants.push({ question: `Can I list ${multiEntities[0]} and ${multiEntities[1]} for rent on RENTipid?` });
  }
  return variants;
}

function supportedMultiEntities(sectionTitle: string, content: string): string[] {
  if (!/\b(?:categor(?:y|ies)|eligibility|supported rental types?)\b/i.test(`${sectionTitle} ${content}`)) {
    return [];
  }
  return [...new Set(content.split(/\r?\n/).flatMap(line => {
    const label = line.match(/^\s*[-*]\s+(?:\*\*)?([^:(*]+?)(?:\*\*)?\s*(?:[:(]|$)/)?.[1]?.trim();
    return label && label.length > 2 && label.length < 64 ? [label] : [];
  }))].slice(0, 8);
}

function metadataChunkSchemaVersion(metadata: unknown): string | undefined {
  return metadata && typeof metadata === 'object' && !Array.isArray(metadata)
    ? (metadata as Record<string, unknown>).chunkSchemaVersion as string | undefined
    : undefined;
}

async function preContractMixedSourceCount(): Promise<number> {
  const superseded = await prisma.aiKnowledgeSource.findMany({
    where: { status: 'SUPERSEDED' },
    include: { chunks: { orderBy: [{ ordinal: 'asc' }, { chunkKey: 'asc' }] } },
    orderBy: { createdAt: 'desc' },
  });
  const baselineBySource = new Map<string, typeof superseded[number]>();
  for (const source of superseded) {
    if (baselineBySource.has(source.sourceKey)
      || metadataChunkSchemaVersion(source.metadata)
      || classifyKnowledgeSourceAudience(source.sourceKey) !== 'CUSTOMER') continue;
    baselineBySource.set(source.sourceKey, source);
  }
  let count = 0;
  for (const source of baselineBySource.values()) {
    const sourceRoles = parseStoredRoles(source.roles, source.applicableRoles);
    if (!roleFor(source.visibility, sourceRoles)) continue;
    const mixed = source.chunks.some(chunk => {
      const visibility = chunk.visibility || source.visibility;
      const roles = chunk.roles ? parseStoredRoles(chunk.roles) : sourceRoles;
      return Boolean(roleFor(visibility, roles))
        && isMixedKnowledgeContent(chunk.content, chunk.headingPath);
    });
    if (mixed) count += 1;
  }
  return count;
}

export async function loadCustomerAnswerabilityCatalog(): Promise<CustomerAnswerabilityCatalog> {
  const now = new Date();
  const sources = await prisma.aiKnowledgeSource.findMany({
    where: {
      status: 'ACTIVE',
      approvalStatus: 'APPROVED',
      effectiveFrom: { lte: now },
      OR: [{ effectiveUntil: null }, { effectiveUntil: { gt: now } }],
    },
    include: { chunks: { orderBy: [{ ordinal: 'asc' }, { chunkKey: 'asc' }] } },
    orderBy: [{ sourceKey: 'asc' }, { version: 'desc' }],
  });
  const cases: AnswerabilityCase[] = [];
  const customerSourceKeys = new Set<string>();
  const mixedSourceKeys = new Set<string>();
  const mixedSourceCountBefore = await preContractMixedSourceCount();

  for (const source of sources) {
    if (source.authority === 'OAT_TEST_FIXTURE' || source.sourceKey.startsWith('oat-')) continue;
    const sourceRoles = parseStoredRoles(source.roles, source.applicableRoles);
    const sourceRole = roleFor(source.visibility, sourceRoles);
    if (!sourceRole) continue;
    const grouped = new Map<string, {
      title: string;
      domain: string;
      entities: Set<string>;
      contents: string[];
      role: string;
    }>();

    for (const chunk of source.chunks) {
      const visibility = chunk.visibility || source.visibility;
      const roles = chunk.roles ? parseStoredRoles(chunk.roles) : sourceRoles;
      const role = roleFor(visibility, roles);
      if (!role) continue;
      if (isMixedKnowledgeContent(chunk.content, chunk.headingPath)) mixedSourceKeys.add(source.sourceKey);
      const block = deriveCustomerKnowledgeBlock({
        sourceKey: source.sourceKey,
        chunkKey: chunk.chunkKey,
        headingPath: chunk.headingPath,
        content: chunk.content,
        ordinal: chunk.ordinal,
        domain: source.module,
        topic: source.topic,
        title: source.title,
        visibility,
        keywords: Array.isArray(chunk.keywords)
          ? chunk.keywords.filter((value): value is string => typeof value === 'string')
          : [],
      });
      if (!block) continue;
      const current = grouped.get(block.sectionKey) ?? {
        title: block.sectionTitle,
        domain: block.domain,
        entities: new Set<string>(),
        contents: [],
        role,
      };
      block.entities.forEach(entity => current.entities.add(entity));
      current.contents.push(block.content);
      grouped.set(block.sectionKey, current);
    }

    if (grouped.size === 0) continue;
    customerSourceKeys.add(source.sourceKey);
    for (const [sectionKey, section] of grouped) {
      const content = section.contents.join('\n');
      const entities = [...section.entities];
      const multiEntities = supportedMultiEntities(section.title, content);
      cases.push(Object.freeze({
        sourceKey: source.sourceKey,
        sectionKey,
        sectionTitle: section.title,
        questionSubject: section.title === 'Document' || section.title === source.title
          ? source.title
          : `${section.title} in ${source.title}`,
        domain: section.domain,
        entities: Object.freeze(entities),
        multiEntities: Object.freeze(multiEntities),
        role: section.role,
        expectedAuthorityClass: 'STATIC_RENTIPID_KNOWLEDGE' as const,
        supportedFactualScope: content.slice(0, 500),
        variants: Object.freeze(variantsFor(
          section.title,
          source.title,
          content,
          entities,
          multiEntities,
        )),
      }));
    }
  }

  return Object.freeze({
    activeCustomerSources: customerSourceKeys.size,
    activeCustomerSections: cases.length,
    mixedSourceCountBefore,
    mixedSourceCountAfter: mixedSourceKeys.size,
    cases: Object.freeze(cases),
    questionVariants: cases.reduce((count, item) => count + item.variants.length, 0),
    multiEntityCases: cases.filter(item => item.multiEntities.length >= 2).length,
  });
}

export function sectionKeyForCase(sourceKey: string, headingPath: string): string {
  return deriveSectionKey(sourceKey, headingPath);
}
