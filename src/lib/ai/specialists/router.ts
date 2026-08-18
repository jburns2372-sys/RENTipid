import { aiSpecialistRegistry, AiSpecialist } from './registry';

/**
 * Deterministically routes an intent to the correct specialist.
 */
export function routeToSpecialist(resolvedIntent: string | undefined): AiSpecialist {
  if (!resolvedIntent) {
    return aiSpecialistRegistry['GENERAL_SUPPORT'];
  }

  for (const key of Object.keys(aiSpecialistRegistry)) {
    const specialist = aiSpecialistRegistry[key];
    if (specialist.status === 'enabled' && specialist.allowedIntents.includes(resolvedIntent)) {
      return specialist;
    }
  }

  // Fallback if intent is recognized but no specialist handles it, or if it's unknown
  return aiSpecialistRegistry['GENERAL_SUPPORT'];
}
