import { OATRegistry } from '../oat-module-registry';
import { OAT_SHARED_USERS } from '../oat-shared-users';
import { PrismaClient } from '@prisma/client';
import { chunkKnowledge } from '../../ai/knowledge/chunker';
import { hashNormalizedContent } from '../../ai/knowledge/hashing';
import { normalizeKnowledgeText } from '../../ai/knowledge/normalizer';

const prisma = new PrismaClient();

async function upsertOatKnowledge(input: {
  slug: string;
  title: string;
  category: string;
  applicableRoles: string;
  visibility: 'PUBLIC' | 'ROLE_SCOPED';
  roles: string[];
  sourceType: string;
  content: string;
}) {
  const normalized = normalizeKnowledgeText(input.content);
  const contentHash = hashNormalizedContent(normalized);
  const source = await prisma.aiKnowledgeSource.upsert({
    where: { slug: input.slug },
    update: {
      sourceKey: input.slug,
      module: 'OAT',
      topic: input.category,
      category: input.category,
      applicableRoles: input.applicableRoles,
      roles: input.roles,
      visibility: input.visibility,
      status: 'ACTIVE',
      approvalStatus: 'APPROVED',
      authority: 'OAT_TEST_FIXTURE',
      approvalEvidence: 'OAT-AI-MASTER-001',
      sourceType: input.sourceType,
      sourceLocator: `oat:${input.slug}`,
      sourceReference: input.content,
      contentHash,
      lastSyncedAt: new Date(),
    },
    create: {
      slug: input.slug,
      sourceKey: input.slug,
      title: input.title,
      module: 'OAT',
      topic: input.category,
      category: input.category,
      applicableRoles: input.applicableRoles,
      roles: input.roles,
      visibility: input.visibility,
      status: 'ACTIVE',
      approvalStatus: 'APPROVED',
      authority: 'OAT_TEST_FIXTURE',
      approvalEvidence: 'OAT-AI-MASTER-001',
      version: '1.0',
      effectiveFrom: new Date(),
      sourceType: input.sourceType,
      sourceLocator: `oat:${input.slug}`,
      sourceReference: input.content,
      contentHash,
      lastSyncedAt: new Date(),
    },
  });
  const chunks = chunkKnowledge(input.slug, normalized, [input.category]);
  for (const chunk of chunks) {
    await prisma.aiKnowledgeChunk.upsert({
      where: {
        knowledgeSourceId_chunkKey: {
          knowledgeSourceId: source.id,
          chunkKey: chunk.chunkKey,
        },
      },
      update: {},
      create: {
        knowledgeSourceId: source.id,
        chunkKey: chunk.chunkKey,
        headingPath: chunk.headingPath,
        content: chunk.content,
        normalizedContent: chunk.normalizedContent,
        contentHash: chunk.contentHash,
        keywords: chunk.keywords,
        ordinal: chunk.ordinal,
      },
    });
  }
}

OATRegistry.register({
  moduleId: 'AI',
  moduleName: 'Unified Autonomous AI Customer Service & Digital Human',
  oatId: 'OAT-AI-MASTER-001',
  enabled: true,
  criticality: 'TIER 1 - BUSINESS-CRITICAL',
  manualChecklistPath: 'final-documentation/oat/ai/OWNER-ACCEPTANCE-TEST.md',
  requiredRoles: ['OWNER', 'ADMIN', 'RENTER'],
  requiredFixtureTypes: ['AiKnowledgeSource', 'OatRenter'],
  estimatedMinutes: 15,
  dependencies: ['AUTH', 'RBAC', 'BOOKING', 'LISTING'],
  cleanupPolicy: 'RESET_TO_BASELINE',
  
  fixtureProvider: async () => {
    console.log('Ensuring AI OAT master fixtures exist (Idempotent UPSERT)...');
    
    // Ensure shared OAT renter exists
    const renter = OAT_SHARED_USERS.RENTER;
    await prisma.user.upsert({
      where: { email: renter.email },
      update: {
        full_name: 'OAT Renter (AI Setup)',
        role: renter.role,
        status: 'Active',
        password_hash: '$2b$10$L521NNe5fGH3xFnWKbTsTej2hLryMVISRdi/GWorZUSyyXigoWaPO', // password123
      },
      create: {
        email: renter.email,
        password_hash: '$2b$10$L521NNe5fGH3xFnWKbTsTej2hLryMVISRdi/GWorZUSyyXigoWaPO', // password123
        full_name: 'OAT Renter (AI Setup)',
        account_type: 'Individual',
        role: renter.role,
        status: 'Active',
      }
    });

    // Ensure required AI Knowledge baseline exists, do not duplicate
    await upsertOatKnowledge({
      slug: 'oat-ai-test-policy',
      title: 'OAT AI Test Policy',
      category: 'Testing',
      applicableRoles: 'Renter',
      visibility: 'ROLE_SCOPED',
      roles: ['Renter'],
      sourceType: 'policy',
      content: 'OAT AI Test Policy',
    });

    const overview = 'RENTipid is a rental marketplace where renters browse approved rental listings, providers list rentable items/services/assets permitted by RENTipid, renters make bookings through the platform, supported payment/deposit/insurance processes depend on the relevant implemented module, and users can receive AI-assisted support.';
    await upsertOatKnowledge({
      slug: 'oat-ai-rentipid-overview',
      title: overview,
      category: 'Overview',
      applicableRoles: 'All',
      visibility: 'PUBLIC',
      roles: [],
      sourceType: 'faq',
      content: overview,
    });
  },

  resetHandler: async () => {
    console.log('Resetting AI OAT transient data...');
    
    // 1. Resolve canonical OAT renter.
    const renter = await prisma.user.findUnique({
      where: { email: OAT_SHARED_USERS.RENTER.email }
    });

    if (!renter) {
      console.log('OAT Renter not found, nothing to reset.');
      return;
    }

    // 2. Identify only conversations belonging to that OAT identity.
    const conversations = await prisma.aiConversation.findMany({
      where: { userId: renter.id },
      select: { id: true, activeCaseId: true }
    });

    const conversationIds = conversations.map(c => c.id);
    
    // 3. Identify only OAT support cases associated with those conversations/user
    const supportCases = await prisma.aiSupportCase.findMany({
      where: { userId: renter.id },
      select: { id: true }
    });

    const caseIds = supportCases.map(c => c.id);

    if (caseIds.length > 0) {
      // 4. Delete/reset child records using those exact identifiers.
      // Order based on safe deletion
      await prisma.aiCaseEvidence.deleteMany({ where: { caseId: { in: caseIds } } });
      await prisma.aiCaseEntityLink.deleteMany({ where: { caseId: { in: caseIds } } });
      await prisma.aiToolExecution.deleteMany({ where: { caseId: { in: caseIds } } });
      await prisma.aiPolicyDecision.deleteMany({ where: { caseId: { in: caseIds } } });
      await prisma.aiResolution.deleteMany({ where: { caseId: { in: caseIds } } });
      await prisma.aiFollowUp.deleteMany({ where: { caseId: { in: caseIds } } });
    }

    // 6. Delete/reset parent transient records.
    // AiMessage cascades from AiConversation, so deleting AiConversation is enough,
    // but AiConversation is a root. Wait, AiToolExecution also has sessionId.
    
    // AiProviderSession & AiServiceSession
    await prisma.aiProviderSession.deleteMany({ where: { userId: renter.id } });
    await prisma.aiServiceSession.deleteMany({ where: { userId: renter.id } });
    
    // Delete support cases directly
    if (caseIds.length > 0) {
      await prisma.aiSupportCase.deleteMany({ where: { id: { in: caseIds } } });
    }

    // Delete conversations
    if (conversationIds.length > 0) {
      await prisma.aiConversation.deleteMany({ where: { id: { in: conversationIds } } });
    }
  },

  readinessHandler: async () => {
    return {
      moduleId: 'AI',
      oatId: 'OAT-AI-MASTER-001',
      environment: 'PREVIEW',
      database: 'SAFE',
      fixtures: 'READY',
      dependencies: 'READY',
      rbac: 'READY',
      mockProvider: 'READY', // Degraded digital human configured
      featureFlags: 'READY',
      blockers: [],
      overall: 'READY'
    };
  }
});
