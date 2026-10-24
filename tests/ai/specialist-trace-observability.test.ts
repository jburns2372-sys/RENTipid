import { PrismaClient } from '@prisma/client';
import { SupportAnalyticsService } from '@/lib/ai/analytics/SupportAnalyticsService';
import { BoundedSpecialistTraceRecord } from '@/lib/ai/specialists/trace';

const trace: BoundedSpecialistTraceRecord = {
  contractVersion: 'uaics-specialist-trace.v1',
  traceId: 'trace-request-001',
  environment: 'test',
  commitIdentity: 'release-sha-001',
  sessionId: 'conversation-001',
  conversationId: 'conversation-001',
  caseId: 'case-001',
  intent: 'booking_cancel',
  answerClass: 'INFORMATION',
  selectedSpecialist: 'SupportSpecialist',
  specialistVersion: '2.0',
  consultedSpecialists: [],
  fallbackStatus: 'PRIMARY',
  requestedTools: [],
  executedTools: [],
  policyOutcome: 'ALLOW',
  supervisorStatus: 'PASS',
  resultStatus: 'COMPLETED',
  safeHoldReasonCode: null,
  finalResponseOwner: 'UNIFIED_AI_COMMAND_LAYER',
  finalResponseRef: 'trace-request-001',
};

function database(role: string, storedTrace: Record<string, unknown> = trace as unknown as Record<string, unknown>) {
  return {
    user: {
      findUnique: jest.fn().mockResolvedValue({ role, status: 'Verified' }),
    },
    systemSetting: {
      findUnique: jest.fn().mockResolvedValue({ setting_value: 'true' }),
    },
    aiMessage: {
      findUnique: jest.fn().mockResolvedValue({
        id: trace.traceId,
        role: 'assistant',
        conversationId: trace.conversationId,
        safePayload: {
          specialistTrace: storedTrace,
          hiddenReasoning: 'must never leave persistence',
          password: 'must never leave persistence',
        },
      }),
    },
  } as unknown as PrismaClient;
}

describe('Admin specialist trace observability', () => {
  test('authorized Admin reads the correct request-correlated selected specialist', async () => {
    const service = new SupportAnalyticsService(database('Admin'));
    const result = await service.getTraceDetail('admin-001', trace.traceId);

    expect(result.trace).toMatchObject({
      traceId: trace.traceId,
      intent: 'booking_cancel',
      selectedSpecialist: 'SupportSpecialist',
      finalResponseRef: trace.traceId,
    });
  });

  test.each(['Renter', 'Individual Provider'])('%s is denied trace access', async role => {
    const service = new SupportAnalyticsService(database(role));
    await expect(service.getTraceDetail(`${role}-001`, trace.traceId)).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });

  test('unauthenticated access is denied before trace lookup', async () => {
    const db = database('Admin') as any;
    const service = new SupportAnalyticsService(db);
    await expect(service.getTraceDetail(undefined, trace.traceId)).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    expect(db.aiMessage.findUnique).not.toHaveBeenCalled();
  });

  test('mismatched correlation is not returned', async () => {
    const service = new SupportAnalyticsService(database('Admin', {
      ...trace,
      finalResponseRef: 'different-message',
    }));
    await expect(service.getTraceDetail('admin-001', trace.traceId)).rejects.toMatchObject({
      code: 'TRACE_NOT_FOUND',
    });
  });

  test('admin DTO allowlist excludes hidden reasoning and secrets', async () => {
    const result = await new SupportAnalyticsService(database('Admin')).getTraceDetail('admin-001', trace.traceId);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('hiddenReasoning');
    expect(serialized).not.toContain('must never leave persistence');
    expect(serialized).not.toContain('password');
    expect(serialized).not.toContain('prompt');
  });
});
