import { loadAuthorizedAiDomainState, resolveAiEntityHint } from './authorization/domain-state';

export async function buildSafeContext(
  role: string | undefined,
  module: string,
  recordId?: string,
  userId?: string,
): Promise<string> {
  const contextParts = [`Module: ${module}`, `Current persisted role: ${role ?? 'Guest'}`];

  if (!userId) {
    contextParts.push('Context: Public explanatory guidance only. No personalized state is authorized.');
    return contextParts.join('\n');
  }

  const entityHint = resolveAiEntityHint(module, recordId, userId);
  if (!entityHint) {
    contextParts.push('Context: No authorized live entity was resolved for this request.');
    return contextParts.join('\n');
  }

  // The client-supplied module/record ID selects a lookup only. The database
  // ownership check and the freshly read row are the authority.
  contextParts.push(await loadAuthorizedAiDomainState(userId, entityHint.entityType, entityHint.entityId));
  return contextParts.join('\n');
}
