import { readFile } from 'fs/promises';
import { resolve } from 'path';
import type { AdaptedKnowledge, KnowledgeRegistryEntry } from '../types';

function titleFromMarkdown(content: string, fallback: string): string {
  return content.match(/^#\s+(.+?)\s*$/m)?.[1]?.trim() ?? fallback;
}

export async function adaptRegisteredDocument(
  entry: KnowledgeRegistryEntry,
  root = process.cwd(),
): Promise<AdaptedKnowledge> {
  if (entry.adapter !== 'document-markdown') {
    throw new Error(`DOCUMENT_ADAPTER_REJECTED:${entry.sourceKey}`);
  }
  const content = await readFile(resolve(root, entry.sourceLocator), 'utf8');
  return {
    title: titleFromMarkdown(content, entry.topic),
    content,
    keywords: [entry.module, entry.topic, entry.sourceKey],
    metadata: {
      representation: 'MARKDOWN',
      sourceLocator: entry.sourceLocator,
      approvalEvidence: entry.approvalEvidence,
    },
  };
}
