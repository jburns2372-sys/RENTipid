import { AiSpecialist, aiSpecialistRegistry } from './registry';
import { intentOwnershipRegistry, IntentOwnershipDefinition } from './ownership-registry';

export interface RoutedIntentOwnership {
  ownership: IntentOwnershipDefinition;
  supportSubdomain: AiSpecialist;
}

export function routeIntentOwnership(resolvedIntent: string | undefined): RoutedIntentOwnership {
  const ownership = intentOwnershipRegistry.resolveWithGeneralFallback(resolvedIntent);
  const supportSubdomain = ownership.supportSubdomainId
    ? aiSpecialistRegistry[ownership.supportSubdomainId]
    : aiSpecialistRegistry.GENERAL_SUPPORT;
  return Object.freeze({ ownership, supportSubdomain });
}

/**
 * Preserves the accepted P4 compatibility result while ownership is resolved
 * by the Revision 2 exactly-one-owner registry.
 */
export function routeToSpecialist(resolvedIntent: string | undefined): AiSpecialist {
  return routeIntentOwnership(resolvedIntent).supportSubdomain;
}