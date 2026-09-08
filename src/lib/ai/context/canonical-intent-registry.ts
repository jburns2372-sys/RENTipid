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
  // 1. Listings & Creation
  {
    intentKey: 'listing.create.how_to',
    canonicalQuestion: 'How do I create a listing on RENTipid?',
    domain: 'Listings',
    feature: 'listing_creation',
    aliases: [
      { aliasText: 'How to list an item', aliasType: 'SYNONYM' },
      { aliasText: 'How can I create a listing', aliasType: 'SYNONYM' },
      { aliasText: 'Where do I add an item to rent out', aliasType: 'COLLOQUIAL' },
      { aliasText: 'I want to list something', aliasType: 'COLLOQUIAL' },
      { aliasText: 'hw do i lst my car', aliasType: 'TYPO' }
    ],
    accessScopes: [
      {
        audience: 'PROVIDER',
        role: 'Individual Provider',
        answerClass: 'INFORMATION',
        authorityType: 'KNOWLEDGE_CENTER',
        authorityReference: 'provider.workflow-status',
        knowledgeSourceKey: 'provider.workflow-status'
      },
      {
        audience: 'PROVIDER',
        role: 'Business Provider',
        answerClass: 'INFORMATION',
        authorityType: 'KNOWLEDGE_CENTER',
        authorityReference: 'provider.workflow-status',
        knowledgeSourceKey: 'provider.workflow-status'
      },
      {
        audience: 'RENTER',
        role: 'Renter',
        answerClass: 'INFORMATION',
        authorityType: 'KNOWLEDGE_CENTER',
        authorityReference: 'provider.workflow-status',
        knowledgeSourceKey: 'provider.workflow-status'
      }
    ]
  },
  {
    intentKey: 'provider.listing.review_reason',
    canonicalQuestion: 'Why is my listing under review?',
    domain: 'Listings',
    feature: 'listing_review',
    aliases: [
      { aliasText: 'Why is my listing pending approval', aliasType: 'SYNONYM' },
      { aliasText: 'Why was my listing held for review', aliasType: 'SYNONYM' },
      { aliasText: 'My item listing is not published yet why', aliasType: 'COLLOQUIAL' }
    ],
    accessScopes: [
      {
        audience: 'PROVIDER',
        role: 'Individual Provider',
        answerClass: 'PERSONALIZED_READ',
        authorityType: 'LIVE_SERVICE',
        authorityReference: 'AUTHORIZED_LISTING_PROVIDER_SERVICE',
        liveServiceKey: 'AUTHORIZED_LISTING_PROVIDER_SERVICE'
      },
      {
        audience: 'PROVIDER',
        role: 'Business Provider',
        answerClass: 'PERSONALIZED_READ',
        authorityType: 'LIVE_SERVICE',
        authorityReference: 'AUTHORIZED_LISTING_PROVIDER_SERVICE',
        liveServiceKey: 'AUTHORIZED_LISTING_PROVIDER_SERVICE'
      }
    ]
  },

  // 2. Account & Passwords
  {
    intentKey: 'account.password.change',
    canonicalQuestion: 'How do I change my account password?',
    domain: 'Account',
    feature: 'password_reset',
    aliases: [
      { aliasText: 'How can I update my password', aliasType: 'SYNONYM' },
      { aliasText: 'Where to reset password', aliasType: 'SYNONYM' },
      { aliasText: 'I forgot my password how to change', aliasType: 'COLLOQUIAL' }
    ],
    accessScopes: [
      {
        audience: 'RENTER',
        role: 'Renter',
        answerClass: 'INFORMATION',
        authorityType: 'KNOWLEDGE_CENTER',
        authorityReference: 'core.registration-onboarding',
        knowledgeSourceKey: 'core.registration-onboarding'
      },
      {
        audience: 'PROVIDER',
        role: 'Individual Provider',
        answerClass: 'INFORMATION',
        authorityType: 'KNOWLEDGE_CENTER',
        authorityReference: 'core.registration-onboarding',
        knowledgeSourceKey: 'core.registration-onboarding'
      },
      {
        audience: 'ADMIN',
        role: 'Admin',
        answerClass: 'INFORMATION',
        authorityType: 'KNOWLEDGE_CENTER',
        authorityReference: 'core.registration-onboarding',
        knowledgeSourceKey: 'core.registration-onboarding'
      }
    ]
  },

  // 3. Provider Payouts
  {
    intentKey: 'provider.payout.location',
    canonicalQuestion: 'Where is my payout?',
    domain: 'Payments',
    feature: 'provider_payout',
    aliases: [
      { aliasText: 'How do I cash out my earnings', aliasType: 'COLLOQUIAL' },
      { aliasText: 'get my earnings', aliasType: 'COLLOQUIAL' },
      { aliasText: 'withdraw my provider money', aliasType: 'COLLOQUIAL' },
      { aliasText: 'When will I get paid for my rental', aliasType: 'SYNONYM' }
    ],
    accessScopes: [
      {
        audience: 'PROVIDER',
        role: 'Individual Provider',
        answerClass: 'PERSONALIZED_READ',
        authorityType: 'LIVE_SERVICE',
        authorityReference: 'AUTHORIZED_PAYOUT_FINANCE_SERVICE',
        liveServiceKey: 'AUTHORIZED_PAYOUT_FINANCE_SERVICE'
      },
      {
        audience: 'PROVIDER',
        role: 'Business Provider',
        answerClass: 'PERSONALIZED_READ',
        authorityType: 'LIVE_SERVICE',
        authorityReference: 'AUTHORIZED_PAYOUT_FINANCE_SERVICE',
        liveServiceKey: 'AUTHORIZED_PAYOUT_FINANCE_SERVICE'
      }
    ]
  },

  // 4. Booking Cancellation
  {
    intentKey: 'booking.cancel.process',
    canonicalQuestion: 'How do I cancel my booking?',
    domain: 'Bookings',
    feature: 'booking_cancellation',
    aliases: [
      { aliasText: 'Can I cancel my rental reservation', aliasType: 'SYNONYM' },
      { aliasText: 'What happens if I cancel my booking now', aliasType: 'SYNONYM' },
      { aliasText: 'I want to cancel my active booking', aliasType: 'COLLOQUIAL' }
    ],
    accessScopes: [
      {
        audience: 'RENTER',
        role: 'Renter',
        answerClass: 'ACTION',
        authorityType: 'TOOL_GATEWAY',
        authorityReference: 'cancelBooking',
        toolKey: 'cancelBooking'
      }
    ]
  },

  // 5. Category Policy & Eligibility
  {
    intentKey: 'category.listing.eligibility',
    canonicalQuestion: 'Can I list a condominium on RENTipid?',
    domain: 'Listings',
    feature: 'prohibited_items',
    aliases: [
      { aliasText: 'Can I list condo property', aliasType: 'SYNONYM' },
      { aliasText: 'Are real estate listings allowed', aliasType: 'SYNONYM' }
    ],
    accessScopes: [
      {
        audience: 'PUBLIC',
        role: 'Guest',
        answerClass: 'ELIGIBILITY_POLICY',
        authorityType: 'POLICY_TAXONOMY',
        authorityReference: 'RENTAL_CATEGORY_AND_PROHIBITED_ITEM_POLICY'
      },
      {
        audience: 'PROVIDER',
        role: 'Individual Provider',
        answerClass: 'ELIGIBILITY_POLICY',
        authorityType: 'POLICY_TAXONOMY',
        authorityReference: 'RENTAL_CATEGORY_AND_PROHIBITED_ITEM_POLICY'
      }
    ]
  },
  {
    intentKey: 'listing.item.restriction',
    canonicalQuestion: 'What items are prohibited or restricted on RENTipid?',
    domain: 'Trust & Safety',
    feature: 'prohibited_items',
    aliases: [
      { aliasText: 'What am I not allowed to list', aliasType: 'SYNONYM' },
      { aliasText: 'Which rental items are restricted', aliasType: 'SYNONYM' },
      { aliasText: 'Can I list a firearm on RENTipid', aliasType: 'SYNONYM' },
    ],
    accessScopes: [{
      audience: 'PUBLIC',
      role: 'Guest',
      answerClass: 'ELIGIBILITY_POLICY',
      authorityType: 'POLICY_TAXONOMY',
      authorityReference: 'RENTAL_CATEGORY_AND_PROHIBITED_ITEM_POLICY',
    }],
  },

  // 6. Internal / Developer Questions
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
  const answerability = await loadCustomerAnswerabilityCatalog();
  const reservedQuestions = new Set(catalog.flatMap(intent => [
    normalizeQuestionText(intent.canonicalQuestion),
    ...intent.aliases.map(alias => normalizeQuestionText(alias.aliasText)),
  ]));

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

    catalog.push({
      intentKey: generatedIntentKey(item.sourceKey, item.sectionKey),
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

  const staleGenerated = await prisma.canonicalQuestionIntent.findMany({
    where: {
      status: 'ACTIVE',
      intentKey: { startsWith: 'knowledge.' },
    },
    select: { id: true, intentKey: true },
  });
  for (const stale of staleGenerated) {
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
