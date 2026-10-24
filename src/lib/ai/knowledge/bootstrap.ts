import type { PrismaClient } from '@prisma/client';
import { assertKnowledgeMutationEnvironment } from './environment-guard';
import { synchronizeKnowledge, type KnowledgeSyncSummary } from './synchronizer';

export async function bootstrapKnowledge(
  prisma: PrismaClient,
  options: { repeat?: number; root?: string; environment?: Readonly<Record<string, string | undefined>> } = {},
): Promise<KnowledgeSyncSummary[]> {
  assertKnowledgeMutationEnvironment(options.environment ?? process.env);
  const repeat = options.repeat ?? 1;
  if (!Number.isInteger(repeat) || repeat < 1 || repeat > 10) {
    throw new Error('KNOWLEDGE_BOOTSTRAP_REPEAT_MUST_BE_1_TO_10');
  }
  const summaries: KnowledgeSyncSummary[] = [];
  for (let iteration = 0; iteration < repeat; iteration += 1) {
    summaries.push(await synchronizeKnowledge(prisma, options.root ?? process.cwd()));
  }
  return summaries;
}
