import { prisma } from '@/lib/prisma';
import { deriveSectionKey } from './customer-knowledge-contract';
import { POLICY_AUTHORITY_KEYS } from './policy-authority';
import type { SeedCanonicalIntent } from './canonical-intent-registry';

export const LIVE_SERVICE_AUTHORITIES = Object.freeze([
  'AUTHORIZED_LISTING_PROVIDER_SERVICE',
  'AUTHORIZED_PAYOUT_FINANCE_SERVICE',
  'AUTHORIZED_PAYMENT_SERVICE',
  'AUTHORIZED_CLAIM_CASE_SERVICE',
] as const);

export const TOOL_AUTHORITIES = Object.freeze([
  'cancelBooking',
] as const);

export interface CanonicalAuthorityIntegrityReport {
  danglingKnowledgeReferences: number;
  danglingPolicyReferences: number;
  danglingLiveServiceReferences: number;
  danglingToolReferences: number;
  authorityUnboundIntents: number;
  issues: readonly string[];
  passed: boolean;
}

export async function validateCanonicalAuthorityBindings(
  catalog: readonly SeedCanonicalIntent[],
): Promise<CanonicalAuthorityIntegrityReport> {
  const knowledgeKeys = [...new Set(catalog.flatMap(intent => intent.accessScopes)
    .filter(scope => scope.authorityType === 'KNOWLEDGE_CENTER')
    .map(scope => scope.knowledgeSourceKey ?? scope.authorityReference))];
  const sources = await prisma.aiKnowledgeSource.findMany({
    where: {
      sourceKey: { in: knowledgeKeys },
      status: 'ACTIVE',
      approvalStatus: 'APPROVED',
    },
    include: { chunks: { select: { headingPath: true } } },
  });
  const sourceMap = new Map(sources.map(source => [source.sourceKey, source]));
  const issues: string[] = [];
  let danglingKnowledgeReferences = 0;
  let danglingPolicyReferences = 0;
  let danglingLiveServiceReferences = 0;
  let danglingToolReferences = 0;
  let authorityUnboundIntents = 0;

  for (const intent of catalog) {
    if (intent.accessScopes.length === 0) {
      authorityUnboundIntents++;
      issues.push(`UNBOUND:${intent.intentKey}`);
      continue;
    }
    for (const scope of intent.accessScopes) {
      if (scope.authorityType === 'KNOWLEDGE_CENTER') {
        const sourceKey = scope.knowledgeSourceKey ?? scope.authorityReference;
        const source = sourceMap.get(sourceKey);
        const sectionExists = !scope.knowledgeSectionKey || source?.chunks.some(chunk =>
          deriveSectionKey(sourceKey, chunk.headingPath) === scope.knowledgeSectionKey);
        if (!source || !sectionExists) {
          danglingKnowledgeReferences++;
          issues.push(`KNOWLEDGE:${intent.intentKey}`);
        }
      } else if (scope.authorityType === 'POLICY_TAXONOMY') {
        if (!POLICY_AUTHORITY_KEYS.includes(scope.authorityReference as (typeof POLICY_AUTHORITY_KEYS)[number])) {
          danglingPolicyReferences++;
          issues.push(`POLICY:${intent.intentKey}`);
        }
      } else if (scope.authorityType === 'LIVE_SERVICE') {
        const key = scope.liveServiceKey ?? scope.authorityReference;
        if (!LIVE_SERVICE_AUTHORITIES.includes(key as (typeof LIVE_SERVICE_AUTHORITIES)[number])) {
          danglingLiveServiceReferences++;
          issues.push(`LIVE:${intent.intentKey}`);
        }
      } else if (scope.authorityType === 'TOOL_GATEWAY') {
        const key = scope.toolKey ?? scope.authorityReference;
        if (!TOOL_AUTHORITIES.includes(key as (typeof TOOL_AUTHORITIES)[number])) {
          danglingToolReferences++;
          issues.push(`TOOL:${intent.intentKey}`);
        }
      }
    }
  }

  return {
    danglingKnowledgeReferences,
    danglingPolicyReferences,
    danglingLiveServiceReferences,
    danglingToolReferences,
    authorityUnboundIntents,
    issues: Object.freeze(issues),
    passed: issues.length === 0,
  };
}
