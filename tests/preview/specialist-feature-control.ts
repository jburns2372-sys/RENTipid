import type { APIRequestContext } from '@playwright/test';

export interface PreviewSpecialistFlagState {
  specialistId: string;
  enabled: boolean;
  maturityLevel: string;
  fallback: string;
}

async function responseBody(response: Awaited<ReturnType<APIRequestContext['get']>>) {
  const body = await response.json() as { error?: string; specialists?: PreviewSpecialistFlagState[]; specialist?: PreviewSpecialistFlagState };
  if (!response.ok()) throw new Error(body.error || `Specialist feature control returned ${response.status()}`);
  return body;
}

export async function readPreviewSpecialistFlag(request: APIRequestContext, specialistId: string) {
  const body = await responseBody(await request.get('/api/admin/ai-customer-service/analytics?control=specialists'));
  const specialist = body.specialists?.find(item => item.specialistId === specialistId);
  if (!specialist) throw new Error(`Specialist feature state not found: ${specialistId}`);
  return specialist;
}

export async function setPreviewSpecialistFlag(
  request: APIRequestContext,
  specialistId: string,
  enabled: boolean,
) {
  const body = await responseBody(await request.patch('/api/admin/ai-customer-service/analytics', {
    data: { specialistId, enabled },
  }));
  if (!body.specialist || body.specialist.specialistId !== specialistId || body.specialist.enabled !== enabled) {
    throw new Error(`Specialist feature update was not verified: ${specialistId}`);
  }
  return body.specialist;
}

export async function withTemporaryPreviewSpecialistFlag<T>(
  request: APIRequestContext,
  specialistId: string,
  enabled: boolean,
  run: (state: PreviewSpecialistFlagState) => Promise<T>,
): Promise<T> {
  const original = await readPreviewSpecialistFlag(request, specialistId);
  try {
    const applied = await setPreviewSpecialistFlag(request, specialistId, enabled);
    return await run(applied);
  } finally {
    await setPreviewSpecialistFlag(request, specialistId, original.enabled);
    const restored = await readPreviewSpecialistFlag(request, specialistId);
    if (restored.enabled !== original.enabled) throw new Error(`Specialist feature restoration failed: ${specialistId}`);
  }
}
