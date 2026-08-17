import type { Prisma, PrismaClient } from '@prisma/client';
import { adaptKnowledgeSource } from './adapters';
import { chunkKnowledge } from './chunker';
import { classifyKnowledge } from './classifier';
import { hashNormalizedContent } from './hashing';
import { hashStableObject } from './hashing';
import { normalizeKnowledgeText } from './normalizer';
import { getSynchronizableKnowledgeRegistry, KNOWLEDGE_REGISTRY_ID } from './source-registry';
import type {
  AdaptedKnowledge,
  KnowledgeChunkInput,
  KnowledgeDiffItem,
  KnowledgeRegistryEntry,
  KnowledgeValidationIssue,
} from './types';
import { validateKnowledgeContent, validateRegistryLocator } from './validator';

export interface PreparedKnowledgeSource {
  entry: KnowledgeRegistryEntry;
  adapted: AdaptedKnowledge;
  normalizedContent: string;
  contentHash: string;
  chunks: KnowledgeChunkInput[];
  issues: KnowledgeValidationIssue[];
}

function sourceSlug(sourceKey: string, version: string): string {
  return `${sourceKey}--${version}`
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 180);
}

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export function resolveEffectiveKnowledgeVersion(
  entry: KnowledgeRegistryEntry,
  contentHash: string,
  existingVersions: Array<{ version: string; contentHash: string | null }>,
  metadataFingerprint?: string,
): string {
  const baseExists = existingVersions.some(existing => existing.version === entry.version);
  if (!baseExists) return entry.version;

  const baseMatchesContent = existingVersions.some(
    existing => existing.version === entry.version && existing.contentHash === contentHash,
  );
  if (baseMatchesContent && !metadataFingerprint) return entry.version;

  const suffix = (metadataFingerprint ?? contentHash).slice(0, 12);
  const candidate = `${entry.version}+${suffix}`;
  if (!existingVersions.some(existing => existing.version === candidate)) return candidate;

  let sequence = 2;
  while (existingVersions.some(existing => existing.version === `${candidate}-${sequence}`)) sequence += 1;
  return `${candidate}-${sequence}`;
}

function rolesFromJson(value: Prisma.JsonValue): string[] {
  return Array.isArray(value)
    ? value.filter((role): role is string => typeof role === 'string').sort()
    : [];
}

function metadataFingerprint(entry: KnowledgeRegistryEntry, title: string): string {
  return hashStableObject({
    title,
    module: entry.module,
    topic: entry.topic,
    sourceType: entry.sourceType,
    sourceLocator: entry.sourceLocator,
    authority: entry.authority,
    approvalEvidence: entry.approvalEvidence,
    visibility: entry.visibility,
    roles: [...entry.roles].sort(),
  });
}

function sourceMetadataMatches(
  source: {
    module: string | null;
    topic: string | null;
    sourceType: string;
    sourceLocator: string | null;
    authority: string | null;
    approvalEvidence: string | null;
    visibility: string;
    roles: Prisma.JsonValue;
    title: string;
    approvalStatus: string;
  },
  entry: KnowledgeRegistryEntry,
  title: string,
): boolean {
  return source.title === title
    && source.approvalStatus === 'APPROVED'
    && source.module === entry.module
    && source.topic === entry.topic
    && source.sourceType === entry.sourceType
    && source.sourceLocator === entry.sourceLocator
    && source.authority === entry.authority
    && source.approvalEvidence === entry.approvalEvidence
    && source.visibility === entry.visibility
    && JSON.stringify(rolesFromJson(source.roles)) === JSON.stringify([...entry.roles].sort());
}

export async function prepareKnowledgeSource(
  entry: KnowledgeRegistryEntry,
  prisma: PrismaClient,
  root = process.cwd(),
): Promise<PreparedKnowledgeSource> {
  classifyKnowledge(entry);
  const locatorIssues = validateRegistryLocator(entry, root);
  const adapted = await adaptKnowledgeSource(entry, prisma, root);
  const normalizedContent = normalizeKnowledgeText(adapted.content);
  const contentHash = hashNormalizedContent(normalizedContent);
  const chunks = chunkKnowledge(entry.sourceKey, normalizedContent, adapted.keywords ?? []);
  const contentIssues = validateKnowledgeContent(entry, adapted, chunks);
  return { entry, adapted, normalizedContent, contentHash, chunks, issues: [...locatorIssues, ...contentIssues] };
}

export async function prepareCanonicalKnowledge(
  prisma: PrismaClient,
  root = process.cwd(),
): Promise<PreparedKnowledgeSource[]> {
  const prepared: PreparedKnowledgeSource[] = [];
  for (const entry of getSynchronizableKnowledgeRegistry(root)) {
    prepared.push(await prepareKnowledgeSource(entry, prisma, root));
  }
  return prepared;
}

export async function diffKnowledge(
  prisma: PrismaClient,
  root = process.cwd(),
): Promise<{ prepared: PreparedKnowledgeSource[]; items: KnowledgeDiffItem[] }> {
  const prepared = await prepareCanonicalKnowledge(prisma, root);
  const existing = await prisma.aiKnowledgeSource.findMany({
    where: { sourceKey: { in: prepared.map(item => item.entry.sourceKey) } },
    select: {
      sourceKey: true,
      version: true,
      status: true,
      contentHash: true,
      module: true,
      topic: true,
      sourceType: true,
      sourceLocator: true,
      authority: true,
      approvalEvidence: true,
      visibility: true,
      roles: true,
      title: true,
      approvalStatus: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  const items = prepared.map(item => {
    const versions = existing.filter(source => source.sourceKey === item.entry.sourceKey);
    const active = versions.find(source => source.status === 'ACTIVE');
    const metadataMatches = active ? sourceMetadataMatches(active, item.entry, item.adapted.title) : false;
    let action: KnowledgeDiffItem['action'];
    if (item.issues.length > 0) action = 'INVALID';
    else if (!active) action = 'CREATE';
    else if (active.contentHash === item.contentHash && metadataMatches) action = 'NO_OP';
    else action = 'CREATE_NEW_VERSION';
    const version = resolveEffectiveKnowledgeVersion(
      item.entry,
      item.contentHash,
      versions,
      active?.contentHash === item.contentHash && !metadataMatches
        ? metadataFingerprint(item.entry, item.adapted.title)
        : undefined,
    );
    return {
      sourceKey: item.entry.sourceKey,
      module: item.entry.module,
      action,
      expectedVersion: item.entry.version,
      effectiveVersion: version,
      expectedHash: item.contentHash,
      currentHash: active?.contentHash,
      chunkCount: item.chunks.length,
      issues: item.issues.map(issue => `${issue.category}:${issue.location}`),
    };
  });
  return { prepared, items };
}

export interface KnowledgeSyncSummary {
  created: number;
  newVersions: number;
  noOp: number;
  failed: number;
  chunksCreated: number;
  items: KnowledgeDiffItem[];
}

export async function synchronizeKnowledge(
  prisma: PrismaClient,
  root = process.cwd(),
): Promise<KnowledgeSyncSummary> {
  const { prepared, items } = await diffKnowledge(prisma, root);
  const summary: KnowledgeSyncSummary = {
    created: 0,
    newVersions: 0,
    noOp: 0,
    failed: 0,
    chunksCreated: 0,
    items,
  };

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const source = prepared[index];
    if (item.action === 'INVALID' || item.action === 'MISSING') {
      summary.failed += 1;
      continue;
    }
    if (item.action === 'NO_OP') {
      summary.noOp += 1;
      continue;
    }
    await prisma.$transaction(async transaction => {
      const priorActive = await transaction.aiKnowledgeSource.findFirst({
        where: { sourceKey: source.entry.sourceKey, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
      });
      const now = new Date();
      const created = await transaction.aiKnowledgeSource.create({
        data: {
          slug: sourceSlug(source.entry.sourceKey, item.effectiveVersion),
          sourceKey: source.entry.sourceKey,
          title: source.adapted.title,
          module: source.entry.module,
          topic: source.entry.topic,
          category: source.entry.topic,
          applicableRoles: source.entry.visibility === 'PUBLIC' ? 'All' : source.entry.roles.join(','),
          roles: json(source.entry.roles),
          visibility: source.entry.visibility,
          status: 'ACTIVE',
          approvalStatus: 'APPROVED',
          authority: source.entry.authority,
          approvalEvidence: source.entry.approvalEvidence,
          version: item.effectiveVersion,
          effectiveFrom: now,
          sourceType: source.entry.sourceType,
          sourceLocator: source.entry.sourceLocator,
          sourceReference: source.entry.sourceLocator,
          contentHash: source.contentHash,
          lastSyncedAt: now,
          supersedesId: priorActive?.id,
          metadata: json({
            registryId: KNOWLEDGE_REGISTRY_ID,
            registrySequence: source.entry.sequence,
            disposition: source.entry.disposition,
            ...source.adapted.metadata,
          }),
          chunks: {
            create: source.chunks.map(chunk => ({
              chunkKey: chunk.chunkKey,
              headingPath: chunk.headingPath,
              content: chunk.content,
              normalizedContent: chunk.normalizedContent,
              contentHash: chunk.contentHash,
              keywords: json(chunk.keywords),
              ordinal: chunk.ordinal,
              visibility: chunk.visibility,
              roles: chunk.roles ? json(chunk.roles) : undefined,
            })),
          },
        },
      });
      if (priorActive) {
        await transaction.aiKnowledgeSource.update({
          where: { id: priorActive.id },
          data: { status: 'SUPERSEDED', effectiveUntil: now },
        });
      }
      const createdChunkCount = await transaction.aiKnowledgeChunk.count({
        where: { knowledgeSourceId: created.id },
      });
      if (createdChunkCount !== source.chunks.length) {
        throw new Error(`KNOWLEDGE_CHUNK_PARITY_FAILED:${source.entry.sourceKey}`);
      }
    });
    summary.chunksCreated += source.chunks.length;
    if (item.action === 'CREATE') summary.created += 1;
    else summary.newVersions += 1;
  }
  if (summary.failed > 0) {
    throw new Error(`KNOWLEDGE_SYNC_VALIDATION_FAILED:${summary.failed}`);
  }
  return summary;
}
