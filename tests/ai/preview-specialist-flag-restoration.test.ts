import type { APIRequestContext } from '@playwright/test';
import { withTemporaryPreviewSpecialistFlag } from '../preview/specialist-feature-control';

function requestHarness(initial: boolean) {
  let enabled = initial;
  const response = (body: unknown) => ({
    ok: () => true,
    status: () => 200,
    json: async () => body,
  });
  const request = {
    get: jest.fn(async () => response({
      specialists: [{
        specialistId: 'SupportSpecialist', enabled, maturityLevel: 'L4', fallback: 'UNIFIED_AI_BASELINE',
      }],
    })),
    patch: jest.fn(async (_url: string, options: { data: { enabled: boolean } }) => {
      enabled = options.data.enabled;
      return response({ specialist: {
        specialistId: 'SupportSpecialist', enabled, maturityLevel: 'L4', fallback: 'UNIFIED_AI_BASELINE',
      } });
    }),
  } as unknown as APIRequestContext;
  return { request, current: () => enabled };
}

describe('Preview specialist flag restoration', () => {
  test('restores the original state after a passing body', async () => {
    const { request, current } = requestHarness(true);
    await withTemporaryPreviewSpecialistFlag(request, 'SupportSpecialist', false, async state => {
      expect(state.enabled).toBe(false);
    });
    expect(current()).toBe(true);
  });

  test('restores the original state after a failing body', async () => {
    const { request, current } = requestHarness(true);
    await expect(withTemporaryPreviewSpecialistFlag(request, 'SupportSpecialist', false, async () => {
      throw new Error('deliberate acceptance failure');
    })).rejects.toThrow('deliberate acceptance failure');
    expect(current()).toBe(true);
  });
});
