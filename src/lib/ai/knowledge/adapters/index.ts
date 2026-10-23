import type { PrismaClient } from '@prisma/client';
import type { AdaptedKnowledge, KnowledgeRegistryEntry } from '../types';
import { adaptRegisteredDocument } from './document-adapter';
import { adaptPublishedRoute } from './published-route-adapter';
import { adaptStructuredProvider } from './structured-provider-adapter';

export async function adaptKnowledgeSource(
  entry: KnowledgeRegistryEntry,
  prisma: PrismaClient,
  root = process.cwd(),
): Promise<AdaptedKnowledge> {
  if (entry.adapter === 'document-markdown') return adaptRegisteredDocument(entry, root);
  if (entry.adapter === 'published-route-allowlist') return adaptPublishedRoute(entry);
  if (entry.adapter.startsWith('structured:')) return adaptStructuredProvider(entry, prisma);
  throw new Error(`KNOWLEDGE_ADAPTER_NOT_REGISTERED:${entry.sourceKey}:${entry.adapter}`);
}
