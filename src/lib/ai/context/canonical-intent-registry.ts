import { prisma } from '@/lib/prisma';

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
        authorityReference: 'KB-PROVIDER-LISTING-01',
        knowledgeSourceKey: 'KB-PROVIDER-LISTING-01'
      },
      {
        audience: 'PROVIDER',
        role: 'Business Provider',
        answerClass: 'INFORMATION',
        authorityType: 'KNOWLEDGE_CENTER',
        authorityReference: 'KB-PROVIDER-LISTING-01',
        knowledgeSourceKey: 'KB-PROVIDER-LISTING-01'
      },
      {
        audience: 'RENTER',
        role: 'Renter',
        answerClass: 'INFORMATION',
        authorityType: 'KNOWLEDGE_CENTER',
        authorityReference: 'KB-PROVIDER-LISTING-01',
        knowledgeSourceKey: 'KB-PROVIDER-LISTING-01'
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
        authorityReference: 'KB-ACCOUNT-SECURITY-01',
        knowledgeSourceKey: 'KB-ACCOUNT-SECURITY-01'
      },
      {
        audience: 'PROVIDER',
        role: 'Individual Provider',
        answerClass: 'INFORMATION',
        authorityType: 'KNOWLEDGE_CENTER',
        authorityReference: 'KB-ACCOUNT-SECURITY-01',
        knowledgeSourceKey: 'KB-ACCOUNT-SECURITY-01'
      },
      {
        audience: 'ADMIN',
        role: 'Admin',
        answerClass: 'INFORMATION',
        authorityType: 'KNOWLEDGE_CENTER',
        authorityReference: 'KB-ACCOUNT-SECURITY-01',
        knowledgeSourceKey: 'KB-ACCOUNT-SECURITY-01'
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
        authorityReference: 'cancel_booking_tool',
        toolKey: 'cancel_booking_tool'
      },
      {
        audience: 'PROVIDER',
        role: 'Individual Provider',
        answerClass: 'ACTION',
        authorityType: 'TOOL_GATEWAY',
        authorityReference: 'provider_cancel_booking_tool',
        toolKey: 'provider_cancel_booking_tool'
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
        authorityReference: 'PROHIBITED_ITEMS_POLICY_CATALOG'
      },
      {
        audience: 'PROVIDER',
        role: 'Individual Provider',
        answerClass: 'ELIGIBILITY_POLICY',
        authorityType: 'POLICY_TAXONOMY',
        authorityReference: 'PROHIBITED_ITEMS_POLICY_CATALOG'
      }
    ]
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
        authorityReference: 'KB-INTERNAL-KNOWLEDGE-VALIDATION-01',
        knowledgeSourceKey: 'KB-INTERNAL-KNOWLEDGE-VALIDATION-01'
      },
      {
        audience: 'INTERNAL',
        role: 'Admin',
        requiredPermission: 'KNOWLEDGE_ADMIN',
        answerClass: 'INFORMATION',
        authorityType: 'KNOWLEDGE_CENTER',
        authorityReference: 'KB-INTERNAL-KNOWLEDGE-VALIDATION-01',
        knowledgeSourceKey: 'KB-INTERNAL-KNOWLEDGE-VALIDATION-01'
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
        authorityReference: 'KB-INTERNAL-RELEASE-GATES-01',
        knowledgeSourceKey: 'KB-INTERNAL-RELEASE-GATES-01'
      }
    ]
  }
];

export async function seedCanonicalIntents(): Promise<{ createdCount: number; updatedCount: number }> {
  let createdCount = 0;
  let updatedCount = 0;

  for (const item of CANONICAL_INTENT_SEED_CATALOG) {
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
      await prisma.canonicalQuestionAlias.upsert({
        where: { normalizedAliasText },
        update: {
          canonicalIntentId: intentRecord.id,
          aliasText: alias.aliasText,
          aliasType: alias.aliasType,
          confidence: alias.confidence ?? 1.0,
          status: 'ACTIVE'
        },
        create: {
          canonicalIntentId: intentRecord.id,
          aliasText: alias.aliasText,
          normalizedAliasText,
          aliasType: alias.aliasType,
          confidence: alias.confidence ?? 1.0,
          status: 'ACTIVE'
        }
      });
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
        await prisma.canonicalIntentAccessScope.update({
          where: { id: existingScope.id },
          data: {
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
      }
    }
  }

  return { createdCount, updatedCount };
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
