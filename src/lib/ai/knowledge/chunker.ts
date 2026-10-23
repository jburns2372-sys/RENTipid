import { hashNormalizedContent } from './hashing';
import { normalizeKnowledgeText, normalizeKeywords } from './normalizer';
import type { KnowledgeChunkInput } from './types';
import {
  classifyKnowledgeSourceAudience,
  splitKnowledgeAudienceBlocks,
} from '@/lib/ai/context/customer-knowledge-projection';

export const DEFAULT_MAX_CHUNK_CHARS = 1800;
export const KNOWLEDGE_CHUNK_SCHEMA_VERSION = 'customer-audience-sections-v2';

interface Section {
  headingPath: string;
  content: string;
  visibility?: 'SYSTEM_ONLY';
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 72) || 'section';
}

function splitSections(content: string): Section[] {
  const lines = normalizeKnowledgeText(content).split('\n');
  const headings: string[] = [];
  const sections: Section[] = [];
  let body: string[] = [];
  let currentPath = 'Document';

  const flush = () => {
    const text = normalizeKnowledgeText(body.join('\n'));
    if (text) sections.push({ headingPath: currentPath, content: text });
    body = [];
  };

  for (const line of lines) {
    const match = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (!match) {
      body.push(line);
      continue;
    }
    flush();
    const level = match[1].length;
    headings.splice(level - 1);
    headings[level - 1] = match[2].trim();
    currentPath = headings.filter(Boolean).join(' > ');
  }
  flush();
  return sections.length > 0 ? sections : [{ headingPath: 'Document', content: normalizeKnowledgeText(content) }];
}

function boundSection(section: Section, maxChars: number): Section[] {
  if (section.content.length <= maxChars) return [section];
  const paragraphs = section.content.split(/\n\n+/);
  const parts: Section[] = [];
  let current = '';
  const push = () => {
    if (current.trim()) parts.push({
      headingPath: section.headingPath,
      content: normalizeKnowledgeText(current),
      visibility: section.visibility,
    });
    current = '';
  };
  for (const paragraph of paragraphs) {
    if (paragraph.length > maxChars) {
      push();
      for (let offset = 0; offset < paragraph.length; offset += maxChars) {
        parts.push({
          headingPath: section.headingPath,
          content: paragraph.slice(offset, offset + maxChars).trim(),
          visibility: section.visibility,
        });
      }
      continue;
    }
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length > maxChars) push();
    current = current ? `${current}\n\n${paragraph}` : paragraph;
  }
  push();
  return parts;
}

export function chunkKnowledge(
  sourceKey: string,
  content: string,
  sourceKeywords: string[] = [],
  maxChars = DEFAULT_MAX_CHUNK_CHARS,
): KnowledgeChunkInput[] {
  const sourceAudience = classifyKnowledgeSourceAudience(sourceKey);
  const audienceSections = splitSections(content).flatMap(section =>
    splitKnowledgeAudienceBlocks(section.content, section.headingPath).map((block, blockIndex) => ({
      headingPath: block.audience === 'CUSTOMER'
        && sourceAudience === 'CUSTOMER' ? section.headingPath
        : `${section.headingPath} > ${block.audience === 'SYSTEM' ? 'System' : 'Internal'}`,
      content: block.content,
      visibility: block.audience === 'CUSTOMER' && sourceAudience === 'CUSTOMER'
        ? undefined
        : 'SYSTEM_ONLY' as const,
      blockIndex,
    })));
  const bounded = audienceSections.flatMap(section => boundSection(section, maxChars));
  return bounded.map((section, ordinal) => {
    const normalizedContent = normalizeKnowledgeText(section.content);
    const contentHash = hashNormalizedContent(normalizedContent);
    const index = String(ordinal + 1).padStart(4, '0');
    return {
      chunkKey: `${index}-${slug(section.headingPath)}-${contentHash.slice(0, 10)}`,
      headingPath: section.headingPath,
      content: section.content,
      normalizedContent,
      contentHash,
      keywords: normalizeKeywords([sourceKey, section.headingPath, ...sourceKeywords]),
      ordinal,
      visibility: section.visibility,
    };
  });
}
