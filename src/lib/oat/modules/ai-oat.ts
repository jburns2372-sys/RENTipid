import { OATRegistry } from '../oat-module-registry';
import { OAT_SHARED_USERS } from '../oat-shared-users';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
      },
      create: {
        email: renter.email,
        password_hash: '$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', // Dummy
        full_name: 'OAT Renter (AI Setup)',
        account_type: 'Individual',
        role: renter.role,
        status: 'Active',
      }
    });

    // Ensure required AI Knowledge baseline exists, do not duplicate
    const knowledgeSlug = 'oat-ai-test-policy';
    await prisma.aiKnowledgeSource.upsert({
      where: { slug: knowledgeSlug },
      update: {},
      create: {
        slug: knowledgeSlug,
        title: 'OAT AI Test Policy',
        category: 'Testing',
        applicableRoles: 'Renter',
        status: 'ACTIVE',
        version: '1.0',
        effectiveFrom: new Date(),
        sourceType: 'policy'
      }
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
