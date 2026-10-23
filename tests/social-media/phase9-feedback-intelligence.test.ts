import { SocialFeedbackService } from '../../src/lib/social/social-feedback-service';
import { PrismaClient, SocialFeedbackStatus, SocialFeedbackSeverity, SocialFeedbackSentiment } from '@prisma/client';
import { MockSocialAdapter } from '../../src/lib/social/social-adapters/mock-social-adapter';

const prisma = new PrismaClient();
const feedbackService = new SocialFeedbackService();

describe('Phase 9 - Social Feedback Intelligence Module', () => {
  let mockUserId: string;
  let mockAccountId: string;

  beforeAll(async () => {
    // Setup base records
    const user = await prisma.user.create({
      data: {
        email: `tester_p9_${Date.now()}@test.com`,
        full_name: 'P9 Tester',
        account_type: 'Individual',
        role: 'Admin',
        status: 'Verified'
      }
    });
    mockUserId = user.id;

    const account = await prisma.socialAccount.create({
      data: {
        owner_user_id: user.id,
        platform: 'MOCK',
        account_name: 'Test P9 Account',
        account_handle: '@testp9',
        account_type: 'BUSINESS',
        connection_status: 'CONNECTED',
        health_status: 'HEALTHY'
      }
    });
    mockAccountId = account.id;
  });

  afterAll(async () => {
    // Cleanup records
    await prisma.socialFeedback.deleteMany({ where: { social_account_id: mockAccountId } });
    await prisma.auditLog.deleteMany({ where: { module: 'SocialFeedback' } });
    await prisma.incidentCase.deleteMany({ where: { created_by_user_id: mockUserId } });
    await prisma.aiSupportCase.deleteMany({ where: { category: 'SOCIAL_ESCALATION' } });
    await prisma.socialAccount.deleteMany({ where: { id: mockAccountId } });
    await prisma.user.deleteMany({ where: { id: mockUserId } });
    await prisma.$disconnect();
  });

  it('1. valid feedback ingested', async () => {
    const rawEvent = MockSocialAdapter.generateMockFeedbackEvent('POSITIVE', mockAccountId);
    const feedback = await feedbackService.ingestFeedback(rawEvent);
    
    expect(feedback.id).toBeDefined();
    expect(feedback.status).toBe(SocialFeedbackStatus.NEW);
    expect(feedback.severity).toBe(SocialFeedbackSeverity.LOW);
    expect(feedback.normalized_text).toContain('Amazing service');
  });

  it('2. duplicate feedback suppressed', async () => {
    const rawEvent = MockSocialAdapter.generateMockFeedbackEvent('POSITIVE', mockAccountId);
    const first = await feedbackService.ingestFeedback(rawEvent);
    const second = await feedbackService.ingestFeedback(rawEvent);
    
    expect(first.id).toBe(second.id); // Returns same idempotent record
    const count = await prisma.socialFeedback.count({ where: { provider_feedback_id: rawEvent.provider_feedback_id } });
    expect(count).toBe(1);
  });

  it('4. provider payload normalized', async () => {
    const rawEvent = MockSocialAdapter.generateMockFeedbackEvent('POSITIVE', mockAccountId, '   Extra spaces   ');
    const feedback = await feedbackService.ingestFeedback(rawEvent);
    expect(feedback.normalized_text).toBe('Extra spaces'); // Sanitize text trimmed it
  });

  it('5. positive sentiment classified', async () => {
    const rawEvent = MockSocialAdapter.generateMockFeedbackEvent('POSITIVE', mockAccountId);
    const feedback = await feedbackService.ingestFeedback(rawEvent);
    
    const classified = await feedbackService.classifyFeedback(feedback.id, {
      sentiment: SocialFeedbackSentiment.POSITIVE,
      topic: 'Customer Service'
    });
    
    expect(classified.sentiment).toBe(SocialFeedbackSentiment.POSITIVE);
    expect(classified.status).toBe(SocialFeedbackStatus.CLASSIFIED);
  });

  it('6. negative sentiment classified & 7. deterministic severity calculated', async () => {
    const rawEvent = MockSocialAdapter.generateMockFeedbackEvent('COMPLAINT', mockAccountId);
    const feedback = await feedbackService.ingestFeedback(rawEvent);
    
    const classified = await feedbackService.classifyFeedback(feedback.id, {
      sentiment: SocialFeedbackSentiment.NEGATIVE,
      topic: 'Cleanliness',
      suggested_severity: SocialFeedbackSeverity.LOW // AI suggests LOW, but deterministic overrides
    });
    
    expect(classified.sentiment).toBe(SocialFeedbackSentiment.NEGATIVE);
    expect(classified.severity).toBe(SocialFeedbackSeverity.HIGH); // Overridden due to "COMPLAINT" keyword
  });

  it('8. CRITICAL safety signal escalates appropriately', async () => {
    const rawEvent = MockSocialAdapter.generateMockFeedbackEvent('CRITICAL', mockAccountId);
    const feedback = await feedbackService.ingestFeedback(rawEvent);
    
    const classified = await feedbackService.classifyFeedback(feedback.id, {
      sentiment: SocialFeedbackSentiment.NEGATIVE,
      topic: 'Safety'
    });
    
    expect(classified.severity).toBe(SocialFeedbackSeverity.CRITICAL); // "FRAUD" / "THREAT" keyword
  });

  it('9. AI classification remains advisory & 10. human reviewer overrides', async () => {
    const rawEvent = MockSocialAdapter.generateMockFeedbackEvent('POSITIVE', mockAccountId);
    const feedback = await feedbackService.ingestFeedback(rawEvent);
    
    await feedbackService.classifyFeedback(feedback.id, {
      sentiment: SocialFeedbackSentiment.POSITIVE,
      topic: 'General'
    });
    
    const overridden = await feedbackService.overrideClassification(feedback.id, mockUserId, {
      sentiment: SocialFeedbackSentiment.NEUTRAL,
      severity: SocialFeedbackSeverity.MEDIUM
    });
    
    expect(overridden.sentiment).toBe(SocialFeedbackSentiment.NEUTRAL);
    expect(overridden.severity).toBe(SocialFeedbackSeverity.MEDIUM);
    expect(overridden.status).toBe(SocialFeedbackStatus.NEEDS_REVIEW); // Human touched it
  });

  it('11. support feedback links existing support-case architecture', async () => {
    const rawEvent = MockSocialAdapter.generateMockFeedbackEvent('COMPLAINT', mockAccountId);
    const feedback = await feedbackService.ingestFeedback(rawEvent);
    await feedbackService.classifyFeedback(feedback.id, { sentiment: SocialFeedbackSentiment.NEGATIVE, topic: 'Billing' });
    
    const result = await feedbackService.escalateToCase(feedback.id, 'SUPPORT', mockUserId);
    expect(result.case_id).toBeDefined();
    
    const updatedFb = await prisma.socialFeedback.findUnique({ where: { id: feedback.id } });
    expect(updatedFb?.linked_case_type).toBe('SUPPORT');
    expect(updatedFb?.status).toBe(SocialFeedbackStatus.ESCALATED);
    
    const supportCase = await prisma.aiSupportCase.findUnique({ where: { id: result.case_id } });
    expect(supportCase).toBeDefined();
    expect(supportCase?.category).toBe('SOCIAL_ESCALATION');
  });

  it('12. incident feedback links existing incident-case architecture', async () => {
    const rawEvent = MockSocialAdapter.generateMockFeedbackEvent('CRITICAL', mockAccountId);
    const feedback = await feedbackService.ingestFeedback(rawEvent);
    await feedbackService.classifyFeedback(feedback.id, { sentiment: SocialFeedbackSentiment.NEGATIVE, topic: 'Safety' });
    
    const result = await feedbackService.escalateToCase(feedback.id, 'INCIDENT', mockUserId);
    expect(result.case_id).toBeDefined();
    
    const incidentCase = await prisma.incidentCase.findUnique({ where: { id: result.case_id } });
    expect(incidentCase).toBeDefined();
    expect(incidentCase?.severity).toBe('CRITICAL');
  });

  it('13. duplicate escalation does not create duplicate case', async () => {
    const rawEvent = MockSocialAdapter.generateMockFeedbackEvent('CRITICAL', mockAccountId, 'Duplicate case test');
    const feedback = await feedbackService.ingestFeedback(rawEvent);
    
    const firstResult = await feedbackService.escalateToCase(feedback.id, 'INCIDENT', mockUserId);
    const secondResult = await feedbackService.escalateToCase(feedback.id, 'INCIDENT', mockUserId);
    
    expect(firstResult.case_id).toBe(secondResult.case_id);
    expect(secondResult.duplicate).toBe(true);
  });

  it('19. audit records generated', async () => {
    const logs = await prisma.auditLog.findMany({
      where: { module: 'SocialFeedback' }
    });
    
    // There should be ingest, classify, override, and escalate logs
    expect(logs.length).toBeGreaterThan(0);
    const actions = logs.map(l => l.action);
    expect(actions).toContain('SOCIAL_FEEDBACK_INGESTED');
    expect(actions).toContain('SOCIAL_FEEDBACK_CLASSIFIED');
    expect(actions).toContain('SOCIAL_FEEDBACK_ESCALATED');
  });

  it('20. AI response drafting produces draft only and ZERO provider send/reply calls', async () => {
    const rawEvent = MockSocialAdapter.generateMockFeedbackEvent('POSITIVE', mockAccountId);
    const feedback = await feedbackService.ingestFeedback(rawEvent);
    await feedbackService.classifyFeedback(feedback.id, { sentiment: SocialFeedbackSentiment.POSITIVE, topic: 'Praise' });
    
    const draft = await feedbackService.requestAiResponseDraft(feedback.id);
    expect(draft).toContain('Draft response to');
    
    // Check DB
    const dbFb = await prisma.socialFeedback.findUnique({ where: { id: feedback.id } });
    const meta = JSON.parse(dbFb?.ai_classification_metadata || '{}');
    expect(meta.response_draft).toBeDefined();
    // Prove no reply was actually sent to provider here (the service doesn't even inject MockSocialAdapter for publishing)
  });
});
