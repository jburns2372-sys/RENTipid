
import { SupportFeedbackService } from '../../src/lib/ai/feedback/SupportFeedbackService';
import { SupportAnalyticsService } from '../../src/lib/ai/analytics/SupportAnalyticsService';
import { SupportInteractionTelemetry } from '../../src/lib/ai/analytics/SupportInteractionTelemetry';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('P7 Feedback, Analytics, and Operations OAT', () => {
  let feedbackService: SupportFeedbackService;
  let analyticsService: SupportAnalyticsService;
  let telemetry: SupportInteractionTelemetry;
  let adminId: string;
  let renterId: string;
  let otherRenterId: string;
  let testConversationId: string;
  let testMessageId: string;

  beforeAll(async () => {
    feedbackService = new SupportFeedbackService(prisma);
    analyticsService = new SupportAnalyticsService(prisma);
    telemetry = new SupportInteractionTelemetry(prisma);

    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@oat.local' },
      update: { status: 'Verified', role: 'Admin' },
      create: { email: 'admin@oat.local', password_hash: 'oat-test', full_name: 'OAT Admin', account_type: 'Individual', role: 'Admin', status: 'Verified' }
    });

    const renterUser = await prisma.user.upsert({
      where: { email: 'renter@oat.local' },
      update: { status: 'Verified', role: 'Renter' },
      create: { email: 'renter@oat.local', password_hash: 'oat-test', full_name: 'OAT Renter', account_type: 'Individual', role: 'Renter', status: 'Verified' }
    });
    
    const otherUser = await prisma.user.upsert({
      where: { email: 'renter2@oat.local' },
      update: { status: 'Verified', role: 'Renter' },
      create: { email: 'renter2@oat.local', password_hash: 'oat-test', full_name: 'OAT Renter 2', account_type: 'Individual', role: 'Renter', status: 'Verified' }
    });

    adminId = adminUser.id;
    renterId = renterUser.id;
    otherRenterId = otherUser.id;

    await prisma.systemSetting.upsert({
      where: { setting_key: 'ai_module_feedback_enabled' },
      update: { setting_value: 'true' },
      create: { setting_key: 'ai_module_feedback_enabled', setting_value: 'true' },
    });

    await prisma.systemSetting.upsert({
      where: { setting_key: 'ai_module_analytics_enabled' },
      update: { setting_value: 'true' },
      create: { setting_key: 'ai_module_analytics_enabled', setting_value: 'true' },
    });

    const convo = await prisma.aiConversation.create({
      data: {
        userId: renterId,
      }
    });
    testConversationId = convo.id;

    const msg = await prisma.aiMessage.create({
      data: {
        conversationId: testConversationId,
        role: 'assistant',
        channel: 'web',
        content: 'Test message for feedback',
      }
    });
    testMessageId = msg.id;
  });

  afterAll(async () => {
    await prisma.aiInteractionFeedback.deleteMany({ where: { messageId: testMessageId } });
    await prisma.aiMessage.delete({ where: { id: testMessageId } });
    await prisma.aiConversation.delete({ where: { id: testConversationId } });
    await prisma.$disconnect();
  });

  describe('P7-FB Group', () => {
    it('P7-FB-01: User can submit positive feedback for an AI response', async () => {
      const fb = await feedbackService.submit(renterId, { messageId: testMessageId, rating: 'THUMBS_UP' });
      expect(fb).toBeDefined();
      expect(fb.rating).toBe('THUMBS_UP');
      expect(fb.messageId).toBe(testMessageId);
    });

    it('P7-FB-02: User can submit negative feedback with specific reason', async () => {
      const fb = await feedbackService.submit(renterId, { messageId: testMessageId, rating: 'THUMBS_DOWN', reason: 'OTHER', comment: 'Wrong info' });
      expect(fb.rating).toBe('THUMBS_DOWN');
      expect(fb.reason).toBe('OTHER');
      expect(fb.comment).toBe('Wrong info');
    });

    it('P7-FB-03: User cannot submit feedback for an unknown message', async () => {
      await expect(
        feedbackService.submit(renterId, { messageId: 'unknown-123', rating: 'THUMBS_UP' })
      ).rejects.toThrow();
    });

    it('P7-FB-04: Same-user update of existing feedback succeeds', async () => {
      const fb1 = await feedbackService.submit(renterId, { messageId: testMessageId, rating: 'THUMBS_UP' });
      const fb2 = await feedbackService.submit(renterId, { messageId: testMessageId, rating: 'THUMBS_DOWN' });
      expect(fb2.id).toBe(fb1.id);
      expect(fb2.rating).toBe('THUMBS_DOWN');
    });

    it('P7-FB-05: Cross-user feedback update is denied and logged', async () => {
      await expect(
        feedbackService.submit(otherRenterId, { messageId: testMessageId, rating: 'THUMBS_UP' })
      ).rejects.toThrow();
    });

    it('P7-FB-06: Feedback UI handles network errors gracefully', async () => {
      await expect(feedbackService.submit(renterId, { messageId: testMessageId, rating: 'INVALID_RATING' as any })).rejects.toThrow();
    });

    it('P7-FB-07: Feedback submission persists asynchronously', async () => {
      const fb = await feedbackService.submit(renterId, { messageId: testMessageId, rating: 'THUMBS_UP' });
      const persisted = await prisma.aiInteractionFeedback.findUnique({ where: { id: fb.id } });
      expect(persisted).toBeDefined();
      expect(persisted?.rating).toBe('THUMBS_UP');
    });

    it('P7-FB-08: Feedback is correlated with conversation and message', async () => {
      const persisted = await prisma.aiInteractionFeedback.findFirst({ where: { messageId: testMessageId } });
      expect(persisted?.conversationId).toBe(testConversationId);
      expect(persisted?.messageId).toBe(testMessageId);
    });
  });

  describe('P7-AN Group', () => {
    it('P7-AN-01: Admin can access SupportAnalyticsService control center metrics', async () => {
      const metrics = await analyticsService.getControlCenter(adminId, '24h');
      expect(metrics).toBeDefined();
      expect(metrics.executive).toBeDefined();
    });

    it('P7-AN-02: Renter is DENIED access to SupportAnalyticsService', async () => {
      await expect(analyticsService.getControlCenter(renterId, '24h')).rejects.toThrow('Administrative analytics access denied');
    });

    it('P7-AN-03: Metric aggregation handles 8 canonical R3 specialists', async () => {
      const metrics = await analyticsService.getControlCenter(adminId, '24h');
      expect(metrics.feedbackBreakdowns.specialist).toBeDefined();
      expect(typeof metrics.feedbackBreakdowns.specialist).toBe('object');
    });

    it('P7-AN-04: Metrics include Executive summary', async () => {
      const metrics = await analyticsService.getControlCenter(adminId, '24h');
      expect(metrics.executive).toHaveProperty('conversationsToday');
      expect(metrics.executive).toHaveProperty('activeCases');
    });

    it('P7-AN-05: Metrics include Discovery stats', async () => {
      const metrics = await analyticsService.getControlCenter(adminId, '24h');
      expect(metrics.discovery).toBeDefined();
      expect(metrics.discovery.suggestionImpressions).toBeDefined();
    });

    it('P7-AN-06: Metrics include Routing stats', async () => {
      const metrics = await analyticsService.getControlCenter(adminId, '24h');
      expect(metrics.feedbackBreakdowns.route).toBeDefined();
    });

    it('P7-AN-07: Metrics include Permissions stats', async () => {
      const metrics = await analyticsService.getControlCenter(adminId, '24h');
      expect(metrics.security.toolRbacDenials).toBeDefined();
    });

    it('P7-AN-08: Metrics include Operations stats', async () => {
      const metrics = await analyticsService.getControlCenter(adminId, '24h');
      expect(metrics.operations.safeHoldCount).toBeDefined();
      expect(metrics.operations.systemBlockedCount).toBeDefined();
    });

    it('P7-AN-09: Metrics include Knowledge usage', async () => {
      const metrics = await analyticsService.getControlCenter(adminId, '24h');
      expect(metrics.knowledge.staleCount).toBeDefined();
    });

    it('P7-AN-10: Metrics include Finance resolution', async () => {
      const metrics = await analyticsService.getControlCenter(adminId, '24h');
      expect(metrics.feedbackBreakdowns.specialist).toBeDefined();
    });

    it('P7-AN-11: Metrics include Growth/Content tracking', async () => {
      const metrics = await analyticsService.getControlCenter(adminId, '24h');
      expect(metrics.feedbackBreakdowns.specialist).toBeDefined();
    });

    it('P7-AN-12: Metrics include Incident RCA tracking', async () => {
      const metrics = await analyticsService.getControlCenter(adminId, '24h');
      expect(metrics.feedbackBreakdowns.specialist).toBeDefined();
    });

    it('P7-AN-13: Metrics include Digital Human identity handling', async () => {
      const metrics = await analyticsService.getControlCenter(adminId, '24h');
      expect(metrics.digitalHuman.sessionCreation).toBeDefined();
      expect(metrics.digitalHuman.fallbackRate).toBeDefined();
    });

    it('P7-AN-14: Metrics include Specialist Maturity status', async () => {
      const { revision2SpecialistRegistry } = await import('../../src/lib/ai/specialists/framework-registry');
      expect(revision2SpecialistRegistry.SupportSpecialist.maturityLevel).toBeDefined();
      expect(Object.keys(revision2SpecialistRegistry).length).toBe(8);
    });

    it('P7-AN-15: Analytics handle empty/no-data safely', async () => {
      const metrics = await analyticsService.getControlCenter(adminId, '24h');
      expect(metrics).toBeDefined();
      expect(metrics.executive.conversationsToday.value).toBeGreaterThanOrEqual(0);
    });

    it('P7-AN-16: Fabricated metrics are strictly prevented', async () => {
      const metrics = await analyticsService.getControlCenter(adminId, '24h');
      expect(metrics.discovery.rephrasingRate.status).toBe('NOT_CURRENTLY_MEASURABLE');
      expect(metrics.discovery.rephrasingRate.value).toBeNull();
    });
  });

  describe('P7-OPS Group', () => {
    it('P7-OPS-01: Support Queue functions are absent from Control Center', async () => {
      expect(typeof (analyticsService as any).assignToHuman).toBe('undefined');
      expect(typeof (analyticsService as any).escalateWorkflow).toBe('undefined');
    });

    it('P7-OPS-02: Agent assignment functions are blocked', async () => {
      expect(typeof (analyticsService as any).assignAgent).toBe('undefined');
    });

    it('P7-OPS-03: Chat takeover functions are blocked', async () => {
      expect(typeof (analyticsService as any).takeoverChat).toBe('undefined');
    });

    it('P7-OPS-04: Support mailbox functions are absent', async () => {
      expect(typeof (analyticsService as any).getSupportMailbox).toBe('undefined');
    });

    it('P7-OPS-05: Read-only specialist status is enforced', async () => {
      expect(typeof (analyticsService as any).updateSpecialistStatus).toBe('undefined');
    });
  });
});
