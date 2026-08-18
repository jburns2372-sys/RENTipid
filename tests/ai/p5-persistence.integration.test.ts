import { readFileSync } from 'fs';
import { join } from 'path';
import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { resolveCurrentAiActor } from '@/lib/ai/authorization/actor';
import { buildSafeContext } from '@/lib/ai/ai-context-builder';
import { AiSessionBroker } from '@/lib/ai/broker/AiSessionBroker';
import { AiCasePlatform } from '@/lib/ai/cases/AiCasePlatform';
import { AiConversationContinuity } from '@/lib/ai/conversations/AiConversationContinuity';
import { AiToolGateway, ToolDefinition } from '@/lib/ai/tools/AiToolGateway';
import { validateWithSupervisor } from '@/lib/ai/supervisor/stage';
import { aiSpecialistRegistry } from '@/lib/ai/specialists/registry';

const dbA = new PrismaClient();
const dbB = new PrismaClient();
const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
const ownerId = `p5_owner_${suffix}`;
const otherId = `p5_other_${suffix}`;
const fingerprint = `p5_mutation_${suffix}`;

describe('P5 persistence and distributed-state hardening', () => {
  beforeAll(async () => {
    await prisma.user.createMany({
      data: [
        {
          id: ownerId,
          email: `${ownerId}@example.test`,
          full_name: 'P5 Owner',
          account_type: 'Individual',
          role: 'Renter',
          status: 'Verified',
        },
        {
          id: otherId,
          email: `${otherId}@example.test`,
          full_name: 'P5 Other',
          account_type: 'Individual',
          role: 'Renter',
          status: 'Verified',
        },
      ],
    });
    await prisma.userProfile.create({
      data: { user_id: ownerId, verification_status: 'Pending' },
    });
  });

  afterAll(async () => {
    const userIds = [ownerId, otherId];
    const conversations = await prisma.aiConversation.findMany({ where: { userId: { in: userIds } }, select: { id: true } });
    const supportCases = await prisma.aiSupportCase.findMany({ where: { userId: { in: userIds } }, select: { id: true } });
    const conversationIds = conversations.map(item => item.id);
    const caseIds = supportCases.map(item => item.id);
    if (conversationIds.length) await prisma.aiMessage.deleteMany({ where: { conversationId: { in: conversationIds } } });
    await prisma.aiConversation.deleteMany({ where: { id: { in: conversationIds } } });
    await prisma.aiToolExecution.deleteMany({ where: { requestFingerprint: { startsWith: 'p5_' } } });
    await prisma.aiServiceSession.deleteMany({ where: { userId: { in: userIds } } });
    if (caseIds.length) {
      await prisma.aiCaseEntityLink.deleteMany({ where: { caseId: { in: caseIds } } });
      await prisma.aiFollowUp.deleteMany({ where: { caseId: { in: caseIds } } });
      await prisma.aiCaseEvidence.deleteMany({ where: { caseId: { in: caseIds } } });
      await prisma.aiResolution.deleteMany({ where: { caseId: { in: caseIds } } });
    }
    await prisma.aiSupportCase.deleteMany({ where: { id: { in: caseIds } } });
    await prisma.userProfile.deleteMany({ where: { user_id: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await Promise.all([dbA.$disconnect(), dbB.$disconnect(), prisma.$disconnect()]);
  });

  test('A-CONT-01/A-CONT-02: history and the same active issue survive fresh service and database-client instances', async () => {
    const firstService = new AiConversationContinuity(dbA, new AiCasePlatform(dbA));
    const first = await firstService.continueForMessage({
      userId: ownerId,
      prompt: 'Why is my KYC status still pending?',
      module: 'KYC',
      channel: 'text',
    });
    await firstService.appendMessage(first.conversation.id, ownerId, 'user', 'Why is my KYC status still pending?', 'text');
    await firstService.appendMessage(first.conversation.id, ownerId, 'assistant', 'Previously persisted answer', 'text');

    const freshService = new AiConversationContinuity(dbB, new AiCasePlatform(dbB));
    const history = await freshService.getResumableHistory(ownerId, first.conversation.id, 'KYC');
    expect(history?.conversation.id).toBe(first.conversation.id);
    expect(history?.messages.map(message => message.content)).toEqual([
      'Why is my KYC status still pending?',
      'Previously persisted answer',
    ]);

    const crossDevice = await freshService.continueForMessage({
      userId: ownerId,
      prompt: 'Why is my KYC status still pending?',
      module: 'KYC',
      channel: 'pwa',
    });
    expect(crossDevice.supportCase.id).toBe(first.supportCase.id);
    expect(crossDevice.conversation.id).toBe(first.conversation.id);
  });

  test('A-CONT-03: same issue is suppressed and a materially different issue remains distinct', async () => {
    const platformA = new AiCasePlatform(dbA);
    const platformB = new AiCasePlatform(dbB);
    const sameA = await platformA.resumeCase(ownerId, 'KYC_ACCOUNT', 'User', ownerId, 'kyc_status');
    const sameB = await platformB.resumeCase(ownerId, 'KYC_ACCOUNT', 'User', ownerId, 'kyc_status');
    const different = await platformB.resumeCase(ownerId, 'PAYMENT_REFUND_DEPOSIT', 'User', ownerId, 'payment_inquiry');
    expect(sameB.id).toBe(sameA.id);
    expect(different.id).not.toBe(sameA.id);

    const [raceA, raceB] = await Promise.all([
      platformA.resumeCase(ownerId, 'RENTAL', 'User', ownerId, 'rental_extend'),
      platformB.resumeCase(ownerId, 'RENTAL', 'User', ownerId, 'rental_extend'),
    ]);
    expect(raceB.id).toBe(raceA.id);
    expect(await prisma.aiSupportCase.count({ where: { activeIssueKey: raceA.activeIssueKey } })).toBe(1);
  });

  test('ownership, client context, actor, and role are re-resolved from authoritative state', async () => {
    const ownerService = new AiConversationContinuity(dbA, new AiCasePlatform(dbA));
    const owned = await ownerService.getResumableHistory(ownerId, undefined, 'KYC');
    expect(owned).not.toBeNull();

    const otherService = new AiConversationContinuity(dbB, new AiCasePlatform(dbB));
    await expect(otherService.getResumableHistory(otherId, owned!.conversation.id, 'KYC')).rejects.toThrow(/Unauthorized/);
    await expect(new AiCasePlatform(dbB).getCase(owned!.conversation.activeCaseId!, otherId)).rejects.toThrow(/Unauthorized/);

    expect((await resolveCurrentAiActor(ownerId)).role).toBe('Renter');
    await prisma.user.update({ where: { id: ownerId }, data: { role: 'Individual Provider' } });
    expect((await resolveCurrentAiActor(ownerId)).role).toBe('Individual Provider');
  });

  test('live state is refreshed and prior assistant text is never used as authority', async () => {
    const actor = await resolveCurrentAiActor(ownerId);
    const pendingContext = await buildSafeContext(actor.role, 'KYC Verification', undefined, ownerId);
    expect(pendingContext).toContain('identity=Pending');
    expect(pendingContext).not.toContain('Previously persisted answer');

    await prisma.userProfile.update({ where: { user_id: ownerId }, data: { verification_status: 'Verified' } });
    const refreshedContext = await buildSafeContext(actor.role, 'KYC Verification', undefined, ownerId);
    expect(refreshedContext).toContain('identity=Verified');
    expect(refreshedContext).not.toContain('Previously persisted answer');
  });

  test('durable broker nonce replay protection survives a fresh broker instance', async () => {
    const nonce = `p5_nonce_${suffix}`;
    const first = await new AiSessionBroker(dbA).createSession({ userId: ownerId, channel: 'text', nonce });
    await expect(new AiSessionBroker(dbB).createSession({ userId: ownerId, channel: 'text', nonce })).rejects.toThrow(/Replay attempt denied/);
    await expect(new AiSessionBroker(dbB).validateSession(first.sessionId, ownerId)).resolves.toBe(true);
  });

  test('A-ACT-02: durable pre-mutation claim prevents execution in another gateway instance', async () => {
    let mutations = 0;
    const tool: ToolDefinition = {
      name: `p5Mutation_${suffix}`,
      riskClass: 'CASE_ACTION',
      description: 'P5 deterministic mutation probe',
      allowedRoles: ['Individual Provider'],
      handler: async () => ({ mutationNumber: ++mutations }),
    };
    const gatewayA = new AiToolGateway(dbA);
    const gatewayB = new AiToolGateway(dbB);
    gatewayA.registerTool(tool);
    gatewayB.registerTool(tool);

    const attempts = await Promise.allSettled([
      gatewayA.executeTool(tool.name, {}, 'session-a', ownerId, fingerprint),
      gatewayB.executeTool(tool.name, {}, 'session-b', ownerId, fingerprint),
    ]);
    expect(attempts.filter(attempt => attempt.status === 'fulfilled')).toHaveLength(1);
    expect(attempts.filter(attempt => attempt.status === 'rejected')).toHaveLength(1);
    expect((attempts.find(attempt => attempt.status === 'rejected') as PromiseRejectedResult).reason.message).toMatch(/Replay attempt denied/);
    expect(mutations).toBe(1);
    expect(await prisma.aiToolExecution.count({ where: { requestFingerprint: fingerprint } })).toBe(1);
  });

  test('P4 supervisor/tool allowlists and the single canonical chat architecture remain intact', () => {
    const booking = aiSpecialistRegistry.BOOKING;
    expect(booking.allowedTools).toEqual(expect.arrayContaining(['get_booking_status', 'cancel_booking']));
    expect(validateWithSupervisor({
      specialist: booking,
      resolvedIntent: 'kyc_status',
      isConsequentialAction: false,
    }).outcome).toBe('SAFE_HOLD');

    const schema = readFileSync(join(process.cwd(), 'prisma/schema.prisma'), 'utf8');
    expect(schema.match(/model AiConversation\s*\{/g)).toHaveLength(1);
    expect(readFileSync(join(process.cwd(), 'src/app/api/ai/chat/route.ts'), 'utf8')).toContain('export async function POST');
    const helpClient = readFileSync(join(process.cwd(), 'src/app/help/page.tsx'), 'utf8');
    expect(helpClient).toContain("fetch(`/api/ai/chat?${historyParams.toString()}`)");
    expect(helpClient).toContain('conversationId,');
  });
});
