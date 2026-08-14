import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { OAT_SHARED_USERS } from '../../src/lib/oat/oat-shared-users';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { provisionAiOatActors } from '../../src/lib/oat/modules/ai-oat';

const prisma = new PrismaClient();
const oatPassword = randomBytes(24).toString('base64url');
const originalPreviewOatPassword = process.env.PREVIEW_OAT_PASSWORD;

function runAiOat(command: 'setup' | 'reset') {
  execSync(`npm run oat:ai:${command}`, {
    stdio: 'ignore',
    env: { ...process.env, PREVIEW_OAT_PASSWORD: oatPassword },
  });
}

describe('AI OAT Onboarding', () => {
  beforeAll(async () => {
    process.env.PREVIEW_OAT_PASSWORD = oatPassword;
    // Ensure test db is clean for these tables
    await prisma.aiCaseEvidence.deleteMany();
    await prisma.aiCaseEntityLink.deleteMany();
    await prisma.aiToolExecution.deleteMany();
    await prisma.aiPolicyDecision.deleteMany();
    await prisma.aiResolution.deleteMany();
    await prisma.aiFollowUp.deleteMany();
    await prisma.aiMessage.deleteMany();
    await prisma.aiProviderSession.deleteMany();
    await prisma.aiServiceSession.deleteMany();
    await prisma.aiSupportCase.deleteMany();
    await prisma.aiConversation.deleteMany();
    await prisma.aiKnowledgeSource.deleteMany({
      where: {
        OR: [
          { sourceKey: { startsWith: 'oat-' } },
          { slug: { in: ['oat-ai-test-policy', 'oat-ai-rentipid-overview'] } },
        ],
      },
    });
  });

  afterAll(async () => {
    if (originalPreviewOatPassword === undefined) delete process.env.PREVIEW_OAT_PASSWORD;
    else process.env.PREVIEW_OAT_PASSWORD = originalPreviewOatPassword;
    await prisma.$disconnect();
  });

  it('AI-OAT-SETUP-IDEMPOTENT-001: Should allow setup to run 10 times without duplicating fixtures', async () => {
    for (let i = 0; i < 10; i++) {
      runAiOat('setup');
    }

    const expectedActors = [
      OAT_SHARED_USERS.RENTER,
      OAT_SHARED_USERS.PROVIDER,
      OAT_SHARED_USERS.SUPER_ADMIN,
    ];
    for (const expected of expectedActors) {
      const actors = await prisma.user.findMany({ where: { email: expected.email } });
      expect(actors).toHaveLength(1);
      expect(actors[0]).toEqual(expect.objectContaining({
        role: expected.role,
        status: 'Verified',
        is_test_data: true,
      }));
      expect(await bcrypt.compare(oatPassword, actors[0].password_hash!)).toBe(true);
    }

    const knowledge = await prisma.aiKnowledgeSource.findMany({
      where: { slug: 'oat-ai-test-policy' }
    });
    expect(knowledge.length).toBe(1);

    const overviewKnowledge = await prisma.aiKnowledgeSource.findMany({
      where: { slug: 'oat-ai-rentipid-overview' }
    });
    expect(overviewKnowledge).toHaveLength(1);
    expect(overviewKnowledge[0]).toEqual(expect.objectContaining({
      status: 'ACTIVE',
      version: '1.0',
      category: 'Overview'
    }));
  }, 60000);

  it('AI-OAT-RESET-TRANSIENT-001: Should safely clear transient AI records but preserve fixtures and unrelated data', async () => {
    // 1. Ensure setup is done
    runAiOat('setup');

    const renter = await prisma.user.findUnique({
      where: { email: OAT_SHARED_USERS.RENTER.email }
    });
    expect(renter).toBeDefined();

    // 2. Create unrelated test user (non-OAT)
    const otherUser = await prisma.user.upsert({
      where: { email: 'non.oat@rentipid.test' },
      update: {},
      create: {
        email: 'non.oat@rentipid.test',
        password_hash: 'dummy',
        full_name: 'Non OAT',
        account_type: 'Individual',
        role: 'RENTER',
        status: 'Active',
      }
    });

    // 3. Create OAT Transient Data
    const oatConversation = await prisma.aiConversation.create({
      data: {
        userId: renter!.id,
      }
    });

    const oatCase = await prisma.aiSupportCase.create({
      data: {
        caseNumber: 'OAT-CASE-1',
        userId: renter!.id,
        category: 'Test',
        severity: 'low',
        riskLevel: 'safe',
        status: 'OPEN',
      }
    });

    await prisma.aiCaseEntityLink.create({
      data: {
        caseId: oatCase.id,
        entityType: 'Booking',
        entityId: 'dummy-booking',
        relationship: 'primary'
      }
    });

    // 4. Create Non-OAT Transient Data
    const nonOatConversation = await prisma.aiConversation.create({
      data: {
        userId: otherUser.id,
      }
    });

    const nonOatCase = await prisma.aiSupportCase.create({
      data: {
        caseNumber: 'NON-OAT-CASE-1',
        userId: otherUser.id,
        category: 'Test',
        severity: 'low',
        riskLevel: 'safe',
        status: 'OPEN',
      }
    });

    // 5. Run Reset
    runAiOat('reset');

    // 6. Verify OAT Transient Data is GONE
    const deletedConversation = await prisma.aiConversation.findUnique({ where: { id: oatConversation.id } });
    expect(deletedConversation).toBeNull();

    const deletedCase = await prisma.aiSupportCase.findUnique({ where: { id: oatCase.id } });
    expect(deletedCase).toBeNull();

    const deletedLinks = await prisma.aiCaseEntityLink.findMany({ where: { caseId: oatCase.id } });
    expect(deletedLinks.length).toBe(0);

    // 7. Verify Non-OAT Data remains
    const keptConversation = await prisma.aiConversation.findUnique({ where: { id: nonOatConversation.id } });
    expect(keptConversation).toBeDefined();

    const keptCase = await prisma.aiSupportCase.findUnique({ where: { id: nonOatCase.id } });
    expect(keptCase).toBeDefined();

    // 8. Verify Permanent Fixtures remain
    const keptRenter = await prisma.user.findUnique({ where: { email: OAT_SHARED_USERS.RENTER.email } });
    expect(keptRenter).toBeDefined();

    const keptKnowledge = await prisma.aiKnowledgeSource.findUnique({ where: { slug: 'oat-ai-test-policy' } });
    expect(keptKnowledge).toBeDefined();

    const keptOverview = await prisma.aiKnowledgeSource.findUnique({
      where: { slug: 'oat-ai-rentipid-overview' }
    });
    expect(keptOverview).toEqual(expect.objectContaining({ status: 'ACTIVE' }));
  }, 30000);

  it('OAT-ACTOR-005: production rejects actor mutation even when credentials are supplied', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalVercelEnv = process.env.VERCEL_ENV;
    const originalDatabaseUrl = process.env.DATABASE_URL;
    try {
      process.env.NODE_ENV = 'production';
      process.env.VERCEL_ENV = 'preview';
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/rentipid_test_soc';
      await expect(provisionAiOatActors()).rejects.toThrow('OAT_ENVIRONMENT_GUARD_REJECTED');
    } finally {
      if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = originalNodeEnv;
      if (originalVercelEnv === undefined) delete process.env.VERCEL_ENV;
      else process.env.VERCEL_ENV = originalVercelEnv;
      if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = originalDatabaseUrl;
    }
  });
});
