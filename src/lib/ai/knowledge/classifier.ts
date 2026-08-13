import type { KnowledgeRegistryEntry } from './types';

export function classifyKnowledge(entry: KnowledgeRegistryEntry): {
  module: string;
  topic: string;
  sourceType: string;
} {
  if (!entry.module || !entry.topic || !entry.sourceType) {
    throw new Error(`KNOWLEDGE_CLASSIFICATION_MISSING:${entry.sourceKey}`);
  }
  return { module: entry.module, topic: entry.topic, sourceType: entry.sourceType };
}
