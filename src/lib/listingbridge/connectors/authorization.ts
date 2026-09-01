import type { ListingBridgeAuthorizationType } from '../types/canonical-contract';
import type { ListingBridgeConnectorDescriptor } from './descriptor';

export const listingBridgeServerSideAuthorizationTypes = [
  'API_KEY_SERVER_SIDE',
  'OAUTH_SERVER_SIDE',
  'API_KEY',
  'OAUTH',
] as const satisfies readonly ListingBridgeAuthorizationType[];

export type ListingBridgeAuthorizationStatus =
  | 'NOT_REQUIRED'
  | 'AUTHORIZED'
  | 'REQUIRES_PROVIDER_RIGHTS_CONFIRMATION'
  | 'MISSING_SERVER_SIDE_CREDENTIAL_REFERENCE'
  | 'DENIED';

export interface ListingBridgeConnectorAuthorizationRequest {
  readonly providerId: string;
  readonly connectorId: string;
  readonly authorizationType: ListingBridgeAuthorizationType;
  readonly providerRightsConfirmed?: boolean;
  readonly credentialReference?: string;
}

export interface ListingBridgeConnectorAuthorizationDecision {
  readonly connectorId: string;
  readonly authorizationType: ListingBridgeAuthorizationType;
  readonly status: ListingBridgeAuthorizationStatus;
  readonly authorized: boolean;
  readonly serverSideOnly: boolean;
  readonly requiresProviderRightsConfirmation: boolean;
  readonly ownershipPolicy: 'RENTIPID_PROVIDER_RBAC_REQUIRED';
  readonly publicSafe: true;
}

export function isServerSideSecretAuthorizationType(type: ListingBridgeAuthorizationType): boolean {
  return (listingBridgeServerSideAuthorizationTypes as readonly string[]).includes(type);
}

export function evaluateListingBridgeConnectorAuthorization(
  descriptor: ListingBridgeConnectorDescriptor,
  request: ListingBridgeConnectorAuthorizationRequest,
): ListingBridgeConnectorAuthorizationDecision {
  const baseDecision = {
    connectorId: descriptor.id,
    authorizationType: descriptor.authorization.type,
    serverSideOnly: descriptor.authorization.serverSideOnly,
    requiresProviderRightsConfirmation: descriptor.authorization.requiresProviderRightsConfirmation,
    ownershipPolicy: 'RENTIPID_PROVIDER_RBAC_REQUIRED' as const,
    publicSafe: true as const,
  };

  if (!request.providerId.trim() || request.connectorId !== descriptor.id || request.authorizationType !== descriptor.authorization.type) {
    return { ...baseDecision, status: 'DENIED', authorized: false };
  }

  if (descriptor.authorization.requiresProviderRightsConfirmation && !request.providerRightsConfirmed) {
    return { ...baseDecision, status: 'REQUIRES_PROVIDER_RIGHTS_CONFIRMATION', authorized: false };
  }

  if (descriptor.authorization.credentialReferenceRequired && !request.credentialReference?.trim()) {
    return { ...baseDecision, status: 'MISSING_SERVER_SIDE_CREDENTIAL_REFERENCE', authorized: false };
  }

  if (descriptor.authorization.type === 'NONE') {
    return { ...baseDecision, status: 'NOT_REQUIRED', authorized: true };
  }

  return { ...baseDecision, status: 'AUTHORIZED', authorized: true };
}
