import type { PrismaClient } from '@prisma/client';
import { getKnowledgeRegistry, isSynchronizable, KNOWLEDGE_REGISTRY_ID } from './source-registry';
import { prepareCanonicalKnowledge } from './synchronizer';
import type { KnowledgeCoverageItem, KnowledgeCoverageReport } from './types';

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').sort()
    : [];
}

export async function buildKnowledgeCoverageReport(
  prisma: PrismaClient,
  root = process.cwd(),
): Promise<KnowledgeCoverageReport> {
  const registry = getKnowledgeRegistry(root);
  const prepared = await prepareCanonicalKnowledge(prisma, root);
  const preparedByKey = new Map(prepared.map(item => [item.entry.sourceKey, item]));
  const stored = await prisma.aiKnowledgeSource.findMany({
    where: { sourceKey: { in: registry.map(entry => entry.sourceKey) } },
    include: {
      chunks: {
        select: {
          chunkKey: true,
          contentHash: true,
          visibility: true,
          roles: true,
        },
      },
    },
  });

  const items: KnowledgeCoverageItem[] = registry.map(entry => {
    const expected = preparedByKey.get(entry.sourceKey);
    const versions = stored.filter(source => source.sourceKey === entry.sourceKey);
    const activeVersions = versions.filter(source => source.status === 'ACTIVE');
    const active = activeVersions[0];
    const excluded = !isSynchronizable(entry);
    const duplicate = activeVersions.length > 1;
    const missing = !excluded && !active;
    const invalid = Boolean(expected?.issues.length);
    const metadataMatches = Boolean(active && expected
      && active.title === expected.adapted.title
      && active.module === entry.module
      && active.topic === entry.topic
      && active.sourceType === entry.sourceType
      && active.sourceLocator === entry.sourceLocator
      && active.authority === entry.authority
      && active.approvalEvidence === entry.approvalEvidence
      && active.visibility === entry.visibility
      && JSON.stringify(stringArray(active.roles)) === JSON.stringify([...entry.roles].sort()));
    const expectedChunkState = expected?.chunks.map(chunk => ({
      chunkKey: chunk.chunkKey,
      contentHash: chunk.contentHash,
      visibility: chunk.visibility ?? null,
      roles: [...(chunk.roles ?? [])].sort(),
    })).sort((left, right) => left.chunkKey.localeCompare(right.chunkKey)) ?? [];
    const activeChunkState = active?.chunks.map(chunk => ({
      chunkKey: chunk.chunkKey,
      contentHash: chunk.contentHash,
      visibility: chunk.visibility,
      roles: stringArray(chunk.roles),
    })).sort((left, right) => left.chunkKey.localeCompare(right.chunkKey)) ?? [];
    const stale = Boolean(!excluded && active && expected && (
      active.contentHash !== expected.contentHash
      || !active.version.startsWith(entry.version)
      || !metadataMatches
      || JSON.stringify(activeChunkState) !== JSON.stringify(expectedChunkState)
    ));
    const expectedChunks = expected?.chunks.length ?? 0;
    const chunkCount = active?.chunks.length ?? 0;
    const covered = excluded || Boolean(
      active &&
      active.approvalStatus === 'APPROVED' &&
      !duplicate &&
      !invalid &&
      !stale &&
      chunkCount === expectedChunks &&
      expectedChunks > 0
    );
    return {
      module: entry.module,
      sourceKey: entry.sourceKey,
      approval: entry.disposition === 'CONDITIONAL_APPROVED' ? 'CONDITIONAL' : 'APPROVED',
      visibility: entry.visibility,
      version: active?.version ?? entry.version,
      disposition: entry.disposition,
      active: Boolean(active),
      missing,
      invalid,
      excluded,
      duplicate,
      stale,
      chunkCount,
      covered,
    };
  });

  const denominator = items.filter(item => !item.excluded);
  const covered = denominator.filter(item => item.covered).length;
  return {
    registryId: KNOWLEDGE_REGISTRY_ID,
    generatedAt: new Date().toISOString(),
    totalCandidates: registry.length,
    accountedCandidates: items.length,
    unclassified: registry.filter(entry => !entry.disposition).length,
    unaccounted: Math.max(0, registry.length - items.length),
    approvedCanonicalSources: denominator.length,
    activeSources: denominator.filter(item => item.active).length,
    excludedSources: items.filter(item => item.excluded).length,
    systemOnlySources: items.filter(item => item.disposition === 'SYSTEM_ONLY').length,
    superAdminOnlySources: items.filter(item => item.disposition === 'SUPER_ADMIN_ONLY').length,
    totalChunks: denominator.reduce((sum, item) => sum + item.chunkCount, 0),
    missing: denominator.filter(item => item.missing).length,
    invalid: denominator.filter(item => item.invalid).length,
    duplicates: denominator.filter(item => item.duplicate).length,
    stale: denominator.filter(item => item.stale).length,
    coveragePercent: denominator.length === 0 ? 100 : Number(((covered / denominator.length) * 100).toFixed(2)),
    items,
  };
}
