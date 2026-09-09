import { prisma } from '@/lib/prisma';
import { createHash } from 'node:crypto';
import { loadCustomerAnswerabilityCatalog } from '@/lib/ai/knowledge/customer-answerability-harness';

export interface SeedAccessScope {
  audience: 'RENTER' | 'PROVIDER' | 'ADMIN' | 'INTERNAL' | 'PUBLIC';
  role: string;
  requiredPermission?: string;
  answerClass: 'INFORMATION' | 'ELIGIBILITY_POLICY' | 'PERSONALIZED_READ' | 'ACTION' | 'UNSUPPORTED_EXTERNAL';
  authorityType: 'KNOWLEDGE_CENTER' | 'POLICY_TAXONOMY' | 'LIVE_SERVICE' | 'TOOL_GATEWAY';
  authorityReference: string;
  knowledgeSourceKey?: string;
  knowledgeSectionKey?: string;
  liveServiceKey?: string;
  toolKey?: string;
}

export interface SeedAlias {
  aliasText: string;
  aliasType: 'SYNONYM' | 'COLLOQUIAL' | 'ABBREVIATION' | 'TYPO' | 'ROLE_SPECIFIC';
  confidence?: number;
}

export interface SeedCanonicalIntent {
  intentKey: string;
  canonicalQuestion: string;
  domain: string;
  feature: string;
  aliases: SeedAlias[];
  accessScopes: SeedAccessScope[];
}

export interface CanonicalQuestionSuggestion {
  id: string;
  text: string;
  type: 'question';
  intent: string;
}

export function normalizeQuestionText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/gi, '')
    .replace(/\b(?:a|an|the)\b/g, ' ')
    .replace(/\s+/g, ' ');
}

export const CANONICAL_INTENT_SEED_CATALOG: SeedCanonicalIntent[] = [
  // Internal / Developer / Admin Management
  {
    intentKey: 'internal.knowledge.validation_process',
    canonicalQuestion: 'How do I validate Knowledge Center integrity?',
    domain: 'Core Architecture',
    feature: 'knowledge_management',
    aliases: [
      { aliasText: 'How to run knowledge validate script', aliasType: 'SYNONYM' },
      { aliasText: 'What command checks knowledge hash', aliasType: 'SYNONYM' }
    ],
    accessScopes: [
      {
        audience: 'INTERNAL',
        role: 'Super Admin',
        requiredPermission: 'KNOWLEDGE_ADMIN',
        answerClass: 'INFORMATION',
        authorityType: 'KNOWLEDGE_CENTER',
        authorityReference: 'ai.implementation-registry',
        knowledgeSourceKey: 'ai.implementation-registry'
      },
      {
        audience: 'INTERNAL',
        role: 'Admin',
        requiredPermission: 'KNOWLEDGE_ADMIN',
        answerClass: 'INFORMATION',
        authorityType: 'KNOWLEDGE_CENTER',
        authorityReference: 'ai.implementation-registry',
        knowledgeSourceKey: 'ai.implementation-registry'
      }
    ]
  },
  {
    intentKey: 'internal.release.gate_status',
    canonicalQuestion: 'What are the 14 hard gates for Unified AI v1.1 release?',
    domain: 'Core Architecture',
    feature: 'release_gate_verification',
    aliases: [
      { aliasText: 'Explain G1 through G14 hard release gates', aliasType: 'SYNONYM' },
      { aliasText: 'What evidence is needed for G14 freeze', aliasType: 'SYNONYM' }
    ],
    accessScopes: [
      {
        audience: 'INTERNAL',
        role: 'Super Admin',
        requiredPermission: 'SYSTEM_ADMIN',
        answerClass: 'INFORMATION',
        authorityType: 'KNOWLEDGE_CENTER',
        authorityReference: 'ai.requirements-traceability',
        knowledgeSourceKey: 'ai.requirements-traceability'
      }
    ]
  }
];

function generatedIntentKey(sourceKey: string, sectionKey: string): string {
  const readable = `${sourceKey}.${sectionKey.split(':').at(-1) ?? 'section'}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.|\.$/g, '')
    .slice(0, 96);
  const digest = createHash('sha256').update(`${sourceKey}:${sectionKey}`).digest('hex').slice(0, 10);
  return `knowledge.${readable}.${digest}`;
}

function audienceForRole(role: string): SeedAccessScope['audience'] {
  if (role === 'Guest') return 'PUBLIC';
  if (role.includes('Provider')) return 'PROVIDER';
  if (role === 'Renter') return 'RENTER';
  return 'ADMIN';
}

import { CANONICAL_CUSTOMER_OBJECTIVES } from './customer-objective-catalog';

function generatedAliases(
  canonicalQuestion: string,
  variants: readonly { question: string; context?: readonly unknown[] }[],
): SeedAlias[] {
  const seen = new Set([normalizeQuestionText(canonicalQuestion)]);
  const aliases: SeedAlias[] = [];
  for (const variant of variants) {
    if (variant.context) continue;
    const normalized = normalizeQuestionText(variant.question);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    aliases.push({ aliasText: variant.question, aliasType: 'SYNONYM' });
    if (aliases.length === 3) break;
  }
  return aliases;
}

export async function buildComprehensiveCanonicalIntentCatalog(): Promise<SeedCanonicalIntent[]> {
  const catalog = [...CANONICAL_INTENT_SEED_CATALOG];
  const seenIntentKeys = new Set(catalog.map(i => i.intentKey));
  const reservedQuestions = new Set(catalog.flatMap(intent => [
    normalizeQuestionText(intent.canonicalQuestion),
    ...intent.aliases.map(alias => normalizeQuestionText(alias.aliasText)),
  ]));

  // Merge Master Canonical Customer Objectives
  for (const obj of CANONICAL_CUSTOMER_OBJECTIVES) {
    if (seenIntentKeys.has(obj.objectiveId)) continue;
    seenIntentKeys.add(obj.objectiveId);

    const roles: string[] = obj.persona === 'ALL_CUSTOMERS'
      ? ['Guest', 'Renter', 'Individual Provider', 'Business Provider']
      : obj.persona === 'RENTER'
      ? ['Renter', 'Guest']
      : obj.persona === 'PROVIDER'
      ? ['Individual Provider', 'Business Provider']
      : obj.persona === 'ADMIN'
      ? ['Admin', 'Super Admin']
      : ['Guest'];

    let authorityType: SeedAccessScope['authorityType'] = 'KNOWLEDGE_CENTER';
    let answerClass: SeedAccessScope['answerClass'] = 'INFORMATION';
    if (obj.answerContract.authorityClass === 'POLICY_AUTHORITY') {
      authorityType = 'POLICY_TAXONOMY';
      answerClass = 'ELIGIBILITY_POLICY';
    } else if (obj.answerContract.authorityClass === 'LIVE_SERVICE' || obj.answerContract.authorityClass === 'POLICY_PLUS_LIVE') {
      authorityType = 'LIVE_SERVICE';
      answerClass = 'PERSONALIZED_READ';
    } else if (obj.answerContract.authorityClass === 'ACTION_TOOL') {
      authorityType = 'TOOL_GATEWAY';
      answerClass = 'ACTION';
    } else if (obj.answerContract.authorityClass === 'UNSUPPORTED_NOT_ACTIVE' || obj.answerContract.authorityClass === 'MISSING_APPROVED_KNOWLEDGE') {
      authorityType = 'POLICY_TAXONOMY';
      answerClass = 'UNSUPPORTED_EXTERNAL';
    }

    const accessScopes: SeedAccessScope[] = roles.map(role => ({
      audience: audienceForRole(role),
      role,
      answerClass,
      authorityType,
      authorityReference: obj.answerContract.authorityReference,
      knowledgeSourceKey: obj.answerContract.knowledgeSourceKey,
      knowledgeSectionKey: obj.answerContract.knowledgeSectionKey,
      liveServiceKey: obj.answerContract.liveServiceKey,
      toolKey: obj.answerContract.toolKey,
    }));

    const aliases: SeedAlias[] = obj.aliases.map(a => ({
      aliasText: a.text,
      aliasType: a.style === 'TYPO' ? 'TYPO' : a.style === 'TAGLISH' || a.style === 'COLLOQUIAL' ? 'COLLOQUIAL' : 'SYNONYM',
      confidence: 1.0,
    }));

    for (const a of aliases) {
      reservedQuestions.add(normalizeQuestionText(a.aliasText));
    }
    reservedQuestions.add(normalizeQuestionText(obj.canonicalQuestion));

    catalog.push({
      intentKey: obj.objectiveId,
      canonicalQuestion: obj.canonicalQuestion,
      domain: obj.domain,
      feature: obj.subdomain.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
      aliases,
      accessScopes,
    });
  }

  const answerability = await loadCustomerAnswerabilityCatalog();

  for (const item of answerability.cases) {
    if (item.sourceKey === 'provider.marketplace-taxonomy'
      || item.sourceKey === 'provider.prohibited-items') continue;
    if (item.sourceKey === 'provider.workflow-status' && item.sectionTitle === 'Listings') continue;
    if (item.sourceKey === 'core.registration-onboarding'
      && /password reset/i.test(item.sectionTitle)) continue;

    const canonicalQuestion = item.variants[0]?.question;
    if (!canonicalQuestion || reservedQuestions.has(normalizeQuestionText(canonicalQuestion))) continue;
    reservedQuestions.add(normalizeQuestionText(canonicalQuestion));
    const publicAccess = item.applicableRoles.includes('Guest');
    const applicableRoles = publicAccess ? ['Guest'] : item.applicableRoles;
    const accessScopes = applicableRoles.map(role => ({
      audience: audienceForRole(role),
      role,
      answerClass: 'INFORMATION' as const,
      authorityType: 'KNOWLEDGE_CENTER' as const,
      authorityReference: item.sourceKey,
      knowledgeSourceKey: item.sourceKey,
      knowledgeSectionKey: item.sectionKey,
    }));
    if (accessScopes.length === 0) continue;

    const genKey = generatedIntentKey(item.sourceKey, item.sectionKey);
    if (seenIntentKeys.has(genKey)) continue;
    seenIntentKeys.add(genKey);

    catalog.push({
      intentKey: genKey,
      canonicalQuestion,
      domain: item.domain,
      feature: item.sectionTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
      aliases: generatedAliases(canonicalQuestion, item.variants),
      accessScopes,
    });
  }

  return catalog;
}

export interface CanonicalSeedResult {
  createdCount: number;
  updatedCount: number;
  unchangedCount: number;
  deletedCount: number;
}

export async function seedCanonicalIntents(): Promise<CanonicalSeedResult> {
  let createdCount = 0;
  let updatedCount = 0;
  let unchangedCount = 0;

  const desiredCatalog = await buildComprehensiveCanonicalIntentCatalog();
  const desiredIntentKeys = new Set(desiredCatalog.map(item => item.intentKey));

  for (const item of desiredCatalog) {
    const normalizedQuestion = normalizeQuestionText(item.canonicalQuestion);

    const existing = await prisma.canonicalQuestionIntent.findUnique({
      where: { intentKey: item.intentKey }
    });

    let intentRecord;
    if (existing) {
      const needsUpdate = existing.canonicalQuestion !== item.canonicalQuestion
        || existing.normalizedQuestion !== normalizedQuestion
        || existing.domain !== item.domain
        || existing.feature !== item.feature
        || existing.status !== 'ACTIVE';
      intentRecord = needsUpdate
        ? await prisma.canonicalQuestionIntent.update({
            where: { intentKey: item.intentKey },
            data: {
              canonicalQuestion: item.canonicalQuestion,
              normalizedQuestion,
              domain: item.domain,
              feature: item.feature,
              status: 'ACTIVE'
            }
          })
        : existing;
      if (needsUpdate) updatedCount++;
      else unchangedCount++;
    } else {
      intentRecord = await prisma.canonicalQuestionIntent.create({
        data: {
          intentKey: item.intentKey,
          canonicalQuestion: item.canonicalQuestion,
          normalizedQuestion,
          domain: item.domain,
          feature: item.feature,
          status: 'ACTIVE'
        }
      });
      createdCount++;
    }

    // Seed Aliases
    for (const alias of item.aliases) {
      const normalizedAliasText = normalizeQuestionText(alias.aliasText);
      const existingAlias = await prisma.canonicalQuestionAlias.findUnique({ where: { normalizedAliasText } });
      const aliasData = {
        canonicalIntentId: intentRecord.id,
        aliasText: alias.aliasText,
        aliasType: alias.aliasType,
        confidence: alias.confidence ?? 1.0,
        status: 'ACTIVE' as const,
      };
      if (!existingAlias) {
        await prisma.canonicalQuestionAlias.create({ data: { ...aliasData, normalizedAliasText } });
        createdCount++;
      } else if (
        existingAlias.canonicalIntentId !== intentRecord.id
        || existingAlias.aliasText !== aliasData.aliasText
        || existingAlias.aliasType !== aliasData.aliasType
        || existingAlias.confidence !== aliasData.confidence
        || existingAlias.status !== aliasData.status
      ) {
        await prisma.canonicalQuestionAlias.update({ where: { normalizedAliasText }, data: aliasData });
        updatedCount++;
      } else {
        unchangedCount++;
      }
    }

    // Seed Access Scopes
    for (const scope of item.accessScopes) {
      const existingScope = await prisma.canonicalIntentAccessScope.findFirst({
        where: {
          canonicalIntentId: intentRecord.id,
          audience: scope.audience,
          role: scope.role
        }
      });

      if (existingScope) {
        const scopeData = {
          requiredPermission: scope.requiredPermission,
          answerClass: scope.answerClass,
          authorityType: scope.authorityType,
          authorityReference: scope.authorityReference,
          knowledgeSourceKey: scope.knowledgeSourceKey,
          knowledgeSectionKey: scope.knowledgeSectionKey,
          liveServiceKey: scope.liveServiceKey,
          toolKey: scope.toolKey,
          status: 'ACTIVE' as const,
        };
        const needsScopeUpdate = Object.entries(scopeData).some(([key, value]) =>
          (existingScope[key as keyof typeof existingScope] ?? null) !== (value ?? null)
        );
        if (needsScopeUpdate) {
          await prisma.canonicalIntentAccessScope.update({ where: { id: existingScope.id }, data: scopeData });
          updatedCount++;
        } else {
          unchangedCount++;
        }
      } else {
        await prisma.canonicalIntentAccessScope.create({
          data: {
            canonicalIntentId: intentRecord.id,
            audience: scope.audience,
            role: scope.role,
            requiredPermission: scope.requiredPermission,
            answerClass: scope.answerClass,
            authorityType: scope.authorityType,
            authorityReference: scope.authorityReference,
            knowledgeSourceKey: scope.knowledgeSourceKey,
            knowledgeSectionKey: scope.knowledgeSectionKey,
            liveServiceKey: scope.liveServiceKey,
            toolKey: scope.toolKey,
            status: 'ACTIVE'
          }
        });
        createdCount++;
      }
    }
  }

  const staleIntents = await prisma.canonicalQuestionIntent.findMany({
    where: {
      status: 'ACTIVE',
    },
    select: { id: true, intentKey: true },
  });
  for (const stale of staleIntents) {
    if (desiredIntentKeys.has(stale.intentKey)) continue;
    await prisma.$transaction([
      prisma.canonicalQuestionIntent.update({ where: { id: stale.id }, data: { status: 'INACTIVE' } }),
      prisma.canonicalQuestionAlias.updateMany({ where: { canonicalIntentId: stale.id }, data: { status: 'INACTIVE' } }),
      prisma.canonicalIntentAccessScope.updateMany({ where: { canonicalIntentId: stale.id }, data: { status: 'INACTIVE' } }),
    ]);
    updatedCount++;
  }

  return { createdCount, updatedCount, unchangedCount, deletedCount: 0 };
}

export async function getCanonicalQuestionSuggestions(userRole: string): Promise<CanonicalQuestionSuggestion[]> {
  const intents = await prisma.canonicalQuestionIntent.findMany({
    where: { status: 'ACTIVE' },
    include: { accessScopes: { where: { status: 'ACTIVE' } } },
    orderBy: { intentKey: 'asc' },
  });

  return intents
    .filter(intent => intent.accessScopes.some(scope =>
      scope.role === userRole || (userRole === 'Guest' && scope.audience === 'PUBLIC')
    ))
    .map(intent => ({
      id: `canonical:${intent.intentKey}`,
      text: intent.canonicalQuestion,
      type: 'question' as const,
      intent: intent.intentKey,
    }));
}
