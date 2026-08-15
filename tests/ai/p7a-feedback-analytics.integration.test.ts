import { readFileSync } from 'fs';
import { join } from 'path';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  SupportFeedbackError,
  SupportFeedbackService,
} from '@/lib/ai/feedback/SupportFeedbackService';
import {
  SupportAnalyticsError,
  SupportAnalyticsService,
} from '@/lib/ai/analytics/SupportAnalyticsService';
import { SupportInteractionTelemetry } from '@/lib/ai/analytics/SupportInteractionTelemetry';
import { suggestionRegistry } from '@/lib/ai/suggestions/registry';
import { POST as submitFeedbackRoute } from '@/app/api/ai/feedback/route';
import { GET as getAnalyticsRoute } from '@/app/api/admin/ai-customer-service/analytics/route';

jest.mock('next-auth/next', () => ({ getServerSession: jest.fn() }));

const mockedSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const dbA = new PrismaClient();
const dbB = new PrismaClient();
const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
const baseNow = new Date();
const ids = {
  owner: `p7_owner_${suffix}`,
  other: `p7_other_${suffix}`,
  admin: `p7_admin_${suffix}`,
  ordinary: `p7_ordinary_${suffix}`,
  resolvedCase: `p7_resolved_case_${suffix}`,
  safeCase: `p7_safe_case_${suffix}`,
  blockedCase: `p7_blocked_case_${suffix}`,
  ownerConversation: `p7_owner_conversation_${suffix}`,
  otherConversation: `p7_other_conversation_${suffix}`,
  ownerUserMessageOne: `p7_owner_user_1_${suffix}`,
  ownerAnswerOne: `p7_owner_answer_1_${suffix}`,
  ownerUserMessageTwo: `p7_owner_user_2_${suffix}`,
  ownerAnswerTwo: `p7_owner_answer_2_${suffix}`,
  otherAnswer: `p7_other_answer_${suffix}`,
};
const featureKeys = ['ai_module_feedback_enabled', 'ai_module_analytics_enabled'];
const priorSettings = new Map<string, string | undefined>();
let baselineToolFailures = 0;
let baselineProviderFailures = 0;

describe('P7A structured feedback and support analytics backend', () => {
  beforeAll(async () => {
    const baselineFrom = new Date(baseNow.getTime() - 24 * 60 * 60 * 1000);
    const baselineTo = new Date(baseNow.getTime() + 60_000);
    [baselineToolFailures, baselineProviderFailures] = await Promise.all([
      prisma.aiToolExecution.count({
        where: { startedAt: { gte: baselineFrom, lte: baselineTo }, executionStatus: { in: ['failed', 'blocked'] } },
      }),
      prisma.aiProviderSession.count({
        where: { createdAt: { gte: baselineFrom, lte: baselineTo }, status: 'failed' },
      }),
    ]);
    for (const key of featureKeys) {
      const setting = await prisma.systemSetting.findUnique({ where: { setting_key: key } });
      priorSettings.set(key, setting?.setting_value);
      await prisma.systemSetting.upsert({
        where: { setting_key: key },
        create: { setting_key: key, setting_value: 'true', description: 'P7A integration test feature control' },
        update: { setting_value: 'true' },
      });
    }
    await prisma.user.createMany({
      data: [
        {
          id: ids.owner,
          email: `${ids.owner}@example.test`,
          full_name: 'P7 Owner',
          account_type: 'Individual',
          role: 'Renter',
          status: 'Verified',
        },
        {
          id: ids.other,
          email: `${ids.other}@example.test`,
          full_name: 'P7 Other',
          account_type: 'Individual',
          role: 'Renter',
          status: 'Verified',
        },
        {
          id: ids.admin,
          email: `${ids.admin}@example.test`,
          full_name: 'P7 Admin',
          account_type: 'Individual',
          role: 'Admin',
          status: 'Verified',
        },
        {
          id: ids.ordinary,
          email: `${ids.ordinary}@example.test`,
          full_name: 'P7 Ordinary',
          account_type: 'Individual Provider',
          role: 'Individual Provider',
          status: 'Verified',
        },
      ],
    });
    await prisma.aiSupportCase.createMany({
      data: [
        {
          id: ids.resolvedCase,
          caseNumber: `P7-RES-${suffix}`,
          userId: ids.owner,
          category: 'PAYMENT_REFUND_DEPOSIT',
          subcategory: 'payment_issue',
          severity: 'medium',
          riskLevel: 'safe',
          status: 'RESOLVED',
          openedAt: new Date(baseNow.getTime() - 60_000),
          resolvedAt: baseNow,
          lastActivityAt: baseNow,
        },
        {
          id: ids.safeCase,
          caseNumber: `P7-SAFE-${suffix}`,
          userId: ids.owner,
          category: 'BOOKING',
          severity: 'medium',
          riskLevel: 'safe',
          status: 'SAFE_HOLD',
          openedAt: baseNow,
          lastActivityAt: baseNow,
        },
        {
          id: ids.blockedCase,
          caseNumber: `P7-BLOCK-${suffix}`,
          userId: ids.owner,
          category: 'KYC_ACCOUNT',
          severity: 'high',
          riskLevel: 'consequential',
          status: 'SYSTEM_BLOCKED',
          openedAt: baseNow,
          lastActivityAt: baseNow,
        },
      ],
    });
    await prisma.aiConversation.createMany({
      data: [
        {
          id: ids.ownerConversation,
          userId: ids.owner,
          activeCaseId: ids.resolvedCase,
          continuityKey: `p7-owner-${suffix}`,
          lastIntent: 'payment_issue',
          lastChannel: 'help',
        },
        {
          id: ids.otherConversation,
          userId: ids.other,
          continuityKey: `p7-other-${suffix}`,
          lastIntent: 'booking_status',
          lastChannel: 'help',
        },
      ],
    });
    await prisma.aiMessage.createMany({
      data: [
        {
          id: ids.ownerUserMessageOne,
          conversationId: ids.ownerConversation,
          role: 'user',
          channel: 'help',
          content: 'Controlled suggestion fixture',
        },
        {
          id: ids.ownerAnswerOne,
          conversationId: ids.ownerConversation,
          role: 'assistant',
          channel: 'help',
          content: 'Controlled answer one',
          safePayload: { isBlocked: false },
        },
        {
          id: ids.ownerUserMessageTwo,
          conversationId: ids.ownerConversation,
          role: 'user',
          channel: 'help',
          content: 'Controlled free-text fixture',
        },
        {
          id: ids.ownerAnswerTwo,
          conversationId: ids.ownerConversation,
          role: 'assistant',
          channel: 'help',
          content: 'Controlled answer two',
          safePayload: { isBlocked: false },
        },
        {
          id: ids.otherAnswer,
          conversationId: ids.otherConversation,
          role: 'assistant',
          channel: 'help',
          content: 'Other user answer',
          safePayload: { isBlocked: false },
        },
      ],
    });
    await prisma.aiResolution.create({
      data: {
        caseId: ids.resolvedCase,
        resolutionType: 'final',
        resolutionStatus: 'executed',
        userFacingExplanation: 'Verified deterministic resolution',
        verifiedAt: baseNow,
      },
    });
    await prisma.aiToolExecution.create({
      data: {
        caseId: ids.resolvedCase,
        sessionId: `p7-tool-session-${suffix}`,
        toolName: 'p7FailureProbe',
        requestFingerprint: `p7-failure-${suffix}`,
        riskClass: 'CASE_ACTION',
        authorizationStatus: 'authorized',
        executionStatus: 'failed',
        startedAt: baseNow,
        completedAt: baseNow,
      },
    });
    await prisma.aiProviderSession.create({
      data: {
        userId: ids.owner,
        sessionId: `p7-provider-session-${suffix}`,
        provider: 'digital_human_x',
        providerSessionRef: `p7-provider-ref-${suffix}`,
        status: 'failed',
        expiresAt: new Date(baseNow.getTime() + 60_000),
        createdAt: baseNow,
      },
    });
    await prisma.aiServiceSession.create({
      data: {
        userId: ids.owner,
        channel: 'digital_human',
        status: 'failed',
        startedAt: baseNow,
        lastActiveAt: baseNow,
      },
    });
    await prisma.aiFollowUp.create({
      data: {
        caseId: ids.safeCase,
        triggerAt: baseNow,
        triggerType: 'recheck',
        status: 'pending',
      },
    });
    await prisma.aiPolicyDecision.create({
      data: {
        caseId: ids.safeCase,
        policyType: 'P7_TEST',
        policyVersion: '1.0',
        inputHash: `p7-policy-${suffix}`,
        decision: 'hold',
        reasonCode: 'P7_CONTROLLED_HOLD',
        createdAt: baseNow,
      },
    });

    const telemetry = new SupportInteractionTelemetry(prisma);
    const question = suggestionRegistry.find(item => item.id === 'q-payment-failed')!;
    const topic = suggestionRegistry.find(item => item.id === 't-payment')!;
    await telemetry.recordSuggestionImpressions(ids.owner, 'payment', [question, topic]);
    await telemetry.recordInput({
      userId: ids.owner,
      conversationId: ids.ownerConversation,
      messageId: ids.ownerUserMessageOne,
      caseId: ids.resolvedCase,
      source: 'SUGGESTION',
      suggestionId: question.id,
      route: 'payment',
      intent: 'payment_issue',
      specialistId: 'PAYMENT_REFUND_DEPOSIT',
    });
    await telemetry.recordResponse({
      userId: ids.owner,
      conversationId: ids.ownerConversation,
      messageId: ids.ownerAnswerOne,
      caseId: ids.resolvedCase,
      source: 'SUGGESTION',
      suggestionId: question.id,
      route: 'payment',
      intent: 'payment_issue',
      specialistId: 'PAYMENT_REFUND_DEPOSIT',
      latencyMs: 120,
      outcome: 'SUCCESS',
      knowledgeMatched: false,
    });
    await telemetry.recordInput({
      userId: ids.owner,
      conversationId: ids.ownerConversation,
      messageId: ids.ownerUserMessageTwo,
      caseId: ids.resolvedCase,
      source: 'FREE_TEXT',
      route: 'payment',
      intent: 'payment_issue',
      specialistId: 'PAYMENT_REFUND_DEPOSIT',
    });
    await telemetry.recordResponse({
      userId: ids.owner,
      conversationId: ids.ownerConversation,
      messageId: ids.ownerAnswerTwo,
      caseId: ids.resolvedCase,
      source: 'FREE_TEXT',
      route: 'payment',
      intent: 'payment_issue',
      specialistId: 'PAYMENT_REFUND_DEPOSIT',
      latencyMs: 300,
      outcome: 'SUCCESS',
      knowledgeMatched: true,
      knowledgeSourceKey: 'p7-approved-source',
      knowledgeChunkKey: 'p7-approved-chunk',
    });
  });

  afterAll(async () => {
    const userIds = [ids.owner, ids.other, ids.admin, ids.ordinary];
    await prisma.aiInteractionFeedback.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.aiInteractionEvent.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.auditLog.deleteMany({
      where: { OR: [{ module: 'SupportFeedbackService' }, { actor_user_id: { in: userIds } }] },
    });
    await prisma.aiFollowUp.deleteMany({ where: { caseId: { in: [ids.resolvedCase, ids.safeCase, ids.blockedCase] } } });
    await prisma.aiResolution.deleteMany({ where: { caseId: ids.resolvedCase } });
    await prisma.aiPolicyDecision.deleteMany({ where: { caseId: ids.safeCase } });
    await prisma.aiToolExecution.deleteMany({ where: { requestFingerprint: { startsWith: 'p7-' } } });
    await prisma.aiProviderSession.deleteMany({ where: { userId: ids.owner } });
    await prisma.aiServiceSession.deleteMany({ where: { userId: ids.owner } });
    await prisma.aiConversation.deleteMany({ where: { id: { in: [ids.ownerConversation, ids.otherConversation] } } });
    await prisma.aiSupportCase.deleteMany({ where: { id: { in: [ids.resolvedCase, ids.safeCase, ids.blockedCase] } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    for (const key of featureKeys) {
      const prior = priorSettings.get(key);
      if (prior === undefined) {
        await prisma.systemSetting.deleteMany({ where: { setting_key: key } });
      } else {
        await prisma.systemSetting.update({ where: { setting_key: key }, data: { setting_value: prior } });
      }
    }
    await Promise.all([dbA.$disconnect(), dbB.$disconnect(), prisma.$disconnect()]);
  });

  test('A-FB-01/P7-FEEDBACK-PERSISTENCE: owned thumbs up and down persist with controlled reasons', async () => {
    const service = new SupportFeedbackService(dbA);
    const positive = await service.submit(ids.owner, {
      messageId: ids.ownerAnswerOne,
      rating: 'THUMBS_UP',
      reason: 'HELPFUL',
    });
    const negative = await service.submit(ids.owner, {
      messageId: ids.ownerAnswerTwo,
      rating: 'THUMBS_DOWN',
      reason: 'OTHER',
      comment: 'Needs a clearer status explanation.',
    });
    expect(positive).toMatchObject({ messageId: ids.ownerAnswerOne, rating: 'THUMBS_UP', reason: 'HELPFUL' });
    expect(negative).toMatchObject({
      messageId: ids.ownerAnswerTwo,
      rating: 'THUMBS_DOWN',
      reason: 'OTHER',
      comment: 'Needs a clearer status explanation.',
    });
  });

  test('P7-FEEDBACK-IDEMPOTENCY: duplicate vote updates one row and permits a rating change', async () => {
    const serviceA = new SupportFeedbackService(dbA);
    const serviceB = new SupportFeedbackService(dbB);
    const first = await serviceA.submit(ids.owner, {
      messageId: ids.ownerAnswerOne,
      rating: 'THUMBS_UP',
      reason: 'ACCURATE',
    });
    const changed = await serviceB.submit(ids.owner, {
      messageId: ids.ownerAnswerOne,
      rating: 'THUMBS_DOWN',
      reason: 'TOO_GENERIC',
    });
    expect(changed.id).toBe(first.id);
    expect(changed.rating).toBe('THUMBS_DOWN');
    expect(await prisma.aiInteractionFeedback.count({
      where: { userId: ids.owner, messageId: ids.ownerAnswerOne },
    })).toBe(1);
  });

  test('P7-FEEDBACK-OWNERSHIP: anonymous and cross-user mutations are denied', async () => {
    const service = new SupportFeedbackService(dbA);
    await expect(service.submit(undefined, {
      messageId: ids.ownerAnswerOne,
      rating: 'THUMBS_UP',
    })).rejects.toMatchObject<Partial<SupportFeedbackError>>({ code: 'UNAUTHENTICATED' });
    await expect(service.submit(ids.owner, {
      messageId: ids.otherAnswer,
      rating: 'THUMBS_UP',
    })).rejects.toMatchObject<Partial<SupportFeedbackError>>({ code: 'UNAUTHORIZED' });
  });

  test('P7-FEEDBACK-VALIDATION/P7-NO-HIDDEN-REASONING: invalid values are rejected and schema has no reasoning field', async () => {
    const service = new SupportFeedbackService(dbA);
    await expect(service.submit(ids.owner, {
      messageId: ids.ownerAnswerOne,
      rating: 'FIVE_STARS',
    })).rejects.toMatchObject<Partial<SupportFeedbackError>>({ code: 'INVALID_FEEDBACK' });
    await expect(service.submit(ids.owner, {
      messageId: ids.ownerAnswerOne,
      rating: 'THUMBS_UP',
      reason: 'INCORRECT',
    })).rejects.toMatchObject<Partial<SupportFeedbackError>>({ code: 'INVALID_FEEDBACK' });
    const schema = readFileSync(join(process.cwd(), 'prisma/schema.prisma'), 'utf8');
    const feedbackModel = schema.match(/model AiInteractionFeedback\s*\{[\s\S]*?\n\}/)?.[0] ?? '';
    expect(feedbackModel).not.toMatch(/prompt|reasoning|chainOfThought|hidden/i);
  });

  test('A-FB-02: suggestion, free-text, resolution, and failure metrics aggregate deterministically', async () => {
    const analytics = await new SupportAnalyticsService(dbA, () => new Date(baseNow.getTime() + 60_000))
      .getControlCenter(ids.admin, '24h');
    expect(analytics.discovery.suggestionImpressions.value).toBe(2);
    expect(analytics.discovery.suggestionClicks.value).toBe(1);
    expect(analytics.discovery.freeTextUsage.value).toBe(1);
    expect(analytics.discovery.suggestionResolvedCases.value).toBe(1);
    expect(analytics.executive.resolvedCases.value).toBe(1);
    expect(analytics.executive.autonomousResolutionRate.value).toBe(100);
    expect(analytics.operations.toolFailures.value).toBe(baselineToolFailures + 1);
    expect(analytics.operations.providerFailures.value).toBe(baselineProviderFailures + 1);
    expect(analytics.operations.safeHoldCount.value).toBe(1);
    expect(analytics.operations.systemBlockedCount.value).toBe(1);
    expect(analytics.discovery.medianResponseLatencyMs.value).toBe(210);
    expect(analytics.discovery.p95ResponseLatencyMs.value).toBe(300);
  });

  test('P7-ANALYTICS-RBAC/P7-TIME-RANGE-BOUNDS: ordinary users and unbounded ranges are rejected', async () => {
    const service = new SupportAnalyticsService(dbA);
    await expect(service.getControlCenter(ids.ordinary, '24h'))
      .rejects.toMatchObject<Partial<SupportAnalyticsError>>({ code: 'UNAUTHORIZED' });
    await expect(service.getControlCenter(ids.admin, '365d'))
      .rejects.toMatchObject<Partial<SupportAnalyticsError>>({ code: 'INVALID_RANGE' });
  });

  test('P7-AGGREGATE-NO-PII: control-center contract contains aggregates, sources, and explicit unavailable states only', async () => {
    const analytics = await new SupportAnalyticsService(dbB, () => new Date(baseNow.getTime() + 60_000))
      .getControlCenter(ids.admin, '7d');
    const serialized = JSON.stringify(analytics);
    expect(serialized).not.toContain(`${ids.owner}@example.test`);
    expect(serialized).not.toContain('P7 Owner');
    expect(serialized).not.toMatch(/phone|address|rawPrompt|content|paymentCredential|kycDocument/i);
    expect(analytics.discovery.rephrasingRate).toMatchObject({
      status: 'NOT_CURRENTLY_MEASURABLE',
      value: null,
    });
    expect(analytics.digitalHuman.fallbackRate).toMatchObject({ status: 'DEFERRED', value: null });
  });

  test('P7-FEATURE-FLAG: feedback and analytics rollback fail closed without disabling stored data', async () => {
    await prisma.systemSetting.update({
      where: { setting_key: 'ai_module_feedback_enabled' },
      data: { setting_value: 'false' },
    });
    await expect(new SupportFeedbackService(dbA).submit(ids.owner, {
      messageId: ids.ownerAnswerOne,
      rating: 'THUMBS_UP',
    })).rejects.toMatchObject<Partial<SupportFeedbackError>>({ code: 'FEATURE_DISABLED' });
    expect(await prisma.aiInteractionFeedback.count({ where: { userId: ids.owner } })).toBe(2);
    await prisma.systemSetting.update({
      where: { setting_key: 'ai_module_feedback_enabled' },
      data: { setting_value: 'true' },
    });

    await prisma.systemSetting.update({
      where: { setting_key: 'ai_module_analytics_enabled' },
      data: { setting_value: 'false' },
    });
    await expect(new SupportAnalyticsService(dbA).getControlCenter(ids.admin, '24h'))
      .rejects.toMatchObject<Partial<SupportAnalyticsError>>({ code: 'FEATURE_DISABLED' });
    await prisma.systemSetting.update({
      where: { setting_key: 'ai_module_analytics_enabled' },
      data: { setting_value: 'true' },
    });
  });

  test('feedback and analytics routes enforce session and database-authoritative admin access', async () => {
    mockedSession.mockResolvedValueOnce(null);
    const feedbackResponse = await submitFeedbackRoute(new Request('http://localhost/api/ai/feedback', {
      method: 'POST',
      body: JSON.stringify({ messageId: ids.ownerAnswerOne, rating: 'THUMBS_UP' }),
      headers: { 'Content-Type': 'application/json' },
    }));
    expect(feedbackResponse.status).toBe(401);

    mockedSession.mockResolvedValueOnce({ user: { id: ids.ordinary } } as never);
    const analyticsResponse = await getAnalyticsRoute(
      new Request('http://localhost/api/admin/ai-customer-service/analytics?range=24h'),
    );
    expect(analyticsResponse.status).toBe(403);
  });

  test('P7-CANONICAL-AI/P7-NO-MANUAL-SUPPORT-QUEUE: backend extends the single runtime only', () => {
    const schema = readFileSync(join(process.cwd(), 'prisma/schema.prisma'), 'utf8');
    expect(schema.match(/model AiConversation\s*\{/g)).toHaveLength(1);
    expect(schema.match(/model AiInteractionFeedback\s*\{/g)).toHaveLength(1);
    expect(schema).not.toMatch(/model AiManualSupportQueue|model HumanSupportQueue/);
    expect(readFileSync(join(process.cwd(), 'src/app/api/ai/chat/route.ts'), 'utf8')).toContain('export async function POST');
  });
});
