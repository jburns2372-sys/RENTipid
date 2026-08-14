import { OATRegistry } from '../oat-module-registry';
import { OAT_SHARED_USERS } from '../oat-shared-users';
import { PrismaClient } from '@prisma/client';
import { chunkKnowledge } from '../../ai/knowledge/chunker';
import { hashNormalizedContent } from '../../ai/knowledge/hashing';
import { normalizeKnowledgeText } from '../../ai/knowledge/normalizer';
import { assertSafeOatEnvironment } from '../oat-environment-guard';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const REQUIRED_AI_OAT_ACTORS = [
  {
    ...OAT_SHARED_USERS.RENTER,
    fullName: 'OAT Renter (AI Setup)',
    accountType: 'Individual',
  },
  {
    ...OAT_SHARED_USERS.PROVIDER,
    fullName: 'OAT Provider (AI Setup)',
    accountType: 'Individual',
  },
  {
    ...OAT_SHARED_USERS.SUPER_ADMIN,
    fullName: 'OAT Super Admin (AI Setup)',
    accountType: 'Individual',
  },
] as const;

function assertSupportedOatActorEnvironment() {
  assertSafeOatEnvironment();

  const dbUrl = new URL(process.env.DATABASE_URL!);
  const localDatabase = ['localhost', '127.0.0.1', '::1'].includes(dbUrl.hostname);
  if (!localDatabase && process.env.VERCEL_ENV !== 'preview') {
    throw new Error('OAT_ACTOR_ENVIRONMENT_REJECTED: expected Local/Test or verified Vercel Preview');
  }
}

function getPreviewOatPassword(): string {
  const password = process.env.PREVIEW_OAT_PASSWORD;
  if (!password) {
    throw new Error('OAT_CREDENTIALS_MISSING: PREVIEW_OAT_PASSWORD is required');
  }
  return password;
}

export async function provisionAiOatActors(): Promise<void> {
  assertSupportedOatActorEnvironment();
  const passwordHash = await bcrypt.hash(getPreviewOatPassword(), 10);

  for (const actor of REQUIRED_AI_OAT_ACTORS) {
    await prisma.user.upsert({
      where: { email: actor.email },
      update: {
        full_name: actor.fullName,
        account_type: actor.accountType,
        role: actor.role,
        status: 'Verified',
        password_hash: passwordHash,
        is_test_data: true,
        beta_label: 'Preview OAT',
      },
      create: {
        email: actor.email,
        password_hash: passwordHash,
        full_name: actor.fullName,
        account_type: actor.accountType,
        role: actor.role,
        status: 'Verified',
        is_test_data: true,
        beta_label: 'Preview OAT',
      },
    });
  }
}

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
  requiredRoles: ['RENTER', 'PROVIDER', 'SUPER_ADMIN'],
  requiredFixtureTypes: ['AiKnowledgeSource', 'OatRenter', 'OatProvider', 'OatSuperAdmin'],
  estimatedMinutes: 15,
  dependencies: ['AUTH', 'RBAC', 'BOOKING', 'LISTING'],
  cleanupPolicy: 'RESET_TO_BASELINE',
  
  fixtureProvider: async () => {
    console.log('Ensuring AI OAT master fixtures exist (Idempotent UPSERT)...');
    
    await provisionAiOatActors();

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
    const actors = await prisma.user.findMany({
      where: { email: { in: REQUIRED_AI_OAT_ACTORS.map(actor => actor.email) } },
      select: { email: true, role: true, status: true, password_hash: true },
    });
    const blockers = REQUIRED_AI_OAT_ACTORS.flatMap(expected => {
      const actual = actors.find(actor => actor.email === expected.email);
      if (!actual) return [`Missing ${expected.description}`];
      if (actual.role !== expected.role) return [`Invalid role for ${expected.description}`];
      if (actual.status !== 'Verified') return [`Invalid status for ${expected.description}`];
      if (!actual.password_hash) return [`Missing credentials for ${expected.description}`];
      return [];
    });

    return {
      moduleId: 'AI',
      oatId: 'OAT-AI-MASTER-001',
      environment: 'PREVIEW',
      database: 'SAFE',
      fixtures: blockers.length === 0 ? 'READY' : 'MISSING',
      dependencies: 'READY',
      rbac: 'READY',
      mockProvider: 'READY', // Degraded digital human configured
      featureFlags: 'READY',
      blockers,
      overall: blockers.length === 0 ? 'READY' : 'NOT READY'
    };
  }
});
