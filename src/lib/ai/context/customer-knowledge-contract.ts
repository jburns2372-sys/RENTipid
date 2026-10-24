import type { KnowledgeAudience } from './customer-knowledge-projection';
import {
  classifyKnowledgeAudience,
  classifyKnowledgeSourceAudience,
  projectCustomerAnswerableText,
} from './customer-knowledge-projection';

export type CustomerKnowledgeAnswerClass = 'INFORMATION';

export interface CustomerKnowledgeBlockInput {
  sourceKey: string;
  chunkKey: string;
  headingPath: string;
  content: string;
  ordinal: number;
  domain: string;
  topic: string;
  title: string;
  visibility: string;
  keywords?: readonly string[];
}

export interface CustomerKnowledgeBlock {
  sourceKey: string;
  sectionKey: string;
  sectionTitle: string;
  chunkKey: string;
  ordinal: number;
  domain: string;
  entities: readonly string[];
  topics: readonly string[];
  visibility: string;
  audience: KnowledgeAudience;
  answerClass: CustomerKnowledgeAnswerClass;
  content: string;
}

const ENTITY_STOP_WORDS = new Set([
  'about', 'and', 'approved', 'customer', 'document', 'for', 'general', 'guidance',
  'guide', 'information', 'rentipid', 'section', 'status', 'support', 'the', 'this',
  'using', 'with',
]);

function slug(value: string): string {
  return value.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 96) || 'document';
}

export function deriveSectionKey(sourceKey: string, headingPath: string): string {
  return `${slug(sourceKey)}:${slug(headingPath)}`;
}

export function deriveSectionTitle(headingPath: string, title: string): string {
  return headingPath.split('>').map(value => value.trim()).filter(Boolean).at(-1) || title;
}

function derivedEntities(input: CustomerKnowledgeBlockInput): string[] {
  const candidates = [input.topic, input.headingPath, ...(input.keywords ?? [])];
  return [...new Set(candidates.join(' ').toLowerCase().match(/[a-z0-9]+/g) ?? [])]
    .filter(token => token.length > 2 && !ENTITY_STOP_WORDS.has(token))
    .slice(0, 16);
}

export function deriveCustomerKnowledgeBlock(
  input: CustomerKnowledgeBlockInput,
): CustomerKnowledgeBlock | null {
  if (classifyKnowledgeSourceAudience(input.sourceKey) !== 'CUSTOMER') return null;
  const audienceContext = input.headingPath;
  const content = projectCustomerAnswerableText(input.content, audienceContext);
  const audience = classifyKnowledgeAudience(content, audienceContext);
  if (!content || audience !== 'CUSTOMER') return null;
  return Object.freeze({
    sourceKey: input.sourceKey,
    sectionKey: deriveSectionKey(input.sourceKey, input.headingPath),
    sectionTitle: deriveSectionTitle(input.headingPath, input.title),
    chunkKey: input.chunkKey,
    ordinal: input.ordinal,
    domain: input.domain,
    entities: Object.freeze(derivedEntities(input)),
    topics: Object.freeze([...new Set([input.topic, deriveSectionTitle(input.headingPath, input.title)])]),
    visibility: input.visibility,
    audience,
    answerClass: 'INFORMATION',
    content,
  });
}
