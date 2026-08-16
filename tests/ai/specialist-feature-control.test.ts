import { PrismaClient } from '@prisma/client';
import {
  SpecialistFeatureControlError,
  SpecialistFeatureControlService,
} from '@/lib/ai/specialists/feature-control';

function createHarness(role = 'Super Admin', status = 'verified', initial = true) {
  let stored: string | undefined = String(initial);
  const auditCreate = jest.fn().mockResolvedValue({ id: 'audit-001' });
  const user = {
    findUnique: jest.fn().mockResolvedValue({ id: 'actor-001', role, status }),
  };
  const systemSetting = {
    findMany: jest.fn(async () => stored === undefined ? [] : [{
      setting_key: 'ai_specialist_support_enabled', setting_value: stored,
    }]),
    findUnique: jest.fn(async () => stored === undefined ? null : { setting_value: stored }),
    upsert: jest.fn(async (args: { create: { setting_value: string }; update: { setting_value: string } }) => {
      stored = stored === undefined ? args.create.setting_value : args.update.setting_value;
      return { setting_value: stored };
    }),
  };
  const tx = { user, systemSetting, auditLog: { create: auditCreate } };
  const db = {
    ...tx,
    $transaction: jest.fn(async (run: (client: typeof tx) => Promise<unknown>) => run(tx)),
  } as unknown as PrismaClient;
  return {
    service: new SpecialistFeatureControlService(db, () => new Date('2026-08-17T00:00:00.000Z')),
    auditCreate,
    systemSetting,
    current: () => stored,
  };
}

describe('SpecialistFeatureControlService', () => {
  test('authorized Super Admin reads canonical specialist flags', async () => {
    const { service } = createHarness();
    const result = await service.list('actor-001');
    expect(result.specialists).toHaveLength(8);
    expect(result.specialists.find(item => item.specialistId === 'SupportSpecialist')).toMatchObject({
      enabled: true,
      fallback: 'UNIFIED_AI_BASELINE',
    });
  });

  test('authorized Super Admin toggles, rereads, and audits the canonical flag', async () => {
    const { service, auditCreate, current } = createHarness();
    const result = await service.update('actor-001', { specialistId: 'SupportSpecialist', enabled: false });
    expect(result.specialist.enabled).toBe(false);
    expect(current()).toBe('false');
    expect(auditCreate).toHaveBeenCalledWith({ data: expect.objectContaining({
      actor_user_id: 'actor-001',
      action: 'AI_SPECIALIST_FEATURE_FLAG_UPDATED',
      target_id: 'SupportSpecialist',
    }) });
    const details = JSON.parse(auditCreate.mock.calls[0][0].data.details);
    expect(details).toMatchObject({ oldEnabled: true, newEnabled: false, result: 'SUCCESS', environment: 'test' });
  });

  test.each(['Renter', 'Individual Provider'])('%s is denied for read and mutation', async role => {
    const { service } = createHarness(role);
    await expect(service.list('actor-001')).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    await expect(service.update('actor-001', { specialistId: 'SupportSpecialist', enabled: false }))
      .rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('unauthenticated actor is denied for read and mutation', async () => {
    const { service } = createHarness();
    await expect(service.list(undefined)).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
    await expect(service.update(undefined, { specialistId: 'SupportSpecialist', enabled: false }))
      .rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
  });

  test('unknown specialist ID is denied', async () => {
    const { service } = createHarness();
    await expect(service.update('actor-001', { specialistId: 'UnknownSpecialist', enabled: false }))
      .rejects.toEqual(expect.any(SpecialistFeatureControlError));
    await expect(service.update('actor-001', { specialistId: 'UnknownSpecialist', enabled: false }))
      .rejects.toMatchObject({ code: 'UNKNOWN_SPECIALIST' });
  });

  test('arbitrary configuration keys are denied', async () => {
    const { service } = createHarness();
    await expect(service.update('actor-001', {
      specialistId: 'SupportSpecialist', enabled: false, setting_key: 'PAYMENT_EMERGENCY_FREEZE',
    })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
  });
});
