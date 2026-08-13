import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { OAT_SHARED_USERS } from '../../src/lib/oat/oat-shared-users';

const prisma = new PrismaClient();

describe('AI OAT Onboarding', () => {
  beforeAll(async () => {
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
    await prisma.aiKnowledgeSource.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('AI-OAT-SETUP-IDEMPOTENT-001: Should allow setup to run 10 times without duplicating fixtures', async () => {
    for (let i = 0; i < 10; i++) {
      execSync('npm run oat:ai:setup', { stdio: 'ignore' });
    }

    const renters = await prisma.user.findMany({
      where: { email: OAT_SHARED_USERS.RENTER.email }
    });
    expect(renters.length).toBe(1);

    const knowledge = await prisma.aiKnowledgeSource.findMany({
      where: { slug: 'oat-ai-test-policy' }
    });
    expect(knowledge.length).toBe(1);
  }, 60000);

  it('AI-OAT-RESET-TRANSIENT-001: Should safely clear transient AI records but preserve fixtures and unrelated data', async () => {
    // 1. Ensure setup is done
    execSync('npm run oat:ai:setup', { stdio: 'ignore' });

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
    execSync('npm run oat:ai:reset', { stdio: 'ignore' });

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
  });
});
